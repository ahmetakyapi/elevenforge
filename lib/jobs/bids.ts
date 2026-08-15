/**
 * Close auctions and award the players.
 *
 * A listing used to be a fixed price with a buy-now button: whoever clicked
 * first got the player and nobody else knew there had been a contest. An
 * auction turns a signing into a decision — several clubs want him and you
 * find out whether you wanted him more.
 *
 * MONEY MOVES ONCE, AT AWARD. Placing a bid costs nothing and reserves
 * nothing, so a losing bidder is never debited and never needs refunding —
 * there is no window in which the game holds money it might have to give back.
 * The price of that simplicity is that the top bidder may no longer be able to
 * pay by the time the auction closes, which is why the award cascades down the
 * bid list instead of failing.
 *
 * The settlement chain below is copied from `buyListing` in
 * app/(app)/transfer/actions.ts, deliberately and in full. There are four
 * copies of this chain in the codebase and they are not equivalent: the copy
 * in `buyFromMarket` used to refund the buyer on a failed move and leave the
 * listing 'sold' with the player still 'listed', stranding him until the
 * price-decay self-heal swept him up. Copying the one that cleans up after
 * itself is the whole point.
 */
import { and, asc, desc, eq, inArray, isNull, lte, ne, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  clubs,
  feedEvents,
  players,
  transferBids,
  transferHistory,
  transferListings,
} from "@/lib/schema";
import { creditClub, debitClub } from "@/lib/money";

export type BidResolutionResult = {
  auctionsClosed: number;
  awarded: number;
  unsold: number;
  bidsSettled: number;
};

/** Lowest free shirt number in a squad, so a signing never collides. */
async function nextFreeJersey(clubId: string): Promise<number | null> {
  const squad = await db
    .select({ num: players.jerseyNumber })
    .from(players)
    .where(eq(players.clubId, clubId));
  const taken = new Set(
    squad.map((p) => p.num).filter((n): n is number => typeof n === "number"),
  );
  for (let n = 1; n <= 99; n++) if (!taken.has(n)) return n;
  return null;
}

/**
 * Mark every still-active bid on a listing as `status`, except one.
 *
 * Used both to settle the losers after an award and to close an auction that
 * is being cancelled from elsewhere (a withdrawn listing, a distress sale, a
 * season roll).
 */
export async function closeBidsForListing(
  listingId: string,
  status: "lost" | "expired" | "withdrawn",
  exceptBidId?: string,
): Promise<number> {
  const rows = await db
    .update(transferBids)
    .set({ status })
    .where(
      and(
        eq(transferBids.listingId, listingId),
        eq(transferBids.status, "active"),
        ...(exceptBidId ? [ne(transferBids.id, exceptBidId)] : []),
      ),
    )
    .returning();
  return rows.length;
}

export async function resolveTransferBids(
  opts: { leagueId?: string; now?: Date } = {},
): Promise<BidResolutionResult> {
  const now = opts.now ?? new Date();
  const result: BidResolutionResult = {
    auctionsClosed: 0,
    awarded: 0,
    unsold: 0,
    bidsSettled: 0,
  };

  const due = await db
    .select()
    .from(transferListings)
    .where(
      and(
        eq(transferListings.status, "active"),
        sql`${transferListings.bidsCloseAt} is not null`,
        lte(transferListings.bidsCloseAt, now),
        ...(opts.leagueId
          ? [eq(transferListings.leagueId, opts.leagueId)]
          : []),
      ),
    );

  for (const listing of due) {
    // Claim the listing before looking at bids. Two concurrent sweeps — an
    // hourly GitHub Actions run overlapping a Vercel cron — must not both
    // award the same player, and the same 'active' → 'sold' guard that
    // buyListing races on is what settles it.
    const claimed = await db
      .update(transferListings)
      .set({ status: "sold" })
      .where(
        and(
          eq(transferListings.id, listing.id),
          eq(transferListings.status, "active"),
        ),
      )
      .returning();
    if (claimed.length === 0) continue;
    result.auctionsClosed++;

    const bids = await db
      .select()
      .from(transferBids)
      .where(
        and(
          eq(transferBids.listingId, listing.id),
          eq(transferBids.status, "active"),
        ),
      )
      // Highest first; oldest wins a tie, so bidding early is worth something.
      .orderBy(desc(transferBids.amountCents), asc(transferBids.createdAt));

    const [player] = await db
      .select()
      .from(players)
      .where(eq(players.id, listing.playerId));

    if (bids.length === 0 || !player) {
      // Nobody wanted him, or he is already gone. Release and move on.
      await db
        .update(transferListings)
        .set({ status: "expired" })
        .where(eq(transferListings.id, listing.id));
      await db
        .update(players)
        .set({ status: "active" })
        .where(
          and(eq(players.id, listing.playerId), eq(players.status, "listed")),
        );
      result.unsold++;
      continue;
    }

    let winnerBidId: string | null = null;
    // Per-listing, NOT the running total: `result.unsold` accumulates across
    // every auction in the sweep and would make this check answer the wrong
    // question after the first unsold listing.
    let settledThisListing = false;

    for (const bid of bids) {
      // The guarded debit IS the affordability check. A club that bid €40M
      // and then spent it elsewhere simply loses the auction to the next bid
      // — nothing is reserved when a bid is placed, so this is the first
      // moment the money is actually tested.
      const paid = await debitClub(bid.bidderClubId, Number(bid.amountCents), undefined, {
        kind: "transfer_in",
        note: player.name,
      });
      if (!paid) {
        await db
          .update(transferBids)
          .set({ status: "failed" })
          .where(eq(transferBids.id, bid.id));
        continue;
      }

      const jersey = await nextFreeJersey(bid.bidderClubId);
      const moved = await db
        .update(players)
        .set({
          clubId: bid.bidderClubId,
          status: "active",
          jerseyNumber: jersey ?? player.jerseyNumber,
        })
        .where(
          and(
            eq(players.id, player.id),
            listing.sellerClubId
              ? eq(players.clubId, listing.sellerClubId)
              : isNull(players.clubId),
          ),
        )
        .returning();

      if (moved.length === 0) {
        // The seller no longer owns him. Refund this bidder and abandon the
        // whole auction — cascading to the next bid would sell a player the
        // seller does not have.
        await creditClub(bid.bidderClubId, Number(bid.amountCents), undefined, {
          kind: "transfer_refund",
          note: player.name,
        });
        await db
          .update(transferListings)
          .set({ status: "expired" })
          .where(eq(transferListings.id, listing.id));
        await db
          .update(players)
          .set({ status: "active" })
          .where(and(eq(players.id, player.id), eq(players.status, "listed")));
        result.unsold++;
        settledThisListing = true;
        break;
      }

      winnerBidId = bid.id;
      await db
        .update(transferBids)
        .set({ status: "won" })
        .where(eq(transferBids.id, bid.id));

      if (listing.sellerClubId) {
        await creditClub(
          listing.sellerClubId,
          Number(bid.amountCents),
          undefined,
          { kind: "transfer_out", note: player.name },
        );
      }
      await db.insert(transferHistory).values({
        leagueId: listing.leagueId,
        playerId: player.id,
        fromClubId: listing.sellerClubId,
        toClubId: bid.bidderClubId,
        priceCents: Number(bid.amountCents),
      });

      const [buyer] = await db
        .select({ name: clubs.name })
        .from(clubs)
        .where(eq(clubs.id, bid.bidderClubId));
      await db.insert(feedEvents).values({
        leagueId: listing.leagueId,
        clubId: bid.bidderClubId,
        eventType: "transfer",
        text:
          `${player.name}, ${bids.length} kulübün yarıştığı açık artırmayı ` +
          `€${(Number(bid.amountCents) / 100 / 1_000_000).toFixed(1)}M ile ` +
          `${buyer?.name ?? "yeni kulübü"} kazandı.`,
      });

      result.awarded++;
      break;
    }

    // Everyone still active on this listing lost, including the bidders whose
    // debit was refused above — `failed` is already terminal for those, and
    // this only touches rows still marked active.
    result.bidsSettled += await closeBidsForListing(
      listing.id,
      "lost",
      winnerBidId ?? undefined,
    );

    if (!winnerBidId && !settledThisListing) {
      // Every bid failed its debit: nobody could pay. Put him back.
      await db
        .update(transferListings)
        .set({ status: "expired" })
        .where(eq(transferListings.id, listing.id));
      await db
        .update(players)
        .set({ status: "active" })
        .where(and(eq(players.id, player.id), eq(players.status, "listed")));
      result.unsold++;
    }
  }

  return result;
}

/** Cancel every open auction on these listings — used when a listing dies. */
export async function cancelBidsForListings(
  listingIds: string[],
): Promise<number> {
  if (listingIds.length === 0) return 0;
  const rows = await db
    .update(transferBids)
    .set({ status: "expired" })
    .where(
      and(
        inArray(transferBids.listingId, listingIds),
        eq(transferBids.status, "active"),
      ),
    )
    .returning();
  return rows.length;
}
