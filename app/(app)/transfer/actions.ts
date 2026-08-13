"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireLeagueContext } from "@/lib/session";
import { db } from "@/lib/db";
import { creditClub, debitClub } from "@/lib/money";
import {
  feedEvents,
  players,
  scouts,
  transferHistory,
  transferListings,
} from "@/lib/schema";
import { sendScout as jobSendScout } from "@/lib/jobs/scout";
import {
  MAX_LISTING_MULTIPLIER,
  MIN_LISTING_MULTIPLIER,
} from "@/lib/economy";
import { euroAmountSchema, uuidSchema, validate } from "@/lib/validation";
import type { Position } from "@/types";

export async function buyListing(listingId: string) {
  const ctx = await requireLeagueContext();
  const parsedId = validate(uuidSchema, listingId);
  if (!parsedId.ok) return parsedId;
  const row = (
    await db
      .select()
      .from(transferListings)
      .where(eq(transferListings.id, parsedId.data))
      .limit(1)
  )[0];
  if (!row || row.status !== "active") {
    return { ok: false as const, error: "Oyuncu listede değil." };
  }
  if (row.leagueId !== ctx.league.id) {
    return { ok: false as const, error: "Bu ilan başka bir ligde." };
  }
  if (row.sellerClubId === ctx.club.id) {
    return { ok: false as const, error: "Kendi oyuncunu alamazsın." };
  }

  const player = (
    await db.select().from(players).where(eq(players.id, row.playerId)).limit(1)
  )[0];
  if (!player) return { ok: false as const, error: "Oyuncu bulunamadı." };
  if (player.clubId === ctx.club.id) {
    return { ok: false as const, error: "Bu oyuncu zaten sende." };
  }

  // Optimistic lock: claim the listing first. If two buyers race, only the
  // first UPDATE matches a row (status='active' guard); the second sees zero
  // rows updated and bails out without spending money or moving the player.
  const claimed = await db
    .update(transferListings)
    .set({ status: "sold" })
    .where(
      and(
        eq(transferListings.id, row.id),
        eq(transferListings.status, "active"),
      ),
    )
    .returning();
  if (claimed.length === 0) {
    return { ok: false as const, error: "Bu oyuncu az önce başkası tarafından alındı." };
  }

  // Assign the lowest free jersey number (1-99) in the buyer's squad so no
  // collisions after transfer.
  const buyerSquad = await db
    .select({ num: players.jerseyNumber })
    .from(players)
    .where(eq(players.clubId, ctx.club.id));
  const taken = new Set(
    buyerSquad.map((p) => p.num).filter((n): n is number => typeof n === "number"),
  );
  let nextJersey: number | null = null;
  for (let n = 1; n <= 99; n++) {
    if (!taken.has(n)) {
      nextJersey = n;
      break;
    }
  }

  // Take the money before handing over the player. A guarded debit is the
  // real affordability check — the context snapshot above may be seconds old
  // and two parallel purchases must not both pass it.
  const paid = await debitClub(ctx.club.id, row.priceCents);
  if (!paid) {
    await db
      .update(transferListings)
      .set({ status: "active" })
      .where(eq(transferListings.id, row.id));
    return { ok: false as const, error: "Bütçe yetersiz." };
  }

  // Move the player only if the seller still owns him. This closes the
  // duplicate-listing hole: a stale second listing for an already-sold player
  // matches zero rows here and the buyer is refunded instead of paying for
  // someone else's player.
  const moved = await db
    .update(players)
    .set({
      clubId: ctx.club.id,
      status: "active",
      jerseyNumber: nextJersey ?? player.jerseyNumber,
    })
    .where(
      and(
        eq(players.id, player.id),
        row.sellerClubId
          ? eq(players.clubId, row.sellerClubId)
          : isNull(players.clubId),
      ),
    )
    .returning();
  if (moved.length === 0) {
    await creditClub(ctx.club.id, row.priceCents);
    await db
      .update(transferListings)
      .set({ status: "expired" })
      .where(eq(transferListings.id, row.id));
    return {
      ok: false as const,
      error: "Bu oyuncu artık satıcının kadrosunda değil, ilan iptal edildi.",
    };
  }

  await db.insert(transferHistory).values({
    leagueId: ctx.league.id,
    playerId: player.id,
    fromClubId: row.sellerClubId,
    toClubId: ctx.club.id,
    priceCents: row.priceCents,
  });
  if (row.sellerClubId) {
    await creditClub(row.sellerClubId, row.priceCents);
  }
  await db.insert(feedEvents).values({
    leagueId: ctx.league.id,
    clubId: ctx.club.id,
    eventType: "transfer",
    text: `${ctx.club.name} ${player.name}'i €${Math.round(row.priceCents / 100 / 1_000_000 * 10) / 10}M karşılığında aldı`,
  });

  revalidatePath("/transfer");
  revalidatePath("/squad");
  revalidatePath("/dashboard");
  return { ok: true as const, playerName: player.name };
}

const listInputSchema = z.object({
  playerId: uuidSchema,
  priceEur: euroAmountSchema,
});

export async function listPlayer(input: {
  playerId: string;
  priceEur: number;
}) {
  const ctx = await requireLeagueContext();
  // Without this, `priceEur: NaN` sailed through both range comparisons
  // (NaN < min and NaN > max are each false) and landed in a bigint column.
  const parsed = validate(listInputSchema, input);
  if (!parsed.ok) return parsed;

  const player = (
    await db
      .select()
      .from(players)
      .where(
        and(
          eq(players.id, parsed.data.playerId),
          eq(players.clubId, ctx.club.id),
        ),
      )
      .limit(1)
  )[0];
  if (!player) return { ok: false as const, error: "Oyuncu sende değil." };
  if (player.status === "listed") {
    return { ok: false as const, error: "Bu oyuncu zaten transfer listesinde." };
  }

  // Belt and braces alongside the partial unique index: an already-listed
  // player must never get a second active listing, or he sells twice.
  const existing = await db
    .select({ id: transferListings.id })
    .from(transferListings)
    .where(
      and(
        eq(transferListings.playerId, player.id),
        eq(transferListings.status, "active"),
      ),
    )
    .limit(1);
  if (existing.length > 0) {
    return { ok: false as const, error: "Bu oyuncu zaten transfer listesinde." };
  }

  // Max 5 active listings per club
  const myActive = await db
    .select({ id: transferListings.id })
    .from(transferListings)
    .where(
      and(
        eq(transferListings.sellerClubId, ctx.club.id),
        eq(transferListings.status, "active"),
      ),
    );
  if (myActive.length >= 5) {
    return { ok: false as const, error: "Max 5 ilan sınırı doldu." };
  }

  // Enforce min/max around market value
  const priceCents = Math.round(parsed.data.priceEur * 100);
  const minPrice = Math.round(player.marketValueCents * MIN_LISTING_MULTIPLIER);
  const maxPrice = Math.round(player.marketValueCents * MAX_LISTING_MULTIPLIER);
  if (priceCents < minPrice || priceCents > maxPrice) {
    return {
      ok: false as const,
      error: `Fiyat €${Math.round(minPrice / 100 / 1_000_000)}M - €${Math.round(maxPrice / 100 / 1_000_000)}M arası olmalı.`,
    };
  }

  try {
    await db.insert(transferListings).values({
      leagueId: ctx.league.id,
      playerId: player.id,
      sellerClubId: ctx.club.id,
      isBotMarket: false,
      priceCents,
      originalPriceCents: priceCents,
      expiresAt: new Date(Date.now() + 30 * 3600 * 1000),
    });
  } catch {
    return { ok: false as const, error: "Bu oyuncu zaten transfer listesinde." };
  }
  await db.update(players).set({ status: "listed" }).where(eq(players.id, player.id));

  revalidatePath("/transfer");
  revalidatePath("/squad");
  return { ok: true as const };
}

export async function removeListing(listingId: string) {
  const ctx = await requireLeagueContext();
  const parsedId = validate(uuidSchema, listingId);
  if (!parsedId.ok) return parsedId;
  const row = (
    await db
      .select()
      .from(transferListings)
      .where(eq(transferListings.id, parsedId.data))
      .limit(1)
  )[0];
  if (!row || row.sellerClubId !== ctx.club.id) {
    return { ok: false as const, error: "İlan senin değil." };
  }
  // Only an active listing can be withdrawn. Without the status guard the
  // seller could "withdraw" an already-sold listing and flip the new owner's
  // player back to active.
  const withdrawn = await db
    .update(transferListings)
    .set({ status: "withdrawn" })
    .where(
      and(
        eq(transferListings.id, row.id),
        eq(transferListings.status, "active"),
      ),
    )
    .returning();
  if (withdrawn.length === 0) {
    return { ok: false as const, error: "Bu ilan artık aktif değil." };
  }
  await db
    .update(players)
    .set({ status: "active" })
    .where(
      and(
        eq(players.id, row.playerId),
        eq(players.clubId, ctx.club.id),
        eq(players.status, "listed"),
      ),
    );
  revalidatePath("/transfer");
  revalidatePath("/squad");
  return { ok: true as const };
}

const scoutInputSchema = z.object({
  targetNationality: z.string().trim().min(1).max(40),
  targetPosition: z.enum(["GK", "DEF", "MID", "FWD", "ANY"]),
  ageMin: z.number().int().min(15).max(45),
  ageMax: z.number().int().min(15).max(45),
});

export async function sendScoutAction(input: {
  targetNationality: string;
  targetPosition: Position | "ANY";
  ageMin: number;
  ageMax: number;
}) {
  const ctx = await requireLeagueContext();
  const parsed = validate(scoutInputSchema, input);
  if (!parsed.ok) return parsed;
  if (parsed.data.ageMin > parsed.data.ageMax) {
    return { ok: false as const, error: "Yaş aralığı geçersiz." };
  }

  // Max 3 scouts in the field at once — otherwise a user can queue dozens.
  const inField = await db
    .select({ id: scouts.id })
    .from(scouts)
    .where(and(eq(scouts.clubId, ctx.club.id), eq(scouts.status, "active")));
  if (inField.length >= 3) {
    return { ok: false as const, error: "Aynı anda en fazla 3 kaşif gönderebilirsin." };
  }

  const COST = 50_000_000; // €500K in cents
  const paid = await debitClub(ctx.club.id, COST);
  if (!paid) return { ok: false as const, error: "Bütçe yetersiz." };

  const scout = await jobSendScout({
    leagueId: ctx.league.id,
    clubId: ctx.club.id,
    ...parsed.data,
  });
  revalidatePath("/transfer");
  return { ok: true as const, scoutId: scout.id };
}
