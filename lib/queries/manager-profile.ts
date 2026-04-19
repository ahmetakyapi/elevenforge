import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  achievements,
  clubs,
  leagues,
  players,
  transferHistory,
} from "@/lib/schema";
import {
  ACHIEVEMENT_META,
  type AchievementCode,
} from "@/lib/jobs/achievements";
import type { LeagueContext } from "@/lib/session";

export type ManagerProfile = {
  name: string;
  email: string;
  joinedAtMs: number;
  ownedLeagues: Array<{
    leagueId: string;
    leagueName: string;
    seasonNumber: number;
    weekNumber: number;
    clubName: string;
    clubColor: string;
    rank: number;
    points: number;
    isCommissioner: boolean;
  }>;
  trophies: Array<{
    code: AchievementCode;
    label: string;
    emoji: string;
    tint: string;
    season: number | null;
    leagueName: string;
    awardedAtMs: number;
  }>;
  totals: {
    leaguesPlayed: number;
    championships: number;
    cupsWon: number;
    perfectSeasons: number;
    totalSquadValueEur: number;
    totalBalanceEur: number;
    transfersMade: number;
  };
};

export async function loadManagerProfile(
  ctx: LeagueContext,
): Promise<ManagerProfile> {
  // 1. Owned clubs across all leagues
  const ownedRows = await db
    .select({
      clubId: clubs.id,
      clubName: clubs.name,
      clubColor: clubs.color,
      leagueId: leagues.id,
      leagueName: leagues.name,
      leagueSeason: leagues.seasonNumber,
      leagueWeek: leagues.weekNumber,
      leagueCommissioner: leagues.createdByUserId,
      seasonPoints: clubs.seasonPoints,
      balanceCents: clubs.balanceCents,
    })
    .from(clubs)
    .innerJoin(leagues, eq(leagues.id, clubs.leagueId))
    .where(eq(clubs.ownerUserId, ctx.user.id));

  // 2. For each league, compute the user's rank
  const ownedLeagues: ManagerProfile["ownedLeagues"] = [];
  let totalBalance = 0;
  let totalSquadValue = 0;
  for (const o of ownedRows) {
    const leagueClubs = await db
      .select()
      .from(clubs)
      .where(eq(clubs.leagueId, o.leagueId))
      .orderBy(desc(clubs.seasonPoints));
    const sorted = [...leagueClubs].sort((a, b) => {
      if (b.seasonPoints !== a.seasonPoints) return b.seasonPoints - a.seasonPoints;
      const aGd = a.seasonGoalsFor - a.seasonGoalsAgainst;
      const bGd = b.seasonGoalsFor - b.seasonGoalsAgainst;
      return bGd - aGd;
    });
    const rank = sorted.findIndex((c) => c.id === o.clubId) + 1;
    ownedLeagues.push({
      leagueId: o.leagueId,
      leagueName: o.leagueName,
      seasonNumber: o.leagueSeason,
      weekNumber: o.leagueWeek,
      clubName: o.clubName,
      clubColor: o.clubColor,
      rank,
      points: o.seasonPoints,
      isCommissioner: o.leagueCommissioner === ctx.user.id,
    });
    totalBalance += Number(o.balanceCents);
    const squadRows = await db
      .select({ val: players.marketValueCents })
      .from(players)
      .where(eq(players.clubId, o.clubId));
    totalSquadValue += squadRows.reduce((s, r) => s + Number(r.val), 0);
  }

  // 3. Trophies — every achievement on any club this user owns
  const userClubIds = ownedRows.map((o) => o.clubId);
  const trophyRows: ManagerProfile["trophies"] = [];
  for (const cid of userClubIds) {
    const tRows = await db
      .select({
        ach: achievements,
        leagueName: leagues.name,
      })
      .from(achievements)
      .innerJoin(leagues, eq(leagues.id, achievements.leagueId))
      .where(eq(achievements.clubId, cid))
      .orderBy(desc(achievements.awardedAt));
    for (const r of tRows) {
      const meta = ACHIEVEMENT_META[r.ach.code as AchievementCode];
      if (!meta) continue;
      let season: number | null = null;
      try {
        const p = JSON.parse(r.ach.payloadJson) as { season?: number };
        if (typeof p.season === "number") season = p.season;
      } catch {}
      trophyRows.push({
        code: r.ach.code as AchievementCode,
        label: meta.label,
        emoji: meta.emoji,
        tint: meta.tint,
        season,
        leagueName: r.leagueName,
        awardedAtMs: new Date(r.ach.awardedAt).getTime(),
      });
    }
  }

  // 4. Transfer count across all owned clubs
  let transfersMade = 0;
  for (const cid of userClubIds) {
    const t = await db
      .select({ id: transferHistory.id })
      .from(transferHistory)
      .where(eq(transferHistory.toClubId, cid));
    transfersMade += t.length;
  }

  return {
    name: ctx.user.name,
    email: ctx.user.email,
    joinedAtMs: new Date(ctx.user.createdAt).getTime(),
    ownedLeagues,
    trophies: trophyRows,
    totals: {
      leaguesPlayed: ownedLeagues.length,
      championships: trophyRows.filter((t) => t.code === "champion").length,
      cupsWon: trophyRows.filter((t) => t.code === "cup-winner").length,
      perfectSeasons: trophyRows.filter((t) => t.code === "perfect-season").length,
      totalSquadValueEur: Math.round(totalSquadValue / 100),
      totalBalanceEur: Math.round(totalBalance / 100),
      transfersMade,
    },
  };
}

// Avoid unused import warning for and
void and;
