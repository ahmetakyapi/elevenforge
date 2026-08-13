/**
 * Inactive-manager takeover.
 *
 * In a 10-12 person league somebody always stops logging in. Before this,
 * their club simply froze: same lineup every week, no transfers, an easy
 * three points for whoever played them, and a squad that rotted as contracts
 * expired. That distorts the whole table.
 *
 * So after a grace period the AI takes over the club and plays it properly.
 * The moment the human logs back in, control returns to them — nothing is
 * taken away permanently, and their squad is in better shape than they left
 * it.
 */
import { and, eq, isNotNull, lt, or, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { clubs, feedEvents, users } from "@/lib/schema";

/** Days without a login before the assistant manager steps in. */
export const INACTIVITY_DAYS = 5;

export async function syncInactiveManagers(opts: { leagueId?: string } = {}) {
  const cutoff = new Date(Date.now() - INACTIVITY_DAYS * 24 * 3600 * 1000);

  // Clubs whose owner has gone quiet (or never logged in since signup).
  const stale = await db
    .select({ clubId: clubs.id, leagueId: clubs.leagueId, clubName: clubs.name })
    .from(clubs)
    .innerJoin(users, eq(users.id, clubs.ownerUserId))
    .where(
      and(
        eq(clubs.aiManaged, false),
        eq(clubs.isBot, false),
        isNotNull(clubs.ownerUserId),
        or(isNull(users.lastLoginAt), lt(users.lastLoginAt, cutoff)),
        ...(opts.leagueId ? [eq(clubs.leagueId, opts.leagueId)] : []),
      ),
    );

  for (const row of stale) {
    const claimed = await db
      .update(clubs)
      .set({ aiManaged: true })
      .where(and(eq(clubs.id, row.clubId), eq(clubs.aiManaged, false)))
      .returning();
    if (claimed.length === 0) continue;
    await db.insert(feedEvents).values({
      leagueId: row.leagueId,
      clubId: row.clubId,
      eventType: "morale",
      text: `${row.clubName} geçici olarak yardımcı antrenöre emanet edildi — menajer döndüğünde kontrol ona geçecek.`,
    });
  }

  return { takenOver: stale.length };
}

/**
 * Hand a club back the moment its owner logs in. Called from the login
 * streak tick, which already runs on every dashboard load.
 */
export async function releaseClubToOwner(userId: string): Promise<void> {
  await db
    .update(clubs)
    .set({ aiManaged: false })
    .where(
      and(
        eq(clubs.ownerUserId, userId),
        eq(clubs.aiManaged, true),
        eq(clubs.isBot, false),
      ),
    );
}
