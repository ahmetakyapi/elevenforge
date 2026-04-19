/**
 * Run one match day immediately — useful to verify the engine without waiting
 * for scheduled times. Marks ALL scheduled fixtures for the NEXT round as due.
 *
 * Usage: `tsx scripts/simulate-matchday.ts`
 */
import { and, asc, eq } from "drizzle-orm";
import { db } from "../lib/db";
import { fixtures, leagues } from "../lib/schema";
import { runMatchDay } from "../lib/jobs";
import { runWeeklyNewspaper } from "../lib/jobs/newspaper";

async function main() {
  const active = await db
    .select()
    .from(leagues)
    .where(eq(leagues.status, "active"));

  for (const L of active) {
    const nextFixture = (
      await db
        .select()
        .from(fixtures)
        .where(
          and(
            eq(fixtures.leagueId, L.id),
            eq(fixtures.status, "scheduled"),
          ),
        )
        .orderBy(asc(fixtures.weekNumber))
        .limit(1)
    )[0];
    if (!nextFixture) {
      console.log(`  → ${L.name}: no scheduled fixtures, skipping`);
      continue;
    }
    // Mark all fixtures of the next week as due (scheduledAt -> now)
    await db
      .update(fixtures)
      .set({ scheduledAt: new Date() })
      .where(
        and(
          eq(fixtures.leagueId, L.id),
          eq(fixtures.weekNumber, nextFixture.weekNumber),
          eq(fixtures.status, "scheduled"),
        ),
      );
    console.log(
      `  → ${L.name}: forced week ${nextFixture.weekNumber} to play now.`,
    );
  }

  const res = await runMatchDay();
  console.log("Match-day:", res);

  const paper = await runWeeklyNewspaper();
  console.log("Newspaper:", paper);

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
