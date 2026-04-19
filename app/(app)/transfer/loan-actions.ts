"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { clubs, feedEvents, players } from "@/lib/schema";
import { requireLeagueContext } from "@/lib/session";

const SEASON_DAYS = 30; // loans return after 30 days

/**
 * Loan-buy a listed player from another club. Player joins us temporarily
 * (`loanOwnerClubId` = original owner) and snaps back to that owner on
 * loanReturnsAt or at season-roll, whichever first. Loan fee = 20% of
 * market value, much cheaper than outright transfer.
 */
export async function loanPlayer(input: { playerId: string }) {
  const ctx = await requireLeagueContext();
  const [p] = await db
    .select()
    .from(players)
    .where(eq(players.id, input.playerId))
    .limit(1);
  if (!p) return { ok: false as const, error: "Oyuncu bulunamadı." };
  if (p.leagueId !== ctx.league.id) {
    return { ok: false as const, error: "Bu lige bağlı değil." };
  }
  if (!p.clubId) {
    return { ok: false as const, error: "Serbest oyuncu kiralanamaz — direkt imzala." };
  }
  if (p.clubId === ctx.club.id) {
    return { ok: false as const, error: "Kendi oyuncunu kiralayamazsın." };
  }
  if (p.loanOwnerClubId !== null) {
    return { ok: false as const, error: "Bu oyuncu zaten kirada." };
  }

  const fee = Math.round(Number(p.marketValueCents) * 0.2);
  if (ctx.club.balanceCents < fee) {
    return {
      ok: false as const,
      error: `Bütçe yetersiz (€${(fee / 100 / 1_000_000).toFixed(1)}M kira ücreti).`,
    };
  }

  const ownerClubId = p.clubId;
  const returnsAt = new Date(Date.now() + SEASON_DAYS * 24 * 3600 * 1000);

  // Optimistic claim — only succeeds if no concurrent loan / sale stole it.
  const claim = await db
    .update(players)
    .set({
      clubId: ctx.club.id,
      loanOwnerClubId: ownerClubId,
      loanReturnsAt: returnsAt,
    })
    .where(
      and(
        eq(players.id, p.id),
        eq(players.clubId, ownerClubId),
        sql`${players.loanOwnerClubId} IS NULL`,
      ),
    )
    .returning();
  if (claim.length === 0) {
    return { ok: false as const, error: "Az önce başkası kirayla aldı." };
  }

  await db
    .update(clubs)
    .set({ balanceCents: sql`${clubs.balanceCents} - ${fee}` })
    .where(eq(clubs.id, ctx.club.id));
  await db
    .update(clubs)
    .set({ balanceCents: sql`${clubs.balanceCents} + ${fee}` })
    .where(eq(clubs.id, ownerClubId));
  await db.insert(feedEvents).values({
    leagueId: ctx.league.id,
    clubId: ctx.club.id,
    eventType: "transfer",
    text: `${ctx.club.name} ${p.name}'ı 30 gün kiralık aldı (€${(fee / 100 / 1_000_000).toFixed(1)}M).`,
  });

  revalidatePath("/transfer");
  revalidatePath("/squad");
  return { ok: true as const };
}

/**
 * Background sweep — return any expired loans to their owners. Called from
 * the daily training cron so loans don't pile up.
 */
export async function returnExpiredLoans(): Promise<{ returned: number }> {
  const now = new Date();
  const expired = await db
    .select()
    .from(players)
    .where(
      and(
        sql`${players.loanReturnsAt} IS NOT NULL`,
        sql`${players.loanReturnsAt} <= ${now}`,
      ),
    );
  let returned = 0;
  for (const p of expired) {
    if (!p.loanOwnerClubId) continue;
    await db
      .update(players)
      .set({
        clubId: p.loanOwnerClubId,
        loanOwnerClubId: null,
        loanReturnsAt: null,
      })
      .where(eq(players.id, p.id));
    returned++;
  }
  return { returned };
}
