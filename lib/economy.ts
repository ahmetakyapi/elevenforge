/**
 * Economic constants for the whole game, in one place.
 *
 * The numbers were previously scattered across the match engine, the weekly
 * economy job and the season roll, and they did not add up. Measured on a
 * seeded league:
 *
 *   average squad value      €1,365M
 *   average weekly wage bill     €6.8M
 *   gate receipts             €0.15–0.8M per match
 *   starting balance            €45M
 *
 * That is roughly −€6M every week. Every club in the league was bankrupt
 * well before the end of season one, and since a single useful player cost
 * more than a club's entire balance, the transfer market was decorative:
 * nobody could buy anybody, ever.
 *
 * The rebalance below targets a mid-table club running a small weekly
 * surplus, able to afford roughly one significant signing per season, with
 * a bloated wage bill still able to sink you.
 *
 * All amounts are in CENTS (€1 = 100).
 */

/** Starting balance for a new club: enough for 2-4 real signings. */
export const STARTING_BALANCE_CENTS = 25_000_000_000; // €250M

/**
 * Gate receipts per match, in cents.
 *
 * IMPORTANT: a round is played every calendar day (fixtures are scheduled
 * `matchKickoff(now, r, ...)` for round r), while the wage bill is charged by
 * a WEEKLY cron. So a club banks about seven match fees per wage charge.
 *
 * The first version of this table was sized as if one match were played per
 * week, which handed every club roughly seven times its intended income —
 * after four simulated seasons the leaders were sitting on over a billion.
 * These figures are sized per match against a per-match share of the wage
 * bill (€6.8M/week ÷ 7 ≈ €0.97M/match):
 *
 *   average gate ≈ €3.7M/match → ≈ €26M/week against €6.8M of wages
 *   → roughly €80M of operating surplus over a 30-match season, i.e. about
 *     one significant signing a year for a well-run club.
 */
export function matchIncomeCents(
  result: "W" | "D" | "L",
  isHome: boolean,
): number {
  if (result === "W") return isHome ? 600_000_000 : 350_000_000; // €6.0M / €3.5M
  if (result === "D") return isHome ? 460_000_000 : 270_000_000; // €4.6M / €2.7M
  return isHome ? 350_000_000 : 190_000_000; //                    €3.5M / €1.9M
}

/**
 * Recompute a player's market value from his current attributes.
 *
 * Nothing ever updated this after the row was inserted, so every price in the
 * game — listing bands, offer floors, free-agent fees, the AI's valuations —
 * was based on what the player was on the day he was generated. A youngster
 * who trained from 60 to 85 stayed cheap forever, and a 34-year-old whose
 * rating had decayed still cost his prime fee.
 *
 * Mirrors the generation curve in create-league.ts so values stay on one
 * scale across generated, scouted and academy players.
 */
export function marketValueCents(
  overall: number,
  potential: number,
  age: number,
): number {
  const ageFactor = age <= 24 ? 1.2 : age >= 31 ? 0.7 : 1.0;
  const valueEur = Math.max(
    300_000,
    Math.round(
      Math.pow(Math.max(0, overall - 55), 2.6) *
        22_000 *
        (1 + Math.max(0, potential - overall) * 0.08) *
        ageFactor,
    ),
  );
  return valueEur * 100;
}

/**
 * The most the AI will pay relative to a player's market value.
 *
 * Without a ceiling the market was a money printer: sign a free agent for a
 * fraction of his value, list him at the top of the allowed band, and let a
 * price-blind AI buy him at the asking price.
 */
export const MAX_AI_PRICE_MULTIPLIER = 1.3;

/** Signing-on fee for a free agent, as a share of market value. */
export const FREE_AGENT_FEE_RATE = 0.4;

/** Listing price band, relative to market value. */
export const MIN_LISTING_MULTIPLIER = 0.5;
export const MAX_LISTING_MULTIPLIER = 1.8;

/**
 * Weekly interest on a positive balance.
 *
 * At the old 0.5% this compounded to +16% per season, which rewarded sitting
 * on cash more reliably than running a football club. It is now small and
 * capped, so it offsets a little inflation without becoming a strategy.
 */
export const WEEKLY_INTEREST_RATE = 0.0015;
export const WEEKLY_INTEREST_CAP_CENTS = 200_000_000; // €2M

export function weeklyInterestCents(balanceCents: number): number {
  if (balanceCents <= 0) return 0;
  return Math.min(
    WEEKLY_INTEREST_CAP_CENTS,
    Math.round(balanceCents * WEEKLY_INTEREST_RATE),
  );
}

/** League prize money, 1st through 4th, scaled to the new balance range. */
export const SEASON_PRIZES_CENTS = [
  3_500_000_000, // €35M
  2_200_000_000, // €22M
  1_200_000_000, // €12M
  600_000_000, //   €6M
];

/**
 * Cost to extend a contract: a signing bonus of ~12 weeks' wages per year.
 *
 * The old formula charged `weeklyWage × 52 × years × 1.2` — a full year of
 * wages up front for every year added, on top of the wages the club still
 * pays weekly. Renewing a €500K/week player for two years cost €62M, which
 * is why AI clubs bankrupted themselves the moment contracts came due.
 */
export const RENEWAL_WEEKS_PER_YEAR = 12;

export function renewalCostCents(weeklyWageCents: number, years: number): number {
  return Math.round(weeklyWageCents * RENEWAL_WEEKS_PER_YEAR * years);
}

/** Wage inflation applied when a contract is renewed. */
export const RENEWAL_WAGE_MULTIPLIER = 1.08;

/**
 * A club this far in the red cannot make voluntary purchases. Wages are
 * still charged — going bust is a game state, not an error — but the board
 * stops signing cheques.
 */
export const OVERDRAFT_FLOOR_CENTS = -5_000_000_000; // −€50M

/**
 * What a club receives when it is forced to sell to balance the books: 70%
 * of market value. Steep enough that running out of money genuinely hurts,
 * but survivable — a club must always have a route back.
 */
export const DISTRESS_SALE_RATE = 0.7;
