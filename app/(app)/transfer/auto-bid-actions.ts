"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { transferListings } from "@/lib/schema";
import { requireLeagueContext } from "@/lib/session";
import { euroAmountSchema, uuidSchema, validate } from "@/lib/validation";

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
function parseBids(raw: string): AutoBid[] {
  try {
    const arr = JSON.parse(raw) as AutoBid[];
    if (!Array.isArray(arr)) return [];
    return arr.filter(
      (b) =>
        typeof b?.clubId === "string" &&
        typeof b.maxCents === "number" &&
        Number.isFinite(b.maxCents),
    );
  } catch {
    return [];
  }
}

/**
 * Rewrite the shared auto-bid array on a listing.
 *
 * The array is one text column shared by every club watching the listing, so
 * a plain read-modify-write silently drops a rival's bid whenever two clubs
 * bid at the same moment. This retries against the exact JSON we read
 * (compare-and-swap on the old value) so a concurrent write is detected and
 * merged rather than clobbered.
 */
async function mutateBids(
  listingId: string,
  mutate: (bids: AutoBid[]) => AutoBid[],
): Promise<boolean> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const [row] = await db
      .select()
      .from(transferListings)
      .where(eq(transferListings.id, listingId))
      .limit(1);
    if (!row || row.status !== "active") return false;
    const next = JSON.stringify(mutate(parseBids(row.autoBidsJson)));
    const updated = await db
      .update(transferListings)
      .set({ autoBidsJson: next })
      .where(
        and(
          eq(transferListings.id, listingId),
          eq(transferListings.status, "active"),
          eq(transferListings.autoBidsJson, row.autoBidsJson),
        ),
      )
      .returning();
    if (updated.length > 0) return true;
  }
  return false;
}

export async function placeAutoBid(input: {
  listingId: string;
  maxEur: number;
}) {
  const ctx = await requireLeagueContext();
  const parsed = validate(
    z.object({ listingId: uuidSchema, maxEur: euroAmountSchema }),
    input,
  );
  if (!parsed.ok) return parsed;
  if (parsed.data.maxEur <= 0) {
    return { ok: false as const, error: "Max fiyat 0'dan büyük olmalı." };
  }

  const [row] = await db
    .select()
    .from(transferListings)
    .where(eq(transferListings.id, parsed.data.listingId))
    .limit(1);
  if (!row) return { ok: false as const, error: "İlan bulunamadı." };
  if (row.leagueId !== ctx.league.id) {
    return { ok: false as const, error: "Bu ilan başka bir ligde." };
  }
  if (row.status !== "active") {
    return { ok: false as const, error: "İlan aktif değil." };
  }
  if (row.sellerClubId === ctx.club.id) {
    // Otherwise a seller could auto-buy their own listing and launder money
    // through the transfer ledger.
    return { ok: false as const, error: "Kendi ilanına teklif veremezsin." };
  }

  const maxCents = Math.round(parsed.data.maxEur * 100);
  const ok = await mutateBids(row.id, (bids) => [
    ...bids.filter((b) => b.clubId !== ctx.club.id),
    { clubId: ctx.club.id, maxCents },
  ]);
  if (!ok) return { ok: false as const, error: "İlan artık aktif değil." };

  revalidatePath("/transfer");
  return { ok: true as const };
}

export async function cancelAutoBid(input: { listingId: string }) {
  const ctx = await requireLeagueContext();
  const parsed = validate(z.object({ listingId: uuidSchema }), input);
  if (!parsed.ok) return parsed;
  await mutateBids(parsed.data.listingId, (bids) =>
    bids.filter((b) => b.clubId !== ctx.club.id),
  );
  revalidatePath("/transfer");
  return { ok: true as const };
}
