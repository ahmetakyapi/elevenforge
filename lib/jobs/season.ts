/**
 * Season lifecycle:
 *  - rollSeasonIfDone(leagueId): if the league has no more scheduled fixtures,
 *    bump the season number, reset per-club stats, age players + decay the
 *    veterans, re-generate a fresh single round-robin fixture schedule.
 */
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  clubs,
  feedEvents,
  fixtures,
  leagues,
  players,
} from "@/lib/schema";
import { assignSeasonGoals, evaluateBoardConfidence } from "./board";
import { generateCupBracket } from "./cup";
import { evaluateSeasonAchievements } from "./achievements";
import { applyMatchTime } from "@/lib/match-time";

function roundRobin(teamIds: string[]) {
  const teams = teamIds.slice();
  if (teams.length % 2 !== 0) teams.push("BYE");
  const rounds: Array<Array<{ home: string; away: string }>> = [];
  const half = teams.length / 2;
  let arr = teams.slice();
  for (let r = 0; r < arr.length - 1; r++) {
    const matches: Array<{ home: string; away: string }> = [];
    for (let i = 0; i < half; i++) {
      const t1 = arr[i];
      const t2 = arr[arr.length - 1 - i];
      if (t1 !== "BYE" && t2 !== "BYE") {
        matches.push(
          r % 2 === 0 ? { home: t1, away: t2 } : { home: t2, away: t1 },
        );
      }
    }
    rounds.push(matches);
    const first = arr[0];
    const rest = arr.slice(1);
    rest.unshift(rest.pop()!);
    arr = [first, ...rest];
  }
  return rounds;
}

export async function rollSeasonIfDone(leagueId: string): Promise<{
  rolled: boolean;
  newSeason?: number;
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

  // Award season prize money (top 4) BEFORE resetting stats.
  const standings = [...clubRows].sort((a, b) => {
    if (b.seasonPoints !== a.seasonPoints)
      return b.seasonPoints - a.seasonPoints;
    const aGd = a.seasonGoalsFor - a.seasonGoalsAgainst;
    const bGd = b.seasonGoalsFor - b.seasonGoalsAgainst;
    if (bGd !== aGd) return bGd - aGd;
    return b.seasonGoalsFor - a.seasonGoalsFor;
  });

  // Board evaluation: update confidence, fire failing managers. Done before
  // stats reset so the rank input is still meaningful.
  const rankedStandings = standings.map((c, i) => ({ id: c.id, rank: i + 1 }));
  await evaluateBoardConfidence(leagueId, rankedStandings);

  // Season achievements (champion, perfect season, top scorer) — also
  // before reset so the per-club tallies are still populated.
  await evaluateSeasonAchievements({
    leagueId,
    season: league.seasonNumber,
    standings: rankedStandings,
  });
  // EUR amounts: 30M / 20M / 10M / 5M (stored in cents)
  const prizes = [3_000_000_000, 2_000_000_000, 1_000_000_000, 500_000_000];
  for (let rank = 0; rank < Math.min(4, standings.length); rank++) {
    const c = standings[rank];
    const prize = prizes[rank];
    await db
      .update(clubs)
      .set({
        balanceCents: c.balanceCents + prize,
        prestige: Math.min(100, c.prestige + (rank === 0 ? 8 : rank === 1 ? 5 : 3)),
      })
      .where(eq(clubs.id, c.id));
  }
  if (standings[0]) {
    await db.insert(feedEvents).values({
      leagueId,
      clubId: standings[0].id,
      eventType: "paper",
      text: `Sezon ${league.seasonNumber} şampiyonu ${standings[0].name}! ${standings[0].seasonPoints} puan.`,
    });
  }

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
    await db
      .update(players)
      .set({
        age: newAge,
        overall: newOvr,
        potential: newPot,
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
  if (retired > 0 || freeAgents > 0) {
    await db.insert(feedEvents).values({
      leagueId,
      clubId: null,
      eventType: "paper",
      text: `Sezon sonu: ${retired} oyuncu emekli oldu, ${freeAgents} oyuncu serbest kaldı.`,
    });
  }

  // Generate new fixtures. Schedule starts tomorrow to give users a day to breathe.
  // Time-of-day comes from the league's matchTime ("HH:MM") instead of the
  // previously hardcoded 21:00.
  const clubIds = clubRows.map((c) => c.id);
  const rounds = roundRobin(clubIds);
  const firstDay = new Date();
  firstDay.setDate(firstDay.getDate() + 1);
  applyMatchTime(firstDay, league.matchTime);

  const fixtureRows: Array<typeof fixtures.$inferInsert> = [];
  for (let r = 0; r < rounds.length; r++) {
    const scheduled = new Date(firstDay);
    scheduled.setDate(firstDay.getDate() + r);
    for (const m of rounds[r]) {
      const home = clubRows.find((c) => c.id === m.home);
      if (!home) continue;
      fixtureRows.push({
        leagueId,
        seasonNumber: newSeason,
        weekNumber: r + 1,
        homeClubId: m.home,
        awayClubId: m.away,
        venue: `${home.city} Arena`,
        scheduledAt: scheduled,
        status: "scheduled",
      });
    }
  }
  await db.insert(fixtures).values(fixtureRows);

  // Update league: new season, week 0
  await db
    .update(leagues)
    .set({ seasonNumber: newSeason, weekNumber: 0 })
    .where(eq(leagues.id, leagueId));

  // Assign new board goals + generate cup bracket for the new season.
  await assignSeasonGoals(leagueId);
  await generateCupBracket(leagueId, newSeason);

  await db.insert(feedEvents).values({
    leagueId,
    clubId: null,
    eventType: "paper",
    text: `Sezon ${newSeason} başladı — ${rounds.length} hafta, yeni fikstür çekildi.`,
  });

  return { rolled: true, newSeason };
}
