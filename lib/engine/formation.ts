/**
 * Formation parsing, split out of the match engine so the line-up resolver
 * and the UI can use it without importing the whole simulation (and without
 * a circular import, since the engine now depends on the resolver).
 *
 * Accepts classic formation strings ("4-3-3", "4-2-3-1", "5-3-2", …).
 * First number → DEF count. Last number → FWD count. All middle numbers
 * collapse into MID. Totals always add to 10 field players (+1 GK = 11).
 */
export function parseFormation(formation: string): {
  def: number;
  mid: number;
  fwd: number;
} {
  const parts = formation
    .split("-")
    .map((n) => parseInt(n, 10))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (parts.length < 2) return { def: 4, mid: 4, fwd: 2 };
  const def = parts[0];
  const fwd = parts[parts.length - 1];
  const mid = parts.slice(1, -1).reduce((a, b) => a + b, 0);
  const total = def + mid + fwd;
  if (total !== 10) return { def: 4, mid: 4, fwd: 2 };
  return { def, mid, fwd };
}
