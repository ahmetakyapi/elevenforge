import { and, desc, eq, gt, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  clubs,
  feedEvents,
  fixtures,
  players,
} from "@/lib/schema";
import type { LeagueContext } from "@/lib/session";
import { tickLoginStreak } from "@/lib/actions/login-streak";

export type DashLeagueRow = {
  clubId: string;
  name: string;
  shortName: string;
  color: string;
  color2: string;
  p: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
  pts: number;
  form: Array<"W" | "D" | "L">;
  isMe: boolean;
};

export type DashFeedItem = {
  id: string;
  type: "transfer" | "match" | "scout" | "paper" | "morale";
  text: string;
  clubId: string | null;
  relativeTime: string;
};

export type DashNextFixture = {
  id: string;
  homeClubId: string;
  homeClubName: string;
  homeClubShort: string;
  awayClubId: string;
  awayClubName: string;
  awayClubShort: string;
  scheduledAtMs: number;
  venue: string;
  isDerby: boolean;
  isHome: boolean;
  opponentForm: Array<"W" | "D" | "L">;
  h2h: Array<{
    ourScore: number;
    theirScore: number;
    result: "W" | "D" | "L";
    weekNumber: number;
  }>;
} | null;

export type StreakInfo = {
  streak: number;
  rewardAvailable: boolean;
  rewardEur: number;
};

export type DashSquadStatus = {
  total: number;
  injured: number;
  suspended: number;
  training: number;
};

export type CrestLookup = Record<
  string,
  { color: string; color2: string; short: string }
>;

export type DashboardData = {
  myClub: {
    id: string;
    name: string;
    shortName: string;
    color: string;
    color2: string;
    balanceEur: number;
    morale: number;
    position: number;
    points: number;
  };
  leagueInfo: {
    name: string;
    seasonNumber: number;
    weekNumber: number;
    seasonLength: number;
    inviteCode: string;
    memberCount: number;
    botCount: number;
  };
  nextFixture: DashNextFixture;
  standings: DashLeagueRow[];
  feed: DashFeedItem[];
  squadStatus: DashSquadStatus;
  crestLookup: CrestLookup;
  streak: StreakInfo;
};

function relativeTime(from: Date, now: number): string {
  const diff = Math.max(1, Math.floor((now - from.getTime()) / 1000));
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}dk`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}sa`;
  return `${Math.floor(diff / 86400)}g`;
}

export async function loadDashboardData(
  ctx: LeagueContext,
): Promise<DashboardData> {
  const { league, club } = ctx;

  // Standings — ordered by points, then goal difference (GF-GA), then GF.
  // This matches real football tiebreak hierarchy.
  const clubRows = await db
    .select()
    .from(clubs)
    .where(eq(clubs.leagueId, league.id))
    .orderBy(
      desc(clubs.seasonPoints),
      desc(sql`${clubs.seasonGoalsFor} - ${clubs.seasonGoalsAgainst}`),
      desc(clubs.seasonGoalsFor),
    );

  // Last 5 finished fixtures per club to compute form
  const finished = await db
    .select()
    .from(fixtures)
    .where(
      and(
        eq(fixtures.leagueId, league.id),
        eq(fixtures.status, "finished"),
      ),
    )
    .orderBy(desc(fixtures.playedAt));

  const formByClub = new Map<string, Array<"W" | "D" | "L">>();
  for (const c of clubRows) formByClub.set(c.id, []);
  for (const f of finished) {
    const hRes: "W" | "D" | "L" =
      (f.homeScore ?? 0) > (f.awayScore ?? 0)
        ? "W"
        : (f.homeScore ?? 0) < (f.awayScore ?? 0)
          ? "L"
          : "D";
    const aRes: "W" | "D" | "L" =
      hRes === "W" ? "L" : hRes === "L" ? "W" : "D";
    const hArr = formByClub.get(f.homeClubId);
    const aArr = formByClub.get(f.awayClubId);
    if (hArr && hArr.length < 5) hArr.push(hRes);
    if (aArr && aArr.length < 5) aArr.push(aRes);
  }

  const standings: DashLeagueRow[] = clubRows.map((c) => ({
    clubId: c.id,
    name: c.name,
    shortName: c.shortName,
    color: c.color,
    color2: c.color2,
    p: c.seasonWins + c.seasonDraws + c.seasonLosses,
    w: c.seasonWins,
    d: c.seasonDraws,
    l: c.seasonLosses,
    gf: c.seasonGoalsFor,
    ga: c.seasonGoalsAgainst,
    pts: c.seasonPoints,
    form: formByClub.get(c.id) ?? [],
    isMe: c.id === club.id,
  }));

  const myStanding = standings.find((s) => s.isMe);
  const myPosition = standings.findIndex((s) => s.isMe) + 1;

  // Next fixture for user's club
  const now = new Date();
  const nextRow = (
    await db
      .select()
      .from(fixtures)
      .where(
        and(
          eq(fixtures.leagueId, league.id),
          eq(fixtures.status, "scheduled"),
          gt(fixtures.scheduledAt, now),
        ),
      )
      .orderBy(fixtures.scheduledAt)
  ).find((f) => f.homeClubId === club.id || f.awayClubId === club.id);
  let nextFixture: DashNextFixture = null;
  if (nextRow) {
    const [home] = await db
      .select({ id: clubs.id, name: clubs.name, short: clubs.shortName, city: clubs.city })
      .from(clubs)
      .where(eq(clubs.id, nextRow.homeClubId));
    const [away] = await db
      .select({ id: clubs.id, name: clubs.name, short: clubs.shortName, city: clubs.city })
      .from(clubs)
      .where(eq(clubs.id, nextRow.awayClubId));
    const opponentId =
      nextRow.homeClubId === club.id ? nextRow.awayClubId : nextRow.homeClubId;

    // Opponent form — last 5 finished fixtures
    const opponentFinished = (
      await db
        .select()
        .from(fixtures)
        .where(
          and(
            eq(fixtures.leagueId, league.id),
            eq(fixtures.status, "finished"),
            or(
              eq(fixtures.homeClubId, opponentId),
              eq(fixtures.awayClubId, opponentId),
            ),
          ),
        )
        .orderBy(desc(fixtures.playedAt))
    ).slice(0, 5);
    const opponentForm: Array<"W" | "D" | "L"> = opponentFinished.map((f) => {
      const gf = f.homeClubId === opponentId ? f.homeScore ?? 0 : f.awayScore ?? 0;
      const ga = f.homeClubId === opponentId ? f.awayScore ?? 0 : f.homeScore ?? 0;
      return gf > ga ? "W" : gf < ga ? "L" : "D";
    });

    // H2H — last 3 finished fixtures between the two clubs
    const h2hRows = (
      await db
        .select()
        .from(fixtures)
        .where(
          and(
            eq(fixtures.leagueId, league.id),
            eq(fixtures.status, "finished"),
            or(
              and(
                eq(fixtures.homeClubId, club.id),
                eq(fixtures.awayClubId, opponentId),
              ),
              and(
                eq(fixtures.homeClubId, opponentId),
                eq(fixtures.awayClubId, club.id),
              ),
            ),
          ),
        )
        .orderBy(desc(fixtures.playedAt))
    ).slice(0, 3);
    const h2h = h2hRows.map((f) => {
      const ourScore = f.homeClubId === club.id ? f.homeScore ?? 0 : f.awayScore ?? 0;
      const theirScore = f.homeClubId === club.id ? f.awayScore ?? 0 : f.homeScore ?? 0;
      const result: "W" | "D" | "L" =
        ourScore > theirScore ? "W" : ourScore < theirScore ? "L" : "D";
      return { ourScore, theirScore, result, weekNumber: f.weekNumber };
    });

    nextFixture = {
      id: nextRow.id,
      homeClubId: home.id,
      homeClubName: home.name,
      homeClubShort: home.short,
      awayClubId: away.id,
      awayClubName: away.name,
      awayClubShort: away.short,
      scheduledAtMs: new Date(nextRow.scheduledAt).getTime(),
      venue: nextRow.venue,
      isDerby: home.city === away.city,
      isHome: nextRow.homeClubId === club.id,
      opponentForm,
      h2h,
    };
  }

  // Feed
  const feedRows = await db
    .select()
    .from(feedEvents)
    .where(eq(feedEvents.leagueId, league.id))
    .orderBy(desc(feedEvents.createdAt))
    .limit(12);
  const feed: DashFeedItem[] = feedRows.map((f) => ({
    id: f.id,
    type: f.eventType,
    text: f.text,
    clubId: f.clubId,
    relativeTime: relativeTime(new Date(f.createdAt), Date.now()),
  }));

  // Squad status
  const mySquad = await db
    .select({
      id: players.id,
      status: players.status,
    })
    .from(players)
    .where(eq(players.clubId, club.id));
  const squadStatus: DashSquadStatus = {
    total: mySquad.length,
    injured: mySquad.filter((p) => p.status === "injured").length,
    suspended: mySquad.filter((p) => p.status === "suspended").length,
    training: mySquad.filter((p) => p.status === "training").length,
  };

  const crestLookup: CrestLookup = {};
  for (const c of clubRows) {
    crestLookup[c.id] = {
      color: c.color,
      color2: c.color2,
      short: c.shortName,
    };
  }

  const streak = await tickLoginStreak(ctx.user.id);

  return {
    myClub: {
      id: club.id,
      name: club.name,
      shortName: club.shortName,
      color: club.color,
      color2: club.color2,
      balanceEur: Math.round(Number(club.balanceCents) / 100),
      morale: club.morale,
      position: myPosition,
      points: myStanding?.pts ?? 0,
    },
    streak,
    leagueInfo: {
      name: league.name,
      seasonNumber: league.seasonNumber,
      weekNumber: league.weekNumber,
      seasonLength: league.seasonLength,
      inviteCode: league.inviteCode,
      memberCount: clubRows.filter((c) => !c.isBot).length,
      botCount: clubRows.filter((c) => c.isBot).length,
    },
    nextFixture,
    standings,
    feed,
    squadStatus,
    crestLookup,
  };
}
