/**
 * Creates a fresh starter league for a newly-registered user.
 * 16 clubs (user owns one, rest are bots), 20 players per club,
 * 15-round round-robin fixture schedule, handful of transfer listings.
 *
 * Called from the register server action so every new signup lands in a
 * fully populated world (no dead-end on /dashboard).
 */
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  clubs,
  feedEvents,
  fixtures,
  leagues,
  players,
  transferListings,
  users,
} from "@/lib/schema";
import { CLUBS as SEED_CLUBS } from "@/lib/mock-data";
import { applyMatchTime } from "@/lib/match-time";
import { assignSeasonGoals } from "@/lib/jobs/board";
import { generateCupBracket } from "@/lib/jobs/cup";
import type { Position } from "@/types";

const START_BALANCE_CENTS = 4_500_000_000;
const SQUAD_COMPOSITION: Array<[Position, number]> = [
  ["GK", 2],
  ["DEF", 6],
  ["MID", 7],
  ["FWD", 5],
];

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
];

const ROLES: Record<Position, string[]> = {
  GK: ["GK"],
  DEF: ["CB", "LB", "RB"],
  MID: ["CDM", "CM", "AM", "LW", "RW"],
  FWD: ["ST", "CF", "LW", "RW"],
};

// Secondary roles that share movement patterns with the primary role.
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
  if (r() < 0.2) return pick(INTL, r);
  const first = pick(TR_FIRST, r);
  const last = pick(TR_LAST, r);
  return { name: `${first} ${last}`, nat: "TR" };
}

function generatePlayer(
  leagueId: string,
  clubId: string,
  clubRatingBase: number,
  jersey: number,
  pos: Position,
  r: () => number,
): typeof players.$inferInsert {
  const { name, nat } = generateName(r);
  const role = pick(ROLES[pos], r);
  const secondaryRoles = generateSecondaryRoles(role, r);
  const age = Math.floor(r() * 18) + 17;
  const ovr = Math.max(
    60,
    Math.min(90, Math.round(clubRatingBase + (r() - 0.5) * 14)),
  );
  const potCap = Math.min(95, ovr + Math.floor(r() * 12));
  const pot = age <= 21 ? Math.max(ovr + 3, potCap) : Math.max(ovr, potCap);
  const valueEur = Math.max(
    300_000,
    Math.round(
      Math.pow(ovr - 55, 2.6) * 22_000 * (1 + (pot - ovr) * 0.08) *
        (age <= 24 ? 1.2 : age >= 31 ? 0.7 : 1.0),
    ),
  );
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
    wageCents: Math.max(12_000, Math.round(valueEur / 200)) * 100,
    marketValueCents: valueEur * 100,
    contractYears: 1 + Math.floor(r() * 5),
    status: "active",
    lastRatings: JSON.stringify(
      Array.from({ length: 5 }, () => Number((6 + r() * 2.5).toFixed(1))),
    ),
  };
}

function roundRobin(teamIds: string[]) {
  const teams = teamIds.slice();
  if (teams.length % 2 !== 0) teams.push("BYE");
  const rounds: Array<Array<{ home: string; away: string }>> = [];
  const half = teams.length / 2;
  let arr = teams.slice();
  for (let r = 0; r < arr.length - 1; r++) {
    const matches: Array<{ home: string; away: string }> = [];
    for (let i = 0; i < half; i++) {
      const t1 = arr[i];
      const t2 = arr[arr.length - 1 - i];
      if (t1 !== "BYE" && t2 !== "BYE") {
        matches.push(
          r % 2 === 0 ? { home: t1, away: t2 } : { home: t2, away: t1 },
        );
      }
    }
    rounds.push(matches);
    const first = arr[0];
    const rest = arr.slice(1);
    rest.unshift(rest.pop()!);
    arr = [first, ...rest];
  }
  return rounds;
}

function generateInviteCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

/**
 * Allocate a unique invite code, retrying on collision. After ~10 attempts the
 * caller is in trouble — either the alphabet is exhausted (extremely unlikely
 * with 32^6 ≈ 1B combinations) or the DB is unreachable.
 */
async function allocInviteCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = generateInviteCode();
    const clash = await db
      .select({ id: leagues.id })
      .from(leagues)
      .where(eq(leagues.inviteCode, candidate))
      .limit(1);
    if (clash.length === 0) return candidate;
  }
  throw new Error("invite-code allocation failed after 10 attempts");
}

// Tactic personality presets — each bot picks one at league creation. Gives
// every match-day visible variety instead of 16 identical 4-3-3 mid-blocks.
const BOT_PERSONALITIES: Array<{
  formation: string;
  mentality: number;
  pressing: number;
  tempo: number;
}> = [
  { formation: "4-3-3", mentality: 3, pressing: 3, tempo: 3 },
  { formation: "4-4-2", mentality: 2, pressing: 2, tempo: 2 },
  { formation: "4-2-3-1", mentality: 2, pressing: 3, tempo: 3 },
  { formation: "3-5-2", mentality: 3, pressing: 4, tempo: 3 },
  { formation: "5-3-2", mentality: 1, pressing: 2, tempo: 1 },
  { formation: "4-1-4-1", mentality: 2, pressing: 4, tempo: 2 },
  { formation: "4-3-3", mentality: 4, pressing: 4, tempo: 4 },
  { formation: "4-4-2", mentality: 1, pressing: 1, tempo: 2 },
];

export async function createStarterLeague(input: {
  userId: string;
  teamName: string;
}): Promise<{ leagueId: string; clubId: string; inviteCode: string }> {
  const leagueName = `${input.teamName} Ligi`;
  const inviteCode = await allocInviteCode();

  const [league] = await db
    .insert(leagues)
    .values({
      name: leagueName,
      inviteCode,
      createdByUserId: input.userId,
      seasonNumber: 1,
      weekNumber: 0,
      seasonLength: 15,
      matchTime: "21:00",
      visibility: "private",
      accentColor: "#dc2626",
      status: "active",
      commissionerOnlyAdvance: true,
    })
    .returning();

  // 16 clubs — shuffle the mock CLUBS and let user own the first one,
  // renamed to their chosen team name.
  const clubMeta = [...SEED_CLUBS].sort(() => Math.random() - 0.5);
  const clubRows: Array<typeof clubs.$inferSelect> = [];
  for (let i = 0; i < 16; i++) {
    const meta = clubMeta[i];
    const personality =
      i === 0
        ? BOT_PERSONALITIES[0] // user defaults to balanced 4-3-3
        : BOT_PERSONALITIES[i % BOT_PERSONALITIES.length];
    const [row] = await db
      .insert(clubs)
      .values({
        leagueId: league.id,
        ownerUserId: i === 0 ? input.userId : null,
        isBot: i !== 0,
        name: i === 0 ? input.teamName : meta.name,
        shortName: i === 0
          ? input.teamName.split(/\s+/).map((w) => w[0]).slice(0, 3).join("").toUpperCase()
          : meta.short,
        city: meta.city,
        color: meta.color,
        color2: meta.color2,
        balanceCents: START_BALANCE_CENTS,
        formation: personality.formation,
        mentality: personality.mentality,
        pressing: personality.pressing,
        tempo: personality.tempo,
      })
      .returning();
    clubRows.push(row);
  }

  // Set the user's currentLeagueId so requireLeagueContext picks this league
  // even after they later join a friend's league.
  await db
    .update(users)
    .set({ currentLeagueId: league.id })
    .where(eq(users.id, input.userId));

  // Players — 20 per club, all procedurally generated
  let jerseyBase = 0;
  const allPlayers: Array<typeof players.$inferInsert> = [];
  for (const [idx, club] of clubRows.entries()) {
    const r = rng(club.id.charCodeAt(0) * 997 + idx * 31 + Date.now());
    const ratingBase = 73 + ((idx * 7) % 9);
    let jersey = 1;
    for (const [pos, count] of SQUAD_COMPOSITION) {
      for (let k = 0; k < count; k++) {
        allPlayers.push(
          generatePlayer(league.id, club.id, ratingBase, jersey++, pos, r),
        );
      }
    }
    jerseyBase += 20;
  }
  await db.insert(players).values(allPlayers);

  // Fixtures — 15 round single round-robin, scheduled at the league's
  // chosen matchTime ("HH:MM") rather than the previous hardcoded 21:00.
  const clubIds = clubRows.map((c) => c.id);
  const rounds = roundRobin(clubIds);
  const today = applyMatchTime(new Date(), league.matchTime);
  const fixtureRows: Array<typeof fixtures.$inferInsert> = [];
  for (let r = 0; r < rounds.length; r++) {
    const scheduled = new Date(today);
    scheduled.setDate(today.getDate() + r);
    for (const m of rounds[r]) {
      const home = clubRows.find((c) => c.id === m.home);
      if (!home) continue;
      fixtureRows.push({
        leagueId: league.id,
        seasonNumber: 1,
        weekNumber: r + 1,
        homeClubId: m.home,
        awayClubId: m.away,
        venue: `${home.city} Arena`,
        scheduledAt: scheduled,
        status: "scheduled",
      });
    }
  }
  await db.insert(fixtures).values(fixtureRows);

  // Seed 10 transfer listings from bot clubs. Re-query to get generated IDs.
  const botClubIds = new Set(clubRows.slice(1).map((c) => c.id));
  const leaguePlayers = await db
    .select()
    .from(players)
    .where(eq(players.leagueId, league.id));
  const pickList = leaguePlayers
    .filter((p) => p.clubId && botClubIds.has(p.clubId))
    .sort(() => Math.random() - 0.5)
    .slice(0, 10);
  if (pickList.length > 0) {
    const now = Date.now();
    await db.insert(transferListings).values(
      pickList.map((p) => {
        const priceCents = Math.round(
          Number(p.marketValueCents) * (0.9 + Math.random() * 0.4),
        );
        return {
          leagueId: league.id,
          playerId: p.id,
          sellerClubId: null,
          isBotMarket: true,
          priceCents,
          originalPriceCents: priceCents,
          listedAt: new Date(now - Math.floor(Math.random() * 20) * 3600 * 1000),
          lastDecayAt: new Date(now),
          expiresAt: new Date(now + 30 * 3600 * 1000),
        };
      }),
    );
  }

  // Welcome feed event
  await db.insert(feedEvents).values({
    leagueId: league.id,
    clubId: clubRows[0].id,
    eventType: "morale",
    text: `${input.teamName} ligine katıldı. İlk maç yarın ${league.matchTime}.`,
  });

  // V4 systems — assign board goals + generate the season's cup bracket so
  // the first season has the full feature set (not just the league round-robin).
  await assignSeasonGoals(league.id);
  await generateCupBracket(league.id, league.seasonNumber);

  return {
    leagueId: league.id,
    clubId: clubRows[0].id,
    inviteCode,
  };
}
