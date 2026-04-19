"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireLeagueContext } from "@/lib/session";
import { db } from "@/lib/db";
import {
  clubs,
  feedEvents,
  players,
  transferHistory,
  transferListings,
} from "@/lib/schema";
import { sendScout as jobSendScout } from "@/lib/jobs/scout";
import type { Position } from "@/types";

export async function buyListing(listingId: string) {
  const ctx = await requireLeagueContext();
  const row = (
    await db
      .select()
      .from(transferListings)
      .where(eq(transferListings.id, listingId))
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
  if (ctx.club.balanceCents < row.priceCents) {
    return { ok: false as const, error: "Bütçe yetersiz." };
  }

  const player = (
    await db.select().from(players).where(eq(players.id, row.playerId)).limit(1)
  )[0];
  if (!player) return { ok: false as const, error: "Oyuncu bulunamadı." };

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

  await db
    .update(players)
    .set({
      clubId: ctx.club.id,
      status: "active",
      jerseyNumber: nextJersey ?? player.jerseyNumber,
    })
    .where(eq(players.id, player.id));
  await db.insert(transferHistory).values({
    leagueId: ctx.league.id,
    playerId: player.id,
    fromClubId: row.sellerClubId,
    toClubId: ctx.club.id,
    priceCents: row.priceCents,
  });
  // Atomic decrement; safe under concurrent purchases by the same buyer.
  await db
    .update(clubs)
    .set({ balanceCents: sql`${clubs.balanceCents} - ${row.priceCents}` })
    .where(eq(clubs.id, ctx.club.id));
  if (row.sellerClubId) {
    await db
      .update(clubs)
      .set({ balanceCents: sql`${clubs.balanceCents} + ${row.priceCents}` })
      .where(eq(clubs.id, row.sellerClubId));
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

export async function listPlayer(input: {
  playerId: string;
  priceEur: number;
}) {
  const ctx = await requireLeagueContext();
  const player = (
    await db
      .select()
      .from(players)
      .where(
        and(
          eq(players.id, input.playerId),
          eq(players.clubId, ctx.club.id),
        ),
      )
      .limit(1)
  )[0];
  if (!player) return { ok: false as const, error: "Oyuncu sende değil." };

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

  // Enforce min/max around market value (±20%)
  const priceCents = input.priceEur * 100;
  const minPrice = Math.round(player.marketValueCents * 0.5);
  const maxPrice = Math.round(player.marketValueCents * 2.5);
  if (priceCents < minPrice || priceCents > maxPrice) {
    return {
      ok: false as const,
      error: `Fiyat €${Math.round(minPrice / 100 / 1_000_000)}M - €${Math.round(maxPrice / 100 / 1_000_000)}M arası olmalı.`,
    };
  }

  await db.insert(transferListings).values({
    leagueId: ctx.league.id,
    playerId: player.id,
    sellerClubId: ctx.club.id,
    isBotMarket: false,
    priceCents,
    originalPriceCents: priceCents,
    expiresAt: new Date(Date.now() + 30 * 3600 * 1000),
  });
  await db.update(players).set({ status: "listed" }).where(eq(players.id, player.id));

  revalidatePath("/transfer");
  revalidatePath("/squad");
  return { ok: true as const };
}

export async function removeListing(listingId: string) {
  const ctx = await requireLeagueContext();
  const row = (
    await db
      .select()
      .from(transferListings)
      .where(eq(transferListings.id, listingId))
      .limit(1)
  )[0];
  if (!row || row.sellerClubId !== ctx.club.id) {
    return { ok: false as const, error: "İlan senin değil." };
  }
  await db
    .update(transferListings)
    .set({ status: "withdrawn" })
    .where(eq(transferListings.id, row.id));
  await db.update(players).set({ status: "active" }).where(eq(players.id, row.playerId));
  revalidatePath("/transfer");
  return { ok: true as const };
}

export async function sendScoutAction(input: {
  targetNationality: string;
  targetPosition: Position | "ANY";
  ageMin: number;
  ageMax: number;
}) {
  const ctx = await requireLeagueContext();
  const COST = 50_000_000; // €500K in cents
  if (ctx.club.balanceCents < COST) {
    return { ok: false as const, error: "Bütçe yetersiz." };
  }
  await db
    .update(clubs)
    .set({ balanceCents: ctx.club.balanceCents - COST })
    .where(eq(clubs.id, ctx.club.id));
  const scout = await jobSendScout({
    leagueId: ctx.league.id,
    clubId: ctx.club.id,
    ...input,
  });
  revalidatePath("/transfer");
  return { ok: true as const, scoutId: scout.id };
}
