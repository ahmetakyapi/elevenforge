import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { achievements } from "@/lib/schema";
import { ACHIEVEMENT_META, type AchievementCode } from "@/lib/jobs/achievements";

export type AchievementBadge = {
  code: AchievementCode;
  label: string;
  emoji: string;
  tint: string;
  count: number;
  latestSeason: number | null;
};

export async function loadClubAchievements(
  clubId: string,
): Promise<AchievementBadge[]> {
  const rows = await db
    .select()
    .from(achievements)
    .where(eq(achievements.clubId, clubId))
    .orderBy(desc(achievements.awardedAt));

  const counts = new Map<string, { count: number; latestSeason: number | null }>();
  for (const r of rows) {
    let season: number | null = null;
    try {
      const p = JSON.parse(r.payloadJson) as { season?: number };
      if (typeof p.season === "number") season = p.season;
    } catch {}
    const existing = counts.get(r.code) ?? { count: 0, latestSeason: null };
    existing.count += 1;
    if (season !== null && (existing.latestSeason === null || season > existing.latestSeason)) {
      existing.latestSeason = season;
    }
    counts.set(r.code, existing);
  }

  return Array.from(counts.entries())
    .filter(([code]) => code in ACHIEVEMENT_META)
    .map(([code, info]) => {
      const meta = ACHIEVEMENT_META[code as AchievementCode];
      return {
        code: code as AchievementCode,
        label: meta.label,
        emoji: meta.emoji,
        tint: meta.tint,
        count: info.count,
        latestSeason: info.latestSeason,
      };
    });
}
