/**
 * Quick DB inspection — prints league standings, recent fixture, feed.
 */
import { desc, eq } from "drizzle-orm";
import { db } from "../lib/db";
import { clubs, feedEvents, fixtures, leagues, newspapers } from "../lib/schema";

async function main() {
  const [L] = await db.select().from(leagues).limit(1);
  if (!L) {
    console.log("No league.");
    process.exit(0);
  }

  console.log(`\n=== ${L.name} · Sezon ${L.seasonNumber} · Hafta ${L.weekNumber}\n`);

  const standings = await db
    .select()
    .from(clubs)
    .where(eq(clubs.leagueId, L.id))
    .orderBy(desc(clubs.seasonPoints));
  for (const [i, c] of standings.entries()) {
    console.log(
      `${String(i + 1).padStart(2)}. ${c.shortName.padEnd(4)}  ${c.name.padEnd(24)}  O:${c.seasonWins + c.seasonDraws + c.seasonLosses}  G${c.seasonWins} B${c.seasonDraws} M${c.seasonLosses}  Gol ${c.seasonGoalsFor}:${c.seasonGoalsAgainst}  P${c.seasonPoints}`,
    );
  }

  console.log("\n--- Finished fixtures ---");
  const fin = await db
    .select()
    .from(fixtures)
    .where(eq(fixtures.leagueId, L.id))
    .orderBy(desc(fixtures.playedAt))
    .limit(12);
  for (const f of fin) {
    if (f.status !== "finished") continue;
    const h = (await db.select().from(clubs).where(eq(clubs.id, f.homeClubId)))[0];
    const a = (await db.select().from(clubs).where(eq(clubs.id, f.awayClubId)))[0];
    console.log(
      `  ${h?.shortName}  ${f.homeScore} - ${f.awayScore}  ${a?.shortName}   w${f.weekNumber}`,
    );
  }

  console.log("\n--- Latest newspaper ---");
  const paper = (
    await db
      .select()
      .from(newspapers)
      .where(eq(newspapers.leagueId, L.id))
      .orderBy(desc(newspapers.publishedAt))
      .limit(1)
  )[0];
  if (paper) {
    const cover = JSON.parse(paper.coverJson);
    const totw = JSON.parse(paper.totwJson);
    console.log(`  Headline: ${cover.headline}`);
    console.log(`  Sub: ${cover.subhead}`);
    console.log(`  TOTW size: ${totw.length}`);
    console.log(`  Top TOTW:`, totw.slice(0, 5).map((p: { name: string; rating: number }) => `${p.name} (${p.rating})`).join(", "));
  }

  console.log("\n--- Feed ---");
  const feed = await db
    .select()
    .from(feedEvents)
    .where(eq(feedEvents.leagueId, L.id))
    .orderBy(desc(feedEvents.createdAt))
    .limit(8);
  for (const f of feed) {
    console.log(`  [${f.eventType}] ${f.text}`);
  }

  console.log();
  process.exit(0);
}

main().catch(console.error);
