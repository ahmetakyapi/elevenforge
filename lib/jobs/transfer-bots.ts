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
import {
  MARKET_TARGET_LISTINGS,
  MAX_FREE_AGENT_SHARE,
  MAX_NEW_PER_TICK,
  marketAge,
  marketTier,
  seasonProgress,
} from "@/lib/market-quality";
import { generatePlayer, inventName } from "@/lib/player-gen";
import type { Position } from "@/types";

const POSITIONS: Position[] = ["GK", "DEF", "MID", "FWD"];

/** How many active listings each position group currently has. */
async function positionCounts(
  leagueId: string,
): Promise<Partial<Record<Position, number>>> {
  const rows = await db
    .select({ position: players.position })
    .from(transferListings)
    .innerJoin(players, eq(players.id, transferListings.playerId))
    .where(
      and(
        eq(transferListings.leagueId, leagueId),
        eq(transferListings.status, "active"),
      ),
    );
  const out: Partial<Record<Position, number>> = {};
  for (const r of rows) out[r.position] = (out[r.position] ?? 0) + 1;
  return out;
}

export async function runTransferBots(opts: { leagueId?: string } = {}) {
  const leaguesToRun = opts.leagueId
    ? [{ id: opts.leagueId }]
    : await db.select({ id: clubs.leagueId }).from(clubs).groupBy(clubs.leagueId);

  let purchased = 0;
  let created = 0;

  // Window state per league, in one query. This job never read the leagues
  // table either — it groups clubs by leagueId and works from that — so the
  // lookup has to be added rather than threaded through.
  const leagueRows = await db
    .select({
      id: leagues.id,
      weekNumber: leagues.weekNumber,
      seasonLength: leagues.seasonLength,
    })
    .from(leagues)
    .where(opts.leagueId ? eq(leagues.id, opts.leagueId) : sql`true`);
  const windowById = new Map(leagueRows.map((l) => [l.id, transferWindow(l)]));
  // The same rows again, keyed for the market-quality curve: how far into the
  // season a league is decides how good the stock it is offered should be.
  const leagueRowById = new Map(leagueRows.map((l) => [l.id, l]));

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

    // 2. Keep the market stocked.
    //
    //    This used to draw only from the league's free agents — by definition
    //    the players nobody wanted. So the market was a bargain bin that got
    //    emptier every week, and by mid-season it was eleven 62-rated squad
    //    players and nothing else. There was never anything worth saving for,
    //    which is the same as having no transfer market at all.
    //
    //    Free agents are still listed first (they exist, they should be
    //    buyable), and the rest of the shelf is INVENTED at a quality band
    //    that rises through the season — see lib/market-quality.ts. Late-season
    //    stock is genuinely strong, so banking money has a payoff.
    const remainingActive = await db
      .select({ playerId: transferListings.playerId })
      .from(transferListings)
      .where(
        and(
          eq(transferListings.leagueId, leagueId),
          eq(transferListings.status, "active"),
        ),
      );
    const toAdd = Math.max(0, MARKET_TARGET_LISTINGS - remainingActive.length);
    if (toAdd === 0) continue;

    const now = Date.now();
    const listedIds = new Set(remainingActive.map((l) => l.playerId));

    /** List an existing (unowned) player. */
    const listPlayer = async (playerId: string, valueCents: number) => {
      const priceCents = Math.round(valueCents * (0.95 + Math.random() * 0.35));
      try {
        await db.insert(transferListings).values({
          leagueId,
          playerId,
          sellerClubId: null,
          isBotMarket: true,
          priceCents,
          originalPriceCents: priceCents,
          expiresAt: new Date(now + 30 * 3600 * 1000),
        });
        return true;
      } catch {
        return false; // raced with another listing for the same player
      }
    };

    const freeAgents = (
      await db
        .select()
        .from(players)
        .where(and(eq(players.leagueId, leagueId), isNull(players.clubId)))
    ).filter((p) => !listedIds.has(p.id));

    // Free agents may fill at most half the gap — the rest is invented, so the
    // market always gets new faces even when the unowned pool is deep. See
    // MAX_FREE_AGENT_SHARE for what went wrong without this.
    const freeAgentQuota = Math.ceil(toAdd * MAX_FREE_AGENT_SHARE);
    let added = 0;
    for (const p of freeAgents.sort(() => Math.random() - 0.5).slice(0, freeAgentQuota)) {
      if (await listPlayer(p.id, Number(p.marketValueCents))) {
        added++;
        created++;
      }
    }

    // Whatever the free agents could not fill, invent — capped per tick so a
    // league that has just been emptied refills over a few hours rather than
    // dumping twenty strangers into the market at once.
    const inventCount = Math.min(MAX_NEW_PER_TICK, toAdd - added);
    if (inventCount <= 0) continue;

    const lg = leagueRowById.get(leagueId);
    const progress = lg ? seasonProgress(lg) : 0;

    // Never offer a name the league already has: two Emre Yılmaz in one
    // division reads as a bug, and the squad screen has no way to tell them
    // apart.
    const takenNames = new Set(
      (
        await db
          .select({ name: players.name })
          .from(players)
          .where(eq(players.leagueId, leagueId))
      ).map((r) => r.name),
    );

    // Bias toward whatever the shelf is short of, so the market always has a
    // keeper and always has a striker.
    const listedPositions = await positionCounts(leagueId);
    const positionQueue = POSITIONS.slice().sort(
      (a, b) => (listedPositions[a] ?? 0) - (listedPositions[b] ?? 0),
    );

    for (let i = 0; i < inventCount; i++) {
      const position = positionQueue[i % positionQueue.length];
      let named: { name: string; nat: string } | null = null;
      for (let attempt = 0; attempt < 12; attempt++) {
        const candidate = inventName();
        if (!takenNames.has(candidate.name)) {
          named = candidate;
          break;
        }
      }
      if (!named) continue;
      takenNames.add(named.name);

      const gen = generatePlayer({
        name: named.name,
        nationality: named.nat,
        position,
        age: marketAge(),
        tier: marketTier(progress),
      });
      const [row] = await db
        .insert(players)
        .values({
          leagueId,
          clubId: null,
          name: gen.name,
          position: gen.position,
          role: gen.role,
          secondaryRoles: JSON.stringify(gen.secondaryRoles),
          age: gen.age,
          nationality: gen.nationality,
          overall: gen.overall,
          potential: gen.potential,
          pace: gen.pace,
          shooting: gen.shooting,
          passing: gen.passing,
          defending: gen.defending,
          physical: gen.physical,
          goalkeeping: gen.goalkeeping,
          marketValueCents: gen.marketValueCents,
          wageCents: gen.wageCents,
        })
        .returning();
      if (!row) continue;
      if (await listPlayer(row.id, gen.marketValueCents)) created++;
    }
  }

  return { purchased, created };
}
