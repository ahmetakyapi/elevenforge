/**
 * Bot purchase & listing pulse.
 *
 * Each hour:
 *  - Up to 3 random active listings are purchased by AI (weighted by value,
 *    young potential, and seller type).
 *  - 0-3 new bot-market listings are added from random unlisted bot-club
 *    players so the market always has fresh stock.
 */
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  clubs,
  feedEvents,
  players,
  transferHistory,
  transferListings,
} from "@/lib/schema";

export async function runTransferBots(opts: { leagueId?: string } = {}) {
  const leaguesToRun = opts.leagueId
    ? [{ id: opts.leagueId }]
    : await db.select({ id: clubs.leagueId }).from(clubs).groupBy(clubs.leagueId);

  let purchased = 0;
  let created = 0;

  for (const { id: leagueId } of leaguesToRun) {
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
      if (!winner || winner.balanceCents < listing.priceCents) continue;

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

      await db
        .update(players)
        .set({ clubId: winner.id, status: "active" })
        .where(eq(players.id, listing.playerId));
      await db.insert(transferHistory).values({
        leagueId,
        playerId: listing.playerId,
        fromClubId: listing.sellerClubId,
        toClubId: winner.id,
        priceCents: listing.priceCents,
      });
      await db
        .update(clubs)
        .set({ balanceCents: sql`${clubs.balanceCents} - ${listing.priceCents}` })
        .where(eq(clubs.id, winner.id));
      if (listing.sellerClubId) {
        await db
          .update(clubs)
          .set({ balanceCents: sql`${clubs.balanceCents} + ${listing.priceCents}` })
          .where(eq(clubs.id, listing.sellerClubId));
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

    // 1. Random purchases
    const active = await db
      .select()
      .from(transferListings)
      .where(
        and(
          eq(transferListings.leagueId, leagueId),
          eq(transferListings.status, "active"),
        ),
      );

    // Probability each active listing is bought = f(attractiveness)
    for (const listing of active) {
      const playerRow = (
        await db
          .select()
          .from(players)
          .where(eq(players.id, listing.playerId))
          .limit(1)
      )[0];
      if (!playerRow) continue;

      // Attractiveness: higher overall + high potential + young = more likely
      const ageFactor = playerRow.age <= 22 ? 1.3 : playerRow.age <= 26 ? 1.1 : 0.8;
      const potFactor = 1 + (playerRow.potential - playerRow.overall) / 30;
      const baseProb = 0.12; // per listing per hour
      const prob = baseProb * ageFactor * potFactor;
      if (Math.random() > prob) continue;

      // Pick a random bot club in this league with budget to buy.
      // Bug-fix: priceCents is already in cents — comparing it directly to
      // balanceCents (also cents). The previous `* 100` made bots almost
      // never afford anything and over-deducted by 100x when they did.
      const botClubs = await db
        .select()
        .from(clubs)
        .where(and(eq(clubs.leagueId, leagueId), eq(clubs.isBot, true)));
      const buyerPool = botClubs.filter(
        (c) => c.balanceCents >= listing.priceCents &&
          c.id !== listing.sellerClubId,
      );
      if (buyerPool.length === 0) continue;
      const buyer = buyerPool[Math.floor(Math.random() * buyerPool.length)];

      // Optimistic claim — same race-condition guard as the user path.
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

      await db
        .update(players)
        .set({ clubId: buyer.id, status: "active" })
        .where(eq(players.id, playerRow.id));
      await db.insert(transferHistory).values({
        leagueId,
        playerId: playerRow.id,
        fromClubId: listing.sellerClubId,
        toClubId: buyer.id,
        priceCents: listing.priceCents,
      });
      await db
        .update(clubs)
        .set({ balanceCents: sql`${clubs.balanceCents} - ${listing.priceCents}` })
        .where(eq(clubs.id, buyer.id));
      if (listing.sellerClubId) {
        await db
          .update(clubs)
          .set({ balanceCents: sql`${clubs.balanceCents} + ${listing.priceCents}` })
          .where(eq(clubs.id, listing.sellerClubId));
      }
      await db.insert(feedEvents).values({
        leagueId,
        clubId: buyer.id,
        eventType: "transfer",
        text: `${buyer.name} ${playerRow.name}'i €${Math.round(listing.priceCents / 100 / 1_000_000 * 10) / 10}M karşılığında aldı`,
      });
      purchased++;
    }

    // 2. Replenish bot listings to keep at least 8 active
    const remainingActive = await db
      .select()
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

    // Pick bot-club players not already listed
    const botClubIds = (
      await db
        .select({ id: clubs.id })
        .from(clubs)
        .where(and(eq(clubs.leagueId, leagueId), eq(clubs.isBot, true)))
    ).map((c) => c.id);
    if (botClubIds.length === 0) continue;
    const candidatePlayers = (
      await db.select().from(players).where(eq(players.leagueId, leagueId))
    ).filter(
      (p) =>
        p.clubId &&
        botClubIds.includes(p.clubId) &&
        !remainingActive.some((l) => l.playerId === p.id),
    );
    if (candidatePlayers.length === 0) continue;

    // Shuffle and pick first `toAdd`
    const picked = candidatePlayers
      .sort(() => Math.random() - 0.5)
      .slice(0, toAdd);
    const now = Date.now();
    for (const p of picked) {
      const priceCents = Math.round(
        p.marketValueCents * (0.95 + Math.random() * 0.35),
      );
      await db.insert(transferListings).values({
        leagueId,
        playerId: p.id,
        sellerClubId: null,
        isBotMarket: true,
        priceCents,
        originalPriceCents: priceCents,
        expiresAt: new Date(now + 30 * 3600 * 1000),
      });
      created++;
    }
  }

  return { purchased, created };
}
