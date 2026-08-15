"use server";

import { and, desc, eq, gt, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireLeagueContext } from "@/lib/session";
import { parseLineup, resolveLineup } from "@/lib/lineup";
import { creditClub, debitClub } from "@/lib/money";
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

  // The opponent's ACTUAL projected XI.
  //
  // This used to re-derive the eleven with a private copy of the old
  // top-11-by-overall logic, hardcoded to 4-4-2 — so a €1M intelligence
  // report showed a back four against a side that plays 5-3-2, and ignored
  // the manager's saved team sheet entirely. Sharing resolveLineup means the
  // report is exactly what will take the field.
  const squad = await db
    .select()
    .from(players)
    .where(eq(players.clubId, target.id));
  const resolved = resolveLineup(
    squad,
    target.formation,
    parseLineup(target.lineupJson),
  );
  const lineup = resolved.starters.map((p) => ({
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

  // Charge first with a guarded debit — the balance read above is a session
  // snapshot and two clicks could both pass it. Refund if the receipt row
  // cannot be written (unique index on club+fixture), so a duplicate request
  // never costs the manager twice.
  const paid = await debitClub(ctx.club.id, SPY_COST_CENTS, undefined, {
    kind: "scout",
    note: "Casus raporu",
  });
  if (!paid) {
    return {
      ok: false,
      error: `Bütçe yetersiz (€${SPY_COST_CENTS / 100 / 1_000_000}M gerek).`,
    };
  }
  try {
    await db.insert(tacticSpies).values({
      leagueId: ctx.league.id,
      fromClubId: ctx.club.id,
      targetClubId: target.id,
      fixtureId: next.id,
      resultJson: JSON.stringify(payload),
    });
  } catch {
    await creditClub(ctx.club.id, SPY_COST_CENTS, undefined, {
      kind: "transfer_refund",
      note: "Casus iadesi",
    });
    return { ok: false, error: "Bu maç için zaten casus gönderdin." };
  }
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

// Avoid unused-import warning
void desc;
