"use server";

import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { fixtures } from "@/lib/schema";
import { runMatchDay } from "@/lib/jobs";
import { runWeeklyNewspaper } from "@/lib/jobs/newspaper";
import { rollSeasonIfDone } from "@/lib/jobs/season";
import {
  runDailyTraining,
  runWeeklyEconomy,
} from "@/lib/jobs/training";
import { processScoutReturns } from "@/lib/jobs/scout";
import { requireLeagueContext } from "@/lib/session";

/**
 * Force the next scheduled matchweek to play immediately, run simulations,
 * then generate the newspaper. Reserved for the league commissioner so a
 * single hyper-active player can't fast-forward the season for everyone.
 *
 * Idempotent: if two commissioners somehow race, the second call's UPDATE
 * matches zero rows (status already changed) and runMatchDay processes only
 * what's still scheduled.
 */
export async function playNextRound() {
  const ctx = await requireLeagueContext();
  // Two-gate check:
  //  1. The league must have manualAdvanceEnabled — otherwise matches play
  //     ONLY via cron at the configured matchTime.
  //  2. If commissionerOnlyAdvance is also on (default), only the league
  //     creator can press the button.
  if (!ctx.league.manualAdvanceEnabled) {
    return {
      ok: false as const,
      error: "Manuel oynatma kapalı. Maçlar her gün belirlenen saatte otomatik oynanır. Kurucu lig ayarlarından açabilir.",
    };
  }
  if (
    ctx.league.commissionerOnlyAdvance &&
    ctx.league.createdByUserId !== ctx.user.id
  ) {
    return {
      ok: false as const,
      error: "Sadece lig kurucusu haftayı ileri sarabilir.",
    };
  }

  let next = (
    await db
      .select()
      .from(fixtures)
      .where(
        and(
          eq(fixtures.leagueId, ctx.league.id),
          eq(fixtures.status, "scheduled"),
        ),
      )
      .orderBy(asc(fixtures.weekNumber))
      .limit(1)
  )[0];
  // No fixtures → roll into new season first so the button never dead-ends.
  if (!next) {
    const roll = await rollSeasonIfDone(ctx.league.id);
    if (!roll.rolled) {
      return { ok: false as const, error: "Oynanacak maç kalmadı." };
    }
    next = (
      await db
        .select()
        .from(fixtures)
        .where(
          and(
            eq(fixtures.leagueId, ctx.league.id),
            eq(fixtures.status, "scheduled"),
          ),
        )
        .orderBy(asc(fixtures.weekNumber))
        .limit(1)
    )[0];
    if (!next) return { ok: false as const, error: "Fikstür oluşturulamadı." };
  }

  await db
    .update(fixtures)
    .set({ scheduledAt: new Date() })
    .where(
      and(
        eq(fixtures.leagueId, ctx.league.id),
        eq(fixtures.weekNumber, next.weekNumber),
        eq(fixtures.status, "scheduled"),
      ),
    );

  const sim = await runMatchDay({ leagueId: ctx.league.id });
  const paper = await runWeeklyNewspaper({ leagueId: ctx.league.id });

  // A full game-day passes with each round: train, return scouts,
  // collect weekly economy at the tail of the week.
  const trained = await runDailyTraining({ leagueId: ctx.league.id });
  const scoutReturned = await processScoutReturns({
    leagueId: ctx.league.id,
  });
  const econ =
    next.weekNumber % 3 === 0
      ? await runWeeklyEconomy({ leagueId: ctx.league.id })
      : null;

  revalidatePath("/dashboard");
  revalidatePath("/newspaper");
  revalidatePath("/squad");
  revalidatePath("/transfer");
  revalidatePath("/match");
  revalidatePath("/crew");
  return {
    ok: true as const,
    weekNumber: next.weekNumber,
    simulated: sim.simulated,
    newspaper: paper.generated,
    trained: trained.promoted,
    scoutReturned: scoutReturned.returned,
    econRan: econ !== null,
  };
}
