/**
 * Scout mechanics:
 *  - sendScout(clubId, params) creates a scout that returns after 8h with 3-5 candidates.
 *  - processScoutReturns() activates scouts whose returnsAt has passed, generating
 *    new Player rows (not yet attached to a club) tagged with resultsJson.
 *  - claimScoutPlayer(callerClubId, scoutId, playerIdx) attaches the player to
 *    the club, after checking the scout actually belongs to the caller.
 */
import { and, eq, lt, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { debitClub } from "@/lib/money";
import { feedEvents, players, scouts, clubs } from "@/lib/schema";
import type { Position } from "@/types";
import { marketValueCents, wageFromValueCents } from "@/lib/economy";

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
// Keep the list ≤14 per nat — scout candidates are 3-5 per return, so
// a pool this size gives plenty of variety before repetition.
//
// Names must not collide with anyone already in a Süper Lig squad, or a
// scout report would offer a player the league already owns. processScoutReturns
// filters against the league roster as a backstop, but keeping the pools
// disjoint means the filter rarely has to fire.
const INTL_NAMES: Record<string, Array<{ name: string; nat: string }>> = {
  // Premier League / La Liga / Serie A / Ligue 1 / Bundesliga / Eredivisie
  // / Primeira Liga çeşitlemesi.
  BR: [
    { name: "Vinícius Júnior", nat: "BR" }, { name: "Rodrygo", nat: "BR" },
    { name: "Raphinha", nat: "BR" }, { name: "Bruno Guimarães", nat: "BR" },
    { name: "Gabriel Martinelli", nat: "BR" }, { name: "Lucas Paquetá", nat: "BR" },
    { name: "Éder Militão", nat: "BR" }, { name: "Casemiro", nat: "BR" },
    { name: "Richarlison", nat: "BR" }, { name: "Gabriel Magalhães", nat: "BR" },
    { name: "Endrick", nat: "BR" }, { name: "Estêvão", nat: "BR" },
    { name: "Savinho", nat: "BR" }, { name: "João Gomes", nat: "BR" },
  ],
  AR: [
    { name: "Lautaro Martínez", nat: "AR" }, { name: "Julián Álvarez", nat: "AR" },
    { name: "Paulo Dybala", nat: "AR" }, { name: "Alexis Mac Allister", nat: "AR" },
    { name: "Enzo Fernández", nat: "AR" }, { name: "Nicolás Otamendi", nat: "AR" },
    { name: "Cristian Romero", nat: "AR" }, { name: "Leandro Paredes", nat: "AR" },
    { name: "Nicolás González", nat: "AR" }, { name: "Valentín Carboni", nat: "AR" },
    { name: "Alejandro Garnacho", nat: "AR" }, { name: "Franco Mastantuono", nat: "AR" },
  ],
  FR: [
    { name: "Kylian Mbappé", nat: "FR" }, { name: "Ousmane Dembélé", nat: "FR" },
    { name: "Eduardo Camavinga", nat: "FR" }, { name: "Aurélien Tchouaméni", nat: "FR" },
    { name: "Antoine Griezmann", nat: "FR" }, { name: "Jules Koundé", nat: "FR" },
    { name: "Dayot Upamecano", nat: "FR" }, { name: "Theo Hernández", nat: "FR" },
    { name: "William Saliba", nat: "FR" }, { name: "Mike Maignan", nat: "FR" },
    { name: "Michael Olise", nat: "FR" }, { name: "Désiré Doué", nat: "FR" },
    { name: "Warren Zaïre-Emery", nat: "FR" }, { name: "Bradley Barcola", nat: "FR" },
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
    { name: "Kevin De Bruyne", nat: "BE" }, { name: "Dodi Lukebakio", nat: "BE" },
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
    { name: "Mateo Kovačić", nat: "HR" }, { name: "Petar Sučić", nat: "HR" },
    { name: "Joško Gvardiol", nat: "HR" }, { name: "Luka Sučić", nat: "HR" },
    { name: "Mario Pašalić", nat: "HR" }, { name: "Martin Baturina", nat: "HR" },
  ],
  SN: [
    { name: "Sadio Mané", nat: "SN" }, { name: "Kalidou Koulibaly", nat: "SN" },
    { name: "Ismaïla Sarr", nat: "SN" }, { name: "Nicolas Jackson", nat: "SN" },
    { name: "Amadou Onana", nat: "SN" }, { name: "Lamine Camara", nat: "SN" },
  ],
  MA: [
    { name: "Achraf Hakimi", nat: "MA" }, { name: "Noussair Mazraoui", nat: "MA" },
    { name: "Azzedine Ounahi", nat: "MA" }, { name: "Eliesse Ben Seghir", nat: "MA" },
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
    { name: "Karim Konaté", nat: "CI" },
  ],
  GH: [
    { name: "Mohammed Kudus", nat: "GH" }, { name: "Thomas Partey", nat: "GH" },
    { name: "Antoine Semenyo", nat: "GH" }, { name: "Kamaldeen Sulemana", nat: "GH" },
  ],
  EN: [
    { name: "Jude Bellingham", nat: "EN" }, { name: "Harry Kane", nat: "EN" },
    { name: "Bukayo Saka", nat: "EN" }, { name: "Phil Foden", nat: "EN" },
    { name: "Declan Rice", nat: "EN" }, { name: "Cole Palmer", nat: "EN" },
    { name: "Anthony Gordon", nat: "EN" }, { name: "Marc Guéhi", nat: "EN" },
    { name: "Morgan Rogers", nat: "EN" }, { name: "Jarrad Branthwaite", nat: "EN" },
  ],
  GE: [
    { name: "Khvicha Kvaratskhelia", nat: "GE" }, { name: "Giorgi Mamardashvili", nat: "GE" },
    { name: "Giorgi Chakvetadze", nat: "GE" },
  ],
  IT: [
    { name: "Nicolò Barella", nat: "IT" }, { name: "Sandro Tonali", nat: "IT" },
    { name: "Federico Dimarco", nat: "IT" }, { name: "Alessandro Bastoni", nat: "IT" },
    { name: "Giacomo Raspadori", nat: "IT" }, { name: "Cesare Casadei", nat: "IT" },
  ],
  // Turkish internationals playing ABROAD. A Turkish game whose "scout
  // Türkiye" button returned invented names while Arda Güler and Kenan
  // Yıldız existed was a strange gap. Everyone here plays outside the Süper
  // Lig, so a scout report can never duplicate a player already in a squad.
  TR: [
    { name: "Arda Güler", nat: "TR" }, { name: "Kenan Yıldız", nat: "TR" },
    { name: "Ferdi Kadıoğlu", nat: "TR" }, { name: "Zeki Çelik", nat: "TR" },
    { name: "Altay Bayındır", nat: "TR" }, { name: "Berke Özer", nat: "TR" },
    { name: "Can Uzun", nat: "TR" }, { name: "Yusuf Sarı", nat: "TR" },
    { name: "Emirhan Demircan", nat: "TR" }, { name: "Doğukan Sinik", nat: "TR" },
    { name: "Ahmetcan Kaplan", nat: "TR" }, { name: "Efe Akman", nat: "TR" },
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
  const valueCents = marketValueCents(overall, potential, age);
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
    marketValueCents: valueCents,
    wageCents: wageFromValueCents(valueCents),
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
    // Never offer a player the league already has. The name pools are kept
    // disjoint from the squad packs, but a squad refresh can bring a pool
    // name into the league (Lukaku signing for Fenerbahçe is exactly that),
    // and two scouts running together could otherwise surface the same
    // prospect twice.
    const existing = new Set(
      (
        await db
          .select({ name: players.name })
          .from(players)
          .where(eq(players.leagueId, s.leagueId))
      ).map((r) => r.name),
    );
    const results: ScoutCandidate[] = [];
    for (let i = 0; i < count; i++) {
      const pos = positions[Math.floor(Math.random() * positions.length)];
      let candidate: ScoutCandidate | null = null;
      for (let attempt = 0; attempt < 8; attempt++) {
        const c = genCandidate(s.targetNationality, pos, [s.ageMin, s.ageMax]);
        if (!existing.has(c.name)) {
          candidate = c;
          break;
        }
      }
      if (!candidate) continue; // pool exhausted for this nationality
      existing.add(candidate.name);
      results.push(candidate);
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

/**
 * Sign one of a returned scout's candidates.
 *
 * `callerClubId` is derived from the session by the caller and is mandatory:
 * without it any authenticated user could pass someone else's scoutId and
 * charge that club for a player it never asked for.
 *
 * The scout row doubles as the idempotency token — it is flipped to "claimed"
 * with a conditional UPDATE *before* anything is bought, so two concurrent
 * clicks cannot both sign a candidate.
 */
export async function claimScoutPlayer(
  callerClubId: string,
  scoutId: string,
  candidateIndex: number,
): Promise<{ ok: true; playerId: string } | { ok: false; error: string }> {
  const s = (await db.select().from(scouts).where(eq(scouts.id, scoutId)).limit(1))[0];
  if (!s) return { ok: false, error: "Geçersiz kaşif" };
  if (s.clubId !== callerClubId) {
    return { ok: false, error: "Bu kaşif senin değil." };
  }
  if (s.status !== "returned") return { ok: false, error: "Geçersiz kaşif" };
  if (!s.resultsJson) return { ok: false, error: "Aday yok" };
  let candidates: ScoutCandidate[] = [];
  try {
    const parsed = JSON.parse(s.resultsJson) as ScoutCandidate[];
    if (Array.isArray(parsed)) candidates = parsed;
  } catch {
    return { ok: false, error: "Kaşif raporu okunamadı." };
  }
  if (!Number.isInteger(candidateIndex)) {
    return { ok: false, error: "Aday bulunamadı" };
  }
  const c = candidates[candidateIndex];
  if (!c) return { ok: false, error: "Aday bulunamadı" };

  // Claim the scout first — losing this race means someone already signed.
  const claimed = await db
    .update(scouts)
    .set({ status: "claimed" })
    .where(and(eq(scouts.id, scoutId), eq(scouts.status, "returned")))
    .returning();
  if (claimed.length === 0) {
    return { ok: false, error: "Bu kaşif raporu zaten kullanıldı." };
  }

  // Atomic, overdraft-proof debit. On refusal, hand the scout back so the
  // user can try again once they can afford the fee.
  const paid = await debitClub(s.clubId, c.marketValueCents);
  if (!paid) {
    await db
      .update(scouts)
      .set({ status: "returned" })
      .where(eq(scouts.id, scoutId));
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
    .update(scouts)
    .set({ claimedPlayerId: p.id })
    .where(eq(scouts.id, scoutId));

  return { ok: true, playerId: p.id };
}
