import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { formatInZone } from "@/lib/match-time";
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
  /** Pre-formatted in the league timezone — see formatInZone. */
  publishedAtLabel: string;
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

  // Every column below is JSON-in-text written by a background job. A single
  // malformed value used to throw straight out of the query and render a 500
  // for the whole /newspaper route; a missing paper is a far better outcome
  // than a broken page.
  const safeParse = <T>(raw: string, fallback: T): T => {
    try {
      const parsed = JSON.parse(raw);
      return (parsed ?? fallback) as T;
    } catch {
      return fallback;
    }
  };

  const coverRaw = safeParse(paper.coverJson, null) as null | {
    heroHomeClubId: string;
    heroAwayClubId: string;
    homeScore: number;
    awayScore: number;
    headline: string;
    subhead: string;
    weekNumber: number;
    seasonNumber: number;
  };
  type ScorerRow = { name: string; clubId: string; g: number };
  type AssistRow = { name: string; clubId: string; a: number };
  const totw = safeParse<TotwEntry[]>(paper.totwJson, []);
  const scorers = safeParse<ScorerRow[]>(paper.scorersJson, []);
  const assists = safeParse<AssistRow[]>(paper.assistsJson, []);

  // A paper whose cover failed to parse has nothing to render.
  if (!coverRaw) return null;

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
    publishedAtLabel: formatInZone(
      new Date(paper.publishedAt),
      ctx.league.timeZone,
      { day: "numeric", month: "long", year: "numeric" },
    ),
    crestLookup,
  };
}
