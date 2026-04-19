"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { clubs, feedEvents } from "@/lib/schema";
import { requireLeagueContext } from "@/lib/session";

/**
 * Cost to upgrade `from`-level facility to `from + 1`. Caps at L5.
 * The cost curve doubles each tier so late-game upgrades are a real
 * budget commitment.
 */
function upgradeCostCents(currentLevel: number): number {
  if (currentLevel >= 5) return 0;
  const base = 500_000_000; // €5M for L1 → L2
  return base * Math.pow(2, currentLevel - 1);
}

export async function upgradeStadium() {
  const ctx = await requireLeagueContext();
  if (ctx.club.stadiumLevel >= 5) {
    return { ok: false as const, error: "Stadyum zaten maksimumda (L5)." };
  }
  const cost = upgradeCostCents(ctx.club.stadiumLevel);
  if (ctx.club.balanceCents < cost) {
    return {
      ok: false as const,
      error: `Bütçe yetersiz (€${(cost / 100 / 1_000_000).toFixed(1)}M gerek).`,
    };
  }
  const newLevel = ctx.club.stadiumLevel + 1;
  await db
    .update(clubs)
    .set({
      stadiumLevel: newLevel,
      balanceCents: sql`${clubs.balanceCents} - ${cost}`,
    })
    .where(eq(clubs.id, ctx.club.id));
  await db.insert(feedEvents).values({
    leagueId: ctx.league.id,
    clubId: ctx.club.id,
    eventType: "morale",
    text: `${ctx.club.name} stadyumu L${newLevel}'e yükseltti — ev avantajı arttı.`,
  });
  revalidatePath("/dashboard");
  return { ok: true as const, newLevel };
}

export async function upgradeTraining() {
  const ctx = await requireLeagueContext();
  if (ctx.club.trainingLevel >= 5) {
    return { ok: false as const, error: "Tesis zaten maksimumda." };
  }
  const cost = upgradeCostCents(ctx.club.trainingLevel);
  if (ctx.club.balanceCents < cost) {
    return {
      ok: false as const,
      error: `Bütçe yetersiz (€${(cost / 100 / 1_000_000).toFixed(1)}M gerek).`,
    };
  }
  const newLevel = ctx.club.trainingLevel + 1;
  await db
    .update(clubs)
    .set({
      trainingLevel: newLevel,
      balanceCents: sql`${clubs.balanceCents} - ${cost}`,
    })
    .where(eq(clubs.id, ctx.club.id));
  revalidatePath("/dashboard");
  return { ok: true as const, newLevel };
}

// (helper kept inside this file; callers don't need a server action for it)
