"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { clubs, feedEvents, players } from "@/lib/schema";
import { requireLeagueContext } from "@/lib/session";

/**
 * Renew a player's contract by N years. Cost = N years × annual wage × 1.2
 * (12-month wage block + 20% renewal premium). Player wage rises 8%/year
 * to reflect contract escalation. Caps at 5 total years.
 */
export async function renewContract(input: {
  playerId: string;
  years: 1 | 2 | 3;
}) {
  const ctx = await requireLeagueContext();
  const [p] = await db
    .select()
    .from(players)
    .where(
      and(
        eq(players.id, input.playerId),
        eq(players.clubId, ctx.club.id),
      ),
    )
    .limit(1);
  if (!p) return { ok: false as const, error: "Oyuncu sende değil." };
  const newYears = Math.min(5, p.contractYears + input.years);
  if (newYears === p.contractYears) {
    return { ok: false as const, error: "Sözleşme zaten 5 yıl sonuna geldi." };
  }

  // Annual wage = weekly wage × 52
  const annualWage = Number(p.wageCents) * 52;
  const cost = Math.round(annualWage * input.years * 1.2);
  if (ctx.club.balanceCents < cost) {
    return {
      ok: false as const,
      error: `Bütçe yetersiz (€${(cost / 100 / 1_000_000).toFixed(1)}M imzalama bonusu).`,
    };
  }

  // Wage rises 8% per year of renewal
  const newWageCents = Math.round(Number(p.wageCents) * Math.pow(1.08, input.years));

  await db
    .update(players)
    .set({
      contractYears: newYears,
      wageCents: newWageCents,
      morale: Math.min(5, p.morale + 1), // happy with new deal
    })
    .where(eq(players.id, p.id));
  await db
    .update(clubs)
    .set({ balanceCents: sql`${clubs.balanceCents} - ${cost}` })
    .where(eq(clubs.id, ctx.club.id));
  await db.insert(feedEvents).values({
    leagueId: ctx.league.id,
    clubId: ctx.club.id,
    eventType: "morale",
    text: `${p.name} sözleşmesini ${input.years} yıl uzattı.`,
  });

  revalidatePath("/squad");
  revalidatePath(`/player/${p.id}`);
  revalidatePath("/dashboard");
  return { ok: true as const, newYears, newWageCents };
}

export async function releasePlayer(input: { playerId: string }) {
  const ctx = await requireLeagueContext();
  const [p] = await db
    .select()
    .from(players)
    .where(
      and(
        eq(players.id, input.playerId),
        eq(players.clubId, ctx.club.id),
      ),
    )
    .limit(1);
  if (!p) return { ok: false as const, error: "Oyuncu sende değil." };
  await db
    .update(players)
    .set({ clubId: null, status: "active", contractYears: 0 })
    .where(eq(players.id, p.id));
  await db.insert(feedEvents).values({
    leagueId: ctx.league.id,
    clubId: ctx.club.id,
    eventType: "transfer",
    text: `${ctx.club.name} ${p.name}'i serbest bıraktı.`,
  });
  revalidatePath("/squad");
  revalidatePath("/free-agents");
  revalidatePath("/dashboard");
  return { ok: true as const };
}
