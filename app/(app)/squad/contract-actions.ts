"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { RENEWAL_WAGE_MULTIPLIER, renewalCostCents } from "@/lib/economy";
import { debitClub } from "@/lib/money";
import { feedEvents, players, transferListings } from "@/lib/schema";
import { requireLeagueContext } from "@/lib/session";
import { uuidSchema, validate } from "@/lib/validation";

/**
 * Renew a player's contract by N years. Cost = N years × annual wage × 1.2
 * (12-month wage block + 20% renewal premium). Player wage rises 8%/year
 * to reflect contract escalation. Caps at 5 total years.
 */
const renewInputSchema = z.object({
  playerId: uuidSchema,
  // The `1 | 2 | 3` type is erased at runtime; the client can send anything.
  // A negative value used to make `cost` negative, turning the debit below
  // into an unbounded credit.
  years: z.literal([1, 2, 3]),
});

export async function renewContract(input: {
  playerId: string;
  years: 1 | 2 | 3;
}) {
  const ctx = await requireLeagueContext();
  const parsed = validate(renewInputSchema, input);
  if (!parsed.ok) return parsed;
  const { playerId, years } = parsed.data;

  const [p] = await db
    .select()
    .from(players)
    .where(
      and(
        eq(players.id, playerId),
        eq(players.clubId, ctx.club.id),
      ),
    )
    .limit(1);
  if (!p) return { ok: false as const, error: "Oyuncu sende değil." };
  const newYears = Math.min(5, p.contractYears + years);
  if (newYears <= p.contractYears) {
    return { ok: false as const, error: "Sözleşme zaten 5 yıl sonuna geldi." };
  }

  // Signing bonus of ~12 weeks' wages per added year (see lib/economy.ts).
  const cost = renewalCostCents(Number(p.wageCents), years);

  // Wage rises 8% per year of renewal
  const newWageCents = Math.round(
    Number(p.wageCents) * Math.pow(RENEWAL_WAGE_MULTIPLIER, years),
  );

  // Charge first: the guarded debit is the affordability check, so two
  // concurrent renewals can't both pass a stale balance read.
  const paid = await debitClub(ctx.club.id, cost, undefined, {
    kind: "contract_renewal",
  });
  if (!paid) {
    return {
      ok: false as const,
      error: `Bütçe yetersiz (€${(cost / 100 / 1_000_000).toFixed(1)}M imzalama bonusu).`,
    };
  }

  await db
    .update(players)
    .set({
      contractYears: newYears,
      wageCents: newWageCents,
      morale: Math.min(5, p.morale + 1), // happy with new deal
    })
    .where(eq(players.id, p.id));
  await db.insert(feedEvents).values({
    leagueId: ctx.league.id,
    clubId: ctx.club.id,
    eventType: "morale",
    text: `${p.name} sözleşmesini ${years} yıl uzattı.`,
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
  // Withdraw any open listing first — otherwise the released player stays on
  // the market and a buyer would pay this club for a free agent it no longer
  // owns.
  await db
    .update(transferListings)
    .set({ status: "withdrawn" })
    .where(
      and(
        eq(transferListings.playerId, p.id),
        eq(transferListings.status, "active"),
      ),
    );
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
