"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { transferWishlist } from "@/lib/schema";
import { requireLeagueContext } from "@/lib/session";

export async function toggleWishlist(input: { playerId: string }) {
  const ctx = await requireLeagueContext();
  const existing = await db
    .select()
    .from(transferWishlist)
    .where(
      and(
        eq(transferWishlist.clubId, ctx.club.id),
        eq(transferWishlist.playerId, input.playerId),
      ),
    )
    .limit(1);
  if (existing.length > 0) {
    await db
      .delete(transferWishlist)
      .where(
        and(
          eq(transferWishlist.clubId, ctx.club.id),
          eq(transferWishlist.playerId, input.playerId),
        ),
      );
    revalidatePath("/transfer");
    return { ok: true as const, watching: false };
  }
  await db.insert(transferWishlist).values({
    clubId: ctx.club.id,
    playerId: input.playerId,
  });
  revalidatePath("/transfer");
  return { ok: true as const, watching: true };
}
