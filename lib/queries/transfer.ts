import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  clubs,
  players,
  scouts,
  transferHistory,
  transferListings,
} from "@/lib/schema";
import type { LeagueContext } from "@/lib/session";

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
  /** Player's intrinsic market value (not listing price) — used for loan fee. */
  marketValueEur: number;
  hoursOn: number;
  decay: string;
  sellerType: "bot" | "user";
  sellerName: string | null;
  sellerClubId: string | null;
  sellerClubName: string | null;
  trending: boolean;
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
  activeScout: ActiveScoutView | null;
  returnedScouts: ReturnedScoutView[];
  marketStats: MarketStatsView;
  userSquad: SellRowView[];
  crestLookup: CrestLookup;
  userClub: { id: string; name: string } & CrestInfo;
  balanceEur: number;
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
  const activeScoutRow = (
    await db
      .select()
      .from(scouts)
      .where(
        and(eq(scouts.clubId, club.id), eq(scouts.status, "active")),
      )
      .orderBy(desc(scouts.sentAt))
      .limit(1)
  )[0];
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
  const activeScout: ActiveScoutView | null = activeScoutRow
    ? {
        id: activeScoutRow.id,
        country: activeScoutRow.targetNationality,
        position: activeScoutRow.targetPosition,
        ageRange: `${activeScoutRow.ageMin}-${activeScoutRow.ageMax}y`,
        returnsInSec: Math.max(
          0,
          Math.floor(
            (new Date(activeScoutRow.returnsAt).getTime() - now) / 1000,
          ),
        ),
        totalDurationSec: 8 * 3600,
      }
    : null;

  // 5. Market stats
  const allListings = listings;
  const avgPrice = allListings.length
    ? Math.round(
        allListings.reduce((s, l) => s + l.priceEur, 0) / allListings.length,
      )
    : 0;
  const topPrice = allListings.reduce((m, l) => Math.max(m, l.priceEur), 0);
  const soldTodayRows = await db
    .select({ id: transferHistory.id })
    .from(transferHistory)
    .where(eq(transferHistory.leagueId, league.id));
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
    listings,
    globalTicker,
    myListings,
    activeScout,
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
