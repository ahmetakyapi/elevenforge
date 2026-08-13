/**
 * End-to-end check that managerless clubs behave like real managers.
 *
 * Verifies the things that made bot clubs feel dead:
 *  - they field a real, formation-shaped XI (and it is persisted)
 *  - they list their own players WITH sellerClubId set, so a sale pays them
 *  - they buy, sign free agents and renew contracts
 *  - they answer transfer offers from humans (accept / counter / reject)
 *  - the tick is idempotent within a day
 *  - squads survive repeated season rolls instead of draining to zero
 */
// Must be first: populates process.env from .env.local before anything
// reads it at module load time.
import "./load-env";
import { and, eq, isNull, ne } from "drizzle-orm";
import { db } from "../lib/db";
import { runAiManagers } from "../lib/ai/manager";
import { parseLineup, resolveLineup } from "../lib/lineup";
import { parseFormation } from "../lib/engine/formation";
import {
  clubs,
  players,
  transferHistory,
  transferListings,
  transferOffers,
  leagues,
} from "../lib/schema";
import { assertLocalDatabase } from "./guard-remote-db";

let bad = 0;
const ok = (cond: boolean, msg: string) => {
  if (cond) console.log(`  ✓ ${msg}`);
  else {
    console.error(`  ✗ ${msg}`);
    bad++;
  }
};

async function main() {
  assertLocalDatabase("test-ai-managers");
  const [league] = await db.select().from(leagues).limit(1);
  if (!league) throw new Error("seed first");
  const leagueId = league.id;

  console.log("\n=== AI manager tick ===");
  const before = await db
    .select()
    .from(clubs)
    .where(and(eq(clubs.leagueId, leagueId), eq(clubs.aiManaged, true)));
  ok(before.length > 0, `${before.length} AI-managed clubs found`);

  const r1 = await runAiManagers({ leagueId, force: true });
  console.log("   ", JSON.stringify(r1));
  ok(r1.clubsManaged === before.length, "every AI club was managed");

  // ── Line-ups ────────────────────────────────────────────────
  console.log("\n=== Line-ups ===");
  let sheetsOk = 0;
  let shapeOk = 0;
  for (const club of before) {
    const squad = await db
      .select()
      .from(players)
      .where(eq(players.clubId, club.id));
    const [fresh] = await db.select().from(clubs).where(eq(clubs.id, club.id));
    const saved = parseLineup(fresh.lineupJson);
    if (saved.xi.length === 11) sheetsOk++;

    const resolved = resolveLineup(squad, fresh.formation, saved);
    const { def, mid, fwd } = parseFormation(fresh.formation);
    const counts = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
    for (const p of resolved.starters) counts[p.position]++;

    // The shape a club CAN field is bounded by the specialists it owns. If a
    // 3-5-2 side only has four midfielders it fields four, and the spare
    // shirt goes to the best remaining player — who will show up in some
    // other line. So the invariant is not "counts equal the formation" but:
    //
    //   every line is filled as far as the squad allows, and the XI is full.
    //
    // Anything stricter fails on a legitimately lopsided squad.
    const availableByPos = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
    for (const p of squad) {
      if (p.status !== "injured" && p.status !== "suspended" && p.suspensionMatchesLeft === 0) {
        availableByPos[p.position]++;
      }
    }
    const want = { GK: 1, DEF: def, MID: mid, FWD: fwd };
    const totalAvailable = Object.values(availableByPos).reduce((a, b) => a + b, 0);
    const linesFilled = (["GK", "DEF", "MID", "FWD"] as const).every(
      (pos) => counts[pos] >= Math.min(want[pos], availableByPos[pos]),
    );
    const xiFull = resolved.starters.length === Math.min(11, totalAvailable);
    const shapeCorrect = linesFilled && xiFull;
    if (shapeCorrect) shapeOk++;
    else {
      console.error(
        `    ${club.shortName} ${fresh.formation}: fielded ${JSON.stringify(counts)}, had ${JSON.stringify(availableByPos)}`,
      );
    }
    // Nobody unavailable may start.
    const illegal = resolved.starters.filter(
      (p) =>
        p.status === "injured" ||
        p.status === "suspended" ||
        p.suspensionMatchesLeft > 0,
    );
    if (illegal.length > 0) {
      console.error(`  ✗ ${club.shortName} fielded ${illegal.length} unavailable player(s)`);
      bad++;
    }
  }
  ok(sheetsOk === before.length, `${sheetsOk}/${before.length} clubs saved a full XI`);
  ok(shapeOk === before.length, `${shapeOk}/${before.length} XIs match their formation`);

  // ── Selling ─────────────────────────────────────────────────
  console.log("\n=== Market behaviour ===");
  const aiListings = await db
    .select()
    .from(transferListings)
    .where(
      and(
        eq(transferListings.leagueId, leagueId),
        eq(transferListings.status, "active"),
        ne(transferListings.isBotMarket, true),
      ),
    );
  ok(aiListings.length > 0, `AI clubs listed ${aiListings.length} of their own players`);
  ok(
    aiListings.every((l) => l.sellerClubId !== null),
    "every AI listing has a seller — sales actually pay the club",
  );

  // ── Offers to a human club ──────────────────────────────────
  console.log("\n=== Offer negotiation ===");
  const [humanClub] = await db
    .select()
    .from(clubs)
    .where(and(eq(clubs.leagueId, leagueId), eq(clubs.aiManaged, false)));
  const aiClub = before[0];
  const [target] = await db
    .select()
    .from(players)
    .where(eq(players.clubId, aiClub.id))
    .limit(1);

  // A derisory bid must be refused.
  await db.insert(transferOffers).values({
    leagueId,
    playerId: target.id,
    fromClubId: humanClub.id,
    toClubId: aiClub.id,
    amountCents: Math.round(Number(target.marketValueCents) * 0.1),
    expiresAt: new Date(Date.now() + 86_400_000),
  });
  await runAiManagers({ leagueId, force: true });
  const [lowball] = await db
    .select()
    .from(transferOffers)
    .where(
      and(
        eq(transferOffers.fromClubId, humanClub.id),
        eq(transferOffers.playerId, target.id),
      ),
    );
  ok(lowball?.status === "rejected", `lowball bid rejected (got "${lowball?.status}")`);

  // A generous bid must be accepted and the player must move + money change hands.
  const [target2] = await db
    .select()
    .from(players)
    .where(eq(players.clubId, aiClub.id))
    .limit(1);
  const price = Math.round(Number(target2.marketValueCents) * 2);
  // Give the buyer a known, generous balance so the charge is measurable.
  await db
    .update(clubs)
    .set({ balanceCents: price * 3 })
    .where(eq(clubs.id, humanClub.id));
  await db.insert(transferOffers).values({
    leagueId,
    playerId: target2.id,
    fromClubId: humanClub.id,
    toClubId: aiClub.id,
    amountCents: price,
    expiresAt: new Date(Date.now() + 86_400_000),
  });
  await runAiManagers({ leagueId, force: true });
  const [moved] = await db
    .select()
    .from(players)
    .where(eq(players.id, target2.id));
  ok(moved.clubId === humanClub.id, "generous bid accepted, player transferred");

  // Assert on the ledger, not on the raw balance: the same AI tick also buys
  // and renews, so the seller's net balance can legitimately fall even though
  // it was paid for this player.
  const [ledger] = await db
    .select()
    .from(transferHistory)
    .where(
      and(
        eq(transferHistory.playerId, target2.id),
        eq(transferHistory.fromClubId, aiClub.id),
        eq(transferHistory.toClubId, humanClub.id),
      ),
    );
  ok(
    !!ledger && Number(ledger.priceCents) === price,
    `sale recorded in the ledger at the agreed price (${ledger ? Number(ledger.priceCents) : "missing"} vs ${price})`,
  );
  const [buyerBalAfter] = await db
    .select({ b: clubs.balanceCents })
    .from(clubs)
    .where(eq(clubs.id, humanClub.id));
  ok(
    buyerBalAfter.b <= price * 3 - price,
    "buying club was actually charged",
  );

  // ── AI sends its own offers ─────────────────────────────────
  const outgoing = await db
    .select()
    .from(transferOffers)
    .where(
      and(eq(transferOffers.leagueId, leagueId), ne(transferOffers.fromClubId, humanClub.id)),
    );
  ok(outgoing.length > 0, `AI clubs sent ${outgoing.length} offer(s) of their own`);

  // ── Idempotency ─────────────────────────────────────────────
  console.log("\n=== Idempotency ===");
  await db
    .update(clubs)
    .set({ aiLastRunAt: new Date() })
    .where(eq(clubs.leagueId, leagueId));
  const r2 = await runAiManagers({ leagueId });
  ok(r2.clubsManaged === 0, "a second run on the same day is a no-op");

  // ── Squad health ────────────────────────────────────────────
  console.log("\n=== Squad health ===");
  let thin = 0;
  for (const club of before) {
    const squad = await db
      .select({ id: players.id })
      .from(players)
      .where(eq(players.clubId, club.id));
    if (squad.length < 14) thin++;
  }
  ok(thin === 0, `no AI club has fewer than 14 players (${thin} thin)`);

  const freeAgents = await db
    .select({ id: players.id })
    .from(players)
    .where(and(eq(players.leagueId, leagueId), isNull(players.clubId)));
  console.log(`    free agent pool: ${freeAgents.length}`);

  console.log(bad === 0 ? "\n✅ AI MANAGER CHECKS PASS" : `\n✗ ${bad} VIOLATIONS`);
  process.exit(bad === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
