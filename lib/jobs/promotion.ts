/**
 * Promotion and relegation between the two divisions.
 *
 * Runs at the season roll, after the final standings are known and before the
 * new fixture list is drawn. The bottom three of the Süper Lig swap with the
 * top three of the 1. Lig.
 *
 * This is what finally gives the board goal "Küme düşmemek" meaning. The
 * board has always been able to hand a low-prestige club that objective, and
 * `goalLabel` has always rendered it as "avoid relegation" — but with a
 * single flat division there was nowhere to go down to, so the target was
 * unfailable and the bottom of the table had nothing at stake.
 */
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { clubs, feedEvents, type Club } from "@/lib/schema";
import { sortStandings, type StandingsFixture } from "@/lib/standings";

/** How many clubs swap tiers each season. */
export const PROMOTION_SLOTS = 3;

export type PromotionResult = {
  promoted: Array<{ id: string; name: string }>;
  relegated: Array<{ id: string; name: string }>;
};

/**
 * Move clubs between divisions.
 *
 * `fixtures` is the season's finished matches, used only for the head-to-head
 * tiebreak — the same ordering the standings page shows, so a club is never
 * relegated by a rule the table did not display.
 */
export async function applyPromotionRelegation(
  leagueId: string,
  allClubs: Club[],
  fixtures: StandingsFixture[],
): Promise<PromotionResult> {
  const top = allClubs.filter((c) => c.division === 1);
  const second = allClubs.filter((c) => c.division === 2);
  const result: PromotionResult = { promoted: [], relegated: [] };

  // A single-division world (or a half-built one) has nothing to swap.
  if (top.length < PROMOTION_SLOTS + 1 || second.length < PROMOTION_SLOTS) {
    return result;
  }

  const topTable = sortStandings(top, fixtures);
  const secondTable = sortStandings(second, fixtures);

  const goingDown = topTable.slice(-PROMOTION_SLOTS);
  const goingUp = secondTable.slice(0, PROMOTION_SLOTS);

  for (const club of goingDown) {
    await db
      .update(clubs)
      .set({
        division: 2,
        // Dropping a tier costs standing and shrinks the budget the board
        // will sign off on next season.
        prestige: Math.max(10, club.prestige - 8),
      })
      .where(and(eq(clubs.id, club.id), eq(clubs.division, 1)));
    result.relegated.push({ id: club.id, name: club.name });
  }

  for (const club of goingUp) {
    await db
      .update(clubs)
      .set({
        division: 1,
        prestige: Math.min(100, club.prestige + 8),
      })
      .where(and(eq(clubs.id, club.id), eq(clubs.division, 2)));
    result.promoted.push({ id: club.id, name: club.name });
  }

  if (result.relegated.length > 0) {
    await db.insert(feedEvents).values({
      leagueId,
      clubId: null,
      eventType: "paper",
      text: `Küme düşenler: ${result.relegated.map((c) => c.name).join(", ")}. 1. Lig'e veda.`,
    });
  }
  if (result.promoted.length > 0) {
    await db.insert(feedEvents).values({
      leagueId,
      clubId: null,
      eventType: "paper",
      text: `Süper Lig'e yükselenler: ${result.promoted.map((c) => c.name).join(", ")}. Tebrikler!`,
    });
  }

  return result;
}
