/**
 * Daily login streak — tick-once-per-day ladder with claimable rewards.
 * Called from the Dashboard server component on every load.
 */
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { clubs, feedEvents, users } from "@/lib/schema";

function daysBetween(a: Date, b: Date): number {
  const ms =
    new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime() -
    new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  return Math.round(ms / (24 * 3600 * 1000));
}

export async function tickLoginStreak(userId: string): Promise<{
  streak: number;
  rewardAvailable: boolean;
  rewardEur: number;
}> {
  const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!u) return { streak: 0, rewardAvailable: false, rewardEur: 0 };

  const now = new Date();
  let newStreak = u.loginStreak;

  if (!u.lastLoginAt) {
    newStreak = 1;
  } else {
    const gap = daysBetween(new Date(u.lastLoginAt), now);
    if (gap === 0) {
      // Already ticked today. Just return current state.
      newStreak = Math.max(1, u.loginStreak);
    } else if (gap === 1) {
      newStreak = u.loginStreak + 1;
    } else {
      newStreak = 1;
    }
  }

  if (newStreak !== u.loginStreak || u.lastLoginAt === null) {
    await db
      .update(users)
      .set({ loginStreak: newStreak, lastLoginAt: now })
      .where(eq(users.id, userId));
  }

  const rewardDay = Math.min(7, newStreak);
  const rewardEur = rewardDay * 200_000 + (rewardDay === 7 ? 500_000 : 0);
  const rewardAvailable = u.lastStreakRewardDay < newStreak;

  return { streak: newStreak, rewardAvailable, rewardEur };
}

export async function claimLoginReward(userId: string): Promise<{
  ok: boolean;
  granted?: number;
  error?: string;
}> {
  const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!u) return { ok: false, error: "Kullanıcı bulunamadı." };
  if (u.lastStreakRewardDay >= u.loginStreak) {
    return { ok: false, error: "Bugünün ödülünü zaten aldın." };
  }
  const rewardDay = Math.min(7, u.loginStreak);
  const rewardEur = rewardDay * 200_000 + (rewardDay === 7 ? 500_000 : 0);

  const [c] = await db.select().from(clubs).where(eq(clubs.ownerUserId, u.id)).limit(1);
  if (!c) return { ok: false, error: "Kulüp bulunamadı." };

  await db
    .update(clubs)
    .set({ balanceCents: c.balanceCents + rewardEur * 100 })
    .where(eq(clubs.id, c.id));
  await db
    .update(users)
    .set({ lastStreakRewardDay: u.loginStreak })
    .where(eq(users.id, u.id));

  if (rewardDay === 7) {
    await db.insert(feedEvents).values({
      leagueId: c.leagueId,
      clubId: c.id,
      eventType: "morale",
      text: `${c.name} 7 gün seri giriş ödülünü aldı: €${(rewardEur / 1_000_000).toFixed(1)}M`,
    });
  }

  return { ok: true, granted: rewardEur };
}
