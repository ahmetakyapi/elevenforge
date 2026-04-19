/**
 * Generate a newspaper for the completed week.
 *  - Finds the week's finished fixtures for a league.
 *  - Picks a hero match (biggest goal differential or most-watched derby).
 *  - Builds headline + TOTW + top scorers/assists.
 *  - Emits a feed event linking to the paper.
 */
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  clubs,
  feedEvents,
  fixtures,
  leagues,
  newspapers,
  players,
} from "@/lib/schema";
import { buildTOTW, type WeekPerformance } from "@/lib/engine/totw";
import type { MatchEvent } from "@/lib/engine/match";

const HEADLINES = [
  (home: string, away: string, diff: number) =>
    diff >= 4
      ? `${home.toUpperCase()} UÇURDU`
      : diff >= 3
        ? `${home.toUpperCase()} FARK ATTI`
        : diff === 2
          ? `${home.toUpperCase()} NETLİĞİ GÖSTERDİ`
          : `${home.toUpperCase()} GÜCÜ`,
  (home: string, _away: string) => `${home.toUpperCase()} TARİH YAZDI`,
  (home: string) => `${home.toUpperCase()} UYANIŞI`,
];

export async function generateNewspaper(opts: {
  leagueId: string;
  seasonNumber: number;
  weekNumber: number;
}) {
  const { leagueId, seasonNumber, weekNumber } = opts;

  const weekFixtures = await db
    .select()
    .from(fixtures)
    .where(
      and(
        eq(fixtures.leagueId, leagueId),
        eq(fixtures.seasonNumber, seasonNumber),
        eq(fixtures.weekNumber, weekNumber),
        eq(fixtures.status, "finished"),
      ),
    );
  if (weekFixtures.length === 0) return null;

  // Hero: biggest goal differential
  const hero = [...weekFixtures]
    .sort(
      (a, b) =>
        Math.abs((b.homeScore ?? 0) - (b.awayScore ?? 0)) -
        Math.abs((a.homeScore ?? 0) - (a.awayScore ?? 0)),
    )[0];

  const heroHome = (
    await db.select().from(clubs).where(eq(clubs.id, hero.homeClubId)).limit(1)
  )[0];
  const heroAway = (
    await db.select().from(clubs).where(eq(clubs.id, hero.awayClubId)).limit(1)
  )[0];
  if (!heroHome || !heroAway) return null;

  const diff = Math.abs(
    (hero.homeScore ?? 0) - (hero.awayScore ?? 0),
  );
  const winner =
    (hero.homeScore ?? 0) > (hero.awayScore ?? 0) ? heroHome : heroAway;
  const loser = winner.id === heroHome.id ? heroAway : heroHome;
  const headline = HEADLINES[0](winner.shortName, loser.shortName, diff);

  // TOTW — compile performances for every starter who played
  const performances: WeekPerformance[] = [];
  for (const fx of weekFixtures) {
    if (!fx.commentaryJson) continue;
    let events: MatchEvent[] = [];
    try {
      events = JSON.parse(fx.commentaryJson) as MatchEvent[];
    } catch {
      /* ignore */
    }
    // Parse ratings from players' lastRatings (last entry = this match)
    const clubIds = [fx.homeClubId, fx.awayClubId];
    for (const cId of clubIds) {
      const squad = await db
        .select()
        .from(players)
        .where(eq(players.clubId, cId));
      for (const p of squad) {
        let ratings: number[] = [];
        try {
          ratings = JSON.parse(p.lastRatings);
        } catch {}
        const r = ratings[ratings.length - 1];
        if (typeof r !== "number" || r < 6.5) continue;
        const goals = events.filter(
          (e) => e.type === "goal" && e.scorerId === p.id,
        ).length;
        const assists = events.filter(
          (e) => e.type === "goal" && e.assisterId === p.id,
        ).length;
        performances.push({
          player: p,
          rating: r,
          goals,
          assists,
          clubId: cId,
        });
      }
    }
  }
  const totw = buildTOTW(performances);

  // Top scorers / assists of the season so far
  const allPlayers = await db
    .select()
    .from(players)
    .where(eq(players.leagueId, leagueId));
  const scorers = [...allPlayers]
    .filter((p) => p.goalsSeason > 0)
    .sort((a, b) => b.goalsSeason - a.goalsSeason)
    .slice(0, 5)
    .map((p) => ({ name: p.name, clubId: p.clubId, g: p.goalsSeason }));
  const assists = [...allPlayers]
    .filter((p) => p.assistsSeason > 0)
    .sort((a, b) => b.assistsSeason - a.assistsSeason)
    .slice(0, 5)
    .map((p) => ({ name: p.name, clubId: p.clubId, a: p.assistsSeason }));

  const coverJson = {
    heroFixtureId: hero.id,
    heroHomeClubId: heroHome.id,
    heroAwayClubId: heroAway.id,
    homeScore: hero.homeScore ?? 0,
    awayScore: hero.awayScore ?? 0,
    headline,
    subhead:
      diff >= 3
        ? `${winner.name} rakibini mağlup etti: ${hero.homeScore} - ${hero.awayScore}.`
        : `${winner.name} ${diff > 0 ? "kazandı" : "beraberlikte ayrıldı"}: ${hero.homeScore} - ${hero.awayScore}.`,
    weekNumber,
    seasonNumber,
  };

  const funFact = `${winner.name} bu sezon ${diff}+ farkla kazandığı maç sayısını artırdı.`;

  await db
    .insert(newspapers)
    .values({
      leagueId,
      seasonNumber,
      weekNumber,
      coverJson: JSON.stringify(coverJson),
      totwJson: JSON.stringify(totw),
      scorersJson: JSON.stringify(scorers),
      assistsJson: JSON.stringify(assists),
      funFact,
    })
    .onConflictDoNothing();

  await db.insert(feedEvents).values({
    leagueId,
    clubId: winner.id,
    eventType: "paper",
    text: `Haftalık gazete yayınlandı — "${headline}"`,
  });

  return { headline, totwCount: totw.length };
}

export async function runWeeklyNewspaper(opts: { leagueId?: string } = {}) {
  const activeLeagues = opts.leagueId
    ? [
        (
          await db
            .select()
            .from(leagues)
            .where(eq(leagues.id, opts.leagueId))
            .limit(1)
        )[0],
      ].filter(Boolean)
    : await db
        .select()
        .from(leagues)
        .where(eq(leagues.status, "active"));
  const generated: Array<{ leagueId: string; weekNumber: number }> = [];
  for (const L of activeLeagues) {
    if (!L) continue;
    // Generate for the LAST finished week
    const lastFinished = (
      await db
        .select({ weekNumber: fixtures.weekNumber })
        .from(fixtures)
        .where(
          and(
            eq(fixtures.leagueId, L.id),
            eq(fixtures.status, "finished"),
          ),
        )
        .orderBy(desc(fixtures.weekNumber))
        .limit(1)
    )[0];
    if (!lastFinished) continue;
    const result = await generateNewspaper({
      leagueId: L.id,
      seasonNumber: L.seasonNumber,
      weekNumber: lastFinished.weekNumber,
    });
    if (result) generated.push({ leagueId: L.id, weekNumber: lastFinished.weekNumber });
  }
  return { generated: generated.length };
}
