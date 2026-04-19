"use server";

import { and, desc, eq, gt, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireLeagueContext } from "@/lib/session";
import { db } from "@/lib/db";
import {
  clubs,
  feedEvents,
  fixtures,
  players,
  tacticSpies,
} from "@/lib/schema";

const SPY_COST_CENTS = 100_000_000; // €1M

export type SpyReport = {
  formation: string;
  mentality: number;
  pressing: number;
  tempo: number;
  lineup: Array<{ name: string; role: string; ovr: number; pos: string }>;
  cached: boolean; // true if reused without re-charging
  targetName: string;
};

/**
 * Send a tactic spy at the user's next opponent. Cost: €1M (charged once
 * per fixture). Returns the opponent's current formation, tactic dials,
 * and projected starting XI sorted by overall.
 *
 * Replayable for the same fixture without re-charging — the row is the
 * receipt. Re-running for a different fixture costs again.
 */
export async function sendSpy(): Promise<
  | { ok: true; report: SpyReport }
  | { ok: false; error: string }
> {
  const ctx = await requireLeagueContext();
  const now = new Date();

  // Find the user's next scheduled fixture.
  const upcoming = await db
    .select()
    .from(fixtures)
    .where(
      and(
        eq(fixtures.leagueId, ctx.league.id),
        eq(fixtures.status, "scheduled"),
        gt(fixtures.scheduledAt, now),
        or(
          eq(fixtures.homeClubId, ctx.club.id),
          eq(fixtures.awayClubId, ctx.club.id),
        ),
      ),
    )
    .orderBy(fixtures.scheduledAt)
    .limit(1);
  const next = upcoming[0];
  if (!next) return { ok: false, error: "Önündeki maç yok." };

  const targetId =
    next.homeClubId === ctx.club.id ? next.awayClubId : next.homeClubId;

  const [target] = await db
    .select()
    .from(clubs)
    .where(eq(clubs.id, targetId))
    .limit(1);
  if (!target) return { ok: false, error: "Rakip bulunamadı." };

  // Idempotency: if we already spied this fixture, return the cached row.
  const existing = await db
    .select()
    .from(tacticSpies)
    .where(
      and(
        eq(tacticSpies.fromClubId, ctx.club.id),
        eq(tacticSpies.fixtureId, next.id),
      ),
    )
    .limit(1);
  if (existing.length > 0) {
    const parsed = JSON.parse(existing[0].resultJson);
    return {
      ok: true,
      report: { ...parsed, cached: true, targetName: target.name },
    };
  }

  if (ctx.club.balanceCents < SPY_COST_CENTS) {
    return { ok: false, error: `Bütçe yetersiz (€${SPY_COST_CENTS / 100 / 1_000_000}M gerek).` };
  }

  // Pull opponent's current XI: top-11 by overall, exc. injured/suspended.
  const squad = await db
    .select()
    .from(players)
    .where(eq(players.clubId, target.id));
  const eligible = squad.filter(
    (p) => p.status !== "injured" && p.status !== "suspended",
  );
  const lineup = pickStarters(eligible).map((p) => ({
    name: p.name,
    role: p.role,
    ovr: p.overall,
    pos: p.position,
  }));

  const payload = {
    formation: target.formation,
    mentality: target.mentality,
    pressing: target.pressing,
    tempo: target.tempo,
    lineup,
  };

  // Charge + persist atomically (no-rollback context, so we charge after
  // the insert succeeds — if insert throws, no money was taken).
  await db.insert(tacticSpies).values({
    leagueId: ctx.league.id,
    fromClubId: ctx.club.id,
    targetClubId: target.id,
    fixtureId: next.id,
    resultJson: JSON.stringify(payload),
  });
  await db
    .update(clubs)
    .set({ balanceCents: sql`${clubs.balanceCents} - ${SPY_COST_CENTS}` })
    .where(eq(clubs.id, ctx.club.id));
  await db.insert(feedEvents).values({
    leagueId: ctx.league.id,
    clubId: ctx.club.id,
    eventType: "scout",
    text: `${ctx.club.name} ${target.name} kampına casus yolladı — taktik raporu hazır.`,
  });

  revalidatePath("/dashboard");
  return {
    ok: true,
    report: { ...payload, cached: false, targetName: target.name },
  };
}

/**
 * Same starter selection logic as the match engine, copied locally so the
 * spy report mirrors what'd actually take the field.
 */
function pickStarters(active: Array<typeof players.$inferSelect>) {
  const pickN = (pos: string, n: number) =>
    active
      .filter((p) => p.position === pos)
      .sort((a, b) => b.overall - a.overall)
      .slice(0, n);
  const gk = pickN("GK", 1);
  const def = pickN("DEF", 4);
  const mid = pickN("MID", 4);
  const fwd = pickN("FWD", 2);
  const starters = [...gk, ...def, ...mid, ...fwd];
  if (starters.length < 11) {
    const remaining = active
      .filter((p) => !starters.some((s) => s.id === p.id))
      .sort((a, b) => b.overall - a.overall);
    starters.push(...remaining.slice(0, 11 - starters.length));
  }
  return starters.slice(0, 11);
}

// Avoid unused-import warning
void desc;
