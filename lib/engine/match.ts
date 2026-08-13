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
import { parseFormation } from "./formation";
import { EMPTY_LINEUP, resolveLineup, type SavedLineup } from "@/lib/lineup";
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
  // Physio tier 0-3 per side. Scales injury chance × (1 - tier*0.18) and
  // halves the lay-off length on a tier-3 staff.
  homePhysioTier?: number;
  awayPhysioTier?: number;
  // Pre-set in-match substitutions: at minute M, swap outId off → inId on.
  // Engine validates inId exists in the squad and isn't already on the
  // pitch. Up to 3 subs is the convention but the engine accepts more.
  homeSubPlan?: Array<{ minute: number; outId: string; inId: string }>;
  awaySubPlan?: Array<{ minute: number; outId: string; inId: string }>;
  // The managers' saved team sheets. Omitted → the engine auto-picks.
  homeLineup?: SavedLineup;
  awayLineup?: SavedLineup;
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
// Delegated to lib/lineup.ts so the manager's saved team sheet is what
// actually takes the field. The engine used to re-pick the best eleven by
// `overall` here, which silently discarded whatever the manager arranged.
function pickStarters(
  squad: DBPlayer[],
  formation: string,
  saved: SavedLineup,
): DBPlayer[] {
  return resolveLineup(squad, formation, saved).starters;
}

// Attribute-aware unit power. Instead of averaging `overall`, each unit
// uses the attributes most relevant to its job: attackers score with
// shooting, defenders block with defending, midfielders distribute with
// passing. Falls back to `overall` if an attribute is missing (legacy rows
// from pre-0012).
function teamPower(
  starters: DBPlayer[],
  tactics: TacticInput,
  homeBoost: number,
): { attack: number; midfield: number; defense: number; overall: number } {
  const byPos = (pos: DBPlayer["position"]) =>
    starters.filter((p) => p.position === pos);
  // An empty line means nobody is playing there — it must be *terrible*, not
  // league-average. The old value of 70 meant a club with no defenders (or no
  // squad at all) defended like a mid-table side, which let drained bot
  // squads stay competitive and made having no goalkeeper better than having
  // a bad one.
  const EMPTY_LINE = 30;
  const avgAttr = (arr: DBPlayer[], pick: (p: DBPlayer) => number) =>
    arr.length === 0
      ? EMPTY_LINE
      : arr.reduce((s, p) => s + pick(p), 0) / arr.length;

  const defs = byPos("DEF");
  const mids = byPos("MID");
  const fwds = byPos("FWD");
  const gk = byPos("GK")[0];

  // Attackers: shooting leads, pace + physical help, overall as a floor.
  const fwdShoot = avgAttr(fwds, (p) => p.shooting);
  const fwdPace = avgAttr(fwds, (p) => p.pace);
  const fwdPhys = avgAttr(fwds, (p) => p.physical);
  const fwdOvr = avgAttr(fwds, (p) => p.overall);
  const attackCore =
    fwdShoot * 0.55 + fwdPace * 0.2 + fwdPhys * 0.1 + fwdOvr * 0.15;

  // Midfielders: passing leads, physical + pace support.
  const midPass = avgAttr(mids, (p) => p.passing);
  const midPhys = avgAttr(mids, (p) => p.physical);
  const midPace = avgAttr(mids, (p) => p.pace);
  const midOvr = avgAttr(mids, (p) => p.overall);
  const midCore =
    midPass * 0.5 + midPhys * 0.2 + midPace * 0.15 + midOvr * 0.15;

  // Defenders: defending leads, physical helps, pace for full-backs.
  const defDef = avgAttr(defs, (p) => p.defending);
  const defPhys = avgAttr(defs, (p) => p.physical);
  const defPace = avgAttr(defs, (p) => p.pace);
  const defOvr = avgAttr(defs, (p) => p.overall);
  const defCore =
    defDef * 0.5 + defPhys * 0.2 + defPace * 0.1 + defOvr * 0.2;

  // GK: goalkeeping is king. Playing without one is a disaster, not a
  // league-average performance — the old fallback of 70 meant an empty net
  // defended better than a poor keeper.
  const gkPwr = gk ? gk.goalkeeping * 0.75 + gk.overall * 0.25 : EMPTY_LINE;

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

  // Formation shifts effort between the lines. These are ADDITIVE, not
  // multiplicative: a formation should trade attack for defence, never
  // create or destroy team strength outright. The previous version scaled
  // each unit by count/ideal — so a lone striker in 4-2-3-1 kept only 50% of
  // the attack score (roughly 0.1 expected goals, a near-guaranteed loss)
  // while 4-3-3 got a 150% multiplier and produced 6-7 goal scorelines.
  const { def: defCount, mid: midCount, fwd: fwdCount } = parseFormation(
    tactics.formation,
  );
  const defShift = (defCount - 4) * 1.6;
  const midShift = (midCount - 4) * 1.6;
  const fwdShift = (fwdCount - 2) * 2.2;

  // Fielding fewer than eleven is a real handicap — each empty shirt costs
  // the whole side, not just the line it came from.
  const shortfall = Math.max(0, 11 - starters.length) * 2.5;

  const attack =
    attackCore * 0.75 +
    midCore * 0.25 +
    fwdShift +
    mentalityBoost +
    moraleBoost +
    homeBoost * 0.6 -
    fitPenalty -
    shortfall;
  const midfield =
    midCore +
    midShift +
    pressingBoost +
    tempoBoost +
    moraleBoost * 0.5 +
    homeBoost * 0.4 -
    fitPenalty -
    shortfall;
  const defense =
    defCore * 0.7 +
    gkPwr * 0.3 +
    defShift -
    mentalityBoost * 0.5 +
    moraleBoost * 0.5 +
    homeBoost * 0.4 -
    fitPenalty -
    shortfall;
  const overall = attack * 0.4 + midfield * 0.3 + defense * 0.3;

  return { attack, midfield, defense, overall };
}

// ─── Simulate ─────────────────────────────────────────────────
export function simulateMatch(input: SimInput): MatchResult {
  const rng = createRng(input.seed);
  const homeStarters = pickStarters(
    input.homeSquad,
    input.homeTactics.formation,
    input.homeLineup ?? EMPTY_LINEUP,
  );
  const awayStarters = pickStarters(
    input.awaySquad,
    input.awayTactics.formation,
    input.awayLineup ?? EMPTY_LINEUP,
  );

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

  // Expected goals: attack against the opponent's defence, nudged by who
  // controls midfield. Divisors are deliberately large so a talent gap
  // shifts the odds rather than guaranteeing a rout — a 15-point power
  // advantage is worth about +0.6 xG, not +4.
  const midEdge = (homePower.midfield - awayPower.midfield) / 40;
  const baseHome = 1.42;
  const baseAway = 1.14;
  const homeXG =
    Math.min(
      4.2,
      Math.max(0.18, (homePower.attack - awayPower.defense) / 24 + baseHome + midEdge),
    ) * stakesMultiplier;
  const awayXG =
    Math.min(
      4.2,
      Math.max(0.18, (awayPower.attack - homePower.defense) / 24 + baseAway - midEdge),
    ) * stakesMultiplier;

  // Poisson realization, capped at 7 goals per side.
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

  // Choose scorers biased to FWDs > MIDs > DEFs. Within each tier, weight
  // by `shooting` so a 90-shooting striker scores far more often than a
  // 65-shooting one, and a midfielder with sharp shooting can outscore a
  // weak striker.
  const pickScorer = (
    starters: DBPlayer[],
    r: () => number,
  ): DBPlayer | undefined => {
    if (starters.length === 0) return undefined;
    const weighted = starters.flatMap((p) => {
      const posWeight =
        p.position === "FWD"
          ? 6
          : p.position === "MID"
            ? 3
            : p.position === "DEF"
              ? 1
              : 0;
      const copies = Math.max(1, Math.round((posWeight * p.shooting) / 70));
      return Array(copies).fill(p);
    });
    if (weighted.length === 0) return starters[0];
    return weighted[Math.floor(r() * weighted.length)] ?? starters[0];
  };

  // Assisters favor high-passing midfielders; forwards assist less often.
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
    const weighted = pool.flatMap((p) => {
      const posWeight = p.position === "MID" ? 4 : p.position === "FWD" ? 2 : 1;
      const copies = Math.max(1, Math.round((posWeight * p.passing) / 70));
      return Array(copies).fill(p);
    });
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
    kind: "goal" | "card" | "sub";
    scorer?: DBPlayer;
    assister?: DBPlayer;
    cardPlayer?: DBPlayer;
    cardKind?: "yellow" | "red";
    subOut?: DBPlayer;
    subIn?: DBPlayer;
  };

  // Compute who's on the pitch for `side` at `minute`, applying every
  // valid sub up to that point. Subs are validated (target on pitch + sub
  // not already used). Lets goal/card events post-sub use the right pool.
  const computePoolAt = (
    side: "home" | "away",
    minute: number,
  ): DBPlayer[] => {
    const original = side === "home" ? homeStarters : awayStarters;
    const squad = side === "home" ? input.homeSquad : input.awaySquad;
    const plan = side === "home" ? input.homeSubPlan ?? [] : input.awaySubPlan ?? [];
    const pool = [...original];
    const sorted = [...plan].sort((a, b) => a.minute - b.minute);
    for (const sub of sorted) {
      if (sub.minute > minute) break;
      const inP = squad.find((p) => p.id === sub.inId);
      if (!inP) continue;
      if (pool.some((p) => p.id === inP.id)) continue;
      const idx = pool.findIndex((p) => p.id === sub.outId);
      if (idx < 0) continue;
      pool[idx] = inP;
    }
    return pool;
  };

  // Sort all event minutes; pick scorers/cards using post-sub pool.
  const allEventMins: Array<{
    minute: number;
    kind: "goalHome" | "goalAway" | "card";
  }> = [
    ...homeMins.map((m) => ({ minute: m, kind: "goalHome" as const })),
    ...awayMins.map((m) => ({ minute: m, kind: "goalAway" as const })),
    ...cardMins.map((m) => ({ minute: m, kind: "card" as const })),
  ].sort((a, b) => a.minute - b.minute);

  const raw: Ev[] = [];
  // Strict refs increase the chance a card is red (0.05 + 0.04*strict)
  // Share of cards that are red. Real football sends someone off in roughly
  // one match in eight; at 0.04 + 0.03×strictness this was producing about
  // half a red card *per match* (nearly one with the strictest referee),
  // which wrecked squads and the suspension ledger.
  const redChance = 0.012 + 0.006 * refStrict;

  for (const ev of allEventMins) {
    if (ev.kind === "goalHome") {
      const pool = computePoolAt("home", ev.minute);
      const scorer = pickScorer(pool, rng);
      if (!scorer) continue;
      const assister = pickAssister(pool, scorer.id, rng);
      raw.push({ minute: ev.minute, side: "home", kind: "goal", scorer, assister });
    } else if (ev.kind === "goalAway") {
      const pool = computePoolAt("away", ev.minute);
      const scorer = pickScorer(pool, rng);
      if (!scorer) continue;
      const assister = pickAssister(pool, scorer.id, rng);
      raw.push({ minute: ev.minute, side: "away", kind: "goal", scorer, assister });
    } else {
      const side: "home" | "away" = rng() < 0.5 ? "home" : "away";
      const pool = computePoolAt(side, ev.minute).filter((p) => p.position !== "GK");
      if (pool.length === 0) continue;
      const victim = pool[Math.floor(rng() * pool.length)];
      const cardKind: "yellow" | "red" = rng() < redChance ? "red" : "yellow";
      raw.push({ minute: ev.minute, side, kind: "card", cardPlayer: victim, cardKind });
    }
  }

  // Inject sub events into the raw timeline so they show up in commentary.
  for (const side of ["home", "away"] as const) {
    const plan = side === "home" ? input.homeSubPlan ?? [] : input.awaySubPlan ?? [];
    const squad = side === "home" ? input.homeSquad : input.awaySquad;
    for (const sub of plan) {
      const subOut = squad.find((p) => p.id === sub.outId);
      const subIn = squad.find((p) => p.id === sub.inId);
      if (!subOut || !subIn) continue;
      raw.push({ minute: sub.minute, side, kind: "sub", subOut, subIn });
    }
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
        }, rng),
      });
    } else if (e.kind === "card" && e.cardPlayer) {
      events.push({
        minute: e.minute,
        icon: e.cardKind === "red" ? "🟥" : "🟨",
        type: "card",
        cardPlayerId: e.cardPlayer.id,
        side: e.side,
        text: buildCommentary.card(
          {
            player: e.cardPlayer.name,
            minute: e.minute,
            kind: e.cardKind ?? "yellow",
          },
          rng,
        ),
      });
    } else if (e.kind === "sub" && e.subOut && e.subIn) {
      events.push({
        minute: e.minute,
        icon: "🔄",
        type: "sub",
        side: e.side,
        text: `${e.minute}'  Değişiklik: ${e.subOut.name} yerine ${e.subIn.name} sahaya çıktı.`,
      });
    }
  }
  // Halftime marker. This is pushed after the event loop has finished, so
  // `runningHome`/`runningAway` hold the FULL-TIME score by now — the half
  // time line was reporting the final result. Count the goals actually
  // scored in the first half instead.
  const halfHome = homeMins.filter((m) => m <= 45).length;
  const halfAway = awayMins.filter((m) => m <= 45).length;
  events.push({
    minute: 45,
    icon: "⏱",
    type: "half",
    text: `İlk yarı sonu. ${input.homeClubName} ${halfHome}, ${input.awayClubName} ${halfAway}.`,
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

  // Per-player updates.
  //
  // Every patch is a DELTA applied on top of BASE_RATING. Previously the
  // create branch used `patch.rating ?? 6.5`, so anyone who was not a starter
  // — a substitute — was created with the delta itself as their whole rating:
  // a sub who scored got 1.1, clamped up to the 4.0 floor, and then lost
  // morale for a match-winning goal.
  const BASE_RATING = 6.5;
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
        rating: BASE_RATING + (patch.rating ?? 0),
        goals: patch.goals ?? 0,
        assists: patch.assists ?? 0,
        yellow: patch.yellow ?? 0,
        red: patch.red ?? 0,
        injuredMinutes: patch.injuredMinutes,
      });
    }
  };
  // Seed the starters with a small spread around the base. Substitutes are
  // created on first contribution and pick the base up from `upsert`.
  for (const p of [...homeStarters, ...awayStarters]) {
    upsert(p.id, { rating: (rng() - 0.5) * 0.6 });
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
  // Keeper rating — hit per goal conceded, but a world-class keeper
  // (goalkeeping ≥ 85) eats the blame less than a rookie. Clean sheet
  // awards a bonus scaled by the opponent's attacking pressure.
  const gkAdjust = (gk: DBPlayer | undefined, conceded: number) => {
    if (!gk) return;
    const gkFactor = Math.max(0.5, 1 - (gk.goalkeeping - 70) * 0.015);
    upsert(gk.id, {
      rating: -0.3 * conceded * gkFactor + (conceded === 0 ? 0.5 : 0.15),
    });
  };
  gkAdjust(
    homeStarters.find((p) => p.position === "GK"),
    awayScore,
  );
  gkAdjust(
    awayStarters.find((p) => p.position === "GK"),
    homeScore,
  );

  // Small chance of injury per match per side (~7% baseline). A hired
  // physio scales both incidence and duration down by tier × 18% / 25%.
  const maybeInjure = (starters: DBPlayer[], physioTier: number) => {
    if (starters.length === 0) return;
    const incidenceScale = Math.max(0.1, 1 - physioTier * 0.18);
    const durationScale = Math.max(0.4, 1 - physioTier * 0.25);
    if (rng() < 0.07 * incidenceScale) {
      const p = starters[Math.floor(rng() * starters.length)];
      if (!p) return;
      const days = Math.max(1, Math.ceil(rng() * 10 * durationScale));
      upsert(p.id, { injuredMinutes: days * 24 * 60 });
    }
  };
  maybeInjure(homeStarters, input.homePhysioTier ?? 0);
  maybeInjure(awayStarters, input.awayPhysioTier ?? 0);

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
