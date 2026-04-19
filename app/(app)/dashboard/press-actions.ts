"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { clubs, players, pressConferences } from "@/lib/schema";
import { requireLeagueContext } from "@/lib/session";
import { pickPromptFor, promptByCode } from "@/lib/press-conferences";

/**
 * Pull (or create) the user's press conference for the current league
 * week. Idempotent: same (club, season, week) returns the existing row.
 * If the user already answered, returns the result so the UI can show
 * a thanks state instead of the question.
 */
export async function getOrCreatePressConference() {
  const ctx = await requireLeagueContext();
  const week = ctx.league.weekNumber;
  const season = ctx.league.seasonNumber;
  const existing = await db
    .select()
    .from(pressConferences)
    .where(
      and(
        eq(pressConferences.clubId, ctx.club.id),
        eq(pressConferences.season, season),
        eq(pressConferences.week, week),
      ),
    )
    .limit(1);
  if (existing.length > 0) return { ok: true as const, row: existing[0] };
  const prompt = pickPromptFor(ctx.club.id, week, season);
  const [inserted] = await db
    .insert(pressConferences)
    .values({
      leagueId: ctx.league.id,
      clubId: ctx.club.id,
      week,
      season,
      promptCode: prompt.code,
    })
    .returning();
  return { ok: true as const, row: inserted };
}

export async function answerPressConference(input: {
  pressId: string;
  answerCode: string;
}) {
  const ctx = await requireLeagueContext();
  const [row] = await db
    .select()
    .from(pressConferences)
    .where(eq(pressConferences.id, input.pressId))
    .limit(1);
  if (!row) return { ok: false as const, error: "Toplantı bulunamadı." };
  if (row.clubId !== ctx.club.id) {
    return { ok: false as const, error: "Bu toplantı senin değil." };
  }
  if (row.answerCode) {
    return { ok: false as const, error: "Zaten cevap verildi." };
  }
  const prompt = promptByCode(row.promptCode);
  const answer = prompt?.answers.find((a) => a.code === input.answerCode);
  if (!prompt || !answer) {
    return { ok: false as const, error: "Geçersiz cevap." };
  }

  // Apply effects
  if (answer.squadMoraleDelta !== 0) {
    // Each starter shifts by delta, clamped 1..5.
    const starters = await db
      .select()
      .from(players)
      .where(eq(players.clubId, ctx.club.id));
    for (const p of starters) {
      const next = Math.max(1, Math.min(5, p.morale + answer.squadMoraleDelta));
      if (next !== p.morale) {
        await db
          .update(players)
          .set({ morale: next })
          .where(eq(players.id, p.id));
      }
    }
  }
  if (answer.prestigeDelta !== 0) {
    await db
      .update(clubs)
      .set({
        prestige: sql`GREATEST(0, LEAST(100, ${clubs.prestige} + ${answer.prestigeDelta}))`,
      })
      .where(eq(clubs.id, ctx.club.id));
  }
  await db
    .update(pressConferences)
    .set({ answerCode: input.answerCode, answeredAt: new Date() })
    .where(eq(pressConferences.id, row.id));
  revalidatePath("/dashboard");
  return {
    ok: true as const,
    moraleDelta: answer.squadMoraleDelta,
    prestigeDelta: answer.prestigeDelta,
  };
}
