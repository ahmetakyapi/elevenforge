// Must be first: populates process.env from .env.local before anything
// reads it at module load time.
import "./load-env";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "../lib/db";
import { assertLocalDatabase } from "./guard-remote-db";
import { runMatchDay } from "../lib/jobs/match-day";
import { runAiManagers } from "../lib/ai/manager";
import { runWeeklyNewspaper } from "../lib/jobs/newspaper";
import { runPriceDecay } from "../lib/jobs/price-decay";
import { runWeeklyEconomy } from "../lib/jobs/training";
import {
  clubs,
  fixtures,
  leagues,
  newspapers,
  players,
  seasonHistory,
  transferListings,
} from "../lib/schema";

/**
 * Does the league still work after several seasons?
 *
 * Most of the decay bugs only appear on the third or fourth roll: squads
 * drained because retirement deleted players with nothing replacing them,
 * newspapers stopped after season one, prestige inflated until the board
 * sacked everybody, and expired listings left players frozen as 'listed'
 * forever. A single-season test cannot see any of that.
 */
const SEASONS = 4;

/** One round is played per calendar day; the economy cron runs weekly. */
const ROUNDS_PER_WEEK = 7;

/** Rounds played across the whole run, so the weekly job fires weekly. */
let roundsPlayed = 0;

let bad = 0;
const ok = (cond: boolean, msg: string) => {
  if (cond) console.log(`  ✓ ${msg}`);
  else {
    console.error(`  ✗ ${msg}`);
    bad++;
  }
};

/**
 * Play exactly one season, a week at a time.
 *
 * Week-by-week matters: pulling every fixture into the past at once makes
 * runMatchDay play the whole season in a single call, which skips the
 * between-rounds jobs entirely — the AI never gets a turn, no newspaper is
 * ever produced, and the wage bill is charged once instead of thirty times.
 * Stops as soon as the season counter rolls.
 */
async function playSeason(leagueId: string): Promise<void> {
  const [before] = await db
    .select()
    .from(leagues)
    .where(eq(leagues.id, leagueId));
  const season = before.seasonNumber;

  for (let guard = 0; guard < 80; guard++) {
    const next = await db
      .select({ week: fixtures.weekNumber })
      .from(fixtures)
      .where(
        and(
          eq(fixtures.leagueId, leagueId),
          eq(fixtures.seasonNumber, season),
          eq(fixtures.status, "scheduled"),
        ),
      )
      .orderBy(fixtures.weekNumber)
      .limit(1);
    if (next.length === 0) return;

    // Bring only this round forward, leaving later rounds in the future.
    await db
      .update(fixtures)
      .set({ scheduledAt: new Date(Date.now() - 60_000) })
      .where(
        and(
          eq(fixtures.leagueId, leagueId),
          eq(fixtures.seasonNumber, season),
          eq(fixtures.weekNumber, next[0].week),
          eq(fixtures.status, "scheduled"),
        ),
      );
    await runMatchDay({ leagueId });
    await runAiManagers({ leagueId, force: true });
    await runWeeklyNewspaper({ leagueId });
    await runPriceDecay({ leagueId });

    // The economy job is WEEKLY in production (README: /api/cron/economy,
    // haftada bir) while a round is played every day. Calling it once per
    // round charged the wage bill seven times over and made the league look
    // bankrupt — the mirror image of the gate-receipt bug it was supposed to
    // be measuring. Model the real cadence instead.
    roundsPlayed++;
    if (roundsPlayed % ROUNDS_PER_WEEK === 0) {
      await runWeeklyEconomy({ leagueId, force: true });
    }

    const [now] = await db
      .select()
      .from(leagues)
      .where(eq(leagues.id, leagueId));
    if (now.seasonNumber !== season) return; // rolled
  }
}

async function main() {
  assertLocalDatabase("test-longevity");
  const [league] = await db.select().from(leagues).limit(1);
  if (!league) throw new Error("seed first");
  const leagueId = league.id;
  const startSeason = league.seasonNumber;

  // Snapshot who starts in the top flight so promotion can be detected.
  const startTop = await db
    .select({ id: clubs.id })
    .from(clubs)
    .where(and(eq(clubs.leagueId, leagueId), eq(clubs.division, 1)));
  const startD1 = new Set(startTop.map((c) => c.id));
  const startD1Size = startTop.length;

  console.log(`\n=== Simulating ${SEASONS} seasons ===`);
  for (let i = 0; i < SEASONS; i++) {
    await playSeason(leagueId);
    const [lg] = await db.select().from(leagues).where(eq(leagues.id, leagueId));
    const squads = await db
      .select({ clubId: players.clubId })
      .from(players)
      .where(eq(players.leagueId, leagueId));
    const perClub = new Map<string, number>();
    for (const p of squads) {
      if (p.clubId) perClub.set(p.clubId, (perClub.get(p.clubId) ?? 0) + 1);
    }
    const sizes = [...perClub.values()];
    const freeAgents = squads.filter((p) => !p.clubId).length;
    console.log(
      `  season ${lg.seasonNumber - 1} done → total ${squads.length} players, ` +
        `squads ${Math.min(...sizes)}-${Math.max(...sizes)}, free agents ${freeAgents}`,
    );
  }

  console.log("\n=== Invariants after 4 seasons ===");

  // 1. Every club can still field a team.
  const allClubs = await db
    .select()
    .from(clubs)
    .where(eq(clubs.leagueId, leagueId));
  let thin = 0;
  let noKeeper = 0;
  for (const c of allClubs) {
    const squad = await db
      .select({ position: players.position })
      .from(players)
      .where(eq(players.clubId, c.id));
    if (squad.length < 14) thin++;
    if (!squad.some((p) => p.position === "GK")) noKeeper++;
  }
  ok(thin === 0, `every club has 14+ players (${thin} too thin)`);
  ok(noKeeper === 0, `every club has a goalkeeper (${noKeeper} without)`);

  // 2. Newspapers kept being produced (the season-2 regression).
  const papers = await db
    .select({ season: newspapers.seasonNumber })
    .from(newspapers)
    .where(eq(newspapers.leagueId, leagueId));
  const paperSeasons = new Set(papers.map((p) => p.season));
  ok(
    paperSeasons.size >= SEASONS - 1,
    `newspapers exist for ${paperSeasons.size} seasons (${[...paperSeasons].sort().join(",")})`,
  );

  // 3. Season history archived every completed season.
  const hist = await db
    .select({ season: seasonHistory.seasonNumber })
    .from(seasonHistory)
    .where(eq(seasonHistory.leagueId, leagueId));
  const histSeasons = new Set(hist.map((h) => h.season));
  ok(
    histSeasons.size === SEASONS,
    `season history archived for ${histSeasons.size}/${SEASONS} seasons`,
  );

  // 4. Prestige has not collapsed into "everyone is a champion club".
  const prestiges = allClubs.map((c) => c.prestige);
  const championTier = prestiges.filter((p) => p >= 80).length;
  ok(
    championTier <= 4,
    `only ${championTier} clubs on a champion-level board goal (range ${Math.min(...prestiges)}-${Math.max(...prestiges)})`,
  );

  // 5. Nobody is stranded as 'listed' without an open listing.
  const listed = await db
    .select({ id: players.id })
    .from(players)
    .where(and(eq(players.leagueId, leagueId), eq(players.status, "listed")));
  const open = await db
    .select({ playerId: transferListings.playerId })
    .from(transferListings)
    .where(
      and(
        eq(transferListings.leagueId, leagueId),
        eq(transferListings.status, "active"),
      ),
    );
  const openSet = new Set(open.map((o) => o.playerId));
  const stranded = listed.filter((p) => !openSet.has(p.id)).length;
  ok(stranded === 0, `no players stranded as 'listed' (${stranded} found)`);

  // 6. Fixtures were generated for the new season and are in the future.
  const [lgFinal] = await db.select().from(leagues).where(eq(leagues.id, leagueId));
  const upcoming = await db
    .select({ scheduledAt: fixtures.scheduledAt })
    .from(fixtures)
    .where(
      and(
        eq(fixtures.leagueId, leagueId),
        eq(fixtures.seasonNumber, lgFinal.seasonNumber),
        eq(fixtures.status, "scheduled"),
      ),
    )
    .orderBy(fixtures.scheduledAt);
  ok(upcoming.length > 0, `next season has ${upcoming.length} fixtures scheduled`);
  ok(
    lgFinal.seasonNumber === startSeason + SEASONS,
    `season counter advanced ${startSeason} → ${lgFinal.seasonNumber}`,
  );

  // 7. Kick-off times land on the league's chosen local hour.
  if (upcoming.length > 0) {
    const hour = new Intl.DateTimeFormat("en-GB", {
      timeZone: lgFinal.timeZone,
      hour: "2-digit",
      hour12: false,
    }).format(upcoming[0].scheduledAt);
    const want = lgFinal.matchTime.split(":")[0];
    ok(
      Number(hour) === Number(want),
      `kick-off is ${hour}:00 in ${lgFinal.timeZone}, league set ${lgFinal.matchTime}`,
    );
  }

  // 8. Nobody is carrying a permanent suspension across the summer.
  const stuck = await db
    .select({ id: players.id })
    .from(players)
    .where(and(eq(players.leagueId, leagueId), eq(players.status, "suspended")));
  ok(stuck.length === 0, `no players stuck suspended into a new season (${stuck.length})`);

  // 9. Money did not run away in either direction.
  const balances = allClubs.map((c) => Number(c.balanceCents) / 100 / 1e6);
  const broke = balances.filter((b) => b < -50).length;
  console.log(
    `    balances €${Math.min(...balances).toFixed(0)}M .. €${Math.max(...balances).toFixed(0)}M`,
  );
  ok(broke === 0, `no club is worse than -€50M (${broke} bankrupt)`);

  // 10. Promotion and relegation actually moved clubs between the tiers.
  //
  // Without a second division the board goal "Küme düşmemek" was
  // unfailable — there was nowhere to go down to — so the bottom of the
  // table had nothing at stake.
  const d1 = allClubs.filter((c) => c.division === 1);
  const d2 = allClubs.filter((c) => c.division === 2);
  ok(d1.length > 0 && d2.length > 0, `both tiers populated (${d1.length} / ${d2.length})`);
  ok(
    d1.length === startD1Size,
    `top flight still holds ${startD1Size} clubs (has ${d1.length})`,
  );
  const movedUp = d1.filter((c) => !startD1.has(c.id)).length;
  const movedDown = d2.filter((c) => startD1.has(c.id)).length;
  ok(movedUp > 0, `${movedUp} clubs promoted into the top flight over ${SEASONS} seasons`);
  ok(movedDown > 0, `${movedDown} clubs relegated out of it`);
  ok(movedUp === movedDown, `promotions match relegations (${movedUp} vs ${movedDown})`);

  const promotedRows = await db
    .select({ id: seasonHistory.id })
    .from(seasonHistory)
    .where(and(eq(seasonHistory.leagueId, leagueId), eq(seasonHistory.promoted, true)));
  ok(promotedRows.length > 0, `season history records ${promotedRows.length} promotions`);

  // Every division must still have its own complete calendar.
  const d2Fixtures = await db
    .select({ id: fixtures.id })
    .from(fixtures)
    .where(
      and(
        eq(fixtures.leagueId, leagueId),
        eq(fixtures.seasonNumber, lgFinal.seasonNumber),
        eq(fixtures.division, 2),
      ),
    );
  ok(d2Fixtures.length > 0, `second division has ${d2Fixtures.length} fixtures next season`);

  // 11. Free-agent pool refills so the AI always has cover to sign.
  const fa = await db
    .select({ id: players.id })
    .from(players)
    .where(and(eq(players.leagueId, leagueId), isNull(players.clubId)));
  ok(fa.length > 0, `free-agent pool is non-empty (${fa.length})`);

  console.log(bad === 0 ? "\n✅ LONGEVITY CHECKS PASS" : `\n✗ ${bad} VIOLATIONS`);
  process.exit(bad === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
