"use server";

import { and, eq, gte, sql } from "drizzle-orm";
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

/**
 * Buy one facility level in a single conditional statement.
 *
 * The level guard is what makes a double-click safe: the second request
 * still sees the old level in its session snapshot, but by then the row no
 * longer matches `level = expected`, so it updates nothing and the club is
 * charged once. The balance guard does the same job for affordability.
 */
async function purchaseLevel(
  clubId: string,
  column: typeof clubs.stadiumLevel | typeof clubs.trainingLevel,
  currentLevel: number,
  cost: number,
): Promise<boolean> {
  const rows = await db
    .update(clubs)
    .set({
      [column.name === "stadium_level" ? "stadiumLevel" : "trainingLevel"]:
        currentLevel + 1,
      balanceCents: sql`${clubs.balanceCents} - ${cost}`,
    })
    .where(
      and(
        eq(clubs.id, clubId),
        eq(column, currentLevel),
        gte(clubs.balanceCents, cost),
      ),
    )
    .returning();
  return rows.length > 0;
}

export async function upgradeStadium() {
  const ctx = await requireLeagueContext();
  if (ctx.club.stadiumLevel >= 5) {
    return { ok: false as const, error: "Stadyum zaten maksimumda (L5)." };
  }
  const cost = upgradeCostCents(ctx.club.stadiumLevel);
  const newLevel = ctx.club.stadiumLevel + 1;
  const done = await purchaseLevel(
    ctx.club.id,
    clubs.stadiumLevel,
    ctx.club.stadiumLevel,
    cost,
  );
  if (!done) {
    return {
      ok: false as const,
      error: `Bütçe yetersiz (€${(cost / 100 / 1_000_000).toFixed(1)}M gerek).`,
    };
  }
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
  const newLevel = ctx.club.trainingLevel + 1;
  const done = await purchaseLevel(
    ctx.club.id,
    clubs.trainingLevel,
    ctx.club.trainingLevel,
    cost,
  );
  if (!done) {
    return {
      ok: false as const,
      error: `Bütçe yetersiz (€${(cost / 100 / 1_000_000).toFixed(1)}M gerek).`,
    };
  }
  revalidatePath("/dashboard");
  return { ok: true as const, newLevel };
}
