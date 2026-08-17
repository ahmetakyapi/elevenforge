import { and, desc, eq, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { parseStaffJson } from "@/lib/staff";
import {
  clubs,
  players,
  scouts,
  transferBids,
  transferHistory,
  transferListings,
  transferWishlist,
} from "@/lib/schema";
import type { LeagueContext } from "@/lib/session";
import {
  transferWindow,
  type TransferWindowState,
} from "@/lib/transfer-window";

export type TransferListingView = {
  id: string;
  playerId: string;
  name: string;
  position: "GK" | "DEF" | "MID" | "FWD";
  role: string;
  age: number;
  nationality: string;
  overall: number;
  potential: number;
  priceEur: number;
  /** Player's intrinsic market value (not the current listing price). */
  marketValueEur: number;
  hoursOn: number;
  decay: string;
  sellerType: "bot" | "user";
  sellerName: string | null;
  sellerClubId: string | null;
  sellerClubName: string | null;
  trending: boolean;
  /** True if the user's club has bookmarked this player (wishlist). */
  watching: boolean;
  /** Set when this listing is an auction; null means fixed price, buy now. */
  bidsCloseAtMs: number | null;
  bidCount: number;
  topBidEur: number | null;
  /** The caller's own live bid, so the row can say "you are leading". */
  myBidEur: number | null;
  /**
   * The attributes, so the market row can show what you are buying.
   *
   * The squad screen, the player card and the scout report all print six
   * attributes; the market — the one screen where you commit money to a
   * player you have never seen — printed none. A rating and an age are not
   * enough to tell a quick winger from a slow one.
   */
  pace: number;
  shooting: number;
  passing: number;
  defending: number;
  physical: number;
  goalkeeping: number;
};

export type GlobalTransferView = {
  buyer: string;
  buyerClubId: string;
  player: string;
  priceEur: number;
};

export type MyListingView = {
  id: string;
  playerId: string;
  name: string;
  position: "GK" | "DEF" | "MID" | "FWD";
  age: number;
  overall: number;
  priceEur: number;
};

export type ActiveScoutView = {
  id: string;
  country: string;
  position: string;
  ageRange: string;
  returnsInSec: number;
  totalDurationSec: number;
};

export type ReturnedScoutCandidate = {
  name: string;
  nat: string;
  position: "GK" | "DEF" | "MID" | "FWD";
  role: string;
  age: number;
  overall: number;
  potential: number;
  marketValueEur: number;
  /** Attributes, so the report can be read like a player card. */
  pace: number;
  shooting: number;
  passing: number;
  defending: number;
  physical: number;
  goalkeeping: number;
  /**
   * True for a real footballer carried with his actual age and position from
   * lib/scout-pool.ts. The report marks these, because a recognisable name is
   * only worth printing if what sits beside it can be trusted.
   */
  real: boolean;
};

export type ReturnedScoutView = {
  id: string;
  country: string;
  position: string;
  candidates: ReturnedScoutCandidate[];
};

export type MarketStatsView = {
  movement: string;
  avgPrice: number;
  topPrice: number;
  soldToday: number;
};

export type CrestInfo = { color: string; color2: string; short: string };
export type CrestLookup = Record<string, CrestInfo>;

export type SellRowView = {
  playerId: string;
  name: string;
  position: "GK" | "DEF" | "MID" | "FWD";
  role: string;
  age: number;
  overall: number;
  potential: number;
  lastFormRating: number | null;
  marketValueEur: number;
  isListed: boolean;
};

export type TransferPageData = {
  listings: TransferListingView[];
  globalTicker: GlobalTransferView[];
  myListings: MyListingView[];
  /** The most recent scout in the field — kept for the compact sidebar card. */
  activeScout: ActiveScoutView | null;
  /**
   * Every scout in the field. Three may be out at once and the sidebar showed
   * only the newest, so the other two were invisible until they returned —
   * there was no way to tell whether you had one running or three.
   */
  activeScouts: ActiveScoutView[];
  /**
   * The chief scout's tier, 0-3. Read by the scout screen because it decides
   * two things the manager needs to know BEFORE committing €500K: how long
   * the trip takes, and how far up the game the department can see (a club
   * with nobody in the role is not told about Mbappé — see scoutReach in
   * lib/jobs/scout.ts).
   */
  scoutTier: number;
  returnedScouts: ReturnedScoutView[];
  marketStats: MarketStatsView;
  userSquad: SellRowView[];
  crestLookup: CrestLookup;
  userClub: { id: string; name: string } & CrestInfo;
  balanceEur: number;
  window: TransferWindowState;
};

export async function loadTransferData(
  ctx: LeagueContext,
): Promise<TransferPageData> {
  const { league, club } = ctx;

  // 1. Active listings
  const listingRows = await db
    .select({
      listing: transferListings,
      player: players,
    })
    .from(transferListings)
    .innerJoin(players, eq(players.id, transferListings.playerId))
    .where(
      and(
        eq(transferListings.leagueId, league.id),
        eq(transferListings.status, "active"),
      ),
    );

  // Attach seller club name (if any)
  const sellerClubIds = Array.from(
    new Set(listingRows.map((r) => r.listing.sellerClubId).filter((x): x is string => !!x)),
  );
  const sellerClubs =
    sellerClubIds.length > 0
      ? await Promise.all(
          sellerClubIds.map((id) =>
            db.select().from(clubs).where(eq(clubs.id, id)).limit(1),
          ),
        )
      : [];
  const sellerClubMap = new Map(sellerClubs.flat().map((c) => [c.id, c]));

  // Pull this club's wishlist set so listings render with watching state.
  const wishlistRows = await db
    .select({ playerId: transferWishlist.playerId })
    .from(transferWishlist)
    .where(eq(transferWishlist.clubId, club.id));
  const watchingSet = new Set(wishlistRows.map((w) => w.playerId));

  // Live bids per listing, in one query rather than per row. `top` drives the
  // "current leader" figure and `mine` lets a row tell the manager whether the
  // bid he is looking at is his own.
  const bidRows = await db
    .select({
      listingId: transferBids.listingId,
      amount: transferBids.amountCents,
      bidder: transferBids.bidderClubId,
    })
    .from(transferBids)
    .where(
      and(
        eq(transferBids.leagueId, league.id),
        eq(transferBids.status, "active"),
      ),
    );
  const bidStats = new Map<
    string,
    { count: number; top: number; mine: number | null }
  >();
  for (const b of bidRows) {
    const eur = Math.round(Number(b.amount) / 100);
    const cur = bidStats.get(b.listingId) ?? { count: 0, top: 0, mine: null };
    cur.count++;
    if (eur > cur.top) cur.top = eur;
    if (b.bidder === club.id) cur.mine = eur;
    bidStats.set(b.listingId, cur);
  }

  const now = Date.now();
  const listings: TransferListingView[] = listingRows
    // don't show user's own listings in buy feed
    .filter((r) => r.listing.sellerClubId !== club.id)
    .map((r) => {
      const hoursOn = Math.max(
        0,
        Math.floor(
          (now - new Date(r.listing.listedAt).getTime()) / 3600 / 1000,
        ),
      );
      const priceEur = Math.round(Number(r.listing.priceCents) / 100);
      const trending = hoursOn < 4;
      const sellerClub = r.listing.sellerClubId
        ? sellerClubMap.get(r.listing.sellerClubId) ?? null
        : null;
      return {
        id: r.listing.id,
        playerId: r.player.id,
        name: r.player.name,
        position: r.player.position,
        role: r.player.role,
        age: r.player.age,
        nationality: r.player.nationality,
        overall: r.player.overall,
        potential: r.player.potential,
        priceEur,
        marketValueEur: Math.round(Number(r.player.marketValueCents) / 100),
        hoursOn,
        decay: trending ? `↑${hoursOn}sa` : `↓${hoursOn}sa`,
        sellerType: r.listing.isBotMarket ? "bot" : "user",
        sellerName: sellerClub?.name ?? null,
        sellerClubId: r.listing.sellerClubId,
        sellerClubName: sellerClub?.name ?? null,
        trending,
        watching: watchingSet.has(r.player.id),
        bidsCloseAtMs: r.listing.bidsCloseAt
          ? new Date(r.listing.bidsCloseAt).getTime()
          : null,
        bidCount: bidStats.get(r.listing.id)?.count ?? 0,
        topBidEur: bidStats.get(r.listing.id)?.top ?? null,
        myBidEur: bidStats.get(r.listing.id)?.mine ?? null,
        pace: r.player.pace,
        shooting: r.player.shooting,
        passing: r.player.passing,
        defending: r.player.defending,
        physical: r.player.physical,
        goalkeeping: r.player.goalkeeping,
      };
    });

  // 2. Global transfer ticker (last 24h)
  const history = await db
    .select()
    .from(transferHistory)
    .where(eq(transferHistory.leagueId, league.id))
    .orderBy(desc(transferHistory.completedAt))
    .limit(12);
  const histPlayerIds = history.map((h) => h.playerId);
  const histPlayers = histPlayerIds.length
    ? await Promise.all(
        histPlayerIds.map((id) =>
          db.select().from(players).where(eq(players.id, id)).limit(1),
        ),
      )
    : [];
  const histClubIds = history.map((h) => h.toClubId);
  const histClubs = histClubIds.length
    ? await Promise.all(
        histClubIds.map((id) =>
          db.select().from(clubs).where(eq(clubs.id, id)).limit(1),
        ),
      )
    : [];
  const globalTicker: GlobalTransferView[] = history.map((h, i) => {
    const p = histPlayers[i]?.[0];
    const c = histClubs[i]?.[0];
    return {
      buyer: c?.name ?? "Bot",
      buyerClubId: c?.id ?? "",
      player: p?.name ?? "?",
      priceEur: Math.round(Number(h.priceCents) / 100),
    };
  });

  // 3. My listings (club's listed players)
  const myListingRows = await db
    .select({ listing: transferListings, player: players })
    .from(transferListings)
    .innerJoin(players, eq(players.id, transferListings.playerId))
    .where(
      and(
        eq(transferListings.leagueId, league.id),
        eq(transferListings.sellerClubId, club.id),
        eq(transferListings.status, "active"),
      ),
    );
  const myListings: MyListingView[] = myListingRows.map((r) => ({
    id: r.listing.id,
    playerId: r.player.id,
    name: r.player.name,
    position: r.player.position,
    age: r.player.age,
    overall: r.player.overall,
    priceEur: Math.round(Number(r.listing.priceCents) / 100),
  }));

  // 4. Active scout (most recent) + any returned scouts waiting for claim
  const activeScoutRows = await db
    .select()
    .from(scouts)
    .where(and(eq(scouts.clubId, club.id), eq(scouts.status, "active")))
    .orderBy(desc(scouts.sentAt));
  const activeScoutRow = activeScoutRows[0];
  const returnedScoutRows = await db
    .select()
    .from(scouts)
    .where(and(eq(scouts.clubId, club.id), eq(scouts.status, "returned")))
    .orderBy(desc(scouts.returnsAt));
  const returnedScouts: ReturnedScoutView[] = returnedScoutRows
    .map((s) => {
      let candidates: ReturnedScoutCandidate[] = [];
      try {
        const parsed = JSON.parse(s.resultsJson ?? "[]") as Array<{
          name: string;
          nat: string;
          position: "GK" | "DEF" | "MID" | "FWD";
          role: string;
          age: number;
          overall: number;
          potential: number;
          marketValueCents: number;
          pace?: number;
          shooting?: number;
          passing?: number;
          defending?: number;
          physical?: number;
          goalkeeping?: number;
          real?: boolean;
        }>;
        candidates = parsed.map((c) => ({
          name: c.name,
          nat: c.nat,
          position: c.position,
          role: c.role,
          age: c.age,
          overall: c.overall,
          potential: c.potential,
          marketValueEur: Math.round(Number(c.marketValueCents) / 100),
          // Reports written before candidates carried attributes fall back to
          // the rating, so the card renders rather than showing six zeroes.
          pace: c.pace ?? c.overall,
          shooting: c.shooting ?? c.overall,
          passing: c.passing ?? c.overall,
          defending: c.defending ?? c.overall,
          physical: c.physical ?? c.overall,
          goalkeeping: c.goalkeeping ?? (c.position === "GK" ? c.overall : 30),
          real: c.real === true,
        }));
      } catch {}
      return {
        id: s.id,
        country: s.targetNationality,
        position: s.targetPosition,
        candidates,
      };
    })
    .filter((s) => s.candidates.length > 0);
  const toActiveView = (row: typeof activeScoutRows[number]): ActiveScoutView => ({
    id: row.id,
    country: row.targetNationality,
    position: row.targetPosition,
    ageRange: `${row.ageMin}-${row.ageMax}y`,
    returnsInSec: Math.max(
      0,
      Math.floor((new Date(row.returnsAt).getTime() - now) / 1000),
    ),
    // Measured from the row rather than assumed: the trip is 3h at base and
    // shorter with a chief scout on the payroll, so a hard-coded 8h made the
    // progress ring lie about how far along every scout was.
    totalDurationSec: Math.max(
      60,
      Math.round(
        (new Date(row.returnsAt).getTime() - new Date(row.sentAt).getTime()) /
          1000,
      ),
    ),
  });
  const activeScouts = activeScoutRows.map(toActiveView);
  const activeScout: ActiveScoutView | null = activeScoutRow
    ? toActiveView(activeScoutRow)
    : null;

  // 5. Market stats
  const allListings = listings;
  const avgPrice = allListings.length
    ? Math.round(
        allListings.reduce((s, l) => s + l.priceEur, 0) / allListings.length,
      )
    : 0;
  const topPrice = allListings.reduce((m, l) => Math.max(m, l.priceEur), 0);
  // "Sold today" means today — this used to count every transfer in the
  // league's entire history and load the whole table to do it.
  const dayAgo = new Date(Date.now() - 24 * 3600 * 1000);
  const soldTodayRows = await db
    .select({ id: transferHistory.id })
    .from(transferHistory)
    .where(
      and(
        eq(transferHistory.leagueId, league.id),
        gte(transferHistory.completedAt, dayAgo),
      ),
    );
  const marketStats: MarketStatsView = {
    movement: "↑ +12%",
    avgPrice,
    topPrice,
    soldToday: soldTodayRows.length,
  };

  // 6. User squad for Sell tab
  const userSquadRows = await db
    .select()
    .from(players)
    .where(eq(players.clubId, club.id));
  const userSquad: SellRowView[] = userSquadRows.map((p) => {
    let ratings: number[] = [];
    try {
      ratings = JSON.parse(p.lastRatings);
    } catch {}
    const lastRating = ratings.length > 0 ? ratings[ratings.length - 1] : null;
    return {
      playerId: p.id,
      name: p.name,
      position: p.position,
      role: p.role,
      age: p.age,
      overall: p.overall,
      potential: p.potential,
      lastFormRating: lastRating,
      marketValueEur: Math.round(Number(p.marketValueCents) / 100),
      isListed: p.status === "listed",
    };
  });

  // 7. Crest lookup for all league clubs
  const allClubs = await db
    .select()
    .from(clubs)
    .where(eq(clubs.leagueId, league.id));
  const crestLookup: CrestLookup = {};
  for (const c of allClubs) {
    crestLookup[c.id] = {
      color: c.color,
      color2: c.color2,
      short: c.shortName,
    };
  }

  return {
    window: transferWindow(league),
    listings,
    globalTicker,
    myListings,
    activeScout,
    activeScouts,
    scoutTier: parseStaffJson(club.staffJson).scout?.tier ?? 0,
    returnedScouts,
    marketStats,
    userSquad,
    crestLookup,
    userClub: {
      id: club.id,
      name: club.name,
      color: club.color,
      color2: club.color2,
      short: club.shortName,
    },
    balanceEur: Math.round(Number(club.balanceCents) / 100),
  };
}
