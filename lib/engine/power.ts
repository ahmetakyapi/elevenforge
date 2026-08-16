/**
 * How strong is this eleven, in each phase of play.
 *
 * Split out of match.ts so the tactic screen can show the manager the same
 * numbers the simulation will use. A tactics screen that cannot tell you what
 * your tactics did is a form filled in blind.
 *
 * ─── What changed, and why ──────────────────────────────────────────────
 *
 * The previous model bucketed the eleven into GK/DEF/MID/FWD and averaged.
 * Every midfielder was the same midfielder: a ball-winning CDM and a
 * goal-scoring winger both landed in `mids` and both were scored on
 * `passing*0.5 + physical*0.2 + pace*0.15 + overall*0.15`. Three consequences,
 * all of them things a manager could see and none of them things he could act
 * on:
 *
 *   - A wing pair with 88 pace and 82 shooting added nothing to the attack.
 *     They were midfielders. 4-3-3 with two flying wingers scored the same as
 *     4-3-3 with two holding midfielders.
 *   - A CDM contributed nothing to the defence he exists to protect.
 *   - Full-backs were pure defenders, so overlapping full-backs — the single
 *     most common attacking idea in modern football — could not be expressed.
 *
 * So the unit scores are now built from the ROLE each player actually holds,
 * with a weight per phase. A CDM is 85% midfield and 45% defence; a winger is
 * 80% attack; a full-back is three-quarters defender and a quarter attacker.
 * The result is still a 0-99-scale average, so the xG divisors in match.ts
 * keep their meaning — this makes the same scale read the squad correctly, it
 * does not inflate it.
 */
import type { DBPlayer } from "@/lib/schema";
import type { Tactics } from "@/lib/tactics";

/**
 * The fields the power model actually reads.
 *
 * Narrower than DBPlayer on purpose: the tactic screen wants to show the
 * manager the same attack/midfield/defence numbers the simulation will use,
 * and it holds view-model players, not database rows. Typing this as DBPlayer
 * would have forced a cast at the call site — which is how the UI ends up
 * showing a number that quietly stops matching the engine.
 */
export type PowerPlayer = Pick<
  DBPlayer,
  | "position"
  | "role"
  | "pace"
  | "shooting"
  | "passing"
  | "defending"
  | "physical"
  | "goalkeeping"
  | "overall"
  | "morale"
  | "fitness"
>;

/**
 * A role's share of each phase, and how wide it plays.
 *
 * `wide` is 0 (plays through the middle) to 1 (plays on the touchline). The
 * width dial reads it: go wide and your wingers and full-backs carry more of
 * the attack; go narrow and your CM/AM/ST do.
 */
type RoleWeight = { a: number; m: number; d: number; wide: number };

const ROLE_WEIGHTS: Record<string, RoleWeight> = {
  GK: { a: 0.0, m: 0.04, d: 0.1, wide: 0 },
  CB: { a: 0.03, m: 0.1, d: 1.0, wide: 0.1 },
  LB: { a: 0.2, m: 0.24, d: 0.74, wide: 0.95 },
  RB: { a: 0.2, m: 0.24, d: 0.74, wide: 0.95 },
  CDM: { a: 0.1, m: 0.85, d: 0.46, wide: 0.15 },
  CM: { a: 0.3, m: 1.0, d: 0.26, wide: 0.2 },
  LM: { a: 0.45, m: 0.7, d: 0.24, wide: 0.9 },
  RM: { a: 0.45, m: 0.7, d: 0.24, wide: 0.9 },
  AM: { a: 0.6, m: 0.78, d: 0.07, wide: 0.15 },
  LW: { a: 0.82, m: 0.34, d: 0.08, wide: 0.95 },
  RW: { a: 0.82, m: 0.34, d: 0.08, wide: 0.95 },
  CF: { a: 0.92, m: 0.3, d: 0.04, wide: 0.2 },
  ST: { a: 1.0, m: 0.13, d: 0.03, wide: 0.1 },
};

/** A player whose `role` is unknown still has a position group. */
const POSITION_FALLBACK: Record<PowerPlayer["position"], RoleWeight> = {
  GK: ROLE_WEIGHTS.GK,
  DEF: ROLE_WEIGHTS.CB,
  MID: ROLE_WEIGHTS.CM,
  FWD: ROLE_WEIGHTS.ST,
};

function weightsFor(p: PowerPlayer): RoleWeight {
  return ROLE_WEIGHTS[p.role] ?? POSITION_FALLBACK[p.position];
}

// ─── Per-player quality in each phase ───────────────────────────────────
// Same idea as before — read the attribute the job actually needs — but now
// applied per player rather than per line, so the mix within a line matters.

const attackQuality = (p: PowerPlayer) =>
  p.shooting * 0.44 + p.pace * 0.21 + p.passing * 0.13 + p.physical * 0.08 + p.overall * 0.14;

const midfieldQuality = (p: PowerPlayer) =>
  p.passing * 0.44 + p.physical * 0.18 + p.pace * 0.14 + p.defending * 0.1 + p.overall * 0.14;

const defenceQuality = (p: PowerPlayer) =>
  p.defending * 0.48 + p.physical * 0.22 + p.pace * 0.13 + p.overall * 0.17;

export type TeamPower = {
  attack: number;
  midfield: number;
  defense: number;
  overall: number;
  /**
   * How fast the players who run in behind actually are. Read by the
   * OPPONENT's defensive line: a high line against this number is the bet
   * that dial is asking you to make.
   */
  attackPace: number;
  /** How fast the back line is — what lets it get away with playing high. */
  defencePace: number;
  /** Percentage points of possession this setup pulls, before opposition. */
  possessionPull: number;
  /** Multiplier on shot volume. */
  shotVolume: number;
  /** Multiplier on card frequency for this side. */
  cardRisk: number;
  /** Multiplier on injury chance for this side. */
  injuryRisk: number;
  /** Extra fitness burned per player, on top of the base match cost. */
  fatigue: number;

  /*
    How many bodies this shape commits to each zone.

    These are the summed role weights, and they are what makes a FORMATION do
    something. Every unit score above is a weighted MEAN, which is right for
    "how good is my midfield" and completely blind to "how many midfielders do
    I have" — so a 3-5-2's five midfielders scored exactly the same as a
    4-3-3's three, and picking a shape changed nothing but a couple of
    additive constants. Measured across the six formations, the entire
    matchup matrix spanned 45.7% to 50.7% home wins: noise.

    The caller compares these against the OPPONENT's, because numerical
    superiority is inherently relative — five in midfield is an overload
    against three and an even game against five.
  */
  attackWeight: number;
  midWeight: number;
  defWeight: number;
};

/**
 * The eleven's power, given its tactics.
 *
 * `homeBoost` is the stadium/crowd advantage, already sized by the caller.
 */
export function teamPower(
  starters: PowerPlayer[],
  tactics: Tactics,
  homeBoost: number,
): TeamPower {
  // An empty line means nobody is playing there — it must be *terrible*, not
  // league-average. 70 used to mean a club with no defenders defended like a
  // mid-table side, which let drained bot squads stay competitive.
  const EMPTY_LINE = 30;

  const directness = (tactics.passingStyle - 2) / 2; // −1 short … +1 direct
  const widthPull = (tactics.width - 2) / 2; // −1 narrow … +1 wide

  // The width dial re-weights who carries the attack. A wide role gains as
  // the dial goes up; a central role gains as it comes down. ±40% at the
  // extremes — enough to make owning good wingers a reason to play wide,
  // not so much that the dial decides matches on its own.
  const widthFactor = (w: RoleWeight) => 1 + widthPull * (w.wide - 0.5) * 0.8;

  let aW = 0, aSum = 0;
  let mW = 0, mSum = 0;
  let dW = 0, dSum = 0;
  let paceW = 0, paceSum = 0;
  let defPaceW = 0, defPaceSum = 0;
  let moraleSum = 0;
  let fitSum = 0;
  let gk: PowerPlayer | undefined;

  for (const p of starters) {
    const w = weightsFor(p);
    if (p.position === "GK" && !gk) gk = p;

    const aw = w.a * widthFactor(w);
    aW += aw;
    aSum += aw * attackQuality(p);

    mW += w.m;
    mSum += w.m * midfieldQuality(p);

    dW += w.d;
    dSum += w.d * defenceQuality(p);

    // Who runs in behind: attacking weight is exactly the right lens.
    paceW += w.a;
    paceSum += w.a * p.pace;

    // Who has to turn and chase: the defensive weight, minus the keeper, who
    // is not the one being run past.
    if (p.position !== "GK") {
      defPaceW += w.d;
      defPaceSum += w.d * p.pace;
    }

    moraleSum += p.morale;
    fitSum += p.fitness;
  }

  const attackCore = aW > 0 ? aSum / aW : EMPTY_LINE;
  const midCore = mW > 0 ? mSum / mW : EMPTY_LINE;
  const defCore = dW > 0 ? dSum / dW : EMPTY_LINE;
  const attackPace = paceW > 0 ? paceSum / paceW : 50;
  const defencePace = defPaceW > 0 ? defPaceSum / defPaceW : 50;

  // Playing without a keeper is a disaster, not a league-average performance.
  const gkPwr = gk ? gk.goalkeeping * 0.75 + gk.overall * 0.25 : EMPTY_LINE;

  const avgMorale = starters.length === 0 ? 3 : moraleSum / starters.length;
  const moraleBoost = (avgMorale - 3) * 1.5;

  const avgFit = starters.length === 0 ? 90 : fitSum / starters.length;
  const fitPenalty = avgFit < 75 ? (75 - avgFit) * 0.05 : 0;

  // Fielding fewer than eleven is a real handicap — each empty shirt costs
  // the whole side, not just the line it came from.
  const shortfall = Math.max(0, 11 - starters.length) * 2.5;

  /*
    ── The dials are worth about three times what they were ───────────────

    These were ±1.2, ±0.9, ±0.4. The unit scores they modify sit in the 60-90
    range and the xG formula divides the attack-minus-defence difference by
    24, so the entire seven-dial spread moved a match by under a tenth of a
    goal. Measured: parking the bus versus going all-out changed the home win
    rate from 43.3% to 48.5% and the goals conceded from 0.90 to 0.82. A
    manager could set every dial to its worst value and barely notice.

    A tactical choice should be worth roughly what a few rating points are
    worth, so that reading the opponent correctly can beat being slightly
    better — and getting it wrong can lose you a match you should have won.
    That is the entire reason the screen exists.
  */
  const mentalityBoost = (tactics.mentality - 2) * 3.4;
  const pressingBoost = (tactics.pressing - 2) * 2.6;
  const tempoBoost = (tactics.tempo - 2) * 1.4;
  // A high line squeezes the pitch: your midfield plays in their half. What
  // it costs is applied by the caller, because the cost depends entirely on
  // how fast the opponent's forwards are.
  const lineBoost = (tactics.defLine - 2) * 3.0;
  const aggressionBoost = (tactics.aggression - 2) * 2.8;

  /*
    THE PASSING DECISION.

    Short passing routes the attack through midfield; direct passing goes
    over it and asks the forwards to run. So the blend that builds `attack`
    is what the dial moves — the midfield's share of it, against the raw pace
    of the men in front.

    This is what makes the dial two-sided instead of a straight upgrade: with
    a strong midfield and slow forwards, short is worth several points; with
    a weak midfield and a flying front three, direct is. The manager who
    reads his own squad correctly is rewarded, which is the whole point.
  */
  const midShare = Math.max(0.08, 0.25 - directness * 0.15);
  const paceShare = Math.max(0, directness) * 0.14;
  const coreShare = 1 - midShare - paceShare;

  const attack =
    attackCore * coreShare +
    midCore * midShare +
    attackPace * paceShare +
    mentalityBoost +
    moraleBoost +
    homeBoost * 0.6 -
    fitPenalty -
    shortfall;

  const midfield =
    midCore +
    pressingBoost +
    tempoBoost +
    lineBoost +
    // Going direct means conceding the midfield; you gave up on winning it.
    -Math.max(0, directness) * 6.5 +
    moraleBoost * 0.5 +
    homeBoost * 0.4 -
    fitPenalty -
    shortfall;

  const defense =
    defCore * 0.7 +
    gkPwr * 0.3 +
    aggressionBoost -
    mentalityBoost * 0.5 +
    moraleBoost * 0.5 +
    homeBoost * 0.4 -
    fitPenalty -
    shortfall;

  const overall = attack * 0.4 + midfield * 0.3 + defense * 0.3;

  return {
    attack,
    midfield,
    defense,
    overall,
    attackPace,
    defencePace,
    // Short passing keeps the ball; a high tempo gives it away faster.
    possessionPull: -directness * 6 - (tactics.tempo - 2) * 1.2 + (tactics.pressing - 2) * 1.4,
    shotVolume: 1 + (tactics.tempo - 2) * 0.09 + (tactics.mentality - 2) * 0.07,
    cardRisk: Math.max(0.3, 1 + (tactics.aggression - 2) * 0.38 + (tactics.pressing - 2) * 0.1),
    injuryRisk: Math.max(0.4, 1 + (tactics.aggression - 2) * 0.22),
    fatigue:
      Math.max(0, tactics.pressing - 2) * 1.6 +
      Math.max(0, tactics.tempo - 2) * 1.3 +
      Math.max(0, tactics.defLine - 2) * 0.6,
    attackWeight: aW,
    midWeight: mW,
    defWeight: dW,
  };
}

/**
 * What a high defensive line costs against this particular opponent.
 *
 * Returned in defence points, to be subtracted by the caller. Deep lines
 * return a small negative — sitting back genuinely does protect you against
 * pace, which is why "park the bus against the fast team" has to be a real
 * option for it to be a real decision.
 */
/**
 * What committing more bodies to a zone than the opponent is worth.
 *
 * Returned in power points, to be added by the caller. This is the entire
 * mechanical content of choosing a formation: five midfielders against three
 * is an overload, three at the back against two strikers is a spare man, and
 * a lone striker against a back five is a man on an island.
 *
 * Deliberately sub-linear. A straight multiple would make 5-3-2 versus 4-3-3
 * a rout rather than an advantage, and the shape you pick should tilt a match
 * rather than decide it — the players on the pitch still have to be good
 * enough to use the extra man.
 */
export function zoneEdge(mine: number, theirs: number, scale = 4.6): number {
  const diff = mine - theirs;
  return Math.sign(diff) * Math.sqrt(Math.abs(diff)) * scale;
}

export function lineExposure(mine: TeamPower, theirs: TeamPower, defLine: number): number {
  const paceGap = theirs.attackPace - mine.defencePace;
  const lineHeight = defLine - 2; // −2 deep … +2 high
  if (lineHeight <= 0) {
    /*
      Dropping deep takes the space away.

      Two parts, and the first one used to be missing. The pace-dependent term
      is the interesting half — sitting back is worth most against a fast
      front line — but on its own it meant that against an averagely-quick
      opponent a low block bought almost nothing. Measured: parking the bus
      conceded 0.58 goals against a neutral setup's 0.59, while giving up half
      the attack. That is not a defensive option, it is a worse setting.

      So a deep line also carries a flat solidity term. It is smaller than the
      attacking output it costs, which is exactly the trade "park the bus"
      should be: you will concede less and you will probably not win.
    */
    const depth = Math.abs(lineHeight);
    const flat = depth * 2.6;
    const versusPace = Math.min(4, Math.max(0, paceGap) * 0.22) * depth * 0.6;
    return -(flat + versusPace);
  }
  return lineHeight * Math.max(-3, paceGap) * 0.55;
}
