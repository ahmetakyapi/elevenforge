/**
 * The transfer window actually holds.
 *
 * The guards are hand-placed across a dozen player-movement paths and nothing
 * in the type system enforces that the list is complete. Asserting "function X
 * has a guard" would only re-state the list; this asserts the OUTCOME instead:
 * drive the whole game loop with the window shut and require that no player
 * changed clubs and no market object was created, whichever path a future
 * change might add.
 *
 * The exemptions are asserted too, and they matter as much: a window that can
 * trap a bankrupt club in the red, or leave a manager unable to withdraw his
 * own listing, is a rule that breaks the game rather than shaping it.
 */
import "./load-env";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "../lib/db";
import { assertLocalDatabase } from "./guard-remote-db";
import {
  clubs,
  leagues,
  players,
  transferBids,
  transferHistory,
  transferListings,
  transferOffers,
} from "../lib/schema";
import { runAiManagers } from "../lib/ai/manager";
import { runTransferBots } from "../lib/jobs/transfer-bots";
import { resolveTransferBids } from "../lib/jobs/bids";
import { transferWindow } from "../lib/transfer-window";

let bad = 0;
function ok(cond: boolean, msg: string) {
  console.log(cond ? `  ✓ ${msg}` : `  ✗ ${msg}`);
  if (!cond) bad++;
}

/** A week that the window function reports as closed, for this league length. */
function findClosedWeek(seasonLength: number): number | null {
  for (let w = 0; w <= seasonLength; w++) {
    if (!transferWindow({ weekNumber: w, seasonLength }).open) return w;
  }
  return null;
}

function findOpenWeek(seasonLength: number): number | null {
  for (let w = 0; w <= seasonLength; w++) {
    if (transferWindow({ weekNumber: w, seasonLength }).open) return w;
  }
  return null;
}

async function snapshot(leagueId: string) {
  const squad = await db
    .select({ id: players.id, clubId: players.clubId })
    .from(players)
    .where(eq(players.leagueId, leagueId));
  const [counts] = await db
    .select({
      history: sql<number>`(select count(*) from ${transferHistory} where league_id = ${leagueId})::int`,
      listings: sql<number>`(select count(*) from ${transferListings} where league_id = ${leagueId})::int`,
      bids: sql<number>`(select count(*) from ${transferBids} where league_id = ${leagueId})::int`,
      offers: sql<number>`(select count(*) from ${transferOffers} where league_id = ${leagueId})::int`,
    })
    .from(leagues)
    .where(eq(leagues.id, leagueId));
  return {
    owners: new Map(squad.map((p) => [p.id, p.clubId])),
    ...counts,
  };
}

async function main() {
  assertLocalDatabase("test-transfer-window");
  console.log("=== Transfer window ===");

  const [league] = await db.select().from(leagues).limit(1);
  if (!league) {
    console.log("  ✗ no league seeded — run npm run db:reset first");
    process.exit(1);
  }

  // ── The window function itself ─────────────────────────────────────
  const closedWeek = findClosedWeek(league.seasonLength);
  const openWeek = findOpenWeek(league.seasonLength);
  ok(closedWeek !== null, `a ${league.seasonLength}-week season has a closed stretch`);
  ok(openWeek !== null, `a ${league.seasonLength}-week season has an open stretch`);
  ok(
    transferWindow({ weekNumber: 0, seasonLength: league.seasonLength }).open,
    "week 0 (pre-season) is always open, so a new league can build a squad",
  );
  // Both league sizes in the game must behave.
  for (const len of [15, 34]) {
    ok(
      findClosedWeek(len) !== null && findOpenWeek(len) !== null,
      `a ${len}-week season has both an open and a closed stretch`,
    );
  }
  if (closedWeek === null || openWeek === null) process.exit(1);

  // ── Nothing moves while it is shut ─────────────────────────────────
  await db
    .update(leagues)
    .set({ weekNumber: closedWeek })
    .where(eq(leagues.id, league.id));
  // Let every bot act this tick rather than being held off by yesterday's
  // claim — otherwise the sweep proves nothing.
  await db
    .update(clubs)
    .set({ aiLastRunAt: null })
    .where(eq(clubs.leagueId, league.id));

  // A PENDING OFFER MUST EXIST or this whole section passes vacuously.
  //
  // The first version of this test drove the sweep against a freshly seeded
  // league, which has no transferOffers rows at all — so respondToOffers had
  // an empty inbox, accepted nothing, and `moved === 0` was true for reasons
  // that had nothing to do with the window. The bug it was written to catch
  // (a bot honouring an offer while the market was shut, when the identical
  // human action is refused) survived it untouched.
  // THE SELLER MUST BE AI-MANAGED. runAiManagers only iterates clubs with
  // aiManaged = true, so an offer addressed to the human club is never seen by
  // respondToOffers and the assertion below passes for the wrong reason —
  // which is exactly what happened on the first attempt: the test stayed green
  // with the fix reverted, because the seeded league's first club is the
  // user's.
  const [seller, buyer] = await db
    .select()
    .from(clubs)
    .where(and(eq(clubs.leagueId, league.id), eq(clubs.aiManaged, true)))
    .limit(2);
  const [target] = await db
    .select()
    .from(players)
    .where(eq(players.clubId, seller.id))
    .limit(1);
  await db
    .update(clubs)
    .set({ balanceCents: 60_000_000_000 })
    .where(eq(clubs.id, buyer.id));
  // Well above any asking price the AI can compute, so a refusal can only be
  // the window and never "the bid was too low".
  await db.insert(transferOffers).values({
    leagueId: league.id,
    playerId: target.id,
    fromClubId: buyer.id,
    toClubId: seller.id,
    amountCents: Number(target.marketValueCents) * 5,
    status: "pending",
    expiresAt: new Date(Date.now() + 3 * 86_400_000),
  });

  const before = await snapshot(league.id);
  await runAiManagers({ leagueId: league.id, force: true });
  await runTransferBots({ leagueId: league.id });
  await resolveTransferBids({ leagueId: league.id });
  const after = await snapshot(league.id);

  let moved = 0;
  for (const [id, owner] of after.owners) {
    if (before.owners.get(id) !== owner) moved++;
  }
  ok(moved === 0, `no player changed clubs during a closed window (${moved} moved)`);
  ok(
    after.history === before.history,
    `no transfer was recorded (${after.history - before.history} new)`,
  );
  ok(
    after.listings <= before.listings,
    `no new listing was created (${after.listings - before.listings})`,
  );
  ok(after.bids <= before.bids, `no new bid was placed (${after.bids - before.bids})`);
  ok(
    after.offers <= before.offers,
    `no new offer was sent (${after.offers - before.offers})`,
  );

  // The specific bug: a bot accepting a pending offer while shut.
  const [offerAfter] = await db
    .select({ status: transferOffers.status })
    .from(transferOffers)
    .where(eq(transferOffers.playerId, target.id));
  ok(
    offerAfter?.status !== "accepted",
    `a bot does not accept a pending offer while closed (status ${offerAfter?.status})`,
  );
  ok(
    offerAfter?.status !== "countered",
    `a bot does not counter while closed either (status ${offerAfter?.status})`,
  );

  // ── The exemptions still work ──────────────────────────────────────
  // A club deep in the red must still be able to sell its way out, or the
  // window turns a bad season into a permanent one.
  const [victim] = await db
    .select()
    .from(clubs)
    .where(and(eq(clubs.leagueId, league.id), eq(clubs.aiManaged, true)))
    .limit(1);
  await db
    .update(clubs)
    .set({ balanceCents: -8_000_000_000, aiLastRunAt: null })
    .where(eq(clubs.id, victim.id));
  const beforeRescue = await db
    .select({ bal: clubs.balanceCents })
    .from(clubs)
    .where(eq(clubs.id, victim.id));
  await runAiManagers({ leagueId: league.id, force: true });
  const afterRescue = await db
    .select({ bal: clubs.balanceCents })
    .from(clubs)
    .where(eq(clubs.id, victim.id));
  ok(
    Number(afterRescue[0].bal) > Number(beforeRescue[0].bal),
    `a bankrupt club can still sell its way out while closed ` +
      `(${Math.round(Number(beforeRescue[0].bal) / 1e8)}M → ${Math.round(Number(afterRescue[0].bal) / 1e8)}M)`,
  );

  // ── And it opens again ─────────────────────────────────────────────
  await db
    .update(leagues)
    .set({ weekNumber: openWeek })
    .where(eq(leagues.id, league.id));
  await db
    .update(clubs)
    .set({ aiLastRunAt: null })
    .where(eq(clubs.leagueId, league.id));
  const beforeOpen = await snapshot(league.id);
  await runAiManagers({ leagueId: league.id, force: true });
  const afterOpen = await snapshot(league.id);
  ok(
    afterOpen.listings > beforeOpen.listings ||
      afterOpen.offers > beforeOpen.offers ||
      afterOpen.bids > beforeOpen.bids,
    `the market comes back to life when the window opens ` +
      `(+${afterOpen.listings - beforeOpen.listings} ilan, ` +
      `+${afterOpen.offers - beforeOpen.offers} teklif, ` +
      `+${afterOpen.bids - beforeOpen.bids} artırma)`,
  );

  /*
    ── The market gets better as the calendar advances ────────────────────

    Two failures this catches, both measured on a seeded league before the
    fix and both invisible from the outside:

      1. Free agents were filling the ENTIRE shelf, and an expired listing
         puts its player back in that pool — so after a few ticks the market
         recycled the same faces forever and no new player was ever invented.
         Week 2 and week 16 produced byte-identical shelves.

      2. The quality curve was scaled against the whole season, but the window
         is only open for about the first 58% of it. The top half of the band
         was unreachable: the strong players could only have arrived in weeks
         when nothing could be bought.

    So this asserts the OUTCOME a manager would notice — the mid-season
    window offers better players than preseason — rather than that some
    function was called.
  */
  console.log("\n=== Market quality across the calendar ===");
  {
    const refillOnce = async (week: number): Promise<number[]> => {
      await db
        .update(leagues)
        .set({ weekNumber: week })
        .where(eq(leagues.id, league.id));
      await db
        .update(transferListings)
        .set({ status: "withdrawn" })
        .where(
          and(
            eq(transferListings.leagueId, league.id),
            eq(transferListings.status, "active"),
          ),
        );
      for (let i = 0; i < 6; i++) await runTransferBots({ leagueId: league.id });
      const rows = await db
        .select({ playerId: transferListings.playerId })
        .from(transferListings)
        .where(
          and(
            eq(transferListings.leagueId, league.id),
            eq(transferListings.status, "active"),
          ),
        );
      if (rows.length === 0) return [];
      const ps = await db
        .select({ overall: players.overall })
        .from(players)
        .where(
          inArray(
            players.id,
            rows.map((r) => r.playerId),
          ),
        );
      return ps.map((p) => p.overall);
    };

    /*
      Pooled over several refills, not measured from one.

      The headline-signing branch fires on roughly one invented player in
      eight, and a single shelf only invents about eleven — so the top of one
      shelf is largely a coin flip, and asserting on it made this test fail
      about a third of the time for no reason. Three refills is ~35 invented
      players per phase, which is enough for the band to show through the
      noise while still being an end-to-end measurement of what a manager
      would actually be offered.
    */
    const shelfAt = async (week: number): Promise<number[]> => {
      const pooled: number[] = [];
      for (let i = 0; i < 3; i++) pooled.push(...(await refillOnce(week)));
      return pooled;
    };
    const mean = (xs: number[]) =>
      xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length;

    // Week 2 is preseason; the middle of the season is the second window.
    const preseason = await shelfAt(2);
    const midWindow = await shelfAt(Math.round(league.seasonLength * 0.5));

    ok(preseason.length >= 12, `preseason market is stocked (${preseason.length} ilan)`);
    ok(midWindow.length >= 12, `mid-season market is stocked (${midWindow.length} ilan)`);
    ok(
      mean(midWindow) > mean(preseason),
      `mid-season stock outranks preseason ` +
        `(ort ${mean(preseason).toFixed(1)} → ${mean(midWindow).toFixed(1)})`,
    );
    /*
      And fresh players genuinely arrive.

      This is the half of the fix the averages above cannot see. Half the
      shelf is drawn from the league's existing free agents — players the AI
      released, whose ratings have nothing to do with what week it is — so a
      market that had stopped inventing anything could still post a
      respectable average by recycling the same castoffs forever. Which is
      exactly what it did: measured before the fix, week 2 and week 16
      produced byte-identical shelves.

      Names that did not exist anywhere in the league before the refill are
      unambiguous evidence that new stock was created.
      (Deliberately not asserted on the top of the shelf: the strongest few
      listings are usually recycled free agents rather than invented players,
      so that end of the distribution measures a mixture and flakes.)
    */
    const namesBefore = new Set(
      (
        await db
          .select({ name: players.name })
          .from(players)
          .where(eq(players.leagueId, league.id))
      ).map((r) => r.name),
    );
    await shelfAt(Math.round(league.seasonLength * 0.5));
    const namesAfter = await db
      .select({ name: players.name })
      .from(players)
      .where(eq(players.leagueId, league.id));
    const fresh = namesAfter.filter((r) => !namesBefore.has(r.name)).length;
    ok(
      fresh > 0,
      `the market invents new players rather than recycling the pool ` +
        `(${fresh} yeni oyuncu)`,
    );
  }

  console.log(bad === 0 ? "\n✅ TRANSFER WINDOW CHECKS PASS" : `\n✗ ${bad} VIOLATIONS`);
  process.exit(bad === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
