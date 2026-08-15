/**
 * The AI manager tick.
 *
 * Runs daily for every club that has no active human manager and does the
 * things a human would do between matches:
 *
 *   1. Picks a starting XI and a bench from the players who are fit.
 *   2. Adjusts formation and tactics to its personality and recent form.
 *   3. Renews contracts that are about to expire.
 *   4. Sells surplus/ageing players onto the transfer market at a real price,
 *      crediting the selling club.
 *   5. Buys: signs free agents, buys from the market, and sends direct offers
 *      to other clubs for players it wants.
 *   6. Responds to offers it has received.
 *   7. Keeps the squad above a minimum size so it can always field a team.
 *
 * Before this existed, bot clubs never changed anything after league
 * creation. Their squads shrank every season (retirements and expiring
 * contracts with nothing replacing them), they could not be traded with, and
 * a market listing for one of their players paid them nothing. That is what
 * made two thirds of a 16-club league feel like scenery.
 *
 * Everything here is deterministic per club per day (see dailyRng) and
 * idempotent via clubs.aiLastRunAt, so a retried cron does not double-spend.
 */
import { and, eq, gt, inArray, isNull, lt, ne, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { autoLineup, isAvailable } from "@/lib/lineup";
import {
  DISTRESS_SALE_RATE,
  MAX_AI_PRICE_MULTIPLIER,
  MIN_AI_ASKING_MULTIPLIER,
  RENEWAL_WAGE_MULTIPLIER,
  renewalCostCents,
} from "@/lib/economy";
import { creditClub, debitClub, purchaseFacilityLevel } from "@/lib/money";
import { cancelBidsForListings } from "@/lib/jobs/bids";
import {
  clubs,
  feedEvents,
  players,
  transferBids,
  transferHistory,
  transferListings,
  transferOffers,
  type Club,
  type DBPlayer,
} from "@/lib/schema";
import { SPONSORS } from "@/lib/sponsors";
import { STAFF } from "@/lib/staff";
import { syncInactiveManagers } from "./inactivity";
import { dailyRng, traitForClub, type AiTrait } from "./profile";

/** A squad this size can always field 11 plus cover for injuries. */
const HARD_MIN_SQUAD = 16;
const MAX_SQUAD = 26;
const OFFER_TTL_MS = 3 * 24 * 3600 * 1000;
/** Mirrors upgradeCostCents in app/(app)/dashboard/upgrade-actions.ts. */
const FACILITY_BASE_COST_CENTS = 500_000_000;

function dayStamp(now: Date): number {
  return Math.floor(now.getTime() / (24 * 3600 * 1000));
}

/** Rough worth of a player to a club, used for both buying and selling. */
function valueToClub(p: DBPlayer, trait: AiTrait): number {
  const youth = p.age <= 22 ? trait.youthBias * 12 : p.age >= 31 ? -10 : 0;
  const ceiling = (p.potential - p.overall) * 0.8;
  return p.overall + youth + ceiling;
}

/**
 * The minimum a club must keep in each position, whatever else it does.
 *
 * Without this the AI would happily sell its last goalkeeper: listSurplus
 * offloads the least valuable players (a backup keeper rates low) and
 * emergencySales offloads the most valuable (the first-choice keeper rates
 * high), so across a few seasons a club could end up with none at all and
 * field an outfielder in goal for the rest of its life.
 */
const POSITION_FLOOR: Record<DBPlayer["position"], number> = {
  GK: 2,
  DEF: 4,
  MID: 4,
  FWD: 2,
};

/** Can this player be sold without breaching the positional floor? */
function isExpendable(p: DBPlayer, squad: DBPlayer[]): boolean {
  const inPosition = squad.filter((s) => s.position === p.position).length;
  return inPosition > POSITION_FLOOR[p.position];
}

/** Which position is this squad thinnest in? */
function squadNeeds(squad: DBPlayer[]): Array<DBPlayer["position"]> {
  const target: Record<DBPlayer["position"], number> = {
    GK: 2,
    DEF: 6,
    MID: 7,
    FWD: 5,
  };
  const have: Record<DBPlayer["position"], number> = {
    GK: 0,
    DEF: 0,
    MID: 0,
    FWD: 0,
  };
  for (const p of squad) have[p.position]++;
  return (["GK", "DEF", "MID", "FWD"] as const)
    .filter((pos) => have[pos] < target[pos])
    .sort((a, b) => target[a] - have[a] - (target[b] - have[b]));
}

/** 1. Team sheet + 2. tactics. */
async function manageTeamSheet(
  club: Club,
  squad: DBPlayer[],
  trait: AiTrait,
  rng: () => number,
): Promise<void> {
  const formation =
    trait.preferredFormations[
      Math.floor(rng() * trait.preferredFormations.length)
    ] ?? "4-4-2";

  // Nudge the dials around the personality's baseline so a bot does not play
  // the identical shape every single week.
  const jitter = () => (rng() < 0.5 ? 0 : rng() < 0.5 ? -1 : 1);
  const clamp = (n: number) => Math.max(0, Math.min(4, n));

  const lineup = autoLineup(squad, formation);
  await db
    .update(clubs)
    .set({
      formation,
      mentality: clamp(trait.mentality + jitter()),
      pressing: clamp(trait.pressing + jitter()),
      tempo: clamp(trait.tempo + jitter()),
      lineupJson: JSON.stringify(lineup),
    })
    .where(eq(clubs.id, club.id));
}

/** 3. Renew contracts that would otherwise lapse and empty the squad. */
async function renewExpiringContracts(
  club: Club,
  squad: DBPlayer[],
  trait: AiTrait,
): Promise<number> {
  // Only players worth keeping, and only when the club can pay.
  const expiring = squad
    .filter((p) => p.contractYears <= 1)
    .sort((a, b) => valueToClub(b, trait) - valueToClub(a, trait));
  let renewed = 0;
  for (const p of expiring) {
    // Let genuinely spent veterans go, but never below a safe squad size.
    const worthKeeping = p.age < 34 || squad.length <= HARD_MIN_SQUAD + 2;
    if (!worthKeeping) continue;
    const cost = renewalCostCents(Number(p.wageCents), 2);
    const paid = await debitClub(club.id, cost, undefined, {
      kind: "contract_renewal",
      note: p.name,
    });
    if (!paid) break; // out of money — stop trying
    await db
      .update(players)
      .set({
        contractYears: Math.min(5, p.contractYears + 2),
        wageCents: Math.round(
          Number(p.wageCents) * RENEWAL_WAGE_MULTIPLIER * RENEWAL_WAGE_MULTIPLIER,
        ),
      })
      .where(eq(players.id, p.id));
    renewed++;
  }
  return renewed;
}

/** 4. List surplus players so the market has real, club-owned stock. */
async function listSurplus(
  club: Club,
  squad: DBPlayer[],
  trait: AiTrait,
  rng: () => number,
): Promise<number> {
  if (squad.length <= trait.minSquad) return 0;

  const alreadyListed = await db
    .select({ playerId: transferListings.playerId })
    .from(transferListings)
    .where(
      and(
        eq(transferListings.sellerClubId, club.id),
        eq(transferListings.status, "active"),
      ),
    );
  if (alreadyListed.length >= 3) return 0;
  const listedIds = new Set(alreadyListed.map((r) => r.playerId));

  // Sell from the bottom of the pecking order: the least useful players the
  // club can spare without dropping below its comfort level.
  const ranked = [...squad]
    .filter((p) => !listedIds.has(p.id) && p.status !== "listed")
    .sort((a, b) => valueToClub(a, trait) - valueToClub(b, trait));

  const room = Math.min(3 - alreadyListed.length, squad.length - trait.minSquad);
  let listed = 0;
  // Track the squad as it shrinks so the floor is checked against reality,
  // not against the roster as it was at the start of the tick.
  const remaining = [...squad];
  for (const p of ranked.slice(0, room)) {
    if (rng() > 0.5) continue;
    if (!isExpendable(p, remaining)) continue;
    // Price around market value, shaded by how keen they are to sell.
    const multiplier = 1.25 - trait.sellWillingness * 0.35;
    const priceCents = Math.max(
      1_000_000,
      Math.round(Number(p.marketValueCents) * multiplier),
    );
    try {
      await db.insert(transferListings).values({
        leagueId: club.leagueId,
        playerId: p.id,
        // Crucially NOT null: a bot listing used to have sellerClubId=null,
        // so when it sold the money went nowhere and the bot lost a player
        // for free.
        sellerClubId: club.id,
        isBotMarket: false,
        priceCents,
        originalPriceCents: priceCents,
        expiresAt: new Date(Date.now() + 48 * 3600 * 1000),
      });
    } catch {
      continue; // already listed (unique index) — fine
    }
    await db
      .update(players)
      .set({ status: "listed" })
      .where(and(eq(players.id, p.id), eq(players.status, "active")));
    const idx = remaining.findIndex((r) => r.id === p.id);
    if (idx >= 0) remaining.splice(idx, 1);
    listed++;
  }
  return listed;
}

/**
 * 4a-ii. Sell from strength.
 *
 * `listSurplus` above ranks the squad by `valueToClub` and lists from the
 * bottom, which is correct for clearing deadwood and catastrophic for the
 * market: the bottom of a squad is by definition old and weak, so every bot
 * listed the same kind of player and nobody ever listed a good one. Measured
 * on the live league — 103 listings, ratings 60-79, median 68, not a single
 * player at 80+, while the best player at an AI club was 87. A market where
 * nothing is ever worth buying is not a transfer market.
 *
 * Real clubs sell good players when they are covered in that position. This
 * looks for genuine depth — a position carrying two players clearly above the
 * floor — and offers the SECOND best of them. The first choice is never for
 * sale, so a club never weakens its own XI, and the asking price carries a
 * premium because it does not need the money.
 *
 * One per tick, so quality trickles into the market rather than flooding it.
 */
/**
 * How long an auction stays open.
 *
 * Long enough that a human who logs in once a day sees it at least once —
 * a shorter window would hand every contested player to whoever happened to
 * be online, which is the problem auctions exist to fix.
 */
const AUCTION_WINDOW_MS = 36 * 3600 * 1000;

async function listQualitySurplus(
  club: Club,
  squad: DBPlayer[],
  trait: AiTrait,
  rng: () => number,
): Promise<number> {
  if (squad.length <= trait.minSquad) return 0;
  // A reluctant seller mostly sits on its depth.
  if (rng() > 0.25 + trait.sellWillingness * 0.4) return 0;

  const listedRows = await db
    .select({ playerId: transferListings.playerId })
    .from(transferListings)
    .where(
      and(
        eq(transferListings.sellerClubId, club.id),
        eq(transferListings.status, "active"),
      ),
    );
  const listedIds = new Set(listedRows.map((r) => r.playerId));

  const candidates: DBPlayer[] = [];
  for (const position of ["GK", "DEF", "MID", "FWD"] as const) {
    const inPos = squad
      .filter(
        (p) =>
          p.position === position &&
          !listedIds.has(p.id) &&
          p.status === "active",
      )
      .sort((a, b) => b.overall - a.overall);

    // Depth means a spare body ABOVE the floor, not merely meeting it.
    if (inPos.length < POSITION_FLOOR[position] + 2) continue;

    // Never the first choice — selling him would weaken the XI, which is the
    // one thing a club managing itself should not do voluntarily.
    const second = inPos[1];
    if (!second) continue;
    // Only worth surfacing if he would actually interest somebody.
    if (second.overall < 74) continue;
    candidates.push(second);
  }
  if (candidates.length === 0) return 0;

  // Offer the best of the spare men — that is the one another club wants.
  const pick = candidates.sort((a, b) => b.overall - a.overall)[0];
  if (!isExpendable(pick, squad)) return 0;

  // A club selling from strength is not desperate: it asks above the odds.
  // The floor is MIN_AI_ASKING_MULTIPLIER so this can never undercut what the
  // same bot would demand in a direct negotiation, which would otherwise open
  // a buy-here-sell-there arbitrage.
  const premium = Math.max(
    MIN_AI_ASKING_MULTIPLIER,
    1.6 - trait.sellWillingness * 0.2,
  );
  const priceCents = Math.round(Number(pick.marketValueCents) * premium);

  try {
    await db.insert(transferListings).values({
      leagueId: club.leagueId,
      playerId: pick.id,
      sellerClubId: club.id,
      isBotMarket: false,
      priceCents,
      originalPriceCents: priceCents,
      // Longer than a deadwood listing: this is a standing invitation, not a
      // clearance sale, and it gives human managers time to save up.
      expiresAt: new Date(Date.now() + 96 * 3600 * 1000),
      // Good players go to auction. This is the half of the market worth
      // competing over, and an auction is what turns "click first" into a
      // decision. Deadwood in listSurplus stays buy-it-now, because nobody
      // wants a bidding war over a 33-year-old squad filler.
      bidsCloseAt: new Date(Date.now() + AUCTION_WINDOW_MS),
    });
  } catch {
    return 0; // unique index — already listed
  }
  await db
    .update(players)
    .set({ status: "listed" })
    .where(and(eq(players.id, pick.id), eq(players.status, "active")));
  return 1;
}

/**
 * 4b. Emergency sales for a club that has run out of money.
 *
 * Without this a club that fell far enough into the red was stuck there
 * forever: every guarded debit refuses, so it cannot buy, cannot renew, and
 * cannot recover — it just rots at the bottom of the table with a wage bill
 * it will never pay. A real club in that position sells someone.
 *
 * The buyer is "a club abroad" rather than a league rival, because a
 * distressed sale has to be able to complete immediately. The distress
 * discount makes it a genuinely bad outcome to avoid, not a money tap.
 */
async function emergencySales(
  club: Club,
  squad: DBPlayer[],
  trait: AiTrait,
): Promise<number> {
  const [fresh] = await db.select().from(clubs).where(eq(clubs.id, club.id));
  if (!fresh || fresh.balanceCents >= 0) return 0;

  // Sell the most valuable players the club can spare, best price first, until
  // the books balance or the squad hits the floor.
  const sellable = [...squad]
    .filter((p) => p.status !== "injured")
    .sort((a, b) => Number(b.marketValueCents) - Number(a.marketValueCents));

  let deficit = -fresh.balanceCents;
  let sold = 0;
  let size = squad.length;
  const remaining = [...squad];

  for (const p of sellable) {
    if (deficit <= 0) break;
    if (size <= HARD_MIN_SQUAD) break;
    // Even a fire sale keeps enough bodies in each position to field a team.
    if (!isExpendable(p, remaining)) continue;
    const fee = Math.round(Number(p.marketValueCents) * DISTRESS_SALE_RATE);
    if (fee <= 0) continue;

    const moved = await db
      .update(players)
      .set({ clubId: null, status: "active", contractYears: 0 })
      .where(and(eq(players.id, p.id), eq(players.clubId, club.id)))
      .returning();
    if (moved.length === 0) continue;

    const pulled = await db
      .update(transferListings)
      .set({ status: "withdrawn" })
      .where(
        and(
          eq(transferListings.playerId, p.id),
          eq(transferListings.status, "active"),
        ),
      )
      .returning();
    // A distress sale can pull a player who was mid-auction. Close the bids
    // with him, or those clubs wait on a listing that will never resolve —
    // resolveTransferBids only looks at listings still marked 'active'.
    await cancelBidsForListings(pulled.map((l) => l.id));
    await creditClub(club.id, fee, undefined, {
      kind: "transfer_out",
      note: `${p.name} (zorunlu satış)`,
    });
    await db.insert(feedEvents).values({
      leagueId: club.leagueId,
      clubId: club.id,
      eventType: "transfer",
      text: `${club.name} mali sıkıntı nedeniyle ${p.name}'i satmak zorunda kaldı (€${(fee / 100 / 1_000_000).toFixed(1)}M).`,
    });
    const idx = remaining.findIndex((r) => r.id === p.id);
    if (idx >= 0) remaining.splice(idx, 1);
    deficit -= fee;
    size--;
    sold++;
  }
  void trait;
  return sold;
}

/**
 * 4c. Run the club off the pitch: training, staff, facilities, sponsors.
 *
 * Humans have four compounding levers — put youngsters on the training slot,
 * hire a physio/coach/scout, upgrade the stadium and training ground, and
 * sign a sponsor. Bots used none of them, so their squads only ever decayed
 * while a human's improved. Over a couple of seasons that is not a
 * difficulty setting, it is a permanent handicap that makes two thirds of
 * the league irrelevant.
 */
async function developClub(
  club: Club,
  squad: DBPlayer[],
  trait: AiTrait,
  rng: () => number,
): Promise<{ trained: number; hired: number; upgraded: number; sponsored: number }> {
  const out = { trained: 0, hired: 0, upgraded: 0, sponsored: 0 };

  // ── Training slots: one per position group, best prospect first ──
  const currentTrainees = squad.filter((p) => p.status === "training");
  const groups: Array<DBPlayer["position"]> = ["GK", "DEF", "MID", "FWD"];
  for (const pos of groups) {
    if (currentTrainees.some((p) => p.position === pos)) continue;
    const candidate = squad
      .filter(
        (p) =>
          p.position === pos &&
          p.status === "active" &&
          p.overall < p.potential &&
          p.age <= 24,
      )
      .sort(
        (a, b) => b.potential - b.overall - (a.potential - a.overall),
      )[0];
    if (!candidate) continue;
    await db
      .update(players)
      .set({ status: "training" })
      .where(and(eq(players.id, candidate.id), eq(players.status, "active")));
    out.trained++;
  }

  const [fresh] = await db.select().from(clubs).where(eq(clubs.id, club.id));
  if (!fresh) return out;

  // ── Sponsor: free money, so take the best one prestige allows ──
  if (!fresh.activeSponsorJson) {
    const affordable = SPONSORS.filter((sp) => fresh.prestige >= sp.minPrestige).sort(
      (a, b) => b.payPerMatchCents - a.payPerMatchCents,
    );
    const pick = affordable[0];
    if (pick) {
      await db
        .update(clubs)
        .set({
          activeSponsorJson: JSON.stringify({
            id: pick.id,
            name: pick.name,
            payPerMatchCents: pick.payPerMatchCents,
            bonusPerWinCents: pick.bonusPerWinCents,
            seasonBonusCents: pick.seasonBonusCents,
            weeksLeft: pick.weeks,
          }),
        })
        .where(and(eq(clubs.id, club.id), isNull(clubs.activeSponsorJson)));
      out.sponsored++;
    }
  }

  // ── Staff: fill empty slots the club can comfortably afford ──
  let staff: Partial<Record<"headCoach" | "physio" | "scout", { id: string }>> = {};
  if (fresh.staffJson) {
    try {
      staff = JSON.parse(fresh.staffJson);
    } catch {
      staff = {};
    }
  }
  // Only spend a slice of the balance on non-playing staff.
  const staffBudget = Math.round(fresh.balanceCents * 0.08);
  for (const role of ["physio", "headCoach", "scout"] as const) {
    if (staff[role]) continue;
    if (rng() > 0.5) continue;
    const best = STAFF.filter(
      (m) => m.role === role && m.hireCostCents <= staffBudget,
    ).sort((a, b) => b.tier - a.tier)[0];
    if (!best) continue;
    const paid = await debitClub(club.id, best.hireCostCents, undefined, {
      kind: "staff",
      note: best.name,
    });
    if (!paid) break;
    staff = { ...staff, [role]: { id: best.id } };
    await db
      .update(clubs)
      .set({ staffJson: JSON.stringify(staff) })
      .where(eq(clubs.id, club.id));
    out.hired++;
  }

  // ── Facilities: a long-term investment, taken when cash is comfortable ──
  const [afterStaff] = await db.select().from(clubs).where(eq(clubs.id, club.id));
  if (afterStaff) {
    for (const field of ["trainingLevel", "stadiumLevel"] as const) {
      const level = afterStaff[field];
      if (level >= 5) continue;
      const cost = FACILITY_BASE_COST_CENTS * Math.pow(2, level - 1);
      // Keep a healthy reserve so an upgrade never starves the wage bill.
      if (afterStaff.balanceCents < cost * 3) continue;
      if (rng() > 0.3) continue;
      const done = await purchaseFacilityLevel(club.id, field, level, cost);
      if (done) out.upgraded++;
    }
  }

  return out;
}

/** 5a. Sign a free agent when the squad is short. */
async function signFreeAgents(
  club: Club,
  squad: DBPlayer[],
  trait: AiTrait,
): Promise<number> {
  if (squad.length >= MAX_SQUAD) return 0;
  const needs = squadNeeds(squad);
  if (needs.length === 0 && squad.length > trait.minSquad) return 0;

  const pool = await db
    .select()
    .from(players)
    .where(and(eq(players.leagueId, club.leagueId), isNull(players.clubId)));
  if (pool.length === 0) return 0;

  const wanted = pool
    .filter((p) => needs.length === 0 || needs.includes(p.position))
    .sort((a, b) => valueToClub(b, trait) - valueToClub(a, trait));

  let signed = 0;
  for (const p of wanted.slice(0, 2)) {
    const fee = Math.round(Number(p.marketValueCents) / 5);
    const paid = await debitClub(club.id, fee, undefined, {
      kind: "free_agent_fee",
      note: p.name,
    });
    if (!paid) break;
    const claimed = await db
      .update(players)
      .set({ clubId: club.id, status: "active", contractYears: 2 })
      .where(and(eq(players.id, p.id), isNull(players.clubId)))
      .returning();
    if (claimed.length === 0) {
      await creditClub(club.id, fee, undefined, {
        kind: "transfer_refund",
        note: p.name,
      }); // someone beat us to him
      continue;
    }
    await db.insert(feedEvents).values({
      leagueId: club.leagueId,
      clubId: club.id,
      eventType: "transfer",
      text: `${club.name} serbest oyuncu ${p.name} ile anlaştı.`,
    });
    signed++;
  }
  return signed;
}

/** 5b. Buy from the open market. */
/**
 * Bid on other clubs' auctions.
 *
 * Shares buyFromMarket's judgement about who is worth having — same budget
 * share, same "does he improve us" test, same MAX_AI_PRICE_MULTIPLIER ceiling
 * that stops a price-blind bot turning the listing band into a money printer.
 * The difference is that nothing is bought and nothing is charged here: a bid
 * is a row, and resolveTransferBids settles it when the auction closes.
 *
 * Bids beat the current top by a personality-flavoured margin rather than
 * jumping to the ceiling, so an auction between two bots actually escalates
 * and a human watching it can decide whether to go again.
 */
async function bidOnAuctions(
  club: Club,
  squad: DBPlayer[],
  trait: AiTrait,
  rng: () => number,
): Promise<number> {
  if (squad.length >= MAX_SQUAD) return 0;
  const [fresh] = await db.select().from(clubs).where(eq(clubs.id, club.id));
  if (!fresh || fresh.balanceCents <= 0) return 0;
  const budget = Math.round(fresh.balanceCents * trait.splurge);
  if (budget <= 0) return 0;

  const open = await db
    .select()
    .from(transferListings)
    .where(
      and(
        eq(transferListings.leagueId, club.leagueId),
        eq(transferListings.status, "active"),
        gt(transferListings.bidsCloseAt, new Date()),
        or(
          isNull(transferListings.sellerClubId),
          ne(transferListings.sellerClubId, club.id),
        ),
      ),
    );
  if (open.length === 0) return 0;

  const listedPlayers = await db
    .select()
    .from(players)
    .where(inArray(players.id, open.map((l) => l.playerId)));
  const byId = new Map(listedPlayers.map((p) => [p.id, p]));

  // Who is selling decides how high this club may go — see the ceiling below.
  const sellerIds = open
    .map((l) => l.sellerClubId)
    .filter((id): id is string => id !== null);
  const humanSellers = new Set(
    sellerIds.length === 0
      ? []
      : (
          await db
            .select({ id: clubs.id, ai: clubs.aiManaged })
            .from(clubs)
            .where(inArray(clubs.id, sellerIds))
        )
          .filter((c) => !c.ai)
          .map((c) => c.id),
  );

  const needs = squadNeeds(squad);
  const squadAvg =
    squad.length > 0
      ? squad.reduce((s, p) => s + p.overall, 0) / squad.length
      : 60;

  // Current top bid per listing, so a raise is a raise.
  const topByListing = new Map<string, number>();
  const existing = await db
    .select({
      listingId: transferBids.listingId,
      amount: transferBids.amountCents,
      bidder: transferBids.bidderClubId,
    })
    .from(transferBids)
    .where(
      and(
        inArray(transferBids.listingId, open.map((l) => l.id)),
        eq(transferBids.status, "active"),
      ),
    );
  const alreadyBid = new Set<string>();
  for (const e of existing) {
    const amount = Number(e.amount);
    topByListing.set(
      e.listingId,
      Math.max(topByListing.get(e.listingId) ?? 0, amount),
    );
    if (e.bidder === club.id) alreadyBid.add(e.listingId);
  }

  const candidates = open
    .map((l) => ({ listing: l, player: byId.get(l.playerId) }))
    .filter(
      (c): c is { listing: (typeof open)[number]; player: DBPlayer } =>
        !!c.player &&
        c.player.clubId !== club.id &&
        !alreadyBid.has(c.listing.id) &&
        (c.player.overall > squadAvg - 2 || needs.includes(c.player.position)),
    )
    .sort((a, b) => valueToClub(b.player, trait) - valueToClub(a.player, trait));

  let placed = 0;
  for (const c of candidates.slice(0, 2)) {
    if (rng() > 0.6) continue;
    /*
      How high this club will go, and why it depends on the seller.

      MAX_AI_PRICE_MULTIPLIER (1.15×) exists to stop a human farming the AI:
      a bot ACCEPTS an incoming offer at MIN_AI_ASKING_MULTIPLIER (1.35×), so
      if a bot would ever pay more than a bot asks, selling to one and buying
      back from another is free money, repeatable daily.

      That exploit needs a human on one side of the trade. Bot-to-bot money
      never leaves the AI economy, and holding bots to 1.15× on an auction
      whose reserve is 1.35× by construction meant they could never bid at
      all — thirty-three open auctions in production with zero bids on any of
      them, because every candidate was skipped on this line.

      So: the hard cap still applies whenever a HUMAN is selling, and bots may
      contest each other's auctions a little above the reserve.
    */
    const sellerIsHuman =
      c.listing.sellerClubId !== null &&
      humanSellers.has(c.listing.sellerClubId);
    const multiplier = sellerIsHuman
      ? MAX_AI_PRICE_MULTIPLIER
      : MIN_AI_ASKING_MULTIPLIER * 1.15;
    const ceiling = Math.min(
      budget,
      Math.round(Number(c.player.marketValueCents) * multiplier),
    );
    const top = topByListing.get(c.listing.id) ?? 0;
    // Open at the asking price; otherwise raise over the leader.
    const target =
      top === 0
        ? c.listing.priceCents
        : Math.round(top * (1.04 + trait.bidAggression * 0.03));
    if (target > ceiling) continue;

    try {
      await db.insert(transferBids).values({
        leagueId: club.leagueId,
        listingId: c.listing.id,
        bidderClubId: club.id,
        amountCents: target,
      });
    } catch {
      // The partial unique index refused a second live bid from this club.
      // Same handling as sendOffers: a duplicate is a no-op, not an error.
      continue;
    }
    placed++;
  }
  return placed;
}

async function buyFromMarket(
  club: Club,
  squad: DBPlayer[],
  trait: AiTrait,
  rng: () => number,
): Promise<number> {
  if (squad.length >= MAX_SQUAD) return 0;
  const [fresh] = await db.select().from(clubs).where(eq(clubs.id, club.id));
  if (!fresh || fresh.balanceCents <= 0) return 0;
  const budget = Math.round(fresh.balanceCents * trait.splurge);
  if (budget <= 0) return 0;

  const listings = await db
    .select()
    .from(transferListings)
    .where(
      and(
        eq(transferListings.leagueId, club.leagueId),
        eq(transferListings.status, "active"),
        // Never buy your own player back.
        //
        // `seller <> $id` evaluates to NULL — not true — for the null-seller
        // rows that lib/jobs/transfer-bots.ts creates as free-agent stock, so
        // this filter silently excluded the entire bot market and no AI club
        // had ever bought from it. The null case has to be spelled out.
        or(
          isNull(transferListings.sellerClubId),
          ne(transferListings.sellerClubId, club.id),
        ),
      ),
    );
  if (listings.length === 0) return 0;

  const needs = squadNeeds(squad);
  const playerIds = listings.map((l) => l.playerId);
  const listedPlayers = await db
    .select()
    .from(players)
    .where(inArray(players.id, playerIds));
  const byId = new Map(listedPlayers.map((p) => [p.id, p]));

  const squadAvg =
    squad.length > 0
      ? squad.reduce((s, p) => s + p.overall, 0) / squad.length
      : 60;

  const candidates = listings
    .map((l) => ({ listing: l, player: byId.get(l.playerId) }))
    .filter(
      (c): c is { listing: (typeof listings)[number]; player: DBPlayer } =>
        !!c.player &&
        c.player.clubId !== club.id &&
        // Auctions are not for sale at the asking price — bidOnAuctions
        // handles those. Buying one here would bypass every other bidder.
        c.listing.bidsCloseAt === null &&
        c.listing.priceCents <= budget &&
        // Never pay a silly price. A price-blind buyer turns the listing
        // band into a money printer: sign someone cheap, list at the top of
        // the band, let the AI buy at the asking price.
        c.listing.priceCents <=
          Number(c.player.marketValueCents) * MAX_AI_PRICE_MULTIPLIER &&
        // Only buy someone who actually improves the squad, or fills a hole.
        (c.player.overall > squadAvg - 2 || needs.includes(c.player.position)),
    )
    .sort(
      (a, b) =>
        valueToClub(b.player, trait) - valueToClub(a.player, trait),
    );

  let bought = 0;
  for (const c of candidates.slice(0, 2)) {
    if (rng() > 0.55) continue;
    const claimed = await db
      .update(transferListings)
      .set({ status: "sold" })
      .where(
        and(
          eq(transferListings.id, c.listing.id),
          eq(transferListings.status, "active"),
        ),
      )
      .returning();
    if (claimed.length === 0) continue;

    const paid = await debitClub(club.id, c.listing.priceCents, undefined, {
      kind: "transfer_in",
      note: c.player.name,
    });
    if (!paid) {
      await db
        .update(transferListings)
        .set({ status: "active" })
        .where(eq(transferListings.id, c.listing.id));
      continue;
    }
    const moved = await db
      .update(players)
      .set({ clubId: club.id, status: "active" })
      .where(
        and(
          eq(players.id, c.player.id),
          c.listing.sellerClubId
            ? eq(players.clubId, c.listing.sellerClubId)
            : isNull(players.clubId),
        ),
      )
      .returning();
    if (moved.length === 0) {
      // Somebody else took him between the claim and the move. Refund — and
      // then finish the job: this used to `continue` with the listing still
      // marked 'sold' and the player still 'listed', so he was invisible to
      // team selection until runPriceDecay's stranded-listing self-heal
      // happened to sweep him up. buyListing has always cleaned up after
      // itself here; this path did not.
      await creditClub(club.id, c.listing.priceCents, undefined, {
        kind: "transfer_refund",
        note: c.player.name,
      });
      await db
        .update(transferListings)
        .set({ status: "expired" })
        .where(eq(transferListings.id, c.listing.id));
      await db
        .update(players)
        .set({ status: "active" })
        .where(and(eq(players.id, c.player.id), eq(players.status, "listed")));
      continue;
    }
    if (c.listing.sellerClubId) {
      await creditClub(c.listing.sellerClubId, c.listing.priceCents, undefined, {
        kind: "transfer_out",
        note: c.player.name,
      });
    }
    await db.insert(transferHistory).values({
      leagueId: club.leagueId,
      playerId: c.player.id,
      fromClubId: c.listing.sellerClubId,
      toClubId: club.id,
      priceCents: c.listing.priceCents,
    });
    await db.insert(feedEvents).values({
      leagueId: club.leagueId,
      clubId: club.id,
      eventType: "transfer",
      text: `${club.name}, ${c.player.name} transferini bitirdi (€${(c.listing.priceCents / 100 / 1_000_000).toFixed(1)}M).`,
    });
    bought++;
  }
  return bought;
}

/** 5c. Approach another club directly for a player who is not for sale. */
async function sendOffers(
  club: Club,
  squad: DBPlayer[],
  trait: AiTrait,
  rng: () => number,
): Promise<number> {
  if (rng() > 0.35) return 0;
  if (squad.length >= MAX_SQUAD) return 0;
  const [fresh] = await db.select().from(clubs).where(eq(clubs.id, club.id));
  if (!fresh) return 0;
  const budget = Math.round(fresh.balanceCents * trait.splurge);
  if (budget < 1_000_000) return 0;

  const needs = squadNeeds(squad);

  // The best player this club currently has in each position. A manager does
  // not only shop when short — they shop when someone out there is better
  // than what they have. Restricting offers to shortages meant a fully
  // stocked bot never approached anyone, so humans were never competed with.
  const bestOwned: Record<DBPlayer["position"], number> = {
    GK: 0,
    DEF: 0,
    MID: 0,
    FWD: 0,
  };
  for (const p of squad) {
    bestOwned[p.position] = Math.max(bestOwned[p.position], p.overall);
  }

  // Look at other clubs' players in this league.
  const targets = await db
    .select()
    .from(players)
    .where(
      and(
        eq(players.leagueId, club.leagueId),
        ne(players.clubId, club.id),
        gt(players.overall, 0),
      ),
    );

  const shortlist = targets
    .filter((p) => {
      if (!p.clubId) return false;
      if (Number(p.marketValueCents) * trait.bidAggression > budget) return false;
      // Either fills a hole, or is a clear upgrade on what we already have.
      const fillsNeed = needs.includes(p.position);
      const isUpgrade = p.overall >= bestOwned[p.position] + 2;
      return fillsNeed || isUpgrade;
    })
    .sort((a, b) => valueToClub(b, trait) - valueToClub(a, trait));

  const target = shortlist[0];
  if (!target?.clubId) return 0;

  const amount = Math.round(
    Number(target.marketValueCents) * trait.bidAggression,
  );
  try {
    await db.insert(transferOffers).values({
      leagueId: club.leagueId,
      playerId: target.id,
      fromClubId: club.id,
      toClubId: target.clubId,
      amountCents: amount,
      expiresAt: new Date(Date.now() + OFFER_TTL_MS),
      message: `${club.name} ${target.name} için resmi teklif yaptı.`,
    });
  } catch {
    return 0; // already has a pending offer for him
  }
  return 1;
}

/**
 * 6. Answer offers this club has received. Humans get a real counterpart:
 *    a fair bid is accepted, a cheap one is countered, an insult is refused.
 */
async function respondToOffers(
  club: Club,
  squad: DBPlayer[],
  trait: AiTrait,
): Promise<number> {
  const incoming = await db
    .select()
    .from(transferOffers)
    .where(
      and(
        eq(transferOffers.toClubId, club.id),
        eq(transferOffers.status, "pending"),
      ),
    );
  if (incoming.length === 0) return 0;

  const byId = new Map(squad.map((p) => [p.id, p]));
  let handled = 0;

  for (const offer of incoming) {
    const p = byId.get(offer.playerId);
    const reject = async (reason: string) => {
      await db
        .update(transferOffers)
        .set({ status: "rejected", respondedAt: new Date(), message: reason })
        .where(
          and(eq(transferOffers.id, offer.id), eq(transferOffers.status, "pending")),
        );
    };

    if (!p) {
      await reject("Bu oyuncu artık kadromuzda değil.");
      handled++;
      continue;
    }
    // Never sell down to a squad that cannot field a team.
    if (squad.length <= HARD_MIN_SQUAD) {
      await reject("Kadromuz zaten dar, satış düşünmüyoruz.");
      handled++;
      continue;
    }

    const value = Number(p.marketValueCents);
    // The asking price rises for players the club rates highly and falls for
    // ones it is happy to move on — but never below what the club would pay
    // for the same player. See MIN_AI_ASKING_MULTIPLIER: if the two ever
    // crossed, selling to a bot and buying back became free money.
    const keenness = trait.sellWillingness;
    const askingPrice = Math.round(
      value * Math.max(MIN_AI_ASKING_MULTIPLIER, 1.6 - keenness * 0.25),
    );
    const amount = Number(offer.amountCents);

    if (amount >= askingPrice) {
      // Accept: move the player and settle up, guarded at every step.
      const paid = await debitClub(offer.fromClubId, amount, undefined, {
        kind: "transfer_in",
      });
      if (!paid) {
        await reject("Teklif eden kulübün bütçesi yetersiz.");
        handled++;
        continue;
      }
      const moved = await db
        .update(players)
        .set({ clubId: offer.fromClubId, status: "active" })
        .where(and(eq(players.id, p.id), eq(players.clubId, club.id)))
        .returning();
      if (moved.length === 0) {
        await creditClub(offer.fromClubId, amount, undefined, {
          kind: "transfer_refund",
        });
        await reject("Bu oyuncu artık kadromuzda değil.");
        handled++;
        continue;
      }
      await creditClub(club.id, amount, undefined, {
        kind: "transfer_out",
      });
      await db
        .update(transferOffers)
        .set({
          status: "accepted",
          respondedAt: new Date(),
          message: "Teklif kabul edildi.",
        })
        .where(eq(transferOffers.id, offer.id));
      // Any open listing for him is now void.
      await db
        .update(transferListings)
        .set({ status: "withdrawn" })
        .where(
          and(
            eq(transferListings.playerId, p.id),
            eq(transferListings.status, "active"),
          ),
        );
      await db.insert(transferHistory).values({
        leagueId: club.leagueId,
        playerId: p.id,
        fromClubId: club.id,
        toClubId: offer.fromClubId,
        priceCents: amount,
      });
      await db.insert(feedEvents).values({
        leagueId: club.leagueId,
        clubId: offer.fromClubId,
        eventType: "transfer",
        text: `${p.name}, ${club.name} kulübünden ayrıldı (€${(amount / 100 / 1_000_000).toFixed(1)}M).`,
      });
      handled++;
      continue;
    }

    if (amount >= askingPrice * 0.72) {
      // Close enough to talk: name a price.
      await db
        .update(transferOffers)
        .set({
          status: "countered",
          counterCents: askingPrice,
          respondedAt: new Date(),
          message: `${p.name} için €${(askingPrice / 100 / 1_000_000).toFixed(1)}M istiyoruz.`,
        })
        .where(
          and(eq(transferOffers.id, offer.id), eq(transferOffers.status, "pending")),
        );
      handled++;
      continue;
    }

    await reject(`${p.name} bu rakama satılık değil.`);
    handled++;
  }
  return handled;
}

/** 7. Emergency cover so a club can always field eleven. */
async function emergencyCover(club: Club, squad: DBPlayer[]): Promise<number> {
  const fit = squad.filter((p) => isAvailable(p));
  if (fit.length >= 12) return 0;

  const pool = await db
    .select()
    .from(players)
    .where(and(eq(players.leagueId, club.leagueId), isNull(players.clubId)))
    .limit(20);
  let signed = 0;
  for (const p of pool) {
    if (fit.length + signed >= 13) break;
    // Emergency signings are free — a club must never be unable to play.
    const claimed = await db
      .update(players)
      .set({ clubId: club.id, status: "active", contractYears: 1 })
      .where(and(eq(players.id, p.id), isNull(players.clubId)))
      .returning();
    if (claimed.length > 0) signed++;
  }
  return signed;
}

export type AiTickResult = {
  clubsManaged: number;
  renewed: number;
  listed: number;
  bidsPlaced: number;
  signed: number;
  bought: number;
  offersSent: number;
  offersHandled: number;
  emergency: number;
  emergencySales: number;
  trained: number;
  hired: number;
  upgraded: number;
  sponsored: number;
};

/**
 * Run the AI for every club without an active human manager.
 *
 * `force` skips the once-per-day guard (used by tests).
 */
export async function runAiManagers(
  opts: { leagueId?: string; force?: boolean } = {},
): Promise<AiTickResult> {
  const now = new Date();
  const today = dayStamp(now);

  // Hand dormant human clubs to the AI before deciding who to manage.
  // syncInactiveManagers existed but nothing in production ever called it —
  // there was no cron route and no other caller, so an abandoned club stayed
  // abandoned forever no matter how long its manager had been gone.
  await syncInactiveManagers(opts.leagueId ? { leagueId: opts.leagueId } : {});

  const managed = await db
    .select()
    .from(clubs)
    .where(
      opts.leagueId
        ? and(eq(clubs.leagueId, opts.leagueId), eq(clubs.aiManaged, true))
        : eq(clubs.aiManaged, true),
    );

  const result: AiTickResult = {
    clubsManaged: 0,
    renewed: 0,
    listed: 0,
    bidsPlaced: 0,
    signed: 0,
    bought: 0,
    offersSent: 0,
    offersHandled: 0,
    emergency: 0,
    emergencySales: 0,
    trained: 0,
    hired: 0,
    upgraded: 0,
    sponsored: 0,
  };

  for (const club of managed) {
    // Idempotency: one full tick per club per day, so a retried cron does
    // not let a bot buy twice.
    if (!opts.force && club.aiLastRunAt) {
      if (dayStamp(club.aiLastRunAt) >= today) continue;
    }
    const claimed = await db
      .update(clubs)
      .set({ aiLastRunAt: now })
      .where(
        and(
          eq(clubs.id, club.id),
          club.aiLastRunAt
            ? eq(clubs.aiLastRunAt, club.aiLastRunAt)
            : isNull(clubs.aiLastRunAt),
        ),
      )
      .returning();
    if (!opts.force && claimed.length === 0) continue;

    const trait = traitForClub(club.id);
    const rng = dailyRng(club.id, today);
    const squad = await db
      .select()
      .from(players)
      .where(eq(players.clubId, club.id));

    result.emergency += await emergencyCover(club, squad);
    result.offersHandled += await respondToOffers(club, squad, trait);
    result.emergencySales += await emergencySales(club, squad, trait);
    result.renewed += await renewExpiringContracts(club, squad, trait);
    result.listed += await listSurplus(club, squad, trait, rng);
    result.listed += await listQualitySurplus(club, squad, trait, rng);
    result.bidsPlaced += await bidOnAuctions(club, squad, trait, rng);
    result.signed += await signFreeAgents(club, squad, trait);
    result.bought += await buyFromMarket(club, squad, trait, rng);
    result.offersSent += await sendOffers(club, squad, trait, rng);

    const dev = await developClub(club, squad, trait, rng);
    result.trained += dev.trained;
    result.hired += dev.hired;
    result.upgraded += dev.upgraded;
    result.sponsored += dev.sponsored;

    // Re-read the squad after all the trading so the team sheet reflects it.
    const finalSquad = await db
      .select()
      .from(players)
      .where(eq(players.clubId, club.id));
    await manageTeamSheet(club, finalSquad, trait, rng);
    result.clubsManaged++;
  }

  // Expire stale offers league-wide.
  await db
    .update(transferOffers)
    .set({ status: "expired" })
    .where(
      and(
        eq(transferOffers.status, "pending"),
        lt(transferOffers.expiresAt, now),
      ),
    );

  return result;
}
