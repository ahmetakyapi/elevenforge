/**
 * How players get better.
 *
 * One curve, read by the daily training job, by friendlies, and by the
 * preview on the training panel. That last one is the reason this file
 * exists: the panel used to say nothing about what training would do, so
 * choosing a trainee was a guess, and a guess you make every day for a
 * season is not a decision — it is a chore with a random outcome.
 *
 * ─── The shape of the curve ─────────────────────────────────────────────
 *
 * The old rule was `age <= 19 ? 3 : age <= 22 ? 2 : age <= 26 ? 1 : 0.5`
 * multiplied into a flat 17.5% chance, gated behind `overall < potential`.
 * Two problems with that:
 *
 *   1. `potential` was a WALL. A player one point off his ceiling improved
 *      exactly as fast as one twenty points off it, and then stopped dead.
 *      Nothing in the game let a manager push past it, so a squad's ceiling
 *      was fixed on the day it was generated and the best thing training
 *      could do was reach a number you were already shown.
 *   2. Nothing else mattered. Not the training ground you paid to upgrade,
 *      not the head coach you pay a wage to, not the player's morale.
 *
 * So: growth slows down as the rating goes up, rather than stopping. An
 * 88-rated player still improves — perhaps two points a season, and only
 * with a good coach and a full training ground behind him — while a 62-rated
 * teenager can add ten. Potential is now a soft brake instead of a wall: past
 * it, progress costs four times as much. That keeps `potential` meaningful as
 * a scouting signal without making it a verdict.
 */
import type { DBPlayer } from "@/lib/schema";

/** Per-tick base probability of a +1, before any modifier. */
const BASE_CHANCE = 0.22;

/**
 * Youth is the single strongest factor — a 17-year-old improves five times
 * faster than a 31-year-old at the same rating. That is the spread that
 * makes buying young a strategy rather than a preference.
 */
export function ageFactor(age: number): number {
  if (age <= 18) return 1.4;
  if (age <= 21) return 1.25;
  if (age <= 24) return 1.0;
  if (age <= 27) return 0.68;
  if (age <= 30) return 0.4;
  if (age <= 33) return 0.19;
  return 0.07;
}

/**
 * Diminishing returns on the rating itself.
 *
 * 55 → full rate, 99 → about a tenth of it. This is what replaces the hard
 * ceiling: the curve never reaches zero, so no player is ever finished, but
 * the last five points of a career cost more than the first twenty.
 */
export function ratingFactor(overall: number): number {
  return Math.max(0.1, 1 - Math.max(0, overall - 55) / 50);
}

/**
 * Past his potential, a player is working against his own ceiling.
 * Possible, deliberately expensive.
 */
export function headroomFactor(overall: number, potential: number): number {
  if (overall < potential) return 1;
  return 0.25;
}

/** The training ground the club paid to upgrade. Levels 1-5. */
export function facilityFactor(trainingLevel: number): number {
  return 0.85 + Math.max(1, Math.min(5, trainingLevel)) * 0.09;
}

/** Head coach tier 0-3. */
export function coachFactor(tier: number): number {
  return 1 + Math.max(0, Math.min(3, tier)) * 0.16;
}

export type ProgressionContext = {
  /** clubs.trainingLevel, 1-5. */
  trainingLevel: number;
  /** Head coach staff tier, 0 (none) - 3. */
  coachTier: number;
};

const NEUTRAL_CONTEXT: ProgressionContext = { trainingLevel: 1, coachTier: 0 };

/**
 * Probability that one daily training tick raises this player by a point.
 *
 * Clamped away from both 0 and 1: a certainty is as bad as an impossibility,
 * because it removes the reason to check back tomorrow.
 */
export function growthChance(
  p: Pick<DBPlayer, "age" | "overall" | "potential" | "morale" | "fitness">,
  ctx: ProgressionContext = NEUTRAL_CONTEXT,
): number {
  const morale = 0.85 + (p.morale - 3) * 0.06;
  // A player who is running on empty does not improve; he recovers.
  const fitness = p.fitness >= 80 ? 1 : p.fitness >= 60 ? 0.8 : 0.55;
  const chance =
    BASE_CHANCE *
    ageFactor(p.age) *
    ratingFactor(p.overall) *
    headroomFactor(p.overall, p.potential) *
    facilityFactor(ctx.trainingLevel) *
    coachFactor(ctx.coachTier) *
    morale *
    fitness;
  return Math.max(0.005, Math.min(0.85, chance));
}

/**
 * What the manager is shown before he commits a training slot.
 *
 * Expressed as points per week rather than a per-tick probability, because
 * "+1.4 / hafta" is a decision and "0.2 per tick" is a maths problem. Seven
 * ticks a week — the training job runs once a day.
 */
export function weeklyGain(
  p: Pick<DBPlayer, "age" | "overall" | "potential" | "morale" | "fitness">,
  ctx: ProgressionContext = NEUTRAL_CONTEXT,
): number {
  return growthChance(p, ctx) * 7;
}

/** Coarse label for the preview, so the number has a meaning attached. */
export function growthLabel(perWeek: number): {
  label: string;
  tone: "gold" | "emerald" | "cyan" | "muted";
} {
  if (perWeek >= 1.4) return { label: "Patlama Yapar", tone: "gold" };
  if (perWeek >= 0.9) return { label: "Hızlı Gelişir", tone: "emerald" };
  if (perWeek >= 0.45) return { label: "İstikrarlı", tone: "cyan" };
  return { label: "Yavaş", tone: "muted" };
}

/**
 * The friendly-match boost.
 *
 * A friendly is a shortcut: it buys roughly two days of training for a fee,
 * on top of the fitness and morale it restores. Deliberately worth less per
 * tick than the training ground so it stays a top-up rather than the whole
 * strategy — and the daily cap is what stops it being ground into an
 * unbounded rating.
 */
export function friendlyGrowthChance(
  p: Pick<DBPlayer, "age" | "overall" | "potential" | "morale" | "fitness">,
  ctx: ProgressionContext = NEUTRAL_CONTEXT,
): number {
  return Math.min(0.85, growthChance(p, ctx) * 1.9);
}
