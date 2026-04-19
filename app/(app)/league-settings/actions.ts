"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { leagues } from "@/lib/schema";
import { requireLeagueContext } from "@/lib/session";

export async function updateLeagueSettings(input: {
  matchTime?: string;
  visibility?: "private" | "public";
  commissionerOnlyAdvance?: boolean;
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
  if (Object.keys(updates).length === 0) {
    return { ok: false as const, error: "Değişiklik yok." };
  }

  await db.update(leagues).set(updates).where(eq(leagues.id, ctx.league.id));
  revalidatePath("/dashboard");
  revalidatePath("/league-settings");
  return { ok: true as const };
}
