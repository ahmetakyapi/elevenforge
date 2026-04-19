/**
 * Award badges for milestones. Idempotent per (clubId, code, season) so
 * re-running doesn't duplicate. Called from rollSeasonIfDone (season-end
 * milestones) and runCupRound (cup winner).
 */
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { achievements, clubs } from "@/lib/schema";

export type AchievementCode =
  | "champion"
  | "cup-winner"
  | "double"
  | "first-promotion"
  | "perfect-season"
  | "top-scorer-team";

export type AchievementMeta = {
  label: string;
  emoji: string;
  tint: string;
};

export const ACHIEVEMENT_META: Record<AchievementCode, AchievementMeta> = {
  champion: { label: "Şampiyon", emoji: "🏆", tint: "var(--gold)" },
  "cup-winner": { label: "Kupa Şampiyonu", emoji: "🥇", tint: "var(--accent)" },
  double: { label: "Çiftli (Lig + Kupa)", emoji: "🎖", tint: "var(--gold)" },
  "first-promotion": { label: "İlk Çıkış", emoji: "🚀", tint: "var(--emerald)" },
  "perfect-season": { label: "Yenilmez Sezon", emoji: "💎", tint: "var(--indigo)" },
  "top-scorer-team": { label: "En Çok Gol Atan Takım", emoji: "🎯", tint: "var(--accent)" },
};

async function alreadyAwarded(
  clubId: string,
  code: string,
  season: number,
): Promise<boolean> {
  const rows = await db
    .select({ id: achievements.id })
    .from(achievements)
    .where(
      and(
        eq(achievements.clubId, clubId),
        eq(achievements.code, code),
        sql`${achievements.payloadJson}::text LIKE ${"%" + `"season":${season}` + "%"}`,
      ),
    )
    .limit(1);
  return rows.length > 0;
}

export async function awardAchievement(input: {
  leagueId: string;
  clubId: string;
  code: AchievementCode;
  season: number;
  extra?: Record<string, unknown>;
}): Promise<void> {
  if (await alreadyAwarded(input.clubId, input.code, input.season)) return;
  await db.insert(achievements).values({
    leagueId: input.leagueId,
    clubId: input.clubId,
    code: input.code,
    payloadJson: JSON.stringify({ season: input.season, ...input.extra }),
  });
}

/**
 * Called from rollSeasonIfDone with the final standings (rank 1 = champion).
 * Awards: champion, perfect-season (no losses), top-scorer-team.
 */
export async function evaluateSeasonAchievements(input: {
  leagueId: string;
  season: number;
  standings: Array<{ id: string; rank: number }>;
}): Promise<void> {
  const cs = await db
    .select()
    .from(clubs)
    .where(eq(clubs.leagueId, input.leagueId));

  const championRow = input.standings.find((s) => s.rank === 1);
  if (championRow) {
    await awardAchievement({
      leagueId: input.leagueId,
      clubId: championRow.id,
      code: "champion",
      season: input.season,
    });
  }

  // Perfect season — 0 losses
  for (const c of cs) {
    if (c.seasonLosses === 0 && c.seasonWins + c.seasonDraws > 0) {
      await awardAchievement({
        leagueId: input.leagueId,
        clubId: c.id,
        code: "perfect-season",
        season: input.season,
      });
    }
  }

  // Top scorer team
  const topScorer = [...cs].sort(
    (a, b) => b.seasonGoalsFor - a.seasonGoalsFor,
  )[0];
  if (topScorer && topScorer.seasonGoalsFor > 0) {
    await awardAchievement({
      leagueId: input.leagueId,
      clubId: topScorer.id,
      code: "top-scorer-team",
      season: input.season,
    });
  }
}
