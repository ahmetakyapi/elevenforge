/**
 * Scout mechanics:
 *  - sendScout(clubId, params) creates a scout that returns after 8h with 3-5 candidates.
 *  - processScoutReturns() activates scouts whose returnsAt has passed, generating
 *    new Player rows (not yet attached to a club) tagged with resultsJson.
 *  - claimScoutPlayer(scoutId, playerIdx) attaches the player to the club.
 */
import { and, eq, lt, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { feedEvents, players, scouts, clubs } from "@/lib/schema";
import type { Position } from "@/types";

const CLAIM_WINDOW_MS = 48 * 3600 * 1000;

const TR_FIRST = [
  "Efe", "Arda", "Kerem", "Tolga", "Kaan", "Ozan", "Emre", "Yusuf",
  "Baran", "Cenk", "Can", "Mert", "Umut", "Halil", "Onur",
];
const TR_LAST = [
  "Yılmaz", "Demir", "Kaya", "Öztürk", "Çelik", "Aslan", "Koç",
];
const INTL_NAMES: Record<string, Array<{ name: string; nat: string }>> = {
  BR: Array.from({ length: 8 }, (_, i) => ({
    name: `L. ${["Silva", "Souza", "Pereira", "Oliveira", "Santos", "Costa", "Ribeiro", "Rocha"][i]}`,
    nat: "BR",
  })),
  AR: Array.from({ length: 6 }, (_, i) => ({
    name: `N. ${["García", "Fernández", "Álvarez", "Rodríguez", "Romero", "Torres"][i]}`,
    nat: "AR",
  })),
  FR: Array.from({ length: 6 }, (_, i) => ({
    name: `A. ${["Martin", "Bernard", "Diakité", "Thomas", "Moreau", "Laurent"][i]}`,
    nat: "FR",
  })),
  DE: Array.from({ length: 6 }, (_, i) => ({
    name: `F. ${["Müller", "Schmidt", "Fischer", "Schulze", "Weber", "Meyer"][i]}`,
    nat: "DE",
  })),
  TR: TR_FIRST.map((f, i) => ({
    name: `${f} ${TR_LAST[i % TR_LAST.length]}`,
    nat: "TR",
  })),
};

type ScoutCandidate = {
  name: string;
  nat: string;
  position: Position;
  role: string;
  age: number;
  overall: number;
  potential: number;
  marketValueCents: number;
  wageCents: number;
};

function genCandidate(
  nat: string,
  position: Position,
  ageRange: [number, number],
): ScoutCandidate {
  const pool = INTL_NAMES[nat] ?? INTL_NAMES.TR;
  const { name } = pool[Math.floor(Math.random() * pool.length)];
  const age =
    ageRange[0] +
    Math.floor(Math.random() * (ageRange[1] - ageRange[0] + 1));
  const overall = Math.round(68 + Math.random() * 12); // 68-80
  const potential = Math.min(95, overall + Math.floor(Math.random() * 14));
  const valueEur = Math.round(
    Math.pow(overall - 55, 2.5) * 25_000 * (1 + (potential - overall) * 0.1),
  );
  const roleChoices: Record<Position, string[]> = {
    GK: ["GK"],
    DEF: ["CB", "LB", "RB"],
    MID: ["CM", "CDM", "AM", "LW", "RW"],
    FWD: ["ST", "LW", "RW"],
  };
  const role =
    roleChoices[position][
      Math.floor(Math.random() * roleChoices[position].length)
    ];
  return {
    name,
    nat,
    position,
    role,
    age,
    overall,
    potential,
    marketValueCents: valueEur * 100,
    wageCents: Math.round((valueEur / 200) * 100),
  };
}

export async function sendScout(params: {
  leagueId: string;
  clubId: string;
  targetNationality: string;
  targetPosition: Position | "ANY";
  ageMin: number;
  ageMax: number;
}) {
  const returnsAt = new Date(Date.now() + 8 * 3600 * 1000);
  const [row] = await db
    .insert(scouts)
    .values({ ...params, returnsAt })
    .returning();
  return row;
}

export async function processScoutReturns(opts: { leagueId?: string } = {}) {
  const now = new Date();

  // Expire any returned scouts whose 48h claim window has passed.
  const claimCutoff = new Date(now.getTime() - CLAIM_WINDOW_MS);
  const stale = await db
    .select()
    .from(scouts)
    .where(
      opts.leagueId
        ? and(
            eq(scouts.leagueId, opts.leagueId),
            eq(scouts.status, "returned"),
            lt(scouts.returnsAt, claimCutoff),
          )
        : and(
            eq(scouts.status, "returned"),
            lt(scouts.returnsAt, claimCutoff),
          ),
    );
  for (const s of stale) {
    await db
      .update(scouts)
      .set({ status: "expired" })
      .where(eq(scouts.id, s.id));
  }

  const active = await db
    .select()
    .from(scouts)
    .where(
      opts.leagueId
        ? and(
            eq(scouts.leagueId, opts.leagueId),
            eq(scouts.status, "active"),
            lte(scouts.returnsAt, now),
          )
        : and(eq(scouts.status, "active"), lte(scouts.returnsAt, now)),
    );

  for (const s of active) {
    const count = 3 + Math.floor(Math.random() * 3); // 3-5 candidates
    const positions: Position[] =
      s.targetPosition === "ANY"
        ? ["GK", "DEF", "MID", "FWD"]
        : [s.targetPosition];
    const results: ScoutCandidate[] = [];
    for (let i = 0; i < count; i++) {
      const pos = positions[Math.floor(Math.random() * positions.length)];
      results.push(genCandidate(s.targetNationality, pos, [s.ageMin, s.ageMax]));
    }
    await db
      .update(scouts)
      .set({ status: "returned", resultsJson: JSON.stringify(results) })
      .where(eq(scouts.id, s.id));

    await db.insert(feedEvents).values({
      leagueId: s.leagueId,
      clubId: s.clubId,
      eventType: "scout",
      text: `Kaşif döndü — ${count} aday (${s.targetNationality} · ${s.targetPosition})`,
    });
    // Best-effort push to club owner
    const { dispatchScoutPush } = await import("@/lib/push-dispatch");
    await dispatchScoutPush({ scoutId: s.id }).catch(() => {});
  }

  return { returned: active.length };
}

export async function claimScoutPlayer(
  scoutId: string,
  candidateIndex: number,
): Promise<{ ok: true; playerId: string } | { ok: false; error: string }> {
  const s = (await db.select().from(scouts).where(eq(scouts.id, scoutId)).limit(1))[0];
  if (!s || s.status !== "returned") return { ok: false, error: "Geçersiz kaşif" };
  if (!s.resultsJson) return { ok: false, error: "Aday yok" };
  const candidates = JSON.parse(s.resultsJson) as ScoutCandidate[];
  const c = candidates[candidateIndex];
  if (!c) return { ok: false, error: "Aday bulunamadı" };

  // Debit club
  const club = (
    await db.select().from(clubs).where(eq(clubs.id, s.clubId)).limit(1)
  )[0];
  if (!club) return { ok: false, error: "Kulüp bulunamadı" };
  if (club.balanceCents < c.marketValueCents) {
    return { ok: false, error: "Bütçe yetersiz" };
  }

  const [p] = await db
    .insert(players)
    .values({
      leagueId: s.leagueId,
      clubId: s.clubId,
      name: c.name,
      position: c.position,
      role: c.role,
      age: c.age,
      nationality: c.nat,
      overall: c.overall,
      potential: c.potential,
      marketValueCents: c.marketValueCents,
      wageCents: c.wageCents,
    })
    .returning();

  await db
    .update(clubs)
    .set({ balanceCents: club.balanceCents - c.marketValueCents })
    .where(eq(clubs.id, club.id));

  await db
    .update(scouts)
    .set({ status: "claimed", claimedPlayerId: p.id })
    .where(eq(scouts.id, scoutId));

  return { ok: true, playerId: p.id };
}
