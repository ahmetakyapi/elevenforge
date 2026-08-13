"use server";

import { and, eq, gte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { chatMessages } from "@/lib/schema";
import { requireLeagueContext } from "@/lib/session";
import { chatBodySchema, validate } from "@/lib/validation";

/** At most 8 messages per 30s window, and 40 per 10 minutes. */
const BURST_LIMIT = 8;
const BURST_WINDOW_MS = 30_000;
const SUSTAINED_LIMIT = 40;
const SUSTAINED_WINDOW_MS = 10 * 60_000;

export async function sendChatMessage(body: string) {
  const ctx = await requireLeagueContext();
  const parsed = validate(chatBodySchema, body);
  if (!parsed.ok) return parsed;

  const burst = rateLimit(`chat:${ctx.user.id}`, BURST_LIMIT, BURST_WINDOW_MS);
  if (!burst.ok) {
    return {
      ok: false as const,
      error: `Çok hızlı yazıyorsun — ${Math.ceil(burst.retryAfterMs / 1000)} sn bekle.`,
    };
  }

  // The in-process limiter above is per-instance; this DB check is the one
  // that actually holds when requests land on different serverless instances.
  const since = new Date(Date.now() - SUSTAINED_WINDOW_MS);
  const recent = await db
    .select({ id: chatMessages.id })
    .from(chatMessages)
    .where(
      and(
        eq(chatMessages.userId, ctx.user.id),
        eq(chatMessages.leagueId, ctx.league.id),
        gte(chatMessages.sentAt, since),
      ),
    );
  if (recent.length >= SUSTAINED_LIMIT) {
    return {
      ok: false as const,
      error: "Sohbet limitine takıldın, biraz sonra tekrar dene.",
    };
  }

  await db.insert(chatMessages).values({
    leagueId: ctx.league.id,
    userId: ctx.user.id,
    body: parsed.data,
  });
  revalidatePath("/crew");
  return { ok: true as const };
}
