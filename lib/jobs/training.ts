/**
 * Daily training + recovery tick, and the weekly economy tick.
 *
 * Both jobs run across every league in the database, so they are written as
 * set-based SQL wherever possible. The previous shape issued one UPDATE per
 * player — roughly 4,000 sequential round-trips at 12 leagues — which on Neon
 * is 4,000 network hops and a guaranteed serverless timeout. Only the genuinely
 * per-row decisions (a random training bump) fall back to individual writes,
 * and those are batched by the value being written.
 */
import { and, eq, inArray, isNotNull, isNull, lte, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { weeklyInterestCents } from "@/lib/economy";
import { adjustClubBalance } from "@/lib/money";
import { clubs, feedEvents, players } from "@/lib/schema";
import { staffById } from "@/lib/staff";
import { claimJob } from "./claim";

export async function runDailyTraining(
  opts: { leagueId?: string; force?: boolean } = {},
) {
  // Injury recovery, fitness regen and the training dice are all once-a-day
  // operations, and unlike the economy tick there is no per-club row to claim
  // them against. The production scheduler sweeps hourly, so without this
  // marker every player would regain fitness and roll for a rating bump
  // twenty-four times a night. `force` and `leagueId` runs are unguarded:
  // tests drive many days in a row, and a single-league call is a deliberate
  // manual action.
  if (!opts.force && !opts.leagueId && !(await claimJob("daily-training"))) {
    return { promoted: 0, healed: 0, fitnessBumped: 0, skipped: true as const };
  }
  const leagueFilter = opts.leagueId
    ? eq(players.leagueId, opts.leagueId)
    : undefined;
  const now = new Date();

  // 1. Injury recovery — one statement for every player whose lay-off ended.
  const healedRows = await db
    .update(players)
    .set({ status: "active", injuryUntil: null })
    .where(
      and(
        eq(players.status, "injured"),
        isNotNull(players.injuryUntil),
        lte(players.injuryUntil, now),
        ...(leagueFilter ? [leagueFilter] : []),
      ),
    )
    .returning();
  const healed = healedRows.length;

  // 2. Fitness regen — one statement for everyone below 100.
  const fitnessRows = await db
    .update(players)
    .set({
      fitness: sql`LEAST(100, ${players.fitness} + 8)`,
    })
    .where(
      and(
        sql`${players.fitness} < 100`,
        ...(leagueFilter ? [leagueFilter] : []),
      ),
    )
    .returning();
  const fitnessBumped = fitnessRows.length;

  // 3. Training progression — genuinely per-player because it is a dice roll,
  //    but only the winners are written, and they go out as a single batched
  //    UPDATE ... WHERE id IN (...).
  const trainees = await db
    .select()
    .from(players)
    .where(
      and(
        eq(players.status, "training"),
        sql`${players.overall} < ${players.potential}`,
        ...(leagueFilter ? [leagueFilter] : []),
      ),
    );
  const promotedIds: string[] = [];
  for (const p of trainees) {
    const ageBonus = p.age <= 19 ? 3 : p.age <= 22 ? 2 : p.age <= 26 ? 1 : 0.5;
    if (Math.random() < (0.35 * ageBonus) / 2) promotedIds.push(p.id);
  }
  if (promotedIds.length > 0) {
    await db
      .update(players)
      .set({ overall: sql`LEAST(${players.potential}, ${players.overall} + 1)` })
      .where(inArray(players.id, promotedIds));
  }

  return { promoted: promotedIds.length, healed, fitnessBumped };
}

/**
 * The wage bill, staff salaries, bank interest and the sponsor tick — one
 * game week's worth.
 *
 * RUNS ONCE PER MATCH DAY, not once per calendar week. A round is played every
 * day, so a match day is this game's football week: it is what the fixture
 * list, the sponsor's `weeksLeft` and the league's `weekNumber` all count in.
 * Charging wages on a real calendar week instead meant a club banked seven
 * match fees against a single wage charge and ran a €23M/week surplus with
 * nothing to spend it on. Income and costs now share one clock.
 *
 * Idempotent per club. This job sweeps every club in the database, so it is
 * exactly the kind of long-running webhook QStash retries after a timeout —
 * and a retry used to charge the wage bill twice and burn two weeks off every
 * sponsor contract. Each club is claimed with a conditional UPDATE on
 * `lastEconomyRunAt` before any money moves; a second run inside the cooldown
 * matches no rows and skips.
 *
 * `force` bypasses the claim for tests that drive many weeks in a row.
 */
export async function runWeeklyEconomy(
  opts: { leagueId?: string; force?: boolean } = {},
) {
  const allClubs = await (opts.leagueId
    ? db.select().from(clubs).where(eq(clubs.leagueId, opts.leagueId))
    : db.select().from(clubs));
  if (allClubs.length === 0) return { clubs: 0 };

  // A tick may not run twice within this window for the same club. Sized just
  // under a day so the daily cron always claims, but a QStash retry minutes
  // later never double-charges.
  const COOLDOWN_MS = 20 * 3600 * 1000;
  const now = new Date();
  const cutoff = new Date(now.getTime() - COOLDOWN_MS);

  // One query for every wage in scope instead of one per club.
  const clubIds = allClubs.map((c) => c.id);
  const wageRows = await db
    .select({ clubId: players.clubId, wage: players.wageCents })
    .from(players)
    .where(inArray(players.clubId, clubIds));
  const wageByClub = new Map<string, number>();
  for (const r of wageRows) {
    if (!r.clubId) continue;
    wageByClub.set(r.clubId, (wageByClub.get(r.clubId) ?? 0) + Number(r.wage));
  }

  let charged = 0;
  for (const c of allClubs) {
    if (!opts.force) {
      // Claim the club for this week's tick before touching its balance.
      const claimed = await db
        .update(clubs)
        .set({ lastEconomyRunAt: now })
        .where(
          and(
            eq(clubs.id, c.id),
            or(
              isNull(clubs.lastEconomyRunAt),
              lte(clubs.lastEconomyRunAt, cutoff),
            ),
          ),
        )
        .returning();
      if (claimed.length === 0) continue; // already charged this week
    } else {
      await db
        .update(clubs)
        .set({ lastEconomyRunAt: now })
        .where(eq(clubs.id, c.id));
    }
    charged++;
    const weeklyWage = wageByClub.get(c.id) ?? 0;
    // Interest only accrues on a positive balance — a club in the red does
    // not earn money for being in the red — and is capped so hoarding cash
    // never out-earns running the club.
    const interest = weeklyInterestCents(c.balanceCents);

    let staffWage = 0;
    if (c.staffJson) {
      try {
        const raw = JSON.parse(c.staffJson) as Partial<{
          headCoach: { id: string };
          physio: { id: string };
          scout: { id: string };
        }>;
        for (const ref of [raw.headCoach, raw.physio, raw.scout]) {
          if (!ref?.id) continue;
          const m = staffById(ref.id);
          if (m) staffWage += m.weeklyWageCents;
        }
      } catch {
        /* malformed staff JSON — treat as no staff */
      }
    }
    let delta = -weeklyWage - staffWage + interest;

    // Sponsor tick
    let nextSponsorJson: string | null = c.activeSponsorJson;
    if (c.activeSponsorJson) {
      try {
        const sp = JSON.parse(c.activeSponsorJson) as {
          name: string;
          payPerMatchCents: number;
          bonusPerWinCents: number;
          seasonBonusCents: number;
          weeksLeft: number;
        };
        const remaining = sp.weeksLeft - 1;
        if (remaining <= 0) {
          // Final tick — pay season bonus and clear sponsor.
          delta += sp.seasonBonusCents;
          nextSponsorJson = null;
          await db.insert(feedEvents).values({
            leagueId: c.leagueId,
            clubId: c.id,
            eventType: "morale",
            text: `${c.name} ${sp.name} sponsorluk dönemini tamamladı — sezon bonusu €${(sp.seasonBonusCents / 100 / 1_000_000).toFixed(1)}M ödendi.`,
          });
        } else {
          nextSponsorJson = JSON.stringify({ ...sp, weeksLeft: remaining });
        }
      } catch {
        // malformed JSON — clear it
        nextSponsorJson = null;
      }
    }

    // Signed SQL delta, not an absolute write: a transfer completing between
    // the read above and this line must not be erased.
    await adjustClubBalance(c.id, delta);
    if (nextSponsorJson !== c.activeSponsorJson) {
      await db
        .update(clubs)
        .set({ activeSponsorJson: nextSponsorJson })
        .where(eq(clubs.id, c.id));
    }
  }
  return { clubs: charged };
}
