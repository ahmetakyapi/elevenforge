/**
 * AI manager personalities.
 *
 * Every club without a human at the wheel gets one of these, derived
 * deterministically from its id so the same club always behaves the same way
 * across restarts. The point is that rival clubs should feel like *people*:
 * one hoards money and plays it safe, another overspends on strikers, a
 * third only ever signs 21-year-olds. Identical bots are what made the league
 * feel like scenery instead of opposition.
 */
export type AiTrait = {
  id: string;
  label: string;
  /** Share of the budget the club is willing to commit to one signing. */
  splurge: number;
  /** How far above market value it will bid (1.0 = never overpays). */
  bidAggression: number;
  /** Preference for players under 23 when choosing between targets. */
  youthBias: number;
  /** Minimum squad size it tries to maintain before selling anyone. */
  minSquad: number;
  /** How readily it accepts an incoming offer (higher = easier to buy from). */
  sellWillingness: number;
  /** Tactical leaning: index into the formation pool. */
  preferredFormations: string[];
  mentality: number;
  pressing: number;
  tempo: number;
};

export const AI_TRAITS: AiTrait[] = [
  {
    id: "builder",
    label: "Genç Kurucu",
    splurge: 0.35,
    bidAggression: 1.15,
    youthBias: 0.9,
    minSquad: 20,
    sellWillingness: 0.55,
    preferredFormations: ["4-3-3", "4-2-3-1"],
    mentality: 3,
    pressing: 3,
    tempo: 3,
  },
  {
    id: "spender",
    label: "Müsrif Patron",
    splurge: 0.6,
    bidAggression: 1.35,
    youthBias: 0.3,
    minSquad: 19,
    sellWillingness: 0.3,
    preferredFormations: ["4-3-3", "3-5-2"],
    mentality: 4,
    pressing: 4,
    tempo: 3,
  },
  {
    id: "pragmatist",
    label: "Pragmatist",
    splurge: 0.3,
    bidAggression: 1.05,
    youthBias: 0.5,
    minSquad: 21,
    sellWillingness: 0.6,
    preferredFormations: ["4-4-2", "4-1-4-1"],
    mentality: 2,
    pressing: 2,
    tempo: 2,
  },
  {
    id: "fortress",
    label: "Kale Bekçisi",
    splurge: 0.25,
    bidAggression: 1.0,
    youthBias: 0.4,
    minSquad: 22,
    sellWillingness: 0.7,
    preferredFormations: ["5-3-2", "4-1-4-1"],
    mentality: 1,
    pressing: 2,
    tempo: 1,
  },
  {
    id: "gambler",
    label: "Kumarbaz",
    splurge: 0.75,
    bidAggression: 1.45,
    youthBias: 0.7,
    minSquad: 18,
    sellWillingness: 0.45,
    preferredFormations: ["4-3-3", "3-5-2"],
    mentality: 4,
    pressing: 4,
    tempo: 4,
  },
  {
    id: "accountant",
    label: "Kâhya",
    splurge: 0.15,
    bidAggression: 0.95,
    youthBias: 0.6,
    minSquad: 23,
    sellWillingness: 0.85,
    preferredFormations: ["4-4-2", "5-3-2"],
    mentality: 2,
    pressing: 1,
    tempo: 2,
  },
];

/** Stable 32-bit hash so a club's personality never changes between runs. */
export function hashId(value: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

export function traitForClub(clubId: string): AiTrait {
  return AI_TRAITS[hashId(clubId) % AI_TRAITS.length];
}

/** Deterministic per-club, per-day RNG so a re-run makes the same choices. */
export function dailyRng(clubId: string, dayStamp: number): () => number {
  let s = (hashId(clubId) ^ Math.imul(dayStamp, 2654435761)) >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}
