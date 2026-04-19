"use server";

import { and, eq, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { clubs, feedEvents, players } from "@/lib/schema";
import { requireLeagueContext } from "@/lib/session";

/**
 * Sign a free agent (player with clubId=null in the same league). Costs
 * 1/5 of the player's market value as a signing-on bonus, plus the
 * player joins on a default 2-year contract.
 *
 * Race-safe: uses an UPDATE-where-clubId-IS-NULL clause; if another club
 * grabbed the player in between (rowCount=0), we bail without taking
 * money.
 */
export async function signFreeAgent(input: { playerId: string }) {
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
  if (p.clubId !== null) {
    return { ok: false as const, error: "Bu oyuncu serbest değil." };
  }

  const fee = Math.round(Number(p.marketValueCents) / 5);
  if (ctx.club.balanceCents < fee) {
    return {
      ok: false as const,
      error: `Bütçe yetersiz (€${(fee / 100 / 1_000_000).toFixed(1)}M imzalama bonusu).`,
    };
  }

  // Pick the lowest free jersey number 1-99
  const squad = await db
    .select({ num: players.jerseyNumber })
    .from(players)
    .where(eq(players.clubId, ctx.club.id));
  const taken = new Set(
    squad.map((s) => s.num).filter((n): n is number => typeof n === "number"),
  );
  let nextJersey: number | null = null;
  for (let n = 1; n <= 99; n++) {
    if (!taken.has(n)) {
      nextJersey = n;
      break;
    }
  }

  // Optimistic claim: only succeed if still a free agent.
  const claimed = await db
    .update(players)
    .set({
      clubId: ctx.club.id,
      status: "active",
      contractYears: 2,
      jerseyNumber: nextJersey ?? p.jerseyNumber,
    })
    .where(and(eq(players.id, p.id), isNull(players.clubId)))
    .returning();
  if (claimed.length === 0) {
    return { ok: false as const, error: "Az önce başkası imzaladı." };
  }

  await db
    .update(clubs)
    .set({ balanceCents: sql`${clubs.balanceCents} - ${fee}` })
    .where(eq(clubs.id, ctx.club.id));
  await db.insert(feedEvents).values({
    leagueId: ctx.league.id,
    clubId: ctx.club.id,
    eventType: "transfer",
    text: `${ctx.club.name} serbest oyuncu ${p.name} ile sözleşme imzaladı.`,
  });

  revalidatePath("/free-agents");
  revalidatePath("/squad");
  revalidatePath("/dashboard");
  return { ok: true as const };
}
