import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { clubs, players } from "@/lib/schema";
import type { LeagueContext } from "@/lib/session";

export type StatsRow = {
  playerId: string;
  name: string;
  position: "GK" | "DEF" | "MID" | "FWD";
  role: string;
  age: number;
  overall: number;
  clubId: string | null;
  clubName: string | null;
  clubColor: string | null;
  goals: number;
  assists: number;
  yellow: number;
  red: number;
  ratingAvg: number | null;
};

export type LeagueStats = {
  topScorers: StatsRow[];
  topAssists: StatsRow[];
  topRated: StatsRow[];
  cardsLeaders: StatsRow[];
  cleanestPlayers: StatsRow[]; // most matches without yellow
  totalGoals: number;
  totalCards: number;
  goldenBoot: StatsRow | null;
  playmaker: StatsRow | null;
};

export async function loadLeagueStats(ctx: LeagueContext): Promise<LeagueStats> {
  const allPlayers = await db
    .select()
    .from(players)
    .where(eq(players.leagueId, ctx.league.id));
  const allClubs = await db
    .select()
    .from(clubs)
    .where(eq(clubs.leagueId, ctx.league.id));
  const clubMap = new Map(allClubs.map((c) => [c.id, c]));

  const rows: StatsRow[] = allPlayers.map((p) => {
    let ratings: number[] = [];
    try {
      const parsed = JSON.parse(p.lastRatings);
      if (Array.isArray(parsed)) ratings = parsed;
    } catch {}
    const ratingAvg =
      ratings.length > 0
        ? Math.round((ratings.reduce((s, r) => s + r, 0) / ratings.length) * 10) / 10
        : null;
    const club = p.clubId ? clubMap.get(p.clubId) ?? null : null;
    return {
      playerId: p.id,
      name: p.name,
      position: p.position,
      role: p.role,
      age: p.age,
      overall: p.overall,
      clubId: club?.id ?? null,
      clubName: club?.name ?? null,
      clubColor: club?.color ?? null,
      goals: p.goalsSeason,
      assists: p.assistsSeason,
      yellow: p.yellowCardsSeason,
      red: p.redCardsSeason,
      ratingAvg,
    };
  });

  const sortBy = (key: keyof StatsRow, n = 10) =>
    [...rows]
      .filter((r) => Number(r[key]) > 0)
      .sort((a, b) => Number(b[key]) - Number(a[key]))
      .slice(0, n);

  const topScorers = sortBy("goals");
  const topAssists = sortBy("assists");
  const cardsLeaders = [...rows]
    .filter((r) => r.yellow + r.red > 0)
    .sort((a, b) => b.yellow + b.red * 3 - (a.yellow + a.red * 3))
    .slice(0, 10);
  const topRated = [...rows]
    .filter((r) => r.ratingAvg !== null)
    .sort((a, b) => (b.ratingAvg ?? 0) - (a.ratingAvg ?? 0))
    .slice(0, 10);
  const cleanestPlayers = [...rows]
    .filter((r) => r.yellow === 0 && r.red === 0 && (r.ratingAvg ?? 0) >= 6.5)
    .sort((a, b) => (b.ratingAvg ?? 0) - (a.ratingAvg ?? 0))
    .slice(0, 10);

  return {
    topScorers,
    topAssists,
    topRated,
    cardsLeaders,
    cleanestPlayers,
    totalGoals: rows.reduce((s, r) => s + r.goals, 0),
    totalCards: rows.reduce((s, r) => s + r.yellow + r.red, 0),
    goldenBoot: topScorers[0] ?? null,
    playmaker: topAssists[0] ?? null,
  };
}
