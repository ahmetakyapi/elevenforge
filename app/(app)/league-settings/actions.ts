"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { cupFixtures, fixtures, leagues } from "@/lib/schema";
import { matchKickoff } from "@/lib/match-time";
import { requireLeagueContext } from "@/lib/session";

export async function updateLeagueSettings(input: {
  matchTime?: string;
  visibility?: "private" | "public";
  commissionerOnlyAdvance?: boolean;
  manualAdvanceEnabled?: boolean;
}) {
  const ctx = await requireLeagueContext();
  if (ctx.league.createdByUserId !== ctx.user.id) {
    return { ok: false as const, error: "Sadece lig kurucusu değiştirebilir." };
  }

  const updates: Partial<typeof leagues.$inferInsert> = {};
  if (input.matchTime !== undefined) {
    if (!/^\d{1,2}:\d{2}$/.test(input.matchTime)) {
      return { ok: false as const, error: "Geçersiz saat formatı (HH:MM)." };
    }
    updates.matchTime = input.matchTime;
  }
  if (input.visibility) updates.visibility = input.visibility;
  if (typeof input.commissionerOnlyAdvance === "boolean") {
    updates.commissionerOnlyAdvance = input.commissionerOnlyAdvance;
  }
  if (typeof input.manualAdvanceEnabled === "boolean") {
    updates.manualAdvanceEnabled = input.manualAdvanceEnabled;
  }
  if (Object.keys(updates).length === 0) {
    return { ok: false as const, error: "Değişiklik yok." };
  }

  await db.update(leagues).set(updates).where(eq(leagues.id, ctx.league.id));

  // Changing the match time must actually move the matches.
  //
  // Every fixture's scheduledAt is baked in at league creation, and
  // runMatchDay selects purely on `scheduledAt <= now` — it never reads
  // league.matchTime. So a commissioner could change "match time" to 20:00,
  // see the UI confirm it applied from the next match day, and watch every
  // remaining game still kick off at the old hour, forever. Cup ties are
  // scheduled the same way, so they move too or the two competitions drift
  // apart.
  let rescheduled = 0;
  if (updates.matchTime) {
    const zone = ctx.league.timeZone;
    const pending = await db
      .select({ id: fixtures.id, scheduledAt: fixtures.scheduledAt })
      .from(fixtures)
      .where(
        and(
          eq(fixtures.leagueId, ctx.league.id),
          eq(fixtures.status, "scheduled"),
        ),
      );
    for (const f of pending) {
      // Keep the calendar day, move the time of day.
      const moved = matchKickoff(f.scheduledAt, 0, updates.matchTime, zone);
      if (moved.getTime() === f.scheduledAt.getTime()) continue;
      await db
        .update(fixtures)
        .set({ scheduledAt: moved })
        .where(
          and(eq(fixtures.id, f.id), eq(fixtures.status, "scheduled")),
        );
      rescheduled++;
    }

    const pendingCup = await db
      .select({ id: cupFixtures.id, scheduledAt: cupFixtures.scheduledAt })
      .from(cupFixtures)
      .where(
        and(
          eq(cupFixtures.leagueId, ctx.league.id),
          eq(cupFixtures.status, "scheduled"),
        ),
      );
    for (const f of pendingCup) {
      const moved = matchKickoff(f.scheduledAt, 0, updates.matchTime, zone);
      if (moved.getTime() === f.scheduledAt.getTime()) continue;
      await db
        .update(cupFixtures)
        .set({ scheduledAt: moved })
        .where(
          and(eq(cupFixtures.id, f.id), eq(cupFixtures.status, "scheduled")),
        );
      rescheduled++;
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/league-settings");
  revalidatePath("/cup");
  return { ok: true as const, rescheduled };
}
