"use server";

import { and, eq, gte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { debitClub } from "@/lib/money";
import { feedEvents, friendlies, players } from "@/lib/schema";
import { requireLeagueContext } from "@/lib/session";
import { uuidSchema, validate } from "@/lib/validation";

/** €150K per friendly. */
const FRIENDLY_COST_CENTS = 15_000_000;
const FRIENDLY_DAILY_CAP = 3;

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
  const parsedId = validate(uuidSchema, playerId);
  if (!parsedId.ok) return parsedId;
  const row = (
    await db
      .select()
      .from(players)
      .where(
        and(eq(players.id, parsedId.data), eq(players.clubId, ctx.club.id)),
      )
      .limit(1)
  )[0];
  if (!row) return { ok: false as const, error: "Oyuncu sende değil." };
  if (row.status === "injured" || row.status === "suspended") {
    return { ok: false as const, error: "Uygun olmayan oyuncu." };
  }

  // Rate limit: max 3 friendlies per club per rolling 24h window. Counted in
  // SQL rather than by loading the club's entire friendly history.
  const dayAgo = new Date(Date.now() - 24 * 3600 * 1000);
  const within = await db
    .select({ id: friendlies.id })
    .from(friendlies)
    .where(
      and(
        eq(friendlies.clubId, ctx.club.id),
        gte(friendlies.playedAt, dayAgo),
      ),
    );
  if (within.length >= FRIENDLY_DAILY_CAP) {
    return {
      ok: false as const,
      error: `24 saatlik limit doldu (${FRIENDLY_DAILY_CAP} dostluk maçı).`,
    };
  }

  // Charge first. The previous absolute write (`Math.max(0, snapshot - cost)`)
  // erased any credit that landed since the page loaded — a player could
  // receive transfer income and have it wiped by a friendly.
  const paid = await debitClub(ctx.club.id, FRIENDLY_COST_CENTS);
  if (!paid) return { ok: false as const, error: "Bütçe yetersiz." };

  // Record the friendly immediately so the 24h cap counts this one even if
  // the boosts below are interrupted.
  await db.insert(friendlies).values({
    leagueId: ctx.league.id,
    clubId: ctx.club.id,
    boostApplied: true,
  });

  // Apply boosts. Fitness +15 (capped 100), morale +1 (capped 5),
  // small chance of overall +1 if young + not at potential yet.
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
      // Never exceed potential — the cap is what stops a manager from
      // grinding friendlies into an unbounded overall.
      overall: Math.min(row.potential, row.overall + ovrBump),
    })
    .where(eq(players.id, row.id));

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
