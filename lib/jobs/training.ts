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
import { marketValueCents } from "@/lib/economy";
import { adjustClubBalance } from "@/lib/money";
import { growthChance, type ProgressionContext } from "@/lib/progression";
import { clubs, feedEvents, players } from "@/lib/schema";
import { parseStaffJson } from "@/lib/staff";
import { claimJob } from "./claim";
import {
  PRIMARY_ATTR,
  raisesOverall,
  TRAINABLE,
  type TrainableAttr,
} from "@/lib/attributes";

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
  //
  //    No `overall < potential` filter any more. Potential is a brake, not a
  //    wall (see lib/progression.ts): a player at his ceiling still improves,
  //    four times more slowly. Filtering him out here would have silently
  //    overruled that.
  const trainees = await db
    .select()
    .from(players)
    .where(
      and(
        eq(players.status, "training"),
        ...(leagueFilter ? [leagueFilter] : []),
      ),
    );

  // The training ground and the head coach are what a club spends money on to
  // develop players, so they have to be readable here. One query for every
  // club with a trainee, rather than one per trainee.
  const traineeClubIds = [
    ...new Set(trainees.map((t) => t.clubId).filter((v): v is string => !!v)),
  ];
  const ctxByClub = new Map<string, ProgressionContext>();
  if (traineeClubIds.length > 0) {
    const rows = await db
      .select({
        id: clubs.id,
        trainingLevel: clubs.trainingLevel,
        staffJson: clubs.staffJson,
      })
      .from(clubs)
      .where(inArray(clubs.id, traineeClubIds));
    for (const r of rows) {
      const coach = parseStaffJson(r.staffJson).headCoach;
      ctxByClub.set(r.id, {
        trainingLevel: r.trainingLevel,
        coachTier: coach?.tier ?? 0,
      });
    }
  }
  /*
    A won roll now raises the attribute the manager chose, not just `overall`.

    The match engine reads the attributes far more heavily than the headline:
    a forward is scored `shooting*0.55 + pace*0.20 + physical*0.10 +
    overall*0.15`. Training shooting is therefore worth several times more in a
    match than the +1 overall it also brings — and training a SECONDARY
    attribute is a real alternative rather than a worse version of the same
    thing, because it improves the player in the situations that attribute
    governs without inflating his rating, his market value or his wage.

    `overall` stays stored and authoritative. Deriving it from the attributes
    instead would shift every existing player's rating the moment this shipped,
    and marketValueCents raises (overall − 58) to the power 3.6 — a couple of
    points of drift near 80 is a doubling of the price of every player in every
    live league at once. Not a change to make as a side effect of a training
    feature.

    Batched by (attribute, raises-overall) rather than one write per player:
    six attributes × two cases is at most twelve statements no matter how many
    trainees there are, and this file's header exists because per-row writes
    timed out against Neon at ~4,000 players.
  */
  type Bucket = { ids: string[]; attr: TrainableAttr; bumpOverall: boolean };
  const buckets = new Map<string, Bucket>();
  let promoted = 0;
  /** Winners whose `overall` moved, so their valuation has to move with it. */
  const repriced: Array<{ id: string; overall: number; potential: number; age: number }> = [];

  for (const p of trainees) {
    const ctx = (p.clubId && ctxByClub.get(p.clubId)) || undefined;
    if (Math.random() >= growthChance(p, ctx)) continue;

    // No focus set means the manager never opened the panel; default to the
    // position's primary attribute so an untouched squad still develops the
    // way it used to.
    const focus = (TRAINABLE as readonly string[]).includes(p.trainingFocus ?? "")
      ? (p.trainingFocus as TrainableAttr)
      : (PRIMARY_ATTR[p.position] ?? "physical");
    const bumpOverall = raisesOverall(p.position, focus);
    const key = `${focus}:${bumpOverall}`;
    const bucket = buckets.get(key) ?? { ids: [], attr: focus, bumpOverall };
    bucket.ids.push(p.id);
    buckets.set(key, bucket);
    promoted++;
    if (bumpOverall && p.overall < 99) {
      const overall = p.overall + 1;
      repriced.push({
        id: p.id,
        overall,
        // Keep potential ≥ overall. The UI reads `potential − overall` as
        // remaining growth everywhere; letting it go negative would print
        // "−2 gelişim" on a player who had just improved.
        potential: Math.max(p.potential, overall),
        age: p.age,
      });
    }
  }

  for (const { ids, attr, bumpOverall } of buckets.values()) {
    const column = players[attr];
    await db
      .update(players)
      .set({
        // Attributes are capped at 99 like every other roll (see rollAttr).
        [attr]: sql`LEAST(99, ${column} + 1)`,
        ...(bumpOverall
          ? {
              // 99, not `potential`. The ceiling is a brake in the growth
              // curve, not a clamp here — see lib/progression.ts.
              overall: sql`LEAST(99, ${players.overall} + 1)`,
              potential: sql`GREATEST(${players.potential}, LEAST(99, ${players.overall} + 1))`,
            }
          : {}),
      })
      .where(inArray(players.id, ids));
  }

  /*
    Reprice whoever's rating moved.

    Nothing used to do this, so a youngster who trained from 60 to 85 was
    still listed, offered for and sold at his 60-rated price forever — the
    single most profitable exploit in the game, and the reason
    scripts/reprice-players.ts had to exist as a manual repair.

    Wages are deliberately NOT touched. A player who improves becomes more
    valuable immediately but is still on the contract he signed; his wage
    moves when it is renewed (RENEWAL_WAGE_MULTIPLIER). Raising it here would
    let a club be bankrupted by its own successful academy.

    One statement, not one per player: a CASE over the winners keeps this at a
    single round-trip no matter how many clubs trained today. This file's
    header exists because per-row writes timed out against Neon.
  */
  if (repriced.length > 0) {
    const cases = repriced.map(
      (r) =>
        sql`WHEN ${players.id} = ${r.id} THEN ${marketValueCents(r.overall, r.potential, r.age)}::bigint`,
    );
    await db
      .update(players)
      .set({
        marketValueCents: sql`CASE ${sql.join(cases, sql` `)} ELSE ${players.marketValueCents} END`,
      })
      .where(inArray(players.id, repriced.map((r) => r.id)));
  }

  return { promoted, healed, fitnessBumped };
}

/**
 * The sponsor tick — what is left of the weekly economy.
 *
 * This function used to charge the wage bill, staff salaries and bank
 * interest, and pay the sponsor. Three of those four are gone: wages and
 * contracts were removed from the game (see lib/economy.ts), staff are now a
 * one-off hire, and interest paid the club doing the least with its money.
 *
 * What remains is the sponsor contract, which is the one part that was a
 * decision — you chose the deal, and it pays out over a fixed number of match
 * days with a bonus at the end.
 *
 * RUNS ONCE PER MATCH DAY, not once per calendar week. A round is played every
 * day, so in this game a match day *is* a football week: it is what the
 * fixture list, the sponsor's `weeksLeft` and the league's `weekNumber` all
 * count in.
 *
 * Idempotent per club. This job sweeps every club in the database, so it is
 * exactly the kind of long-running webhook a scheduler retries after a
 * timeout — and a retry used to burn two weeks off every sponsor contract.
 * Each club is claimed with a conditional UPDATE on `lastEconomyRunAt` before
 * any money moves; a second run inside the cooldown matches no rows and skips.
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
  // under a day so the daily cron always claims, but a retry minutes later
  // never double-pays.
  const COOLDOWN_MS = 20 * 3600 * 1000;
  const now = new Date();
  const cutoff = new Date(now.getTime() - COOLDOWN_MS);

  let charged = 0;
  for (const c of allClubs) {
    if (!opts.force) {
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
      if (claimed.length === 0) continue; // already ticked today
    } else {
      await db
        .update(clubs)
        .set({ lastEconomyRunAt: now })
        .where(eq(clubs.id, c.id));
    }
    charged++;

    if (!c.activeSponsorJson) continue;
    let nextSponsorJson: string | null = c.activeSponsorJson;
    let payout = 0;
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
        // Final tick — pay the season bonus and clear the sponsor.
        payout = sp.seasonBonusCents;
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
      // Malformed sponsor JSON — clear it rather than paying out a guess.
      nextSponsorJson = null;
    }

    if (payout > 0) {
      // A signed SQL delta, not an absolute write: a transfer completing
      // between the read above and this line must not be erased.
      await adjustClubBalance(c.id, payout, undefined, {
        kind: "sponsor",
        note: "Sponsor sezon bonusu",
      });
    }
    if (nextSponsorJson !== c.activeSponsorJson) {
      await db
        .update(clubs)
        .set({ activeSponsorJson: nextSponsorJson })
        .where(eq(clubs.id, c.id));
    }
  }
  return { clubs: charged };
}
