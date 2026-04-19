/**
 * Board management — assigns each club a season goal based on prestige and
 * adjusts confidence at season end. When confidence hits 0 the human owner
 * is "fired" (club returns to bot status) and they're routed back to the
 * lobby on next page load.
 */
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { clubs, feedEvents } from "@/lib/schema";

export type BoardGoal = "champion" | "top4" | "midtable" | "survive";

export function goalFromPrestige(prestige: number): BoardGoal {
  if (prestige >= 80) return "champion";
  if (prestige >= 65) return "top4";
  if (prestige >= 45) return "midtable";
  return "survive";
}

export function goalLabel(goal: BoardGoal): string {
  switch (goal) {
    case "champion":
      return "Şampiyonluk";
    case "top4":
      return "İlk 4";
    case "midtable":
      return "İlk 10";
    case "survive":
      return "Küme düşmemek";
  }
}

/**
 * Assign each club a goal at the start of a fresh season. Called from
 * rollSeasonIfDone after stats reset.
 */
export async function assignSeasonGoals(leagueId: string): Promise<void> {
  const cs = await db.select().from(clubs).where(eq(clubs.leagueId, leagueId));
  for (const c of cs) {
    const goal = goalFromPrestige(c.prestige);
    await db
      .update(clubs)
      .set({ boardSeasonGoal: goal })
      .where(eq(clubs.id, c.id));
  }
}

/**
 * Evaluate end-of-season performance against board goal and update
 * confidence. Returns the list of owners who got fired.
 */
export async function evaluateBoardConfidence(
  leagueId: string,
  finalStandings: Array<{ id: string; rank: number }>,
): Promise<{ fired: string[] }> {
  const fired: string[] = [];
  const cs = await db.select().from(clubs).where(eq(clubs.leagueId, leagueId));
  for (const c of cs) {
    const standing = finalStandings.find((s) => s.id === c.id);
    if (!standing) continue;
    const rank = standing.rank;
    const goal = c.boardSeasonGoal as BoardGoal;
    let delta = 0;
    if (goal === "champion") {
      delta = rank === 1 ? +25 : rank <= 3 ? -10 : rank <= 8 ? -30 : -50;
    } else if (goal === "top4") {
      delta = rank <= 4 ? +20 : rank <= 7 ? -10 : rank <= 12 ? -25 : -40;
    } else if (goal === "midtable") {
      delta = rank <= 10 ? +15 : rank <= 13 ? -10 : -25;
    } else {
      // "survive" — bottom 3 (rank 14-16) is failure
      delta = rank <= 13 ? +20 : -30;
    }
    const newConfidence = Math.max(0, Math.min(100, c.boardConfidence + delta));
    if (newConfidence === 0 && c.ownerUserId) {
      fired.push(c.ownerUserId);
      await db
        .update(clubs)
        .set({
          boardConfidence: 0,
          ownerUserId: null,
          isBot: true,
        })
        .where(eq(clubs.id, c.id));
      await db.insert(feedEvents).values({
        leagueId,
        clubId: c.id,
        eventType: "morale",
        text: `${c.name} yönetimi menajeri kovdu — sezon hedefinden çok uzakta.`,
      });
    } else {
      await db
        .update(clubs)
        .set({ boardConfidence: newConfidence })
        .where(eq(clubs.id, c.id));
    }
  }
  return { fired };
}
