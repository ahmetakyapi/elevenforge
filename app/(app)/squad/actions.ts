"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { clubs, feedEvents, friendlies, players } from "@/lib/schema";
import { requireLeagueContext } from "@/lib/session";

/**
 * Toggle a player into / out of training mode.
 *
 * Constraint: at most one trainee per position group (GK/DEF/MID/FWD), so
 * the cap is **4 trainees total per club**. If the user already has a
 * trainee in this player's position group, that previous trainee is
 * automatically returned to active status before the new one takes the slot
 * — clear UX vs. silently rejecting.
 */
export async function toggleTraining(playerId: string) {
  const ctx = await requireLeagueContext();
  const row = (
    await db
      .select()
      .from(players)
      .where(
        and(eq(players.id, playerId), eq(players.clubId, ctx.club.id)),
      )
      .limit(1)
  )[0];
  if (!row) return { ok: false as const, error: "Oyuncu sende değil." };
  if (row.status === "injured" || row.status === "suspended") {
    return { ok: false as const, error: "Sakat/cezalı oyuncu antrene edilemez." };
  }
  if (row.status === "listed") {
    return {
      ok: false as const,
      error: "Transfer listesindeki oyuncu antrene edilemez.",
    };
  }

  if (row.status === "training") {
    // Removing from training → just flip back to active.
    await db
      .update(players)
      .set({ status: "active" })
      .where(eq(players.id, row.id));
  } else {
    // Adding to training → first kick out any existing trainee in the same
    // position group (1-slot-per-group rule). Total trainees max = 4.
    const existingInGroup = await db
      .select()
      .from(players)
      .where(
        and(
          eq(players.clubId, ctx.club.id),
          eq(players.status, "training"),
          eq(players.position, row.position),
        ),
      );
    for (const old of existingInGroup) {
      await db
        .update(players)
        .set({ status: "active" })
        .where(eq(players.id, old.id));
    }
    await db
      .update(players)
      .set({ status: "training" })
      .where(eq(players.id, row.id));
  }

  revalidatePath("/squad");
  revalidatePath("/dashboard");
  const finalStatus = row.status === "training" ? "active" : "training";
  return { ok: true as const, status: finalStatus };
}

/**
 * Play a friendly match. Gives the targeted player a fitness + small overall
 * progression tick, but only 3 friendlies per club per 24 hours.
 */
export async function playFriendly(playerId: string) {
  const ctx = await requireLeagueContext();
  const row = (
    await db
      .select()
      .from(players)
      .where(
        and(eq(players.id, playerId), eq(players.clubId, ctx.club.id)),
      )
      .limit(1)
  )[0];
  if (!row) return { ok: false as const, error: "Oyuncu sende değil." };
  if (row.status === "injured" || row.status === "suspended") {
    return { ok: false as const, error: "Uygun olmayan oyuncu." };
  }

  // Rate limit: max 3 friendlies per club per rolling 24h window.
  const dayAgo = new Date(Date.now() - 24 * 3600 * 1000);
  const recent = await db
    .select()
    .from(friendlies)
    .where(eq(friendlies.clubId, ctx.club.id));
  const within = recent.filter(
    (f) => new Date(f.playedAt).getTime() >= dayAgo.getTime(),
  );
  if (within.length >= 3) {
    return {
      ok: false as const,
      error: "24 saatlik limit doldu (3 dostluk maçı).",
    };
  }

  // Apply boosts. Fitness +15 (capped 100), morale +1 (capped 5),
  // 30% chance of overall +1 if young + not at potential yet.
  const newFit = Math.min(100, row.fitness + 15);
  const newMor = Math.min(5, row.morale + 1);
  const ageBonus = row.age <= 22 ? 0.5 : row.age <= 26 ? 0.25 : 0.1;
  const ovrBump =
    row.overall < row.potential && Math.random() < ageBonus ? 1 : 0;
  await db
    .update(players)
    .set({
      fitness: newFit,
      morale: newMor,
      overall: row.overall + ovrBump,
    })
    .where(eq(players.id, row.id));

  await db.insert(friendlies).values({
    leagueId: ctx.league.id,
    clubId: ctx.club.id,
    boostApplied: true,
  });

  // Small cost — €150K
  await db
    .update(clubs)
    .set({ balanceCents: Math.max(0, ctx.club.balanceCents - 15_000_000) })
    .where(eq(clubs.id, ctx.club.id));

  await db.insert(feedEvents).values({
    leagueId: ctx.league.id,
    clubId: ctx.club.id,
    eventType: "morale",
    text: `${ctx.club.name} dostluk maçı oynadı — ${row.name}${ovrBump ? " bir basamak yükseldi" : " formda kaldı"}`,
  });

  revalidatePath("/squad");
  revalidatePath("/dashboard");
  return {
    ok: true as const,
    fitness: newFit,
    morale: newMor,
    ovrBump,
    remaining: 3 - within.length - 1,
  };
}
