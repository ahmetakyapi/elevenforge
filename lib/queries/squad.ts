import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { players } from "@/lib/schema";
import type { LeagueContext } from "@/lib/session";
import type { Player } from "@/types";

/**
 * Load user's squad and adapt to the mock-shape `Player` type used by
 * squad-ui.tsx (so the existing UI works without refactoring every prop).
 */
export async function loadSquad(ctx: LeagueContext): Promise<Player[]> {
  const rows = await db
    .select()
    .from(players)
    .where(eq(players.clubId, ctx.club.id));

  return rows.map((p) => {
    let form: number[] = [];
    try {
      const parsed = JSON.parse(p.lastRatings);
      if (Array.isArray(parsed)) form = parsed;
    } catch {}
    let secondaryRoles: string[] = [];
    try {
      const parsed = JSON.parse(p.secondaryRoles);
      if (Array.isArray(parsed)) secondaryRoles = parsed;
    } catch {}
    return {
      id: p.id,
      n: p.name,
      pos: p.position,
      role: p.role,
      secondaryRoles,
      num: p.jerseyNumber ?? undefined,
      age: p.age,
      ovr: p.overall,
      pot: p.potential,
      nat: p.nationality,
      fit: p.fitness,
      mor: p.morale,
      wage: Math.round(Number(p.wageCents) / 100),
      val: Math.round(Number(p.marketValueCents) / 100),
      form,
      ctr: p.contractYears,
      status:
        p.status === "active" ? undefined : p.status,
    };
  });
}
