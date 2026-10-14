import { and, asc, desc, eq, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { formatInZone } from "@/lib/match-time";
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
  /** Pre-formatted in the league timezone — see formatInZone. */
  playedAtLabel: string;
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
    xgHome: 0,
    xgAway: 0,
  };
  try {
    /*
      MERGED over the defaults, not assigned in place of them.

      Every match played before a stat existed has a `statsJson` without it,
      and the panel reads `stats.xgHome.toFixed(1)` — which throws on
      undefined and takes the whole İstatistik tab down with it. Assigning the
      parsed object wholesale meant the fallback above only protected against
      unparseable JSON, never against an OLD but perfectly valid shape, which
      is the case that actually happens: every fixture in a live league.
    */
    const parsed = JSON.parse(fixture.statsJson) as Partial<MatchStats>;
    if (parsed && typeof parsed === "object") stats = { ...stats, ...parsed };
  } catch {}
  // A merge cannot fix a key that is present but null, and it cannot fix a
  // number that arrived as a string from an older writer.
  const num = (v: unknown, fallback: number) =>
    typeof v === "number" && Number.isFinite(v) ? v : fallback;
  stats.xgHome = num(stats.xgHome, 0);
  stats.xgAway = num(stats.xgAway, 0);

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
    playedAtLabel: formatInZone(new Date(fixture.playedAt!), ctx.league.timeZone),
    events,
    stats,
  };
}

/**
 * The next fixture, for the match screen before anything has been played.
 *
 * "Henüz maç oynanmadı" with a button to the dashboard was all a new manager
 * saw on the Maç tab — one of the six tabs in the phone's bottom bar — for
 * the whole first day. The fixture list already knows who they play and
 * when; the empty screen now says so.
 */
export type NextFixturePreview = {
  homeClubName: string;
  homeClubCrest: CrestInfo;
  homeClubId: string;
  awayClubName: string;
  awayClubCrest: CrestInfo;
  awayClubId: string;
  isHome: boolean;
  scheduledAtMs: number;
  /** Pre-formatted in the league timezone. */
  scheduledAtLabel: string;
  weekNumber: number;
} | null;

export async function loadNextFixturePreview(
  ctx: LeagueContext,
): Promise<NextFixturePreview> {
  const [next] = await db
    .select()
    .from(fixtures)
    .where(
      and(
        eq(fixtures.leagueId, ctx.league.id),
        eq(fixtures.status, "scheduled"),
        or(
          eq(fixtures.homeClubId, ctx.club.id),
          eq(fixtures.awayClubId, ctx.club.id),
        ),
      ),
    )
    .orderBy(asc(fixtures.scheduledAt))
    .limit(1);
  if (!next) return null;

  const [home, away] = await Promise.all([
    db.select().from(clubs).where(eq(clubs.id, next.homeClubId)).limit(1),
    db.select().from(clubs).where(eq(clubs.id, next.awayClubId)).limit(1),
  ]);
  if (!home[0] || !away[0]) return null;

  const crest = (c: typeof home[0]): CrestInfo => ({
    color: c.color,
    color2: c.color2,
    short: c.shortName,
  });
  const at = new Date(next.scheduledAt);
  return {
    homeClubName: home[0].name,
    homeClubCrest: crest(home[0]),
    homeClubId: home[0].id,
    awayClubName: away[0].name,
    awayClubCrest: crest(away[0]),
    awayClubId: away[0].id,
    isHome: next.homeClubId === ctx.club.id,
    scheduledAtMs: at.getTime(),
    scheduledAtLabel: formatInZone(at, ctx.league.timeZone, {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    }),
    weekNumber: next.weekNumber,
  };
}
