/**
 * Scout mechanics:
 *  - sendScout(clubId, params) creates a scout that returns in 2-3h with 3-5
 *    candidates. It was eight hours, which is most of a waking day: send one
 *    in the evening and the report was there the next night, so scouting
 *    happened at most once a day and could not be part of a session. A chief
 *    scout on the payroll now buys speed as well as extra candidates.
 *  - processScoutReturns() activates scouts whose returnsAt has passed, generating
 *    new Player rows (not yet attached to a club) tagged with resultsJson.
 *  - claimScoutPlayer(callerClubId, scoutId, playerIdx) attaches the player to
 *    the club, after checking the scout actually belongs to the caller.
 */
import { and, eq, lt, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { debitClub } from "@/lib/money";
import { attributesFor } from "@/lib/attributes";
import { generatePlayer, inventName, rollSecondaryRoles } from "@/lib/player-gen";
import { seasonProgress } from "@/lib/market-quality";
import {
  findScoutCandidates,
  type ScoutPoolPlayer,
} from "@/lib/scout-pool";
import { marketValueCents, wageFromValueCents } from "@/lib/economy";
import { parseStaffJson } from "@/lib/staff";
import {
  transferWindow,
  windowClosedError,
} from "@/lib/transfer-window";
import { feedEvents, leagues, players, scouts, clubs } from "@/lib/schema";
import type { Position } from "@/types";

const CLAIM_WINDOW_MS = 48 * 3600 * 1000;

// The real-footballer pool moved to lib/scout-pool.ts, where each name
// carries its actual date of birth, position and role. It used to be a bare
// list of names here and everything else about the player was rolled at
// random — so a report could offer a 31-year-old Lamine Yamal. See that
// file's header for the rules on editing it.

type ScoutCandidate = {
  name: string;
  nat: string;
  position: Position;
  role: string;
  secondaryRoles: string[];
  age: number;
  overall: number;
  potential: number;
  pace: number;
  shooting: number;
  passing: number;
  defending: number;
  physical: number;
  goalkeeping: number;
  /**
   * True when this is a real footballer carried from lib/scout-pool.ts with
   * his actual age and position. The report shows the difference, because a
   * name the manager recognises is only worth showing if he can trust what
   * is printed next to it.
   */
  real?: boolean;
  marketValueCents: number;
  wageCents: number;
};

/**
 * How far up the game the club's scouting department can see.
 *
 * A flat 68-80 before, for every scout in every week of every season. That
 * made scouting a fixed-price commodity: you always knew roughly what came
 * back, so there was no reason to send one at any particular moment and no
 * reason to pay for a chief scout.
 *
 * Now the chief scout buys ACCESS. A club with nobody in the role is not told
 * about Kylian Mbappé — not because Mbappé is randomly unavailable, but
 * because nobody at the club is watching that level of football. That reads
 * as a reason to hire someone, which "+1 candidate per report" never did.
 *
 * Season progress widens the window too, on the same curve the transfer
 * market uses, so a scout and a listing in the same week are offering players
 * from the same world.
 */
function scoutReach(
  scoutTier: number,
  weekProgress: number,
  r: () => number,
): { minOverall: number; maxOverall: number; tier: number } {
  const base = 0.34 + scoutTier * 0.11 + weekProgress * 0.22;
  // A long right tail: most reports are solid, a few are the reason you keep
  // sending scouts out.
  const luck = r() < 0.12 ? 0.28 * r() + 0.1 : (r() - 0.5) * 0.22;
  const tier = Math.max(0.08, Math.min(1, base + luck));
  const maxOverall = Math.round(70 + tier * 25); // 72 … 95
  return { minOverall: Math.max(66, maxOverall - 10), maxOverall, tier };
}

/** Turn a real pool entry into a candidate, attributes and price included. */
function realCandidate(p: ScoutPoolPlayer): ScoutCandidate {
  const attrs = attributesFor(p.overall, p.role);
  const value = marketValueCents(p.overall, p.potential, p.age);
  return {
    name: p.name,
    nat: p.nat,
    position: p.position,
    role: p.role,
    secondaryRoles: rollSecondaryRoles(p.role),
    age: p.age,
    overall: p.overall,
    potential: p.potential,
    ...attrs,
    real: true,
    marketValueCents: value,
    wageCents: wageFromValueCents(value),
  };
}

/**
 * Invent one, for when the pool has nobody left who fits the brief.
 *
 * Deliberately given a made-up name rather than borrowing a real one: a real
 * name comes with real facts attached, and the moment we invent an age for a
 * player the manager recognises, the whole report stops being trustworthy.
 */
function inventedCandidate(
  position: Position,
  ageRange: [number, number],
  tier: number,
): ScoutCandidate {
  const { name, nat } = inventName();
  const age =
    ageRange[0] + Math.floor(Math.random() * (ageRange[1] - ageRange[0] + 1));
  const p = generatePlayer({ name, nationality: nat, position, age, tier });
  return {
    name: p.name,
    nat: p.nationality,
    position: p.position,
    role: p.role,
    secondaryRoles: p.secondaryRoles,
    age: p.age,
    overall: p.overall,
    potential: p.potential,
    pace: p.pace,
    shooting: p.shooting,
    passing: p.passing,
    defending: p.defending,
    physical: p.physical,
    goalkeeping: p.goalkeeping,
    real: false,
    marketValueCents: p.marketValueCents,
    wageCents: p.wageCents,
  };
}

/**
 * Base wait for a scout, in hours. Each chief-scout tier takes half an hour
 * off, so a tier-3 scout reports back in 90 minutes — fast enough that hiring
 * one visibly changes how the screen feels to use.
 */
const SCOUT_BASE_HOURS = 3;
const SCOUT_HOURS_PER_TIER = 0.5;

export async function sendScout(params: {
  leagueId: string;
  clubId: string;
  targetNationality: string;
  targetPosition: Position | "ANY";
  ageMin: number;
  ageMax: number;
}) {
  const [club] = await db
    .select({ staffJson: clubs.staffJson })
    .from(clubs)
    .where(eq(clubs.id, params.clubId));
  const tier = parseStaffJson(club?.staffJson ?? null).scout?.tier ?? 0;
  const hours = Math.max(1, SCOUT_BASE_HOURS - tier * SCOUT_HOURS_PER_TIER);
  const returnsAt = new Date(Date.now() + hours * 3600 * 1000);
  const [row] = await db
    .insert(scouts)
    .values({ ...params, returnsAt })
    .returning();
  return row;
}

export async function processScoutReturns(opts: { leagueId?: string } = {}) {
  const now = new Date();

  // Expire any returned scouts whose 48h claim window has passed.
  const claimCutoff = new Date(now.getTime() - CLAIM_WINDOW_MS);
  const stale = await db
    .select()
    .from(scouts)
    .where(
      opts.leagueId
        ? and(
            eq(scouts.leagueId, opts.leagueId),
            eq(scouts.status, "returned"),
            lt(scouts.returnsAt, claimCutoff),
          )
        : and(
            eq(scouts.status, "returned"),
            lt(scouts.returnsAt, claimCutoff),
          ),
    );
  for (const s of stale) {
    await db
      .update(scouts)
      .set({ status: "expired" })
      .where(eq(scouts.id, s.id));
  }

  const active = await db
    .select()
    .from(scouts)
    .where(
      opts.leagueId
        ? and(
            eq(scouts.leagueId, opts.leagueId),
            eq(scouts.status, "active"),
            lte(scouts.returnsAt, now),
          )
        : and(eq(scouts.status, "active"), lte(scouts.returnsAt, now)),
    );

  for (const s of active) {
    // A hired Baş Kaşif buys both more candidates and better ones.
    const [club] = await db
      .select({ staffJson: clubs.staffJson })
      .from(clubs)
      .where(eq(clubs.id, s.clubId));
    const scoutTier = parseStaffJson(club?.staffJson ?? null).scout?.tier ?? 0;
    // Late-season reports are stronger, on the same curve the transfer market
    // uses — a scout and a listing in the same week should be offering players
    // from the same world.
    const [lgRow] = await db
      .select({
        weekNumber: leagues.weekNumber,
        seasonLength: leagues.seasonLength,
      })
      .from(leagues)
      .where(eq(leagues.id, s.leagueId));
    const progress = lgRow ? seasonProgress(lgRow) : 0;
    const positions: Position[] =
      s.targetPosition === "ANY"
        ? ["GK", "DEF", "MID", "FWD"]
        : [s.targetPosition];

    /*
      Three candidates, and you sign one of them.

      It was 3-5 plus the staff tier, which meant a club with a gold chief
      scout got eight names and picked the best — so the choice made itself
      and the report was a formality. Three is a decision: a striker you can
      afford, a teenager who might become one, and a squad player, and you
      only get one.

      The exclusion set is the whole league's roster PLUS everyone already
      named in this club's other reports. Three scouts in the field at once
      have to come back with three different shortlists or they are one
      shortlist printed three times.
    */
    const taken = new Set(
      (
        await db
          .select({ name: players.name })
          .from(players)
          .where(eq(players.leagueId, s.leagueId))
      ).map((r) => r.name),
    );
    const siblingReports = await db
      .select({ resultsJson: scouts.resultsJson })
      .from(scouts)
      .where(and(eq(scouts.clubId, s.clubId), eq(scouts.status, "returned")));
    for (const sib of siblingReports) {
      try {
        for (const c of JSON.parse(sib.resultsJson ?? "[]") as Array<{
          name?: string;
        }>) {
          if (c?.name) taken.add(c.name);
        }
      } catch {
        /* unreadable sibling report — nothing to exclude from it */
      }
    }

    const CANDIDATES_PER_REPORT = 3;
    const results: ScoutCandidate[] = [];
    for (let i = 0; i < CANDIDATES_PER_REPORT; i++) {
      const pos = positions[Math.floor(Math.random() * positions.length)];
      const reach = scoutReach(scoutTier, progress, Math.random);
      const real = findScoutCandidates({
        nat: s.targetNationality,
        position: pos,
        ageMin: s.ageMin,
        ageMax: s.ageMax,
        minOverall: reach.minOverall,
        maxOverall: reach.maxOverall,
        exclude: taken,
        today: now,
      });
      // Real names first — they are the reason a scout screen is interesting.
      // Only when the brief matches nobody left in the pool does the report
      // fall back to an invented player.
      const candidate =
        real.length > 0
          ? realCandidate(real[Math.floor(Math.random() * real.length)])
          : inventedCandidate(pos, [s.ageMin, s.ageMax], reach.tier);
      taken.add(candidate.name);
      results.push(candidate);
    }
    const count = results.length;

    await db
      .update(scouts)
      .set({ status: "returned", resultsJson: JSON.stringify(results) })
      .where(eq(scouts.id, s.id));

    await db.insert(feedEvents).values({
      leagueId: s.leagueId,
      clubId: s.clubId,
      eventType: "scout",
      text: `Kaşif döndü — ${count} aday (${s.targetNationality} · ${s.targetPosition})`,
    });
    // Best-effort push to club owner
    const { dispatchScoutPush } = await import("@/lib/push-dispatch");
    await dispatchScoutPush({ scoutId: s.id }).catch(() => {});
  }

  return { returned: active.length };
}

/**
 * Sign one of a returned scout's candidates.
 *
 * `callerClubId` is derived from the session by the caller and is mandatory:
 * without it any authenticated user could pass someone else's scoutId and
 * charge that club for a player it never asked for.
 *
 * The scout row doubles as the idempotency token — it is flipped to "claimed"
 * with a conditional UPDATE *before* anything is bought, so two concurrent
 * clicks cannot both sign a candidate.
 */
export async function claimScoutPlayer(
  callerClubId: string,
  scoutId: string,
  candidateIndex: number,
): Promise<{ ok: true; playerId: string } | { ok: false; error: string }> {
  const s = (await db.select().from(scouts).where(eq(scouts.id, scoutId)).limit(1))[0];
  if (!s) return { ok: false, error: "Geçersiz kaşif" };
  if (s.clubId !== callerClubId) {
    return { ok: false, error: "Bu kaşif senin değil." };
  }
  if (s.status !== "returned") return { ok: false, error: "Geçersiz kaşif" };

  // Claiming a scouted player adds him to the squad and charges the club for
  // him — that is an acquisition, whatever the route, so it waits for the
  // window like every other one. The scout may still RETURN and its report may
  // still be read while closed; only the signing waits.
  const [lg] = await db
    .select({
      weekNumber: leagues.weekNumber,
      seasonLength: leagues.seasonLength,
    })
    .from(leagues)
    .where(eq(leagues.id, s.leagueId));
  if (lg) {
    const w = transferWindow(lg);
    if (!w.open) return windowClosedError(w);
  }
  if (!s.resultsJson) return { ok: false, error: "Aday yok" };
  let candidates: ScoutCandidate[] = [];
  try {
    const parsed = JSON.parse(s.resultsJson) as ScoutCandidate[];
    if (Array.isArray(parsed)) candidates = parsed;
  } catch {
    return { ok: false, error: "Kaşif raporu okunamadı." };
  }
  if (!Number.isInteger(candidateIndex)) {
    return { ok: false, error: "Aday bulunamadı" };
  }
  const c = candidates[candidateIndex];
  if (!c) return { ok: false, error: "Aday bulunamadı" };

  // Claim the scout first — losing this race means someone already signed.
  const claimed = await db
    .update(scouts)
    .set({ status: "claimed" })
    .where(and(eq(scouts.id, scoutId), eq(scouts.status, "returned")))
    .returning();
  if (claimed.length === 0) {
    return { ok: false, error: "Bu kaşif raporu zaten kullanıldı." };
  }

  // Atomic, overdraft-proof debit. On refusal, hand the scout back so the
  // user can try again once they can afford the fee.
  const paid = await debitClub(s.clubId, c.marketValueCents, undefined, {
    kind: "scout",
    note: c.name,
  });
  if (!paid) {
    await db
      .update(scouts)
      .set({ status: "returned" })
      .where(eq(scouts.id, scoutId));
    return { ok: false, error: "Bütçe yetersiz" };
  }

  const [p] = await db
    .insert(players)
    .values({
      leagueId: s.leagueId,
      clubId: s.clubId,
      name: c.name,
      position: c.position,
      role: c.role,
      age: c.age,
      nationality: c.nat,
      overall: c.overall,
      potential: c.potential,
      // The attributes are carried on the candidate, not re-rolled here.
      // Re-rolling would mean the player you signed was not the player the
      // report described — the scout's whole job is to tell you in advance
      // what you are getting. Reports written before candidates carried
      // attributes fall back to a fresh roll, which is still far better than
      // the schema defaults of 60/30 they would otherwise land on.
      ...(typeof c.pace === "number"
        ? {
            pace: c.pace,
            shooting: c.shooting,
            passing: c.passing,
            defending: c.defending,
            physical: c.physical,
            goalkeeping: c.goalkeeping,
          }
        : attributesFor(c.overall, c.role)),
      secondaryRoles: JSON.stringify(c.secondaryRoles ?? []),
      marketValueCents: c.marketValueCents,
      wageCents: c.wageCents,
    })
    .returning();

  await db
    .update(scouts)
    .set({ claimedPlayerId: p.id })
    .where(eq(scouts.id, scoutId));

  return { ok: true, playerId: p.id };
}
