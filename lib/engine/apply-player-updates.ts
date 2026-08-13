/**
 * Apply a match's per-player consequences: goals, assists, cards, bans,
 * injuries, ratings, morale and fitness.
 *
 * Shared by the league path (lib/engine/apply-match.ts) and the cup path
 * (lib/jobs/cup.ts). The cup used to write only goals/assists/card COUNTS,
 * which meant cup yellows pushed a player's season tally up without ever
 * triggering the five-card ban, nobody was ever injured or rated in a cup
 * tie, and suspensions were not served by sitting one out. The card ledger
 * then disagreed with itself: a player could pass a multiple of five in a
 * cup match and the league path would never notice the boundary had been
 * crossed.
 */
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { players } from "@/lib/schema";
import type { PlayerUpdate } from "./match";

type Executor = Pick<typeof db, "select" | "update">;

/** Count a match as served for anyone currently banned at these clubs. */
export async function decrementSuspensions(
  clubIds: string[],
  exec: Executor = db,
): Promise<void> {
  const suspended = await exec
    .select()
    .from(players)
    .where(
      and(inArray(players.clubId, clubIds), eq(players.status, "suspended")),
    );
  for (const sp of suspended) {
    const left = Math.max(0, sp.suspensionMatchesLeft - 1);
    await exec
      .update(players)
      .set({
        suspensionMatchesLeft: left,
        status: left === 0 ? "active" : "suspended",
      })
      .where(eq(players.id, sp.id));
  }
}

export async function applyPlayerUpdates(
  updates: PlayerUpdate[],
  now: Date,
  exec: Executor = db,
): Promise<void> {
  const playerIds = updates.map((u) => u.playerId);
  if (playerIds.length === 0) return;

  const rows = await exec
    .select()
    .from(players)
    .where(inArray(players.id, playerIds));

  for (const row of rows) {
    const u = updates.find((x) => x.playerId === row.id);
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
    // Every 5 yellows = a 1-match ban, triggered when the running total
    // crosses a multiple of five during this match.
    const crossesFiveBoundary =
      Math.floor(newYellowTotal / 5) > Math.floor(row.yellowCardsSeason / 5);

    const patch: Partial<typeof players.$inferInsert> = {
      goalsSeason: row.goalsSeason + u.goals,
      assistsSeason: row.assistsSeason + u.assists,
      yellowCardsSeason: newYellowTotal,
      redCardsSeason: row.redCardsSeason + u.red,
      careerGoals: row.careerGoals + u.goals,
      careerAssists: row.careerAssists + u.assists,
      careerApps: row.careerApps + 1,
      lastRatings: JSON.stringify(ratings),
      morale: Math.max(
        1,
        Math.min(
          5,
          row.morale +
            (u.rating >= 8 ? 1 : u.rating >= 7 ? 0 : u.rating < 6 ? -1 : 0),
        ),
      ),
      fitness: Math.max(60, row.fitness - 10),
    };

    // A red card and an injury are not mutually exclusive: a player sent off
    // who also limps away still owes the two-match ban. The ban is therefore
    // always recorded, and `status` reflects the injury when both happened.
    let banToAdd = 0;
    if (isRed) banToAdd = 2;
    else if (crossesFiveBoundary) banToAdd = 1;
    if (banToAdd > 0) {
      patch.suspensionMatchesLeft = row.suspensionMatchesLeft + banToAdd;
    }
    if (isInjured) {
      patch.status = "injured";
      patch.injuryUntil = new Date(
        now.getTime() + (u.injuredMinutes ?? 0) * 60 * 1000,
      );
    } else if (banToAdd > 0) {
      patch.status = "suspended";
    }

    await exec.update(players).set(patch).where(eq(players.id, row.id));
  }
}
