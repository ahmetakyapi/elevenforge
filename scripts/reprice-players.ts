/**
 * Put every player in every league back on one price curve.
 *
 * Four separate copies of the valuation formula had drifted apart —
 * create-league.ts, seed.ts, scout.ts and youth.ts each had their own — and a
 * squad pack that shipped without `val`/`wage` left a fifth group priced at a
 * flat €1M. The result was a single league running several incompatible
 * scales at once: in "Akyapı Crew" the human club's 84-rated midfielder was
 * worth €32M while a bot's 85-rated 32-year-old was worth €213M.
 *
 * Every price in the game derives from market value — listing bands, offer
 * floors, the AI's bid ceiling, free-agent fees, distress sales, the squad
 * value on the dashboard. Mixed scales make all of them meaningless, and they
 * hand a free arbitrage to whichever side is priced low.
 *
 * `marketValueCents` in lib/economy.ts is now the only formula, and this
 * rewrites every existing row through it. Safe to re-run: it is a pure
 * function of (overall, potential, age), so a second pass is a no-op.
 *
 * Run:  npx tsx scripts/reprice-players.ts            (dry run, prints a diff)
 *       npx tsx scripts/reprice-players.ts --apply    (writes)
 */
import "./load-env";
import { eq, inArray } from "drizzle-orm";
import { db } from "../lib/db";
import {
  clubs,
  leagues,
  players,
  transferListings,
  transferOffers,
} from "../lib/schema";
import { marketValueCents, wageFromValueCents } from "../lib/economy";
import { assertLocalDatabase } from "./guard-remote-db";

const APPLY = process.argv.includes("--apply");

const eur = (cents: number) => {
  const e = Number(cents) / 100;
  if (e >= 1_000_000) return `€${(e / 1_000_000).toFixed(1)}M`;
  if (e >= 1_000) return `€${Math.round(e / 1_000)}K`;
  return `€${Math.round(e)}`;
};

async function main() {
  const rows = await db
    .select({
      id: players.id,
      name: players.name,
      overall: players.overall,
      potential: players.potential,
      age: players.age,
      value: players.marketValueCents,
      wage: players.wageCents,
      club: clubs.name,
      league: leagues.name,
    })
    .from(players)
    .leftJoin(clubs, eq(players.clubId, clubs.id))
    .leftJoin(leagues, eq(players.leagueId, leagues.id));

  type Change = { id: string; value: number; wage: number };
  const changes: Change[] = [];
  let biggestDrop = { name: "", from: 0, to: 0, delta: 0 };
  let biggestRise = { name: "", from: 0, to: 0, delta: 0 };

  for (const p of rows) {
    const value = marketValueCents(p.overall, p.potential, p.age);
    const wage = wageFromValueCents(value);
    const oldValue = Number(p.value);
    if (value === oldValue && wage === Number(p.wage)) continue;

    changes.push({ id: p.id, value, wage });
    const delta = value - oldValue;
    const label = `${p.name} (${p.club ?? "serbest"}, ovr ${p.overall} yaş ${p.age})`;
    if (delta < biggestDrop.delta) {
      biggestDrop = { name: label, from: oldValue, to: value, delta };
    }
    if (delta > biggestRise.delta) {
      biggestRise = { name: label, from: oldValue, to: value, delta };
    }
  }

  console.log(`${rows.length} oyuncu tarandı, ${changes.length} tanesi değişiyor.`);
  if (changes.length === 0) {
    console.log("✓ Tüm fiyatlar zaten tek eğride.");
    return;
  }
  if (biggestDrop.delta < 0) {
    console.log(
      `  en büyük düşüş: ${biggestDrop.name} ${eur(biggestDrop.from)} → ${eur(biggestDrop.to)}`,
    );
  }
  if (biggestRise.delta > 0) {
    console.log(
      `  en büyük artış: ${biggestRise.name} ${eur(biggestRise.from)} → ${eur(biggestRise.to)}`,
    );
  }

  if (!APPLY) {
    console.log("\n(kuru çalışma — yazmak için --apply ekleyin)");
    return;
  }
  // Repairing production is the point of this script, so it is expected to run
  // with ALLOW_REMOTE_WRITES=1 — but never by accident.
  assertLocalDatabase("reprice-players --apply");

  // One statement per distinct (value, wage) pair rather than one per player:
  // 1149 round trips to Neon is slow enough to time out, and the pairs collapse
  // heavily because value is a pure function of three small integers.
  const byPrice = new Map<string, { value: number; wage: number; ids: string[] }>();
  for (const c of changes) {
    const key = `${c.value}:${c.wage}`;
    const bucket = byPrice.get(key);
    if (bucket) bucket.ids.push(c.id);
    else byPrice.set(key, { value: c.value, wage: c.wage, ids: [c.id] });
  }

  let done = 0;
  for (const { value, wage, ids } of byPrice.values()) {
    await db
      .update(players)
      .set({ marketValueCents: value, wageCents: wage })
      .where(inArray(players.id, ids));
    done += ids.length;
  }
  console.log(`✓ ${done} oyuncu yeniden fiyatlandırıldı (${byPrice.size} sorgu).`);

  // Listings and open bids priced off the old scale are now nonsense — a
  // €200M ask on a player worth €27M will never sell, and the reverse is a
  // giveaway that the transfer-listing band check would no longer allow. Clear
  // both; the AI relists and re-bids on its next tick at the new values.
  const clearedListings = await db.delete(transferListings).returning();
  const clearedOffers = await db
    .delete(transferOffers)
    .where(eq(transferOffers.status, "pending"))
    .returning();
  console.log(
    `✓ ${clearedListings.length} ilan ve ${clearedOffers.length} bekleyen teklif temizlendi ` +
      `(botlar yeni fiyatlarla yeniden listeler).`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
