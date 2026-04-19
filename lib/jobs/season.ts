/**
 * Season lifecycle:
 *  - rollSeasonIfDone(leagueId): if the league has no more scheduled fixtures,
 *    bump the season number, reset per-club stats, age players + decay the
 *    veterans, re-generate a fresh single round-robin fixture schedule.
 */
import { and, eq } from "drizzle-orm";
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
  await evaluateBoardConfidence(
    leagueId,
    standings.map((c, i) => ({ id: c.id, rank: i + 1 })),
  );
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

  // Age + potential decay for every player
  const allPlayers = await db
    .select()
    .from(players)
    .where(eq(players.leagueId, leagueId));
  for (const p of allPlayers) {
    const newAge = p.age + 1;
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
    // Contract ticks down — floor at 1 so players don't become free agents
    // unexpectedly. (Real renewal flow is V2.)
    const newCtr = Math.max(1, p.contractYears - 1);
    await db
      .update(players)
      .set({
        age: newAge,
        overall: newOvr,
        potential: newPot,
        contractYears: newCtr,
        goalsSeason: 0,
        assistsSeason: 0,
        yellowCardsSeason: 0,
        redCardsSeason: 0,
      })
      .where(eq(players.id, p.id));
  }

  // Generate new fixtures. Schedule starts tomorrow to give users a day to breathe.
  const clubIds = clubRows.map((c) => c.id);
  const rounds = roundRobin(clubIds);
  const firstDay = new Date();
  firstDay.setDate(firstDay.getDate() + 1);
  firstDay.setHours(21, 0, 0, 0);

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
