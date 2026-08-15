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
import {
  applyPlayerUpdates,
  decrementSuspensions,
} from "./apply-player-updates";
import { matchIncomeCents } from "@/lib/economy";
import { creditClub } from "@/lib/money";
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
    //
    //    Gate receipts scale with prestige, so both clubs' current standing is
    //    needed before any money moves. One query, inside the transaction.
    const sides = [result.homeUpdate, result.awayUpdate];
    const prestigeRows = await tx
      .select({ id: clubs.id, prestige: clubs.prestige })
      .from(clubs)
      .where(inArray(clubs.id, sides.map((s) => s.clubId)));
    const prestigeById = new Map(prestigeRows.map((r) => [r.id, r.prestige]));

    for (const side of sides) {
      const isHome = side.clubId === result.homeUpdate.clubId;
      const income = matchIncomeCents(
        side.result,
        isHome,
        prestigeById.get(side.clubId) ?? 50,
      );
      await tx
        .update(clubs)
        .set({
          seasonPoints: sqlAdd(clubs.seasonPoints, side.points),
          seasonWins: sqlAdd(clubs.seasonWins, side.result === "W" ? 1 : 0),
          seasonDraws: sqlAdd(clubs.seasonDraws, side.result === "D" ? 1 : 0),
          seasonLosses: sqlAdd(clubs.seasonLosses, side.result === "L" ? 1 : 0),
          seasonGoalsFor: sqlAdd(clubs.seasonGoalsFor, side.goalsFor),
          seasonGoalsAgainst: sqlAdd(clubs.seasonGoalsAgainst, side.goalsAgainst),
        })
        .where(eq(clubs.id, side.clubId));
      // Gate receipts go through lib/money.ts rather than riding along in the
      // statement above, so they land in the ledger like every other move.
      // Same transaction, so the money and the result still commit together.
      await creditClub(side.clubId, income, tx, {
        kind: "match_income",
        note: side.result === "W" ? "Galibiyet hasılatı" : "Maç hasılatı",
      });
      await creditSponsorForMatch(side.clubId, side.result === "W", tx);
    }

    // 3. Sitting this fixture out is what serves a ban.
    await decrementSuspensions(
      [result.homeUpdate.clubId, result.awayUpdate.clubId],
      tx,
    );

    // 4. Goals, assists, cards, bans, injuries, ratings, morale, fitness.
    await applyPlayerUpdates(result.playerUpdates, now, tx);

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
