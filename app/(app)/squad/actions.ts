"use server";

import { and, eq, gte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { marketValueCents } from "@/lib/economy";
import { debitClub } from "@/lib/money";
import {
  friendlyGrowthChance,
  FRIENDLY_COST_CENTS,
  FRIENDLY_DAILY_CAP,
} from "@/lib/progression";
import { autoLineup } from "@/lib/lineup";
import { clubs, feedEvents, friendlies, players } from "@/lib/schema";
import { parseStaffJson } from "@/lib/staff";
import { requireLeagueContext } from "@/lib/session";
import { uuidSchema, validate } from "@/lib/validation";
import { TRAINABLE } from "@/lib/attributes";

/**
 * The shapes the tactic board offers. Kept in step with ALLOWED_FORMATIONS in
 * app/(app)/tactic/actions.ts — a formation this accepts but that board does
 * not would leave the club in a state its own tactic screen cannot display.
 */
const ALLOWED_FORMATIONS = [
  "4-3-3",
  "4-4-2",
  "4-2-3-1",
  "3-5-2",
  "5-3-2",
  "4-1-4-1",
] as const satisfies readonly string[];


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
  const paid = await debitClub(ctx.club.id, FRIENDLY_COST_CENTS, undefined, {
    kind: "other",
    note: "Dostluk maçı",
  });
  if (!paid) return { ok: false as const, error: "Bütçe yetersiz." };

  // Record the friendly immediately so the 24h cap counts this one even if
  // the boosts below are interrupted.
  await db.insert(friendlies).values({
    leagueId: ctx.league.id,
    clubId: ctx.club.id,
    boostApplied: true,
  });

  // Apply boosts. Fitness +15 (capped 100), morale +1 (capped 5), and a roll
  // on the same progression curve the training ground uses — worth about two
  // days of training, so a friendly is a top-up rather than a parallel and
  // better route to development.
  //
  // What keeps it honest is the DAILY CAP, not a ceiling on the rating. The
  // old code refused any gain at `potential`, which meant the boost silently
  // did nothing for a mature squad and the €150K bought fitness alone.
  const newFit = Math.min(100, row.fitness + 15);
  const newMor = Math.min(5, row.morale + 1);
  const [clubRow] = await db
    .select({ trainingLevel: clubs.trainingLevel, staffJson: clubs.staffJson })
    .from(clubs)
    .where(eq(clubs.id, ctx.club.id));
  const ctxProgress = {
    trainingLevel: clubRow?.trainingLevel ?? 1,
    coachTier: parseStaffJson(clubRow?.staffJson ?? null).headCoach?.tier ?? 0,
  };
  const ovrBump =
    Math.random() < friendlyGrowthChance(row, ctxProgress) ? 1 : 0;
  const nextOverall = Math.min(99, row.overall + ovrBump);
  await db
    .update(players)
    .set({
      fitness: newFit,
      morale: newMor,
      overall: nextOverall,
      // Potential never sits below overall — the squad screen reads the gap
      // as remaining growth.
      potential: Math.max(row.potential, nextOverall),
      // A player who improves is worth more immediately. His wage is not
      // touched: that is fixed by the contract until it is renewed.
      ...(ovrBump
        ? {
            marketValueCents: marketValueCents(
              nextOverall,
              Math.max(row.potential, nextOverall),
              row.age,
            ),
          }
        : {}),
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
    remaining: FRIENDLY_DAILY_CAP - within.length - 1,
  };
}

/**
 * Choose which attribute a trainee works on.
 *
 * Stored on the player rather than on a training slot, so the choice survives
 * being taken out of training and put back — a manager who has decided his
 * centre-back should work on pace should not have to say so again every time.
 */
export async function setTrainingFocus(input: {
  playerId: string;
  focus: string;
}) {
  const ctx = await requireLeagueContext();
  if (!(TRAINABLE as readonly string[]).includes(input.focus)) {
    return { ok: false as const, error: "Geçersiz antrenman alanı." };
  }
  const updated = await db
    .update(players)
    .set({ trainingFocus: input.focus })
    .where(and(eq(players.id, input.playerId), eq(players.clubId, ctx.club.id)))
    .returning();
  if (updated.length === 0) {
    return { ok: false as const, error: "Bu oyuncu senin kadronda değil." };
  }
  revalidatePath("/squad");
  return { ok: true as const };
}

/**
 * Change formation from the squad screen, and re-arrange the eleven for it.
 *
 * Changing shape used to mean leaving the squad, opening the tactic board,
 * picking a formation, dragging eleven names into the right slots and saving.
 * That is the correct place to do it CAREFULLY — but it is far too much
 * ceremony for "try a back three", which is a thing a manager wants to do in
 * one tap and undo in another.
 *
 * So this does both halves at once: it sets the formation AND writes a team
 * sheet that actually fits it, using the same `autoLineup` the AI managers
 * use. Setting the formation alone would have been worse than nothing — the
 * saved XI would still be the old shape's eleven, and the resolver would keep
 * fielding a back four inside a 3-5-2.
 */
export async function setFormationQuick(formation: string) {
  const ctx = await requireLeagueContext();
  if (!(ALLOWED_FORMATIONS as readonly string[]).includes(formation)) {
    return { ok: false as const, error: "Geçersiz diziliş." };
  }

  const squad = await db
    .select()
    .from(players)
    .where(eq(players.clubId, ctx.club.id));
  const lineup = autoLineup(squad, formation);

  await db
    .update(clubs)
    .set({ formation, lineupJson: JSON.stringify(lineup) })
    .where(eq(clubs.id, ctx.club.id));

  revalidatePath("/squad");
  revalidatePath("/tactic");
  revalidatePath("/dashboard");
  return { ok: true as const, formation, xiCount: lineup.xi.length };
}
