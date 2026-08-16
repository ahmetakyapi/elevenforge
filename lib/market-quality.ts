/**
 * How good the players available to buy are, and when.
 *
 * The transfer market used to be stocked from one place: whatever free agents
 * happened to be lying in the league. Those are, by definition, the players
 * nobody wanted — so the market was a bargain bin that got emptier every week,
 * and by mid-season the "Transfer" screen was a list of eleven 62-rated
 * squad players and nothing else. There was no reason to save money, because
 * there was never anything worth saving for.
 *
 * Two changes fix that, and both live here so the scout and the market agree
 * about what a good player is:
 *
 *   1. The market INVENTS stock. Not free agents — new players, generated at
 *      a quality band, the way a real league's market is fed from outside it.
 *   2. The band RISES through the season. Early on you are shopping among
 *      squad fillers; by the closing weeks genuine stars appear. That gives
 *      the season a shape — bank money early, spend it when the good ones
 *      arrive — and it gives a manager a reason to open the screen in week 20
 *      when he has already seen it in week 3.
 */

/** 0 at the first whistle of the season, 1 at the last. */
export function seasonProgress(league: {
  weekNumber: number;
  seasonLength: number;
}): number {
  const len = Math.max(1, league.seasonLength);
  return Math.max(0, Math.min(1, (league.weekNumber - 1) / len));
}

/**
 * How far through the TRADING calendar a league is, 0-1.
 *
 * Not the same thing as how far through the season. The market only opens in
 * two windows — preseason and mid-season (see lib/transfer-window.ts) — so raw
 * `seasonProgress` never gets above about 0.55 while anything can be bought.
 * Scaling the quality curve against the full season therefore meant the top
 * half of the band was unreachable: the "late-season stars" could only have
 * appeared in weeks when the market was shut.
 *
 * Normalising against the last week the window is open makes the mid-season
 * window the top of the range, which is what the curve was always meant to
 * express: you shop for squad filler in preseason and for a marquee signing
 * in January.
 */
const LAST_OPEN_PROGRESS = 0.58;

export function tradingProgress(progress: number): number {
  return Math.max(0, Math.min(1, progress / LAST_OPEN_PROGRESS));
}

/**
 * The quality band new market stock is generated at, 0-1.
 *
 * `progress` moves the FLOOR, so the market never gets worse as the season
 * runs; the spread above it is what keeps every refresh worth looking at.
 * A little randomness per player, so two listings created in the same tick
 * are not the same listing twice.
 */
export function marketTier(progress: number, r: () => number = Math.random): number {
  const floor = 0.18 + tradingProgress(progress) * 0.42; // 0.18 → 0.60
  const spread = 0.34;
  // Roughly one invented player in eight is a genuine headline signing.
  //
  // It was one in twelve, which sounds similar and is not: only about eleven
  // players are invented per window (half the shelf, the rest being free
  // agents), so one-in-twelve meant the average window contained LESS THAN ONE
  // star and whether a marquee player existed that January was a coin flip.
  // At one in eight the mid-season window reliably has something worth
  // emptying the bank for, which is the entire reason to save money.
  if (r() < 0.13) return Math.min(1, floor + spread + r() * 0.35);
  return Math.max(0.05, Math.min(1, floor + r() * spread));
}

/**
 * Age distribution of market arrivals.
 *
 * Weighted toward the ages a club actually shops in, with a real tail of
 * teenagers — a market with no prospects in it makes the whole youth/
 * potential system decorative.
 */
export function marketAge(r: () => number = Math.random): number {
  const roll = r();
  if (roll < 0.18) return 17 + Math.floor(r() * 3); // 17-19, a project
  if (roll < 0.55) return 20 + Math.floor(r() * 4); // 20-23, the sweet spot
  if (roll < 0.85) return 24 + Math.floor(r() * 4); // 24-27, ready now
  return 28 + Math.floor(r() * 5); // 28-32, cheap experience
}

/**
 * How many listings the market tries to keep live.
 *
 * Twelve was too few to browse and too few to have variety across four
 * positions — half the time there was no goalkeeper at any price. Twenty-two
 * is enough that every position group has several options at several prices,
 * which is what makes the screen a market rather than a queue.
 */
export const MARKET_TARGET_LISTINGS = 22;

/** How much of the market may be freshly invented stock per tick. */
export const MAX_NEW_PER_TICK = 6;

/**
 * The largest share of an empty shelf that may be filled from the free-agent
 * pool before the rest has to be invented.
 *
 * Free agents were filling the ENTIRE gap, and every listing that expires puts
 * its player back in that pool — so after the first few ticks the market was
 * permanently recycling the same faces and the quality curve above never fired
 * again. Measured on a seeded league: week 2 and week 16 produced byte-identical
 * shelves.
 *
 * Half. Existing free agents are real players who should be buyable, and fresh
 * blood arrives on every tick regardless of how full the pool is.
 */
export const MAX_FREE_AGENT_SHARE = 0.5;
