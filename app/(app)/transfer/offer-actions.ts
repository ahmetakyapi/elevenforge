"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { creditClub, debitClub } from "@/lib/money";
import {
  clubs,
  feedEvents,
  players,
  transferHistory,
  transferListings,
  transferOffers,
} from "@/lib/schema";
import { requireLeagueContext } from "@/lib/session";
import { euroAmountSchema, uuidSchema, validate } from "@/lib/validation";

const OFFER_TTL_MS = 3 * 24 * 3600 * 1000;
const MAX_PENDING_OFFERS = 5;

/**
 * Bid for a player who is NOT on the transfer list.
 *
 * This is the piece that makes a squad feel owned rather than shelved: you
 * approach the club that holds the player and they decide. Bot clubs answer
 * on the next AI tick (lib/ai/manager.ts); human clubs answer by hand.
 *
 * Money is NOT taken here — only when the offer is accepted. Escrowing on a
 * pending offer would let a rival freeze your budget for three days by
 * bidding on someone you would never sell.
 */
export async function sendTransferOffer(input: {
  playerId: string;
  amountEur: number;
}) {
  const ctx = await requireLeagueContext();
  const parsed = validate(
    z.object({ playerId: uuidSchema, amountEur: euroAmountSchema }),
    input,
  );
  if (!parsed.ok) return parsed;

  const amountCents = Math.round(parsed.data.amountEur * 100);
  if (amountCents <= 0) {
    return { ok: false as const, error: "Teklif 0'dan büyük olmalı." };
  }

  const [p] = await db
    .select()
    .from(players)
    .where(eq(players.id, parsed.data.playerId))
    .limit(1);
  if (!p) return { ok: false as const, error: "Oyuncu bulunamadı." };
  if (p.leagueId !== ctx.league.id) {
    return { ok: false as const, error: "Bu oyuncu ligimizde değil." };
  }
  if (!p.clubId) {
    return {
      ok: false as const,
      error: "Bu oyuncu serbest — Serbest Oyuncular sayfasından imzalayabilirsin.",
    };
  }
  if (p.clubId === ctx.club.id) {
    return { ok: false as const, error: "Kendi oyuncun için teklif veremezsin." };
  }

  // A lowball wastes everyone's time; the receiving club would auto-reject.
  const floor = Math.round(Number(p.marketValueCents) * 0.5);
  if (amountCents < floor) {
    return {
      ok: false as const,
      error: `Teklif en az €${(floor / 100 / 1_000_000).toFixed(1)}M olmalı.`,
    };
  }

  // Must be able to pay if it is accepted — checked again at acceptance.
  if (ctx.club.balanceCents < amountCents) {
    return { ok: false as const, error: "Bütçen bu teklifi karşılamıyor." };
  }

  const pending = await db
    .select({ id: transferOffers.id })
    .from(transferOffers)
    .where(
      and(
        eq(transferOffers.fromClubId, ctx.club.id),
        eq(transferOffers.status, "pending"),
      ),
    );
  if (pending.length >= MAX_PENDING_OFFERS) {
    return {
      ok: false as const,
      error: `Aynı anda en fazla ${MAX_PENDING_OFFERS} açık teklifin olabilir.`,
    };
  }

  try {
    await db.insert(transferOffers).values({
      leagueId: ctx.league.id,
      playerId: p.id,
      fromClubId: ctx.club.id,
      toClubId: p.clubId,
      amountCents,
      expiresAt: new Date(Date.now() + OFFER_TTL_MS),
    });
  } catch {
    return {
      ok: false as const,
      error: "Bu oyuncu için zaten bekleyen bir teklifin var.",
    };
  }

  revalidatePath("/transfer");
  return { ok: true as const };
}

/** Withdraw an offer you sent while it is still pending. */
export async function withdrawTransferOffer(input: { offerId: string }) {
  const ctx = await requireLeagueContext();
  const parsed = validate(z.object({ offerId: uuidSchema }), input);
  if (!parsed.ok) return parsed;
  const updated = await db
    .update(transferOffers)
    .set({ status: "withdrawn", respondedAt: new Date() })
    .where(
      and(
        eq(transferOffers.id, parsed.data.offerId),
        eq(transferOffers.fromClubId, ctx.club.id),
        ne(transferOffers.status, "accepted"),
      ),
    )
    .returning();
  if (updated.length === 0) {
    return { ok: false as const, error: "Bu teklif geri çekilemez." };
  }
  revalidatePath("/transfer");
  return { ok: true as const };
}

/**
 * Answer an offer for one of your players.
 *
 * The transfer itself is a chain of conditional writes: claim the offer,
 * take the money, move the player only if you still own him, and refund if
 * any step refuses. That ordering is what keeps two simultaneous acceptances
 * from selling the same player twice.
 */
export async function respondToTransferOffer(input: {
  offerId: string;
  action: "accept" | "reject" | "counter";
  counterEur?: number;
}) {
  const ctx = await requireLeagueContext();
  const parsed = validate(
    z.object({
      offerId: uuidSchema,
      action: z.enum(["accept", "reject", "counter"]),
      counterEur: euroAmountSchema.optional(),
    }),
    input,
  );
  if (!parsed.ok) return parsed;

  const [offer] = await db
    .select()
    .from(transferOffers)
    .where(eq(transferOffers.id, parsed.data.offerId))
    .limit(1);
  if (!offer) return { ok: false as const, error: "Teklif bulunamadı." };
  if (offer.toClubId !== ctx.club.id) {
    return { ok: false as const, error: "Bu teklif sana yapılmadı." };
  }
  if (offer.status !== "pending") {
    return { ok: false as const, error: "Bu teklif artık geçerli değil." };
  }

  if (parsed.data.action === "reject") {
    await db
      .update(transferOffers)
      .set({ status: "rejected", respondedAt: new Date() })
      .where(
        and(
          eq(transferOffers.id, offer.id),
          eq(transferOffers.status, "pending"),
        ),
      );
    revalidatePath("/transfer");
    return { ok: true as const };
  }

  if (parsed.data.action === "counter") {
    const counterCents = Math.round((parsed.data.counterEur ?? 0) * 100);
    if (counterCents <= Number(offer.amountCents)) {
      return {
        ok: false as const,
        error: "Karşı teklif, gelen tekliften yüksek olmalı.",
      };
    }
    await db
      .update(transferOffers)
      .set({
        status: "countered",
        counterCents,
        respondedAt: new Date(),
      })
      .where(
        and(
          eq(transferOffers.id, offer.id),
          eq(transferOffers.status, "pending"),
        ),
      );
    revalidatePath("/transfer");
    return { ok: true as const };
  }

  // ── Accept ────────────────────────────────────────────────────
  const squadSize = await db
    .select({ id: players.id })
    .from(players)
    .where(eq(players.clubId, ctx.club.id));
  if (squadSize.length <= 14) {
    return {
      ok: false as const,
      error: "Kadron 14'ün altına inemez — önce takviye yap.",
    };
  }

  const claimed = await db
    .update(transferOffers)
    .set({ status: "accepted", respondedAt: new Date() })
    .where(
      and(eq(transferOffers.id, offer.id), eq(transferOffers.status, "pending")),
    )
    .returning();
  if (claimed.length === 0) {
    return { ok: false as const, error: "Bu teklif artık geçerli değil." };
  }

  const amount = Number(offer.amountCents);
  const paid = await debitClub(offer.fromClubId, amount, undefined, {
    kind: "transfer_in",
  });
  if (!paid) {
    await db
      .update(transferOffers)
      .set({ status: "rejected", message: "Teklif eden kulübün bütçesi yetersiz." })
      .where(eq(transferOffers.id, offer.id));
    return {
      ok: false as const,
      error: "Teklifi yapan kulübün bütçesi artık yetersiz.",
    };
  }

  const moved = await db
    .update(players)
    .set({ clubId: offer.fromClubId, status: "active" })
    .where(
      and(eq(players.id, offer.playerId), eq(players.clubId, ctx.club.id)),
    )
    .returning();
  if (moved.length === 0) {
    await creditClub(offer.fromClubId, amount, undefined, {
      kind: "transfer_refund",
    });
    await db
      .update(transferOffers)
      .set({ status: "rejected", message: "Oyuncu artık kadroda değil." })
      .where(eq(transferOffers.id, offer.id));
    return { ok: false as const, error: "Bu oyuncu artık kadronda değil." };
  }

  await creditClub(ctx.club.id, amount, undefined, {
    kind: "transfer_out",
  });
  // Any open listing for him is void now that he has been sold directly.
  await db
    .update(transferListings)
    .set({ status: "withdrawn" })
    .where(
      and(
        eq(transferListings.playerId, offer.playerId),
        eq(transferListings.status, "active"),
      ),
    );
  await db.insert(transferHistory).values({
    leagueId: ctx.league.id,
    playerId: offer.playerId,
    fromClubId: ctx.club.id,
    toClubId: offer.fromClubId,
    priceCents: amount,
  });

  const [buyer] = await db
    .select({ name: clubs.name })
    .from(clubs)
    .where(eq(clubs.id, offer.fromClubId))
    .limit(1);
  const [p] = await db
    .select({ name: players.name })
    .from(players)
    .where(eq(players.id, offer.playerId))
    .limit(1);
  await db.insert(feedEvents).values({
    leagueId: ctx.league.id,
    clubId: offer.fromClubId,
    eventType: "transfer",
    text: `${buyer?.name ?? "Bir kulüp"}, ${ctx.club.name} kulübünden ${p?.name ?? "bir oyuncu"} transferini bitirdi (€${(amount / 100 / 1_000_000).toFixed(1)}M).`,
  });

  revalidatePath("/transfer");
  revalidatePath("/squad");
  revalidatePath("/dashboard");
  return { ok: true as const };
}

/** Accept a counter-offer the selling club named. */
export async function acceptCounterOffer(input: { offerId: string }) {
  const ctx = await requireLeagueContext();
  const parsed = validate(z.object({ offerId: uuidSchema }), input);
  if (!parsed.ok) return parsed;

  const [offer] = await db
    .select()
    .from(transferOffers)
    .where(eq(transferOffers.id, parsed.data.offerId))
    .limit(1);
  if (!offer) return { ok: false as const, error: "Teklif bulunamadı." };
  if (offer.fromClubId !== ctx.club.id) {
    return { ok: false as const, error: "Bu teklif senin değil." };
  }
  if (offer.status !== "countered" || offer.counterCents === null) {
    return { ok: false as const, error: "Bekleyen bir karşı teklif yok." };
  }

  // Re-open at the counter price; the seller (or their AI) settles it.
  const reopened = await db
    .update(transferOffers)
    .set({
      amountCents: offer.counterCents,
      status: "pending",
      counterCents: null,
      respondedAt: null,
      expiresAt: new Date(Date.now() + OFFER_TTL_MS),
    })
    .where(
      and(
        eq(transferOffers.id, offer.id),
        eq(transferOffers.status, "countered"),
      ),
    )
    .returning();
  if (reopened.length === 0) {
    return { ok: false as const, error: "Bu teklif artık geçerli değil." };
  }
  revalidatePath("/transfer");
  return { ok: true as const };
}
