/**
 * Season lifecycle:
 *  - rollSeasonIfDone(leagueId): if the league has no more scheduled fixtures,
 *    bump the season number, reset per-club stats, age players + decay the
 *    veterans, re-generate a fresh single round-robin fixture schedule.
 */
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  marketValueCents,
  SEASON_PRIZES_CENTS,
  wageFromValueCents,
} from "@/lib/economy";
import { creditClub } from "@/lib/money";
import {
  clubs,
  cupFixtures,
  feedEvents,
  fixtures,
  leagues,
  players,
  seasonHistory,
} from "@/lib/schema";
import { assignSeasonGoals, evaluateBoardConfidence } from "./board";
import { generateCupBracket } from "./cup";
import { evaluateSeasonAchievements } from "./achievements";
import { backfillThinSquads, generateYouthIntake } from "./youth";
import {
  closeMarketForSeasonRoll,
  type MarketResetResult,
} from "./market-reset";
import { matchKickoff } from "@/lib/match-time";
import { sortStandings } from "@/lib/standings";
import { applyPromotionRelegation, PROMOTION_SLOTS } from "./promotion";

/**
 * Full double round-robin: every club plays every other club twice, once at
 * home and once away.
 *
 * The old version generated a single circle (15 rounds for 16 clubs) and
 * alternated home/away by round parity, which left the fixed team in the
 * rotation — and any club drawn against it — with a permanently lopsided
 * split: four clubs got 6 home games and 9 away, every single season. A
 * mirrored second half makes the schedule exactly fair by construction.
 */
export function roundRobin(teamIds: string[]) {
  const teams = teamIds.slice();
  if (teams.length % 2 !== 0) teams.push("BYE");
  const firstHalf: Array<Array<{ home: string; away: string }>> = [];
  const half = teams.length / 2;
  let arr = teams.slice();
  for (let r = 0; r < teams.length - 1; r++) {
    const matches: Array<{ home: string; away: string }> = [];
    for (let i = 0; i < half; i++) {
      const t1 = arr[i];
      const t2 = arr[arr.length - 1 - i];
      if (t1 !== "BYE" && t2 !== "BYE") {
        // Alternating the orientation of each pairing by both round and slot
        // keeps the per-club home/away counts balanced across the half.
        matches.push(
          (r + i) % 2 === 0 ? { home: t1, away: t2 } : { home: t2, away: t1 },
        );
      }
    }
    firstHalf.push(matches);
    const first = arr[0];
    const rest = arr.slice(1);
    rest.unshift(rest.pop()!);
    arr = [first, ...rest];
  }
  // Second half is the exact mirror, so every pairing is played both ways.
  const secondHalf = firstHalf.map((round) =>
    round.map((m) => ({ home: m.away, away: m.home })),
  );
  return [...firstHalf, ...secondHalf];
}

export async function rollSeasonIfDone(leagueId: string): Promise<{
  rolled: boolean;
  newSeason?: number;
  /** What closing the market for the break cleared away. */
  market?: MarketResetResult;
}> {
  const [league] = await db
    .select()
    .from(leagues)
    .where(eq(leagues.id, leagueId))
    .limit(1);
  if (!league) return { rolled: false };

  const scheduledLeft = await db
    .select({ id: fixtures.id })
    .from(fixtures)
    .where(
      and(
        eq(fixtures.leagueId, leagueId),
        eq(fixtures.status, "scheduled"),
      ),
    );
  if (scheduledLeft.length > 0) return { rolled: false };

  const newSeason = league.seasonNumber + 1;
  const clubRows = await db
    .select()
    .from(clubs)
    .where(eq(clubs.leagueId, leagueId));
  if (clubRows.length < 2) return { rolled: false };

  // Compare-and-swap the season number *before* doing any of the work. Two
  // match-day runs finishing the last fixture at the same moment would
  // otherwise both roll: every player aged twice, two full fixture sets
  // generated, and prize money paid out twice. Whoever loses this UPDATE
  // simply reports "not rolled".
  const rollClaim = await db
    .update(leagues)
    .set({ seasonNumber: newSeason, weekNumber: 0 })
    .where(
      and(
        eq(leagues.id, leagueId),
        eq(leagues.seasonNumber, league.seasonNumber),
      ),
    )
    .returning();
  if (rollClaim.length === 0) return { rolled: false };

  // Finished fixtures drive the head-to-head tiebreak, so the table the
  // board and the relegation rule use is the same one the standings page
  // shows.
  const seasonFixtures = await db
    .select({
      homeClubId: fixtures.homeClubId,
      awayClubId: fixtures.awayClubId,
      homeScore: fixtures.homeScore,
      awayScore: fixtures.awayScore,
      status: fixtures.status,
    })
    .from(fixtures)
    .where(
      and(
        eq(fixtures.leagueId, leagueId),
        eq(fixtures.seasonNumber, league.seasonNumber),
        eq(fixtures.status, "finished"),
      ),
    );

  // Each division has its own table: a first place in the second tier is not
  // the same thing as winning the league.
  const topFlight = clubRows.filter((c) => c.division === 1);
  const secondTier = clubRows.filter((c) => c.division === 2);
  const standings = sortStandings(topFlight, seasonFixtures);
  const standingsD2 = sortStandings(secondTier, seasonFixtures);

  // Board evaluation: update confidence, fire failing managers. Done before
  // stats reset so the rank input is still meaningful.
  const rankedStandings = [
    ...standings.map((c, i) => ({ id: c.id, rank: i + 1 })),
    ...standingsD2.map((c, i) => ({ id: c.id, rank: i + 1 })),
  ];
  await evaluateBoardConfidence(leagueId, rankedStandings);

  // Season achievements (champion, perfect season, top scorer) — also
  // before reset so the per-club tallies are still populated.
  await evaluateSeasonAchievements({
    leagueId,
    season: league.seasonNumber,
    standings: rankedStandings,
  });
  const prizes = SEASON_PRIZES_CENTS;
  for (let rank = 0; rank < Math.min(4, standings.length); rank++) {
    await creditClub(standings[rank].id, prizes[rank], undefined, {
      kind: "prize",
      note: `Lig ${rank + 1}. sıra`,
    });
  }

  // Prestige moves in BOTH directions.
  //
  // Previously only the top four ever changed and only upward, so every
  // club drifted toward 100 over a few seasons. Since goalFromPrestige maps
  // 80+ to "champion" and only one club can actually win the league, the
  // whole division ended up with an impossible target and the board sacked
  // almost every manager, every season. A two-sided curve keeps the spread
  // stable so board goals stay meaningful.
  for (const table of [standings, standingsD2]) {
  const size = table.length;
  for (let i = 0; i < size; i++) {
    const c = table[i];
    const rank = i + 1;
    const share = rank / size; // 0 = top of the table, 1 = bottom
    let delta: number;
    if (rank === 1) delta = 8;
    else if (rank === 2) delta = 5;
    else if (share <= 0.25) delta = 3;
    else if (share <= 0.625) delta = 0;
    else if (share <= 0.8125) delta = -3;
    else delta = -6;
    // Gentle pull toward the middle so no club can park at 100 or 0 forever.
    const drift = c.prestige > 70 ? -1 : c.prestige < 35 ? 1 : 0;
    const next = Math.max(10, Math.min(100, c.prestige + delta + drift));
    if (next === c.prestige) continue;
    await db
      .update(clubs)
      .set({ prestige: next })
      .where(eq(clubs.id, c.id));
  }
  }
  if (standings[0]) {
    await db.insert(feedEvents).values({
      leagueId,
      clubId: standings[0].id,
      eventType: "paper",
      text: `Sezon ${league.seasonNumber} şampiyonu ${standings[0].name}! ${standings[0].seasonPoints} puan.`,
    });
  }

  // Archive the season BEFORE the tallies are wiped. Without this every
  // record of what happened was destroyed at the roll — no past champions,
  // no historic tables, nothing to look back on.
  const seasonPlayers = await db
    .select()
    .from(players)
    .where(eq(players.leagueId, leagueId));
  const topScorerByClub = new Map<string, { name: string; goals: number }>();
  for (const p of seasonPlayers) {
    if (!p.clubId || p.goalsSeason <= 0) continue;
    const current = topScorerByClub.get(p.clubId);
    if (!current || p.goalsSeason > current.goals) {
      topScorerByClub.set(p.clubId, { name: p.name, goals: p.goalsSeason });
    }
  }
  const [cupWinner] = await db
    .select({ winnerClubId: cupFixtures.winnerClubId })
    .from(cupFixtures)
    .where(
      and(
        eq(cupFixtures.leagueId, leagueId),
        eq(cupFixtures.seasonNumber, league.seasonNumber),
        eq(cupFixtures.round, 4),
      ),
    )
    .limit(1);

  const historyRows = [
    ...standings.map((c, i) => ({ club: c, position: i + 1, division: 1 as const })),
    ...standingsD2.map((c, i) => ({ club: c, position: i + 1, division: 2 as const })),
  ].map(({ club: c, position, division }) => ({
    leagueId,
    seasonNumber: league.seasonNumber,
    clubId: c.id,
    division,
    position,
    points: c.seasonPoints,
    wins: c.seasonWins,
    draws: c.seasonDraws,
    losses: c.seasonLosses,
    goalsFor: c.seasonGoalsFor,
    goalsAgainst: c.seasonGoalsAgainst,
    wonCup: cupWinner?.winnerClubId === c.id,
    promoted: division === 2 && position <= PROMOTION_SLOTS,
    relegated: division === 1 && position > standings.length - PROMOTION_SLOTS,
    topScorerJson: JSON.stringify(topScorerByClub.get(c.id) ?? null),
  }));
  if (historyRows.length > 0) {
    // The unique index makes a duplicated roll a no-op rather than an error.
    await db.insert(seasonHistory).values(historyRows).onConflictDoNothing();
  }

  // Roll season totals into career totals before they are zeroed.
  await db
    .update(players)
    .set({
      careerGoals: sql`${players.careerGoals} + ${players.goalsSeason}`,
      careerAssists: sql`${players.careerAssists} + ${players.assistsSeason}`,
    })
    .where(eq(players.leagueId, leagueId));

  // Reset club season stats
  for (const c of clubRows) {
    await db
      .update(clubs)
      .set({
        seasonPoints: 0,
        seasonWins: 0,
        seasonDraws: 0,
        seasonLosses: 0,
        seasonGoalsFor: 0,
        seasonGoalsAgainst: 0,
      })
      .where(eq(clubs.id, c.id));
  }

  // Any leftover loan rows (from before the loan feature was removed)
  // get snapped home here so a half-migrated row can't become a free
  // agent inside the borrower's club. Safe no-op when nothing matches.
  const leftoverLoans = await db
    .select()
    .from(players)
    .where(and(eq(players.leagueId, leagueId), sql`${players.loanOwnerClubId} IS NOT NULL`));
  for (const lp of leftoverLoans) {
    if (!lp.loanOwnerClubId) continue;
    await db
      .update(players)
      .set({ clubId: lp.loanOwnerClubId, loanOwnerClubId: null, loanReturnsAt: null })
      .where(eq(players.id, lp.id));
  }

  // Age + potential decay for every player. Retirement / free agency:
  //  - Age ≥ 38 with overall < 78 → forced retirement (delete from DB).
  //  - Age ≥ 40 → forced retirement regardless.
  //  - Contract years 0 (after tick) → released as free agent (clubId=null).
  const allPlayers = await db
    .select()
    .from(players)
    .where(eq(players.leagueId, leagueId));
  let retired = 0;
  let freeAgents = 0;
  for (const p of allPlayers) {
    const newAge = p.age + 1;

    if (newAge >= 40 || (newAge >= 38 && p.overall < 78)) {
      await db.delete(players).where(eq(players.id, p.id));
      retired++;
      continue;
    }

    // Veterans lose 1 overall with some probability; 34+ almost certainly.
    let ovrDelta = 0;
    if (newAge >= 34) ovrDelta = Math.random() < 0.7 ? -1 : 0;
    else if (newAge >= 32) ovrDelta = Math.random() < 0.35 ? -1 : 0;
    else if (newAge >= 30) ovrDelta = Math.random() < 0.15 ? -1 : 0;
    // Potential also drops for older players (can never grow beyond potential)
    let potDelta = 0;
    if (newAge >= 30) potDelta = Math.random() < 0.4 ? -1 : 0;
    const newOvr = Math.max(50, p.overall + ovrDelta);
    const newPot = Math.max(newOvr, p.potential + potDelta);

    // Contract ticks down. If it hits 0 the player becomes a free agent
    // (clubId=null). Re-signing them is a future feature; for now they
    // remain in the league pool so scouts can find them.
    const newCtr = p.contractYears - 1;
    const expiring = newCtr <= 0;
    // Re-price the player against what he has become. Nothing else in the
    // game ever updated market value after the row was inserted, so a
    // youngster who trained from 60 to 85 stayed priced as a 60 forever and
    // a decayed veteran still cost his prime fee.
    const newValue = marketValueCents(newOvr, newPot, newAge);
    await db
      .update(players)
      .set({
        age: newAge,
        overall: newOvr,
        potential: newPot,
        marketValueCents: newValue,
        // Wages track value on the same curve the generator uses — via the
        // shared helper, because an inlined copy of "value ÷ 200, floor €12K"
        // is exactly how four different valuation formulas drifted apart here
        // once before.
        wageCents: wageFromValueCents(newValue),
        contractYears: expiring ? 0 : newCtr,
        clubId: expiring ? null : p.clubId,
        status: expiring ? "active" : p.status,
        goalsSeason: 0,
        assistsSeason: 0,
        yellowCardsSeason: 0,
        redCardsSeason: 0,
      })
      .where(eq(players.id, p.id));
    if (expiring) freeAgents++;
  }
  // Clear match-day state that must not survive the summer: nobody starts a
  // new season injured, banned or exhausted.
  await db
    .update(players)
    .set({
      status: sql`CASE WHEN ${players.status} IN ('injured','suspended') THEN 'active' ELSE ${players.status} END`,
      injuryUntil: null,
      suspensionMatchesLeft: 0,
      fitness: 95,
      lastRatings: "[]",
    })
    .where(eq(players.leagueId, leagueId));

  // The market closes for the break. Every price above was just recomputed
  // from each player's new overall/potential/age, so every listing and every
  // open offer in this league is now quoting last season's valuation — see
  // lib/jobs/market-reset.ts for why they are cleared rather than repriced.
  const market = await closeMarketForSeasonRoll(leagueId);

  // Youth intake — the other half of the lifecycle. Retirement used to
  // delete players with nothing ever replacing them, so squads shrank every
  // season until clubs could not field eleven.
  const intake = await generateYouthIntake(leagueId, newSeason, clubRows);
  const backfilled = await backfillThinSquads(leagueId, clubRows);

  if (retired > 0 || freeAgents > 0) {
    await db.insert(feedEvents).values({
      leagueId,
      clubId: null,
      eventType: "paper",
      text: `Sezon sonu: ${retired} oyuncu emekli oldu, ${freeAgents} oyuncu serbest kaldı, altyapıdan ${intake.academy + backfilled} genç çıktı.`,
    });
  }

  // Promotion and relegation, after the season is on record and before the
  // new calendar is drawn — the new fixture list must reflect who is in
  // which division.
  const swap = await applyPromotionRelegation(leagueId, clubRows, seasonFixtures);
  // Re-read: clubRows still has the pre-swap divisions.
  const clubRowsAfter = await db
    .select()
    .from(clubs)
    .where(eq(clubs.leagueId, leagueId));

  // Generate new fixtures. Schedule starts tomorrow to give users a day to breathe.
  // Time-of-day comes from the league's matchTime ("HH:MM") instead of the
  // previously hardcoded 21:00.
  const now = new Date();
  const fixtureRows: Array<typeof fixtures.$inferInsert> = [];
  for (const division of [1, 2] as const) {
    const divisionIds = clubRowsAfter
      .filter((c) => c.division === division)
      .map((c) => c.id);
    if (divisionIds.length < 2) continue;
    const rounds = roundRobin(divisionIds);
    for (let r = 0; r < rounds.length; r++) {
      // Day 1 is tomorrow, so the new season starts after a rest day.
      const scheduled = matchKickoff(now, r + 1, league.matchTime, league.timeZone);
      for (const m of rounds[r]) {
        const home = clubRowsAfter.find((c) => c.id === m.home);
        if (!home) continue;
        fixtureRows.push({
          leagueId,
          seasonNumber: newSeason,
          division,
          weekNumber: r + 1,
          homeClubId: m.home,
          awayClubId: m.away,
          venue: `${home.city} Arena`,
          scheduledAt: scheduled,
          status: "scheduled",
        });
      }
    }
  }
  await db.insert(fixtures).values(fixtureRows);
  const weeksInSeason = fixtureRows.reduce((m, f) => Math.max(m, f.weekNumber), 0);

  // Abandon any cup tie from the season just gone that never got played —
  // a slot whose feeder round never resolved would otherwise sit
  // 'scheduled' with a past kick-off forever.
  await db
    .update(cupFixtures)
    .set({ status: "finished" })
    .where(
      and(
        eq(cupFixtures.leagueId, leagueId),
        eq(cupFixtures.seasonNumber, league.seasonNumber),
        eq(cupFixtures.status, "scheduled"),
      ),
    );

  // Assign new board goals + generate cup bracket for the new season.
  await assignSeasonGoals(leagueId);
  await generateCupBracket(leagueId, newSeason);

  await db.insert(feedEvents).values({
    leagueId,
    clubId: null,
    eventType: "paper",
    text:
      `Sezon ${newSeason} başladı — ${weeksInSeason} hafta, yeni fikstür çekildi.` +
      (swap.promoted.length > 0
        ? ` Süper Lig'e çıkanlar: ${swap.promoted.map((c) => c.name).join(", ")}.`
        : ""),
  });

  return { rolled: true, newSeason, market };
}
