/**
 * Apply match simulation result to the database.
 * - Claims the fixture (scheduled → finished) so a result is applied once.
 * - Updates club W/D/L/points/goals + gate receipts.
 * - Updates per-player goals/assists/cards/lastRatings.
 * - Injures unlucky players (sets status + injuryUntil).
 * - Inserts feed event for the league.
 *
 * Idempotency is the whole point of the claim. QStash retries a webhook that
 * times out, and two Vercel instances can pick up the same cron tick, so
 * `runMatchDay` genuinely does get invoked twice on the same scheduled
 * fixture. Without the conditional UPDATE below, both runs incremented
 * points, goals, gate receipts and player stats — the league table simply
 * became wrong. Everything runs in one transaction so a mid-way failure
 * releases the claim and the retry can apply the result cleanly.
 */
import { and, eq, inArray, sql, type SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { db } from "@/lib/db";
import {
  clubs,
  feedEvents,
  fixtures,
  players,
} from "@/lib/schema";
import { creditSponsorForMatch } from "@/lib/jobs/sponsor-credit";
import { matchIncomeCents } from "@/lib/economy";
import type { MatchResult } from "./match";

/**
 * `column + n` as SQL, so the increment happens inside the database rather
 * than from a value we read a moment ago.
 */
function sqlAdd(column: PgColumn, n: number): SQL<number> {
  return sql<number>`${column} + ${n}`;
}

/**
 * Returns true when this call is the one that applied the result, false when
 * the fixture had already been played by a concurrent or earlier run.
 */
export async function applyMatchResult(
  fixtureId: string,
  leagueId: string,
  result: MatchResult,
): Promise<boolean> {
  const now = new Date();

  return db.transaction(async (tx) => {
    // 1. Claim the fixture. Losing this race means someone else already
    //    applied this exact result — bail out without touching anything.
    const claimed = await tx
      .update(fixtures)
      .set({
        status: "finished",
        homeScore: result.homeScore,
        awayScore: result.awayScore,
        commentaryJson: JSON.stringify(result.events),
        statsJson: JSON.stringify(result.stats),
        playedAt: now,
      })
      .where(and(eq(fixtures.id, fixtureId), eq(fixtures.status, "scheduled")))
      .returning();
    if (claimed.length === 0) return false;

    // 2. Update clubs. Points and money are applied as SQL-level deltas so a
    //    concurrent transfer or sponsor payment can't be clobbered.
    for (const side of [result.homeUpdate, result.awayUpdate]) {
      const isHome = side.clubId === result.homeUpdate.clubId;
      const income = matchIncomeCents(side.result, isHome);
      await tx
        .update(clubs)
        .set({
          seasonPoints: sqlAdd(clubs.seasonPoints, side.points),
          seasonWins: sqlAdd(clubs.seasonWins, side.result === "W" ? 1 : 0),
          seasonDraws: sqlAdd(clubs.seasonDraws, side.result === "D" ? 1 : 0),
          seasonLosses: sqlAdd(clubs.seasonLosses, side.result === "L" ? 1 : 0),
          seasonGoalsFor: sqlAdd(clubs.seasonGoalsFor, side.goalsFor),
          seasonGoalsAgainst: sqlAdd(clubs.seasonGoalsAgainst, side.goalsAgainst),
          balanceCents: sqlAdd(clubs.balanceCents, income),
        })
        .where(eq(clubs.id, side.clubId));
      await creditSponsorForMatch(side.clubId, side.result === "W", tx);
    }

    // 3. Decrement suspensions for the two squads. Sitting out this fixture
    //    is what serves the ban.
    const suspendedRows = await tx
      .select()
      .from(players)
      .where(
        and(
          inArray(players.clubId, [
            result.homeUpdate.clubId,
            result.awayUpdate.clubId,
          ]),
          eq(players.status, "suspended"),
        ),
      );
    for (const sp of suspendedRows) {
      const left = Math.max(0, sp.suspensionMatchesLeft - 1);
      await tx
        .update(players)
        .set({
          suspensionMatchesLeft: left,
          status: left === 0 ? "active" : "suspended",
        })
        .where(eq(players.id, sp.id));
    }

    // 4. Update players who took part.
    const playerIds = result.playerUpdates.map((u) => u.playerId);
    if (playerIds.length > 0) {
      const rows = await tx
        .select()
        .from(players)
        .where(inArray(players.id, playerIds));
      for (const row of rows) {
        const u = result.playerUpdates.find((x) => x.playerId === row.id);
        if (!u) continue;
        let ratings: number[] = [];
        try {
          const parsed = JSON.parse(row.lastRatings);
          if (Array.isArray(parsed)) ratings = parsed;
        } catch {
          /* ignore */
        }
        ratings = [...ratings, u.rating].slice(-5);

        const newYellowTotal = row.yellowCardsSeason + u.yellow;
        const isInjured = (u.injuredMinutes ?? 0) > 0;
        const isRed = u.red > 0;
        // Real soccer rule: every 5 yellows = 1-match ban. Trigger when the
        // count crosses a multiple of 5 within this match.
        const crossesFiveBoundary =
          Math.floor(newYellowTotal / 5) > Math.floor(row.yellowCardsSeason / 5);

        const updates: Partial<typeof players.$inferInsert> = {
          goalsSeason: row.goalsSeason + u.goals,
          assistsSeason: row.assistsSeason + u.assists,
          yellowCardsSeason: newYellowTotal,
          redCardsSeason: row.redCardsSeason + u.red,
          lastRatings: JSON.stringify(ratings),
          morale: Math.max(
            1,
            Math.min(
              5,
              row.morale +
                (u.rating >= 8 ? 1 : u.rating >= 7 ? 0 : u.rating < 6 ? -1 : 0),
            ),
          ),
          fitness: Math.max(60, row.fitness - 10), // starters lose condition
        };

        // A red card and an injury are not mutually exclusive: a player sent
        // off who also limps away still owes the two-match ban. Bans are
        // therefore always recorded, and the *status* reflects the injury
        // (the longer-lasting condition) when both happened.
        let banToAdd = 0;
        if (isRed) banToAdd = 2;
        else if (crossesFiveBoundary) banToAdd = 1;
        if (banToAdd > 0) {
          updates.suspensionMatchesLeft = row.suspensionMatchesLeft + banToAdd;
        }
        if (isInjured) {
          updates.status = "injured";
          updates.injuryUntil = new Date(
            now.getTime() + (u.injuredMinutes ?? 0) * 60 * 1000,
          );
        } else if (banToAdd > 0) {
          updates.status = "suspended";
        }
        await tx.update(players).set(updates).where(eq(players.id, row.id));
      }
    }

    // 5. Feed event — include scorer names so the league feed reads like a
    //    proper match report (not just a scoreline).
    const clubRows = await tx
      .select({ name: clubs.name, id: clubs.id })
      .from(clubs)
      .where(
        inArray(clubs.id, [
          result.homeUpdate.clubId,
          result.awayUpdate.clubId,
        ]),
      );
    const home = clubRows.find((c) => c.id === result.homeUpdate.clubId);
    const away = clubRows.find((c) => c.id === result.awayUpdate.clubId);
    if (home && away) {
      const scorerIds = result.events
        .filter((e) => e.type === "goal" && e.scorerId)
        .map((e) => e.scorerId as string);
      let scorerSuffix = "";
      if (scorerIds.length > 0) {
        const scorerRows = await tx
          .select({ id: players.id, name: players.name })
          .from(players)
          .where(inArray(players.id, scorerIds));
        const byId = new Map(scorerRows.map((r) => [r.id, r.name]));
        const goals = result.events
          .filter((e) => e.type === "goal" && e.scorerId)
          .map((e) => `${byId.get(e.scorerId!) ?? "?"} ${e.minute}'`);
        if (goals.length > 0) scorerSuffix = ` — ${goals.join(", ")}`;
      }
      await tx.insert(feedEvents).values({
        leagueId,
        clubId: home.id,
        eventType: "match",
        text: `${home.name} ${result.homeScore} - ${result.awayScore} ${away.name}${scorerSuffix}`,
      });
    }

    return true;
  });
}
