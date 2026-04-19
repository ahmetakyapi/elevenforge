/**
 * Seed the DB with a demo world:
 *  - 1 user: ahmet@elevenforge.app / "eleven123"
 *  - 1 league: "Kartel Crew" (invite K4R73L)
 *  - 16 clubs (user owns "İstanbul Şehir FK", rest are bots)
 *  - 20 players per club (320 total)
 *  - 12 transfer listings
 *  - 15-round round-robin fixture schedule (starts today, 21:00 per day)
 *
 * Safe to re-run: clears existing league named "Kartel Crew" first.
 */
import { hash } from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { db } from "../lib/db";
import {
  clubs,
  feedEvents,
  fixtures,
  leagues,
  players,
  transferListings,
  users,
} from "../lib/schema";
import { SQUAD, CLUBS as SEED_CLUBS } from "../lib/mock-data";
import type { Position } from "../types";

const USER_EMAIL = "ahmet@elevenforge.app";
const USER_PASSWORD = "eleven123";
const USER_NAME = "Ahmet Akyapı";
const LEAGUE_NAME = "Akyapı Crew";
const INVITE_CODE = "AKYAPI";

// ─── Name pools for bot-squad generation ─────────────────────
const TR_FIRST = [
  "Ahmet", "Mehmet", "Mustafa", "Emre", "Burak", "Ali", "Yusuf", "Kerem",
  "Efe", "Arda", "Onur", "Tolga", "Kaan", "Berke", "Hakan", "Gökhan",
  "Ozan", "Okan", "Barış", "İlkay", "Oğuzhan", "Cengiz", "Taylan", "Umut",
  "Doğan", "Enes", "Fatih", "Halil", "İsmail", "Orkun", "Semih", "Sinan",
  "Tayfun", "Uğurcan", "Yunus", "Zeki", "Çağlar", "Merih", "Ferdi", "Kenan",
];
const TR_LAST = [
  "Yılmaz", "Kaya", "Demir", "Çelik", "Şahin", "Aydın", "Öztürk", "Aslan",
  "Doğan", "Kılıç", "Arslan", "Yıldız", "Taş", "Erdoğan", "Koç", "Polat",
  "Güneş", "Güler", "Demirci", "Koçak", "Çakır", "Akgün", "Aktürkoğlu",
  "Çalhanoğlu", "Şanlı", "Toraman", "Çolak", "Türkoğlu", "Sezer", "Akın",
];
const INTL = [
  { name: "O. Nkemba", nat: "NG" }, { name: "J. Okafor", nat: "NG" },
  { name: "V. Laszlo", nat: "HU" }, { name: "M. Kovač", nat: "HR" },
  { name: "A. Diakité", nat: "FR" }, { name: "L. Pereira", nat: "BR" },
  { name: "N. Álvarez", nat: "AR" }, { name: "F. Schulze", nat: "DE" },
  { name: "R. Papadakis", nat: "GR" }, { name: "I. Moreno", nat: "ES" },
  { name: "T. Novák", nat: "CZ" }, { name: "H. Sørensen", nat: "DK" },
  { name: "C. Rossi", nat: "IT" }, { name: "P. Oliveira", nat: "PT" },
  { name: "D. van Dijk", nat: "NL" }, { name: "K. Suzuki", nat: "IT" },
];

const ROLES: Record<Position, string[]> = {
  GK: ["GK"],
  DEF: ["CB", "LB", "RB"],
  MID: ["CDM", "CM", "AM", "LW", "RW"],
  FWD: ["ST", "CF", "LW", "RW"],
};

const SECONDARY_POOL: Record<string, string[]> = {
  GK: [],
  CB: ["LB", "RB"],
  LB: ["CB", "LW"],
  RB: ["CB", "RW"],
  CDM: ["CM", "CB"],
  CM: ["CDM", "AM"],
  AM: ["CM", "LW", "RW"],
  LW: ["LB", "AM", "ST"],
  RW: ["RB", "AM", "ST"],
  ST: ["CF", "AM"],
  CF: ["ST"],
};

function generateSecondaryRoles(role: string, r: () => number): string[] {
  const pool = SECONDARY_POOL[role] ?? [];
  if (pool.length === 0) return [];
  const n = r() < 0.15 ? 2 : r() < 0.4 ? 1 : 0;
  if (n === 0) return [];
  return [...pool].sort(() => r() - 0.5).slice(0, Math.min(n, pool.length));
}

// Secondary roles for the hand-crafted Kartel Crew squad (by player name)
const HAND_SECONDARY: Record<string, string[]> = {
  "Ferdi Kadıoğlu": ["CB", "LW"],
  "Bright Osayi-Samuel": ["RW", "CB"],
  "Mert Müldür": ["CB"],
  "Jayden Oosterwolde": ["CB", "LW"],
  "Sofyan Amrabat": ["CM", "CB"],
  "Fred": ["CDM", "AM"],
  "İsmail Yüksek": ["CDM", "AM"],
  "Sebastian Szymański": ["CM", "LW"],
  "Dušan Tadić": ["LW", "CM"],
  "Allan Saint-Maximin": ["RW", "ST"],
  "Cengiz Ünder": ["LW", "AM"],
  "İrfan Can Kahveci": ["CM", "RW"],
  "Youssef En-Nesyri": ["CF"],
};

// Budget for each club (€M in cents)
const START_BALANCE_CENTS = 4_500_000_000; // €45M

const SQUAD_COMPOSITION: Array<[Position, number]> = [
  ["GK", 2],
  ["DEF", 6],
  ["MID", 7],
  ["FWD", 5],
];

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function pick<T>(arr: T[], r: () => number): T {
  return arr[Math.floor(r() * arr.length)];
}

function generateName(r: () => number): { name: string; nat: string } {
  if (r() < 0.2) {
    return pick(INTL, r);
  }
  const first = pick(TR_FIRST, r);
  const last = pick(TR_LAST, r);
  return { name: `${first} ${last}`, nat: "TR" };
}

function generatePlayerForClub(
  leagueId: string,
  clubId: string,
  clubRatingBase: number,
  jersey: number,
  pos: Position,
  r: () => number,
): typeof players.$inferInsert {
  const { name, nat } = generateName(r);
  const roleChoices = ROLES[pos];
  const role = roleChoices[Math.floor(r() * roleChoices.length)];
  const secondaryRoles = generateSecondaryRoles(role, r);
  const age = Math.floor(r() * 18) + 17; // 17-34
  // Overall: club base ± variation
  const ovrVariance = (r() - 0.5) * 14;
  const ovr = Math.max(
    60,
    Math.min(90, Math.round(clubRatingBase + ovrVariance)),
  );
  const potCap = Math.min(95, ovr + Math.floor(r() * 12));
  // Young players have higher potential upside
  const pot = age <= 21 ? Math.max(ovr + 3, potCap) : Math.max(ovr, potCap);
  // Market value roughly scales with overall^3
  const valueEur = Math.max(
    300_000,
    Math.round(
      Math.pow(ovr - 55, 2.6) * 22_000 * (1 + (pot - ovr) * 0.08) *
        (age <= 24 ? 1.2 : age >= 31 ? 0.7 : 1.0),
    ),
  );
  const wageEur = Math.max(12_000, Math.round(valueEur / 200));
  return {
    leagueId,
    clubId,
    name,
    position: pos,
    role,
    secondaryRoles: JSON.stringify(secondaryRoles),
    jerseyNumber: jersey,
    age,
    nationality: nat,
    overall: ovr,
    potential: pot,
    fitness: 85 + Math.floor(r() * 15),
    morale: 3 + Math.floor(r() * 3),
    wageCents: wageEur * 100,
    marketValueCents: valueEur * 100,
    contractYears: 1 + Math.floor(r() * 5),
    status: "active",
    lastRatings: JSON.stringify(
      Array.from({ length: 5 }, () =>
        Number((6 + r() * 2.5).toFixed(1)),
      ),
    ),
  };
}

function roundRobin(teamIds: string[]) {
  const teams = teamIds.slice();
  const n = teams.length;
  if (n % 2 !== 0) teams.push("BYE");
  const rounds: Array<Array<{ home: string; away: string }>> = [];
  const half = teams.length / 2;
  let arr = teams.slice();
  for (let r = 0; r < arr.length - 1; r++) {
    const matches: Array<{ home: string; away: string }> = [];
    for (let i = 0; i < half; i++) {
      const t1 = arr[i];
      const t2 = arr[arr.length - 1 - i];
      if (t1 !== "BYE" && t2 !== "BYE") {
        if (r % 2 === 0) matches.push({ home: t1, away: t2 });
        else matches.push({ home: t2, away: t1 });
      }
    }
    rounds.push(matches);
    // Rotate: keep first fixed, cycle rest
    const first = arr[0];
    const rest = arr.slice(1);
    rest.unshift(rest.pop()!);
    arr = [first, ...rest];
  }
  return rounds;
}

async function main() {
  console.log("Seeding ElevenForge world…");

  // Clean existing league if present
  const existing = await db
    .select({ id: leagues.id })
    .from(leagues)
    .where(eq(leagues.name, LEAGUE_NAME));
  if (existing.length > 0) {
    console.log(`  → removing existing "${LEAGUE_NAME}" league…`);
    for (const row of existing) {
      await db.delete(leagues).where(eq(leagues.id, row.id));
    }
  }

  // User
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, USER_EMAIL))
    .limit(1);
  let user = existingUser[0];
  if (!user) {
    const passwordHash = await hash(USER_PASSWORD, 10);
    const [inserted] = await db
      .insert(users)
      .values({
        email: USER_EMAIL,
        passwordHash,
        name: USER_NAME,
      })
      .returning();
    user = inserted;
    console.log(`  ✓ user ${USER_EMAIL} (pwd: ${USER_PASSWORD})`);
  } else {
    console.log(`  → reusing user ${USER_EMAIL}`);
  }

  // League
  const [league] = await db
    .insert(leagues)
    .values({
      name: LEAGUE_NAME,
      inviteCode: INVITE_CODE,
      createdByUserId: user.id,
      seasonNumber: 3,
      weekNumber: 7,
      seasonLength: 15,
      matchTime: "21:00",
      visibility: "private",
      accentColor: "#dc2626",
      status: "active",
    })
    .returning();
  console.log(`  ✓ league ${LEAGUE_NAME} (${league.id})`);

  // Tactic personality seeds — bots vary so match-day isn't 16 identical
  // 4-3-3 mid-blocks. Same pool createStarterLeague uses; kept in sync
  // manually for now.
  const SEED_BOT_PERSONALITIES = [
    { formation: "4-3-3", mentality: 3, pressing: 3, tempo: 3 },
    { formation: "4-4-2", mentality: 2, pressing: 2, tempo: 2 },
    { formation: "4-2-3-1", mentality: 2, pressing: 3, tempo: 3 },
    { formation: "3-5-2", mentality: 3, pressing: 4, tempo: 3 },
    { formation: "5-3-2", mentality: 1, pressing: 2, tempo: 1 },
    { formation: "4-1-4-1", mentality: 2, pressing: 4, tempo: 2 },
    { formation: "4-3-3", mentality: 4, pressing: 4, tempo: 4 },
    { formation: "4-4-2", mentality: 1, pressing: 1, tempo: 2 },
  ];

  // Clubs — first is user's, rest bots
  const clubRows: Array<typeof clubs.$inferSelect> = [];
  for (const [i, c] of SEED_CLUBS.entries()) {
    const personality =
      i === 0
        ? SEED_BOT_PERSONALITIES[0]
        : SEED_BOT_PERSONALITIES[i % SEED_BOT_PERSONALITIES.length];
    const [row] = await db
      .insert(clubs)
      .values({
        leagueId: league.id,
        ownerUserId: i === 0 ? user.id : null,
        isBot: i !== 0,
        name: c.name,
        shortName: c.short,
        city: c.city,
        color: c.color,
        color2: c.color2,
        balanceCents: START_BALANCE_CENTS,
        formation: personality.formation,
        mentality: personality.mentality,
        pressing: personality.pressing,
        tempo: personality.tempo,
        // Vary prestige a bit so board goals get a meaningful spread.
        prestige: 50 + ((i * 7) % 40) - 10,
      })
      .returning();
    clubRows.push(row);
  }
  console.log(`  ✓ ${clubRows.length} clubs`);

  // Set the user's currentLeagueId so requireLeagueContext picks this up.
  await db
    .update(users)
    .set({ currentLeagueId: league.id })
    .where(eq(users.id, user.id));

  // Players — user's club gets the hand-crafted squad, others generated
  let totalPlayers = 0;
  for (const [idx, club] of clubRows.entries()) {
    if (idx === 0) {
      // User's club: use SQUAD from mock-data
      const rows = SQUAD.map((p) => ({
        leagueId: league.id,
        clubId: club.id,
        name: p.n,
        position: p.pos,
        role: p.role,
        secondaryRoles: JSON.stringify(HAND_SECONDARY[p.n] ?? []),
        jerseyNumber: p.num,
        age: p.age,
        nationality: p.nat,
        overall: p.ovr,
        potential: p.pot,
        fitness: p.fit ?? 90,
        morale: p.mor ?? 4,
        wageCents: (p.wage ?? 100_000) * 100,
        marketValueCents: (p.val ?? 1_000_000) * 100,
        contractYears: p.ctr ?? 3,
        status:
          p.status && p.status !== "listed"
            ? (p.status as "active" | "injured" | "suspended" | "training")
            : "active",
        lastRatings: JSON.stringify(p.form ?? []),
      }));
      await db.insert(players).values(rows);
      totalPlayers += rows.length;
    } else {
      // Bot club: generate composition
      const r = rng(club.id.split("-")[0].length * 997 + idx * 31);
      // Bot rating base ranges 72-82 roughly, with variation by index
      const ratingBase = 73 + ((idx * 7) % 9);
      const rows: Array<typeof players.$inferInsert> = [];
      let jersey = 1;
      for (const [pos, count] of SQUAD_COMPOSITION) {
        for (let k = 0; k < count; k++) {
          rows.push(
            generatePlayerForClub(
              league.id,
              club.id,
              ratingBase,
              jersey++,
              pos,
              r,
            ),
          );
        }
      }
      await db.insert(players).values(rows);
      totalPlayers += rows.length;
    }
  }
  console.log(`  ✓ ${totalPlayers} players`);

  // Transfer listings — grab ~12 high-overall bot-club players
  const botPlayers = await db
    .select()
    .from(players)
    .where(and(eq(players.leagueId, league.id)));
  const listCandidates = botPlayers
    .filter((p) => p.clubId !== clubRows[0].id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 12);
  const now = Date.now();
  for (const p of listCandidates) {
    const hoursOn = Math.floor(Math.random() * 20);
    const priceCents = Math.round(p.marketValueCents * (0.9 + Math.random() * 0.4));
    await db.insert(transferListings).values({
      leagueId: league.id,
      playerId: p.id,
      sellerClubId: null, // bot market
      isBotMarket: true,
      priceCents,
      originalPriceCents: priceCents,
      listedAt: new Date(now - hoursOn * 3600 * 1000),
      lastDecayAt: new Date(now - hoursOn * 3600 * 1000),
      expiresAt: new Date(now + 24 * 3600 * 1000),
    });
  }
  console.log(`  ✓ ${listCandidates.length} transfer listings`);

  // Fixtures — 15-round single round-robin, 1 round/day at the league's matchTime
  const clubIds = clubRows.map((c) => c.id);
  const rounds = roundRobin(clubIds);
  const { applyMatchTime } = await import("../lib/match-time");
  const today = applyMatchTime(new Date(), league.matchTime);
  let fixCount = 0;
  for (let r = 0; r < rounds.length; r++) {
    const scheduled = new Date(today);
    scheduled.setDate(today.getDate() + r);
    for (const m of rounds[r]) {
      const home = clubRows.find((c) => c.id === m.home);
      if (!home) continue;
      await db.insert(fixtures).values({
        leagueId: league.id,
        seasonNumber: 3,
        weekNumber: r + 1,
        homeClubId: m.home,
        awayClubId: m.away,
        venue: `${home.city} Arena`,
        scheduledAt: scheduled,
        status: "scheduled",
      });
      fixCount++;
    }
  }
  console.log(`  ✓ ${fixCount} fixtures across ${rounds.length} rounds`);

  // Seed feed events
  await db.insert(feedEvents).values([
    {
      leagueId: league.id,
      clubId: clubRows[1].id,
      eventType: "transfer",
      text: "Ahmet D. → V. Laszlo'yu €42M karşılığında aldı",
    },
    {
      leagueId: league.id,
      clubId: clubRows[2].id,
      eventType: "match",
      text: "Elif Ö. derbisini 3-1 kazandı (vs Kaan T.)",
    },
    {
      leagueId: league.id,
      clubId: clubRows[4].id,
      eventType: "scout",
      text: "Mehmet S. kaşif gönderdi (Brezilya · FWD)",
    },
  ]);

  // V4 init: assign board goals (prestige-derived) + generate cup bracket.
  // Without these the seeded league has empty board widgets and no cup.
  const { assignSeasonGoals } = await import("../lib/jobs/board");
  const { generateCupBracket } = await import("../lib/jobs/cup");
  await assignSeasonGoals(league.id);
  await generateCupBracket(league.id, league.seasonNumber);
  console.log("  ✓ board goals + cup bracket initialized");

  console.log("\n✅ Seeding done.");
  console.log(`   Login: ${USER_EMAIL} / ${USER_PASSWORD}`);
  console.log(`   League invite: ${INVITE_CODE}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
