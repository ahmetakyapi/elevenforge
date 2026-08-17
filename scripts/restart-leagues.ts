/**
 * Restart every league at season 1, week 1, on the current rules.
 *
 * ─── Why this exists ────────────────────────────────────────────────────
 *
 * A live league accumulates state that outlives the rules that produced it.
 * These leagues were seeded before the attribute model, the value curve, the
 * seven tactic dials, the role-aware power model, the season budget and the
 * market generator existed — so their squads carry attributes rolled by an
 * older table, prices from an older curve, and balances from an economy with
 * a wage bill in it. None of that is recoverable by patching: the numbers are
 * consistent with each other and with a game that is no longer being played.
 *
 * So this rebuilds the league from the packs and starts the season again,
 * WITHOUT destroying the league or anybody's account.
 *
 * ─── What survives ──────────────────────────────────────────────────────
 *
 *   - users: accounts, passwords, which league they are looking at
 *   - leagues: id, name, INVITE CODE, match time, timezone, settings
 *   - clubs: id, owner, name, short name, city, colours, division, and the
 *     tactics their manager chose
 *   - chat
 *
 * Every invite link still works and everyone logs in to the same club. That
 * is the whole constraint this script is written around.
 *
 * ─── What is rebuilt ────────────────────────────────────────────────────
 *
 *   - squads: deleted and regenerated from SQUAD_PACKS through the same
 *     `packPlayerRows` that creates a new league, so attributes, secondary
 *     roles and values all come from the current curves
 *   - fixtures: a fresh double round-robin per division, plus a cup bracket
 *   - balances: the season budget for each club's prestige
 *   - prestige: back to its pack tier, because the current values were earned
 *     across seasons that are about to stop having happened
 *   - the market, scouts, offers, bids, wishlists: cleared, then restocked
 *
 * ─── What is DELETED, deliberately ──────────────────────────────────────
 *
 * Season history, achievements, newspapers, the feed and the ledger. All of
 * them are records OF the seasons being erased: a "Sezon 3 şampiyonu" row in
 * a league that is now in season 1 is not a trophy, it is a contradiction,
 * and `season_history` has a unique key per season that a replayed season 1
 * would collide with.
 *
 * Usage:
 *   npx tsx scripts/restart-leagues.ts                       # dry run
 *   ALLOW_REMOTE_WRITES=1 npx tsx scripts/restart-leagues.ts --apply
 */
import "./load-env";
import { asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../lib/db";
import { seasonBudgetCents } from "../lib/economy";
import { resetClubBalance } from "../lib/money";
import { packPlayerRows, tierFor } from "../lib/league-setup";
import { matchKickoff } from "../lib/match-time";
import { roundRobin } from "../lib/jobs/season";
import { generateCupBracket } from "../lib/jobs/cup";
import { runTransferBots } from "../lib/jobs/transfer-bots";
import { SQUAD_PACKS, SQUAD_PACKS_D2 } from "../lib/squad-packs";
import {
  achievements,
  clubLedger,
  clubs,
  cupFixtures,
  feedEvents,
  fixtures,
  friendlies,
  jobRuns,
  leagues,
  newspapers,
  players,
  pressConferences,
  scouts,
  seasonHistory,
  tacticSpies,
  transferBids,
  transferHistory,
  transferListings,
  transferOffers,
  transferWishlist,
} from "../lib/schema";

const APPLY = process.argv.includes("--apply");

/** Deterministic RNG so a restart is reproducible from the league id. */
function rngFor(seed: string): () => number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return () => {
    h = (h * 1664525 + 1013904223) >>> 0;
    return h / 0xffffffff;
  };
}

async function main() {
  if (APPLY && process.env.ALLOW_REMOTE_WRITES !== "1") {
    console.error(
      "Refusing to write. Re-run with ALLOW_REMOTE_WRITES=1 if you mean it.",
    );
    process.exit(1);
  }

  const leagueRows = await db.select().from(leagues);
  console.log(`${leagueRows.length} lig bulundu\n`);

  for (const L of leagueRows) {
    const clubRows = await db
      .select()
      .from(clubs)
      .where(eq(clubs.leagueId, L.id))
      .orderBy(asc(clubs.createdAt));
    const d1 = clubRows.filter((c) => c.division === 1);
    const d2 = clubRows.filter((c) => c.division === 2);
    const [pc] = await db
      .select({ n: sql<string>`count(*)` })
      .from(players)
      .where(eq(players.leagueId, L.id));
    console.log(
      `  ${L.name}: sezon ${L.seasonNumber} hafta ${L.weekNumber} · ` +
        `${clubRows.length} kulüp (${d1.length}+${d2.length}) · ${pc.n} oyuncu` +
        ` → sezon 1, hafta 0, kadrolar paketlerden yeniden kurulacak`,
    );

    if (!APPLY) continue;

    /*
      Order matters. Players are referenced by listings, offers, bids,
      wishlists, scouts and transfer history, so everything that points at a
      player goes before the players do — the schema cascades on league
      delete, not on a player delete inside a surviving league.
    */
    const clubIds = clubRows.map((c) => c.id);
    await db.delete(transferBids).where(eq(transferBids.leagueId, L.id));
    await db.delete(transferOffers).where(eq(transferOffers.leagueId, L.id));
    await db.delete(transferListings).where(eq(transferListings.leagueId, L.id));
    await db.delete(transferHistory).where(eq(transferHistory.leagueId, L.id));
    if (clubIds.length > 0) {
      await db
        .delete(transferWishlist)
        .where(inArray(transferWishlist.clubId, clubIds));
      await db.delete(friendlies).where(inArray(friendlies.clubId, clubIds));
    }
    await db.delete(scouts).where(eq(scouts.leagueId, L.id));
    await db.delete(tacticSpies).where(eq(tacticSpies.leagueId, L.id));
    await db.delete(pressConferences).where(eq(pressConferences.leagueId, L.id));
    await db.delete(cupFixtures).where(eq(cupFixtures.leagueId, L.id));
    await db.delete(fixtures).where(eq(fixtures.leagueId, L.id));
    await db.delete(newspapers).where(eq(newspapers.leagueId, L.id));
    await db.delete(feedEvents).where(eq(feedEvents.leagueId, L.id));
    await db.delete(seasonHistory).where(eq(seasonHistory.leagueId, L.id));
    await db.delete(achievements).where(eq(achievements.leagueId, L.id));
    await db.delete(clubLedger).where(eq(clubLedger.leagueId, L.id));
    await db.delete(players).where(eq(players.leagueId, L.id));

    // ── Clubs: money, standing and match-day state ────────────────────
    const r = rngFor(L.id);
    const packsFor = (division: 1 | 2) =>
      division === 1 ? SQUAD_PACKS : SQUAD_PACKS_D2;

    for (const division of [1, 2] as const) {
      const inDivision = clubRows.filter((c) => c.division === division);
      const packs = packsFor(division);
      for (let i = 0; i < inDivision.length; i++) {
        const club = inDivision[i];
        const pack = packs[i % packs.length];
        // Prestige returns to the pack's tier. The stored value was earned
        // across seasons that are about to stop having happened, and it is
        // what the opening budget is derived from — carrying it would hand a
        // club money for a history the league no longer has.
        const prestige = tierFor(
          division === 1 ? i : 0,
          division,
        ).prestige;
        // The balance goes through lib/money.ts like every other money write,
        // so the opening budget lands in the ledger and the Finans page has a
        // starting point rather than a balance that appeared from nowhere.
        // The league's ledger was cleared above, so this is its first row.
        await resetClubBalance(club.id, seasonBudgetCents(prestige));
        await db
          .update(clubs)
          .set({
            prestige,
            seasonPoints: 0,
            seasonWins: 0,
            seasonDraws: 0,
            seasonLosses: 0,
            seasonGoalsFor: 0,
            seasonGoalsAgainst: 0,
            morale: 4,
            boardConfidence: 60,
            boardSeasonGoal: "midtable",
            staffJson: null,
            activeSponsorJson: null,
            lastEconomyRunAt: null,
            aiLastRunAt: null,
            // The squad is about to be replaced, so every id in the saved
            // team sheet is about to stop existing. Left alone, the resolver
            // would silently auto-pick for the rest of the season and the
            // manager's arrangement would appear to have been ignored.
            lineupJson: '{"xi":[],"bench":[]}',
            subPlanJson: "[]",
          })
          .where(eq(clubs.id, club.id));

        await db
          .insert(players)
          .values(packPlayerRows(L.id, club.id, pack, r));
      }
    }

    // ── Fixtures: a fresh calendar from today ─────────────────────────
    const now = new Date();
    const fixtureRows: Array<typeof fixtures.$inferInsert> = [];
    for (const division of [1, 2] as const) {
      const ids = clubRows
        .filter((c) => c.division === division)
        .map((c) => c.id);
      if (ids.length < 2) continue;
      const rounds = roundRobin(ids);
      for (let round = 0; round < rounds.length; round++) {
        const scheduled = matchKickoff(now, round + 1, L.matchTime, L.timeZone);
        for (const m of rounds[round]) {
          fixtureRows.push({
            leagueId: L.id,
            seasonNumber: 1,
            weekNumber: round + 1,
            division,
            homeClubId: m.home,
            awayClubId: m.away,
            scheduledAt: scheduled,
            status: "scheduled",
          });
        }
      }
    }
    if (fixtureRows.length > 0) await db.insert(fixtures).values(fixtureRows);

    await db
      .update(leagues)
      .set({
        seasonNumber: 1,
        weekNumber: 0,
        // seasonLength has to match the calendar that was just generated, or
        // the transfer window — which is derived from week/seasonLength as a
        // fraction — opens and shuts at the wrong times all season.
        seasonLength: Math.max(
          1,
          Math.max(...fixtureRows.map((f) => f.weekNumber ?? 1), 1),
        ),
        status: "active",
      })
      .where(eq(leagues.id, L.id));

    await generateCupBracket(L.id, 1).catch(() => {});

    // ── Stock the market on the current generator ─────────────────────
    // Several passes: each tick tops up toward the target and invents at most
    // MAX_NEW_PER_TICK, so one call leaves a half-empty shelf.
    for (let i = 0; i < 5; i++) await runTransferBots({ leagueId: L.id });
  }

  if (!APPLY) {
    console.log("\n(kuru çalışma — uygulamak için --apply)");
    return;
  }

  // Job markers are global, not per league; a stale one would make the first
  // daily tick after the restart skip.
  await db.delete(jobRuns);

  // ── Verify against the database, not against what we think we wrote ──
  console.log("\nDoğrulama:");
  let bad = 0;
  for (const L of await db.select().from(leagues)) {
    const clubRows = await db.select().from(clubs).where(eq(clubs.leagueId, L.id));
    const [pc] = await db
      .select({ n: sql<string>`count(*)` })
      .from(players)
      .where(eq(players.leagueId, L.id));
    const [fx] = await db
      .select({ n: sql<string>`count(*)` })
      .from(fixtures)
      .where(eq(fixtures.leagueId, L.id));
    const [li] = await db
      .select({ n: sql<string>`count(*)` })
      .from(transferListings)
      .where(eq(transferListings.leagueId, L.id));
    const thin = [] as string[];
    for (const c of clubRows) {
      const [n] = await db
        .select({ n: sql<string>`count(*)` })
        .from(players)
        .where(eq(players.clubId, c.id));
      if (Number(n.n) < 14) thin.push(`${c.name}(${n.n})`);
      if (Number(c.balanceCents) !== seasonBudgetCents(c.prestige)) {
        thin.push(`${c.name}(bütçe)`);
      }
    }
    const ok = L.seasonNumber === 1 && L.weekNumber === 0 && thin.length === 0;
    if (!ok) bad++;
    console.log(
      `  ${ok ? "✓" : "✗"} ${L.name}: sezon ${L.seasonNumber} hafta ${L.weekNumber} · ` +
        `${pc.n} oyuncu · ${fx.n} maç · ${li.n} ilan` +
        (thin.length ? ` · SORUN: ${thin.join(", ")}` : ""),
    );
  }
  if (bad > 0) process.exit(1);
  console.log("\n✓ Bütün ligler sezon 1'e alındı.");
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
