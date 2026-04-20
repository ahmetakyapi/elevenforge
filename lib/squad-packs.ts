/**
 * Süper Lig 2025-26 sezon + Ocak 2026 kış transfer dönemi kadroları.
 *
 * 16 real club, each with a hand-crafted ~20-man squad. seed.ts and
 * create-league.ts drive every new league from this file: the user's
 * club defaults to Fenerbahçe, remaining 15 slots are filled by the
 * other packs in order, so every match-day a recognisable rival shows
 * up on the opposition team-sheet.
 *
 * Player numbers (n, pos, role, age, ovr, pot, nat) are the only
 * fields hand-typed. Market value / wage / starting fitness / morale
 * / form / contract years are derived from age+ovr via fillDefaults
 * below so a roster tweak only needs to change the primary stats.
 *
 * OVR bands (rough guide):
 *   87+ elite stars — Top-2 talisman tier
 *   82-86 Champions League regulars
 *   77-81 Süper Lig first-choice
 *   72-76 squad rotation
 *   ≤71  bench / youth
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

type PlayerMini = {
  n: string;
  pos: Position;
  role: string;
  num: number;
  age: number;
  ovr: number;
  pot: number;
  nat: string;
  status?: PlayerStatus;
};

export type SquadPack = {
  club: ClubMeta;
  players: Player[];
  // Position-level secondary role map — lets engine pick a backup RW
  // when the first-choice is suspended without hardcoding it globally.
  secondary?: Record<string, string[]>;
};

// Derive realistic market value & wage from age/ovr/potential.
// Young high-potential players command a premium (1.2× for ≤24);
// vets >30 take a 0.7× hit. Wage = ~0.5% of value per week.
function deriveValue(age: number, ovr: number, pot: number): number {
  return Math.max(
    300_000,
    Math.round(
      Math.pow(Math.max(0, ovr - 55), 2.6) * 22_000 *
        (1 + (pot - ovr) * 0.08) *
        (age <= 24 ? 1.2 : age >= 31 ? 0.7 : 1.0),
    ),
  );
}

function fillDefaults(p: PlayerMini): Player {
  const val = deriveValue(p.age, p.ovr, p.pot);
  const wage = Math.max(12_000, Math.round(val / 200));
  // Form samples bracket the player's talent: stars around 7.5-8, mid
  // around 6.8-7.2, depth around 6.5-6.9. Randomisation is left to
  // match-day; these are just starting values.
  const base = p.ovr >= 85 ? 7.6 : p.ovr >= 80 ? 7.2 : p.ovr >= 75 ? 6.9 : 6.6;
  return {
    n: p.n,
    pos: p.pos,
    role: p.role,
    num: p.num,
    age: p.age,
    ovr: p.ovr,
    pot: p.pot,
    nat: p.nat,
    fit: 90,
    mor: p.ovr >= 80 ? 5 : 4,
    wage,
    val,
    form: [base, base + 0.1, base - 0.1, base + 0.2, base - 0.05],
    ctr: p.age >= 32 ? 1 : p.age >= 28 ? 2 : 3,
    status: p.status,
  };
}

const pack = (
  club: ClubMeta,
  minis: PlayerMini[],
  secondary?: Record<string, string[]>,
): SquadPack => ({
  club,
  players: minis.map(fillDefaults),
  secondary,
});

// ─── 1. Fenerbahçe ───────────────────────────────────────────────
const FENERBAHCE = pack(
  { id: "fb", name: "Fenerbahçe", short: "FB", city: "İstanbul", color: "#14317f", color2: "#facc15" },
  [
    { n: "Ederson",             pos: "GK",  role: "GK",  num: 1,  age: 32, ovr: 87, pot: 87, nat: "BR" },
    { n: "Dominik Livaković",   pos: "GK",  role: "GK",  num: 34, age: 30, ovr: 82, pot: 82, nat: "HR" },
    { n: "Milan Škriniar",      pos: "DEF", role: "CB",  num: 37, age: 31, ovr: 86, pot: 86, nat: "SK" },
    { n: "Çağlar Söyüncü",      pos: "DEF", role: "CB",  num: 4,  age: 30, ovr: 82, pot: 82, nat: "TR" },
    { n: "Alexander Djiku",     pos: "DEF", role: "CB",  num: 18, age: 31, ovr: 80, pot: 80, nat: "GH" },
    { n: "Diego Carlos",        pos: "DEF", role: "CB",  num: 5,  age: 32, ovr: 78, pot: 78, nat: "BR" },
    { n: "Jayden Oosterwolde",  pos: "DEF", role: "LB",  num: 14, age: 25, ovr: 81, pot: 85, nat: "NL" },
    { n: "Archie Brown",        pos: "DEF", role: "LB",  num: 3,  age: 23, ovr: 78, pot: 85, nat: "EN" },
    { n: "Bright Osayi-Samuel", pos: "DEF", role: "RB",  num: 17, age: 28, ovr: 82, pot: 82, nat: "NG" },
    { n: "Mert Müldür",         pos: "DEF", role: "RB",  num: 32, age: 27, ovr: 76, pot: 79, nat: "TR" },
    { n: "N'Golo Kanté",        pos: "MID", role: "CDM", num: 7,  age: 35, ovr: 85, pot: 85, nat: "FR" },
    { n: "Mateo Guendouzi",     pos: "MID", role: "CM",  num: 6,  age: 27, ovr: 83, pot: 85, nat: "FR" },
    { n: "Sofyan Amrabat",      pos: "MID", role: "CDM", num: 28, age: 28, ovr: 81, pot: 83, nat: "MA" },
    { n: "İsmail Yüksek",       pos: "MID", role: "CM",  num: 8,  age: 26, ovr: 78, pot: 82, nat: "TR" },
    { n: "Sebastian Szymański", pos: "MID", role: "AM",  num: 10, age: 27, ovr: 85, pot: 86, nat: "PL" },
    { n: "Marco Asensio",       pos: "MID", role: "AM",  num: 20, age: 30, ovr: 84, pot: 84, nat: "ES" },
    { n: "Oğuz Aydın",          pos: "MID", role: "RW",  num: 29, age: 23, ovr: 76, pot: 83, nat: "TR", status: "training" },
    { n: "Anderson Talisca",    pos: "FWD", role: "ST",  num: 9,  age: 32, ovr: 85, pot: 85, nat: "BR" },
    { n: "Youssef En-Nesyri",   pos: "FWD", role: "ST",  num: 15, age: 28, ovr: 84, pot: 85, nat: "MA" },
    { n: "Kerem Aktürkoğlu",    pos: "MID", role: "LW",  num: 11, age: 27, ovr: 83, pot: 84, nat: "TR" },
    { n: "Dorgeles Nene",       pos: "MID", role: "LW",  num: 23, age: 23, ovr: 78, pot: 85, nat: "ML" },
    { n: "Cherif Ndiaye",       pos: "FWD", role: "ST",  num: 22, age: 26, ovr: 77, pot: 81, nat: "SN" },
    { n: "Cenk Tosun",          pos: "FWD", role: "ST",  num: 19, age: 33, ovr: 73, pot: 73, nat: "TR", status: "injured" },
  ],
  {
    "Jayden Oosterwolde": ["CB", "LW"],
    "Archie Brown": ["LW"],
    "Bright Osayi-Samuel": ["RW", "CB"],
    "Mert Müldür": ["CB"],
    "Sofyan Amrabat": ["CM", "CB"],
    "Mateo Guendouzi": ["CDM", "AM"],
    "İsmail Yüksek": ["CDM", "AM"],
    "Sebastian Szymański": ["CM", "LW"],
    "Marco Asensio": ["RW", "LW"],
    "Oğuz Aydın": ["LW", "AM"],
    "Kerem Aktürkoğlu": ["RW", "ST"],
    "Dorgeles Nene": ["RW", "ST"],
    "Anderson Talisca": ["AM", "CF"],
  },
);

// ─── 2. Galatasaray ──────────────────────────────────────────────
const GALATASARAY = pack(
  { id: "gs", name: "Galatasaray", short: "GS", city: "İstanbul", color: "#a61212", color2: "#fdba24" },
  [
    { n: "Uğurcan Çakır",       pos: "GK",  role: "GK",  num: 1,  age: 28, ovr: 85, pot: 86, nat: "TR" },
    { n: "Fernando Muslera",    pos: "GK",  role: "GK",  num: 25, age: 38, ovr: 79, pot: 79, nat: "UY" },
    { n: "Günay Güvenç",        pos: "GK",  role: "GK",  num: 81, age: 33, ovr: 73, pot: 73, nat: "TR" },
    { n: "Davinson Sánchez",    pos: "DEF", role: "CB",  num: 6,  age: 29, ovr: 83, pot: 83, nat: "CO" },
    { n: "Abdülkerim Bardakcı", pos: "DEF", role: "CB",  num: 4,  age: 30, ovr: 80, pot: 80, nat: "TR" },
    { n: "Kaan Ayhan",          pos: "DEF", role: "CB",  num: 16, age: 30, ovr: 77, pot: 77, nat: "TR" },
    { n: "Wilfried Singo",      pos: "DEF", role: "RB",  num: 2,  age: 24, ovr: 81, pot: 85, nat: "CI" },
    { n: "Ismail Jakobs",       pos: "DEF", role: "LB",  num: 3,  age: 26, ovr: 78, pot: 81, nat: "SN" },
    { n: "Derrick Köhn",        pos: "DEF", role: "LB",  num: 23, age: 26, ovr: 76, pot: 79, nat: "DE" },
    { n: "Elias Jelert",        pos: "DEF", role: "RB",  num: 18, age: 22, ovr: 75, pot: 82, nat: "DK" },
    { n: "Lucas Torreira",      pos: "MID", role: "CDM", num: 34, age: 29, ovr: 82, pot: 83, nat: "UY" },
    { n: "Mario Lemina",        pos: "MID", role: "CDM", num: 5,  age: 31, ovr: 80, pot: 80, nat: "GA" },
    { n: "İlkay Gündoğan",      pos: "MID", role: "CM",  num: 8,  age: 34, ovr: 84, pot: 84, nat: "DE" },
    { n: "Gabriel Sara",        pos: "MID", role: "CM",  num: 17, age: 26, ovr: 80, pot: 83, nat: "BR" },
    { n: "Berkan Kutlu",        pos: "MID", role: "CM",  num: 15, age: 27, ovr: 75, pot: 77, nat: "TR" },
    { n: "Victor Osimhen",      pos: "FWD", role: "ST",  num: 9,  age: 26, ovr: 89, pot: 91, nat: "NG" },
    { n: "Mauro Icardi",        pos: "FWD", role: "ST",  num: 10, age: 32, ovr: 83, pot: 83, nat: "AR" },
    { n: "Barış Alper Yılmaz",  pos: "MID", role: "RW",  num: 7,  age: 25, ovr: 83, pot: 85, nat: "TR" },
    { n: "Yunus Akgün",         pos: "MID", role: "RW",  num: 20, age: 25, ovr: 77, pot: 81, nat: "TR" },
    { n: "Roland Sallai",       pos: "MID", role: "LW",  num: 11, age: 28, ovr: 77, pot: 78, nat: "HU" },
  ],
);

// ─── 3. Beşiktaş ─────────────────────────────────────────────────
const BESIKTAS = pack(
  { id: "bjk", name: "Beşiktaş", short: "BJK", city: "İstanbul", color: "#111114", color2: "#f4f5f7" },
  [
    { n: "Mert Günok",          pos: "GK",  role: "GK",  num: 1,  age: 35, ovr: 81, pot: 81, nat: "TR" },
    { n: "Ersin Destanoğlu",    pos: "GK",  role: "GK",  num: 34, age: 24, ovr: 77, pot: 83, nat: "TR" },
    { n: "Gabriel Paulista",    pos: "DEF", role: "CB",  num: 4,  age: 35, ovr: 80, pot: 80, nat: "BR" },
    { n: "Felix Uduokhai",      pos: "DEF", role: "CB",  num: 5,  age: 27, ovr: 78, pot: 80, nat: "DE" },
    { n: "Emrecan Uzunhan",     pos: "DEF", role: "CB",  num: 14, age: 22, ovr: 75, pot: 83, nat: "TR" },
    { n: "Omar Colley",         pos: "DEF", role: "CB",  num: 21, age: 33, ovr: 76, pot: 76, nat: "GM" },
    { n: "Arthur Masuaku",      pos: "DEF", role: "LB",  num: 19, age: 32, ovr: 77, pot: 77, nat: "CD" },
    { n: "Jonas Svensson",      pos: "DEF", role: "RB",  num: 22, age: 32, ovr: 74, pot: 74, nat: "NO" },
    { n: "Salih Uçan",          pos: "MID", role: "CM",  num: 7,  age: 31, ovr: 77, pot: 77, nat: "TR" },
    { n: "Gedson Fernandes",    pos: "MID", role: "CM",  num: 28, age: 26, ovr: 80, pot: 82, nat: "PT" },
    { n: "João Mário",          pos: "MID", role: "CM",  num: 23, age: 32, ovr: 79, pot: 79, nat: "PT" },
    { n: "Amir Hadžiahmetović", pos: "MID", role: "CDM", num: 6,  age: 28, ovr: 76, pot: 78, nat: "BA" },
    { n: "Rafa Silva",          pos: "MID", role: "AM",  num: 10, age: 32, ovr: 85, pot: 85, nat: "PT" },
    { n: "Ernest Muçi",         pos: "MID", role: "AM",  num: 17, age: 24, ovr: 77, pot: 82, nat: "AL" },
    { n: "Milot Rashica",       pos: "MID", role: "LW",  num: 11, age: 29, ovr: 78, pot: 78, nat: "AL" },
    { n: "Vaclav Cerny",        pos: "MID", role: "RW",  num: 20, age: 28, ovr: 77, pot: 79, nat: "CZ" },
    { n: "Cengiz Ünder",        pos: "MID", role: "RW",  num: 17, age: 28, ovr: 78, pot: 78, nat: "TR" },
    { n: "Ciro Immobile",       pos: "FWD", role: "ST",  num: 9,  age: 36, ovr: 82, pot: 82, nat: "IT" },
    { n: "Semih Kılıçsoy",      pos: "FWD", role: "ST",  num: 39, age: 20, ovr: 77, pot: 87, nat: "TR" },
    { n: "El Bilal Touré",      pos: "FWD", role: "ST",  num: 15, age: 24, ovr: 77, pot: 83, nat: "ML" },
  ],
);

// ─── 4. Trabzonspor ──────────────────────────────────────────────
const TRABZONSPOR = pack(
  { id: "ts", name: "Trabzonspor", short: "TS", city: "Trabzon", color: "#7a1b1f", color2: "#1e3a8a" },
  [
    { n: "Onuralp Çevikkan",    pos: "GK",  role: "GK",  num: 1,  age: 28, ovr: 76, pot: 78, nat: "TR" },
    { n: "Erce Kardeşler",      pos: "GK",  role: "GK",  num: 25, age: 26, ovr: 72, pot: 75, nat: "TR" },
    { n: "Stefano Denswil",     pos: "DEF", role: "CB",  num: 4,  age: 32, ovr: 75, pot: 75, nat: "NL" },
    { n: "Mustafa Eskihellaç",  pos: "DEF", role: "CB",  num: 3,  age: 25, ovr: 75, pot: 79, nat: "TR" },
    { n: "Arif Boşluk",         pos: "DEF", role: "LB",  num: 15, age: 24, ovr: 73, pot: 79, nat: "TR" },
    { n: "Hüseyin Türkmen",     pos: "DEF", role: "RB",  num: 22, age: 25, ovr: 74, pot: 80, nat: "TR" },
    { n: "Taha Altıkardeş",     pos: "DEF", role: "CB",  num: 33, age: 24, ovr: 73, pot: 79, nat: "TR" },
    { n: "Salih Malkoçoğlu",    pos: "DEF", role: "LB",  num: 24, age: 23, ovr: 72, pot: 79, nat: "TR" },
    { n: "Okay Yokuşlu",        pos: "MID", role: "CDM", num: 8,  age: 31, ovr: 78, pot: 78, nat: "TR" },
    { n: "Batista Mendy",       pos: "MID", role: "CDM", num: 14, age: 24, ovr: 76, pot: 81, nat: "FR" },
    { n: "Enis Bardhi",         pos: "MID", role: "AM",  num: 10, age: 29, ovr: 76, pot: 76, nat: "MK" },
    { n: "Anastasios Bakasetas",pos: "MID", role: "AM",  num: 20, age: 32, ovr: 77, pot: 77, nat: "GR" },
    { n: "Muhammed Cham",       pos: "MID", role: "RW",  num: 17, age: 25, ovr: 74, pot: 78, nat: "AT" },
    { n: "Oleksandr Zubkov",    pos: "MID", role: "LW",  num: 19, age: 28, ovr: 76, pot: 77, nat: "UA" },
    { n: "Edin Višća",          pos: "MID", role: "RW",  num: 77, age: 34, ovr: 75, pot: 75, nat: "BA" },
    { n: "Trezeguet",           pos: "MID", role: "LW",  num: 7,  age: 30, ovr: 76, pot: 76, nat: "EG" },
    { n: "Nicolás Pépé",        pos: "MID", role: "RW",  num: 27, age: 30, ovr: 78, pot: 78, nat: "CI" },
    { n: "Paul Onuachu",        pos: "FWD", role: "ST",  num: 9,  age: 30, ovr: 80, pot: 80, nat: "NG" },
    { n: "Denis Draguș",        pos: "FWD", role: "ST",  num: 33, age: 25, ovr: 74, pot: 79, nat: "RO" },
    { n: "Mislav Oršić",        pos: "MID", role: "LW",  num: 11, age: 33, ovr: 76, pot: 76, nat: "HR" },
  ],
);

// ─── 5. Başakşehir ────────────────────────────────────────────────
const BASAKSEHIR = pack(
  { id: "ibfk", name: "Başakşehir FK", short: "İBFK", city: "İstanbul", color: "#f97316", color2: "#1e3a8a" },
  [
    { n: "Volkan Babacan",      pos: "GK",  role: "GK",  num: 1,  age: 37, ovr: 76, pot: 76, nat: "TR" },
    { n: "Muhammed Şengezer",   pos: "GK",  role: "GK",  num: 25, age: 26, ovr: 72, pot: 76, nat: "TR" },
    { n: "Bertuğ Özgür Yıldırım",pos: "DEF",role: "CB",  num: 4,  age: 24, ovr: 73, pot: 78, nat: "TR" },
    { n: "Hamza Güreler",       pos: "DEF", role: "CB",  num: 3,  age: 28, ovr: 75, pot: 76, nat: "TR" },
    { n: "Leo Duarte",          pos: "DEF", role: "CB",  num: 6,  age: 29, ovr: 76, pot: 76, nat: "BR" },
    { n: "Ahmed Touba",         pos: "DEF", role: "CB",  num: 23, age: 27, ovr: 74, pot: 76, nat: "AL" },
    { n: "Ousseynou Ba",        pos: "DEF", role: "CB",  num: 5,  age: 30, ovr: 75, pot: 75, nat: "SN" },
    { n: "Ömer Ali Şahiner",    pos: "DEF", role: "LB",  num: 7,  age: 33, ovr: 73, pot: 73, nat: "TR" },
    { n: "Deniz Türüç",         pos: "MID", role: "CM",  num: 10, age: 32, ovr: 76, pot: 76, nat: "TR" },
    { n: "Ba. Traoré",          pos: "MID", role: "CDM", num: 15, age: 26, ovr: 74, pot: 78, nat: "ML" },
    { n: "Opoku Ampomah",       pos: "MID", role: "LW",  num: 11, age: 28, ovr: 74, pot: 75, nat: "GH" },
    { n: "Christ Bongou",       pos: "MID", role: "AM",  num: 8,  age: 23, ovr: 74, pot: 81, nat: "CM" },
    { n: "Olivier Kemen",       pos: "MID", role: "CM",  num: 20, age: 29, ovr: 75, pot: 75, nat: "CM" },
    { n: "Yusuf Sarı",          pos: "MID", role: "RW",  num: 17, age: 27, ovr: 74, pot: 76, nat: "TR" },
    { n: "Eldor Shomurodov",    pos: "FWD", role: "ST",  num: 9,  age: 30, ovr: 78, pot: 78, nat: "UZ" },
    { n: "Krzysztof Piątek",    pos: "FWD", role: "ST",  num: 19, age: 30, ovr: 77, pot: 77, nat: "PL" },
    { n: "Nuno da Costa",       pos: "FWD", role: "ST",  num: 14, age: 34, ovr: 73, pot: 73, nat: "CV" },
    { n: "Davie Selke",         pos: "FWD", role: "ST",  num: 22, age: 31, ovr: 74, pot: 74, nat: "DE" },
    { n: "Serdar Gürler",       pos: "MID", role: "LW",  num: 21, age: 34, ovr: 72, pot: 72, nat: "TR" },
    { n: "Ömer Kahveci",        pos: "DEF", role: "RB",  num: 2,  age: 24, ovr: 73, pot: 79, nat: "TR" },
  ],
);

// ─── 6. Samsunspor ───────────────────────────────────────────────
const SAMSUNSPOR = pack(
  { id: "sam", name: "Samsunspor", short: "SAM", city: "Samsun", color: "#b91c1c", color2: "#f4f5f7" },
  [
    { n: "Okan Kocuk",          pos: "GK",  role: "GK",  num: 1,  age: 30, ovr: 75, pot: 75, nat: "TR" },
    { n: "Albert Posiadała",    pos: "GK",  role: "GK",  num: 25, age: 24, ovr: 70, pot: 75, nat: "PL" },
    { n: "Joe Rodon",           pos: "DEF", role: "CB",  num: 5,  age: 28, ovr: 77, pot: 79, nat: "WL" },
    { n: "Zeki Yavru",          pos: "DEF", role: "CB",  num: 4,  age: 31, ovr: 74, pot: 74, nat: "TR" },
    { n: "Toni Borevković",     pos: "DEF", role: "CB",  num: 6,  age: 28, ovr: 75, pot: 76, nat: "HR" },
    { n: "Soner Aydoğdu",       pos: "DEF", role: "LB",  num: 3,  age: 34, ovr: 74, pot: 74, nat: "TR" },
    { n: "Rick van Drongelen",  pos: "DEF", role: "CB",  num: 15, age: 27, ovr: 75, pot: 76, nat: "NL" },
    { n: "Logi Tómasson",       pos: "DEF", role: "RB",  num: 2,  age: 23, ovr: 73, pot: 78, nat: "IS" },
    { n: "Dimitrios Kolovos",   pos: "MID", role: "AM",  num: 10, age: 32, ovr: 75, pot: 75, nat: "GR" },
    { n: "Soner Gönül",         pos: "MID", role: "CM",  num: 18, age: 30, ovr: 74, pot: 74, nat: "TR" },
    { n: "Antoine Makoumbou",   pos: "MID", role: "CDM", num: 8,  age: 27, ovr: 76, pot: 77, nat: "CG" },
    { n: "Olivier Ntcham",      pos: "MID", role: "CM",  num: 20, age: 29, ovr: 76, pot: 76, nat: "CM" },
    { n: "Musaba",              pos: "MID", role: "LW",  num: 11, age: 23, ovr: 74, pot: 80, nat: "NL" },
    { n: "Holse",               pos: "MID", role: "RW",  num: 17, age: 25, ovr: 73, pot: 77, nat: "DK" },
    { n: "Mouhamed Mbaye",      pos: "MID", role: "AM",  num: 22, age: 22, ovr: 73, pot: 82, nat: "SN" },
    { n: "Emre Kılınç",         pos: "MID", role: "LW",  num: 14, age: 31, ovr: 75, pot: 75, nat: "TR" },
    { n: "Carlo Holse",         pos: "MID", role: "RW",  num: 27, age: 26, ovr: 74, pot: 76, nat: "DK" },
    { n: "Marius Mouandilmadji",pos: "FWD", role: "ST",  num: 9,  age: 26, ovr: 75, pot: 78, nat: "TD" },
    { n: "Anthony Musaba",      pos: "FWD", role: "ST",  num: 21, age: 23, ovr: 74, pot: 81, nat: "NL" },
    { n: "Josué Soto",          pos: "DEF", role: "LB",  num: 19, age: 25, ovr: 72, pot: 76, nat: "PT" },
  ],
);

// ─── 7. Göztepe ──────────────────────────────────────────────────
const GOZTEPE = pack(
  { id: "gzt", name: "Göztepe", short: "GZT", city: "İzmir", color: "#dc2626", color2: "#facc15" },
  [
    { n: "Mateusz Lis",         pos: "GK",  role: "GK",  num: 1,  age: 27, ovr: 76, pot: 79, nat: "PL" },
    { n: "Onurcan Piri",        pos: "GK",  role: "GK",  num: 25, age: 26, ovr: 71, pot: 75, nat: "TR" },
    { n: "Max Graf",            pos: "DEF", role: "CB",  num: 5,  age: 28, ovr: 75, pot: 76, nat: "AT" },
    { n: "Taha Altıkardeş",     pos: "DEF", role: "CB",  num: 4,  age: 24, ovr: 73, pot: 79, nat: "TR" },
    { n: "Malcom Bokele",       pos: "DEF", role: "CB",  num: 6,  age: 24, ovr: 73, pot: 79, nat: "CM" },
    { n: "Heliton",             pos: "DEF", role: "CB",  num: 3,  age: 29, ovr: 74, pot: 74, nat: "BR" },
    { n: "Kerem Demirbay",      pos: "MID", role: "CM",  num: 8,  age: 32, ovr: 77, pot: 77, nat: "TR" },
    { n: "Efkan Bekiroğlu",     pos: "MID", role: "AM",  num: 10, age: 30, ovr: 75, pot: 75, nat: "TR" },
    { n: "Janderson",           pos: "FWD", role: "ST",  num: 9,  age: 27, ovr: 76, pot: 78, nat: "BR" },
    { n: "Romulo",              pos: "MID", role: "RW",  num: 7,  age: 27, ovr: 75, pot: 78, nat: "BR" },
    { n: "Dennis",              pos: "FWD", role: "ST",  num: 11, age: 28, ovr: 76, pot: 76, nat: "NG" },
    { n: "Ahmed Ildız",         pos: "DEF", role: "RB",  num: 14, age: 25, ovr: 72, pot: 77, nat: "TR" },
    { n: "Rhaldney",            pos: "MID", role: "CDM", num: 15, age: 25, ovr: 74, pot: 79, nat: "BR" },
    { n: "Taha Emre İnce",      pos: "MID", role: "CM",  num: 18, age: 23, ovr: 72, pot: 79, nat: "TR" },
    { n: "Olaitan",             pos: "MID", role: "LW",  num: 27, age: 28, ovr: 74, pot: 75, nat: "NG" },
    { n: "Sabra Lidor Cohen",   pos: "FWD", role: "ST",  num: 22, age: 26, ovr: 74, pot: 77, nat: "IL" },
    { n: "Uğur Kaan Yıldız",    pos: "MID", role: "CDM", num: 20, age: 22, ovr: 71, pot: 80, nat: "TR" },
    { n: "Anthony Dennis",      pos: "MID", role: "AM",  num: 24, age: 27, ovr: 73, pot: 75, nat: "NG" },
    { n: "Juan",                pos: "DEF", role: "LB",  num: 33, age: 25, ovr: 72, pot: 76, nat: "BR" },
    { n: "Ege Bilsel",          pos: "MID", role: "CM",  num: 19, age: 21, ovr: 70, pot: 80, nat: "TR" },
  ],
);

// ─── 8. Antalyaspor ──────────────────────────────────────────────
const ANTALYASPOR = pack(
  { id: "ant", name: "Antalyaspor", short: "ANT", city: "Antalya", color: "#e11d48", color2: "#f4f5f7" },
  [
    { n: "Julian Cuesta",       pos: "GK",  role: "GK",  num: 1,  age: 34, ovr: 75, pot: 75, nat: "ES" },
    { n: "Helton Leite",        pos: "GK",  role: "GK",  num: 25, age: 34, ovr: 73, pot: 73, nat: "BR" },
    { n: "Mikael Soisalo",      pos: "MID", role: "LW",  num: 11, age: 28, ovr: 75, pot: 75, nat: "FI" },
    { n: "Saul Guarirapa",      pos: "FWD", role: "ST",  num: 9,  age: 25, ovr: 76, pot: 79, nat: "VE" },
    { n: "Sander van de Streek",pos: "MID", role: "CM",  num: 8,  age: 32, ovr: 74, pot: 74, nat: "NL" },
    { n: "Alexandru Maxim",     pos: "MID", role: "AM",  num: 10, age: 34, ovr: 75, pot: 75, nat: "RO" },
    { n: "Hakan Özmert",        pos: "MID", role: "CM",  num: 17, age: 36, ovr: 72, pot: 72, nat: "TR" },
    { n: "Samet Karakoç",       pos: "DEF", role: "CB",  num: 4,  age: 24, ovr: 73, pot: 78, nat: "TR" },
    { n: "Ismail Köybaşı",      pos: "DEF", role: "LB",  num: 3,  age: 36, ovr: 71, pot: 71, nat: "TR" },
    { n: "Veysel Sarı",         pos: "DEF", role: "CB",  num: 5,  age: 36, ovr: 71, pot: 71, nat: "TR" },
    { n: "Doğukan Sinik",       pos: "MID", role: "AM",  num: 23, age: 26, ovr: 76, pot: 79, nat: "TR" },
    { n: "Boffin",              pos: "DEF", role: "CB",  num: 6,  age: 28, ovr: 73, pot: 75, nat: "BE" },
    { n: "Gueye",               pos: "MID", role: "CDM", num: 14, age: 26, ovr: 74, pot: 77, nat: "SN" },
    { n: "Eren Erdoğan",        pos: "MID", role: "CM",  num: 20, age: 24, ovr: 71, pot: 78, nat: "TR" },
    { n: "Storm",               pos: "MID", role: "LW",  num: 15, age: 25, ovr: 73, pot: 77, nat: "NO" },
    { n: "Sulayman Marreh",     pos: "MID", role: "CDM", num: 18, age: 28, ovr: 74, pot: 75, nat: "GM" },
    { n: "Güray Vural",         pos: "DEF", role: "RB",  num: 2,  age: 37, ovr: 70, pot: 70, nat: "TR" },
    { n: "Soner Dikmen",        pos: "MID", role: "CM",  num: 7,  age: 31, ovr: 74, pot: 74, nat: "TR" },
    { n: "Efkan Sayın",         pos: "MID", role: "RW",  num: 27, age: 22, ovr: 71, pot: 80, nat: "TR" },
    { n: "Yohan Boli",          pos: "FWD", role: "ST",  num: 19, age: 31, ovr: 74, pot: 74, nat: "CI" },
  ],
);

// ─── 9. Konyaspor ────────────────────────────────────────────────
const KONYASPOR = pack(
  { id: "kon", name: "Konyaspor", short: "KON", city: "Konya", color: "#15803d", color2: "#f4f5f7" },
  [
    { n: "Bahadır Güngördü",    pos: "GK",  role: "GK",  num: 1,  age: 28, ovr: 75, pot: 77, nat: "TR" },
    { n: "Ahmet Ildız",         pos: "GK",  role: "GK",  num: 25, age: 26, ovr: 72, pot: 75, nat: "TR" },
    { n: "Guilherme",           pos: "DEF", role: "CB",  num: 5,  age: 30, ovr: 76, pot: 76, nat: "BR" },
    { n: "Adil Demirbağ",       pos: "DEF", role: "CB",  num: 4,  age: 30, ovr: 73, pot: 73, nat: "TR" },
    { n: "Endri Çekiçi",        pos: "MID", role: "AM",  num: 10, age: 28, ovr: 75, pot: 75, nat: "AL" },
    { n: "Melih Bostan",        pos: "DEF", role: "CB",  num: 3,  age: 26, ovr: 73, pot: 77, nat: "TR" },
    { n: "Marko Jevtović",      pos: "MID", role: "CDM", num: 8,  age: 32, ovr: 76, pot: 76, nat: "RS" },
    { n: "Umut Nayir",          pos: "FWD", role: "ST",  num: 9,  age: 32, ovr: 75, pot: 75, nat: "TR" },
    { n: "Muhittin Şeker",      pos: "MID", role: "AM",  num: 11, age: 25, ovr: 73, pot: 77, nat: "TR" },
    { n: "Vedat Muric",         pos: "FWD", role: "ST",  num: 21, age: 32, ovr: 76, pot: 76, nat: "XK" },
    { n: "Bryan Assoukou",      pos: "MID", role: "CM",  num: 17, age: 26, ovr: 74, pot: 77, nat: "CI" },
    { n: "Oğuz Gürbulak",       pos: "MID", role: "RW",  num: 19, age: 25, ovr: 73, pot: 78, nat: "TR" },
    { n: "Ömer Faruk Beyaz",    pos: "MID", role: "AM",  num: 14, age: 22, ovr: 72, pot: 80, nat: "TR" },
    { n: "Rayyan Baniya",       pos: "DEF", role: "CB",  num: 6,  age: 24, ovr: 75, pot: 80, nat: "TR" },
    { n: "Moussa Sow",          pos: "FWD", role: "ST",  num: 25, age: 39, ovr: 70, pot: 70, nat: "SN" },
    { n: "Fodé Koita",          pos: "FWD", role: "ST",  num: 27, age: 33, ovr: 73, pot: 73, nat: "CI" },
    { n: "Uğurcan Yazğılı",     pos: "MID", role: "CM",  num: 18, age: 22, ovr: 71, pot: 79, nat: "TR" },
    { n: "Doğukan Haspolat",    pos: "DEF", role: "LB",  num: 2,  age: 26, ovr: 73, pot: 76, nat: "TR" },
    { n: "Ahmet Ünlü",          pos: "DEF", role: "RB",  num: 22, age: 24, ovr: 72, pot: 77, nat: "TR" },
    { n: "Artem Kravets",       pos: "FWD", role: "ST",  num: 33, age: 36, ovr: 72, pot: 72, nat: "UA" },
  ],
);

// ─── 10. Alanyaspor ──────────────────────────────────────────────
const ALANYASPOR = pack(
  { id: "aln", name: "Alanyaspor", short: "ALN", city: "Antalya", color: "#ea580c", color2: "#15803d" },
  [
    { n: "Ertuğrul Taşkıran",   pos: "GK",  role: "GK",  num: 1,  age: 36, ovr: 74, pot: 74, nat: "TR" },
    { n: "Runar Sigurgeirsson", pos: "GK",  role: "GK",  num: 25, age: 28, ovr: 72, pot: 74, nat: "IS" },
    { n: "Ümit Akdağ",          pos: "DEF", role: "CB",  num: 4,  age: 21, ovr: 73, pot: 82, nat: "TR" },
    { n: "Baiano",              pos: "DEF", role: "CB",  num: 5,  age: 30, ovr: 75, pot: 75, nat: "BR" },
    { n: "Efkan Bekiroğlu",     pos: "MID", role: "AM",  num: 10, age: 30, ovr: 75, pot: 75, nat: "TR" },
    { n: "Nacho Martínez",      pos: "DEF", role: "CB",  num: 6,  age: 26, ovr: 74, pot: 77, nat: "ES" },
    { n: "Berkan Taz",          pos: "DEF", role: "LB",  num: 3,  age: 25, ovr: 73, pot: 77, nat: "TR" },
    { n: "Hwang Ui-Jo",         pos: "FWD", role: "ST",  num: 9,  age: 33, ovr: 76, pot: 76, nat: "KR" },
    { n: "Izzet Celik",         pos: "MID", role: "AM",  num: 8,  age: 26, ovr: 74, pot: 77, nat: "TR" },
    { n: "Kingsley Michael",    pos: "MID", role: "CDM", num: 14, age: 26, ovr: 74, pot: 77, nat: "NG" },
    { n: "Papy Mison",          pos: "FWD", role: "ST",  num: 18, age: 28, ovr: 75, pot: 75, nat: "CG" },
    { n: "Ogulcan Özdemir",     pos: "MID", role: "RW",  num: 7,  age: 27, ovr: 73, pot: 75, nat: "TR" },
    { n: "Maestro",             pos: "MID", role: "CM",  num: 17, age: 25, ovr: 74, pot: 78, nat: "CI" },
    { n: "Yusuf Özdemir",       pos: "MID", role: "CM",  num: 22, age: 24, ovr: 72, pot: 79, nat: "TR" },
    { n: "Enes Keskin",         pos: "DEF", role: "RB",  num: 2,  age: 25, ovr: 72, pot: 77, nat: "TR" },
    { n: "Frey Stefanos",       pos: "FWD", role: "ST",  num: 29, age: 27, ovr: 74, pot: 76, nat: "GR" },
    { n: "Maicon Souza",        pos: "DEF", role: "CB",  num: 15, age: 30, ovr: 73, pot: 73, nat: "BR" },
    { n: "Yusuf Erdoğan",       pos: "MID", role: "LW",  num: 11, age: 33, ovr: 73, pot: 73, nat: "TR" },
    { n: "Ahmet Sagat",         pos: "FWD", role: "ST",  num: 19, age: 24, ovr: 73, pot: 79, nat: "TR" },
    { n: "Leandro Barreiro",    pos: "MID", role: "CM",  num: 6,  age: 26, ovr: 75, pot: 78, nat: "LU" },
  ],
);

// ─── 11. Kasımpaşa ───────────────────────────────────────────────
const KASIMPASA = pack(
  { id: "ksm", name: "Kasımpaşa", short: "KSM", city: "İstanbul", color: "#1e3a8a", color2: "#f4f5f7" },
  [
    { n: "Berke Özer",          pos: "GK",  role: "GK",  num: 1,  age: 26, ovr: 76, pot: 81, nat: "TR" },
    { n: "Erdem Canpolat",      pos: "GK",  role: "GK",  num: 25, age: 26, ovr: 72, pot: 76, nat: "TR" },
    { n: "Evangelos Pavlidis",  pos: "FWD", role: "ST",  num: 9,  age: 27, ovr: 78, pot: 80, nat: "GR" },
    { n: "Winck",               pos: "DEF", role: "CB",  num: 5,  age: 29, ovr: 75, pot: 75, nat: "BR" },
    { n: "Ibrahim Kiyak",       pos: "DEF", role: "CB",  num: 4,  age: 29, ovr: 73, pot: 73, nat: "TR" },
    { n: "Fousseni Diabaté",    pos: "MID", role: "LW",  num: 11, age: 31, ovr: 75, pot: 75, nat: "ML" },
    { n: "Benjamin Verbič",     pos: "MID", role: "RW",  num: 10, age: 32, ovr: 75, pot: 75, nat: "SI" },
    { n: "Aytac Kara",          pos: "MID", role: "CDM", num: 6,  age: 30, ovr: 74, pot: 74, nat: "TR" },
    { n: "Oltean",              pos: "DEF", role: "LB",  num: 3,  age: 26, ovr: 73, pot: 77, nat: "RO" },
    { n: "Moryke Fofana",       pos: "MID", role: "AM",  num: 17, age: 30, ovr: 74, pot: 74, nat: "CI" },
    { n: "Shoya Nakajima",      pos: "MID", role: "AM",  num: 14, age: 31, ovr: 74, pot: 74, nat: "JP" },
    { n: "Paul-Jose M'Poku",    pos: "MID", role: "CM",  num: 8,  age: 33, ovr: 73, pot: 73, nat: "CD" },
    { n: "Serhat Yılmaz",       pos: "DEF", role: "RB",  num: 2,  age: 26, ovr: 72, pot: 76, nat: "TR" },
    { n: "Anıl Koç",            pos: "MID", role: "CM",  num: 15, age: 26, ovr: 72, pot: 75, nat: "TR" },
    { n: "Tomislav Ivanović",   pos: "DEF", role: "CB",  num: 20, age: 26, ovr: 73, pot: 76, nat: "HR" },
    { n: "Ertuğrul Ersoy",      pos: "DEF", role: "CB",  num: 33, age: 28, ovr: 73, pot: 74, nat: "TR" },
    { n: "Haris Hajradinović",  pos: "MID", role: "AM",  num: 20, age: 31, ovr: 74, pot: 74, nat: "BA" },
    { n: "Muhammet Demir",      pos: "FWD", role: "ST",  num: 19, age: 34, ovr: 72, pot: 72, nat: "TR" },
    { n: "Aaron Boupendza",     pos: "FWD", role: "ST",  num: 23, age: 29, ovr: 76, pot: 76, nat: "GA" },
    { n: "Enes Ünal",           pos: "FWD", role: "ST",  num: 26, age: 28, ovr: 77, pot: 77, nat: "TR" },
  ],
);

// ─── 12. Eyüpspor ────────────────────────────────────────────────
const EYUPSPOR = pack(
  { id: "eyp", name: "Eyüpspor", short: "EYP", city: "İstanbul", color: "#7c3aed", color2: "#facc15" },
  [
    { n: "Marius Adamonis",     pos: "GK",  role: "GK",  num: 1,  age: 28, ovr: 74, pot: 76, nat: "LT" },
    { n: "Mert Ömür",           pos: "GK",  role: "GK",  num: 25, age: 26, ovr: 70, pot: 74, nat: "TR" },
    { n: "Robin Yalçın",        pos: "DEF", role: "CB",  num: 5,  age: 27, ovr: 75, pot: 77, nat: "DE" },
    { n: "Mattia Bani",         pos: "DEF", role: "CB",  num: 6,  age: 31, ovr: 76, pot: 76, nat: "IT" },
    { n: "Halil Akbunar",       pos: "MID", role: "LW",  num: 11, age: 32, ovr: 74, pot: 74, nat: "TR" },
    { n: "Talha Ülvan",         pos: "DEF", role: "LB",  num: 3,  age: 24, ovr: 72, pot: 78, nat: "TR" },
    { n: "Stephen Eustáquio",   pos: "MID", role: "CM",  num: 8,  age: 28, ovr: 79, pot: 80, nat: "CA" },
    { n: "Metehan Mert",        pos: "FWD", role: "ST",  num: 9,  age: 22, ovr: 74, pot: 82, nat: "TR" },
    { n: "Umut Bozok",          pos: "FWD", role: "ST",  num: 27, age: 28, ovr: 76, pot: 76, nat: "TR" },
    { n: "Serdar Saatçı",       pos: "DEF", role: "CB",  num: 4,  age: 22, ovr: 74, pot: 82, nat: "TR" },
    { n: "Carlos Ponck",        pos: "DEF", role: "CB",  num: 26, age: 29, ovr: 74, pot: 74, nat: "CV" },
    { n: "Mujakic",             pos: "MID", role: "CDM", num: 15, age: 25, ovr: 73, pot: 78, nat: "BA" },
    { n: "Prince Ampem",        pos: "FWD", role: "ST",  num: 19, age: 22, ovr: 72, pot: 80, nat: "GH" },
    { n: "Claudio Winck",       pos: "DEF", role: "RB",  num: 2,  age: 29, ovr: 74, pot: 74, nat: "BR" },
    { n: "Yalçın Kayan",        pos: "MID", role: "CM",  num: 20, age: 28, ovr: 73, pot: 75, nat: "TR" },
    { n: "Calvin Verdonk",      pos: "DEF", role: "LB",  num: 24, age: 27, ovr: 76, pot: 77, nat: "NL" },
    { n: "Thiam",               pos: "FWD", role: "ST",  num: 29, age: 25, ovr: 75, pot: 78, nat: "SN" },
    { n: "Luccas Claro",        pos: "DEF", role: "CB",  num: 15, age: 33, ovr: 74, pot: 74, nat: "BR" },
    { n: "Dragoş Nedelcu",      pos: "MID", role: "CDM", num: 17, age: 28, ovr: 73, pot: 74, nat: "RO" },
    { n: "Ramos",               pos: "MID", role: "AM",  num: 10, age: 29, ovr: 74, pot: 75, nat: "BR" },
  ],
);

// ─── 13. Kayserispor ─────────────────────────────────────────────
const KAYSERISPOR = pack(
  { id: "kay", name: "Kayserispor", short: "KAY", city: "Kayseri", color: "#be123c", color2: "#fbbf24" },
  [
    { n: "Onurcan Piri",        pos: "GK",  role: "GK",  num: 1,  age: 26, ovr: 74, pot: 77, nat: "TR" },
    { n: "Bilal Bayazıt",       pos: "GK",  role: "GK",  num: 25, age: 26, ovr: 72, pot: 76, nat: "TR" },
    { n: "Hayrullah Bilazer",   pos: "DEF", role: "CB",  num: 4,  age: 28, ovr: 73, pot: 74, nat: "TR" },
    { n: "Stephane Bahoken",    pos: "FWD", role: "ST",  num: 9,  age: 32, ovr: 74, pot: 74, nat: "CM" },
    { n: "Benjamin Tetteh",     pos: "FWD", role: "ST",  num: 11, age: 27, ovr: 75, pot: 77, nat: "GH" },
    { n: "Carlos Mané",         pos: "MID", role: "LW",  num: 17, age: 30, ovr: 73, pot: 73, nat: "PT" },
    { n: "Aaron Opoku",         pos: "MID", role: "LW",  num: 20, age: 25, ovr: 73, pot: 77, nat: "DE" },
    { n: "Miguel Cardoso",      pos: "MID", role: "RW",  num: 7,  age: 25, ovr: 73, pot: 77, nat: "PT" },
    { n: "Abdulkadir Ömür",     pos: "MID", role: "AM",  num: 10, age: 26, ovr: 77, pot: 80, nat: "TR" },
    { n: "Dimitrios Kourbelis", pos: "MID", role: "CDM", num: 8,  age: 31, ovr: 74, pot: 74, nat: "GR" },
    { n: "Majid Hosseini",      pos: "DEF", role: "CB",  num: 6,  age: 28, ovr: 73, pot: 74, nat: "IR" },
    { n: "Stefan Milošević",    pos: "DEF", role: "CB",  num: 3,  age: 28, ovr: 73, pot: 74, nat: "RS" },
    { n: "Mame Thiam",          pos: "FWD", role: "ST",  num: 19, age: 33, ovr: 73, pot: 73, nat: "SN" },
    { n: "Joao Mendes",         pos: "MID", role: "CM",  num: 14, age: 25, ovr: 72, pot: 77, nat: "BR" },
    { n: "Mendes Moreira",      pos: "MID", role: "CM",  num: 15, age: 25, ovr: 72, pot: 77, nat: "AO" },
    { n: "Denys Maliuk",        pos: "DEF", role: "LB",  num: 24, age: 22, ovr: 71, pot: 79, nat: "UA" },
    { n: "Nurettin Korkmaz",    pos: "DEF", role: "RB",  num: 2,  age: 31, ovr: 72, pot: 72, nat: "TR" },
    { n: "Mané Diop",           pos: "MID", role: "AM",  num: 29, age: 23, ovr: 71, pot: 78, nat: "SN" },
    { n: "Ramazan Civelek",     pos: "MID", role: "RW",  num: 22, age: 21, ovr: 70, pot: 80, nat: "TR" },
    { n: "Emrah Başsan",        pos: "MID", role: "CDM", num: 18, age: 33, ovr: 72, pot: 72, nat: "TR" },
  ],
);

// ─── 14. Çaykur Rizespor ─────────────────────────────────────────
const RIZESPOR = pack(
  { id: "riz", name: "Çaykur Rizespor", short: "RİZ", city: "Rize", color: "#065f46", color2: "#1e3a8a" },
  [
    { n: "Gökhan Akkan",        pos: "GK",  role: "GK",  num: 1,  age: 30, ovr: 74, pot: 74, nat: "TR" },
    { n: "Emirhan Demircan",    pos: "GK",  role: "GK",  num: 25, age: 24, ovr: 71, pot: 76, nat: "TR" },
    { n: "Attila Mocsi",        pos: "DEF", role: "CB",  num: 4,  age: 25, ovr: 74, pot: 77, nat: "HU" },
    { n: "Ismail Köybaşı",      pos: "DEF", role: "LB",  num: 3,  age: 36, ovr: 70, pot: 70, nat: "TR" },
    { n: "Murat Paluli",        pos: "DEF", role: "RB",  num: 2,  age: 24, ovr: 72, pot: 78, nat: "TR" },
    { n: "Fode Koita",          pos: "FWD", role: "ST",  num: 9,  age: 33, ovr: 73, pot: 73, nat: "CI" },
    { n: "Yasin Özcan",         pos: "DEF", role: "CB",  num: 5,  age: 22, ovr: 73, pot: 81, nat: "TR" },
    { n: "Ali Sowe",            pos: "FWD", role: "ST",  num: 11, age: 30, ovr: 74, pot: 74, nat: "GM" },
    { n: "Musa Çağıran",        pos: "MID", role: "CM",  num: 8,  age: 32, ovr: 72, pot: 72, nat: "TR" },
    { n: "Enver Cenk Şahin",    pos: "MID", role: "AM",  num: 10, age: 30, ovr: 73, pot: 73, nat: "TR" },
    { n: "Milan Makarić",       pos: "FWD", role: "ST",  num: 27, age: 29, ovr: 74, pot: 74, nat: "RS" },
    { n: "Hormazhev",           pos: "MID", role: "RW",  num: 7,  age: 25, ovr: 72, pot: 77, nat: "UA" },
    { n: "Morutan",             pos: "MID", role: "AM",  num: 20, age: 26, ovr: 75, pot: 78, nat: "RO" },
    { n: "Berat Özdemir",       pos: "MID", role: "CDM", num: 6,  age: 27, ovr: 76, pot: 78, nat: "TR" },
    { n: "Sowe Musa",           pos: "MID", role: "CDM", num: 14, age: 26, ovr: 73, pot: 75, nat: "GM" },
    { n: "Joilson",             pos: "DEF", role: "CB",  num: 15, age: 27, ovr: 73, pot: 75, nat: "BR" },
    { n: "Kutay Uçar",          pos: "MID", role: "LW",  num: 11, age: 23, ovr: 72, pot: 79, nat: "TR" },
    { n: "Henrique Martins",    pos: "FWD", role: "ST",  num: 21, age: 25, ovr: 73, pot: 77, nat: "BR" },
    { n: "Zubkov",              pos: "MID", role: "LW",  num: 19, age: 28, ovr: 74, pot: 75, nat: "UA" },
    { n: "Ajdin Hasić",         pos: "MID", role: "RW",  num: 17, age: 25, ovr: 73, pot: 77, nat: "BA" },
  ],
);

// ─── 15. Gaziantep FK ────────────────────────────────────────────
const GAZIANTEP = pack(
  { id: "gfk", name: "Gaziantep FK", short: "GFK", city: "Gaziantep", color: "#881337", color2: "#111827" },
  [
    { n: "Zafer Görgen",        pos: "GK",  role: "GK",  num: 1,  age: 29, ovr: 73, pot: 74, nat: "TR" },
    { n: "Doğukan Özkan",       pos: "GK",  role: "GK",  num: 25, age: 24, ovr: 70, pot: 75, nat: "TR" },
    { n: "Junior Morais",       pos: "DEF", role: "LB",  num: 3,  age: 34, ovr: 73, pot: 73, nat: "RO" },
    { n: "Kévin Rodrigues",     pos: "DEF", role: "LB",  num: 24, age: 30, ovr: 73, pot: 73, nat: "PT" },
    { n: "Myenty Abena",        pos: "DEF", role: "CB",  num: 5,  age: 31, ovr: 74, pot: 74, nat: "SR" },
    { n: "Luís Maximiano",      pos: "DEF", role: "CB",  num: 4,  age: 27, ovr: 73, pot: 75, nat: "PT" },
    { n: "Tayyip Sanuşi",       pos: "DEF", role: "RB",  num: 2,  age: 21, ovr: 71, pot: 80, nat: "TR" },
    { n: "Jasper van der Werff",pos: "DEF", role: "CB",  num: 6,  age: 27, ovr: 73, pot: 74, nat: "CH" },
    { n: "Salem M'Bakata",      pos: "MID", role: "CM",  num: 15, age: 28, ovr: 73, pot: 74, nat: "FR" },
    { n: "Erik Sabo",           pos: "MID", role: "CM",  num: 14, age: 34, ovr: 72, pot: 72, nat: "SK" },
    { n: "Mirallas",            pos: "MID", role: "LW",  num: 11, age: 38, ovr: 71, pot: 71, nat: "BE" },
    { n: "Atakan Cankorkmaz",   pos: "MID", role: "RW",  num: 7,  age: 22, ovr: 71, pot: 79, nat: "TR" },
    { n: "Zé Turbo",            pos: "FWD", role: "ST",  num: 9,  age: 27, ovr: 75, pot: 77, nat: "AO" },
    { n: "Alexandru Maxim",     pos: "MID", role: "AM",  num: 10, age: 34, ovr: 75, pot: 75, nat: "RO" },
    { n: "Boli Bolingoli",      pos: "DEF", role: "LB",  num: 23, age: 30, ovr: 72, pot: 72, nat: "BE" },
    { n: "Andrić",              pos: "FWD", role: "ST",  num: 19, age: 30, ovr: 74, pot: 74, nat: "RS" },
    { n: "Ali Yasar",           pos: "MID", role: "AM",  num: 20, age: 22, ovr: 71, pot: 79, nat: "TR" },
    { n: "Yusuf Kabadayı",      pos: "MID", role: "LW",  num: 27, age: 22, ovr: 71, pot: 79, nat: "TR" },
    { n: "Bayo",                pos: "FWD", role: "ST",  num: 22, age: 26, ovr: 73, pot: 76, nat: "CI" },
    { n: "Ndiaye",              pos: "MID", role: "CDM", num: 17, age: 26, ovr: 72, pot: 75, nat: "SN" },
  ],
);

// ─── 16. Kocaelispor ─────────────────────────────────────────────
const KOCAELISPOR = pack(
  { id: "kcl", name: "Kocaelispor", short: "KCL", city: "Kocaeli", color: "#0f5132", color2: "#111827" },
  [
    { n: "Emir Balkan",         pos: "GK",  role: "GK",  num: 1,  age: 25, ovr: 72, pot: 78, nat: "TR" },
    { n: "Tarık Çetin",         pos: "GK",  role: "GK",  num: 25, age: 31, ovr: 73, pot: 73, nat: "TR" },
    { n: "Ege Albayrak",        pos: "DEF", role: "CB",  num: 4,  age: 26, ovr: 72, pot: 76, nat: "TR" },
    { n: "Serdar Özkan",        pos: "DEF", role: "CB",  num: 5,  age: 29, ovr: 71, pot: 72, nat: "TR" },
    { n: "Cem Türkmen",         pos: "DEF", role: "RB",  num: 2,  age: 25, ovr: 71, pot: 76, nat: "TR" },
    { n: "Yiğit Fidan",         pos: "DEF", role: "LB",  num: 3,  age: 24, ovr: 71, pot: 77, nat: "TR" },
    { n: "Agustín Rogel",       pos: "DEF", role: "CB",  num: 6,  age: 28, ovr: 74, pot: 75, nat: "UY" },
    { n: "Berat Luka Doğan",    pos: "DEF", role: "LB",  num: 14, age: 22, ovr: 70, pot: 78, nat: "TR" },
    { n: "Adem Metin Türk",     pos: "MID", role: "CM",  num: 8,  age: 27, ovr: 72, pot: 74, nat: "TR" },
    { n: "Mame Thiam",          pos: "FWD", role: "ST",  num: 9,  age: 33, ovr: 72, pot: 72, nat: "SN" },
    { n: "Eren Derdiyok",       pos: "FWD", role: "ST",  num: 11, age: 37, ovr: 70, pot: 70, nat: "TR" },
    { n: "Ferhat Öztorun",      pos: "DEF", role: "CB",  num: 15, age: 35, ovr: 70, pot: 70, nat: "TR" },
    { n: "Cihat Arslan",        pos: "MID", role: "CM",  num: 20, age: 26, ovr: 71, pot: 75, nat: "TR" },
    { n: "Darko Brasanac",      pos: "MID", role: "CDM", num: 17, age: 32, ovr: 73, pot: 73, nat: "RS" },
    { n: "Papy Ambani",         pos: "MID", role: "AM",  num: 10, age: 28, ovr: 73, pot: 74, nat: "CD" },
    { n: "Kemal Ademi",         pos: "FWD", role: "ST",  num: 19, age: 29, ovr: 73, pot: 73, nat: "CH" },
    { n: "Atalay Babacan",      pos: "MID", role: "RW",  num: 7,  age: 25, ovr: 71, pot: 76, nat: "TR" },
    { n: "Görkem Sağlam",       pos: "MID", role: "AM",  num: 23, age: 27, ovr: 72, pot: 74, nat: "TR" },
    { n: "Enes Aktaş",          pos: "MID", role: "LW",  num: 27, age: 22, ovr: 70, pot: 78, nat: "TR" },
    { n: "Babajide Ogunjimi",   pos: "FWD", role: "ST",  num: 18, age: 24, ovr: 72, pot: 78, nat: "NG" },
  ],
);

// ─── Export ──────────────────────────────────────────────────────
export const SQUAD_PACKS: readonly SquadPack[] = [
  FENERBAHCE,
  GALATASARAY,
  BESIKTAS,
  TRABZONSPOR,
  BASAKSEHIR,
  SAMSUNSPOR,
  GOZTEPE,
  ANTALYASPOR,
  KONYASPOR,
  ALANYASPOR,
  KASIMPASA,
  EYUPSPOR,
  KAYSERISPOR,
  RIZESPOR,
  GAZIANTEP,
  KOCAELISPOR,
] as const;

export const CLUB_METAS: readonly ClubMeta[] = SQUAD_PACKS.map((p) => p.club);

/** Convenience lookup for landing / UI code that used to reach for a mock club. */
export const clubMetaById = (id: string): ClubMeta | undefined =>
  CLUB_METAS.find((c) => c.id === id);

export const USER_PACK = FENERBAHCE;
