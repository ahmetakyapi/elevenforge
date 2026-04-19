import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { clubs, newspapers } from "@/lib/schema";
import type { LeagueContext } from "@/lib/session";
import type { TotwEntry } from "@/lib/engine/totw";

export type NewspaperCover = {
  heroHomeClubId: string;
  heroAwayClubId: string;
  heroHomeClubName: string;
  heroAwayClubName: string;
  homeScore: number;
  awayScore: number;
  headline: string;
  subhead: string;
  weekNumber: number;
  seasonNumber: number;
};

export type CrestLookup = Record<
  string,
  { color: string; color2: string; short: string }
>;

export type NewspaperData = {
  cover: NewspaperCover;
  totw: TotwEntry[];
  scorers: Array<{ name: string; clubId: string; g: number }>;
  assists: Array<{ name: string; clubId: string; a: number }>;
  funFact: string;
  publishedAt: Date;
  crestLookup: CrestLookup;
} | null;

export async function loadLatestNewspaper(
  ctx: LeagueContext,
): Promise<NewspaperData> {
  const paper = (
    await db
      .select()
      .from(newspapers)
      .where(eq(newspapers.leagueId, ctx.league.id))
      .orderBy(desc(newspapers.publishedAt))
      .limit(1)
  )[0];
  if (!paper) return null;

  const coverRaw = JSON.parse(paper.coverJson) as {
    heroHomeClubId: string;
    heroAwayClubId: string;
    homeScore: number;
    awayScore: number;
    headline: string;
    subhead: string;
    weekNumber: number;
    seasonNumber: number;
  };
  const totw = JSON.parse(paper.totwJson) as TotwEntry[];
  const scorers = JSON.parse(paper.scorersJson) as Array<{
    name: string;
    clubId: string;
    g: number;
  }>;
  const assists = JSON.parse(paper.assistsJson) as Array<{
    name: string;
    clubId: string;
    a: number;
  }>;

  const [home, away] = await Promise.all([
    db.select().from(clubs).where(eq(clubs.id, coverRaw.heroHomeClubId)).limit(1),
    db.select().from(clubs).where(eq(clubs.id, coverRaw.heroAwayClubId)).limit(1),
  ]);

  // Load all league clubs into a crest lookup so Crest renders correctly
  const allClubs = await db
    .select()
    .from(clubs)
    .where(eq(clubs.leagueId, ctx.league.id));
  const crestLookup: CrestLookup = {};
  for (const c of allClubs) {
    crestLookup[c.id] = {
      color: c.color,
      color2: c.color2,
      short: c.shortName,
    };
  }

  return {
    cover: {
      ...coverRaw,
      heroHomeClubName: home[0]?.name ?? "",
      heroAwayClubName: away[0]?.name ?? "",
    },
    totw,
    scorers,
    assists,
    funFact: paper.funFact,
    publishedAt: new Date(paper.publishedAt),
    crestLookup,
  };
}
