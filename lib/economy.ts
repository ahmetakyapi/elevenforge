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

/**
 * ─── NO WAGES, NO CONTRACTS ──────────────────────────────────────────────
 *
 * Both are gone. A contract that expires needs renewing, a renewal needs a
 * cost, a cost needs a wage to be a multiple of, and a wage needs a weekly
 * charge — four systems whose only job was to take money away again so the
 * income figures had something to be balanced against. None of it was a
 * decision: nobody ever chose NOT to renew a player they wanted, so the
 * whole apparatus reduced to a bill that arrived on a timer and a button you
 * pressed when it did.
 *
 * With it removed, money means exactly one thing: what you can buy. That is
 * the only question the transfer market ever asked, and it is now the only
 * question the economy answers.
 *
 * ─── WHY THE BALANCE RESETS EACH SEASON ──────────────────────────────────
 *
 * Money used to flow both ways: gate receipts in, wages out, roughly level.
 * Take the wages away and it only flows in, so by season five every club is
 * sitting on billions and the transfer market stops meaning anything — the
 * exact failure the economy was rebalanced to fix in the first place.
 *
 * So a season is a self-contained financial run. Every club starts it with a
 * budget sized by its prestige, earns through the year, and spends. At the
 * roll the books are closed and the next season opens with a fresh budget.
 * What CARRIES is everything you built with the money — the squad, the
 * players you developed, the trophies, the prestige. What does not carry is
 * the cash pile, because a cash pile is not an achievement.
 */

/**
 * What a club starts a season with, before prestige.
 *
 * Sized against the transfer market rather than against a wage bill: a squad
 * player is €3-15M, a first-team upgrade €25-60M, a marquee signing €90M+.
 * A base budget of €90M plus a season's income is one star or a rebuilt
 * spine — enough to change your team, not enough to buy everyone's.
 */
export const STARTING_BALANCE_CENTS = 9_000_000_000; // €90M

/**
 * The budget a club opens a season with.
 *
 * Prestige-scaled for the same reason match income is: a big club's squad
 * costs eight times a small one's, so a flat budget is a rounding error to
 * one and a fortune to the other. The spread is deliberately narrower than
 * the revenue spread — the league should be winnable from mid-table.
 */
export function seasonBudgetCents(prestige: number): number {
  const p = Math.max(0, Math.min(100, prestige));
  return Math.round(STARTING_BALANCE_CENTS * (0.6 + (p / 100) * 0.9));
}

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

/*
 * Bank interest used to live here. It is gone with the wage bill: interest on
 * a positive balance pays the club that is doing the least with its money,
 * and with nothing draining the account it became the largest income line in
 * the game. Cash now earns nothing, which is the correct incentive when the
 * balance is wiped at the season roll anyway.
 */

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
 * A club this far in the red cannot make voluntary purchases. Wages are
 * still charged — going bust is a game state, not an error — but the board
 * stops signing cheques.
 */
export const OVERDRAFT_FLOOR_CENTS = -1_500_000_000; // −€15M

/**
 * What a club receives when it is forced to sell to balance the books: 70%
 * of market value. Steep enough that running out of money genuinely hurts,
 * but survivable — a club must always have a route back.
 */
export const DISTRESS_SALE_RATE = 0.7;
