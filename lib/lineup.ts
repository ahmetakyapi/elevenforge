/**
 * Line-up resolution — the single place that decides who actually starts.
 *
 * Before this existed the engine re-picked the best eleven by `overall` on
 * every match, so the squad screen was decorative: whatever a manager
 * arranged was thrown away at kick-off. The rule now is:
 *
 *   1. Start from the manager's saved XI, in their order.
 *   2. Drop anyone unavailable on the day (injured, banned, sold).
 *   3. Fill the gaps by formation need from the best available bench/squad.
 *
 * Step 3 is what keeps a half-abandoned club playable, and it is also what
 * the AI manager uses to field a sensible team for a club with no human.
 */
import type { DBPlayer } from "@/lib/schema";
import { parseFormation } from "@/lib/engine/formation";

export type SavedLineup = { xi: string[]; bench: string[] };

export const EMPTY_LINEUP: SavedLineup = { xi: [], bench: [] };

/** Tolerant parse — a malformed column must never break match day. */
export function parseLineup(raw: string | null | undefined): SavedLineup {
  if (!raw) return EMPTY_LINEUP;
  try {
    const parsed = JSON.parse(raw) as Partial<SavedLineup>;
    const xi = Array.isArray(parsed?.xi)
      ? parsed.xi.filter((v): v is string => typeof v === "string")
      : [];
    const bench = Array.isArray(parsed?.bench)
      ? parsed.bench.filter((v): v is string => typeof v === "string")
      : [];
    // De-duplicate: the same player must not occupy two shirts.
    const seen = new Set<string>();
    const uniq = (ids: string[]) =>
      ids.filter((idValue) => {
        if (seen.has(idValue)) return false;
        seen.add(idValue);
        return true;
      });
    return { xi: uniq(xi).slice(0, 11), bench: uniq(bench).slice(0, 12) };
  } catch {
    return EMPTY_LINEUP;
  }
}

/**
 * Can this player take the field right now?
 *
 * `status` alone was not enough: a player could carry
 * `suspensionMatchesLeft > 0` or a future `injuryUntil` while still showing
 * as "active", and the old check let him start.
 */
export function isAvailable(p: DBPlayer, now: Date = new Date()): boolean {
  if (p.status === "injured") return false;
  if (p.status === "suspended") return false;
  if (p.suspensionMatchesLeft > 0) return false;
  if (p.injuryUntil && p.injuryUntil.getTime() > now.getTime()) return false;
  return true;
}

/** Rank a player for a given line, using the attributes that line needs. */
function fitnessForPosition(p: DBPlayer, pos: DBPlayer["position"]): number {
  const base =
    pos === "GK"
      ? p.goalkeeping * 0.8 + p.overall * 0.2
      : pos === "DEF"
        ? p.defending * 0.55 + p.physical * 0.2 + p.overall * 0.25
        : pos === "MID"
          ? p.passing * 0.5 + p.physical * 0.2 + p.overall * 0.3
          : p.shooting * 0.55 + p.pace * 0.2 + p.overall * 0.25;
  // Playing out of position costs a chunk of effectiveness.
  const penalty = p.position === pos ? 0 : 12;
  // A tired player is a worse pick than a fresh equivalent.
  const fatigue = p.fitness < 70 ? (70 - p.fitness) * 0.15 : 0;
  return base - penalty - fatigue;
}

export type ResolvedLineup = {
  starters: DBPlayer[];
  bench: DBPlayer[];
  /** True when we had to deviate from the manager's sheet. */
  autoFilled: boolean;
};

/**
 * Resolve the eleven for one club.
 *
 * `squad` should already be scoped to the club. Players are never invented:
 * if a club genuinely has fewer than 11 available bodies it fields what it
 * has, and the engine applies the resulting penalty.
 */
export function resolveLineup(
  squad: DBPlayer[],
  formation: string,
  saved: SavedLineup,
  now: Date = new Date(),
): ResolvedLineup {
  const available = squad.filter((p) => isAvailable(p, now));
  const byId = new Map(available.map((p) => [p.id, p]));

  // 1. The manager's XI, minus anyone who cannot play today.
  const starters: DBPlayer[] = [];
  const used = new Set<string>();
  for (const playerId of saved.xi) {
    const p = byId.get(playerId);
    if (!p || used.has(p.id)) continue;
    starters.push(p);
    used.add(p.id);
  }
  const autoFilled = starters.length < 11;

  // 2. Fill by formation need. Work out which lines are short, then take the
  //    best available player for each missing slot.
  if (starters.length < 11) {
    const { def, mid, fwd } = parseFormation(formation);
    const need: Record<DBPlayer["position"], number> = {
      GK: 1,
      DEF: def,
      MID: mid,
      FWD: fwd,
    };
    for (const p of starters) need[p.position] = Math.max(0, need[p.position] - 1);

    const pool = available
      .filter((p) => !used.has(p.id))
      // Prefer players the manager put on the bench, in their order.
      .sort((a, b) => {
        const ai = saved.bench.indexOf(a.id);
        const bi = saved.bench.indexOf(b.id);
        if (ai !== -1 && bi !== -1) return ai - bi;
        if (ai !== -1) return -1;
        if (bi !== -1) return 1;
        return b.overall - a.overall;
      });

    for (const pos of ["GK", "DEF", "MID", "FWD"] as const) {
      while (need[pos] > 0 && starters.length < 11) {
        const free = pool.filter((p) => !used.has(p.id));
        if (free.length === 0) break;
        // Prefer specialists. Ranking the whole pool by a scoring function
        // meant a strong midfielder could out-score a weaker natural
        // defender for a defensive slot, so auto-picked sides lined up 3 at
        // the back in a 4-4-2 while four fit defenders sat on the bench.
        // Only reach for an out-of-position player once the specialists in
        // that line are exhausted.
        const natural = free.filter((p) => p.position === pos);
        const candidates = natural.length > 0 ? natural : free;
        const best = candidates.reduce((a, b) =>
          fitnessForPosition(b, pos) > fitnessForPosition(a, pos) ? b : a,
        );
        starters.push(best);
        used.add(best.id);
        need[pos]--;
      }
    }

    // Still short (a line ran dry) — take the best of whoever is left.
    for (const p of pool) {
      if (starters.length >= 11) break;
      if (used.has(p.id)) continue;
      starters.push(p);
      used.add(p.id);
    }
  }

  const bench = available
    .filter((p) => !used.has(p.id))
    .sort((a, b) => {
      const ai = saved.bench.indexOf(a.id);
      const bi = saved.bench.indexOf(b.id);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return b.overall - a.overall;
    })
    .slice(0, 9);

  return { starters: starters.slice(0, 11), bench, autoFilled };
}

/**
 * Auto-pick a whole team sheet from scratch — used to seed a club's saved
 * line-up (bots at league creation, and humans so their first match is not
 * played by an empty sheet).
 */
export function autoLineup(squad: DBPlayer[], formation: string): SavedLineup {
  const resolved = resolveLineup(squad, formation, EMPTY_LINEUP);
  return {
    xi: resolved.starters.map((p) => p.id),
    bench: resolved.bench.map((p) => p.id),
  };
}
