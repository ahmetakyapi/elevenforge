/**
 * Youth intake — the replacement half of the player lifecycle.
 *
 * The season roll deletes retirees and releases expired contracts, but
 * nothing ever created a new player. Over three or four seasons every squad
 * in the league shrank until clubs could not field eleven, and the free-agent
 * pool emptied out. This generates a fresh crop of academy prospects each
 * season so the world refills itself.
 *
 * Every club gets 1-3 youth players; the league also gets a pool of unattached
 * young free agents so there is always something to sign.
 */
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { players, type Club } from "@/lib/schema";
import type { Position } from "@/types";

const TR_FIRST = [
  "Ahmet", "Mehmet", "Emre", "Burak", "Yusuf", "Kerem", "Efe", "Arda",
  "Onur", "Tolga", "Kaan", "Berke", "Hakan", "Ozan", "Barış", "Umut",
  "Doğan", "Enes", "Halil", "Semih", "Sinan", "Yunus", "Çağlar", "Ferdi",
  "Alperen", "Bora", "Cenk", "Deniz", "Ege", "Görkem", "Işıl", "Kuzey",
];
const TR_LAST = [
  "Yılmaz", "Kaya", "Demir", "Çelik", "Şahin", "Aydın", "Öztürk", "Aslan",
  "Doğan", "Kılıç", "Arslan", "Yıldız", "Taş", "Koç", "Polat", "Güneş",
  "Güler", "Çakır", "Akgün", "Şanlı", "Çolak", "Sezer", "Akın", "Bulut",
];

const ROLES: Record<Position, string[]> = {
  GK: ["GK"],
  DEF: ["CB", "LB", "RB"],
  MID: ["CDM", "CM", "AM", "LW", "RW"],
  FWD: ["ST", "CF", "LW", "RW"],
};

/** Deterministic per-league, per-season RNG so a retry regenerates nothing new. */
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function hash(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

function pick<T>(arr: T[], r: () => number): T {
  return arr[Math.floor(r() * arr.length)];
}

type NewPlayer = typeof players.$inferInsert;

/**
 * A 16-19 year old with a low current ability and a wide potential spread —
 * the point of a youth player is the gamble, so most are ordinary and the
 * occasional one is a genuine prospect.
 */
function makeProspect(
  leagueId: string,
  clubId: string | null,
  position: Position,
  r: () => number,
): NewPlayer {
  const age = 16 + Math.floor(r() * 4);
  const overall = 48 + Math.floor(r() * 14); // 48-61
  // Most cap out modestly; roughly one in eight is special.
  const gem = r() < 0.12;
  const potential = Math.min(
    92,
    overall + (gem ? 20 + Math.floor(r() * 14) : 6 + Math.floor(r() * 12)),
  );
  const role = pick(ROLES[position], r);
  const attr = (base: number) =>
    Math.max(25, Math.min(95, base + Math.floor(r() * 16) - 8));

  return {
    leagueId,
    clubId,
    name: `${pick(TR_FIRST, r)} ${pick(TR_LAST, r)}`,
    position,
    role,
    age,
    nationality: "TR",
    overall,
    potential,
    pace: attr(position === "FWD" || position === "DEF" ? overall + 6 : overall),
    shooting: attr(position === "FWD" ? overall + 8 : overall - 12),
    passing: attr(position === "MID" ? overall + 8 : overall - 6),
    defending: attr(position === "DEF" ? overall + 8 : overall - 14),
    physical: attr(overall - 4),
    goalkeeping: position === "GK" ? attr(overall + 8) : 20,
    // Academy graduates are cheap and on long deals.
    marketValueCents: (overall + potential) * 1_500_000,
    wageCents: 2_000_000 + overall * 40_000,
    contractYears: 3,
    fitness: 95,
    morale: 4,
  };
}

/**
 * Generate the season's youth intake for one league.
 *
 * Idempotent for a given (leagueId, season): the RNG is seeded from both, and
 * the caller only invokes it once per roll, inside the season CAS.
 */
export async function generateYouthIntake(
  leagueId: string,
  season: number,
  clubRows: Club[],
): Promise<{ academy: number; freeAgents: number }> {
  const r = rng(hash(`${leagueId}:${season}`));
  const batch: NewPlayer[] = [];

  // Academy graduates, weighted by training facility level: a club that
  // invested in its training ground gets more and better prospects.
  for (const club of clubRows) {
    const count = 1 + Math.floor(r() * 2) + (club.trainingLevel >= 4 ? 1 : 0);
    for (let i = 0; i < count; i++) {
      const roll = r();
      const position: Position =
        roll < 0.12 ? "GK" : roll < 0.42 ? "DEF" : roll < 0.75 ? "MID" : "FWD";
      batch.push(makeProspect(leagueId, club.id, position, r));
    }
  }
  const academy = batch.length;

  // A pool of unattached youngsters so the free-agent market never dries up
  // and the AI always has someone to sign in an emergency.
  const freeAgentCount = 10 + Math.floor(r() * 6);
  for (let i = 0; i < freeAgentCount; i++) {
    const roll = r();
    const position: Position =
      roll < 0.14 ? "GK" : roll < 0.44 ? "DEF" : roll < 0.76 ? "MID" : "FWD";
    batch.push(makeProspect(leagueId, null, position, r));
  }

  if (batch.length > 0) {
    await db.insert(players).values(batch);
  }
  return { academy, freeAgents: freeAgentCount };
}

/**
 * Safety net: make sure every club can field a side. Called after the roll,
 * it tops up any squad that fell below the minimum with academy players
 * rather than letting the club forfeit.
 */
export async function backfillThinSquads(
  leagueId: string,
  clubRows: Club[],
  minSquad = 16,
): Promise<number> {
  let created = 0;
  for (const club of clubRows) {
    const squad = await db
      .select({ id: players.id, position: players.position })
      .from(players)
      .where(eq(players.clubId, club.id));
    if (squad.length >= minSquad) continue;

    const r = rng(hash(`${club.id}:backfill:${squad.length}`));
    const have = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
    for (const p of squad) have[p.position]++;
    const want = { GK: 2, DEF: 6, MID: 7, FWD: 5 };

    const batch: NewPlayer[] = [];
    while (squad.length + batch.length < minSquad) {
      // Always fill the emptiest line first, so a club never ends up with
      // eleven midfielders and no goalkeeper.
      const position = (["GK", "DEF", "MID", "FWD"] as const).reduce((a, b) =>
        want[b] - have[b] > want[a] - have[a] ? b : a,
      );
      have[position]++;
      batch.push(makeProspect(leagueId, club.id, position, r));
    }
    if (batch.length > 0) {
      await db.insert(players).values(batch);
      created += batch.length;
    }
  }
  return created;
}
