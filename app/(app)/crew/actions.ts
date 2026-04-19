"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { chatMessages } from "@/lib/schema";
import { requireLeagueContext } from "@/lib/session";

export async function sendChatMessage(body: string) {
  const ctx = await requireLeagueContext();
  const trimmed = body.trim().slice(0, 500);
  if (!trimmed) {
    return { ok: false as const, error: "Boş mesaj gönderilemez." };
  }
  await db.insert(chatMessages).values({
    leagueId: ctx.league.id,
    userId: ctx.user.id,
    body: trimmed,
  });
  revalidatePath("/crew");
  return { ok: true as const };
}
