/**
 * Find leagues that were left half-built and rebuild them.
 *
 * `createStarterLeague` used to run as a long sequence of unrelated writes:
 * league row, then clubs, then players, then fixtures, then the cup bracket.
 * Nothing tied them together, so a single failed write — a Neon timeout is
 * enough — left a league marked "active" with clubs in it and no squads, no
 * fixtures and no way to play. "BayburtSpor Ligi" in production is exactly
 * that: 16 clubs, 0 players, 0 fixtures, one real user with nowhere to go.
 *
 * Creation is now all-or-nothing (see the rollback in create-league.ts), so
 * no new league can end up like this. This repairs the ones that already did.
 *
 * A broken league has never been played — it has no fixtures, so it cannot
 * have — which means nothing is lost by replacing it. Each affected owner
 * gets a fresh, complete league built by the current code path, keeping the
 * club name they chose.
 *
 * Run:  npx tsx scripts/repair-empty-leagues.ts            (dry run)
 *       npx tsx scripts/repair-empty-leagues.ts --apply
 */
import "./load-env";
import { eq, sql } from "drizzle-orm";
import { db } from "../lib/db";
import { clubs, fixtures, leagues, players, users } from "../lib/schema";
import { createStarterLeague } from "../lib/actions/create-league";
import { assertLocalDatabase } from "./guard-remote-db";

const APPLY = process.argv.includes("--apply");

async function main() {
  const all = await db
    .select({ id: leagues.id, name: leagues.name, code: leagues.inviteCode })
    .from(leagues);

  const broken: Array<{
    id: string;
    name: string;
    code: string;
    ownerUserId: string | null;
    teamName: string;
    clubCount: number;
  }> = [];

  for (const l of all) {
    const [counts] = await db
      .select({
        clubs: sql<number>`count(distinct ${clubs.id})::int`,
        players: sql<number>`(select count(*) from ${players} where ${players.leagueId} = ${l.id})::int`,
        fixtures: sql<number>`(select count(*) from ${fixtures} where ${fixtures.leagueId} = ${l.id})::int`,
      })
      .from(clubs)
      .where(eq(clubs.leagueId, l.id));

    // A league with clubs but no squads and no fixtures was never finished.
    // Requiring all three signals keeps a legitimately empty lobby safe.
    if (counts.clubs === 0 || counts.players > 0 || counts.fixtures > 0) continue;

    const [owner] = await db
      .select({ userId: clubs.ownerUserId, name: clubs.name })
      .from(clubs)
      .where(sql`${clubs.leagueId} = ${l.id} and ${clubs.ownerUserId} is not null`)
      .limit(1);

    broken.push({
      id: l.id,
      name: l.name,
      code: l.code,
      ownerUserId: owner?.userId ?? null,
      teamName: owner?.name ?? "Yeni Takım",
      clubCount: counts.clubs,
    });
  }

  if (broken.length === 0) {
    console.log("✓ Yarım kalmış lig yok.");
    return;
  }

  console.log(`${broken.length} bozuk lig bulundu:`);
  for (const b of broken) {
    console.log(
      `  ${b.name} [${b.code}] — ${b.clubCount} kulüp, 0 oyuncu, 0 fikstür` +
        (b.ownerUserId ? ` · sahibi "${b.teamName}"` : " · sahipsiz"),
    );
  }

  if (!APPLY) {
    console.log("\n(kuru çalışma — onarmak için --apply ekleyin)");
    return;
  }
  assertLocalDatabase("repair-empty-leagues --apply");

  for (const b of broken) {
    // Cascades through clubs, fixtures, feed events and the cup bracket.
    await db.delete(leagues).where(eq(leagues.id, b.id));

    if (!b.ownerUserId) {
      console.log(`  ✓ ${b.name} silindi (sahibi yoktu).`);
      continue;
    }
    // currentLeagueId has no foreign key, so the cascade leaves it dangling.
    await db
      .update(users)
      .set({ currentLeagueId: null })
      .where(eq(users.id, b.ownerUserId));

    const fresh = await createStarterLeague({
      userId: b.ownerUserId,
      teamName: b.teamName,
    });
    console.log(
      `  ✓ ${b.name} yeniden kuruldu → davet kodu ${fresh.inviteCode}, takım "${b.teamName}"`,
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
