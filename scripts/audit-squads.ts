import { SQUAD_PACKS } from "../lib/squad-packs";

const errs: string[] = [];
const warns: string[] = [];

for (const sp of SQUAD_PACKS) {
  const c = sp.club.name;
  const players = sp.players;
  const total = players.length;
  const gks = players.filter((p) => p.pos === "GK").length;
  const defs = players.filter((p) => p.pos === "DEF").length;
  const mids = players.filter((p) => p.pos === "MID").length;
  const fwds = players.filter((p) => p.pos === "FWD").length;

  if (total < 18) errs.push(`${c}: only ${total} players (need ≥18)`);
  if (gks < 2) errs.push(`${c}: only ${gks} GKs (need ≥2)`);
  if (defs < 6) errs.push(`${c}: only ${defs} DEFs (need ≥6)`);
  if (mids < 6) errs.push(`${c}: only ${mids} MIDs (need ≥6)`);
  if (fwds < 3) errs.push(`${c}: only ${fwds} FWDs (need ≥3)`);

  const roles = new Set(players.map((p) => p.role));
  const need = ["GK", "CB", "LB", "RB", "CDM", "CM", "ST"];
  for (const r of need) {
    if (!roles.has(r)) warns.push(`${c}: no player with role ${r}`);
  }
  const hasWide = players.some((p) => ["LW", "RW", "AM"].includes(p.role));
  if (!hasWide) warns.push(`${c}: no LW/RW/AM`);

  const nums = players.map((p) => p.num);
  const dupNums = nums.filter((n, i) => nums.indexOf(n) !== i);
  if (dupNums.length) errs.push(`${c}: duplicate jersey numbers ${[...new Set(dupNums)].join(",")}`);

  const names = players.map((p) => p.n);
  const dupNames = names.filter((n, i) => names.indexOf(n) !== i);
  if (dupNames.length) errs.push(`${c}: duplicate name ${[...new Set(dupNames)].join(",")}`);

  const ovrAvg = Math.round(players.reduce((s, p) => s + p.ovr, 0) / total);
  console.log(`  ${c.padEnd(20)} total=${String(total).padStart(2)} GK=${gks} DEF=${String(defs).padStart(2)} MID=${String(mids).padStart(2)} FWD=${fwds}  ovrAvg=${ovrAvg}`);
}

const seen: Record<string, string[]> = {};
for (const sp of SQUAD_PACKS) {
  for (const p of sp.players) {
    seen[p.n] = seen[p.n] ?? [];
    seen[p.n].push(sp.club.name);
  }
}
for (const [n, clubs] of Object.entries(seen)) {
  if (clubs.length > 1) errs.push(`Player "${n}" is on multiple clubs: ${clubs.join(", ")}`);
}

console.log("\n────── ERRORS ──────");
for (const e of errs) console.log("  X " + e);
console.log("\n────── WARNINGS ──────");
for (const w of warns) console.log("  ! " + w);
console.log(`\n${errs.length} errors / ${warns.length} warnings`);
