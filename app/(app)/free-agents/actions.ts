"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { feedEvents, players } from "@/lib/schema";
import { FREE_AGENT_FEE_RATE } from "@/lib/economy";
import { creditClub, debitClub } from "@/lib/money";
import { requireLeagueContext } from "@/lib/session";
import {
  transferWindow,
  windowClosedError,
} from "@/lib/transfer-window";

/**
 * Sign a free agent (player with clubId=null in the same league). Costs
 * FREE_AGENT_FEE_RATE of the player's market value as a signing-on bonus, plus the
 * player joins on a default 2-year contract.
 *
 * Race-safe: uses an UPDATE-where-clubId-IS-NULL clause; if another club
 * grabbed the player in between (rowCount=0), we bail without taking
 * money.
 */
export async function signFreeAgent(input: { playerId: string }) {
  const ctx = await requireLeagueContext();
  // Transfer window. Actions that ACQUIRE or LIST a player are gated; actions
  // that unwind a commitment (withdrawing a listing, a bid or an offer) stay
  // open, because trapping someone in a deal they no longer want is not what
  // a closed window means.
  {
    const w = transferWindow(ctx.league);
    if (!w.open) return windowClosedError(w) as { ok: false; error: string };
  }
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

  // A signing-on fee, not a bargain bin. At FREE_AGENT_FEE_RATE of market value a free agent
  // could be signed and immediately relisted at the top of the allowed band
  // for several times what he cost.
  const fee = Math.round(Number(p.marketValueCents) * FREE_AGENT_FEE_RATE);

  // Charge first, with a guarded debit. `ctx.club.balanceCents` is a snapshot
  // taken at the start of the request, so two parallel signings of two
  // different free agents both passed the old check and both debited — the
  // club ended up in the red holding both players. Paying before the claim
  // (and refunding a lost race below) also means a refused payment can never
  // leave the club holding the player for free.
  const paid = await debitClub(ctx.club.id, fee, undefined, {
    kind: "free_agent_fee",
    note: p.name,
  });
  if (!paid) {
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
    // Lost the race — hand the money back.
    await creditClub(ctx.club.id, fee, undefined, {
      kind: "transfer_refund",
      note: p.name,
    });
    return { ok: false as const, error: "Az önce başkası imzaladı." };
  }
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
