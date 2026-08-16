import "./load-env";
import { simulateMatch } from "../lib/engine/match";
import { DEFAULT_TACTICS, type Tactics } from "../lib/tactics";
import { attributesFor } from "../lib/attributes";
import type { DBPlayer } from "../lib/schema";
import { parseFormation } from "../lib/engine/formation";

const POS: Record<string, DBPlayer["position"]> = {
  GK:"GK", CB:"DEF", LB:"DEF", RB:"DEF",
  CDM:"MID", CM:"MID", AM:"MID", LM:"MID", RM:"MID",
  LW:"FWD", RW:"FWD", ST:"FWD", CF:"FWD",
};

/**
 * A synthetic eleven of uniform quality that ACTUALLY FITS the shape.
 *
 * The first version hand-listed roles per formation, which quietly measured
 * the wrong thing: resolveLineup fills by POSITION need derived from the
 * formation string, so a 4-2-3-1 squad whose wingers were FWD-position had
 * four forwards competing for one shirt and two of them were fielded out of
 * position with the -12 penalty. The matrix was then reporting "does my test
 * squad happen to fit this formation", not "how do these two shapes meet".
 */
function squad(ovr: number, formation: string): DBPlayer[] {
  const shape: Record<string, string[]> = {
    "4-3-3": ["GK","LB","CB","CB","RB","CDM","CM","CM","LW","ST","RW"],
    "4-4-2": ["GK","LB","CB","CB","RB","LM","CM","CM","RM","ST","ST"],
    "3-5-2": ["GK","CB","CB","CB","LM","CDM","CM","CM","RM","ST","ST"],
    "5-3-2": ["GK","LB","CB","CB","CB","RB","CDM","CM","CM","ST","ST"],
    "4-2-3-1":["GK","LB","CB","CB","RB","CDM","CDM","LM","AM","RM","ST"],
    "4-1-4-1":["GK","LB","CB","CB","RB","CDM","LM","CM","CM","RM","ST"],
  };
  const roles = shape[formation];
  // Assert the shape matches what the resolver will ask for, so a typo in the
  // table above cannot silently reintroduce the bug this comment describes.
  const want = parseFormation(formation);
  const have = { GK: 0, DEF: 0, MID: 0, FWD: 0 } as Record<string, number>;
  for (const r of roles) have[POS[r]]++;
  if (have.DEF !== want.def || have.MID !== want.mid || have.FWD !== want.fwd) {
    throw new Error(
      `${formation}: squad is ${have.DEF}-${have.MID}-${have.FWD}, formation wants ${want.def}-${want.mid}-${want.fwd}`,
    );
  }
  return roles.map((role, i) => ({
    id: `${formation}-${ovr}-${i}`,
    role, position: POS[role], overall: ovr, potential: ovr,
    ...attributesFor(ovr, role, () => 0.5),
    morale: 3, fitness: 95, status: "active",
  }) as unknown as DBPlayer);
}

function run(
  homeOvr: number, awayOvr: number,
  homeF = "4-3-3", awayF = "4-3-3",
  homeT: Partial<Tactics> = {}, awayT: Partial<Tactics> = {},
  n = 4000, homeAdvantage = true,
) {
  let hw = 0, d = 0, aw = 0, hg = 0, ag = 0;
  for (let i = 0; i < n; i++) {
    const r = simulateMatch({
      homeClubId: "h", awayClubId: "a", homeClubName: "H", awayClubName: "A",
      homeSquad: squad(homeOvr, homeF), awaySquad: squad(awayOvr, awayF),
      homeTactics: { ...DEFAULT_TACTICS, ...homeT, formation: homeF },
      awayTactics: { ...DEFAULT_TACTICS, ...awayT, formation: awayF },
      homeStadiumLevel: homeAdvantage ? 3 : 1,
      seed: i * 7919 + 13,
    });
    hg += r.homeScore; ag += r.awayScore;
    if (r.homeScore > r.awayScore) hw++;
    else if (r.homeScore === r.awayScore) d++;
    else aw++;
  }
  const pct = (x: number) => ((x / n) * 100).toFixed(1);
  return { hw: pct(hw), d: pct(d), aw: pct(aw), hg: (hg / n).toFixed(2), ag: (ag / n).toFixed(2) };
}


/*
 * ─── Match-outcome calibration ──────────────────────────────────────────
 *
 * The other suites prove the game cannot be cheated. This one proves it is
 * worth playing: that who wins is decided by the squad, the shape and the
 * tactics, in roughly the proportions football decides them in.
 *
 * It exists because none of that was true and nothing would have said so.
 * Measured before this was written, on 4,000 simulations per cell:
 *
 *   - the entire formation matrix spanned 45.7% to 50.7% home wins. Picking a
 *     shape was worth less than a coin flip's worth of noise.
 *   - parking the bus versus going all-out moved the home win rate from 43.3%
 *     to 48.5%, and goals conceded from 0.90 to 0.82. Seven dials, one tenth
 *     of a goal between the extremes.
 *   - equal squads produced 2.24 goals a match and a 48/28/24 split.
 *
 * The root cause was that every unit score is a weighted MEAN, so committing
 * five players to midfield scored exactly the same as committing three. See
 * `zoneEdge` in lib/engine/power.ts.
 *
 * These bounds are deliberately WIDE. This is a balance test, not a snapshot:
 * it should survive tuning and fail on a regression that makes tactics stop
 * mattering, or makes one formation the answer, or turns the league into a
 * coin toss. Every threshold below is a statement about the game being
 * playable, not about a particular constant.
 */
let bad = 0;
const ok = (cond: boolean, msg: string) => {
  if (cond) console.log(`  ✓ ${msg}`);
  else {
    console.error(`  ✗ ${msg}`);
    bad++;
  }
};
const between = (v: number, lo: number, hi: number) => v >= lo && v <= hi;

const FORMS = ["4-3-3", "4-4-2", "3-5-2", "5-3-2", "4-2-3-1", "4-1-4-1"];

console.log("=== A league of equals still has a home advantage ===");
{
  const r = run(78, 78, "4-3-3", "4-3-3", {}, {}, 4000);
  const hw = Number(r.hw), d = Number(r.d), aw = Number(r.aw);
  const goals = Number(r.hg) + Number(r.ag);
  ok(between(hw, 36, 52), `home wins ${hw}% (real football ≈ 44%)`);
  ok(between(d, 18, 34), `draws ${d}% (≈ 26%)`);
  ok(between(aw, 22, 38), `away wins ${aw}% (≈ 30%)`);
  ok(between(goals, 2.1, 3.3), `${goals.toFixed(2)} goals a match (≈ 2.7)`);
}

console.log("\n=== The better squad wins more, and keeps winning more ===");
{
  const curve = [0, 3, 5, 8, 12].map((g) => ({
    gap: g,
    hw: Number(run(75 + g, 75, "4-3-3", "4-3-3", {}, {}, 3000).hw),
  }));
  console.log(
    "    " + curve.map((c) => `+${c.gap}:${c.hw}%`).join("  "),
  );
  ok(
    curve.every((c, i) => i === 0 || c.hw > curve[i - 1].hw),
    "win rate rises with every step of the rating gap",
  );
  const eight = curve.find((c) => c.gap === 8)!.hw;
  ok(
    between(eight, 58, 80),
    `an eight-point favourite wins ${eight}% — clearly favoured, not certain`,
  );
}

console.log("\n=== Tactics change the match, not just the label ===");
{
  const neutral = run(78, 78, "4-3-3", "4-3-3", {}, {}, 3000);
  const attack = run(78, 78, "4-3-3", "4-3-3",
    { mentality: 4, pressing: 4, tempo: 4, defLine: 4 }, {}, 3000);
  const bus = run(78, 78, "4-3-3", "4-3-3",
    { mentality: 0, pressing: 0, tempo: 1, defLine: 0, aggression: 3 }, {}, 3000);
  console.log(
    `    neutral ${neutral.hw}% (${neutral.hg}-${neutral.ag}) · ` +
      `attack ${attack.hw}% (${attack.hg}-${attack.ag}) · ` +
      `bus ${bus.hw}% (${bus.hg}-${bus.ag})`,
  );
  ok(
    Number(attack.hw) - Number(bus.hw) >= 12,
    `the two extremes are ${(Number(attack.hw) - Number(bus.hw)).toFixed(1)} points apart`,
  );
  ok(
    Number(attack.hg) > Number(neutral.hg) &&
      Number(bus.hg) < Number(neutral.hg),
    `attacking scores more (${attack.hg} > ${neutral.hg}) and the bus scores less (${bus.hg})`,
  );
  ok(
    Number(bus.ag) < Number(neutral.ag),
    `and the bus concedes less (${bus.ag} < ${neutral.ag}) — the trade is real`,
  );
}

console.log("\n=== Formation is a decision, and has no right answer ===");
{
  const cell: Record<string, Record<string, number>> = {};
  for (const hf of FORMS) {
    cell[hf] = {};
    for (const af of FORMS) {
      cell[hf][af] = Number(run(78, 78, hf, af, {}, {}, 1200).hw);
    }
  }
  for (const hf of FORMS) {
    console.log(
      `    ${hf.padEnd(8)}` +
        FORMS.map((af) => `${af}:${String(cell[hf][af]).padStart(5)}`).join(" "),
    );
  }
  const all = FORMS.flatMap((hf) => FORMS.map((af) => cell[hf][af]));
  const spread = Math.max(...all) - Math.min(...all);
  ok(spread >= 6, `the matrix spans ${spread.toFixed(1)} points — the shape matters`);
  ok(spread <= 22, `but only ${spread.toFixed(1)} points — no shape hard-counters another`);

  /*
    The important one. A formation that beats every other formation is not a
    decision, it is the answer, and everyone plays it by week three. So every
    shape must lose ground to at least one other: its worst matchup has to sit
    below the neutral mirror baseline.
  */
  const baseline = cell["4-3-3"]["4-3-3"];
  const dominant = FORMS.filter((hf) =>
    FORMS.every((af) => cell[hf][af] >= baseline),
  );
  ok(
    dominant.length === 0,
    dominant.length === 0
      ? "no formation is favoured against the whole field"
      : `dominant formation(s): ${dominant.join(", ")}`,
  );
}

console.log(bad === 0 ? "\n✅ BALANCE CHECKS PASS" : `\n✗ ${bad} VIOLATIONS`);
process.exit(bad === 0 ? 0 : 1);
