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
 * Sized against the measured €6.8M average weekly wage bill: a typical week
 * now returns about €7.3M, so a well-run club edges ahead and an overpaid
 * squad still bleeds.
 */
export function matchIncomeCents(
  result: "W" | "D" | "L",
  isHome: boolean,
): number {
  if (result === "W") return isHome ? 1_200_000_000 : 700_000_000; // €12M / €7M
  if (result === "D") return isHome ? 900_000_000 : 500_000_000; //  €9M / €5M
  return isHome ? 700_000_000 : 400_000_000; //                     €7M / €4M
}

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
  12_000_000_000, // €120M
  8_000_000_000, //  €80M
  4_500_000_000, //  €45M
  2_500_000_000, //  €25M
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
