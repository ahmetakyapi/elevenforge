/**
 * Creates a fresh starter league for a newly-registered user.
 * 16 clubs (user owns one, rest are bots), 20 players per club,
 * 15-round round-robin fixture schedule, handful of transfer listings.
 *
 * Called from the register server action so every new signup lands in a
 * fully populated world (no dead-end on /dashboard).
 */
import { eq, inArray } from "drizzle-orm";
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
import { SQUAD_PACKS, SQUAD_PACKS_D2 } from "@/lib/squad-packs";
import { packPlayerRows, tierFor } from "@/lib/league-setup";
import { matchKickoff } from "@/lib/match-time";
import { deriveShortName } from "@/lib/utils";
import { roundRobin as sharedRoundRobin } from "@/lib/jobs/season";
import { assignSeasonGoals } from "@/lib/jobs/board";
import { generateCupBracket } from "@/lib/jobs/cup";
import type { Position } from "@/types";
import { marketValueCents, seasonBudgetCents } from "@/lib/economy";

const SQUAD_COMPOSITION: Array<[Position, number]> = [
  ["GK", 2],
  ["DEF", 6],
  ["MID", 7],
  ["FWD", 5],
];

/**
 * A league mirrors the real Süper Lig, which is 18 clubs from 2026-27 (it was
 * 16 through 2025-26). The fixture list is a double round-robin, so the
 * season is 2 × (18 − 1) = 34 rounds. The cup stays a 16-team knockout and
 * draws 16 of the 18, which is how a real cup with a qualifying round works.
 */
const CLUB_COUNT = 18;

const TR_FIRST = [
  "Ahmet",
  "Mehmet",
  "Mustafa",
  "Emre",
  "Burak",
  "Ali",
  "Yusuf",
  "Kerem",
  "Efe",
  "Arda",
  "Onur",
  "Tolga",
  "Kaan",
  "Berke",
  "Hakan",
  "Gökhan",
  "Ozan",
  "Okan",
  "Barış",
  "İlkay",
  "Oğuzhan",
  "Cengiz",
  "Taylan",
  "Umut",
  "Doğan",
  "Enes",
  "Fatih",
  "Halil",
  "İsmail",
  "Orkun",
  "Semih",
  "Sinan",
  "Tayfun",
  "Uğurcan",
  "Yunus",
  "Zeki",
  "Çağlar",
  "Merih",
  "Ferdi",
  "Kenan",
];
const TR_LAST = [
  "Yılmaz",
  "Kaya",
  "Demir",
  "Çelik",
  "Şahin",
  "Aydın",
  "Öztürk",
  "Aslan",
  "Doğan",
  "Kılıç",
  "Arslan",
  "Yıldız",
  "Taş",
  "Erdoğan",
  "Koç",
  "Polat",
  "Güneş",
  "Güler",
  "Demirci",
  "Koçak",
  "Çakır",
  "Akgün",
  "Aktürkoğlu",
  "Çalhanoğlu",
  "Şanlı",
  "Toraman",
  "Çolak",
  "Türkoğlu",
  "Sezer",
  "Akın",
];
// Expanded 2026-era international pool — wider variety so rival bot squads
// don't feel like 12 generic "V. Laszlo" clones. Names are fictional but
// stylistically modern (mix of West/Central/Eastern Africa, South America,
// North Africa, Europe, and Asia).
const INTL = [
  { name: "O. Nkemba", nat: "NG" },
  { name: "J. Okafor", nat: "NG" },
  { name: "K. Boateng", nat: "GH" },
  { name: "S. Diallo", nat: "SN" },
  { name: "M. Traoré", nat: "ML" },
  { name: "A. Kouassi", nat: "CI" },
  { name: "V. Laszlo", nat: "HU" },
  { name: "M. Kovač", nat: "HR" },
  { name: "N. Petrović", nat: "RS" },
  { name: "D. Marković", nat: "RS" },
  { name: "A. Diakité", nat: "FR" },
  { name: "R. Mbappé", nat: "FR" },
  { name: "T. Rabiot", nat: "FR" },
  { name: "J. Koundé", nat: "FR" },
  { name: "L. Pereira", nat: "BR" },
  { name: "G. dos Santos", nat: "BR" },
  { name: "R. Almeida", nat: "BR" },
  { name: "E. Martins", nat: "BR" },
  { name: "N. Álvarez", nat: "AR" },
  { name: "F. Domínguez", nat: "AR" },
  { name: "S. Herrera", nat: "MX" },
  { name: "C. Rojas", nat: "CL" },
  { name: "F. Schulze", nat: "DE" },
  { name: "L. Hoffmann", nat: "DE" },
  { name: "R. Papadakis", nat: "GR" },
  { name: "I. Moreno", nat: "ES" },
  { name: "P. Navarro", nat: "ES" },
  { name: "D. Romero", nat: "ES" },
  { name: "T. Novák", nat: "CZ" },
  { name: "H. Sørensen", nat: "DK" },
  { name: "O. Berg", nat: "NO" },
  { name: "E. Lindqvist", nat: "SE" },
  { name: "K. Bakker", nat: "NL" },
  { name: "D. van Bergen", nat: "NL" },
  { name: "Y. Yamamoto", nat: "JP" },
  { name: "S. Kang", nat: "KR" },
  { name: "O. Koné", nat: "CI" },
  { name: "A. El-Masry", nat: "EG" },
  { name: "M. Ben Ali", nat: "MA" },
  { name: "K. Taleb", nat: "DZ" },
  { name: "L. Vanniewel", nat: "BE" },
  { name: "V. Orlov", nat: "RU" },
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

// Secondary roles for the Fenerbahçe 2025-26 squad (Haziran 2026).
// Keys must match `n` field in squad-packs.ts FENERBAHCE pack exactly.

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
  GK: {
    pace: -12,
    shooting: -45,
    passing: -5,
    defending: -15,
    physical: 0,
    goalkeeping: +18,
  },
  CB: {
    pace: -5,
    shooting: -22,
    passing: -6,
    defending: +12,
    physical: +8,
    goalkeeping: -40,
  },
  LB: {
    pace: +6,
    shooting: -16,
    passing: +1,
    defending: +4,
    physical: 0,
    goalkeeping: -40,
  },
  RB: {
    pace: +6,
    shooting: -16,
    passing: +1,
    defending: +4,
    physical: 0,
    goalkeeping: -40,
  },
  CDM: {
    pace: -3,
    shooting: -10,
    passing: +5,
    defending: +6,
    physical: +5,
    goalkeeping: -40,
  },
  CM: {
    pace: 0,
    shooting: -4,
    passing: +10,
    defending: -3,
    physical: +1,
    goalkeeping: -40,
  },
  AM: {
    pace: +3,
    shooting: +4,
    passing: +10,
    defending: -12,
    physical: -3,
    goalkeeping: -40,
  },
  LW: {
    pace: +11,
    shooting: +3,
    passing: +2,
    defending: -11,
    physical: -4,
    goalkeeping: -40,
  },
  RW: {
    pace: +11,
    shooting: +3,
    passing: +2,
    defending: -11,
    physical: -4,
    goalkeeping: -40,
  },
  ST: {
    pace: +6,
    shooting: +13,
    passing: -6,
    defending: -18,
    physical: +6,
    goalkeeping: -40,
  },
  CF: {
    pace: +4,
    shooting: +10,
    passing: -1,
    defending: -15,
    physical: +5,
    goalkeeping: -40,
  },
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
  const valueCents = marketValueCents(ovr, pot, age);
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
    marketValueCents: valueCents,
    status: "active",
    lastRatings: JSON.stringify(
      Array.from({ length: 5 }, () => Number((6 + r() * 2.5).toFixed(1))),
    ),
  };
}

function roundRobin(teamIds: string[]) {
  // Shared implementation — see lib/jobs/season.ts for why the schedule is a
  // mirrored double round-robin rather than a single circle.
  return sharedRoundRobin(teamIds);
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
  manualAdvanceEnabled?: boolean;
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
      // A double round-robin: 2 × (clubs − 1) rounds. This said 15 while the
      // generator wrote 30, so every "week X of Y" readout was wrong.
      seasonLength: (CLUB_COUNT - 1) * 2,
      matchTime: input.matchTime ?? "21:00",
      visibility: input.visibility ?? "private",
      accentColor: input.accentColor ?? "#dc2626",
      // Stays in "lobby" until the squads, fixtures and cup bracket all exist
      // — see the rollback note below. A league is only playable once it is
      // whole, and "active" is what tells the rest of the app it is.
      status: "lobby",
      commissionerOnlyAdvance: true,
      manualAdvanceEnabled: input.manualAdvanceEnabled ?? false,
    })
    .returning();

  // Everything from here builds the league's contents. It is a long sequence
  // of independent writes, and until now nothing tied them together: if any
  // one of them failed — a Neon timeout is enough — the half-built league was
  // left behind, already marked "active", and whoever created it was dropped
  // into a league of empty clubs with no fixtures. That is exactly what
  // happened to "BayburtSpor Ligi": 16 clubs, 0 players, 0 fixtures, one real
  // user stuck in it with no way out.
  //
  // The league row is the root of the object graph and every table below it
  // cascades on delete, so deleting it is a complete rollback. That gives the
  // operation the same all-or-nothing property a transaction would, without
  // threading a handle through assignSeasonGoals and generateCupBracket.
  try {
    // Both tiers — the user owns the first top-flight club,
    // renamed to their chosen team name.
    //
    // One club per Süper Lig pack. User owns pack 0 (Fenerbahçe),
    // renamed to their input teamName so the UI still reads "their" club.
    // Budget + prestige follow pack order so Big-4 start richer / more
    // prestigious than the Anatolian clubs — board goals and transfer
    // fees feel right out of the box.
    // Only `prestige` is read from the table now. The opening budget is
    // derived from it by seasonBudgetCents, so a club's money and its standing
    // can never drift apart — and so the number a club starts season one with
    // is computed the same way as the one it starts season five with, rather
    // than by a hand-kept table that only the league creator ever consulted.
    // Both tiers are created up front: the second division is a real league
    // that plays its own calendar, not a holding pen. Clubs move between them
    // at the season roll (lib/jobs/promotion.ts).
    const ALL_PACKS = [
      ...SQUAD_PACKS.map((p) => ({ pack: p, division: 1 as const })),
      ...SQUAD_PACKS_D2.map((p) => ({ pack: p, division: 2 as const })),
    ];

    const clubRows: Array<typeof clubs.$inferSelect> = [];
    for (let i = 0; i < ALL_PACKS.length; i++) {
      const { pack, division } = ALL_PACKS[i];
      const meta = pack.club;
      // Second-division clubs are poorer and less prestigious across the board.
      const tier = tierFor(i, division);
      const personality =
        i === 0
          ? BOT_PERSONALITIES[0] // user defaults to balanced 4-3-3
          : BOT_PERSONALITIES[i % BOT_PERSONALITIES.length];
      const [row] = await db
        .insert(clubs)
        .values({
          leagueId: league.id,
          division,
          ownerUserId: i === 0 ? input.userId : null,
          isBot: i !== 0,
          // Bots are run by the AI manager from day one.
          aiManaged: i !== 0,
          // User renames club 0 to their chosen team name; bots keep the
          // real club name so derbies feel authentic.
          name: i === 0 ? input.teamName : meta.name,
          shortName:
            i === 0
              ? deriveShortName(input.teamName)
              : meta.short,
          city: meta.city,
          color: meta.color,
          color2: meta.color2,
          balanceCents: seasonBudgetCents(tier.prestige),
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

    // Players — every club pulls its squad straight from its pack. Indexed
    // against ALL_PACKS, not SQUAD_PACKS: clubRows now spans both divisions,
    // so a top-flight-only lookup ran off the end once the second tier was
    // added and crashed league creation.
    const allPlayers: Array<typeof players.$inferInsert> = [];
    for (const [idx, club] of clubRows.entries()) {
      const r = rng(club.id.charCodeAt(0) * 997 + idx * 31 + Date.now());
      const pack = ALL_PACKS[idx].pack;
      allPlayers.push(...packPlayerRows(league.id, club.id, pack, r));
    }
    await db.insert(players).values(allPlayers);

    // Fixtures — a double round-robin PER DIVISION, both playing on the same
    // match days at the league's local kick-off time.
    const now = new Date();
    const fixtureRows: Array<typeof fixtures.$inferInsert> = [];
    for (const division of [1, 2] as const) {
      const divisionIds = clubRows
        .filter((c) => c.division === division)
        .map((c) => c.id);
      if (divisionIds.length < 2) continue;
      const rounds = roundRobin(divisionIds);
      for (let r = 0; r < rounds.length; r++) {
        // Round r kicks off r days from today at the league's local match time.
        const scheduled = matchKickoff(
          now,
          r,
          league.matchTime,
          league.timeZone,
        );
        for (const m of rounds[r]) {
          const home = clubRows.find((c) => c.id === m.home);
          if (!home) continue;
          fixtureRows.push({
            leagueId: league.id,
            seasonNumber: 1,
            division,
            weekNumber: r + 1,
            homeClubId: m.home,
            awayClubId: m.away,
            venue: `${home.city} Arena`,
            scheduledAt: scheduled,
            status: "scheduled",
          });
        }
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
            // The owning club, NOT null. A null seller means the sale pays
            // nobody: the club loses the player and the money vanishes. The
            // same bug was fixed in lib/jobs/transfer-bots.ts; this path still
            // had it, so every new league opened with listings that drained
            // whichever bot owned them.
            sellerClubId: p.clubId,
            isBotMarket: true,
            priceCents,
            originalPriceCents: priceCents,
            listedAt: new Date(
              now - Math.floor(Math.random() * 20) * 3600 * 1000,
            ),
            lastDecayAt: new Date(now),
            expiresAt: new Date(now + 30 * 3600 * 1000),
          };
        }),
      );
      // Keep players.status in step with the listing.
      await db
        .update(players)
        .set({ status: "listed" })
        .where(
          inArray(
            players.id,
            pickList.map((p) => p.id),
          ),
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

    // Last write: the league is now complete, so it may be played.
    await db
      .update(leagues)
      .set({ status: "active" })
      .where(eq(leagues.id, league.id));

    return {
      leagueId: league.id,
      clubId: clubRows[0].id,
      inviteCode,
    };
  } catch (err) {
    // Cascades through clubs, players, fixtures, listings, cup and feed.
    await db.delete(leagues).where(eq(leagues.id, league.id));
    // currentLeagueId is a bare uuid with no foreign key, so the cascade does
    // not clear it and the user would keep pointing at a league that no
    // longer exists.
    await db
      .update(users)
      .set({ currentLeagueId: null })
      .where(eq(users.id, input.userId));
    throw err;
  }
}
