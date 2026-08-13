/**
 * Everything a manager may know about a rival club.
 *
 * The standings table listed eighteen clubs and none of them went anywhere.
 * You could see that Trabzonspor were third and had no way to find out who
 * they were third with — which players, which are for sale, whether their
 * keeper is injured before you play them. That is the information a manager
 * actually acts on, and all of it already existed behind other pages.
 *
 * WHAT IS PUBLIC. A squad list is public knowledge in football, so the roster,
 * ratings and market values are all here. The club's LINEUP and TACTICS are
 * not — those stay behind the scout report (lib/jobs/spy.ts), which is a paid
 * action and would be pointless if this page gave them away. Balance is also
 * withheld: knowing exactly what a rival can spend would break negotiation.
 */
import { and, desc, eq, ne, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { clubs, fixtures, players } from "@/lib/schema";
import type { LeagueContext } from "@/lib/session";
import { sortStandings } from "@/lib/standings";
import type { Position } from "@/types";

export type ClubDetailPlayer = {
  id: string;
  name: string;
  pos: Position;
  role: string;
  num: number | null;
  age: number;
  nat: string;
  ovr: number;
  pot: number;
  valueEur: number;
  status: string;
  isListed: boolean;
  form: number[];
};

export type ClubDetailFixture = {
  id: string;
  week: number;
  isHome: boolean;
  opponentName: string;
  opponentShort: string;
  opponentColor: string;
  opponentColor2: string;
  opponentId: string;
  homeScore: number | null;
  awayScore: number | null;
  result: "W" | "D" | "L" | null;
  played: boolean;
};

export type ClubDetail = {
  id: string;
  name: string;
  shortName: string;
  city: string;
  color: string;
  color2: string;
  division: number;
  prestige: number;
  isMine: boolean;
  isBot: boolean;
  managerLabel: string;
  position: number;
  divisionSize: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  squad: ClubDetailPlayer[];
  squadValueEur: number;
  avgOverall: number;
  avgAge: number;
  recent: ClubDetailFixture[];
  next: ClubDetailFixture | null;
};

export async function loadClubDetail(
  ctx: LeagueContext,
  clubId: string,
): Promise<ClubDetail | null> {
  const [club] = await db
    .select()
    .from(clubs)
    // Scoped to the caller's league: a club id from another league must not
    // resolve, or the page becomes a cross-league information leak.
    .where(and(eq(clubs.id, clubId), eq(clubs.leagueId, ctx.league.id)));
  if (!club) return null;

  const divisionClubs = await db
    .select()
    .from(clubs)
    .where(
      and(eq(clubs.leagueId, ctx.league.id), eq(clubs.division, club.division)),
    );

  // Head-to-head tiebreaks need the division's finished fixtures, the same
  // input the standings page uses, so the position shown here matches it.
  const divisionFixtures = await db
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
        eq(fixtures.leagueId, ctx.league.id),
        eq(fixtures.division, club.division),
        eq(fixtures.seasonNumber, ctx.league.seasonNumber),
      ),
    );

  const table = sortStandings(divisionClubs, divisionFixtures);
  const position = table.findIndex((c) => c.id === club.id) + 1;

  const roster = await db
    .select()
    .from(players)
    .where(eq(players.clubId, club.id))
    .orderBy(desc(players.overall));

  const squad: ClubDetailPlayer[] = roster.map((p) => {
    let form: number[] = [];
    try {
      const parsed = JSON.parse(p.lastRatings);
      if (Array.isArray(parsed)) form = parsed;
    } catch {
      /* unparseable ratings are simply absent */
    }
    return {
      id: p.id,
      name: p.name,
      pos: p.position as Position,
      role: p.role,
      num: p.jerseyNumber,
      age: p.age,
      nat: p.nationality,
      ovr: p.overall,
      pot: p.potential,
      valueEur: Math.round(Number(p.marketValueCents) / 100),
      status: p.status,
      isListed: p.status === "listed",
      form,
    };
  });

  // Recent results and the next fixture, both directions of the join folded
  // into one opponent-shaped row.
  const rows = await db
    .select({
      id: fixtures.id,
      week: fixtures.weekNumber,
      home: fixtures.homeClubId,
      away: fixtures.awayClubId,
      homeScore: fixtures.homeScore,
      awayScore: fixtures.awayScore,
      status: fixtures.status,
      scheduledAt: fixtures.scheduledAt,
    })
    .from(fixtures)
    .where(
      and(
        eq(fixtures.leagueId, ctx.league.id),
        eq(fixtures.seasonNumber, ctx.league.seasonNumber),
        or(eq(fixtures.homeClubId, club.id), eq(fixtures.awayClubId, club.id)),
      ),
    )
    .orderBy(fixtures.weekNumber);

  const byId = new Map(divisionClubs.map((c) => [c.id, c]));
  // A cup tie can pair clubs from different divisions, so the opponent is not
  // guaranteed to be in `divisionClubs`.
  const missing = rows
    .map((r) => (r.home === club.id ? r.away : r.home))
    .filter((id) => !byId.has(id));
  if (missing.length > 0) {
    const extra = await db
      .select()
      .from(clubs)
      .where(
        and(eq(clubs.leagueId, ctx.league.id), ne(clubs.id, club.id)),
      );
    for (const c of extra) byId.set(c.id, c);
  }

  const shape = (r: (typeof rows)[number]): ClubDetailFixture | null => {
    const isHome = r.home === club.id;
    const opp = byId.get(isHome ? r.away : r.home);
    if (!opp) return null;
    const played = r.status === "finished";
    const mine = isHome ? r.homeScore : r.awayScore;
    const theirs = isHome ? r.awayScore : r.homeScore;
    return {
      id: r.id,
      week: r.week,
      isHome,
      opponentName: opp.name,
      opponentShort: opp.shortName,
      opponentColor: opp.color,
      opponentColor2: opp.color2,
      opponentId: opp.id,
      homeScore: r.homeScore,
      awayScore: r.awayScore,
      result:
        !played || mine === null || theirs === null
          ? null
          : mine > theirs
            ? "W"
            : mine < theirs
              ? "L"
              : "D",
      played,
    };
  };

  const shaped = rows.map(shape).filter((f): f is ClubDetailFixture => f !== null);
  const recent = shaped.filter((f) => f.played).slice(-5).reverse();
  const next = shaped.find((f) => !f.played) ?? null;

  const squadValueEur = squad.reduce((s, p) => s + p.valueEur, 0);

  return {
    id: club.id,
    name: club.name,
    shortName: club.shortName,
    city: club.city,
    color: club.color,
    color2: club.color2,
    division: club.division,
    prestige: club.prestige,
    isMine: club.id === ctx.club.id,
    isBot: club.aiManaged,
    managerLabel: club.aiManaged ? "Yapay Zekâ Menajer" : "İnsan Menajer",
    position,
    divisionSize: divisionClubs.length,
    played: club.seasonWins + club.seasonDraws + club.seasonLosses,
    wins: club.seasonWins,
    draws: club.seasonDraws,
    losses: club.seasonLosses,
    goalsFor: club.seasonGoalsFor,
    goalsAgainst: club.seasonGoalsAgainst,
    points: club.seasonPoints,
    squad,
    squadValueEur,
    avgOverall:
      squad.length === 0
        ? 0
        : Math.round(
            (squad.reduce((s, p) => s + p.ovr, 0) / squad.length) * 10,
          ) / 10,
    avgAge:
      squad.length === 0
        ? 0
        : Math.round((squad.reduce((s, p) => s + p.age, 0) / squad.length) * 10) /
          10,
    recent,
    next,
  };
}
