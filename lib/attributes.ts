/**
 * Per-role attribute generation, in one place.
 *
 * The offsets and the roll lived inside lib/actions/create-league.ts and were
 * not exported, so every other code path that creates a player had to either
 * copy them or skip attributes entirely. `claimScoutPlayer` skipped them: its
 * INSERT writes name, position, role, age, nationality, overall, potential,
 * value and wage — and nothing else. Every scouted player in the game
 * therefore landed on the schema defaults, pace/shooting/passing/defending/
 * physical 60 and goalkeeping 30, regardless of being an 82-rated striker.
 *
 * That is not cosmetic. lib/engine/match.ts scores a forward as
 * `shooting*0.55 + pace*0.20 + physical*0.10 + overall*0.15`, so a scouted
 * 82-rated striker played like a 60-rated one and the scouting fee bought a
 * player who underperformed his own rating forever.
 */

export type AttrOffsets = {
  pace: number;
  shooting: number;
  passing: number;
  defending: number;
  physical: number;
  goalkeeping: number;
};

/**
 * How far each attribute sits from `overall` for a given role.
 *
 * Keeps a striker's finishing above his tackling at equal `overall`, so the
 * match engine can read the right attribute per situation instead of treating
 * every player as a uniform block of skill.
 */
export const ROLE_ATTR_OFFSETS: Record<string, AttrOffsets> = {
  GK: { pace: -12, shooting: -45, passing: -5, defending: -15, physical: 0, goalkeeping: 18 },
  CB: { pace: -5, shooting: -22, passing: -6, defending: 12, physical: 8, goalkeeping: -40 },
  LB: { pace: 6, shooting: -16, passing: 1, defending: 4, physical: 0, goalkeeping: -40 },
  RB: { pace: 6, shooting: -16, passing: 1, defending: 4, physical: 0, goalkeeping: -40 },
  CDM: { pace: -3, shooting: -10, passing: 5, defending: 6, physical: 5, goalkeeping: -40 },
  CM: { pace: 0, shooting: -4, passing: 10, defending: -3, physical: 1, goalkeeping: -40 },
  AM: { pace: 3, shooting: 4, passing: 10, defending: -12, physical: -3, goalkeeping: -40 },
  LW: { pace: 11, shooting: 3, passing: 2, defending: -11, physical: -4, goalkeeping: -40 },
  RW: { pace: 11, shooting: 3, passing: 2, defending: -11, physical: -4, goalkeeping: -40 },
  ST: { pace: 6, shooting: 13, passing: -6, defending: -18, physical: 6, goalkeeping: -40 },
  CF: { pace: 4, shooting: 10, passing: -1, defending: -15, physical: 5, goalkeeping: -40 },
};

/** Clamped into [30, 99] so no roll produces an impossible attribute. */
export function rollAttr(
  base: number,
  offset: number,
  r: () => number,
): number {
  const noise = (r() - 0.5) * 8; // ±4
  return Math.max(30, Math.min(99, Math.round(base + offset + noise)));
}

/**
 * A full attribute set for a player of this rating and role.
 *
 * `r` defaults to Math.random because most callers are creating a one-off
 * player interactively; the league generator passes its own seeded RNG so a
 * league is reproducible from its seed.
 */
export function attributesFor(
  overall: number,
  role: string,
  r: () => number = Math.random,
): AttrOffsets {
  const o = ROLE_ATTR_OFFSETS[role] ?? ROLE_ATTR_OFFSETS.CM;
  return {
    pace: rollAttr(overall, o.pace, r),
    shooting: rollAttr(overall, o.shooting, r),
    passing: rollAttr(overall, o.passing, r),
    defending: rollAttr(overall, o.defending, r),
    physical: rollAttr(overall, o.physical, r),
    goalkeeping: rollAttr(overall, o.goalkeeping, r),
  };
}
