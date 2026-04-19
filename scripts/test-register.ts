/**
 * Quick test: simulate a new user registration and verify a full league
 * gets spun up. Not a real test harness — just a manual e2e sanity check.
 */
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { clubs, fixtures, leagues, players, users } from "../lib/schema";
import { createStarterLeague } from "../lib/actions/create-league";

async function main() {
  const email = `test-${Date.now()}@ef.local`;
  const teamName = "Test FC";
  const passwordHash = await hash("testtest", 10);

  console.log(`→ Inserting user ${email}`);
  const [u] = await db
    .insert(users)
    .values({ email, passwordHash, name: teamName })
    .returning();

  console.log(`→ Creating starter league…`);
  const league = await createStarterLeague({
    userId: u.id,
    teamName,
  });

  const leagueRow = (
    await db.select().from(leagues).where(eq(leagues.id, league.leagueId))
  )[0];
  const clubCount = (
    await db.select().from(clubs).where(eq(clubs.leagueId, league.leagueId))
  ).length;
  const playerCount = (
    await db.select().from(players).where(eq(players.leagueId, league.leagueId))
  ).length;
  const fixtureCount = (
    await db.select().from(fixtures).where(eq(fixtures.leagueId, league.leagueId))
  ).length;

  console.log(`\n✓ Sonuç:`);
  console.log(`  League: ${leagueRow.name} (invite: ${leagueRow.inviteCode})`);
  console.log(`  Clubs: ${clubCount}`);
  console.log(`  Players: ${playerCount}`);
  console.log(`  Fixtures: ${fixtureCount}`);
  console.log(`  Owner club: ${league.clubId}`);

  // Clean up
  console.log(`\n→ Cleaning up test data…`);
  await db.delete(users).where(eq(users.id, u.id));
  console.log(`✓ Done.`);

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
