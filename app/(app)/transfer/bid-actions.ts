"use server";

/**
 * Place, raise or withdraw a bid on an auctioned listing.
 *
 * NOTHING IS CHARGED HERE. A bid is a row; the money moves once, when
 * resolveTransferBids awards the player. That is what lets several clubs bid
 * on the same player without the game holding funds it might have to give
 * back, and it is why the affordability check at award time (a guarded
 * `debitClub`) is the one that actually decides the winner.
 *
 * The check below is therefore advisory, not a guarantee: a club that bids
 * €40M and spends it before the auction closes simply loses to the next bid.
 * Refusing an unaffordable bid up front is still worth doing — it catches the
 * mistake while the manager can still act on it.
 */
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { players, transferBids, transferListings } from "@/lib/schema";
import { requireLeagueContext } from "@/lib/session";
import { MAX_LISTING_MULTIPLIER } from "@/lib/economy";
import {
  transferWindow,
  windowClosedError,
} from "@/lib/transfer-window";

const bidSchema = z.object({
  listingId: z.string().uuid(),
  amountEur: z.number().int().positive().max(1_000_000_000),
});

export async function placeBid(input: {
  listingId: string;
  amountEur: number;
}) {
  const parsed = bidSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Geçersiz teklif." };
  }
  const ctx = await requireLeagueContext();
  // Transfer window. Actions that ACQUIRE or LIST a player are gated; actions
  // that unwind a commitment (withdrawing a listing, a bid or an offer) stay
  // open, because trapping someone in a deal they no longer want is not what
  // a closed window means.
  {
    const w = transferWindow(ctx.league);
    if (!w.open) return windowClosedError(w) as { ok: false; error: string };
  }
  const amountCents = parsed.data.amountEur * 100;

  const [listing] = await db
    .select()
    .from(transferListings)
    .where(
      and(
        eq(transferListings.id, parsed.data.listingId),
        eq(transferListings.leagueId, ctx.league.id),
        eq(transferListings.status, "active"),
      ),
    );
  if (!listing) {
    return { ok: false as const, error: "Bu ilan artık aktif değil." };
  }
  if (listing.bidsCloseAt === null) {
    return { ok: false as const, error: "Bu ilan sabit fiyatlı — doğrudan al." };
  }
  if (listing.bidsCloseAt.getTime() <= Date.now()) {
    return { ok: false as const, error: "Teklif süresi doldu." };
  }
  if (listing.sellerClubId === ctx.club.id) {
    return { ok: false as const, error: "Kendi oyuncuna teklif veremezsin." };
  }
  if (amountCents < listing.priceCents) {
    return {
      ok: false as const,
      error: "Teklif, istenen fiyatın altında olamaz.",
    };
  }

  const [player] = await db
    .select()
    .from(players)
    .where(eq(players.id, listing.playerId));
  if (!player) {
    return { ok: false as const, error: "Oyuncu bulunamadı." };
  }
  // The same band that caps a listing price caps a bid. Without it a manager
  // could park an absurd figure on a rival's auction purely to deny it, then
  // let the debit fail at award — costing nothing and wasting everyone's time.
  const ceiling = Math.round(
    Number(player.marketValueCents) * MAX_LISTING_MULTIPLIER,
  );
  if (amountCents > ceiling) {
    return {
      ok: false as const,
      error: `En fazla piyasa değerinin ${MAX_LISTING_MULTIPLIER}× katı teklif verebilirsin.`,
    };
  }
  if (ctx.club.balanceCents < amountCents) {
    return { ok: false as const, error: "Bütçen bu teklifi karşılamıyor." };
  }

  // One live bid per club per listing is a partial unique index, so raising is
  // an update. Following the repo's precedent for partial indexes
  // (offers_one_pending_per_target), the conflict is handled by trying the
  // update first rather than by ON CONFLICT — a partial index needs its
  // predicate repeated in the conflict target, which Drizzle expresses awkwardly
  // and which fails at runtime rather than at compile time when omitted.
  const raised = await db
    .update(transferBids)
    .set({ amountCents })
    .where(
      and(
        eq(transferBids.listingId, listing.id),
        eq(transferBids.bidderClubId, ctx.club.id),
        eq(transferBids.status, "active"),
      ),
    )
    .returning();

  if (raised.length === 0) {
    try {
      await db.insert(transferBids).values({
        leagueId: ctx.league.id,
        listingId: listing.id,
        bidderClubId: ctx.club.id,
        amountCents,
      });
    } catch {
      return { ok: false as const, error: "Teklif kaydedilemedi, tekrar dene." };
    }
  }

  revalidatePath("/transfer");
  return { ok: true as const, raised: raised.length > 0 };
}

export async function withdrawBid(listingId: string) {
  const parsed = z.string().uuid().safeParse(listingId);
  if (!parsed.success) return { ok: false as const, error: "Geçersiz ilan." };
  const ctx = await requireLeagueContext();

  const pulled = await db
    .update(transferBids)
    .set({ status: "withdrawn" })
    .where(
      and(
        eq(transferBids.listingId, parsed.data),
        eq(transferBids.bidderClubId, ctx.club.id),
        eq(transferBids.status, "active"),
      ),
    )
    .returning();
  if (pulled.length === 0) {
    return { ok: false as const, error: "Geri çekilecek teklifin yok." };
  }
  revalidatePath("/transfer");
  return { ok: true as const };
}
