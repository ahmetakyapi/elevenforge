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
 * Match-day revenue, in cents.
 *
 * ONE CLOCK. A round is played every calendar day, so in this game a match day
 * *is* a football week — that is the unit the wage bill, the sponsor contract
 * and the bank interest are all denominated in. The economy tick therefore
 * runs once per match day (see runWeeklyEconomy), and these figures are per
 * match, i.e. per game week, against the full weekly wage bill rather than a
 * seventh of it.
 *
 * Getting this wrong is what inflated the economy twice over. The table was
 * first sized as if a match were played weekly while rounds ran daily, paying
 * seven times the intended income. That was corrected by shrinking the gate —
 * but the wage bill was still charged on a real-calendar week, so clubs banked
 * seven match fees per wage charge and ran €23M/week surpluses. Aligning the
 * clocks removes the factor of seven at its source.
 *
 * BASE RATES are the revenue of an average top-flight club. `prestige` scales
 * them: a big club sells more tickets, shirts and broadcast rights, and needs
 * to, because its wage bill is roughly eight times a bottom club's. Flat
 * revenue against an eight-fold wage spread meant small clubs printed money
 * they had nothing to spend on while the giants stagnated.
 */
function prestigeRevenueFactor(prestige: number): number {
  return 0.35 + (Math.max(0, Math.min(100, prestige)) / 100) * 1.3;
}

export function matchIncomeCents(
  result: "W" | "D" | "L",
  isHome: boolean,
  prestige = 50,
): number {
  const base =
    result === "W"
      ? isHome
        ? 270_000_000 // €2.70M
        : 158_000_000 // €1.58M
      : result === "D"
        ? isHome
          ? 207_000_000 // €2.07M
          : 122_000_000 // €1.22M
        : isHome
          ? 158_000_000 // €1.58M
          : 86_000_000; // €0.86M
  return Math.round(base * prestigeRevenueFactor(prestige));
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
 *
 * CALIBRATION. The first curve had two flaws that showed up the moment real
 * squads were priced with it:
 *
 *   - The age factor only recognised three brackets and put the cliff at 31,
 *     so a 30-year-old was still priced at his peak.
 *   - The potential bonus (up to +40%) never decayed with age, so a 32-year-old
 *     carrying potential 95 was valued ABOVE a 23-year-old of the same rating.
 *     A veteran is not worth more for a ceiling he has run out of time to
 *     reach. Sakarya Nehir's 32-year-old came out at €200M.
 *
 * It was also simply too flat: the exponent over `overall - 55` compressed the
 * gap between a squad player and a star, so a 70-rated filler was worth €19M
 * and everyone in the league looked expensive.
 *
 * The curve below is anchored on three points, in euros:
 *
 *     ovr 92, age 25          → €157M   (ceiling — nobody should exceed this)
 *     ovr 84, age 26, pot 86  →  €62M   (a league's marquee signing)
 *     ovr 70, age 25          →   €3.7M (a squad player is affordable)
 *
 * a 27× spread between filler and star, against 10× before. That spread is
 * what makes the transfer market a series of decisions rather than a shopping
 * list, and it is what "balance the strengths" actually needs: the table below
 * has to make a 1. Lig squad cheap and a Süper Lig starting XI expensive.
 */

/** Value multiplier by age. Peaks 21-26, falls off a cliff after 30. */
function ageFactor(age: number): number {
  if (age <= 18) return 1.0;
  if (age <= 20) return 1.15;
  if (age <= 23) return 1.25;
  if (age <= 26) return 1.2;
  if (age <= 28) return 1.0;
  if (age <= 30) return 0.72;
  if (age <= 32) return 0.42;
  if (age <= 34) return 0.26;
  return 0.15;
}

/**
 * How much each point of unrealised potential is worth, as a fraction of base.
 * Decays to nothing: room to grow is only worth paying for while there are
 * years left to grow into it.
 */
function potentialWeight(age: number): number {
  if (age <= 20) return 0.045;
  if (age <= 23) return 0.032;
  if (age <= 26) return 0.018;
  if (age <= 29) return 0.007;
  return 0;
}

export function marketValueCents(
  overall: number,
  potential: number,
  age: number,
): number {
  const headroom = Math.max(0, potential - overall);
  const valueEur = Math.max(
    300_000,
    Math.round(
      Math.pow(Math.max(0, overall - 58), 3.6) *
        400 *
        ageFactor(age) *
        (1 + headroom * potentialWeight(age)),
    ),
  );
  return valueEur * 100;
}

/**
 * Weekly wage implied by a valuation.
 *
 * One divisor, used by the squad-pack generator, the academy, the scouts and
 * the repricing script, so a player's wage always tracks what he is worth.
 * €100M of value costs €500K/week, which is about €26M a year — the right
 * order of magnitude, and it keeps a top club's bill near the €6.8M/week that
 * `matchIncomeCents` above is sized against.
 */
export const WAGE_DIVISOR = 200;
export const MIN_WEEKLY_WAGE_CENTS = 1_200_000; // €12K/week

export function wageFromValueCents(valueCents: number): number {
  return Math.max(
    MIN_WEEKLY_WAGE_CENTS,
    Math.round(valueCents / WAGE_DIVISOR / 100) * 100,
  );
}

/**
 * The two multipliers that keep the AI from being farmed.
 *
 * INVARIANT: MIN_AI_ASKING_MULTIPLIER > MAX_AI_PRICE_MULTIPLIER.
 *
 * A bot both buys (from listings) and sells (by answering offers). If the
 * most it will pay is ever above the least it will accept, a human can sell
 * a player to a bot and buy the same player straight back for less, banking
 * the difference — every day, forever, with no risk. Keeping the spread
 * strictly one-directional makes the round trip always a loss, which is what
 * a real transfer market does to you.
 *
 * Without any ceiling at all it was worse still: sign a free agent for a
 * fraction of his value, list him at the top of the allowed band, and let a
 * price-blind AI buy him at the asking price.
 */
export const MAX_AI_PRICE_MULTIPLIER = 1.15;
export const MIN_AI_ASKING_MULTIPLIER = 1.35;

/** Signing-on fee for a free agent, as a share of market value. */
export const FREE_AGENT_FEE_RATE = 0.4;

/** Listing price band, relative to market value. */
export const MIN_LISTING_MULTIPLIER = 0.5;
export const MAX_LISTING_MULTIPLIER = 1.8;

/**
 * Interest on a positive balance, per economy tick.
 *
 * At the old 0.5% this compounded to +16% per season, which rewarded sitting
 * on cash more reliably than running a football club. It is now small and
 * capped, so it offsets a little inflation without becoming a strategy.
 *
 * A TICK IS A MATCH DAY, roughly 34 per season rather than the ~5 real weeks
 * a season occupies. The rate is per tick, so it was divided by seven when the
 * economy moved onto the match-day clock — left alone it would have paid seven
 * times the intended interest, and the clubs it pays most are the ones already
 * holding the most cash. The cap matters more than the rate: it stops a club
 * that has hoarded a billion from out-earning one that is running a team.
 */
export const WEEKLY_INTEREST_RATE = 0.0002;
export const WEEKLY_INTEREST_CAP_CENTS = 30_000_000; // €300K

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

/** Cup prize money, scaled alongside the league prizes. */
export const CUP_WINNER_PRIZE_CENTS = 1_500_000_000; // €15M
export const CUP_RUNNER_UP_PRIZE_CENTS = 500_000_000; // €5M

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
