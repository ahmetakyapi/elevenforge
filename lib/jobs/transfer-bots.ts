/**
 * Bot purchase & listing pulse.
 *
 * Each hour:
 *  - Up to 3 random active listings are purchased by AI (weighted by value,
 *    young potential, and seller type).
 *  - 0-3 new bot-market listings are added from random unlisted bot-club
 *    players so the market always has fresh stock.
 */
import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { creditClub, debitClub } from "@/lib/money";
import {
  clubs,
  feedEvents,
  players,
  transferHistory,
  leagues,
  transferListings,
} from "@/lib/schema";
import { transferWindow } from "@/lib/transfer-window";

export async function runTransferBots(opts: { leagueId?: string } = {}) {
  const leaguesToRun = opts.leagueId
    ? [{ id: opts.leagueId }]
    : await db.select({ id: clubs.leagueId }).from(clubs).groupBy(clubs.leagueId);

  let purchased = 0;
  let created = 0;

  // Window state per league, in one query. This job never read the leagues
  // table either — it groups clubs by leagueId and works from that — so the
  // lookup has to be added rather than threaded through.
  const windowById = new Map(
    (
      await db
        .select({
          id: leagues.id,
          weekNumber: leagues.weekNumber,
          seasonLength: leagues.seasonLength,
        })
        .from(leagues)
        .where(
          opts.leagueId ? eq(leagues.id, opts.leagueId) : sql`true`,
        )
    ).map((l) => [l.id, transferWindow(l)]),
  );

  for (const { id: leagueId } of leaguesToRun) {
    // Nothing moves between clubs while the window is shut — not the
    // auto-bid settlement below, not the bot purchases, not the free-agent
    // top-up. A market that keeps trading for bots while refusing every human
    // action is worse than no window at all.
    if (!(windowById.get(leagueId)?.open ?? true)) continue;

    // 0. Process auto-bids first. For every active listing where the
    //    current price is <= a watcher's max bid, the highest watcher wins
    //    and the listing closes. This runs before bot random purchases so
    //    user auto-bids always get first crack at falling-price listings.
    const watching = await db
      .select()
      .from(transferListings)
      .where(
        and(
          eq(transferListings.leagueId, leagueId),
          eq(transferListings.status, "active"),
        ),
      );
    for (const listing of watching) {
      let bids: Array<{ clubId: string; maxCents: number }> = [];
      try {
        bids = JSON.parse(listing.autoBidsJson) as typeof bids;
      } catch {}
      const eligible = bids
        .filter((b) => b.maxCents >= listing.priceCents)
        .sort((a, b) => b.maxCents - a.maxCents);
      if (eligible.length === 0) continue;
      const winnerBid = eligible[0];
      const [winner] = await db
        .select()
        .from(clubs)
        .where(eq(clubs.id, winnerBid.clubId));
      if (!winner) continue;

      // Optimistic claim
      const claim = await db
        .update(transferListings)
        .set({ status: "sold" })
        .where(
          and(
            eq(transferListings.id, listing.id),
            eq(transferListings.status, "active"),
          ),
        )
        .returning();
      if (claim.length === 0) continue;

      // Guarded debit is the affordability check; the balance read above may
      // already be stale by the time we get here.
      const paid = await debitClub(winner.id, listing.priceCents, undefined, {
        kind: "transfer_in",
      });
      if (!paid) {
        await db
          .update(transferListings)
          .set({ status: "active" })
          .where(eq(transferListings.id, listing.id));
        continue;
      }

      // Only move the player if the seller still owns him — otherwise refund
      // and void the stale listing.
      const moved = await db
        .update(players)
        .set({ clubId: winner.id, status: "active" })
        .where(
          and(
            eq(players.id, listing.playerId),
            listing.sellerClubId
              ? eq(players.clubId, listing.sellerClubId)
              : isNull(players.clubId),
          ),
        )
        .returning();
      if (moved.length === 0) {
        await creditClub(winner.id, listing.priceCents, undefined, {
          kind: "transfer_refund",
        });
        await db
          .update(transferListings)
          .set({ status: "expired" })
          .where(eq(transferListings.id, listing.id));
        continue;
      }

      await db.insert(transferHistory).values({
        leagueId,
        playerId: listing.playerId,
        fromClubId: listing.sellerClubId,
        toClubId: winner.id,
        priceCents: listing.priceCents,
      });
      if (listing.sellerClubId) {
        await creditClub(listing.sellerClubId, listing.priceCents, undefined, {
          kind: "transfer_out",
        });
      }
      const playerRow = (
        await db
          .select({ name: players.name })
          .from(players)
          .where(eq(players.id, listing.playerId))
          .limit(1)
      )[0];
      await db.insert(feedEvents).values({
        leagueId,
        clubId: winner.id,
        eventType: "transfer",
        text: `${winner.name} otomatik teklifle ${playerRow?.name ?? "?"} aldı (€${(listing.priceCents / 100 / 1_000_000).toFixed(1)}M).`,
      });
      purchased++;
    }

    // (The old "bots randomly buy listings" block lived here. Buying is now
    //  a real decision made by the AI manager in lib/ai/manager.ts, which
    //  considers squad needs, budget and personality instead of rolling dice
    //  — and does it with the same guarded money helpers a human uses.)

    // 2. Top the market up from the free-agent pool.
    //
    //    This used to list bot clubs' own players with sellerClubId=null, so
    //    when one sold the bot lost a player and received nothing — a slow
    //    leak that drained every bot squad while destroying money. Clubs now
    //    list their own players through the AI manager (which credits them
    //    properly); the only stock created here is genuinely unowned.
    const remainingActive = await db
      .select({ playerId: transferListings.playerId })
      .from(transferListings)
      .where(
        and(
          eq(transferListings.leagueId, leagueId),
          eq(transferListings.status, "active"),
        ),
      );
    const target = 12;
    const toAdd = Math.max(0, target - remainingActive.length);
    if (toAdd === 0) continue;

    const listedIds = new Set(remainingActive.map((l) => l.playerId));
    const freeAgents = (
      await db
        .select()
        .from(players)
        .where(and(eq(players.leagueId, leagueId), isNull(players.clubId)))
    ).filter((p) => !listedIds.has(p.id));
    if (freeAgents.length === 0) continue;

    const picked = freeAgents
      .sort(() => Math.random() - 0.5)
      .slice(0, toAdd);
    const now = Date.now();
    for (const p of picked) {
      const priceCents = Math.round(
        p.marketValueCents * (0.95 + Math.random() * 0.35),
      );
      try {
        await db.insert(transferListings).values({
          leagueId,
          playerId: p.id,
          sellerClubId: null,
          isBotMarket: true,
          priceCents,
          originalPriceCents: priceCents,
          expiresAt: new Date(now + 30 * 3600 * 1000),
        });
      } catch {
        continue; // raced with another listing for the same player
      }
      created++;
    }
  }

  return { purchased, created };
}
