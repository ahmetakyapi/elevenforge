/**
 * Match simulation engine.
 *
 * Deterministic when given a seed; otherwise uses Math.random.
 * Takes two clubs + their squads + tactics and produces:
 *  - scoreline
 *  - a minute-by-minute timeline that reads like a match, not a results table
 *  - per-player ratings, goals, assists, cards, injuries, fitness cost
 *  - match stats (possession, shots, corners, cards)
 *
 * ─── The timeline ───────────────────────────────────────────────────────
 *
 * Events used to be emitted only for things that changed the scoreline or
 * the card count: a 1-0 produced four lines, three of which were furniture.
 * The replay screen therefore had nothing to play back.
 *
 * The stats are now computed BEFORE the timeline, and the timeline is
 * DERIVED FROM THEM — six shots on target and one goal means five saves to
 * narrate, and the feed adds up to the stat panel underneath it because both
 * come from the same numbers. Previously the two were generated independently
 * and openly disagreed: a match could show 9 shots and describe none of them.
 *
 * Home advantage: ~5-8% power boost, capped so it never overrides a much
 * stronger away side (gameplay-fair).
 */
import type { DBPlayer } from "@/lib/schema";
import {
  EMPTY_LINEUP,
  isAvailable,
  resolveLineup,
  type SavedLineup,
} from "@/lib/lineup";
import { DEFAULT_TACTICS, type Tactics } from "@/lib/tactics";
import { buildCommentary } from "./commentary";
import { lineExposure, teamPower, zoneEdge, type TeamPower } from "./power";

// ─── Types ────────────────────────────────────────────────────
export type MatchEventType =
  | "start"
  | "goal"
  | "chance"
  | "save"
  | "miss"
  | "corner"
  | "duel"
  | "card"
  | "sub"
  | "injury"
  | "analysis"
  | "half"
  | "end";

export type MatchEvent = {
  minute: number;
  icon: string;
  type: MatchEventType;
  text: string;
  scorerId?: string;
  assisterId?: string;
  cardPlayerId?: string;
  side?: "home" | "away";
  /**
   * How much this moment matters, 0-3. The replay reads it to decide how
   * long to hold on a line and whether to celebrate — a goal is a different
   * event from a throw-in and the playback should feel that.
   */
  weight?: number;
  /** Running score after this event, so the replay can show a live scoreboard. */
  scoreHome?: number;
  scoreAway?: number;
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
  /** Expected goals, rounded to one decimal — the honest version of the score. */
  xgHome: number;
  xgAway: number;
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
  /**
   * Fitness burned in this match. Pressing and a high tempo are paid for
   * here — without it the stamina cost printed on the tactic screen was a
   * label with nothing behind it.
   */
  fitnessDrain?: number;
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

/** Kept as an alias so existing call sites read naturally. */
export type TacticInput = Tactics;

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

/** Fill in any dial a caller left out, so the engine always sees seven. */
function normalizeTactics(t: Partial<Tactics> | undefined): Tactics {
  return { ...DEFAULT_TACTICS, ...(t ?? {}) };
}

// ─── Simulate ─────────────────────────────────────────────────
export function simulateMatch(input: SimInput): MatchResult {
  const rng = createRng(input.seed);
  const homeTacticsIn = normalizeTactics(input.homeTactics);
  const awayTacticsIn = normalizeTactics(input.awayTactics);

  const homeStarters = pickStarters(
    input.homeSquad,
    homeTacticsIn.formation,
    input.homeLineup ?? EMPTY_LINEUP,
  );
  const awayStarters = pickStarters(
    input.awaySquad,
    awayTacticsIn.formation,
    input.awayLineup ?? EMPTY_LINEUP,
  );

  // Referee deterministically picked from the seed so replays match. The
  // reference passes through to commentary + influences card frequency.
  const referee = REFEREES[(input.seed ?? 0) % REFEREES.length];
  const refStrict = referee.strictness;

  // Stadium boost: base 2.5 + 0.5 per level above 1 (so L5 = +4.5 home).
  const stadiumLevel = Math.max(1, Math.min(5, input.homeStadiumLevel ?? 1));
  const homeBoost = 2.5 + (stadiumLevel - 1) * 0.5;

  // Strict refs nudge both sides one tick down on the aggression dials. Effect
  // is small — it should reshape risk-taking, not flip results.
  const refShift = refStrict >= 4 ? -0.4 : refStrict <= 2 ? 0.3 : 0;
  const shift = (t: Tactics): Tactics => ({
    ...t,
    mentality: t.mentality + refShift,
    pressing: t.pressing + refShift,
    aggression: t.aggression + refShift,
  });
  const homeT = shift(homeTacticsIn);
  const awayT = shift(awayTacticsIn);

  const homePower = teamPower(homeStarters, homeT, homeBoost);
  const awayPower = teamPower(awayStarters, awayT, 0);

  /*
    ── Where the two shapes meet ──────────────────────────────────────────

    Both sides' strengths are now priced AGAINST EACH OTHER rather than in
    isolation, which is what makes the formation a decision:

      - midfield is contested, so committing more bodies there than the
        opponent is worth something. Five midfielders against three is the
        oldest tactical idea in football and the model was completely blind to
        it, because every unit score is a weighted mean and a mean does not
        care how many terms it has.
      - an attack is priced against the DEFENCE it is running at: three
        forwards against a back five is a different proposition from three
        against a back three.
      - the defensive line is priced against the opponent's PACE, which is
        what makes playing high a bet rather than a setting.

    Everything here is relative and symmetric, so no shape is strictly better
    than another — each one gives up somewhere in exchange for what it takes.
  */
  const homeMidEdge = zoneEdge(homePower.midWeight, awayPower.midWeight, 1.8);
  const awayMidEdge = -homeMidEdge;

  const homeAttack =
    homePower.attack + zoneEdge(homePower.attackWeight, awayPower.defWeight, 5.2);
  const awayAttack =
    awayPower.attack + zoneEdge(awayPower.attackWeight, homePower.defWeight, 5.2);

  /*
    The attack/defence overload is applied ONCE, to the attack.

    It was applied to both — the attacker gained `zoneEdge(myAttack,
    theirDefence)` and the defender gained `zoneEdge(theirDefence, myAttack)`,
    which is the same quantity with the sign flipped. Since every formation
    commits more bodies to defence than to attack (a back four plus a keeper
    against two or three forwards), that meant BOTH sides got a net defensive
    bonus and scoring collapsed: equal squads went from 2.24 goals a match to
    1.51, and two defensive setups produced a 57% draw rate.

    One term, on the side doing the attacking. The defence's own strength is
    already in `defense`, and how deep it sits is priced by lineExposure.
  */
  const homeDefense =
    homePower.defense - lineExposure(homePower, awayPower, homeT.defLine);
  const awayDefense =
    awayPower.defense - lineExposure(awayPower, homePower, awayT.defLine);

  const sameCityDerby =
    Boolean(input.homeCity) &&
    Boolean(input.awayCity) &&
    input.homeCity === input.awayCity;
  const stakesMultiplier = sameCityDerby ? 1.15 : 1.0;

  // Expected goals: attack against the opponent's defence, nudged by who
  // controls midfield. Divisors are deliberately large so a talent gap
  // shifts the odds rather than guaranteeing a rout — a 15-point power
  // advantage is worth about +0.6 xG, not +4.
  const midEdge =
    (homePower.midfield + homeMidEdge - (awayPower.midfield + awayMidEdge)) / 40;
  const baseHome = 1.68;
  const baseAway = 1.62;
  const homeXG =
    Math.min(
      4.2,
      Math.max(0.18, (homeAttack - awayDefense) / 24 + baseHome + midEdge),
    ) * stakesMultiplier;
  const awayXG =
    Math.min(
      4.2,
      Math.max(0.18, (awayAttack - homeDefense) / 24 + baseAway - midEdge),
    ) * stakesMultiplier;

  // Poisson realization, capped at 7 goals per side.
  const drawGoals = (lambda: number): number => {
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

  // ─── Stats first, timeline second ──────────────────────────
  // Both must describe the same match, so there is exactly one source for
  // "how many shots were there" and the feed narrates that number.
  const shotCount = (xg: number, score: number, volume: number) =>
    Math.max(score, Math.round((xg * 3.4 + 2 + rng() * 4) * volume));
  const shotsHome = shotCount(homeXG, homeScore, homePower.shotVolume);
  const shotsAway = shotCount(awayXG, awayScore, awayPower.shotVolume);
  const onTarget = (shots: number, score: number) =>
    Math.max(score, Math.min(shots, score + Math.round(rng() * 3 + shots * 0.22)));
  const shotsOnHome = onTarget(shotsHome, homeScore);
  const shotsOnAway = onTarget(shotsAway, awayScore);

  // Possession: midfield control plus what each side's passing style pulls.
  const homePoss = Math.round(
    50 +
      (homePower.midfield + homeMidEdge - (awayPower.midfield + awayMidEdge)) * 1.1 +
      (homePower.possessionPull - awayPower.possessionPull) * 0.5,
  );
  const possessionHome = Math.max(28, Math.min(72, homePoss));

  // Wide play produces corners; a narrow side wins fewer.
  const cornerCount = (shots: number, width: number) =>
    Math.max(0, Math.round(shots * 0.45 + (width - 2) * 0.8 + rng() * 2));
  const cornersHome = cornerCount(shotsHome, homeTacticsIn.width);
  const cornersAway = cornerCount(shotsAway, awayTacticsIn.width);

  // Cards scale with the referee AND with how hard each side is going in.
  const sideCards = (risk: number) =>
    Math.max(
      0,
      Math.min(5, Math.round(((refStrict - 1) / 2 + rng() * 1.6) * risk)),
    );
  const cardsHomeCount = sideCards(homePower.cardRisk);
  const cardsAwayCount = sideCards(awayPower.cardRisk);

  // ─── Who does what ─────────────────────────────────────────
  // Choose scorers biased to FWDs > MIDs > DEFs, weighted by `shooting` so a
  // 90-shooting striker scores far more often than a 65-shooting one.
  const pickScorer = (starters: DBPlayer[]): DBPlayer | undefined => {
    if (starters.length === 0) return undefined;
    const weighted = starters.flatMap((p) => {
      const posWeight =
        p.position === "FWD" ? 6 : p.position === "MID" ? 3 : p.position === "DEF" ? 1 : 0;
      const copies = Math.max(1, Math.round((posWeight * p.shooting) / 70));
      return Array(copies).fill(p) as DBPlayer[];
    });
    if (weighted.length === 0) return starters[0];
    return weighted[Math.floor(rng() * weighted.length)] ?? starters[0];
  };

  // Assisters favour high-passing midfielders; forwards assist less often.
  const pickAssister = (
    starters: DBPlayer[],
    excludeId: string,
  ): DBPlayer | undefined => {
    if (rng() < 0.25) return undefined; // solo goal
    const pool = starters.filter((p) => p.id !== excludeId && p.position !== "GK");
    if (pool.length === 0) return undefined;
    const weighted = pool.flatMap((p) => {
      const posWeight = p.position === "MID" ? 4 : p.position === "FWD" ? 2 : 1;
      const copies = Math.max(1, Math.round((posWeight * p.passing) / 70));
      return Array(copies).fill(p) as DBPlayer[];
    });
    if (weighted.length === 0) return undefined;
    return weighted[Math.floor(rng() * weighted.length)];
  };

  const keeperOf = (starters: DBPlayer[]) =>
    starters.find((p) => p.position === "GK");

  // Compute who's on the pitch for `side` at `minute`, applying every valid
  // sub up to that point.
  const computePoolAt = (side: "home" | "away", minute: number): DBPlayer[] => {
    const original = side === "home" ? homeStarters : awayStarters;
    const squad = side === "home" ? input.homeSquad : input.awaySquad;
    const plan =
      side === "home" ? (input.homeSubPlan ?? []) : (input.awaySubPlan ?? []);
    const pool = [...original];
    for (const sub of [...plan].sort((a, b) => a.minute - b.minute)) {
      if (sub.minute > minute) break;
      const inP = squad.find((p) => p.id === sub.inId);
      if (!inP) continue;
      // A sub plan is written days before kick-off. By match day the player
      // named may have been injured or banned.
      if (!isAvailable(inP)) continue;
      if (pool.some((p) => p.id === inP.id)) continue;
      const idx = pool.findIndex((p) => p.id === sub.outId);
      if (idx < 0) continue;
      pool[idx] = inP;
    }
    return pool;
  };

  // ─── Moment assembly ───────────────────────────────────────
  type Moment =
    | { minute: number; kind: "goal"; side: "home" | "away" }
    | { minute: number; kind: "save" | "miss" | "chance" | "corner" | "duel"; side: "home" | "away" }
    | { minute: number; kind: "card"; side: "home" | "away" }
    | { minute: number; kind: "injury"; side: "home" | "away" }
    | { minute: number; kind: "analysis" };

  const moments: Moment[] = [];
  const minuteIn = (lo: number, hi: number) =>
    Math.floor(lo + rng() * (hi - lo));

  // Goals, spread across the 90 with a light second-half bias.
  for (let i = 0; i < homeScore; i++)
    moments.push({ minute: minuteIn(3, 92), kind: "goal", side: "home" });
  for (let i = 0; i < awayScore; i++)
    moments.push({ minute: minuteIn(3, 92), kind: "goal", side: "away" });

  // Saves = shots on target that were not goals. Misses = the rest of the
  // shots. Narrate a readable subset rather than all of them: a feed with
  // fourteen identical "shot off target" lines is noise, not drama.
  const addMany = (
    n: number,
    kind: "save" | "miss" | "corner" | "duel",
    side: "home" | "away",
  ) => {
    for (let i = 0; i < n; i++)
      moments.push({ minute: minuteIn(2, 91), kind, side });
  };
  addMany(Math.min(4, shotsOnHome - homeScore), "save", "home");
  addMany(Math.min(4, shotsOnAway - awayScore), "save", "away");
  addMany(Math.min(3, shotsHome - shotsOnHome), "miss", "home");
  addMany(Math.min(3, shotsAway - shotsOnAway), "miss", "away");
  addMany(Math.min(2, cornersHome), "corner", "home");
  addMany(Math.min(2, cornersAway), "corner", "away");
  addMany(1 + Math.floor(rng() * 2), "duel", rng() < 0.5 ? "home" : "away");

  for (let i = 0; i < cardsHomeCount; i++)
    moments.push({ minute: minuteIn(8, 90), kind: "card", side: "home" });
  for (let i = 0; i < cardsAwayCount; i++)
    moments.push({ minute: minuteIn(8, 90), kind: "card", side: "away" });

  // Two tactical beats, one per half, so the feed has a pulse between events.
  moments.push({ minute: minuteIn(20, 38), kind: "analysis" });
  moments.push({ minute: minuteIn(55, 76), kind: "analysis" });

  // Injuries: rolled here so the moment appears in the feed at the minute it
  // happened rather than being a silent status change after full time.
  const injured: Array<{ player: DBPlayer; days: number }> = [];
  const rollInjury = (
    starters: DBPlayer[],
    physioTier: number,
    risk: number,
    side: "home" | "away",
  ) => {
    if (starters.length === 0) return;
    const incidenceScale = Math.max(0.1, 1 - physioTier * 0.18) * risk;
    const durationScale = Math.max(0.4, 1 - physioTier * 0.25);
    if (rng() >= 0.07 * incidenceScale) return;
    const p = starters[Math.floor(rng() * starters.length)];
    if (!p) return;
    injured.push({ player: p, days: Math.max(1, Math.ceil(rng() * 10 * durationScale)) });
    moments.push({ minute: minuteIn(15, 85), kind: "injury", side });
  };
  rollInjury(homeStarters, input.homePhysioTier ?? 0, homePower.injuryRisk, "home");
  rollInjury(awayStarters, input.awayPhysioTier ?? 0, awayPower.injuryRisk, "away");

  moments.sort((a, b) => a.minute - b.minute);

  // ─── Resolve moments into events ───────────────────────────
  type GoalRecord = {
    minute: number;
    side: "home" | "away";
    scorer: DBPlayer;
    assister?: DBPlayer;
  };
  type CardRecord = {
    minute: number;
    side: "home" | "away";
    player: DBPlayer;
    kind: "yellow" | "red";
  };
  const goalRecords: GoalRecord[] = [];
  const cardRecords: CardRecord[] = [];

  // Share of cards that are red. Real football sends someone off in roughly
  // one match in eight.
  const redChance = 0.012 + 0.006 * refStrict;

  const events: MatchEvent[] = [];
  events.push({
    minute: 0,
    icon: "🎬",
    type: "start",
    weight: 1,
    scoreHome: 0,
    scoreAway: 0,
    text: buildCommentary.kickoff({
      homeClubName: input.homeClubName,
      awayClubName: input.awayClubName,
      referee: referee.name,
      strictness: refStrict,
      derby: sameCityDerby,
      crowd: 50 + (stadiumLevel - 1) * 6 + ((input.homePrestige ?? 50) - 50) * 0.15,
    }),
  });

  let runningHome = 0;
  let runningAway = 0;
  let halfInserted = false;

  const clubName = (side: "home" | "away") =>
    side === "home" ? input.homeClubName : input.awayClubName;
  const tacticsOf = (side: "home" | "away") =>
    side === "home" ? homeTacticsIn : awayTacticsIn;

  /** How the goal arrived — read off the scoring side's own tactics. */
  const rollOrigin = (side: "home" | "away"): GoalCtxOrigin => {
    const t = tacticsOf(side);
    const table: Array<[GoalCtxOrigin, number]> = [
      ["cross", 0.1 + t.width * 0.05],
      ["long", 0.04 + t.passingStyle * 0.045],
      ["counter", 0.08 + (4 - t.mentality) * 0.025 + (4 - t.defLine) * 0.02],
      ["corner", 0.12],
      ["solo", 0.1],
      ["open", 0.28],
    ];
    const total = table.reduce((s, [, w]) => s + w, 0);
    let r = rng() * total;
    for (const [k, w] of table) {
      r -= w;
      if (r <= 0) return k;
    }
    return "open";
  };

  for (const m of moments) {
    // Half-time goes in at the right point in the narrative, not appended
    // after the loop — where it used to report the FULL-TIME score.
    if (!halfInserted && m.minute > 45) {
      events.push({
        minute: 45,
        icon: "⏸",
        type: "half",
        weight: 1,
        scoreHome: runningHome,
        scoreAway: runningAway,
        text: buildCommentary.halfTime({
          homeClubName: input.homeClubName,
          awayClubName: input.awayClubName,
          home: runningHome,
          away: runningAway,
        }),
      });
      halfInserted = true;
    }

    if (m.kind === "analysis") {
      const gap = homePower.midfield - awayPower.midfield;
      const mood =
        Math.abs(gap) >= 6 ? "dominant" : homeXG + awayXG >= 3.2 ? "open" : "tight";
      events.push({
        minute: m.minute,
        icon: "🧠",
        type: "analysis",
        weight: 0,
        scoreHome: runningHome,
        scoreAway: runningAway,
        text: buildCommentary.analysis(
          { mood, clubName: gap >= 0 ? input.homeClubName : input.awayClubName },
          rng,
        ),
      });
      continue;
    }

    const pool = computePoolAt(m.side, m.minute);
    if (pool.length === 0) continue;

    if (m.kind === "goal") {
      const scorer = pickScorer(pool);
      if (!scorer) continue;
      const assister = pickAssister(pool, scorer.id);
      if (m.side === "home") runningHome++;
      else runningAway++;
      goalRecords.push({ minute: m.minute, side: m.side, scorer, assister });

      const forSide = m.side === "home" ? runningHome : runningAway;
      const againstSide = m.side === "home" ? runningAway : runningHome;
      const state =
        forSide === 1 && againstSide === 0
          ? "opened"
          : forSide === againstSide
            ? "equalised"
            : forSide === againstSide + 1
              ? "ahead"
              : forSide > againstSide
                ? "extended"
                : "consolation";

      events.push({
        minute: m.minute,
        icon: "⚽",
        type: "goal",
        weight: 3,
        side: m.side,
        scorerId: scorer.id,
        assisterId: assister?.id,
        scoreHome: runningHome,
        scoreAway: runningAway,
        text: buildCommentary.goal(
          {
            scorer: scorer.name,
            assister: assister?.name,
            minute: m.minute,
            scoringClubName: clubName(m.side),
            concedingClubName: clubName(m.side === "home" ? "away" : "home"),
            runningHome,
            runningAway,
            derby: sameCityDerby,
            origin: rollOrigin(m.side),
            state,
          },
          rng,
        ),
      });
      continue;
    }

    if (m.kind === "card") {
      const eligible = pool.filter((p) => p.position !== "GK");
      if (eligible.length === 0) continue;
      // Hard tacklers are the ones who get booked: weight by how much of the
      // player's game is physical contact.
      const weighted = eligible.flatMap((p) => {
        const w = p.position === "DEF" ? 3 : p.position === "MID" ? 3 : 1;
        return Array(w).fill(p) as DBPlayer[];
      });
      const victim = weighted[Math.floor(rng() * weighted.length)];
      const kind: "yellow" | "red" = rng() < redChance ? "red" : "yellow";
      cardRecords.push({ minute: m.minute, side: m.side, player: victim, kind });
      events.push({
        minute: m.minute,
        icon: kind === "red" ? "🟥" : "🟨",
        type: "card",
        weight: kind === "red" ? 2 : 1,
        side: m.side,
        cardPlayerId: victim.id,
        scoreHome: runningHome,
        scoreAway: runningAway,
        text: buildCommentary.card(
          { player: victim.name, minute: m.minute, kind },
          rng,
        ),
      });
      continue;
    }

    if (m.kind === "injury") {
      const hurt = injured.find((i) =>
        pool.some((p) => p.id === i.player.id),
      );
      if (!hurt) continue;
      events.push({
        minute: m.minute,
        icon: "🩹",
        type: "injury",
        weight: 2,
        side: m.side,
        scoreHome: runningHome,
        scoreAway: runningAway,
        text: buildCommentary.injury({ player: hurt.player.name }, rng),
      });
      continue;
    }

    if (m.kind === "corner") {
      events.push({
        minute: m.minute,
        icon: "🚩",
        type: "corner",
        weight: 0,
        side: m.side,
        scoreHome: runningHome,
        scoreAway: runningAway,
        text: buildCommentary.corner({ clubName: clubName(m.side) }, rng),
      });
      continue;
    }

    if (m.kind === "duel") {
      const p = pool[Math.floor(rng() * pool.length)];
      events.push({
        minute: m.minute,
        icon: "⚔",
        type: "duel",
        weight: 0,
        side: m.side,
        scoreHome: runningHome,
        scoreAway: runningAway,
        text: buildCommentary.duel(
          { player: p.name, clubName: clubName(m.side) },
          rng,
        ),
      });
      continue;
    }

    // save / miss — the shots that did not go in.
    const shooter = pickScorer(pool);
    if (!shooter) continue;
    if (m.kind === "save") {
      const keeper = keeperOf(
        computePoolAt(m.side === "home" ? "away" : "home", m.minute),
      );
      events.push({
        minute: m.minute,
        icon: "🧤",
        type: "save",
        weight: 2,
        side: m.side,
        scoreHome: runningHome,
        scoreAway: runningAway,
        text: keeper
          ? buildCommentary.save({ player: shooter.name, keeper: keeper.name }, rng)
          : buildCommentary.chance(
              { player: shooter.name, clubName: clubName(m.side) },
              rng,
            ),
      });
    } else {
      events.push({
        minute: m.minute,
        icon: "↗",
        type: "miss",
        weight: 1,
        side: m.side,
        scoreHome: runningHome,
        scoreAway: runningAway,
        text: buildCommentary.miss(
          { player: shooter.name, clubName: clubName(m.side) },
          rng,
        ),
      });
    }
  }

  // Substitutions. Only the swaps that ACTUALLY happened are announced — the
  // previous version narrated every planned swap, including ones the engine
  // had rejected, so the report described a change that never took place.
  for (const side of ["home", "away"] as const) {
    const plan = side === "home" ? (input.homeSubPlan ?? []) : (input.awaySubPlan ?? []);
    const squad = side === "home" ? input.homeSquad : input.awaySquad;
    const pool = [...(side === "home" ? homeStarters : awayStarters)];
    for (const sub of [...plan].sort((a, b) => a.minute - b.minute)) {
      const subIn = squad.find((p) => p.id === sub.inId);
      const subOut = squad.find((p) => p.id === sub.outId);
      if (!subIn || !subOut) continue;
      if (!isAvailable(subIn)) continue;
      if (pool.some((p) => p.id === subIn.id)) continue;
      const idx = pool.findIndex((p) => p.id === sub.outId);
      if (idx < 0) continue;
      pool[idx] = subIn;
      events.push({
        minute: sub.minute,
        icon: "🔄",
        type: "sub",
        weight: 1,
        side,
        text: `Değişiklik: ${subOut.name} çıktı, ${subIn.name} oyuna girdi.`,
      });
    }
  }

  if (!halfInserted) {
    events.push({
      minute: 45,
      icon: "⏸",
      type: "half",
      weight: 1,
      scoreHome: runningHome,
      scoreAway: runningAway,
      text: buildCommentary.halfTime({
        homeClubName: input.homeClubName,
        awayClubName: input.awayClubName,
        home: goalRecords.filter((g) => g.side === "home" && g.minute <= 45).length,
        away: goalRecords.filter((g) => g.side === "away" && g.minute <= 45).length,
      }),
    });
  }

  events.sort((a, b) => a.minute - b.minute);
  events.push({
    minute: 90,
    icon: "🏁",
    type: "end",
    weight: 2,
    scoreHome: homeScore,
    scoreAway: awayScore,
    text: buildCommentary.fullTime({
      homeClubName: input.homeClubName,
      awayClubName: input.awayClubName,
      home: homeScore,
      away: awayScore,
    }),
  });

  const stats: MatchStats = {
    possessionHome,
    possessionAway: 100 - possessionHome,
    shotsHome,
    shotsAway,
    shotsOnHome,
    shotsOnAway,
    cornersHome,
    cornersAway,
    cardsHome: cardRecords.filter((c) => c.side === "home").length,
    cardsAway: cardRecords.filter((c) => c.side === "away").length,
    crowdEnergy: Math.round(
      Math.min(
        100,
        50 +
          (stadiumLevel - 1) * 6 +
          ((input.homePrestige ?? 50) - 50) * 0.15 +
          rng() * 25 +
          (homeScore > awayScore ? 8 : 0) +
          (sameCityDerby ? 10 : 0),
      ),
    ),
    refereeName: referee.name,
    refereeStrictness: refStrict,
    xgHome: Number(homeXG.toFixed(1)),
    xgAway: Number(awayXG.toFixed(1)),
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

  // ─── Per-player updates ────────────────────────────────────
  // Every patch is a DELTA applied on top of BASE_RATING, so a substitute who
  // scores is created at 6.5 + 1.1 rather than at 1.1.
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
      if (patch.fitnessDrain !== undefined) {
        existing.fitnessDrain = patch.fitnessDrain;
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
        fitnessDrain: patch.fitnessDrain,
      });
    }
  };

  // Starters carry the tactical stamina cost; a manager who presses at 4 all
  // season arrives at the weekend with a tired squad.
  const BASE_DRAIN = 10;
  for (const p of homeStarters) {
    upsert(p.id, {
      rating: (rng() - 0.5) * 0.6,
      fitnessDrain: Math.round(BASE_DRAIN + homePower.fatigue),
    });
  }
  for (const p of awayStarters) {
    upsert(p.id, {
      rating: (rng() - 0.5) * 0.6,
      fitnessDrain: Math.round(BASE_DRAIN + awayPower.fatigue),
    });
  }

  for (const g of goalRecords) {
    upsert(g.scorer.id, { rating: 1.1, goals: 1 });
    if (g.assister) upsert(g.assister.id, { rating: 0.55, assists: 1 });
  }
  for (const c of cardRecords) {
    upsert(c.player.id, {
      rating: c.kind === "red" ? -1.5 : -0.4,
      yellow: c.kind === "yellow" ? 1 : 0,
      red: c.kind === "red" ? 1 : 0,
    });
  }
  for (const i of injured) {
    upsert(i.player.id, { injuredMinutes: i.days * 24 * 60 });
  }

  // Keeper rating — hit per goal conceded, but a world-class keeper eats the
  // blame less than a rookie. A clean sheet is worth a bonus.
  const gkAdjust = (gk: DBPlayer | undefined, conceded: number) => {
    if (!gk) return;
    const gkFactor = Math.max(0.5, 1 - (gk.goalkeeping - 70) * 0.015);
    upsert(gk.id, {
      rating: -0.3 * conceded * gkFactor + (conceded === 0 ? 0.5 : 0.15),
    });
  };
  gkAdjust(keeperOf(homeStarters), awayScore);
  gkAdjust(keeperOf(awayStarters), homeScore);

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

type GoalCtxOrigin = "open" | "counter" | "corner" | "cross" | "solo" | "long";

/** Re-exported so the tactic screen can render the same numbers the engine uses. */
export type { TeamPower };
export { teamPower };
