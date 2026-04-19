import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { clubs, cupFixtures, leagues } from "@/lib/schema";
import type { LeagueContext } from "@/lib/session";

export type CupTie = {
  id: string;
  round: number;
  slot: number;
  homeId: string | null;
  awayId: string | null;
  homeName: string | null;
  awayName: string | null;
  homeShort: string | null;
  awayShort: string | null;
  homeColor: string | null;
  awayColor: string | null;
  homeScore: number | null;
  awayScore: number | null;
  winnerId: string | null;
  status: string;
  scheduledAtMs: number;
};

export async function loadCupBracket(
  ctx: LeagueContext,
): Promise<{ ties: CupTie[]; season: number; matchTime: string }> {
  const [lg] = await db
    .select()
    .from(leagues)
    .where(eq(leagues.id, ctx.league.id));
  const rows = await db
    .select()
    .from(cupFixtures)
    .where(
      and(
        eq(cupFixtures.leagueId, ctx.league.id),
        eq(cupFixtures.seasonNumber, lg.seasonNumber),
      ),
    )
    .orderBy(asc(cupFixtures.round), asc(cupFixtures.slot));

  const cs = await db
    .select()
    .from(clubs)
    .where(eq(clubs.leagueId, ctx.league.id));
  const byId = new Map(cs.map((c) => [c.id, c]));

  const ties: CupTie[] = rows.map((r) => {
    const home = r.homeClubId ? byId.get(r.homeClubId) ?? null : null;
    const away = r.awayClubId ? byId.get(r.awayClubId) ?? null : null;
    return {
      id: r.id,
      round: r.round,
      slot: r.slot,
      homeId: r.homeClubId,
      awayId: r.awayClubId,
      homeName: home?.name ?? null,
      awayName: away?.name ?? null,
      homeShort: home?.shortName ?? null,
      awayShort: away?.shortName ?? null,
      homeColor: home?.color ?? null,
      awayColor: away?.color ?? null,
      homeScore: r.homeScore,
      awayScore: r.awayScore,
      winnerId: r.winnerClubId,
      status: r.status,
      scheduledAtMs: new Date(r.scheduledAt).getTime(),
    };
  });

  return { ties, season: lg.seasonNumber, matchTime: lg.matchTime };
}
