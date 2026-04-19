"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { transferListings } from "@/lib/schema";
import { requireLeagueContext } from "@/lib/session";

type AutoBid = { clubId: string; maxCents: number };

/**
 * Place / cancel an auto-bid on a listing. The user supplies a max price
 * in EUR; the next transfer-bots tick (or any direct buy by us) will
 * complete the purchase as soon as the listing price drops at or below
 * that ceiling.
 *
 * Stored on the listing row as `auto_bids_json` so multiple clubs can
 * watch the same listing and the highest bidder wins on tie.
 */
export async function placeAutoBid(input: {
  listingId: string;
  maxEur: number;
}) {
  const ctx = await requireLeagueContext();
  const [row] = await db
    .select()
    .from(transferListings)
    .where(eq(transferListings.id, input.listingId))
    .limit(1);
  if (!row) return { ok: false as const, error: "İlan bulunamadı." };
  if (row.leagueId !== ctx.league.id) {
    return { ok: false as const, error: "Bu ilan başka bir ligde." };
  }
  if (row.status !== "active") {
    return { ok: false as const, error: "İlan aktif değil." };
  }
  if (input.maxEur <= 0) {
    return { ok: false as const, error: "Max fiyat 0'dan büyük olmalı." };
  }

  let bids: AutoBid[] = [];
  try {
    bids = JSON.parse(row.autoBidsJson) as AutoBid[];
  } catch {}
  bids = bids.filter((b) => b.clubId !== ctx.club.id);
  bids.push({ clubId: ctx.club.id, maxCents: input.maxEur * 100 });
  await db
    .update(transferListings)
    .set({ autoBidsJson: JSON.stringify(bids) })
    .where(eq(transferListings.id, row.id));

  revalidatePath("/transfer");
  return { ok: true as const };
}

export async function cancelAutoBid(input: { listingId: string }) {
  const ctx = await requireLeagueContext();
  const [row] = await db
    .select()
    .from(transferListings)
    .where(eq(transferListings.id, input.listingId))
    .limit(1);
  if (!row) return { ok: false as const, error: "İlan bulunamadı." };
  let bids: AutoBid[] = [];
  try {
    bids = JSON.parse(row.autoBidsJson) as AutoBid[];
  } catch {}
  bids = bids.filter((b) => b.clubId !== ctx.club.id);
  await db
    .update(transferListings)
    .set({ autoBidsJson: JSON.stringify(bids) })
    .where(
      and(
        eq(transferListings.id, row.id),
        eq(transferListings.status, "active"),
      ),
    );
  revalidatePath("/transfer");
  return { ok: true as const };
}
