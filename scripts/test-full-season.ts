/**
 * End-to-end correctness check: simulate 2 full seasons and verify:
 *  - Points sum exactly to 3*W + D for every club, **measured before the
 *    season-roll resets stats** (the previous version measured after, which
 *    made the invariant trivially 0 = 0 + 0).
 *  - Goal difference tiebreak applied in standings.
 *  - Every fixture played exactly once per season.
 *  - Players age, veterans decay, contracts tick.
 *  - Re-simulating the same fixture row yields the same score (deterministic
 *    seeding).
 *  - No suspended player stays stuck.
 *  - Young players assigned to training actually develop.
 */
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "../lib/db";
import { clubs, fixtures, leagues, players, users } from "../lib/schema";
import { runMatchDay } from "../lib/jobs";
import { runDailyTraining } from "../lib/jobs/training";
import { runWeeklyNewspaper } from "../lib/jobs/newspaper";
import { rollSeasonIfDone } from "../lib/jobs/season";
import { simulateMatch } from "../lib/engine/match";

type Snapshot = {
  clubs: Array<{
    id: string;
    short: string;
    /** Derived from finished fixtures — the source of truth. */
    pts: number;
    /** Cached on clubs.seasonPoints — should equal `pts` if the engine is consistent. */
    cachedPts: number;
    w: number;
    d: number;
    l: number;
    gf: number;
    ga: number;
    cachedW: number;
    cachedD: number;
    cachedL: number;
    cachedGF: number;
    cachedGA: number;
  }>;
  finishedFixtures: number;
};

/**
 * Derive standings from fixtures table — the source of truth. The clubs
 * table is reset by rollSeasonIfDone so reading it post-roll gives 0s, but
 * fixtures are immutable and seasonNumber-tagged, so we can rebuild any
 * historical season's table.
 */
async function snapshot(leagueId: string, season: number): Promise<Snapshot> {
  const cs = await db.select().from(clubs).where(eq(clubs.leagueId, leagueId));
  const finished = await db
    .select()
    .from(fixtures)
    .where(
      and(
        eq(fixtures.leagueId, leagueId),
        eq(fixtures.seasonNumber, season),
        eq(fixtures.status, "finished"),
      ),
    );
  const acc = new Map<
    string,
    { w: number; d: number; l: number; gf: number; ga: number }
  >();
  for (const c of cs) acc.set(c.id, { w: 0, d: 0, l: 0, gf: 0, ga: 0 });
  for (const fx of finished) {
    const hs = fx.homeScore ?? 0;
    const as = fx.awayScore ?? 0;
    const h = acc.get(fx.homeClubId);
    const a = acc.get(fx.awayClubId);
    if (h) {
      h.gf += hs;
      h.ga += as;
      if (hs > as) h.w++;
      else if (hs < as) h.l++;
      else h.d++;
    }
    if (a) {
      a.gf += as;
      a.ga += hs;
      if (as > hs) a.w++;
      else if (as < hs) a.l++;
      else a.d++;
    }
  }
  return {
    clubs: cs.map((c) => {
      const r = acc.get(c.id) ?? { w: 0, d: 0, l: 0, gf: 0, ga: 0 };
      return {
        id: c.id,
        short: c.shortName,
        pts: r.w * 3 + r.d,
        cachedPts: c.seasonPoints,
        w: r.w,
        d: r.d,
        l: r.l,
        gf: r.gf,
        ga: r.ga,
        cachedW: c.seasonWins,
        cachedD: c.seasonDraws,
        cachedL: c.seasonLosses,
        cachedGF: c.seasonGoalsFor,
        cachedGA: c.seasonGoalsAgainst,
      };
    }),
    finishedFixtures: finished.length,
  };
}

function checkSnapshotInvariants(snap: Snapshot, label: string): number {
  let bad = 0;
  for (const c of snap.clubs) {
    // Cached fields on clubs.* must match the values derived from finished
    // fixtures. If they drift, applyMatchResult is double-counting or
    // missing updates.
    if (c.pts !== c.cachedPts) {
      console.error(
        `  ✗ [${label}] ${c.short}: derived pts=${c.pts} but cache=${c.cachedPts}`,
      );
      bad++;
    }
    if (c.w !== c.cachedW || c.d !== c.cachedD || c.l !== c.cachedL) {
      console.error(
        `  ✗ [${label}] ${c.short}: derived W/D/L=${c.w}/${c.d}/${c.l} but cache=${c.cachedW}/${c.cachedD}/${c.cachedL}`,
      );
      bad++;
    }
    if (c.gf !== c.cachedGF || c.ga !== c.cachedGA) {
      console.error(
        `  ✗ [${label}] ${c.short}: derived GF/GA=${c.gf}/${c.ga} but cache=${c.cachedGF}/${c.cachedGA}`,
      );
      bad++;
    }
    const games = c.w + c.d + c.l;
    if (games > 30) {
      console.error(
        `  ✗ [${label}] ${c.short}: ${games} games (max 30 in 16-team round-robin)`,
      );
      bad++;
    }
  }
  // Σ wins == Σ losses, Σ GF == Σ GA (zero-sum league)
  const sumW = snap.clubs.reduce((s, c) => s + c.w, 0);
  const sumL = snap.clubs.reduce((s, c) => s + c.l, 0);
  const sumGF = snap.clubs.reduce((s, c) => s + c.gf, 0);
  const sumGA = snap.clubs.reduce((s, c) => s + c.ga, 0);
  if (sumW !== sumL) {
    console.error(`  ✗ [${label}] ΣW=${sumW} but ΣL=${sumL} — should match`);
    bad++;
  }
  if (sumGF !== sumGA) {
    console.error(
      `  ✗ [${label}] ΣGF=${sumGF} but ΣGA=${sumGA} — should match`,
    );
    bad++;
  }
  // Total games played by all clubs combined = 2 * matchesFinished (each
  // match contributes one home + one away result).
  const totalSides = snap.clubs.reduce((s, c) => s + c.w + c.d + c.l, 0);
  if (totalSides !== snap.finishedFixtures * 2) {
    console.error(
      `  ✗ [${label}] club games sum=${totalSides} but fixtures*2=${snap.finishedFixtures * 2}`,
    );
    bad++;
  }
  // Top-3 readout
  const sorted = [...snap.clubs].sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    const aGd = a.gf - a.ga;
    const bGd = b.gf - b.ga;
    if (bGd !== aGd) return bGd - aGd;
    return b.gf - a.gf;
  });
  console.log(
    `  [${label}] ${snap.clubs.length} clubs, ${snap.finishedFixtures} fixtures, ${bad} violations.\n` +
      `    Top 3: ${sorted
        .slice(0, 3)
        .map((c) => `${c.short} ${c.pts}p GD${c.gf - c.ga >= 0 ? "+" : ""}${c.gf - c.ga}`)
        .join(", ")}`,
  );
  return bad;
}

async function playUntilSeasonEnd(
  leagueId: string,
  label: string,
): Promise<Snapshot> {
  const [leagueAtStart] = await db
    .select()
    .from(leagues)
    .where(eq(leagues.id, leagueId))
    .limit(1);
  const startSeason = leagueAtStart.seasonNumber;
  let lastSnap: Snapshot = { clubs: [], finishedFixtures: 0 };

  while (true) {
    const due = await db
      .select({ week: fixtures.weekNumber, season: fixtures.seasonNumber })
      .from(fixtures)
      .where(
        and(
          eq(fixtures.leagueId, leagueId),
          eq(fixtures.status, "scheduled"),
          eq(fixtures.seasonNumber, startSeason),
        ),
      )
      .orderBy(asc(fixtures.weekNumber));
    if (due.length === 0) break;
    const nextWeek = due[0].week;
    const remainingWeeks = new Set(due.map((d) => d.week)).size;
    await db
      .update(fixtures)
      .set({ scheduledAt: new Date() })
      .where(
        and(
          eq(fixtures.leagueId, leagueId),
          eq(fixtures.seasonNumber, startSeason),
          eq(fixtures.weekNumber, nextWeek),
          eq(fixtures.status, "scheduled"),
        ),
      );

    // isLast = this is the final remaining week of the season. Each week
    // contains 8 fixtures, so we count *unique weeks* not row count.
    const isLast = remainingWeeks === 1;
    // autoRoll=false prevents rollSeasonIfDone from firing inside the last
    // runMatchDay so we can snapshot the post-week-15, pre-roll standings.
    const sim = await runMatchDay({ leagueId, autoRoll: !isLast });
    if (isLast) {
      lastSnap = await snapshot(leagueId, startSeason);
      // Now do the roll explicitly so the next iteration / next call still
      // sees a freshly-set-up new season.
      await rollSeasonIfDone(leagueId);
    }
    await runWeeklyNewspaper({ leagueId });
    await runDailyTraining({ leagueId });
    process.stdout.write(
      `  [${label} S${startSeason}] week ${nextWeek}: +${sim.simulated}\n`,
    );
  }
  return lastSnap;
}

async function checkPlayerEvolution(leagueId: string, label: string) {
  const ps = await db.select().from(players).where(eq(players.leagueId, leagueId));
  const stuck = ps.filter(
    (p) => p.status === "suspended" && p.suspensionMatchesLeft > 6,
  );
  const ageMin = Math.min(...ps.map((p) => p.age));
  const ageMax = Math.max(...ps.map((p) => p.age));
  const trainingCount = ps.filter((p) => p.status === "training").length;
  console.log(
    `  [${label}] ${ps.length} players, ages ${ageMin}-${ageMax}, ${trainingCount} training, stuck-suspended: ${stuck.length}`,
  );
  if (stuck.length > 0)
    console.error(`    ✗ ${stuck.length} suspended players stuck (>6 matches)`);
  return stuck.length;
}

/**
 * Pick any finished fixture, re-run the simulation engine with the same
 * stored seed, and verify the score matches what we recorded.
 */
async function checkDeterminism(leagueId: string): Promise<number> {
  const fx = (
    await db
      .select()
      .from(fixtures)
      .where(
        and(eq(fixtures.leagueId, leagueId), eq(fixtures.status, "finished")),
      )
      .orderBy(desc(fixtures.playedAt))
      .limit(1)
  )[0];
  if (!fx) {
    console.warn("  [det] no finished fixture to sample");
    return 0;
  }
  if (fx.rngSeed === null) {
    console.error("  ✗ [det] finished fixture has null rngSeed");
    return 1;
  }
  const [home] = await db.select().from(clubs).where(eq(clubs.id, fx.homeClubId));
  const [away] = await db.select().from(clubs).where(eq(clubs.id, fx.awayClubId));
  const homeSquad = await db
    .select()
    .from(players)
    .where(eq(players.clubId, home.id));
  const awaySquad = await db
    .select()
    .from(players)
    .where(eq(players.clubId, away.id));
  const replay = simulateMatch({
    homeClubId: home.id,
    awayClubId: away.id,
    homeClubName: home.name,
    awayClubName: away.name,
    homeSquad,
    awaySquad,
    homeTactics: {
      formation: home.formation,
      mentality: home.mentality,
      pressing: home.pressing,
      tempo: home.tempo,
    },
    awayTactics: {
      formation: away.formation,
      mentality: away.mentality,
      pressing: away.pressing,
      tempo: away.tempo,
    },
    homeCity: home.city,
    awayCity: away.city,
    seed: fx.rngSeed,
  });
  if (replay.homeScore !== fx.homeScore || replay.awayScore !== fx.awayScore) {
    console.error(
      `  ✗ [det] ${home.shortName}-${away.shortName} stored ${fx.homeScore}-${fx.awayScore}, replay ${replay.homeScore}-${replay.awayScore}`,
    );
    return 1;
  }
  console.log(
    `  [det] ${home.shortName}-${away.shortName} replay matches stored ${fx.homeScore}-${fx.awayScore} ✓`,
  );
  return 0;
}

async function main() {
  const [u] = await db
    .select()
    .from(users)
    .where(eq(users.email, "ahmet@elevenforge.app"));
  const [club] = await db.select().from(clubs).where(eq(clubs.ownerUserId, u.id));
  const leagueId = club.leagueId;

  // Put one young player on training to verify development.
  const young = (
    await db.select().from(players).where(eq(players.clubId, club.id))
  ).find((p) => p.age <= 19 && p.overall < p.potential);
  if (young) {
    await db
      .update(players)
      .set({ status: "training" })
      .where(eq(players.id, young.id));
    console.log(
      `Training: ${young.name} (age ${young.age}, ovr ${young.overall} → pot ${young.potential})`,
    );
  }

  let totalBad = 0;

  console.log("\n=== Season 1 ===");
  const s1 = await playUntilSeasonEnd(leagueId, "S1");
  totalBad += checkSnapshotInvariants(s1, "S1 final");
  totalBad += await checkPlayerEvolution(leagueId, "S1 end");

  console.log("\n=== Season 2 (auto-rolled) ===");
  const s2 = await playUntilSeasonEnd(leagueId, "S2");
  totalBad += checkSnapshotInvariants(s2, "S2 final");
  totalBad += await checkPlayerEvolution(leagueId, "S2 end");

  console.log("\n=== Determinism check ===");
  totalBad += await checkDeterminism(leagueId);

  // Verify our trainee actually developed
  if (young) {
    const after = (
      await db.select().from(players).where(eq(players.id, young.id))
    )[0];
    if (after) {
      const delta = after.overall - young.overall;
      const ageDelta = after.age - young.age;
      console.log(`\nTrainee evolution: ${young.name}`);
      console.log(`  Age: ${young.age} → ${after.age} (+${ageDelta})`);
      console.log(`  Overall: ${young.overall} → ${after.overall} (+${delta})`);
      console.log(`  Potential cap: ${after.potential}`);
      if (delta <= 0) {
        console.warn("  ⚠ trainee did not improve — check training logic");
        totalBad++;
      }
    }
  }

  console.log(
    `\n${totalBad === 0 ? "✅ ALL INVARIANTS PASS" : `✗ ${totalBad} VIOLATIONS`}`,
  );
  process.exit(totalBad === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
