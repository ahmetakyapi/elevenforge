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
import { CLUBS as SEED_CLUBS, SQUAD as HAND_SQUAD } from "@/lib/mock-data";
import { applyMatchTime } from "@/lib/match-time";
import { assignSeasonGoals } from "@/lib/jobs/board";
import { generateCupBracket } from "@/lib/jobs/cup";
import type { Position } from "@/types";

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
// Expanded 2026-era international pool — wider variety so rival bot squads
// don't feel like 12 generic "V. Laszlo" clones. Names are fictional but
// stylistically modern (mix of West/Central/Eastern Africa, South America,
// North Africa, Europe, and Asia).
const INTL = [
  { name: "O. Nkemba",      nat: "NG" }, { name: "J. Okafor",       nat: "NG" },
  { name: "K. Boateng",     nat: "GH" }, { name: "S. Diallo",       nat: "SN" },
  { name: "M. Traoré",      nat: "ML" }, { name: "A. Kouassi",      nat: "CI" },
  { name: "V. Laszlo",      nat: "HU" }, { name: "M. Kovač",        nat: "HR" },
  { name: "N. Petrović",    nat: "RS" }, { name: "D. Marković",     nat: "RS" },
  { name: "A. Diakité",     nat: "FR" }, { name: "R. Mbappé",       nat: "FR" },
  { name: "T. Rabiot",      nat: "FR" }, { name: "J. Koundé",       nat: "FR" },
  { name: "L. Pereira",     nat: "BR" }, { name: "G. dos Santos",   nat: "BR" },
  { name: "R. Almeida",     nat: "BR" }, { name: "E. Martins",      nat: "BR" },
  { name: "N. Álvarez",     nat: "AR" }, { name: "F. Domínguez",    nat: "AR" },
  { name: "S. Herrera",     nat: "MX" }, { name: "C. Rojas",        nat: "CL" },
  { name: "F. Schulze",     nat: "DE" }, { name: "L. Hoffmann",     nat: "DE" },
  { name: "R. Papadakis",   nat: "GR" }, { name: "I. Moreno",       nat: "ES" },
  { name: "P. Navarro",     nat: "ES" }, { name: "D. Romero",       nat: "ES" },
  { name: "T. Novák",       nat: "CZ" }, { name: "H. Sørensen",     nat: "DK" },
  { name: "O. Berg",        nat: "NO" }, { name: "E. Lindqvist",    nat: "SE" },
  { name: "K. Bakker",      nat: "NL" }, { name: "D. van Bergen",   nat: "NL" },
  { name: "Y. Yamamoto",    nat: "JP" }, { name: "S. Kang",         nat: "KR" },
  { name: "O. Koné",        nat: "CI" }, { name: "A. El-Masry",     nat: "EG" },
  { name: "M. Ben Ali",     nat: "MA" }, { name: "K. Taleb",        nat: "DZ" },
  { name: "L. Vanniewel",   nat: "BE" }, { name: "V. Orlov",        nat: "RU" },
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
  // 35% international mix — gives rival squads a believable 2026 feel where
  // even mid-tier Turkish clubs run 4-6 foreign players. Below 30% produced
  // mostly-Turkish rosters that looked repetitive after a couple leagues.
  if (r() < 0.35) return pick(INTL, r);
  const first = pick(TR_FIRST, r);
  const last = pick(TR_LAST, r);
  return { name: `${first} ${last}`, nat: "TR" };
}

// Hand-crafted roles map for the SQUAD export — mirrored from seed.ts so
// the user's brand-new league starts with a recognisable 2026 line-up
// rather than 20 procedurally generated names they'll never remember.
const HAND_SECONDARY: Record<string, string[]> = {
  "Milan Škriniar": ["LB"],
  "Bright Osayi-Samuel": ["RW", "CB"],
  "Mert Müldür": ["CB"],
  "Jayden Oosterwolde": ["CB", "LW"],
  "Archie Brown": ["LW"],
  "Sofyan Amrabat": ["CM", "CB"],
  "N'Golo Kanté": ["CM"],
  "Mateo Guendouzi": ["CDM", "AM"],
  "İsmail Yüksek": ["CDM", "AM"],
  "Sebastian Szymański": ["CM", "LW"],
  "Marco Asensio": ["RW", "LW"],
  "Oğuz Aydın": ["LW", "AM"],
  "Kerem Aktürkoğlu": ["RW", "ST"],
  "Anderson Talisca": ["AM", "CF"],
  "Youssef En-Nesyri": ["CF"],
  "Cherif Ndiaye": ["CF"],
};

// Per-role attribute offsets from overall. Clamped into [30, 99] after
// sampling. Keeps strikers' finishing above their tackling even at equal
// `overall`, so the match engine can use the right attribute per context.
type AttrOffsets = {
  pace: number;
  shooting: number;
  passing: number;
  defending: number;
  physical: number;
  goalkeeping: number;
};
const ROLE_ATTR_OFFSETS: Record<string, AttrOffsets> = {
  GK:  { pace: -12, shooting: -45, passing:  -5, defending: -15, physical:   0, goalkeeping: +18 },
  CB:  { pace:  -5, shooting: -22, passing:  -6, defending: +12, physical:  +8, goalkeeping: -40 },
  LB:  { pace:  +6, shooting: -16, passing:  +1, defending:  +4, physical:   0, goalkeeping: -40 },
  RB:  { pace:  +6, shooting: -16, passing:  +1, defending:  +4, physical:   0, goalkeeping: -40 },
  CDM: { pace:  -3, shooting: -10, passing:  +5, defending:  +6, physical:  +5, goalkeeping: -40 },
  CM:  { pace:   0, shooting:  -4, passing: +10, defending:  -3, physical:  +1, goalkeeping: -40 },
  AM:  { pace:  +3, shooting:  +4, passing: +10, defending: -12, physical:  -3, goalkeeping: -40 },
  LW:  { pace: +11, shooting:  +3, passing:  +2, defending: -11, physical:  -4, goalkeeping: -40 },
  RW:  { pace: +11, shooting:  +3, passing:  +2, defending: -11, physical:  -4, goalkeeping: -40 },
  ST:  { pace:  +6, shooting: +13, passing:  -6, defending: -18, physical:  +6, goalkeeping: -40 },
  CF:  { pace:  +4, shooting: +10, passing:  -1, defending: -15, physical:  +5, goalkeeping: -40 },
};

function rollAttr(base: number, offset: number, r: () => number): number {
  const noise = (r() - 0.5) * 8; // ±4
  return Math.max(30, Math.min(99, Math.round(base + offset + noise)));
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
  // Age: triangular-ish distribution peaking at 25-28 (real squad shape).
  // 60% rolls land in 22-30, 20% in youth 17-21, 20% in vets 31-34.
  const ageRoll = r();
  const age =
    ageRoll < 0.2
      ? 17 + Math.floor(r() * 5) // 17-21
      : ageRoll < 0.8
        ? 22 + Math.floor(r() * 9) // 22-30
        : 31 + Math.floor(r() * 4); // 31-34
  const ovr = Math.max(
    55,
    Math.min(92, Math.round(clubRatingBase + (r() - 0.5) * 10)),
  );
  const potCap = Math.min(95, ovr + Math.floor(r() * 12));
  const pot = age <= 21 ? Math.max(ovr + 3, potCap) : Math.max(ovr, potCap);
  const offsets = ROLE_ATTR_OFFSETS[role] ?? ROLE_ATTR_OFFSETS.CM;
  const pace = rollAttr(ovr, offsets.pace, r);
  const shooting = rollAttr(ovr, offsets.shooting, r);
  const passing = rollAttr(ovr, offsets.passing, r);
  const defending = rollAttr(ovr, offsets.defending, r);
  const physical = rollAttr(ovr, offsets.physical, r);
  const goalkeeping = rollAttr(ovr, offsets.goalkeeping, r);
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
    pace,
    shooting,
    passing,
    defending,
    physical,
    goalkeeping,
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
  matchTime?: string;
  visibility?: "private" | "public";
  accentColor?: string;
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
      matchTime: input.matchTime ?? "21:00",
      visibility: input.visibility ?? "private",
      accentColor: input.accentColor ?? "#dc2626",
      status: "active",
      commissionerOnlyAdvance: true,
      manualAdvanceEnabled: false,
    })
    .returning();

  // 16 clubs — shuffle the mock CLUBS and let user own the first one,
  // renamed to their chosen team name.
  //
  // Tiered league hierarchy (realistic power distribution):
  //   tier 0: 3 top clubs    — base 84 squad, prestige 85, budget 6B  (champion goal)
  //   tier 1: 4 upper-mid    — base 78 squad, prestige 68, budget 5B  (top4 goal)
  //   tier 2: 5 mid          — base 73 squad, prestige 50, budget 4.5B (midtable goal)
  //   tier 3: 4 bottom       — base 68 squad, prestige 30, budget 3.5B (survive goal)
  // User's club sits in the mid tier — they fight both up and down.
  type TierMeta = { base: number; prestige: number; balance: number };
  const TIER_TEMPLATE: TierMeta[] = [
    { base: 84, prestige: 85, balance: 6_000_000_000 },
    { base: 84, prestige: 82, balance: 5_800_000_000 },
    { base: 84, prestige: 80, balance: 5_600_000_000 },
    { base: 78, prestige: 70, balance: 5_000_000_000 },
    { base: 78, prestige: 68, balance: 5_000_000_000 },
    { base: 78, prestige: 66, balance: 4_800_000_000 },
    { base: 78, prestige: 66, balance: 4_800_000_000 },
    { base: 73, prestige: 50, balance: 4_500_000_000 },
    { base: 73, prestige: 50, balance: 4_500_000_000 },
    { base: 73, prestige: 48, balance: 4_400_000_000 },
    { base: 73, prestige: 48, balance: 4_400_000_000 },
    { base: 73, prestige: 46, balance: 4_300_000_000 },
    { base: 68, prestige: 32, balance: 3_500_000_000 },
    { base: 68, prestige: 30, balance: 3_500_000_000 },
    { base: 68, prestige: 28, balance: 3_300_000_000 },
    { base: 68, prestige: 26, balance: 3_200_000_000 },
  ];
  // User always lands in a mid-tier slot; shuffle bot tiers across the rest.
  const userTier = TIER_TEMPLATE[7];
  const otherTiers = [
    ...TIER_TEMPLATE.slice(0, 7),
    ...TIER_TEMPLATE.slice(8),
  ].sort(() => Math.random() - 0.5);
  const tiers: TierMeta[] = [userTier, ...otherTiers];

  const clubMeta = [...SEED_CLUBS].sort(() => Math.random() - 0.5);
  const clubRows: Array<typeof clubs.$inferSelect> = [];
  for (let i = 0; i < 16; i++) {
    const meta = clubMeta[i];
    const tier = tiers[i];
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
        balanceCents: tier.balance,
        prestige: tier.prestige,
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

  // Players — user's club gets the hand-crafted HAND_SQUAD (matches the
  // demo seed, so new users open /squad and see a recognisable line-up),
  // while bot clubs are procedural with tier-aware base.
  const allPlayers: Array<typeof players.$inferInsert> = [];
  for (const [idx, club] of clubRows.entries()) {
    const r = rng(club.id.charCodeAt(0) * 997 + idx * 31 + Date.now());
    if (idx === 0) {
      for (const p of HAND_SQUAD) {
        const offsets = ROLE_ATTR_OFFSETS[p.role] ?? ROLE_ATTR_OFFSETS.CM;
        allPlayers.push({
          leagueId: league.id,
          clubId: club.id,
          name: p.n,
          position: p.pos,
          role: p.role,
          secondaryRoles: JSON.stringify(HAND_SECONDARY[p.n] ?? []),
          jerseyNumber: p.num ?? null,
          age: p.age,
          nationality: p.nat,
          overall: p.ovr,
          potential: p.pot,
          pace: rollAttr(p.ovr, offsets.pace, r),
          shooting: rollAttr(p.ovr, offsets.shooting, r),
          passing: rollAttr(p.ovr, offsets.passing, r),
          defending: rollAttr(p.ovr, offsets.defending, r),
          physical: rollAttr(p.ovr, offsets.physical, r),
          goalkeeping: rollAttr(p.ovr, offsets.goalkeeping, r),
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
        });
      }
      continue;
    }
    const ratingBase = tiers[idx].base;
    let jersey = 1;
    for (const [pos, count] of SQUAD_COMPOSITION) {
      for (let k = 0; k < count; k++) {
        allPlayers.push(
          generatePlayer(league.id, club.id, ratingBase, jersey++, pos, r),
        );
      }
    }
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
