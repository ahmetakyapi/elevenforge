/**
 * Generating a believable footballer.
 *
 * Three places create players out of nothing — the scout, the youth academy
 * and the transfer market top-up — and each had invented its own rules. The
 * scout's were the worst: `overall = 68 + random*12` and
 * `potential = overall + random*14`, applied identically to a 17-year-old and
 * a 30-year-old. So a scout could return a 17-year-old already rated 79 with
 * nothing left to learn, or a 30-year-old with +14 of growth he had no years
 * left to use. Both are nonsense, and both were priced by
 * `marketValueCents`, so the nonsense had a bill attached.
 *
 * The rule here is simple and is the one football actually follows: a player
 * has a CEILING, and his age says how much of it he has reached. A 17-year-old
 * is twenty points short of his; a 27-year-old is at it. That single change
 * makes age mean something when you read a scout report — young is a bet,
 * old is a known quantity — which is the decision scouting is supposed to be.
 */
import { attributesFor } from "@/lib/attributes";
import { marketValueCents } from "@/lib/economy";
import type { Position } from "@/types";

/** Roles a position can hold, weighted the way real squads are shaped. */
const ROLE_POOL: Record<Position, Array<[string, number]>> = {
  GK: [["GK", 1]],
  DEF: [
    ["CB", 5],
    ["LB", 2],
    ["RB", 2],
  ],
  MID: [
    ["CM", 4],
    ["CDM", 3],
    ["AM", 2],
    ["LM", 1],
    ["RM", 1],
  ],
  FWD: [
    ["ST", 4],
    ["RW", 2],
    ["LW", 2],
    ["CF", 1],
  ],
};

function weightedPick<T>(table: Array<[T, number]>, r: () => number): T {
  const total = table.reduce((s, [, w]) => s + w, 0);
  let n = r() * total;
  for (const [v, w] of table) {
    n -= w;
    if (n <= 0) return v;
  }
  return table[table.length - 1][0];
}

export function rollRole(position: Position, r: () => number = Math.random): string {
  return weightedPick(ROLE_POOL[position], r);
}

/**
 * Secondary roles, so a player is not locked to exactly one slot.
 *
 * The lineup screen scores a player 3 for his own role, 2 for a secondary and
 * 1 for merely the right position group — but nothing generated outside the
 * squad packs ever had a secondary, so every scouted and every academy player
 * was a one-slot specialist. Wingers and full-backs in particular swap flanks
 * constantly; refusing that made a squad harder to arrange than it should be.
 */
const SECONDARY: Record<string, string[]> = {
  CB: ["LB", "RB"],
  LB: ["RB", "LM"],
  RB: ["LB", "RM"],
  CDM: ["CM", "CB"],
  CM: ["CDM", "AM"],
  AM: ["CM", "LW", "RW"],
  LM: ["LW", "CM"],
  RM: ["RW", "CM"],
  LW: ["RW", "AM"],
  RW: ["LW", "AM"],
  ST: ["CF"],
  CF: ["ST", "AM"],
  GK: [],
};

export function rollSecondaryRoles(role: string, r: () => number = Math.random): string[] {
  const pool = SECONDARY[role] ?? [];
  if (pool.length === 0) return [];
  // Most players have one; a few are genuinely versatile.
  const n = r() < 0.55 ? 1 : r() < 0.85 ? 0 : 2;
  return pool.slice(0, Math.min(n, pool.length));
}

/**
 * How far a player is from his ceiling, by age.
 *
 * The gap is what makes `potential` a scouting signal rather than decoration:
 * at 17 you are buying the number on the right, at 28 the one on the left.
 */
function realisationGap(age: number, r: () => number): number {
  if (age <= 17) return 16 + r() * 10;
  if (age <= 19) return 12 + r() * 8;
  if (age <= 21) return 7 + r() * 7;
  if (age <= 23) return 4 + r() * 6;
  if (age <= 26) return 1 + r() * 4;
  if (age <= 29) return r() * 2;
  return 0;
}

export type Rating = { overall: number; potential: number };

/**
 * Roll a rating pair for a player of this age at this quality band.
 *
 * `tier` is 0 (a league's filler) to 1 (a star nobody in the division can
 * afford). It sets the CEILING; age decides how much of it is already there.
 */
export function rollRating(
  age: number,
  tier: number,
  r: () => number = Math.random,
): Rating {
  const band = Math.max(0, Math.min(1, tier));
  const ceiling = 63 + band * 31; // 63 … 94
  const potential = Math.max(
    52,
    Math.min(95, Math.round(ceiling + (r() - 0.5) * 7)),
  );
  const overall = Math.max(
    46,
    Math.min(potential, Math.round(potential - realisationGap(age, r))),
  );
  return { overall, potential };
}

export type GeneratedPlayer = {
  name: string;
  position: Position;
  role: string;
  secondaryRoles: string[];
  age: number;
  nationality: string;
  overall: number;
  potential: number;
  pace: number;
  shooting: number;
  passing: number;
  defending: number;
  physical: number;
  goalkeeping: number;
  marketValueCents: number;
};

/**
 * A complete, self-consistent player.
 *
 * Attributes come from `attributesFor`, so a generated centre-back defends
 * like one; value and wage come from the single economy curve, so a
 * generated player is priced on the same scale as one from a squad pack.
 */
export function generatePlayer(opts: {
  name: string;
  nationality: string;
  position: Position;
  age: number;
  /** 0-1 quality band. */
  tier: number;
  role?: string;
  rng?: () => number;
}): GeneratedPlayer {
  const r = opts.rng ?? Math.random;
  const role = opts.role ?? rollRole(opts.position, r);
  const { overall, potential } = rollRating(opts.age, opts.tier, r);
  const attrs = attributesFor(overall, role, r);
  const value = marketValueCents(overall, potential, opts.age);
  return {
    name: opts.name,
    position: opts.position,
    role,
    secondaryRoles: rollSecondaryRoles(role, r),
    age: opts.age,
    nationality: opts.nationality,
    overall,
    potential,
    ...attrs,
    marketValueCents: value,
  };
}

// ─── Names for invented players ─────────────────────────────────────────
// Deliberately kept disjoint from lib/jobs/scout.ts's real-footballer pools
// and from the squad packs: the market must never offer a player the league
// already owns, and a generated name colliding with Vinícius Júnior would
// read as a bug rather than a coincidence.

const TR_FIRST = [
  "Emre", "Kerem", "Barış", "Uğur", "Halil", "Yusuf", "Berkay", "Doğan",
  "Serdar", "Onur", "Cenk", "Mert", "Kaan", "Tolga", "Umut", "Eren",
  "Bora", "Sinan", "Deniz", "Alper", "Batuhan", "Efe", "Kağan", "Toprak",
  "Poyraz", "Ediz", "Sarp", "Tunahan", "Yiğit", "Berat", "Çağlar", "Hakan",
];
const TR_LAST = [
  "Yılmaz", "Demir", "Kaya", "Şahin", "Çelik", "Yıldız", "Aydın", "Öztürk",
  "Arslan", "Doğan", "Kılıç", "Aslan", "Çetin", "Korkmaz", "Bulut", "Erdoğan",
  "Koç", "Kurt", "Özdemir", "Şimşek", "Turan", "Aksoy", "Tekin", "Güneş",
  "Polat", "Sarı", "Bozkurt", "Ateş", "Yalçın", "Kaplan", "Duman", "Akgün",
];

const INTL_FIRST = [
  "Marco", "Luca", "Diego", "Andrés", "Mateo", "Rafael", "Nikola", "Stefan",
  "Youssef", "Karim", "Ibrahim", "Moussa", "Lucas", "Thiago", "Pedro", "Emil",
  "Viktor", "Jonas", "Mattias", "Ruben", "Dylan", "Noah", "Elias", "Milan",
  "Kwame", "Samuel", "Daniel", "Adrian", "Filip", "Tomas", "Anton", "Bruno",
];
const INTL_LAST = [
  "Ferreira", "Moretti", "Navarro", "Delgado", "Petrović", "Kovač", "Haddad",
  "Diallo", "Traoré", "Silva", "Costa", "Lindqvist", "Nyman", "Bakker",
  "Visser", "Novák", "Horváth", "Dumitru", "Popa", "Andersen", "Larsen",
  "Mensah", "Owusu", "Sørensen", "Vidal", "Rojas", "Marchetti", "Bianchi",
  "Kowalski", "Nowak", "Brandt", "Keller",
];

const NATS = ["TR", "BR", "AR", "FR", "ES", "PT", "NL", "DE", "IT", "SN", "MA", "NG", "RS", "HR", "SE", "DK"];

/**
 * An invented name and the nationality that fits it.
 *
 * Turkish-weighted, because this is a Turkish league and a market where four
 * out of five arrivals are foreign reads as someone else's game.
 */
export function inventName(r: () => number = Math.random): {
  name: string;
  nat: string;
} {
  if (r() < 0.55) {
    return {
      name: `${TR_FIRST[Math.floor(r() * TR_FIRST.length)]} ${TR_LAST[Math.floor(r() * TR_LAST.length)]}`,
      nat: "TR",
    };
  }
  return {
    name: `${INTL_FIRST[Math.floor(r() * INTL_FIRST.length)]} ${INTL_LAST[Math.floor(r() * INTL_LAST.length)]}`,
    nat: NATS[Math.floor(r() * NATS.length)],
  };
}
