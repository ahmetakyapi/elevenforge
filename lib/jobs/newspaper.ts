/**
 * Generate a newspaper for the completed week.
 *  - Finds the week's finished fixtures for a league.
 *  - Picks a hero match (biggest goal differential or most-watched derby).
 *  - Builds headline + TOTW + top scorers/assists.
 *  - Emits a feed event linking to the paper.
 */
import { and, desc, eq, inArray } from "drizzle-orm";
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
import { buildSections, EMPTY_SECTIONS } from "./newspaper-sections";
import type { MatchEvent } from "@/lib/engine/match";

// Hero-match headline template. Only the diff-scaled "UÇURDU / FARK ATTI /
// NETLİĞİ GÖSTERDİ / GÜCÜ" variant is used currently; kept in an array
// shape so future variants can be slotted in (one per week seed, say)
// without reshaping the call site.
const HEADLINES: Array<(home: string, away: string, diff: number) => string> = [
  (home, _away, diff) =>
    diff >= 4
      ? `${home.toUpperCase()} UÇURDU`
      : diff >= 3
        ? `${home.toUpperCase()} FARK ATTI`
        : diff === 2
          ? `${home.toUpperCase()} NETLİĞİ GÖSTERDİ`
          : `${home.toUpperCase()} GÜCÜ`,
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

  // TOTW — only players who actually took the field this week.
  //
  // This used to walk each club's ENTIRE squad and read the last entry of
  // `lastRatings`. That array is a rolling buffer of the player's last five
  // matches, so a player who was injured, suspended, or simply left out
  // still carried a rating from whenever he last played — and could be
  // picked for a Team of the Week he had no part in. The fixture's line-up
  // snapshot is the record of who was really out there.
  type LineupSnapshot = {
    home?: Array<{ id: string }>;
    away?: Array<{ id: string }>;
  };
  const performances: WeekPerformance[] = [];
  const playedIds = new Set<string>();
  const eventsByFixture = new Map<string, MatchEvent[]>();
  const clubByPlayer = new Map<string, string>();

  for (const fx of weekFixtures) {
    let events: MatchEvent[] = [];
    if (fx.commentaryJson) {
      try {
        const parsed = JSON.parse(fx.commentaryJson);
        if (Array.isArray(parsed)) events = parsed as MatchEvent[];
      } catch {
        /* ignore */
      }
    }
    eventsByFixture.set(fx.id, events);

    let snapshot: LineupSnapshot = {};
    if (fx.lineupsJson) {
      try {
        snapshot = JSON.parse(fx.lineupsJson) as LineupSnapshot;
      } catch {
        /* ignore */
      }
    }
    for (const entry of snapshot.home ?? []) {
      playedIds.add(entry.id);
      clubByPlayer.set(entry.id, fx.homeClubId);
    }
    for (const entry of snapshot.away ?? []) {
      playedIds.add(entry.id);
      clubByPlayer.set(entry.id, fx.awayClubId);
    }
    // Anyone who scored, assisted or was booked demonstrably played, even if
    // they came off the bench and so are absent from the starting snapshot.
    for (const e of events) {
      const id = e.scorerId ?? e.assisterId ?? e.cardPlayerId;
      if (!id) continue;
      playedIds.add(id);
      if (!clubByPlayer.has(id)) {
        clubByPlayer.set(id, e.side === "away" ? fx.awayClubId : fx.homeClubId);
      }
    }
  }

  // One query for everyone who played, instead of one per club per fixture.
  const playedRows =
    playedIds.size > 0
      ? await db
          .select()
          .from(players)
          .where(inArray(players.id, [...playedIds]))
      : [];

  for (const p of playedRows) {
    let ratings: number[] = [];
    try {
      const parsed = JSON.parse(p.lastRatings);
      if (Array.isArray(parsed)) ratings = parsed;
    } catch {
      /* ignore */
    }
    const r = ratings[ratings.length - 1];
    if (typeof r !== "number" || r < 6.5) continue;
    let goals = 0;
    let assists = 0;
    for (const events of eventsByFixture.values()) {
      for (const e of events) {
        if (e.type !== "goal") continue;
        if (e.scorerId === p.id) goals++;
        if (e.assisterId === p.id) assists++;
      }
    }
    performances.push({
      player: p,
      rating: r,
      goals,
      assists,
      clubId: clubByPlayer.get(p.id) ?? p.clubId ?? "",
    });
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

  // Everything below the fold. Built after the cover so it can be skipped
  // without losing the paper: a section that fails to compose should cost the
  // reader a page, not the whole edition.
  let sections = EMPTY_SECTIONS;
  try {
    sections = await buildSections({
      leagueId,
      seasonNumber,
      weekNumber,
      weekFixtures,
    });
  } catch {
    /* keep the cover; the reader renders an empty section as absent */
  }

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
      sectionsJson: JSON.stringify(sections),
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
    // Generate for the last finished week OF THE CURRENT SEASON.
    //
    // Without the season filter this picked the highest finished week
    // number across all time: in season 2 week 3 it still returned week 30
    // (from season 1) and asked for a paper covering a week that had not
    // been played yet — so no newspaper was ever produced again after the
    // first season rolled.
    const lastFinished = (
      await db
        .select({ weekNumber: fixtures.weekNumber })
        .from(fixtures)
        .where(
          and(
            eq(fixtures.leagueId, L.id),
            eq(fixtures.seasonNumber, L.seasonNumber),
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
