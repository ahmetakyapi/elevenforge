/**
 * Apply match simulation result to the database.
 * - Updates fixture with scores + commentary + stats.
 * - Updates club W/D/L/points/goals.
 * - Updates per-player goals/assists/cards/lastRatings.
 * - Injures unlucky players (sets status + injuryUntil).
 * - Inserts feed event for the league.
 */
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  clubs,
  feedEvents,
  fixtures,
  players,
} from "@/lib/schema";
import { creditSponsorForMatch } from "@/app/(app)/dashboard/sponsor-actions";
import type { MatchResult } from "./match";

export async function applyMatchResult(
  fixtureId: string,
  leagueId: string,
  result: MatchResult,
): Promise<void> {
  const now = new Date();

  // 1. Update fixture row
  await db
    .update(fixtures)
    .set({
      status: "finished",
      homeScore: result.homeScore,
      awayScore: result.awayScore,
      commentaryJson: JSON.stringify(result.events),
      statsJson: JSON.stringify(result.stats),
      playedAt: now,
    })
    .where(eq(fixtures.id, fixtureId));

  // 2. Update clubs (sponsor crediting handled inside the loop)
  for (const side of [result.homeUpdate, result.awayUpdate]) {
    await creditSponsorForMatch(side.clubId, side.result === "W").catch(() => {});
    const rows = await db
      .select()
      .from(clubs)
      .where(eq(clubs.id, side.clubId))
      .limit(1);
    const club = rows[0];
    if (!club) continue;
    await db
      .update(clubs)
      .set({
        seasonPoints: club.seasonPoints + side.points,
        seasonWins: club.seasonWins + (side.result === "W" ? 1 : 0),
        seasonDraws: club.seasonDraws + (side.result === "D" ? 1 : 0),
        seasonLosses: club.seasonLosses + (side.result === "L" ? 1 : 0),
        seasonGoalsFor: club.seasonGoalsFor + side.goalsFor,
        seasonGoalsAgainst: club.seasonGoalsAgainst + side.goalsAgainst,
        balanceCents:
          club.balanceCents +
          // match income: 800K for home win, 500K home draw, 300K home loss;
          // 400K away win, 250K draw, 150K loss
          (side.result === "W"
            ? club.id === result.homeUpdate.clubId
              ? 80_000_000
              : 40_000_000
            : side.result === "D"
              ? club.id === result.homeUpdate.clubId
                ? 50_000_000
                : 25_000_000
              : club.id === result.homeUpdate.clubId
                ? 30_000_000
                : 15_000_000),
      })
      .where(eq(clubs.id, side.clubId));
  }

  // 3. Decrement suspensions for every suspended player of the two clubs.
  // Missing a match counts as serving the ban — when it hits 0, re-activate.
  const suspendedRows = await db
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
    await db
      .update(players)
      .set({
        suspensionMatchesLeft: left,
        status: left === 0 ? "active" : "suspended",
      })
      .where(eq(players.id, sp.id));
  }

  // 4. Update players — load, patch in-memory, write back
  const playerIds = result.playerUpdates.map((u) => u.playerId);
  if (playerIds.length > 0) {
    const rows = await db
      .select()
      .from(players)
      .where(inArray(players.id, playerIds));
    for (const row of rows) {
      const u = result.playerUpdates.find((x) => x.playerId === row.id);
      if (!u) continue;
      // Update lastRatings ring-buffer (keep last 5)
      let ratings: number[] = [];
      try {
        const parsed = JSON.parse(row.lastRatings);
        if (Array.isArray(parsed)) ratings = parsed;
      } catch {
        /* ignore */
      }
      ratings = [...ratings, u.rating].slice(-5);

      const isInjured = (u.injuredMinutes ?? 0) > 0;
      const isRed = u.red > 0;
      const updates: Partial<typeof players.$inferInsert> = {
        goalsSeason: row.goalsSeason + u.goals,
        assistsSeason: row.assistsSeason + u.assists,
        yellowCardsSeason: row.yellowCardsSeason + u.yellow,
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
      if (isInjured) {
        updates.status = "injured";
        updates.injuryUntil = new Date(
          now.getTime() + (u.injuredMinutes ?? 0) * 60 * 1000,
        );
      } else if (isRed) {
        updates.status = "suspended";
        updates.suspensionMatchesLeft = row.suspensionMatchesLeft + 2;
      }
      await db.update(players).set(updates).where(eq(players.id, row.id));
    }

    // Decrement suspension for players not in this match (only squads that were involved — we don't know, skip for now)
  }

  // 4. Feed event
  const homeClubRow = await db
    .select({ name: clubs.name, id: clubs.id })
    .from(clubs)
    .where(eq(clubs.id, result.homeUpdate.clubId))
    .limit(1);
  const awayClubRow = await db
    .select({ name: clubs.name, id: clubs.id })
    .from(clubs)
    .where(eq(clubs.id, result.awayUpdate.clubId))
    .limit(1);
  const home = homeClubRow[0];
  const away = awayClubRow[0];
  if (home && away) {
    await db.insert(feedEvents).values({
      leagueId,
      clubId: home.id,
      eventType: "match",
      text: `${home.name} ${result.homeScore} - ${result.awayScore} ${away.name}`,
    });
  }
}
