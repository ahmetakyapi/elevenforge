import { and, desc, eq, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { clubs, fixtures } from "@/lib/schema";
import type { LeagueContext } from "@/lib/session";
import type { MatchEvent, MatchStats } from "@/lib/engine/match";

type CrestInfo = { color: string; color2: string; short: string };

export type MatchReplayData = {
  fixtureId: string;
  homeClubId: string;
  homeClubName: string;
  homeClubCity: string;
  homeClubCrest: CrestInfo;
  homeScore: number;
  awayClubId: string;
  awayClubName: string;
  awayClubCity: string;
  awayClubCrest: CrestInfo;
  awayScore: number;
  weekNumber: number;
  seasonNumber: number;
  playedAt: Date;
  events: MatchEvent[];
  stats: MatchStats;
} | null;

export async function loadLatestMatch(
  ctx: LeagueContext,
): Promise<MatchReplayData> {
  // Prefer user's own last finished match; fall back to league's latest.
  const [mine] = await db
    .select()
    .from(fixtures)
    .where(
      and(
        eq(fixtures.leagueId, ctx.league.id),
        eq(fixtures.status, "finished"),
        or(
          eq(fixtures.homeClubId, ctx.club.id),
          eq(fixtures.awayClubId, ctx.club.id),
        ),
      ),
    )
    .orderBy(desc(fixtures.playedAt))
    .limit(1);

  const fixture =
    mine ??
    (
      await db
        .select()
        .from(fixtures)
        .where(
          and(
            eq(fixtures.leagueId, ctx.league.id),
            eq(fixtures.status, "finished"),
          ),
        )
        .orderBy(desc(fixtures.playedAt))
        .limit(1)
    )[0];

  if (!fixture || !fixture.commentaryJson || !fixture.statsJson) return null;

  const [home, away] = await Promise.all([
    db.select().from(clubs).where(eq(clubs.id, fixture.homeClubId)).limit(1),
    db.select().from(clubs).where(eq(clubs.id, fixture.awayClubId)).limit(1),
  ]);
  if (!home[0] || !away[0]) return null;

  let events: MatchEvent[] = [];
  try {
    events = JSON.parse(fixture.commentaryJson) as MatchEvent[];
  } catch {}
  let stats: MatchStats = {
    possessionHome: 50,
    possessionAway: 50,
    shotsHome: 0,
    shotsAway: 0,
    shotsOnHome: 0,
    shotsOnAway: 0,
    cornersHome: 0,
    cornersAway: 0,
    cardsHome: 0,
    cardsAway: 0,
    crowdEnergy: 70,
    refereeName: "—",
    refereeStrictness: 3,
  };
  try {
    stats = JSON.parse(fixture.statsJson) as MatchStats;
  } catch {}

  return {
    fixtureId: fixture.id,
    homeClubId: home[0].id,
    homeClubName: home[0].name,
    homeClubCity: home[0].city,
    homeClubCrest: {
      color: home[0].color,
      color2: home[0].color2,
      short: home[0].shortName,
    },
    homeScore: fixture.homeScore ?? 0,
    awayClubId: away[0].id,
    awayClubName: away[0].name,
    awayClubCity: away[0].city,
    awayClubCrest: {
      color: away[0].color,
      color2: away[0].color2,
      short: away[0].shortName,
    },
    awayScore: fixture.awayScore ?? 0,
    weekNumber: fixture.weekNumber,
    seasonNumber: fixture.seasonNumber,
    playedAt: new Date(fixture.playedAt!),
    events,
    stats,
  };
}
