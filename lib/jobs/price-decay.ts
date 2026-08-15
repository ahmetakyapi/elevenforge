/**
 * Every 6 hours: each active listing drops 8%, bounded at 20% of its original
 * price. A listing that reaches the floor, or passes its expiry date, closes.
 *
 * Closing a listing MUST also release the player. Previously the listing was
 * flipped to 'expired' while `players.status` stayed 'listed' forever, which
 * left the player unable to be trained or re-listed and invisible to the AI
 * manager's squad logic — a slow leak that silently froze part of every
 * squad. The `expires_at` column was written at listing time and then never
 * read at all.
 */
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { players, transferListings } from "@/lib/schema";

/**
 * Return listed players to active status.
 *
 * Guarded on `status = 'listed'` so it cannot clobber a player who was sold,
 * injured or suspended in the meantime.
 */
export async function releasePlayers(playerIds: string[]): Promise<void> {
  if (playerIds.length === 0) return;
  await db
    .update(players)
    .set({ status: "active" })
    .where(
      and(inArray(players.id, playerIds), eq(players.status, "listed")),
    );
}

export async function runPriceDecay(opts: { leagueId?: string } = {}) {
  const now = new Date();

  const listings = await db
    .select()
    .from(transferListings)
    .where(
      opts.leagueId
        ? and(
            eq(transferListings.leagueId, opts.leagueId),
            eq(transferListings.status, "active"),
          )
        : eq(transferListings.status, "active"),
    );

  const toExpire: string[] = [];
  const expiredPlayerIds: string[] = [];
  let decayed = 0;

  for (const l of listings) {
    const floor = Math.round(l.originalPriceCents * 0.2);
    const nextPrice = Math.round(l.priceCents * 0.92);
    const pastExpiry = l.expiresAt.getTime() <= now.getTime();

    if (pastExpiry || nextPrice <= floor) {
      toExpire.push(l.id);
      expiredPlayerIds.push(l.playerId);
      continue;
    }
    await db
      .update(transferListings)
      .set({ priceCents: nextPrice, lastDecayAt: now })
      .where(
        and(
          eq(transferListings.id, l.id),
          eq(transferListings.status, "active"),
        ),
      );
    decayed++;
  }

  if (toExpire.length > 0) {
    await db
      .update(transferListings)
      .set({ status: "expired" })
      .where(
        and(
          inArray(transferListings.id, toExpire),
          eq(transferListings.status, "active"),
        ),
      );
    await releasePlayers(expiredPlayerIds);
  }

  // Self-heal: any player still flagged 'listed' with no open listing behind
  // them. Rows in this state predate the fix, and a crash between the two
  // writes above could create another.
  const strandedRows = await db
    .select({ id: players.id })
    .from(players)
    .where(
      opts.leagueId
        ? and(eq(players.status, "listed"), eq(players.leagueId, opts.leagueId))
        : eq(players.status, "listed"),
    );
  if (strandedRows.length > 0) {
    const openRows = await db
      .select({ playerId: transferListings.playerId })
      .from(transferListings)
      .where(
        and(
          inArray(
            transferListings.playerId,
            strandedRows.map((r) => r.id),
          ),
          eq(transferListings.status, "active"),
        ),
      );
    const stillListed = new Set(openRows.map((r) => r.playerId));
    const stranded = strandedRows
      .map((r) => r.id)
      .filter((id) => !stillListed.has(id));
    await releasePlayers(stranded);
    return { decayed, expired: toExpire.length, released: stranded.length };
  }

  return { decayed, expired: toExpire.length, released: 0 };
}
