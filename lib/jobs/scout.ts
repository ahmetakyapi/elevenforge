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

// ─── Scout name pool ─────────────────────────────────────────────
// Young prospect + established-starter names scouts surface when a
// manager sends them to a specific country. All names are real 2025-26
// big-league footballers we are confident are/were at their clubs for
// 2+ seasons (low risk of Jan 2026 moves invalidating the entry). The
// scout does NOT inherit the player's real-life club — that would
// overlap with the Süper Lig pack — it just uses the name + typical
// nationality so "İspanya'dan RW scout et" returns recognizable names.
//
// Keep the list ≤12 per nat — scout candidates are 3-5 per return, so
// a pool of 12 gives plenty of variety before repetition.
const INTL_NAMES: Record<string, Array<{ name: string; nat: string }>> = {
  // Premier League / La Liga / Serie A / Ligue 1 / Bundesliga / Eredivisie
  // / Primeira Liga çeşitlemesi.
  BR: [
    { name: "Vinícius Júnior", nat: "BR" }, { name: "Rodrygo", nat: "BR" },
    { name: "Raphinha", nat: "BR" }, { name: "Bruno Guimarães", nat: "BR" },
    { name: "Gabriel Martinelli", nat: "BR" }, { name: "Lucas Paquetá", nat: "BR" },
    { name: "Éder Militão", nat: "BR" }, { name: "Casemiro", nat: "BR" },
    { name: "Richarlison", nat: "BR" }, { name: "Gabriel Magalhães", nat: "BR" },
  ],
  AR: [
    { name: "Lautaro Martínez", nat: "AR" }, { name: "Julián Álvarez", nat: "AR" },
    { name: "Paulo Dybala", nat: "AR" }, { name: "Alexis Mac Allister", nat: "AR" },
    { name: "Enzo Fernández", nat: "AR" }, { name: "Nicolás Otamendi", nat: "AR" },
    { name: "Cristian Romero", nat: "AR" }, { name: "Leandro Paredes", nat: "AR" },
    { name: "Ángel Di María", nat: "AR" }, { name: "Nicolás González", nat: "AR" },
  ],
  FR: [
    { name: "Kylian Mbappé", nat: "FR" }, { name: "Ousmane Dembélé", nat: "FR" },
    { name: "Eduardo Camavinga", nat: "FR" }, { name: "Aurélien Tchouaméni", nat: "FR" },
    { name: "Antoine Griezmann", nat: "FR" }, { name: "Jules Koundé", nat: "FR" },
    { name: "Dayot Upamecano", nat: "FR" }, { name: "Theo Hernández", nat: "FR" },
    { name: "William Saliba", nat: "FR" }, { name: "Mike Maignan", nat: "FR" },
    { name: "Désiré Doué", nat: "FR" }, { name: "Bradley Barcola", nat: "FR" },
  ],
  ES: [
    { name: "Pedri", nat: "ES" }, { name: "Gavi", nat: "ES" },
    { name: "Lamine Yamal", nat: "ES" }, { name: "Ferran Torres", nat: "ES" },
    { name: "Dani Olmo", nat: "ES" }, { name: "Rodri", nat: "ES" },
    { name: "Nico Williams", nat: "ES" }, { name: "Fabián Ruiz", nat: "ES" },
    { name: "Unai Simón", nat: "ES" }, { name: "Martín Zubimendi", nat: "ES" },
  ],
  DE: [
    { name: "Jamal Musiala", nat: "DE" }, { name: "Joshua Kimmich", nat: "DE" },
    { name: "Florian Wirtz", nat: "DE" }, { name: "Kai Havertz", nat: "DE" },
    { name: "Antonio Rüdiger", nat: "DE" }, { name: "Leon Goretzka", nat: "DE" },
    { name: "Niclas Füllkrug", nat: "DE" }, { name: "Julian Brandt", nat: "DE" },
  ],
  PT: [
    { name: "Bernardo Silva", nat: "PT" }, { name: "Vitinha", nat: "PT" },
    { name: "João Neves", nat: "PT" }, { name: "Rafael Leão", nat: "PT" },
    { name: "Rúben Dias", nat: "PT" }, { name: "Bruno Fernandes", nat: "PT" },
    { name: "João Cancelo", nat: "PT" }, { name: "Gonçalo Ramos", nat: "PT" },
  ],
  NL: [
    { name: "Virgil van Dijk", nat: "NL" }, { name: "Frenkie de Jong", nat: "NL" },
    { name: "Cody Gakpo", nat: "NL" }, { name: "Micky van de Ven", nat: "NL" },
    { name: "Denzel Dumfries", nat: "NL" }, { name: "Matthijs de Ligt", nat: "NL" },
    { name: "Tijjani Reijnders", nat: "NL" }, { name: "Xavi Simons", nat: "NL" },
  ],
  BE: [
    { name: "Kevin De Bruyne", nat: "BE" }, { name: "Romelu Lukaku", nat: "BE" },
    { name: "Youri Tielemans", nat: "BE" }, { name: "Jérémy Doku", nat: "BE" },
    { name: "Loïs Openda", nat: "BE" }, { name: "Charles De Ketelaere", nat: "BE" },
  ],
  NG: [
    { name: "Ademola Lookman", nat: "NG" }, { name: "Alex Iwobi", nat: "NG" },
    { name: "Samuel Chukwueze", nat: "NG" }, { name: "Victor Boniface", nat: "NG" },
    { name: "Calvin Bassey", nat: "NG" }, { name: "Taiwo Awoniyi", nat: "NG" },
  ],
  NO: [
    { name: "Erling Haaland", nat: "NO" }, { name: "Martin Ødegaard", nat: "NO" },
    { name: "Alexander Sørloth", nat: "NO" }, { name: "Antonio Nusa", nat: "NO" },
    { name: "Sander Berge", nat: "NO" }, { name: "Oscar Bobb", nat: "NO" },
  ],
  HR: [
    { name: "Luka Modrić", nat: "HR" }, { name: "Mateo Kovačić", nat: "HR" },
    { name: "Joško Gvardiol", nat: "HR" }, { name: "Luka Sučić", nat: "HR" },
    { name: "Mario Pašalić", nat: "HR" }, { name: "Ivan Perišić", nat: "HR" },
  ],
  SN: [
    { name: "Sadio Mané", nat: "SN" }, { name: "Kalidou Koulibaly", nat: "SN" },
    { name: "Ismaïla Sarr", nat: "SN" }, { name: "Nicolas Jackson", nat: "SN" },
    { name: "Amadou Onana", nat: "SN" }, { name: "Lamine Camara", nat: "SN" },
  ],
  MA: [
    { name: "Achraf Hakimi", nat: "MA" }, { name: "Noussair Mazraoui", nat: "MA" },
    { name: "Hakim Ziyech", nat: "MA" }, { name: "Azzedine Ounahi", nat: "MA" },
    { name: "Brahim Díaz", nat: "MA" }, { name: "Bilal El Khannouss", nat: "MA" },
  ],
  DK: [
    { name: "Christian Eriksen", nat: "DK" }, { name: "Pierre Højbjerg", nat: "DK" },
    { name: "Rasmus Højlund", nat: "DK" }, { name: "Mikkel Damsgaard", nat: "DK" },
    { name: "Joachim Andersen", nat: "DK" },
  ],
  SE: [
    { name: "Alexander Isak", nat: "SE" }, { name: "Dejan Kulusevski", nat: "SE" },
    { name: "Viktor Gyökeres", nat: "SE" }, { name: "Emil Forsberg", nat: "SE" },
  ],
  CI: [
    { name: "Sébastien Haller", nat: "CI" }, { name: "Simon Adingra", nat: "CI" },
    { name: "Evan Ndicka", nat: "CI" }, { name: "Amad Diallo", nat: "CI" },
    { name: "Nicolas Pépé", nat: "CI" },
  ],
  GH: [
    { name: "Mohammed Kudus", nat: "GH" }, { name: "Thomas Partey", nat: "GH" },
    { name: "Antoine Semenyo", nat: "GH" }, { name: "Kamaldeen Sulemana", nat: "GH" },
  ],
  // Local fallback — proceduralTurkish names for TR targets. Generated
  // each call so the same scout run doesn't produce identical duplicates.
  TR: [
    { name: "Efe Yılmaz", nat: "TR" }, { name: "Arda Demir", nat: "TR" },
    { name: "Kerem Kaya", nat: "TR" }, { name: "Tolga Öztürk", nat: "TR" },
    { name: "Kaan Çelik", nat: "TR" }, { name: "Ozan Aslan", nat: "TR" },
    { name: "Emre Koç", nat: "TR" }, { name: "Yusuf Yıldız", nat: "TR" },
    { name: "Baran Arslan", nat: "TR" }, { name: "Can Polat", nat: "TR" },
    { name: "Umut Şahin", nat: "TR" }, { name: "Halil Aydın", nat: "TR" },
  ],
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
    // Bonus candidates from a hired Baş Kaşif (+tier results).
    let bonus = 0;
    const [club] = await db
      .select({ staffJson: clubs.staffJson })
      .from(clubs)
      .where(eq(clubs.id, s.clubId));
    if (club?.staffJson) {
      try {
        const raw = JSON.parse(club.staffJson) as { scout?: { id: string } };
        if (raw.scout) {
          const { staffById } = await import("@/lib/staff");
          const m = staffById(raw.scout.id);
          if (m && m.role === "scout") bonus = m.tier;
        }
      } catch {}
    }
    const count = 3 + Math.floor(Math.random() * 3) + bonus; // 3-5 (+staff tier)
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
