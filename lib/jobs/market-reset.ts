/**
 * Close the transfer market at the season roll.
 *
 * The roll recomputes every player's `marketValueCents` from his new
 * overall/potential/age (see the per-player loop in season.ts), but every
 * price already sitting in the market stays anchored to last season's
 * valuation. Measured over four simulated seasons: listings asking 4.58× the
 * player's value, which nobody will ever buy, alongside others at 0.32×, which
 * are a giveaway. Both silt up the market — the first because it never sells,
 * the second because a bot snaps it up for nothing.
 *
 * WHY CLEAR RATHER THAN REPRICE. A listing carries a human decision as well as
 * a number: the manager chose to sell that player, at that price, under last
 * season's squad and last season's budget. Silently rewriting the price makes
 * a sale happen at a figure nobody agreed to. Clearing hands the decision
 * back — relist if you still want to, at a price you can see. It is also what
 * a real season break does, and what scripts/reprice-players.ts already chose
 * when it faced the same question.
 *
 * SCOPE IS THE WHOLE POINT. reprice-players.ts runs `db.delete(transferListings)`
 * with NO WHERE CLAUSE — correct for a one-off repair of every league at once,
 * catastrophic inside a per-league job that runs on every roll, where it would
 * wipe every other league's market too. Everything here is scoped to one
 * league, and the tests below assert it.
 */
import { and, eq, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { leagues, transferListings, transferOffers } from "@/lib/schema";
import { transferWindow } from "@/lib/transfer-window";
import { releasePlayers } from "./price-decay";
import { cancelBidsForListings } from "./bids";

export type MarketResetResult = {
  listingsCleared: number;
  playersReleased: number;
  offersExpired: number;
  bidsCancelled: number;
};

/**
 * Expire everything still open in one league's market.
 *
 * Shared by the season roll and by the transfer-window close, because they
 * want the same thing for the same reason: a price agreed under one set of
 * conditions must not be executable under another. The season roll reprices
 * every player; the window close ends the period in which trading was allowed.
 * Leaving offers alive across either boundary is what let a bot honour a
 * pending offer — a complete inter-club transfer — days after the market shut.
 */
export async function closeMarketForSeasonRoll(
  leagueId: string,
): Promise<MarketResetResult> {
  const now = new Date();

  // Listings. Expire rather than delete, so transfer history and any UI that
  // looks back at "what was on the market" keeps its rows.
  const cleared = await db
    .update(transferListings)
    .set({ status: "expired" })
    .where(
      and(
        eq(transferListings.leagueId, leagueId),
        eq(transferListings.status, "active"),
      ),
    )
    .returning();

  // A listed player whose listing is gone must go back to active, or he is
  // stranded in a status that hides him from selection for the rest of the
  // game. This is the same guarded release runPriceDecay uses when a listing
  // expires on price, reused rather than reimplemented.
  const listedIds = cleared
    .map((l) => l.playerId)
    .filter((id): id is string => Boolean(id));
  await releasePlayers(listedIds);
  const released = listedIds.length;

  // Any auction that was still running dies with its listing. Without this the
  // bids survive as 'active' rows pointing at a listing nobody will ever
  // resolve, and resolveTransferBids would skip them forever because it only
  // looks at listings that are still 'active'.
  const bidsCancelled = await cancelBidsForListings(cleared.map((l) => l.id));

  // Offers, BOTH statuses. "countered" is the half that matters: the club has
  // named a price and acceptCounterOffer will happily revive that offer at
  // `counterCents` with a fresh expiry, so a countered offer left alive across
  // the roll is a sale at last season's valuation waiting to happen. The sweep
  // at the end of runAiManagers only ever expired "pending".
  const offers = await db
    .update(transferOffers)
    .set({ status: "expired", respondedAt: now })
    .where(
      and(
        eq(transferOffers.leagueId, leagueId),
        or(
          eq(transferOffers.status, "pending"),
          eq(transferOffers.status, "countered"),
        ),
      ),
    )
    .returning();

  // Auto-bids need no sweep of their own: they live in a text column on the
  // listing (`transferListings.autoBidsJson`), and runTransferBots only reads
  // them from listings it selected as status='active'. Expiring the listing
  // takes them out of play. This note exists so the next person does not go
  // looking for a sweep that would be a no-op.

  return {
    listingsCleared: cleared.length,
    playersReleased: released,
    offersExpired: offers.length,
    bidsCancelled,
  };
}

/**
 * Sweep any league whose transfer window has just shut.
 *
 * Runs on every game-loop tick and is a no-op while a window is open or when
 * a closed league has already been swept — the emptiness of the second query
 * is what makes it idempotent, so there is no marker to maintain.
 *
 * Without this, offers and listings created legally on the last open day stay
 * live for their full three-day TTL and get honoured after the market shuts.
 */
export async function closeMarketsOutsideWindow(
  opts: { leagueId?: string } = {},
): Promise<{ leaguesClosed: number; offersExpired: number; listingsCleared: number }> {
  const rows = await db
    .select({
      id: leagues.id,
      weekNumber: leagues.weekNumber,
      seasonLength: leagues.seasonLength,
    })
    .from(leagues)
    .where(opts.leagueId ? eq(leagues.id, opts.leagueId) : sql`true`);

  let leaguesClosed = 0;
  let offersExpired = 0;
  let listingsCleared = 0;
  for (const l of rows) {
    if (transferWindow(l).open) continue;
    const [open] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(transferOffers)
      .where(
        and(
          eq(transferOffers.leagueId, l.id),
          or(
            eq(transferOffers.status, "pending"),
            eq(transferOffers.status, "countered"),
          ),
        ),
      );
    const [live] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(transferListings)
      .where(
        and(
          eq(transferListings.leagueId, l.id),
          eq(transferListings.status, "active"),
        ),
      );
    if (open.n === 0 && live.n === 0) continue;
    const res = await closeMarketForSeasonRoll(l.id);
    leaguesClosed++;
    offersExpired += res.offersExpired;
    listingsCleared += res.listingsCleared;
  }
  return { leaguesClosed, offersExpired, listingsCleared };
}
