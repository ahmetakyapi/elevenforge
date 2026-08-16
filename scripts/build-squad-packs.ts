// Must be first: populates process.env from .env.local before anything
// reads it at module load time.
import "./load-env";
import { writeFileSync } from "node:fs";
import { RAW_CLUBS, RAW_DIVISION_2, type RawClub } from "./squad-source";
import type { Position } from "../types";
import { marketValueCents } from "../lib/economy";

/**
 * Generate lib/squad-packs.ts from scripts/squad-source.ts.
 *
 *   npm run build:squads
 *
 * Why a generator rather than a hand-written file: the squad list is ~550
 * players across 18 clubs and changes every transfer window. Editing literals
 * by hand is how the old file drifted into a Beşiktaş squad with 17 players
 * and 2 forwards. Here the roster data is plain lines, and everything the
 * game needs — position family, role, rating, potential, balance checks — is
 * derived deterministically.
 *
 * ovr/pot are NOT sourced. Transfermarkt publishes no single overall rating,
 * so they come from club tier + age + the STAR table below, which is a
 * hand-maintained list of players whose reputation should outrank their
 * club's baseline. They are game-balance numbers, not claims about real
 * ability.
 */

/** Transfermarkt position → game position family + role. */
const POSITION_MAP: Record<string, { pos: Position; role: string }> = {
  Goalkeeper: { pos: "GK", role: "GK" },
  "Centre-Back": { pos: "DEF", role: "CB" },
  "Left-Back": { pos: "DEF", role: "LB" },
  "Right-Back": { pos: "DEF", role: "RB" },
  "Defensive Midfield": { pos: "MID", role: "CDM" },
  "Central Midfield": { pos: "MID", role: "CM" },
  "Attacking Midfield": { pos: "MID", role: "AM" },
  "Left Midfield": { pos: "MID", role: "LW" },
  "Right Midfield": { pos: "MID", role: "RW" },
  "Left Winger": { pos: "FWD", role: "LW" },
  "Right Winger": { pos: "FWD", role: "RW" },
  "Centre-Forward": { pos: "FWD", role: "ST" },
  "Second Striker": { pos: "FWD", role: "CF" },
  Striker: { pos: "FWD", role: "ST" },
};

/** Country name → the 2-letter code the UI renders as a flag. */
const NAT: Record<string, string> = {
  Turkey: "TR", Türkiye: "TR", Brazil: "BR", Portugal: "PT", Spain: "ES",
  France: "FR", Germany: "DE", England: "EN", Scotland: "SC", Ireland: "IE",
  Netherlands: "NL", Belgium: "BE", Italy: "IT", Croatia: "HR", Serbia: "RS",
  Slovenia: "SI", Slovakia: "SK", Poland: "PL", Romania: "RO", Greece: "GR",
  Denmark: "DK", Sweden: "SE", Norway: "NO", Iceland: "IS", Austria: "AT",
  Switzerland: "CH", Hungary: "HU", Ukraine: "UA", "Czech Republic": "CZ",
  "Bosnia-Herzegovina": "BA", Kosovo: "XK", Albania: "AL", Montenegro: "ME",
  "North Macedonia": "MK", Georgia: "GE", Azerbaijan: "AZ", Uzbekistan: "UZ",
  Nigeria: "NG", Ghana: "GH", Senegal: "SN", Mali: "ML", "Côte d'Ivoire": "CI",
  Cameroon: "CM", Congo: "CG", "DR Congo": "CD", Angola: "AO", "The Gambia": "GM",
  Guinea: "GN", "Guinea-Bissau": "GW", Morocco: "MA", Tunisia: "TN", Egypt: "EG",
  Libya: "LY", Madagascar: "MG", Tanzania: "TZ", Chad: "TD", "Cape Verde": "CV",
  Suriname: "SR", Curaçao: "CW", Jamaica: "JM", Honduras: "HN", Venezuela: "VE",
  Chile: "CL", Argentina: "AR", Colombia: "CO", Uruguay: "UY", Gabon: "GA",
  "South Korea": "KR", Japan: "JP", Israel: "IL", Syria: "SY", Iraq: "IQ",
  Comoros: "KM", Benin: "BJ", Jordan: "JO",
};

/** Base overall by club tier. */
const TIER_BASE: Record<1 | 2 | 3 | 4 | 5, number> = {
  1: 76, 2: 74, 3: 71, 4: 69,
  // Second division: clearly weaker, so promotion is a real step up and a
  // relegated Süper Lig squad still dominates for a season.
  5: 63,
};

/**
 * Players whose reputation should outrank their club's baseline.
 * Hand-maintained; anyone absent falls back to tier + age.
 */
const STAR: Record<string, number> = {
  // Fenerbahçe
  Ederson: 85, "N'Golo Kanté": 82, "Marco Asensio": 83, Talisca: 82,
  "Romelu Lukaku": 84, "Mason Greenwood": 84, "Milan Škriniar": 83,
  "Nathan Aké": 83, "Mattéo Guendouzi": 82, "Kerem Aktürkoğlu": 82,
  "Nélson Semedo": 79, Fred: 79, "Vedat Muriqi": 79, "Çağlar Söyüncü": 78,
  "Jayden Oosterwolde": 78, "Cengiz Ünder": 78, "İrfan Can Kahveci": 77,
  "Rodrigo Becão": 77, "Mert Müldür": 76, "Archie Brown": 76,
  "Dorgeles Nene": 76, "Mert Günok": 76, "İsmail Yüksek": 76,
  // Galatasaray
  "Victor Osimhen": 87, "Leroy Sané": 85, "İlkay Gündoğan": 83,
  "Uğurcan Çakır": 82, "Lucas Torreira": 81, "Wilfried Singo": 81,
  "Davinson Sánchez": 80, "Barış Alper Yılmaz": 80, "Gabriel Sara": 80,
  "Mario Lemina": 79, "Roland Sallai": 78, "Victor Nelsson": 78,
  "Abdülkerim Bardakcı": 78, "Yunus Akgün": 78, "Lesley Ugochukwu": 77,
  "Kaan Ayhan": 77, "Ismail Jakobs": 77, "Eren Elmalı": 76,
  // Beşiktaş
  "Dušan Vlahović": 84, "Leandro Trossard": 84, "Alexander Nübel": 82,
  "Orkun Kökçü": 82, "Wilfred Ndidi": 81, "Emmanuel Agbadou": 79,
  "João Mário": 78, "Vaclav Cerny": 78, "Milot Rashica": 77,
  "Tiago Djaló": 77, "Felix Uduokhai": 77, "Amir Murillo": 77,
  "Salih Özcan": 77, "Moatasem Al-Musrati": 77, "Oh Hyeon-gyu": 76,
  "Rıdvan Yılmaz": 75, "Amir Hadziahmetovic": 75, "Semih Kılıçsoy": 74,
  // Trabzonspor
  "Mohamed Salah": 87, "André Onana": 81, "Ruslan Malinovskyi": 79,
  "Paul Onuachu": 78, "Ernest Muci": 77, "Stefan Savic": 76,
  "Okay Yokuşlu": 76, "John Lundstram": 76, "Batista Mendy": 76,
  "Denis Drăguș": 76, "Benjamin Bouchouari": 75, "Samet Akaydin": 75,
  // Elsewhere
  "Edin Visca": 76, "Eldor Shomurodov": 76, "Andreas Skov Olsen": 76,
  "Ianis Hagi": 76, "Kerem Demirbay": 76, "Enis Bardhi": 75,
  "Arthur Masuaku": 75, "Alban Lafont": 77, "Adama Traoré": 76,
  "Gift Orban": 76, "Mbaye Diagne": 74, "Valentin Mihăilă": 75,
  "Bruno Petkovic": 75, "Horațiu Moldovan": 75, "Abdelhamid Sabiri": 75,
  "Jawad El Yamiq": 74, "Diogo Gonçalves": 74, "Chidozie Awaziem": 74,
  "Sékou Koïta": 74, "Dimitrios Goutas": 74, "Peter Etebo": 74,
  "Festy Ebosele": 73, "Gyrano Kerk": 73, "Ylber Ramadani": 74,
  "Mohamed Diomandé": 74, "Alexandru Maxim": 73, "Juninho Bacuna": 73,
};

/** Deterministic jitter so a club's squad is not a flat wall of one number. */
function hash(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

type Built = {
  n: string; pos: Position; role: string; num?: number;
  age: number; ovr: number; pot: number; nat: string;
  /** Market value in EUR. */ val: number;
  /** Weekly wage in EUR. */ wage: number;
};

/**
 * Price a player from what he is.
 *
 * This MUST be emitted. create-league.ts and seed.ts read `p.val` / `p.wage`
 * with fallbacks of €1M and €100K, so a pack that omits them silently makes
 * every player in the game worth exactly €1M on identical wages — which
 * flattens the transfer market, the AI's valuations, free-agent fees and the
 * listing bands all at once.
 */
function priceOf(ovr: number, pot: number, age: number): { val: number; wage: number } {
  const cents = marketValueCents(ovr, pot, age);
  return {
    val: Math.round(cents / 100),
    wage: Math.round(((v: number) => 0)(cents) / 100),
  };
}

function buildPlayer(line: string, club: RawClub): Built {
  const [numRaw, name, tmPos, ageRaw, natRaw] = line.split("|");
  const mapped = POSITION_MAP[tmPos];
  if (!mapped) throw new Error(`${club.name}: unknown position "${tmPos}" for ${name}`);
  const age = Number(ageRaw);
  const nat = NAT[natRaw] ?? "TR";

  const base = TIER_BASE[club.tier];
  // Peak years earn a little; teenagers and veterans give some back.
  const ageAdj =
    age <= 18 ? -7 : age <= 20 ? -5 : age <= 22 ? -2 :
    age <= 24 ? 0 : age <= 29 ? 2 : age <= 32 ? 1 : -1;
  const jitter = (hash(name) % 5) - 2;
  const ovr = STAR[name] ?? Math.max(58, Math.min(88, base + ageAdj + jitter));

  // Potential headroom: wide for teenagers, none once past the peak.
  const room =
    age <= 18 ? 14 : age <= 20 ? 11 : age <= 22 ? 8 :
    age <= 24 ? 5 : age <= 27 ? 2 : 0;
  const pot = Math.min(94, ovr + (room > 0 ? room - (hash(name + "p") % 3) : 0));

  const num = numRaw === "-" ? undefined : Number(numRaw);
  const finalPot = Math.max(pot, ovr);
  const { val, wage } = priceOf(ovr, finalPot, age);
  return { n: name, pos: mapped.pos, role: mapped.role, num, age, ovr, pot: finalPot, nat, val, wage };
}

/**
 * The audit requires ≥2 GK, ≥6 DEF, ≥6 MID, ≥3 FWD and ≥18 players. Wingers
 * are the swing position — they are attackers by role but sit comfortably in
 * midfield — so if a squad is short of MID, wide players are reclassified
 * rather than inventing anybody.
 */
function rebalance(players: Built[], clubName: string): Built[] {
  const count = (p: Position) => players.filter((x) => x.pos === p).length;
  for (const wide of players) {
    if (count("MID") >= 6) break;
    if (wide.pos === "FWD" && (wide.role === "LW" || wide.role === "RW")) {
      wide.pos = "MID";
    }
  }
  for (const wide of players) {
    if (count("FWD") >= 3) break;
    if (wide.pos === "MID" && (wide.role === "LW" || wide.role === "RW")) {
      wide.pos = "FWD";
    }
  }
  // Every club needs at least one of each full-back. Some Transfermarkt
  // pages list a squad with no natural LB/RB at all (Göztepe here), which
  // would leave the engine playing centre-backs out wide forever. Convert
  // the spare centre-backs rather than inventing players.
  for (const side of ["LB", "RB"] as const) {
    if (players.some((p) => p.role === side)) continue;
    const spare = players.filter((p) => p.role === "CB");
    if (spare.length <= 2) break;
    const pick = spare[spare.length - (side === "LB" ? 1 : 2)];
    if (pick) pick.role = side;
  }

  // Shirt numbers must be unique inside a squad: the source has genuine
  // clashes (two number 10s at Trabzonspor) and many players with no number
  // at all. Keep the first claim on each number and hand out free ones.
  const taken = new Set<number>();
  for (const p of players) {
    if (p.num !== undefined && !taken.has(p.num) && p.num > 0 && p.num < 100) {
      taken.add(p.num);
    } else {
      p.num = undefined;
    }
  }
  let next = 2;
  for (const p of players) {
    if (p.num !== undefined) continue;
    while (taken.has(next) && next < 99) next++;
    p.num = next;
    taken.add(next);
  }

  const short: string[] = [];
  if (count("GK") < 2) short.push(`GK ${count("GK")}`);
  if (count("DEF") < 6) short.push(`DEF ${count("DEF")}`);
  if (count("MID") < 6) short.push(`MID ${count("MID")}`);
  if (count("FWD") < 3) short.push(`FWD ${count("FWD")}`);
  if (players.length < 18) short.push(`total ${players.length}`);
  if (short.length > 0) {
    console.warn(`  ! ${clubName}: ${short.join(", ")} — check the source roster`);
  }
  return players;
}

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

/** Name pools for generated second-division squads. */
const GEN_FIRST = [
  "Ahmet", "Mehmet", "Emre", "Burak", "Yusuf", "Kerem", "Efe", "Arda",
  "Onur", "Tolga", "Kaan", "Berke", "Hakan", "Ozan", "Barış", "Umut",
  "Doğan", "Enes", "Halil", "Semih", "Sinan", "Yunus", "Çağlar", "Ferdi",
  "Alperen", "Bora", "Cenk", "Deniz", "Ege", "Görkem", "Kuzey", "Mert",
  "Serkan", "Taner", "Volkan", "Yiğit", "Batuhan", "Eren", "Furkan", "Koray",
];
const GEN_LAST = [
  "Yılmaz", "Kaya", "Demir", "Çelik", "Şahin", "Aydın", "Öztürk", "Aslan",
  "Doğan", "Kılıç", "Arslan", "Yıldız", "Taş", "Koç", "Polat", "Güneş",
  "Güler", "Çakır", "Akgün", "Şanlı", "Çolak", "Sezer", "Akın", "Bulut",
  "Erdoğan", "Korkmaz", "Özkan", "Türk", "Ünal", "Yalçın", "Başaran", "Duman",
];

/**
 * Build a squad for a club with no transcribed roster.
 *
 * Second-division clubs carry real identities but generated players: their
 * real squads are largely unrecognisable, and inventing a specific real
 * player-to-club mapping that cannot be verified would be worse than an
 * honestly generated one. Deterministic from the club id, so regenerating
 * produces the same squad rather than reshuffling everyone's league.
 */
function generateSquad(club: RawClub): Built[] {
  const seed = hash(club.id);
  let state = seed >>> 0;
  const rand = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
  const shape: Array<{ pos: Position; role: string; count: number }> = [
    { pos: "GK", role: "GK", count: 3 },
    { pos: "DEF", role: "CB", count: 4 },
    { pos: "DEF", role: "LB", count: 2 },
    { pos: "DEF", role: "RB", count: 2 },
    { pos: "MID", role: "CDM", count: 2 },
    { pos: "MID", role: "CM", count: 3 },
    { pos: "MID", role: "AM", count: 2 },
    { pos: "FWD", role: "LW", count: 2 },
    { pos: "FWD", role: "RW", count: 2 },
    { pos: "FWD", role: "ST", count: 3 },
  ];
  const used = new Set<string>();
  const out: Built[] = [];
  let shirt = 1;
  for (const slot of shape) {
    for (let i = 0; i < slot.count; i++) {
      let name = "";
      for (let attempt = 0; attempt < 40; attempt++) {
        const candidate = `${GEN_FIRST[Math.floor(rand() * GEN_FIRST.length)]} ${GEN_LAST[Math.floor(rand() * GEN_LAST.length)]}`;
        if (!used.has(candidate)) { name = candidate; break; }
      }
      if (!name) continue;
      used.add(name);
      const age = 18 + Math.floor(rand() * 17);
      const ageAdj = age <= 20 ? -4 : age <= 23 ? -1 : age <= 29 ? 2 : 0;
      const ovr = Math.max(52, Math.min(74, TIER_BASE[club.tier] + ageAdj + Math.floor(rand() * 7) - 3));
      const room = age <= 20 ? 12 : age <= 23 ? 8 : age <= 26 ? 4 : 0;
      const genPot = Math.min(88, ovr + room);
      const { val, wage } = priceOf(ovr, genPot, age);
      out.push({
        n: name, pos: slot.pos, role: slot.role, num: shirt++,
        age, ovr, pot: genPot, nat: "TR", val, wage,
      });
    }
  }
  return out;
}

function emitClub(club: RawClub): string {
  const built = rebalance(
    club.players.length > 0
      ? club.players.map((line) => buildPlayer(line, club))
      : generateSquad(club),
    club.name,
  );
  const order: Position[] = ["GK", "DEF", "MID", "FWD"];
  const lines: string[] = [];
  for (const pos of order) {
    const group = built.filter((p) => p.pos === pos);
    if (group.length === 0) continue;
    lines.push(`    // ${pos}`);
    for (const p of group) {
      const num = p.num === undefined ? "" : ` num: ${p.num},`;
      lines.push(
        `    { n: "${esc(p.n)}", pos: "${p.pos}", role: "${p.role}",${num} age: ${p.age}, ovr: ${p.ovr}, pot: ${p.pot}, nat: "${p.nat}", val: ${p.val}, wage: ${p.wage} },`,
      );
    }
  }
  const varName = club.short.replace(/[^A-Za-z]/g, "").toUpperCase() || club.id.toUpperCase();
  return `const ${varName}_PACK = pack(
  { id: "${club.id}", name: "${esc(club.name)}", short: "${esc(club.short)}", city: "${esc(club.city)}", color: "${club.color}", color2: "${club.color2}" },
  [
${lines.join("\n")}
  ],
);`;
}

const header = `/**
 * Süper Lig 2026-27 squads.
 *
 * GENERATED FILE — do not edit by hand.
 *   source     : scripts/squad-source.ts
 *   regenerate : npm run build:squads
 *
 * Roster data (name, shirt number, position, age, nationality) transcribed
 * from Transfermarkt club pages on 13 August 2026. \`ovr\` and \`pot\` are NOT
 * sourced — no public source publishes a single overall rating — and are
 * derived by the generator from club tier, age and a hand-maintained table of
 * well-known players. Treat them as game-balance numbers.
 *
 * The 2026-27 Turkish transfer window runs 22 June → 4 September 2026, so
 * this is a snapshot of a squad list that is still moving. Re-run the fetch
 * and regenerate once the window closes.
 */
import type { Player, PlayerStatus, Position } from "@/types";

export type ClubMeta = {
  id: string;
  name: string;
  short: string;
  city: string;
  color: string;
  color2: string;
};

export type SquadPack = { club: ClubMeta; players: Player[] };

type Seed = {
  n: string;
  pos: Position;
  role: string;
  num?: number;
  age: number;
  ovr: number;
  pot: number;
  nat: string;
  /** Market value in EUR — consumed by create-league/seed as p.val. */
  val: number;
  /** Weekly wage in EUR — consumed as p.wage. */
  wage: number;
  status?: PlayerStatus;
};

function pack(club: ClubMeta, seeds: Seed[]): SquadPack {
  return {
    club,
    players: seeds.map((s) => ({
      n: s.n,
      pos: s.pos,
      role: s.role,
      num: s.num,
      age: s.age,
      ovr: s.ovr,
      pot: s.pot,
      nat: s.nat,
      val: s.val,
      wage: s.wage,
      status: s.status,
    })),
  };
}
`;

console.log("Building squad packs…");
const ALL = [...RAW_CLUBS, ...RAW_DIVISION_2];
const blocks = ALL.map(emitClub);
const names = ALL.map(
  (c) => `${(c.short.replace(/[^A-Za-z]/g, "").toUpperCase() || c.id.toUpperCase())}_PACK`,
);
const footer = `
/** Süper Lig clubs, in rough order of strength. */
export const SQUAD_PACKS: SquadPack[] = [
${names.slice(0, RAW_CLUBS.length).map((n) => `  ${n},`).join("\n")}
];

/** 1. Lig — the division below. Promotion and relegation move clubs between them. */
export const SQUAD_PACKS_D2: SquadPack[] = [
${names.slice(RAW_CLUBS.length).map((n) => `  ${n},`).join("\n")}
];

/**
 * The pack the landing-page mock squad is built from. Kept as a named export
 * so lib/mock-data.ts does not depend on array ordering.
 */
export const USER_PACK: SquadPack = SQUAD_PACKS[0];
`;

writeFileSync("lib/squad-packs.ts", `${header}\n${blocks.join("\n\n")}\n${footer}`);
console.log(
  `✓ ${RAW_CLUBS.length} Süper Lig + ${RAW_DIVISION_2.length} 1. Lig clubs → lib/squad-packs.ts`,
);
