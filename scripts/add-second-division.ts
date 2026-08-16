/**
 * Give an existing league its 1. Lig.
 *
 * The second division was added to `createStarterLeague`, so every league made
 * since has both tiers. Leagues created before that are stuck with a single
 * flat division — which quietly disables a whole set of features that are
 * already written and shipped:
 *
 *   - Promotion and relegation. `applyPromotionRelegation` returns early when
 *     the second tier holds fewer than three clubs, so the bottom of the table
 *     plays for nothing.
 *   - The board goal "Küme düşmemek", which is unfailable with nowhere to fall.
 *   - Half the transfer market: 1. Lig squads are where a mid-table Süper Lig
 *     club can actually afford to shop.
 *
 * ONLY LEAGUES THAT HAVE NOT KICKED OFF (weekNumber 0) are touched. A second
 * division needs its own full double round-robin — 34 rounds for 18 clubs —
 * and a league seven weeks into a fifteen-week season has nowhere to put them.
 * Those leagues pick the tier up at the next season roll instead, when a fresh
 * fixture list is drawn for everybody.
 *
 * Run:  npx tsx scripts/add-second-division.ts            (dry run)
 *       npx tsx scripts/add-second-division.ts --apply
 */
import "./load-env";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "../lib/db";
import { clubs, fixtures, leagues, players } from "../lib/schema";
import { SQUAD_PACKS_D2 } from "../lib/squad-packs";
import { marketValueCents , seasonBudgetCents } from "../lib/economy";
import { roundRobin } from "../lib/jobs/season";
import { matchKickoff } from "../lib/match-time";
import { assertLocalDatabase } from "./guard-remote-db";

const APPLY = process.argv.includes("--apply");

/** Second-tier clubs are poorer and carry no standing. Mirrors create-league. */
const D2_PRESTIGE = 24;

/** Bot tactical presets, so the new clubs are not all 4-4-2 clones. */
const PERSONALITIES = [
  { formation: "4-3-3", mentality: 3, pressing: 3, tempo: 3 },
  { formation: "4-4-2", mentality: 2, pressing: 3, tempo: 3 },
  { formation: "4-2-3-1", mentality: 3, pressing: 4, tempo: 3 },
  { formation: "3-5-2", mentality: 4, pressing: 3, tempo: 4 },
  { formation: "5-3-2", mentality: 1, pressing: 2, tempo: 1 },
  { formation: "4-1-4-1", mentality: 2, pressing: 4, tempo: 2 },
];

const ROLE_ATTR_OFFSETS: Record<
  string,
  { pace: number; shooting: number; passing: number; defending: number; physical: number; goalkeeping: number }
> = {
  GK: { pace: -12, shooting: -45, passing: -5, defending: -15, physical: 0, goalkeeping: 18 },
  CB: { pace: -5, shooting: -22, passing: -6, defending: 12, physical: 8, goalkeeping: -40 },
  LB: { pace: 6, shooting: -16, passing: 1, defending: 4, physical: 0, goalkeeping: -40 },
  RB: { pace: 6, shooting: -16, passing: 1, defending: 4, physical: 0, goalkeeping: -40 },
  CDM: { pace: -3, shooting: -10, passing: 5, defending: 6, physical: 5, goalkeeping: -40 },
  CM: { pace: 0, shooting: -4, passing: 10, defending: -3, physical: 1, goalkeeping: -40 },
  AM: { pace: 3, shooting: 4, passing: 10, defending: -12, physical: -3, goalkeeping: -40 },
  LW: { pace: 11, shooting: 3, passing: 2, defending: -11, physical: -4, goalkeeping: -40 },
  RW: { pace: 11, shooting: 3, passing: 2, defending: -11, physical: -4, goalkeeping: -40 },
  ST: { pace: 6, shooting: 13, passing: -6, defending: -18, physical: 6, goalkeeping: -40 },
  CF: { pace: 4, shooting: 10, passing: -1, defending: -15, physical: 5, goalkeeping: -40 },
};

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function rollAttr(base: number, offset: number, r: () => number): number {
  return Math.max(30, Math.min(99, Math.round(base + offset + (r() - 0.5) * 8)));
}

async function main() {
  const all = await db
    .select({
      id: leagues.id,
      name: leagues.name,
      code: leagues.inviteCode,
      week: leagues.weekNumber,
      season: leagues.seasonNumber,
      matchTime: leagues.matchTime,
      timeZone: leagues.timeZone,
    })
    .from(leagues)
    .orderBy(asc(leagues.createdAt));

  const candidates: typeof all = [];
  const deferred: typeof all = [];

  for (const l of all) {
    const [c] = await db
      .select({ d2: sql<number>`count(*) filter (where ${clubs.division} = 2)::int` })
      .from(clubs)
      .where(eq(clubs.leagueId, l.id));
    if (c.d2 > 0) continue;
    (l.week === 0 ? candidates : deferred).push(l);
  }

  for (const l of deferred) {
    console.log(
      `↷ ${l.name} [${l.code}] — sezon ${l.season} hafta ${l.week}, başlamış. ` +
        `1. Lig sezon sonunda eklenecek.`,
    );
  }
  if (candidates.length === 0) {
    console.log("Eklenecek lig yok.");
    return;
  }
  for (const l of candidates) {
    console.log(`+ ${l.name} [${l.code}] — ${SQUAD_PACKS_D2.length} kulüplük 1. Lig eklenecek.`);
  }

  if (!APPLY) {
    console.log("\n(kuru çalışma — eklemek için --apply ekleyin)");
    return;
  }
  assertLocalDatabase("add-second-division --apply");

  for (const l of candidates) {
    const newClubs: Array<typeof clubs.$inferSelect> = [];

    for (const [i, pack] of SQUAD_PACKS_D2.entries()) {
      const meta = pack.club;
      const persona = PERSONALITIES[i % PERSONALITIES.length];
      const [row] = await db
        .insert(clubs)
        .values({
          leagueId: l.id,
          division: 2,
          ownerUserId: null,
          isBot: true,
          aiManaged: true,
          name: meta.name,
          shortName: meta.short,
          city: meta.city,
          color: meta.color,
          color2: meta.color2,
          balanceCents: seasonBudgetCents(D2_PRESTIGE),
          prestige: D2_PRESTIGE,
          formation: persona.formation,
          mentality: persona.mentality,
          pressing: persona.pressing,
          tempo: persona.tempo,
        })
        .returning();
      newClubs.push(row);
    }

    const newPlayers: Array<typeof players.$inferInsert> = [];
    for (const [idx, club] of newClubs.entries()) {
      const r = rng(club.id.charCodeAt(0) * 997 + idx * 31 + 12345);
      for (const p of SQUAD_PACKS_D2[idx].players) {
        const off = ROLE_ATTR_OFFSETS[p.role] ?? ROLE_ATTR_OFFSETS.CM;
        const value =
          p.val != null ? p.val * 100 : marketValueCents(p.ovr, p.pot, p.age);
        newPlayers.push({
          leagueId: l.id,
          clubId: club.id,
          name: p.n,
          position: p.pos,
          role: p.role,
          secondaryRoles: "[]",
          jerseyNumber: p.num ?? null,
          age: p.age,
          nationality: p.nat,
          overall: p.ovr,
          potential: p.pot,
          pace: rollAttr(p.ovr, off.pace, r),
          shooting: rollAttr(p.ovr, off.shooting, r),
          passing: rollAttr(p.ovr, off.passing, r),
          defending: rollAttr(p.ovr, off.defending, r),
          physical: rollAttr(p.ovr, off.physical, r),
          goalkeeping: rollAttr(p.ovr, off.goalkeeping, r),
          fitness: p.fit ?? 90,
          morale: p.mor ?? 4,
          marketValueCents: value,
          status: "active",
          lastRatings: JSON.stringify(p.form ?? []),
        });
      }
    }
    await db.insert(players).values(newPlayers);

    // Fixtures for the tier, on the same match days as the top flight so both
    // divisions share one calendar.
    const now = new Date();
    const rounds = roundRobin(newClubs.map((c) => c.id));
    const rows: Array<typeof fixtures.$inferInsert> = [];
    for (let round = 0; round < rounds.length; round++) {
      const scheduled = matchKickoff(now, round, l.matchTime, l.timeZone);
      for (const m of rounds[round]) {
        const home = newClubs.find((c) => c.id === m.home);
        if (!home) continue;
        rows.push({
          leagueId: l.id,
          seasonNumber: l.season,
          division: 2,
          weekNumber: round + 1,
          homeClubId: m.home,
          awayClubId: m.away,
          venue: `${home.city} Arena`,
          scheduledAt: scheduled,
          status: "scheduled",
        });
      }
    }
    await db.insert(fixtures).values(rows);

    console.log(
      `  ✓ ${l.name}: ${newClubs.length} kulüp, ${newPlayers.length} oyuncu, ${rows.length} fikstür eklendi.`,
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
