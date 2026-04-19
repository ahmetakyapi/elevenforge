/**
 * Match simulation engine.
 *
 * Deterministic when given a seed; otherwise uses Math.random.
 * Takes two clubs + their squads + tactics and produces:
 *  - scoreline
 *  - minute-by-minute event timeline with Turkish AI-style commentary
 *  - per-player ratings, goals, assists, cards, injury risks
 *  - match stats (possession, shots, corners, cards)
 *
 * Home advantage: ~5-8% power boost, capped so it never overrides a much
 * stronger away side (gameplay-fair).
 */
import type { DBPlayer } from "@/lib/schema";
import { buildCommentary } from "./commentary";

// ─── Types ────────────────────────────────────────────────────
export type MatchEvent = {
  minute: number;
  icon: string;
  type:
    | "start"
    | "goal"
    | "shot"
    | "card"
    | "sub"
    | "analysis"
    | "half"
    | "end";
  text: string;
  scorerId?: string;
  assisterId?: string;
  cardPlayerId?: string;
  side?: "home" | "away";
};

export type MatchStats = {
  possessionHome: number;
  possessionAway: number;
  shotsHome: number;
  shotsAway: number;
  shotsOnHome: number;
  shotsOnAway: number;
  cornersHome: number;
  cornersAway: number;
  cardsHome: number;
  cardsAway: number;
  crowdEnergy: number;
  refereeName: string;
  refereeStrictness: number; // 1 (lenient) – 5 (strict)
};

/**
 * Pool of named referees. `strictness`:
 *   1-2 → soft; players take risks, fewer cards
 *   3   → balanced
 *   4-5 → strict; cards fly, players slightly more cautious (less aggressive
 *         tactics nudged a tick down)
 */
const REFEREES: Array<{ name: string; strictness: number }> = [
  { name: "Halil Umut Meler", strictness: 4 },
  { name: "Cüneyt Çakır", strictness: 3 },
  { name: "Mete Kalkavan", strictness: 4 },
  { name: "Ali Şansalan", strictness: 2 },
  { name: "Yaşar Kemal Uğurlu", strictness: 3 },
  { name: "Atilla Karaoğlan", strictness: 5 },
  { name: "Ozan Ergün", strictness: 2 },
  { name: "Volkan Bayarslan", strictness: 3 },
];

export type MatchSideUpdate = {
  clubId: string;
  goalsFor: number;
  goalsAgainst: number;
  result: "W" | "D" | "L";
  points: number;
};

export type PlayerUpdate = {
  playerId: string;
  rating: number;
  goals: number;
  assists: number;
  yellow: number;
  red: number;
  injuredMinutes?: number; // if > 0, injury
};

export type MatchResult = {
  homeScore: number;
  awayScore: number;
  events: MatchEvent[];
  stats: MatchStats;
  homeUpdate: MatchSideUpdate;
  awayUpdate: MatchSideUpdate;
  playerUpdates: PlayerUpdate[];
};

export type TacticInput = {
  formation: string;
  mentality: number; // 0-4 (def → att)
  pressing: number; // 0-4
  tempo: number; // 0-4
};

export type SimInput = {
  homeClubId: string;
  awayClubId: string;
  homeClubName: string;
  awayClubName: string;
  homeSquad: DBPlayer[];
  awaySquad: DBPlayer[];
  homeTactics: TacticInput;
  awayTactics: TacticInput;
  homeCity?: string;
  awayCity?: string;
  // Stadium quality 1-5; bigger pitches/crowds amplify home advantage and
  // the in-game crowd-energy stat.
  homeStadiumLevel?: number;
  // Home prestige 0-100 (clubs.prestige); fans react more loudly to derby
  // wins of high-prestige sides. Scaled into the crowd energy stat.
  homePrestige?: number;
  seed?: number;
};

// ─── RNG ──────────────────────────────────────────────────────
function createRng(seed: number | undefined) {
  if (seed === undefined) return Math.random;
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

// ─── Line-up selection ────────────────────────────────────────
// Picks 11 starters aiming for 1 GK / 4 DEF / 4 MID / 2 FWD. Players with
// secondary roles spanning another line are eligible as fillers.
function pickStarters(squad: DBPlayer[]): DBPlayer[] {
  const active = squad.filter(
    (p) => p.status !== "injured" && p.status !== "suspended",
  );
  const pickN = (pos: DBPlayer["position"], n: number) =>
    active
      .filter((p) => p.position === pos)
      .sort((a, b) => b.overall - a.overall)
      .slice(0, n);
  const gk = pickN("GK", 1);
  const def = pickN("DEF", 4);
  const mid = pickN("MID", 4);
  const fwd = pickN("FWD", 2);
  const starters = [...gk, ...def, ...mid, ...fwd];
  if (starters.length < 11) {
    const remaining = active
      .filter((p) => !starters.some((s) => s.id === p.id))
      .sort((a, b) => b.overall - a.overall);
    starters.push(...remaining.slice(0, 11 - starters.length));
  }
  return starters.slice(0, 11);
}

function teamPower(
  starters: DBPlayer[],
  tactics: TacticInput,
  homeBoost: number,
): { attack: number; midfield: number; defense: number; overall: number } {
  const byPos = (pos: DBPlayer["position"]) =>
    starters.filter((p) => p.position === pos);
  const avg = (arr: DBPlayer[]) =>
    arr.length === 0 ? 70 : arr.reduce((s, p) => s + p.overall, 0) / arr.length;
  const gkOvr = byPos("GK")[0]?.overall ?? 70;
  const defOvr = avg(byPos("DEF"));
  const midOvr = avg(byPos("MID"));
  const fwdOvr = avg(byPos("FWD"));

  // Morale 1-5, 3 neutral. ±3 at extremes.
  const avgMorale =
    starters.length === 0
      ? 3
      : starters.reduce((s, p) => s + p.morale, 0) / starters.length;
  const moraleBoost = (avgMorale - 3) * 1.5;

  // Fitness penalty: starters with <75 avg fitness tire visibly.
  const avgFit =
    starters.length === 0
      ? 90
      : starters.reduce((s, p) => s + p.fitness, 0) / starters.length;
  const fitPenalty = avgFit < 75 ? (75 - avgFit) * 0.05 : 0;

  // Mentality 0-4: 0=defensive, 2=balanced, 4=attacking
  const mentalityBoost = (tactics.mentality - 2) * 1.2;
  const pressingBoost = (tactics.pressing - 2) * 0.6;
  const tempoBoost = (tactics.tempo - 2) * 0.4;

  const attack = fwdOvr + midOvr * 0.35 + mentalityBoost + moraleBoost;
  const midfield = midOvr + pressingBoost + tempoBoost + moraleBoost * 0.5;
  const defense = defOvr * 0.7 + gkOvr * 0.3 - mentalityBoost * 0.5;
  const overall =
    attack * 0.4 +
    midfield * 0.3 +
    defense * 0.3 +
    homeBoost +
    moraleBoost * 0.3 -
    fitPenalty;

  return { attack, midfield, defense, overall };
}

// ─── Simulate ─────────────────────────────────────────────────
export function simulateMatch(input: SimInput): MatchResult {
  const rng = createRng(input.seed);
  const homeStarters = pickStarters(input.homeSquad);
  const awayStarters = pickStarters(input.awaySquad);

  // Referee deterministically picked from the seed so replays match. The
  // reference passes through to commentary + influences card frequency.
  const referee = REFEREES[(input.seed ?? 0) % REFEREES.length];
  const refStrict = referee.strictness;

  // Stadium boost: base 2.5 + 0.5 per level above 1 (so L5 = +4.5 home).
  // Clamped to [1, 5] in case a malformed value gets through.
  const stadiumLevel = Math.max(1, Math.min(5, input.homeStadiumLevel ?? 1));
  const homeBoost = 2.5 + (stadiumLevel - 1) * 0.5;

  // Strict refs nudge both sides one tick down on the aggression dial
  // (mentality + pressing). Soft refs (1-2) nudge them up. Effect is small
  // — it should reshape risk-taking, not flip results.
  const refMentalityShift = refStrict >= 4 ? -0.4 : refStrict <= 2 ? 0.3 : 0;
  const homeT = {
    ...input.homeTactics,
    mentality: input.homeTactics.mentality + refMentalityShift,
    pressing: input.homeTactics.pressing + refMentalityShift,
  };
  const awayT = {
    ...input.awayTactics,
    mentality: input.awayTactics.mentality + refMentalityShift,
    pressing: input.awayTactics.pressing + refMentalityShift,
  };

  const homePower = teamPower(homeStarters, homeT, homeBoost);
  const awayPower = teamPower(awayStarters, awayT, 0);

  const sameCityDerby = input.homeCity && input.awayCity
    && input.homeCity === input.awayCity;
  const stakesMultiplier = sameCityDerby ? 1.15 : 1.0;

  // Expected goals for each side — roughly based on attack vs opponent defense
  const homeXG =
    Math.max(
      0.1,
      (homePower.attack - awayPower.defense * 1.05) / 14 + 1.35,
    ) * stakesMultiplier;
  const awayXG =
    Math.max(0.1, (awayPower.attack - homePower.defense * 1.05) / 14 + 1.05) *
    stakesMultiplier;

  // Poisson-ish realization via k-Bernoulli-events bounded 0..7
  const drawGoals = (lambda: number): number => {
    // Knuth-style Poisson
    const L = Math.exp(-lambda);
    let k = 0;
    let p = 1;
    do {
      k++;
      p *= rng();
    } while (p > L && k < 8);
    return k - 1;
  };

  const homeScore = drawGoals(homeXG);
  const awayScore = drawGoals(awayXG);

  // Build goal minutes — distribute uniformly 5..88 with light bias to 2nd half
  const goalMinutes = (count: number): number[] => {
    const out: number[] = [];
    for (let i = 0; i < count; i++) {
      const m = Math.floor(5 + rng() * 83);
      out.push(m);
    }
    return out.sort((a, b) => a - b);
  };
  const homeMins = goalMinutes(homeScore);
  const awayMins = goalMinutes(awayScore);

  // Choose scorers biased to FWDs > MIDs > DEFs, plus age-young bonus
  const pickScorer = (
    starters: DBPlayer[],
    r: () => number,
  ): DBPlayer | undefined => {
    if (starters.length === 0) return undefined;
    const weighted = starters.flatMap((p) => {
      const weight =
        p.position === "FWD"
          ? 6
          : p.position === "MID"
            ? 3
            : p.position === "DEF"
              ? 1
              : 0;
      const copies = Math.max(1, Math.round((weight * p.overall) / 80));
      return Array(copies).fill(p);
    });
    if (weighted.length === 0) return starters[0];
    return weighted[Math.floor(r() * weighted.length)] ?? starters[0];
  };

  const pickAssister = (
    starters: DBPlayer[],
    excludeId: string,
    r: () => number,
  ): DBPlayer | undefined => {
    if (r() < 0.25) return undefined; // solo goal
    const pool = starters.filter(
      (p) => p.id !== excludeId && p.position !== "GK",
    );
    if (pool.length === 0) return undefined;
    const weighted = pool.flatMap((p) =>
      Array(p.position === "MID" ? 4 : p.position === "FWD" ? 2 : 1).fill(p),
    );
    if (weighted.length === 0) return undefined;
    return weighted[Math.floor(r() * weighted.length)];
  };

  // Card events — frequency scales with referee strictness:
  //   strictness 1 → ~1 card avg, strictness 5 → ~5 cards avg.
  const cardMinutes = (count: number): number[] => {
    const out: number[] = [];
    for (let i = 0; i < count; i++) out.push(Math.floor(10 + rng() * 78));
    return out.sort((a, b) => a - b);
  };
  // Base = strictness ± 1 random card, clamped 0..7
  const totalCards = Math.max(
    0,
    Math.min(7, refStrict - 1 + Math.floor(rng() * 3)),
  );
  const cardMins = cardMinutes(totalCards);

  // Assemble events timeline
  type Ev = {
    minute: number;
    side: "home" | "away";
    kind: "goal" | "card";
    scorer?: DBPlayer;
    assister?: DBPlayer;
    cardPlayer?: DBPlayer;
    cardKind?: "yellow" | "red";
  };
  const raw: Ev[] = [];
  for (const m of homeMins) {
    const scorer = pickScorer(homeStarters, rng);
    if (!scorer) continue;
    const assister = pickAssister(homeStarters, scorer.id, rng);
    raw.push({ minute: m, side: "home", kind: "goal", scorer, assister });
  }
  for (const m of awayMins) {
    const scorer = pickScorer(awayStarters, rng);
    if (!scorer) continue;
    const assister = pickAssister(awayStarters, scorer.id, rng);
    raw.push({ minute: m, side: "away", kind: "goal", scorer, assister });
  }
  // Strict refs increase the chance a card is red (0.05 + 0.04*strict)
  const redChance = 0.04 + 0.03 * refStrict;
  for (const m of cardMins) {
    const side = rng() < 0.5 ? "home" : "away";
    const pool = (side === "home" ? homeStarters : awayStarters).filter(
      (p) => p.position !== "GK",
    );
    if (pool.length === 0) continue;
    const victim = pool[Math.floor(rng() * pool.length)];
    const cardKind = rng() < redChance ? "red" : "yellow";
    raw.push({
      minute: m,
      side,
      kind: "card",
      cardPlayer: victim,
      cardKind,
    });
  }
  raw.sort((a, b) => a.minute - b.minute);

  // Commentary-enrich
  const events: MatchEvent[] = [];
  events.push({
    minute: 0,
    icon: "⚽",
    type: "start",
    text: `Düdük çaldı. ${input.homeClubName} sahasında ${input.awayClubName}'yı ağırlıyor. Hakem ${referee.name}${refStrict >= 4 ? " — kart yağmuru bekleniyor." : refStrict <= 2 ? " — yumuşak elli, oyuncular rahat." : ""}. ${sameCityDerby ? "Derbi. Stat kükrüyor." : "Stat enerjisi yüksek."}`,
  });
  let runningHome = 0;
  let runningAway = 0;
  for (const e of raw) {
    if (e.kind === "goal" && e.scorer) {
      if (e.side === "home") runningHome++;
      else runningAway++;
      events.push({
        minute: e.minute,
        icon: "⚽",
        type: "goal",
        scorerId: e.scorer.id,
        assisterId: e.assister?.id,
        side: e.side,
        text: buildCommentary.goal({
          scorer: e.scorer.name,
          assister: e.assister?.name,
          minute: e.minute,
          homeClubName: input.homeClubName,
          awayClubName: input.awayClubName,
          scoringClubName:
            e.side === "home" ? input.homeClubName : input.awayClubName,
          runningHome,
          runningAway,
          derby: Boolean(sameCityDerby),
        }),
      });
    } else if (e.kind === "card" && e.cardPlayer) {
      events.push({
        minute: e.minute,
        icon: e.cardKind === "red" ? "🟥" : "🟨",
        type: "card",
        cardPlayerId: e.cardPlayer.id,
        side: e.side,
        text: buildCommentary.card({
          player: e.cardPlayer.name,
          minute: e.minute,
          kind: e.cardKind ?? "yellow",
        }),
      });
    }
  }
  // Halftime marker
  events.push({
    minute: 45,
    icon: "⏱",
    type: "half",
    text: `İlk yarı sonu. ${input.homeClubName} ${runningHome}, ${input.awayClubName} ${runningAway}.`,
  });
  // Reorder by minute after insertion
  events.sort((a, b) => a.minute - b.minute);
  events.push({
    minute: 90,
    icon: "🏁",
    type: "end",
    text: `Maç bitti. Skor: ${homeScore} - ${awayScore}.`,
  });

  // Stats
  const homePoss = Math.round(
    50 + (homePower.midfield - awayPower.midfield) * 1.2,
  );
  const stats: MatchStats = {
    possessionHome: Math.max(30, Math.min(70, homePoss)),
    possessionAway: 100 - Math.max(30, Math.min(70, homePoss)),
    shotsHome: homeScore * 2 + Math.floor(4 + rng() * 8),
    shotsAway: awayScore * 2 + Math.floor(3 + rng() * 7),
    shotsOnHome: homeScore + Math.floor(rng() * 4),
    shotsOnAway: awayScore + Math.floor(rng() * 3),
    cornersHome: Math.floor(3 + rng() * 8),
    cornersAway: Math.floor(2 + rng() * 6),
    cardsHome: raw.filter((e) => e.kind === "card" && e.side === "home")
      .length,
    cardsAway: raw.filter((e) => e.kind === "card" && e.side === "away")
      .length,
    crowdEnergy: Math.round(
      // Bigger stadia + higher prestige = louder crowds. Clamp 0-100.
      Math.min(
        100,
        50 +
          (stadiumLevel - 1) * 6 +
          ((input.homePrestige ?? 50) - 50) * 0.15 +
          rng() * 25 +
          (runningHome > runningAway ? 8 : 0) +
          (sameCityDerby ? 10 : 0),
      ),
    ),
    refereeName: referee.name,
    refereeStrictness: refStrict,
  };

  // Side updates
  const homeResult: "W" | "D" | "L" =
    homeScore > awayScore ? "W" : homeScore < awayScore ? "L" : "D";
  const awayResult: "W" | "D" | "L" =
    awayScore > homeScore ? "W" : awayScore < homeScore ? "L" : "D";
  const homeUpdate: MatchSideUpdate = {
    clubId: input.homeClubId,
    goalsFor: homeScore,
    goalsAgainst: awayScore,
    result: homeResult,
    points: homeResult === "W" ? 3 : homeResult === "D" ? 1 : 0,
  };
  const awayUpdate: MatchSideUpdate = {
    clubId: input.awayClubId,
    goalsFor: awayScore,
    goalsAgainst: homeScore,
    result: awayResult,
    points: awayResult === "W" ? 3 : awayResult === "D" ? 1 : 0,
  };

  // Per-player updates
  const playerUpdates: PlayerUpdate[] = [];
  const upsert = (id: string, patch: Partial<PlayerUpdate>) => {
    const existing = playerUpdates.find((u) => u.playerId === id);
    if (existing) {
      existing.goals += patch.goals ?? 0;
      existing.assists += patch.assists ?? 0;
      existing.yellow += patch.yellow ?? 0;
      existing.red += patch.red ?? 0;
      existing.rating += patch.rating ?? 0;
      if (patch.injuredMinutes !== undefined) {
        existing.injuredMinutes = patch.injuredMinutes;
      }
    } else {
      playerUpdates.push({
        playerId: id,
        rating: patch.rating ?? 6.5,
        goals: patch.goals ?? 0,
        assists: patch.assists ?? 0,
        yellow: patch.yellow ?? 0,
        red: patch.red ?? 0,
        injuredMinutes: patch.injuredMinutes,
      });
    }
  };
  // Base rating 6.5 for all starters, modified by events
  for (const p of [...homeStarters, ...awayStarters]) {
    upsert(p.id, { rating: 6.5 + (rng() - 0.5) * 0.6 });
  }
  for (const e of raw) {
    if (e.kind === "goal" && e.scorer) {
      upsert(e.scorer.id, { rating: 1.1, goals: 1 });
      if (e.assister) upsert(e.assister.id, { rating: 0.55, assists: 1 });
    } else if (e.kind === "card" && e.cardPlayer) {
      upsert(e.cardPlayer.id, {
        rating: e.cardKind === "red" ? -1.5 : -0.4,
        yellow: e.cardKind === "yellow" ? 1 : 0,
        red: e.cardKind === "red" ? 1 : 0,
      });
    }
  }
  // Keeper rating hit based on goals conceded
  const homeGK = homeStarters.find((p) => p.position === "GK");
  const awayGK = awayStarters.find((p) => p.position === "GK");
  if (homeGK) upsert(homeGK.id, { rating: -0.3 * awayScore + 0.15 });
  if (awayGK) upsert(awayGK.id, { rating: -0.3 * homeScore + 0.15 });

  // Small chance of injury per match per side (~5%)
  const maybeInjure = (starters: DBPlayer[]) => {
    if (rng() < 0.07) {
      const p = starters[Math.floor(rng() * starters.length)];
      const days = Math.ceil(rng() * 10);
      upsert(p.id, { injuredMinutes: days * 24 * 60 });
    }
  };
  maybeInjure(homeStarters);
  maybeInjure(awayStarters);

  // Clamp ratings to [4.0, 9.9]
  for (const u of playerUpdates) {
    u.rating = Math.max(4.0, Math.min(9.9, Number(u.rating.toFixed(1))));
  }

  return {
    homeScore,
    awayScore,
    events,
    stats,
    homeUpdate,
    awayUpdate,
    playerUpdates,
  };
}
