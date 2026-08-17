/**
 * Bring every club's balance onto the current economy.
 *
 * Wages, contracts and bank interest were removed and the season budget model
 * replaced them (see lib/economy.ts). Leagues that were mid-season when that
 * shipped are still carrying balances the old economy produced: measured on
 * production, 122 clubs held €13.76bn against a €10.57bn target, spread from
 * €6M to €409M — a club at either end is playing a different game from a club
 * in the middle, and neither of them is playing the one the numbers are now
 * balanced for.
 *
 * This sets every club to the budget its prestige earns it, which is exactly
 * what the next season roll would do. It runs mid-season only as a one-off
 * correction; after that the roll handles it.
 *
 * WHAT IT DOES NOT TOUCH:
 *   - staff. Every club paid a hire fee under the old rules, and taking the
 *     staff away mid-season would be charging them for a change they did not
 *     make. Staff contracts end at the roll, which is the new rule, and that
 *     is when the choice becomes live.
 *   - squads, listings, offers, bids. Player values are computed from ratings
 *     and never depended on the wage model, so nothing is mispriced.
 *
 * Writes go through lib/money.ts like every other balance change, so each one
 * lands in the ledger and the Finans page can account for it.
 *
 * Usage:
 *   npx tsx scripts/normalize-economy.ts            # dry run, prints the diff
 *   ALLOW_REMOTE_WRITES=1 npx tsx scripts/normalize-economy.ts --apply
 */
import "./load-env";
import { eq } from "drizzle-orm";
import { db } from "./../lib/db";
import { seasonBudgetCents } from "../lib/economy";
import { resetClubBalance } from "../lib/money";
import { clubs, leagues } from "../lib/schema";

const APPLY = process.argv.includes("--apply");
const M = (cents: number) => `€${(cents / 100 / 1e6).toFixed(1)}M`;

async function main() {
  if (APPLY && process.env.ALLOW_REMOTE_WRITES !== "1") {
    console.error(
      "Refusing to write. Re-run with ALLOW_REMOTE_WRITES=1 if you mean it.",
    );
    process.exit(1);
  }

  const leagueRows = await db.select().from(leagues);
  const clubRows = await db.select().from(clubs);
  const leagueName = new Map(leagueRows.map((l) => [l.id, l.name]));

  let totalBefore = 0;
  let totalAfter = 0;
  const moves: Array<{ name: string; league: string; from: number; to: number }> = [];
  for (const c of clubRows) {
    const from = Number(c.balanceCents);
    const to = seasonBudgetCents(c.prestige);
    totalBefore += from;
    totalAfter += to;
    if (from !== to) {
      moves.push({
        name: c.name,
        league: leagueName.get(c.leagueId) ?? "?",
        from,
        to,
      });
    }
  }

  moves.sort((a, b) => a.from - b.from);
  console.log(`${clubRows.length} kulüp · ${moves.length} tanesi değişecek\n`);
  for (const m of [...moves.slice(0, 5), ...moves.slice(-5)]) {
    const d = m.to - m.from;
    console.log(
      `  ${m.name.padEnd(22)} ${m.league.padEnd(18)} ${M(m.from).padStart(9)} → ${M(m.to).padStart(9)}  (${d > 0 ? "+" : ""}${M(d)})`,
    );
  }
  console.log(
    `\n  toplam ${M(totalBefore)} → ${M(totalAfter)}  (${M(totalAfter - totalBefore)})`,
  );

  if (!APPLY) {
    console.log("\n(kuru çalışma — uygulamak için --apply)");
    return;
  }

  let done = 0;
  for (const c of clubRows) {
    const to = seasonBudgetCents(c.prestige);
    if (Number(c.balanceCents) === to) continue;
    await resetClubBalance(c.id, to);
    done++;
  }
  console.log(`\n✓ ${done} kulübün bakiyesi güncellendi (hepsi deftere işlendi).`);

  // Re-read, so the confirmation is what the database says rather than what
  // this script believes it wrote.
  const after = await db.select({ id: clubs.id, balanceCents: clubs.balanceCents, prestige: clubs.prestige }).from(clubs);
  const wrong = after.filter(
    (c) => Number(c.balanceCents) !== seasonBudgetCents(c.prestige),
  );
  console.log(
    wrong.length === 0
      ? "✓ doğrulandı: her kulüp prestijinin bütçesinde."
      : `✗ ${wrong.length} kulüp hâlâ hedefin dışında.`,
  );
  if (wrong.length > 0) process.exit(1);
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
