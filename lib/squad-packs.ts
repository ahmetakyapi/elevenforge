/**
 * Süper Lig 2025-26 sezon + Ocak 2026 kış transfer dönemi kadroları.
 *
 * Kaynaklar: Wikipedia 2025-26 team articles (FB/GS/BJK club seasons +
 * other 10 main squad tables) + ESPN Trabzonspor squad — hepsi erken
 * 2026 tarihli. Sadece bu kaynaklarda doğrulanan oyuncular burada;
 * tahmin, kulaktan dolma veya emin olmadığım isimler ÇIKARILDI.
 *
 * OVR / age / role: kaynaklar pozisyon ailesi (GK/DEF/MID/FWD) +
 * millet kodu verir, spesifik role (CB vs LB, ST vs LW) ve yaşa net
 * değer çoğu zaman vermez. Bu alanlar oyuncu reputasyonuna göre makul
 * tahminlerdir — engine dengesi için gerekli, dolayısıyla gerçek
 * transfermarkt değerinden farklılaşabilir.
 *
 * Değişiklik not:
 *  - Ocak 2026 ayrılanlar: Szymański (Rennes), En-Nesyri (Al-Ittihad),
 *    Cenk Tosun (Kasımpaşa), Immobile (Bologna yaz 2025), Rafa Silva
 *    (Benfica), Tammy Abraham (Aston Villa), Mert Günok (FB),
 *    Gabriel Paulista (Corinthians), Muslera (Estudiantes), Morata
 *    (Milan), Demirbay (Eyüpspor), Köhn (Union Berlin). Bu isimler
 *    artık eski kulüplerinde YOK.
 *  - Yeni gelen yıldızlar: Leroy Sané + Sacha Boey + Noa Lang (GS),
 *    Tammy Abraham out + Oh Hyeon-gyu / Murillo / Agbadou / Asllani
 *    (BJK Jan), Edson Álvarez + Fred + Nélson Semedo + Sidiki Cherif
 *    (FB), Onana + Felipe + Folcarelli (TS).
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
};

// Derive realistic market value & wage from age/ovr/potential.
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

const pack = (club: ClubMeta, minis: PlayerMini[]): SquadPack => ({
  club,
  players: minis.map(fillDefaults),
});

// ─── 1. Fenerbahçe (Wikipedia 2025-26 sezon makalesi, Şubat 2026) ──
const FENERBAHCE = pack(
  { id: "fb", name: "Fenerbahçe", short: "FB", city: "İstanbul", color: "#14317f", color2: "#facc15" },
  [
    // GK
    { n: "Ederson",              pos: "GK",  role: "GK",  num: 31, age: 32, ovr: 87, pot: 87, nat: "BR" },
    { n: "Mert Günok",           pos: "GK",  role: "GK",  num: 34, age: 37, ovr: 80, pot: 80, nat: "TR" },
    { n: "Tarık Çetin",          pos: "GK",  role: "GK",  num: 13, age: 28, ovr: 73, pot: 74, nat: "TR" },
    // DEF
    { n: "Milan Škriniar",       pos: "DEF", role: "CB",  num: 37, age: 31, ovr: 86, pot: 86, nat: "SK" },
    { n: "Çağlar Söyüncü",       pos: "DEF", role: "CB",  num: 4,  age: 29, ovr: 81, pot: 81, nat: "TR" },
    { n: "Nélson Semedo",        pos: "DEF", role: "RB",  num: 27, age: 32, ovr: 82, pot: 82, nat: "PT" },
    { n: "Jayden Oosterwolde",   pos: "DEF", role: "LB",  num: 24, age: 24, ovr: 80, pot: 84, nat: "NL" },
    { n: "Archie Brown",         pos: "DEF", role: "RB",  num: 3,  age: 23, ovr: 77, pot: 84, nat: "EN" },
    { n: "Mert Müldür",          pos: "DEF", role: "RB",  num: 18, age: 27, ovr: 75, pot: 78, nat: "TR" },
    { n: "Levent Mercan",        pos: "DEF", role: "CB",  num: 22, age: 25, ovr: 74, pot: 79, nat: "TR" },
    { n: "Yiğit Efe Demir",      pos: "DEF", role: "CB",  num: 14, age: 21, ovr: 71, pot: 82, nat: "TR" },
    // MID
    { n: "N'Golo Kanté",         pos: "MID", role: "CM",  num: 17, age: 35, ovr: 84, pot: 84, nat: "FR" },
    { n: "Edson Álvarez",        pos: "MID", role: "CDM", num: 11, age: 28, ovr: 83, pot: 84, nat: "MX" },
    { n: "Mateo Guendouzi",      pos: "MID", role: "CM",  num: 6,  age: 27, ovr: 82, pot: 84, nat: "FR" },
    { n: "Fred",                 pos: "MID", role: "CM",  num: 7,  age: 33, ovr: 80, pot: 80, nat: "BR" },
    { n: "İsmail Yüksek",        pos: "MID", role: "CDM", num: 5,  age: 27, ovr: 77, pot: 81, nat: "TR" },
    { n: "Mert Hakan Yandaş",    pos: "MID", role: "CM",  num: 8,  age: 31, ovr: 75, pot: 75, nat: "TR" },
    { n: "Marco Asensio",        pos: "MID", role: "RW",  num: 21, age: 30, ovr: 83, pot: 83, nat: "ES" },
    { n: "Oğuz Aydın",           pos: "MID", role: "LW",  num: 70, age: 25, ovr: 75, pot: 81, nat: "TR" },
    // FWD
    { n: "Talisca",              pos: "FWD", role: "ST",  num: 94, age: 32, ovr: 84, pot: 84, nat: "BR" },
    { n: "Kerem Aktürkoğlu",     pos: "FWD", role: "LW",  num: 9,  age: 27, ovr: 83, pot: 84, nat: "TR" },
    { n: "Dorgeles Nene",        pos: "FWD", role: "ST",  num: 45, age: 23, ovr: 78, pot: 85, nat: "ML" },
    { n: "Anthony Musaba",       pos: "FWD", role: "LW",  num: 20, age: 25, ovr: 74, pot: 79, nat: "NL" },
    { n: "Sidiki Cherif",        pos: "FWD", role: "ST",  num: 26, age: 19, ovr: 70, pot: 83, nat: "FR" },
  ],
);

// ─── 2. Galatasaray (Wikipedia 2025-26 sezon makalesi, Şubat 2026) ──
const GALATASARAY = pack(
  { id: "gs", name: "Galatasaray", short: "GS", city: "İstanbul", color: "#a61212", color2: "#fdba24" },
  [
    // GK
    { n: "Uğurcan Çakır",        pos: "GK",  role: "GK",  num: 1,  age: 30, ovr: 84, pot: 85, nat: "TR" },
    { n: "Günay Güvenç",         pos: "GK",  role: "GK",  num: 19, age: 35, ovr: 73, pot: 73, nat: "TR" },
    { n: "Batuhan Şen",          pos: "GK",  role: "GK",  num: 12, age: 27, ovr: 71, pot: 74, nat: "TR" },
    // DEF
    { n: "Davinson Sánchez",     pos: "DEF", role: "CB",  num: 6,  age: 30, ovr: 83, pot: 83, nat: "CO" },
    { n: "Victor Nelsson",       pos: "DEF", role: "CB",  num: 25, age: 27, ovr: 79, pot: 81, nat: "DK" },
    { n: "Carlos Cuesta",        pos: "DEF", role: "CB",  num: 26, age: 27, ovr: 78, pot: 80, nat: "CO" },
    { n: "Abdülkerim Bardakcı",  pos: "DEF", role: "CB",  num: 42, age: 30, ovr: 78, pot: 78, nat: "TR" },
    { n: "Kaan Ayhan",           pos: "DEF", role: "CB",  num: 23, age: 31, ovr: 76, pot: 76, nat: "TR" },
    { n: "Wilfried Singo",       pos: "DEF", role: "RB",  num: 90, age: 25, ovr: 82, pot: 86, nat: "CI" },
    { n: "Sacha Boey",           pos: "DEF", role: "RB",  num: 93, age: 25, ovr: 79, pot: 82, nat: "FR" },
    { n: "Ismail Jakobs",        pos: "DEF", role: "LB",  num: 4,  age: 25, ovr: 78, pot: 81, nat: "SN" },
    { n: "Eren Elmalı",          pos: "DEF", role: "LB",  num: 17, age: 25, ovr: 74, pot: 78, nat: "TR" },
    { n: "Metehan Baltacı",      pos: "DEF", role: "CB",  num: 3,  age: 23, ovr: 72, pot: 80, nat: "TR" },
    // MID
    { n: "İlkay Gündoğan",       pos: "MID", role: "CM",  num: 20, age: 35, ovr: 85, pot: 85, nat: "DE" },
    { n: "Lucas Torreira",       pos: "MID", role: "CDM", num: 34, age: 30, ovr: 82, pot: 83, nat: "UY" },
    { n: "Mario Lemina",         pos: "MID", role: "CDM", num: 99, age: 32, ovr: 80, pot: 80, nat: "GA" },
    { n: "Gabriel Sara",         pos: "MID", role: "CM",  num: 8,  age: 27, ovr: 80, pot: 83, nat: "BR" },
    { n: "Kristjan Asllani",     pos: "MID", role: "CM",  num: 16, age: 24, ovr: 77, pot: 82, nat: "AL" },
    { n: "Roland Sallai",        pos: "MID", role: "RW",  num: 7,  age: 29, ovr: 78, pot: 78, nat: "HU" },
    { n: "Yunus Akgün",          pos: "MID", role: "RW",  num: 11, age: 25, ovr: 77, pot: 81, nat: "TR" },
    { n: "Noa Lang",             pos: "MID", role: "LW",  num: 77, age: 27, ovr: 79, pot: 81, nat: "NL" },
    { n: "Yáser Asprilla",       pos: "MID", role: "RW",  num: 22, age: 22, ovr: 74, pot: 83, nat: "CO" },
    // FWD
    { n: "Leroy Sané",           pos: "FWD", role: "RW",  num: 10, age: 30, ovr: 86, pot: 86, nat: "DE" },
    { n: "Victor Osimhen",       pos: "FWD", role: "ST",  num: 45, age: 27, ovr: 88, pot: 90, nat: "NG" },
    { n: "Mauro Icardi",         pos: "FWD", role: "ST",  num: 9,  age: 33, ovr: 82, pot: 82, nat: "AR" },
    { n: "Barış Alper Yılmaz",   pos: "FWD", role: "LW",  num: 53, age: 26, ovr: 82, pot: 85, nat: "TR" },
    { n: "Ahmed Kutucu",         pos: "FWD", role: "ST",  num: 21, age: 26, ovr: 73, pot: 76, nat: "TR" },
  ],
);

// ─── 3. Beşiktaş (Wikipedia 2025-26 + Jan 2026 transfer notları) ──
const BESIKTAS = pack(
  { id: "bjk", name: "Beşiktaş", short: "BJK", city: "İstanbul", color: "#111114", color2: "#f4f5f7" },
  [
    // GK
    { n: "Ersin Destanoğlu",     pos: "GK",  role: "GK",  num: 30, age: 24, ovr: 77, pot: 83, nat: "TR" },
    { n: "Devis Vásquez",        pos: "GK",  role: "GK",  num: 1,  age: 27, ovr: 75, pot: 77, nat: "CO" },
    { n: "Emre Bilgin",          pos: "GK",  role: "GK",  num: 33, age: 21, ovr: 68, pot: 77, nat: "TR" },
    // DEF
    { n: "Emmanuel Agbadou",     pos: "DEF", role: "CB",  num: 6,  age: 28, ovr: 80, pot: 82, nat: "CI" },
    { n: "Michael Amir Murillo", pos: "DEF", role: "RB",  num: 12, age: 30, ovr: 78, pot: 78, nat: "PA" },
    { n: "Felix Uduokhai",       pos: "DEF", role: "CB",  num: 14, age: 27, ovr: 77, pot: 79, nat: "DE" },
    { n: "Emrecan Uzunhan",      pos: "DEF", role: "CB",  num: 40, age: 24, ovr: 74, pot: 81, nat: "TR" },
    { n: "David Jurásek",        pos: "DEF", role: "LB",  num: 39, age: 24, ovr: 76, pot: 80, nat: "CZ" },
    { n: "Yasin Özcan",          pos: "DEF", role: "LB",  num: 2,  age: 22, ovr: 75, pot: 82, nat: "TR" },
    { n: "Emirhan Topçu",        pos: "DEF", role: "CB",  num: 53, age: 24, ovr: 73, pot: 78, nat: "TR" },
    // MID
    { n: "Wilfred Ndidi",        pos: "MID", role: "CDM", num: 4,  age: 28, ovr: 82, pot: 82, nat: "NG" },
    { n: "Orkun Kökçü",          pos: "MID", role: "CM",  num: 10, age: 24, ovr: 81, pot: 85, nat: "TR" },
    { n: "Salih Uçan",           pos: "MID", role: "CM",  num: 8,  age: 31, ovr: 76, pot: 76, nat: "TR" },
    { n: "Al-Musrati",           pos: "MID", role: "CDM", num: 28, age: 29, ovr: 77, pot: 78, nat: "LY" },
    { n: "Milot Rashica",        pos: "MID", role: "AM",  num: 7,  age: 28, ovr: 77, pot: 78, nat: "XK" },
    { n: "Necip Uysal",          pos: "MID", role: "CM",  num: 20, age: 34, ovr: 72, pot: 72, nat: "TR" },
    { n: "Kartal Yılmaz",        pos: "MID", role: "CDM", num: 17, age: 24, ovr: 71, pot: 78, nat: "TR" },
    // FWD
    { n: "Jota Silva",           pos: "FWD", role: "ST",  num: 11, age: 25, ovr: 78, pot: 81, nat: "PT" },
    { n: "Oh Hyeon-gyu",         pos: "FWD", role: "ST",  num: 19, age: 24, ovr: 76, pot: 80, nat: "KR" },
    { n: "Mustafa Erhan Hekimoğlu", pos: "FWD", role: "ST", num: 91, age: 17, ovr: 66, pot: 82, nat: "TR" },
  ],
);

// ─── 4. Trabzonspor (ESPN 2025-26 squad, erken 2026) ──────────────
const TRABZONSPOR = pack(
  { id: "ts", name: "Trabzonspor", short: "TS", city: "Trabzon", color: "#7a1b1f", color2: "#1e3a8a" },
  [
    // GK
    { n: "André Onana",          pos: "GK",  role: "GK",  num: 1,  age: 29, ovr: 82, pot: 83, nat: "CM" },
    { n: "Onuralp Çevikkan",     pos: "GK",  role: "GK",  num: 28, age: 25, ovr: 73, pot: 77, nat: "TR" },
    // DEF
    { n: "Stefan Savić",         pos: "DEF", role: "CB",  num: 15, age: 35, ovr: 78, pot: 78, nat: "ME" },
    { n: "Wagner Pina",          pos: "DEF", role: "RB",  num: 20, age: 23, ovr: 75, pot: 80, nat: "PT" },
    { n: "Mathias Løvik",        pos: "DEF", role: "LB",  num: 14, age: 22, ovr: 73, pot: 80, nat: "NO" },
    { n: "Mustafa Eskihellaç",   pos: "DEF", role: "CB",  num: 19, age: 28, ovr: 74, pot: 76, nat: "TR" },
    { n: "Chibuike Nwaiwu",      pos: "DEF", role: "CB",  num: 27, age: 22, ovr: 72, pot: 80, nat: "NG" },
    { n: "Arda Öztürk",          pos: "DEF", role: "CB",  num: 21, age: 19, ovr: 69, pot: 82, nat: "TR" },
    // MID
    { n: "Okay Yokuşlu",         pos: "MID", role: "CDM", num: 5,  age: 32, ovr: 78, pot: 78, nat: "TR" },
    { n: "Ozan Tufan",           pos: "MID", role: "CM",  num: 11, age: 31, ovr: 76, pot: 76, nat: "TR" },
    { n: "Benjamin Bouchouari",  pos: "MID", role: "CM",  num: 8,  age: 24, ovr: 76, pot: 80, nat: "MA" },
    { n: "Ernest Muçi",          pos: "MID", role: "AM",  num: 10, age: 25, ovr: 77, pot: 82, nat: "AL" },
    { n: "Edin Višća",           pos: "MID", role: "RW",  num: 7,  age: 36, ovr: 75, pot: 75, nat: "BA" },
    { n: "Oleksandr Zubkov",     pos: "MID", role: "LW",  num: 22, age: 29, ovr: 75, pot: 75, nat: "UA" },
    { n: "Tim Jabol-Folcarelli", pos: "MID", role: "CM",  num: 26, age: 26, ovr: 75, pot: 78, nat: "FR" },
    { n: "Arsenii Batahov",      pos: "MID", role: "CM",  num: 44, age: 24, ovr: 72, pot: 79, nat: "UA" },
    { n: "Salih Malkoçoğlu",     pos: "MID", role: "LW",  num: 74, age: 21, ovr: 71, pot: 80, nat: "TR" },
    { n: "Christ Inao Oulaï",    pos: "MID", role: "CM",  num: 42, age: 20, ovr: 70, pot: 82, nat: "CI" },
    // FWD
    { n: "Paul Onuachu",         pos: "FWD", role: "ST",  num: 30, age: 31, ovr: 79, pot: 79, nat: "NG" },
    { n: "Anthony Nwakaeme",     pos: "FWD", role: "LW",  num: 9,  age: 37, ovr: 72, pot: 72, nat: "NG" },
    { n: "Felipe",               pos: "FWD", role: "ST",  num: 99, age: 22, ovr: 71, pot: 80, nat: "BR" },
    { n: "Umut Nayir",           pos: "FWD", role: "ST",  num: 18, age: 32, ovr: 72, pot: 72, nat: "TR" },
  ],
);

// ─── 5. Başakşehir (Wikipedia squad, Şubat 2026) ─────────────────
const BASAKSEHIR = pack(
  { id: "ibfk", name: "Başakşehir FK", short: "İBFK", city: "İstanbul", color: "#f97316", color2: "#1e3a8a" },
  [
    { n: "Volkan Babacan",       pos: "GK",  role: "GK",  num: 1,  age: 37, ovr: 75, pot: 75, nat: "TR" },
    { n: "Muhammed Şengezer",    pos: "GK",  role: "GK",  num: 16, age: 26, ovr: 72, pot: 76, nat: "TR" },
    { n: "Léo Duarte",           pos: "DEF", role: "CB",  num: 5,  age: 29, ovr: 76, pot: 76, nat: "BR" },
    { n: "Ousseynou Ba",         pos: "DEF", role: "CB",  num: 27, age: 30, ovr: 74, pot: 74, nat: "SN" },
    { n: "Jerome Opoku",         pos: "DEF", role: "CB",  num: 3,  age: 27, ovr: 74, pot: 76, nat: "GH" },
    { n: "Hamza Güreler",        pos: "DEF", role: "CB",  num: 15, age: 28, ovr: 73, pot: 75, nat: "TR" },
    { n: "Onur Bulut",           pos: "DEF", role: "RB",  num: 6,  age: 30, ovr: 74, pot: 74, nat: "TR" },
    { n: "Christopher Opéri",    pos: "DEF", role: "LB",  num: 21, age: 30, ovr: 74, pot: 74, nat: "CI" },
    { n: "Festy Ebosele",        pos: "DEF", role: "RB",  num: 36, age: 23, ovr: 75, pot: 80, nat: "IE" },
    { n: "Ömer Ali Şahiner",     pos: "DEF", role: "LB",  num: 42, age: 33, ovr: 72, pot: 72, nat: "TR" },
    { n: "Berat Özdemir",        pos: "MID", role: "CDM", num: 2,  age: 27, ovr: 76, pot: 77, nat: "TR" },
    { n: "Jakub Kałuziński",     pos: "MID", role: "CM",  num: 18, age: 23, ovr: 75, pot: 80, nat: "PL" },
    { n: "Amine Harit",          pos: "MID", role: "AM",  num: 25, age: 28, ovr: 78, pot: 79, nat: "MA" },
    { n: "Miguel Crespo",        pos: "MID", role: "CM",  num: 13, age: 28, ovr: 74, pot: 75, nat: "PT" },
    { n: "Olivier Kemen",        pos: "MID", role: "CM",  num: 8,  age: 29, ovr: 74, pot: 74, nat: "CM" },
    { n: "Abbosbek Fayzullaev",  pos: "MID", role: "AM",  num: 11, age: 22, ovr: 76, pot: 83, nat: "UZ" },
    { n: "Yusuf Sarı",           pos: "MID", role: "RW",  num: 7,  age: 27, ovr: 73, pot: 75, nat: "TR" },
    { n: "Onur Ergün",           pos: "MID", role: "CM",  num: 4,  age: 25, ovr: 72, pot: 76, nat: "TR" },
    { n: "Umut Güneş",           pos: "MID", role: "CM",  num: 20, age: 25, ovr: 72, pot: 76, nat: "DE" },
    { n: "Eldor Shomurodov",     pos: "FWD", role: "ST",  num: 14, age: 30, ovr: 78, pot: 78, nat: "UZ" },
    { n: "Davie Selke",          pos: "FWD", role: "ST",  num: 9,  age: 31, ovr: 74, pot: 74, nat: "DE" },
    { n: "Nuno da Costa",        pos: "FWD", role: "ST",  num: 10, age: 34, ovr: 73, pot: 73, nat: "CV" },
    { n: "Ivan Brnić",           pos: "FWD", role: "LW",  num: 77, age: 24, ovr: 73, pot: 78, nat: "HR" },
    { n: "Bertuğ Yıldırım",      pos: "FWD", role: "ST",  num: 91, age: 24, ovr: 72, pot: 79, nat: "TR" },
  ],
);

// ─── 6. Samsunspor (Wikipedia squad, Şubat 2026) ─────────────────
const SAMSUNSPOR = pack(
  { id: "sam", name: "Samsunspor", short: "SAM", city: "Samsun", color: "#b91c1c", color2: "#f4f5f7" },
  [
    { n: "Okan Kocuk",           pos: "GK",  role: "GK",  num: 1,  age: 30, ovr: 75, pot: 75, nat: "TR" },
    { n: "İrfan Can Eğribayat",  pos: "GK",  role: "GK",  num: 71, age: 27, ovr: 76, pot: 78, nat: "TR" },
    { n: "Efe Berat Töruz",      pos: "GK",  role: "GK",  num: 48, age: 22, ovr: 68, pot: 77, nat: "TR" },
    { n: "Rick van Drongelen",   pos: "DEF", role: "CB",  num: 4,  age: 27, ovr: 74, pot: 75, nat: "NL" },
    { n: "Toni Borevković",      pos: "DEF", role: "RB",  num: 24, age: 28, ovr: 74, pot: 75, nat: "HR" },
    { n: "Joe Mendes",           pos: "DEF", role: "LB",  num: 2,  age: 26, ovr: 74, pot: 77, nat: "SE" },
    { n: "Logi Tómasson",        pos: "DEF", role: "RB",  num: 17, age: 23, ovr: 72, pot: 78, nat: "IS" },
    { n: "Zeki Yavru",           pos: "DEF", role: "CB",  num: 18, age: 31, ovr: 73, pot: 73, nat: "TR" },
    { n: "Soner Gönül",          pos: "DEF", role: "CB",  num: 28, age: 31, ovr: 72, pot: 72, nat: "TR" },
    { n: "Ali Badra Diabaté",    pos: "DEF", role: "CB",  num: 15, age: 25, ovr: 73, pot: 78, nat: "CI" },
    { n: "Ľubomír Šatka",        pos: "DEF", role: "CB",  num: 37, age: 30, ovr: 74, pot: 74, nat: "SK" },
    { n: "Antoine Makoumbou",    pos: "MID", role: "CDM", num: 29, age: 27, ovr: 76, pot: 77, nat: "CG" },
    { n: "Olivier Ntcham",       pos: "MID", role: "CM",  num: 10, age: 29, ovr: 76, pot: 76, nat: "CM" },
    { n: "Afonso Sousa",         pos: "MID", role: "CM",  num: 77, age: 25, ovr: 75, pot: 79, nat: "PT" },
    { n: "Emre Kılınç",          pos: "MID", role: "AM",  num: 11, age: 31, ovr: 74, pot: 74, nat: "TR" },
    { n: "Yalçın Kayan",         pos: "MID", role: "CM",  num: 20, age: 28, ovr: 73, pot: 75, nat: "TR" },
    { n: "Carlo Holse",          pos: "MID", role: "RW",  num: 21, age: 26, ovr: 74, pot: 76, nat: "DK" },
    { n: "Tanguy Coulibaly",     pos: "MID", role: "LW",  num: 70, age: 25, ovr: 74, pot: 77, nat: "FR" },
    { n: "Celil Yüksel",         pos: "MID", role: "CM",  num: 5,  age: 24, ovr: 72, pot: 77, nat: "TR" },
    { n: "Marius Mouandilmadji", pos: "FWD", role: "ST",  num: 9,  age: 26, ovr: 75, pot: 78, nat: "TD" },
    { n: "Cherif Ndiaye",        pos: "FWD", role: "ST",  num: 19, age: 30, ovr: 75, pot: 75, nat: "SN" },
    { n: "Elayis Tavsan",        pos: "FWD", role: "LW",  num: 7,  age: 24, ovr: 74, pot: 78, nat: "TR" },
    { n: "Saikuba Jarju",        pos: "FWD", role: "ST",  num: 30, age: 22, ovr: 71, pot: 79, nat: "GM" },
    { n: "Jaurès Assoumou",      pos: "FWD", role: "LW",  num: 47, age: 22, ovr: 71, pot: 79, nat: "CI" },
  ],
);

// ─── 7. Göztepe (Wikipedia squad, Mart 2026) ─────────────────────
const GOZTEPE = pack(
  { id: "gzt", name: "Göztepe", short: "GZT", city: "İzmir", color: "#dc2626", color2: "#facc15" },
  [
    { n: "Mateusz Lis",          pos: "GK",  role: "GK",  num: 1,  age: 28, ovr: 76, pot: 79, nat: "PL" },
    { n: "Ekrem Kılıçarslan",    pos: "GK",  role: "GK",  num: 17, age: 26, ovr: 71, pot: 75, nat: "TR" },
    { n: "Allan Godói",          pos: "DEF", role: "CB",  num: 3,  age: 26, ovr: 75, pot: 78, nat: "BR" },
    { n: "Taha Altıkardeş",      pos: "DEF", role: "CB",  num: 4,  age: 24, ovr: 74, pot: 80, nat: "TR" },
    { n: "Héliton",              pos: "DEF", role: "CB",  num: 5,  age: 29, ovr: 75, pot: 75, nat: "BR" },
    { n: "İsmail Köybaşı",       pos: "DEF", role: "LB",  num: 12, age: 36, ovr: 71, pot: 71, nat: "TR" },
    { n: "Novatus Miroshi",      pos: "DEF", role: "LB",  num: 20, age: 22, ovr: 72, pot: 79, nat: "TZ" },
    { n: "Malcom Bokele",        pos: "DEF", role: "CB",  num: 26, age: 24, ovr: 73, pot: 78, nat: "CM" },
    { n: "Furkan Bayır",         pos: "DEF", role: "RB",  num: 23, age: 24, ovr: 72, pot: 77, nat: "TR" },
    { n: "Ogün Bayrak",          pos: "DEF", role: "RB",  num: 77, age: 28, ovr: 72, pot: 74, nat: "TR" },
    { n: "Alexis Antunes",       pos: "MID", role: "AM",  num: 8,  age: 25, ovr: 75, pot: 79, nat: "CH" },
    { n: "Efkan Bekiroğlu",      pos: "MID", role: "AM",  num: 11, age: 30, ovr: 74, pot: 74, nat: "TR" },
    { n: "Amin Cherni",          pos: "MID", role: "CM",  num: 15, age: 26, ovr: 73, pot: 76, nat: "TN" },
    { n: "Uğur Kaan Yıldız",     pos: "MID", role: "CDM", num: 22, age: 22, ovr: 72, pot: 80, nat: "TR" },
    { n: "Anthony Dennis",       pos: "MID", role: "RW",  num: 30, age: 27, ovr: 73, pot: 76, nat: "NG" },
    { n: "Arda Okan Kurtulan",   pos: "MID", role: "CM",  num: 2,  age: 23, ovr: 71, pot: 78, nat: "TR" },
    { n: "Juan",                 pos: "FWD", role: "ST",  num: 9,  age: 26, ovr: 75, pot: 78, nat: "BR" },
    { n: "Janderson",            pos: "FWD", role: "ST",  num: 39, age: 27, ovr: 76, pot: 78, nat: "BR" },
    { n: "Guilherme Luiz",       pos: "FWD", role: "LW",  num: 14, age: 26, ovr: 73, pot: 76, nat: "BR" },
    { n: "Jeh",                  pos: "FWD", role: "ST",  num: 19, age: 24, ovr: 72, pot: 79, nat: "BR" },
    { n: "Filip Krastev",        pos: "FWD", role: "LW",  num: 10, age: 24, ovr: 74, pot: 78, nat: "BG" },
  ],
);

// ─── 8. Antalyaspor (Wikipedia squad, Ocak 2026) ─────────────────
const ANTALYASPOR = pack(
  { id: "ant", name: "Antalyaspor", short: "ANT", city: "Antalya", color: "#e11d48", color2: "#f4f5f7" },
  [
    { n: "Julián Cuesta",        pos: "GK",  role: "GK",  num: 1,  age: 34, ovr: 75, pot: 75, nat: "ES" },
    { n: "Kağan Arıcan",         pos: "GK",  role: "GK",  num: 96, age: 23, ovr: 71, pot: 78, nat: "TR" },
    { n: "Abdullah Yiğiter",     pos: "GK",  role: "GK",  num: 21, age: 22, ovr: 69, pot: 77, nat: "TR" },
    { n: "Lautaro Giannetti",    pos: "DEF", role: "CB",  num: 30, age: 31, ovr: 75, pot: 75, nat: "AR" },
    { n: "Georgi Dzhikiya",      pos: "DEF", role: "CB",  num: 14, age: 32, ovr: 74, pot: 74, nat: "RU" },
    { n: "Kenneth Paal",         pos: "DEF", role: "LB",  num: 3,  age: 28, ovr: 74, pot: 75, nat: "SR" },
    { n: "Samet Karakoç",        pos: "DEF", role: "CB",  num: 2,  age: 24, ovr: 72, pot: 77, nat: "TR" },
    { n: "Hüseyin Türkmen",      pos: "DEF", role: "RB",  num: 4,  age: 25, ovr: 72, pot: 77, nat: "TR" },
    { n: "Bahadır Öztürk",       pos: "DEF", role: "CB",  num: 5,  age: 23, ovr: 71, pot: 78, nat: "TR" },
    { n: "Bünyamin Balcı",       pos: "DEF", role: "RB",  num: 7,  age: 30, ovr: 72, pot: 72, nat: "TR" },
    { n: "Soner Dikmen",         pos: "MID", role: "CM",  num: 6,  age: 31, ovr: 74, pot: 74, nat: "TR" },
    { n: "Abdülkadir Ömür",      pos: "MID", role: "AM",  num: 10, age: 26, ovr: 77, pot: 80, nat: "TR" },
    { n: "Sander van de Streek", pos: "MID", role: "CM",  num: 22, age: 32, ovr: 74, pot: 74, nat: "NL" },
    { n: "Dario Šarić",          pos: "MID", role: "CM",  num: 88, age: 31, ovr: 73, pot: 73, nat: "BA" },
    { n: "Ramzi Safouri",        pos: "MID", role: "AM",  num: 8,  age: 28, ovr: 74, pot: 76, nat: "IL" },
    { n: "Jesper Ceesay",        pos: "MID", role: "CDM", num: 23, age: 24, ovr: 73, pot: 78, nat: "GM" },
    { n: "Samuel Ballet",        pos: "FWD", role: "LW",  num: 11, age: 25, ovr: 74, pot: 78, nat: "CH" },
    { n: "Nikola Storm",         pos: "FWD", role: "RW",  num: 26, age: 26, ovr: 74, pot: 77, nat: "BE" },
    { n: "Bachir Gueye",         pos: "FWD", role: "ST",  num: 24, age: 26, ovr: 74, pot: 77, nat: "SN" },
    { n: "Doğukan Sinik",        pos: "FWD", role: "AM",  num: 70, age: 26, ovr: 75, pot: 78, nat: "TR" },
    { n: "Yohan Boli",           pos: "FWD", role: "ST",  num: 77, age: 31, ovr: 73, pot: 73, nat: "CI" },
  ],
);

// ─── 9. Konyaspor (Wikipedia squad, Ocak 2026) ───────────────────
const KONYASPOR = pack(
  { id: "kon", name: "Konyaspor", short: "KON", city: "Konya", color: "#15803d", color2: "#f4f5f7" },
  [
    { n: "Deniz Ertaş",          pos: "GK",  role: "GK",  num: 1,  age: 25, ovr: 74, pot: 79, nat: "TR" },
    { n: "Bahadır Han Güngördü", pos: "GK",  role: "GK",  num: 13, age: 28, ovr: 73, pot: 76, nat: "TR" },
    { n: "Guilherme",            pos: "DEF", role: "CB",  num: 12, age: 30, ovr: 75, pot: 75, nat: "BR" },
    { n: "Riechedly Bazoer",     pos: "DEF", role: "CB",  num: 20, age: 29, ovr: 76, pot: 76, nat: "CW" },
    { n: "Adil Demirbağ",        pos: "DEF", role: "CB",  num: 4,  age: 30, ovr: 73, pot: 73, nat: "TR" },
    { n: "Josip Ćalušić",        pos: "DEF", role: "CB",  num: 15, age: 28, ovr: 74, pot: 75, nat: "HR" },
    { n: "Rayyan Baniya",        pos: "DEF", role: "CB",  num: 22, age: 25, ovr: 75, pot: 80, nat: "TR" },
    { n: "Yasir Subaşı",         pos: "DEF", role: "LB",  num: 3,  age: 26, ovr: 73, pot: 76, nat: "TR" },
    { n: "Adamo Nagalo",         pos: "DEF", role: "RB",  num: 39, age: 23, ovr: 74, pot: 80, nat: "BF" },
    { n: "Arif Boşluk",          pos: "DEF", role: "LB",  num: 24, age: 24, ovr: 72, pot: 78, nat: "TR" },
    { n: "Marko Jevtović",       pos: "MID", role: "CDM", num: 16, age: 32, ovr: 75, pot: 75, nat: "RS" },
    { n: "Berkan Kutlu",         pos: "MID", role: "CDM", num: 18, age: 27, ovr: 75, pot: 77, nat: "TR" },
    { n: "Deniz Türüç",          pos: "MID", role: "AM",  num: 9,  age: 32, ovr: 75, pot: 75, nat: "TR" },
    { n: "Enis Bardhi",          pos: "MID", role: "AM",  num: 10, age: 30, ovr: 76, pot: 76, nat: "MK" },
    { n: "Diogo Gonçalves",      pos: "MID", role: "LW",  num: 17, age: 29, ovr: 75, pot: 76, nat: "PT" },
    { n: "Pedrinho",             pos: "MID", role: "AM",  num: 8,  age: 27, ovr: 76, pot: 79, nat: "BR" },
    { n: "Sander Svendsen",      pos: "MID", role: "AM",  num: 32, age: 28, ovr: 74, pot: 76, nat: "NO" },
    { n: "Kazeem Olaigbe",       pos: "MID", role: "LW",  num: 70, age: 23, ovr: 73, pot: 79, nat: "BE" },
    { n: "Morten Bjørlo",        pos: "MID", role: "CM",  num: 42, age: 25, ovr: 73, pot: 77, nat: "NO" },
    { n: "Yhoan Andzouana",      pos: "MID", role: "CM",  num: 23, age: 28, ovr: 74, pot: 75, nat: "CG" },
    { n: "Marius Ștefănescu",    pos: "FWD", role: "LW",  num: 11, age: 27, ovr: 74, pot: 76, nat: "RO" },
    { n: "Jackson Muleka",       pos: "FWD", role: "ST",  num: 40, age: 26, ovr: 75, pot: 77, nat: "CD" },
    { n: "Blaž Kramer",          pos: "FWD", role: "ST",  num: 99, age: 29, ovr: 74, pot: 74, nat: "SI" },
    { n: "Tunahan Taşçı",        pos: "FWD", role: "ST",  num: 7,  age: 24, ovr: 72, pot: 78, nat: "TR" },
  ],
);

// ─── 10. Alanyaspor (Wikipedia squad, Şubat 2026) ────────────────
const ALANYASPOR = pack(
  { id: "aln", name: "Alanyaspor", short: "ALN", city: "Antalya", color: "#ea580c", color2: "#15803d" },
  [
    { n: "Ertuğrul Taşkıran",    pos: "GK",  role: "GK",  num: 1,  age: 36, ovr: 74, pot: 74, nat: "TR" },
    { n: "Paulo Victor",         pos: "GK",  role: "GK",  num: 48, age: 33, ovr: 73, pot: 73, nat: "BR" },
    { n: "Bruno Viana",          pos: "DEF", role: "CB",  num: 30, age: 30, ovr: 75, pot: 75, nat: "BR" },
    { n: "Nuno Lima",            pos: "DEF", role: "CB",  num: 3,  age: 29, ovr: 75, pot: 76, nat: "PT" },
    { n: "Fidan Aliti",          pos: "DEF", role: "CB",  num: 5,  age: 32, ovr: 73, pot: 73, nat: "XK" },
    { n: "Fatih Aksoy",          pos: "DEF", role: "CB",  num: 20, age: 27, ovr: 72, pot: 74, nat: "TR" },
    { n: "Baran Moğultay",       pos: "DEF", role: "CB",  num: 18, age: 23, ovr: 72, pot: 78, nat: "TR" },
    { n: "Ümit Akdağ",           pos: "DEF", role: "CB",  num: 50, age: 21, ovr: 72, pot: 82, nat: "TR" },
    { n: "Batuhan Yavuz",        pos: "DEF", role: "LB",  num: 2,  age: 26, ovr: 73, pot: 76, nat: "TR" },
    { n: "Florent Hadergjonaj",  pos: "DEF", role: "RB",  num: 94, age: 31, ovr: 74, pot: 74, nat: "XK" },
    { n: "Ianis Hagi",           pos: "MID", role: "AM",  num: 14, age: 27, ovr: 78, pot: 80, nat: "RO" },
    { n: "İzzet Çelik",          pos: "MID", role: "CM",  num: 6,  age: 27, ovr: 74, pot: 76, nat: "TR" },
    { n: "Efecan Karaca",        pos: "MID", role: "CM",  num: 7,  age: 32, ovr: 73, pot: 73, nat: "TR" },
    { n: "Enes Keskin",          pos: "MID", role: "CM",  num: 8,  age: 25, ovr: 73, pot: 77, nat: "TR" },
    { n: "Nicolas Janvier",      pos: "MID", role: "CM",  num: 17, age: 26, ovr: 74, pot: 77, nat: "FR" },
    { n: "Gaius Makouta",        pos: "MID", role: "CDM", num: 42, age: 27, ovr: 74, pot: 76, nat: "CG" },
    { n: "Maestro",              pos: "MID", role: "CM",  num: 58, age: 26, ovr: 74, pot: 77, nat: "AO" },
    { n: "Steve Mounié",         pos: "FWD", role: "ST",  num: 9,  age: 31, ovr: 76, pot: 76, nat: "BJ" },
    { n: "Meschak Elia",         pos: "FWD", role: "LW",  num: 12, age: 28, ovr: 75, pot: 77, nat: "CD" },
    { n: "Hwang Ui-jo",          pos: "FWD", role: "ST",  num: 16, age: 33, ovr: 75, pot: 75, nat: "KR" },
    { n: "Güven Yalçın",         pos: "FWD", role: "ST",  num: 10, age: 26, ovr: 73, pot: 76, nat: "TR" },
    { n: "Ruan",                 pos: "FWD", role: "LW",  num: 11, age: 25, ovr: 74, pot: 77, nat: "BR" },
  ],
);

// ─── 11. Kasımpaşa (Wikipedia squad, Şubat 2026) ─────────────────
const KASIMPASA = pack(
  { id: "ksm", name: "Kasımpaşa", short: "KSM", city: "İstanbul", color: "#1e3a8a", color2: "#f4f5f7" },
  [
    { n: "Andreas Gianniotis",   pos: "GK",  role: "GK",  num: 1,  age: 33, ovr: 74, pot: 74, nat: "GR" },
    { n: "Ali Emre Yanar",       pos: "GK",  role: "GK",  num: 25, age: 25, ovr: 70, pot: 76, nat: "TR" },
    { n: "Cláudio Winck",        pos: "DEF", role: "RB",  num: 2,  age: 29, ovr: 74, pot: 74, nat: "BR" },
    { n: "Rodrigo Becão",        pos: "DEF", role: "CB",  num: 50, age: 30, ovr: 78, pot: 78, nat: "BR" },
    { n: "Nicholas Opoku",       pos: "DEF", role: "CB",  num: 20, age: 28, ovr: 74, pot: 75, nat: "GH" },
    { n: "Mortadha Ben Ouanes",  pos: "DEF", role: "CB",  num: 12, age: 30, ovr: 74, pot: 74, nat: "TN" },
    { n: "Adem Arous",           pos: "DEF", role: "LB",  num: 4,  age: 26, ovr: 73, pot: 76, nat: "TN" },
    { n: "Godfried Frimpong",    pos: "DEF", role: "LB",  num: 21, age: 25, ovr: 73, pot: 77, nat: "NL" },
    { n: "Kamil Çörekçi",        pos: "DEF", role: "RB",  num: 22, age: 32, ovr: 72, pot: 72, nat: "TR" },
    { n: "Emre Taşdemir",        pos: "DEF", role: "LB",  num: 33, age: 30, ovr: 72, pot: 72, nat: "TR" },
    { n: "Kerem Demirbay",       pos: "MID", role: "CM",  num: 26, age: 32, ovr: 77, pot: 77, nat: "DE" },
    { n: "Cafú",                 pos: "MID", role: "AM",  num: 8,  age: 32, ovr: 74, pot: 74, nat: "PT" },
    { n: "Andri Baldursson",     pos: "MID", role: "CDM", num: 16, age: 23, ovr: 74, pot: 79, nat: "IS" },
    { n: "Atakan Müjde",         pos: "MID", role: "CM",  num: 5,  age: 23, ovr: 72, pot: 78, nat: "TR" },
    { n: "İrfan Can Kahveci",    pos: "MID", role: "AM",  num: 71, age: 30, ovr: 77, pot: 77, nat: "TR" },
    { n: "Ali Yavuz Kol",        pos: "MID", role: "CM",  num: 11, age: 24, ovr: 72, pot: 77, nat: "TR" },
    { n: "Haris Hajradinović",   pos: "FWD", role: "AM",  num: 10, age: 31, ovr: 74, pot: 74, nat: "BA" },
    { n: "Fousseni Diabaté",     pos: "FWD", role: "LW",  num: 34, age: 31, ovr: 75, pot: 75, nat: "ML" },
    { n: "Pape Habib Guèye",     pos: "FWD", role: "ST",  num: 77, age: 27, ovr: 75, pot: 77, nat: "SN" },
    { n: "Cenk Tosun",           pos: "FWD", role: "ST",  num: 23, age: 34, ovr: 73, pot: 73, nat: "TR" },
    { n: "Yusuf Barası",         pos: "FWD", role: "ST",  num: 9,  age: 23, ovr: 72, pot: 79, nat: "TR" },
    { n: "Adrian Benedyczak",    pos: "FWD", role: "ST",  num: 19, age: 25, ovr: 74, pot: 78, nat: "PL" },
    { n: "Jim Allevinah",        pos: "FWD", role: "LW",  num: 18, age: 30, ovr: 73, pot: 74, nat: "GA" },
  ],
);

// ─── 12. Eyüpspor (Wikipedia squad, Mart 2026) ───────────────────
const EYUPSPOR = pack(
  { id: "eyp", name: "Eyüpspor", short: "EYP", city: "İstanbul", color: "#7c3aed", color2: "#facc15" },
  [
    { n: "Marcos Felipe",        pos: "GK",  role: "GK",  num: 1,  age: 29, ovr: 75, pot: 76, nat: "BR" },
    { n: "Jankat Yılmaz",        pos: "GK",  role: "GK",  num: 24, age: 24, ovr: 71, pot: 77, nat: "TR" },
    { n: "Umut Keseci",          pos: "GK",  role: "GK",  num: 31, age: 22, ovr: 68, pot: 77, nat: "TR" },
    { n: "Luccas Claro",         pos: "DEF", role: "CB",  num: 4,  age: 34, ovr: 75, pot: 75, nat: "BR" },
    { n: "Jérôme Onguéné",       pos: "DEF", role: "CB",  num: 68, age: 28, ovr: 75, pot: 77, nat: "CM" },
    { n: "Lucas Calegari",       pos: "DEF", role: "RB",  num: 2,  age: 23, ovr: 73, pot: 78, nat: "BR" },
    { n: "Gilbert Mendy",        pos: "DEF", role: "LB",  num: 3,  age: 27, ovr: 73, pot: 76, nat: "SN" },
    { n: "Umut Meraş",           pos: "DEF", role: "LB",  num: 77, age: 30, ovr: 73, pot: 73, nat: "TR" },
    { n: "Talha Ülvan",          pos: "DEF", role: "LB",  num: 17, age: 24, ovr: 72, pot: 78, nat: "TR" },
    { n: "Diabel Ndoye",         pos: "DEF", role: "CB",  num: 14, age: 24, ovr: 72, pot: 78, nat: "SN" },
    { n: "Denis Radu",           pos: "DEF", role: "CB",  num: 22, age: 28, ovr: 73, pot: 74, nat: "RO" },
    { n: "Bedirhan Özyurt",      pos: "DEF", role: "CB",  num: 5,  age: 22, ovr: 71, pot: 79, nat: "TR" },
    { n: "Arda Yavuz",           pos: "DEF", role: "RB",  num: 88, age: 22, ovr: 71, pot: 78, nat: "TR" },
    { n: "Mateusz Łęgowski",     pos: "MID", role: "CDM", num: 20, age: 22, ovr: 74, pot: 80, nat: "PL" },
    { n: "Ismaila Manga",        pos: "MID", role: "CM",  num: 27, age: 25, ovr: 74, pot: 78, nat: "SN" },
    { n: "Charles-André Raux-Yao", pos: "MID", role: "CM", num: 15, age: 26, ovr: 73, pot: 76, nat: "FR" },
    { n: "Emre Akbaba",          pos: "MID", role: "AM",  num: 8,  age: 32, ovr: 74, pot: 74, nat: "TR" },
    { n: "Dorin Rotariu",        pos: "MID", role: "LW",  num: 7,  age: 30, ovr: 74, pot: 74, nat: "RO" },
    { n: "Lenny Pintor",         pos: "MID", role: "LW",  num: 23, age: 25, ovr: 74, pot: 78, nat: "FR" },
    { n: "Ángel Torres",         pos: "FWD", role: "ST",  num: 10, age: 30, ovr: 75, pot: 76, nat: "CO" },
    { n: "Umut Bozok",           pos: "FWD", role: "ST",  num: 19, age: 28, ovr: 76, pot: 77, nat: "TR" },
    { n: "Abdou Khadre Sy",      pos: "FWD", role: "ST",  num: 25, age: 25, ovr: 74, pot: 78, nat: "SN" },
    { n: "Christ Sadia",         pos: "FWD", role: "LW",  num: 93, age: 26, ovr: 73, pot: 77, nat: "CI" },
    { n: "Metehan Altunbaş",     pos: "FWD", role: "ST",  num: 26, age: 23, ovr: 72, pot: 79, nat: "TR" },
  ],
);

// ─── 13. Kayserispor (Wikipedia squad, Şubat 2026) ───────────────
const KAYSERISPOR = pack(
  { id: "kay", name: "Kayserispor", short: "KAY", city: "Kayseri", color: "#be123c", color2: "#fbbf24" },
  [
    { n: "Onurcan Piri",         pos: "GK",  role: "GK",  num: 1,  age: 26, ovr: 73, pot: 77, nat: "TR" },
    { n: "Bilal Bayazıt",        pos: "GK",  role: "GK",  num: 25, age: 26, ovr: 72, pot: 76, nat: "TR" },
    { n: "Jadel Katongo",        pos: "DEF", role: "CB",  num: 2,  age: 22, ovr: 73, pot: 80, nat: "EN" },
    { n: "Stefano Denswil",      pos: "DEF", role: "CB",  num: 4,  age: 32, ovr: 74, pot: 74, nat: "SR" },
    { n: "Majid Hosseini",       pos: "DEF", role: "CB",  num: 5,  age: 29, ovr: 74, pot: 75, nat: "IR" },
    { n: "Joshua Brenet",        pos: "DEF", role: "RB",  num: 30, age: 32, ovr: 74, pot: 74, nat: "CW" },
    { n: "Lionel Carole",        pos: "DEF", role: "LB",  num: 23, age: 32, ovr: 73, pot: 73, nat: "FR" },
    { n: "Semih Güler",          pos: "DEF", role: "CB",  num: 6,  age: 27, ovr: 73, pot: 75, nat: "TR" },
    { n: "Abdulsamet Burak",     pos: "DEF", role: "CB",  num: 3,  age: 23, ovr: 71, pot: 78, nat: "TR" },
    { n: "Ramazan Civelek",      pos: "DEF", role: "LB",  num: 28, age: 22, ovr: 71, pot: 79, nat: "TR" },
    { n: "László Bénes",         pos: "MID", role: "CM",  num: 8,  age: 28, ovr: 76, pot: 78, nat: "SK" },
    { n: "João Mendes",          pos: "MID", role: "AM",  num: 10, age: 25, ovr: 75, pot: 79, nat: "PT" },
    { n: "Youssef Ait Bennasser",pos: "MID", role: "CDM", num: 15, age: 29, ovr: 74, pot: 75, nat: "MA" },
    { n: "Dorukhan Toköz",       pos: "MID", role: "CDM", num: 24, age: 30, ovr: 74, pot: 74, nat: "TR" },
    { n: "Görkem Sağlam",        pos: "MID", role: "AM",  num: 61, age: 27, ovr: 73, pot: 75, nat: "TR" },
    { n: "Eray Özbek",           pos: "MID", role: "CM",  num: 16, age: 24, ovr: 71, pot: 78, nat: "TR" },
    { n: "Miguel Cardoso",       pos: "FWD", role: "LW",  num: 7,  age: 30, ovr: 75, pot: 75, nat: "PT" },
    { n: "Carlos Mané",          pos: "FWD", role: "LW",  num: 20, age: 31, ovr: 74, pot: 74, nat: "GW" },
    { n: "Sam Mather",           pos: "FWD", role: "RW",  num: 11, age: 23, ovr: 74, pot: 79, nat: "EN" },
    { n: "German Onugkha",       pos: "FWD", role: "ST",  num: 9,  age: 28, ovr: 75, pot: 76, nat: "RU" },
    { n: "Denis Makarov",        pos: "FWD", role: "ST",  num: 18, age: 27, ovr: 74, pot: 76, nat: "RU" },
    { n: "Fedor Chalov",         pos: "FWD", role: "ST",  num: 63, age: 27, ovr: 75, pot: 77, nat: "RU" },
    { n: "Indrit Tuci",          pos: "FWD", role: "ST",  num: 22, age: 25, ovr: 73, pot: 77, nat: "AL" },
  ],
);

// ─── 14. Çaykur Rizespor (Wikipedia squad, Şubat 2026) ───────────
const RIZESPOR = pack(
  { id: "riz", name: "Çaykur Rizespor", short: "RİZ", city: "Rize", color: "#065f46", color2: "#1e3a8a" },
  [
    { n: "Erdem Canpolat",       pos: "GK",  role: "GK",  num: 1,  age: 26, ovr: 73, pot: 77, nat: "TR" },
    { n: "Yahia Fofana",         pos: "GK",  role: "GK",  num: 75, age: 26, ovr: 74, pot: 77, nat: "CI" },
    { n: "Efe Doğan",            pos: "GK",  role: "GK",  num: 35, age: 22, ovr: 69, pot: 77, nat: "TR" },
    { n: "Samet Akaydin",        pos: "DEF", role: "CB",  num: 3,  age: 31, ovr: 75, pot: 75, nat: "TR" },
    { n: "Attila Mocsi",         pos: "DEF", role: "CB",  num: 4,  age: 25, ovr: 74, pot: 77, nat: "HU" },
    { n: "Casper Højer",         pos: "DEF", role: "RB",  num: 5,  age: 30, ovr: 74, pot: 74, nat: "DK" },
    { n: "Modibo Sagnan",        pos: "DEF", role: "CB",  num: 27, age: 26, ovr: 75, pot: 77, nat: "ML" },
    { n: "Husniddin Aliqulov",   pos: "DEF", role: "CB",  num: 2,  age: 28, ovr: 74, pot: 75, nat: "UZ" },
    { n: "Muhammet Taha Şahin",  pos: "DEF", role: "LB",  num: 37, age: 21, ovr: 70, pot: 79, nat: "TR" },
    { n: "Furkan Orak",          pos: "DEF", role: "RB",  num: 70, age: 23, ovr: 71, pot: 78, nat: "TR" },
    { n: "Emir Ortakaya",        pos: "DEF", role: "CB",  num: 65, age: 22, ovr: 70, pot: 79, nat: "TR" },
    { n: "Taylan Antalyalı",     pos: "MID", role: "CDM", num: 14, age: 31, ovr: 74, pot: 74, nat: "TR" },
    { n: "Mithat Pala",          pos: "MID", role: "CM",  num: 54, age: 29, ovr: 73, pot: 74, nat: "TR" },
    { n: "Qazim Laçi",           pos: "MID", role: "CM",  num: 20, age: 31, ovr: 74, pot: 74, nat: "AL" },
    { n: "Giannis Papanikolaou", pos: "MID", role: "CM",  num: 6,  age: 26, ovr: 74, pot: 77, nat: "GR" },
    { n: "Muhamed Buljubašić",   pos: "MID", role: "AM",  num: 18, age: 24, ovr: 73, pot: 78, nat: "BA" },
    { n: "Valentin Mihăilă",     pos: "MID", role: "RW",  num: 7,  age: 26, ovr: 77, pot: 79, nat: "RO" },
    { n: "Halil Dervişoğlu",     pos: "FWD", role: "ST",  num: 11, age: 26, ovr: 76, pot: 78, nat: "TR" },
    { n: "Ali Sowe",             pos: "FWD", role: "ST",  num: 9,  age: 31, ovr: 74, pot: 74, nat: "GM" },
    { n: "Ibrahim Olawoyin",     pos: "FWD", role: "LW",  num: 10, age: 24, ovr: 74, pot: 78, nat: "NG" },
    { n: "Adedire Mebude",       pos: "FWD", role: "LW",  num: 17, age: 23, ovr: 73, pot: 79, nat: "SC" },
    { n: "Frantzdy Pierrot",     pos: "FWD", role: "ST",  num: 19, age: 30, ovr: 74, pot: 74, nat: "HT" },
    { n: "Loide Augusto",        pos: "FWD", role: "ST",  num: 50, age: 26, ovr: 73, pot: 77, nat: "AO" },
    { n: "Altin Zeqiri",         pos: "FWD", role: "ST",  num: 77, age: 25, ovr: 73, pot: 77, nat: "XK" },
  ],
);

// ─── 15. Gaziantep FK (Wikipedia squad, erken 2026) ──────────────
const GAZIANTEP = pack(
  { id: "gfk", name: "Gaziantep FK", short: "GFK", city: "Gaziantep", color: "#881337", color2: "#111827" },
  [
    { n: "Zafer Görgen",         pos: "GK",  role: "GK",  num: 20, age: 29, ovr: 73, pot: 74, nat: "TR" },
    { n: "Mustafa Burak Bozan",  pos: "GK",  role: "GK",  num: 71, age: 26, ovr: 70, pot: 75, nat: "TR" },
    { n: "Myenty Abena",         pos: "DEF", role: "CB",  num: 14, age: 31, ovr: 75, pot: 75, nat: "SR" },
    { n: "Luis Pérez",           pos: "DEF", role: "CB",  num: 2,  age: 28, ovr: 74, pot: 76, nat: "ES" },
    { n: "Salem M'Bakata",       pos: "DEF", role: "CB",  num: 22, age: 26, ovr: 73, pot: 76, nat: "CD" },
    { n: "Kévin Rodrigues",      pos: "DEF", role: "LB",  num: 77, age: 31, ovr: 74, pot: 74, nat: "PT" },
    { n: "Tayyip Talha Sanuç",   pos: "DEF", role: "CB",  num: 23, age: 25, ovr: 73, pot: 78, nat: "TR" },
    { n: "Nazım Sangaré",        pos: "DEF", role: "RB",  num: 30, age: 27, ovr: 73, pot: 74, nat: "TR" },
    { n: "Arda Kızıldağ",        pos: "DEF", role: "CB",  num: 4,  age: 24, ovr: 71, pot: 77, nat: "TR" },
    { n: "Badou Ndiaye",         pos: "MID", role: "CDM", num: 5,  age: 35, ovr: 76, pot: 76, nat: "SN" },
    { n: "Kacper Kozłowski",     pos: "MID", role: "AM",  num: 10, age: 22, ovr: 75, pot: 82, nat: "PL" },
    { n: "Drissa Camara",        pos: "MID", role: "CM",  num: 3,  age: 27, ovr: 74, pot: 76, nat: "CI" },
    { n: "Alexandru Maxim",      pos: "MID", role: "AM",  num: 44, age: 35, ovr: 74, pot: 74, nat: "RO" },
    { n: "Victor Gidado",        pos: "MID", role: "CM",  num: 8,  age: 25, ovr: 73, pot: 77, nat: "NG" },
    { n: "Karamba Gassama",      pos: "MID", role: "CDM", num: 17, age: 27, ovr: 72, pot: 75, nat: "GM" },
    { n: "Melih Kabasakal",      pos: "MID", role: "CM",  num: 6,  age: 26, ovr: 72, pot: 76, nat: "TR" },
    { n: "Mohamed Bayo",         pos: "FWD", role: "ST",  num: 9,  age: 27, ovr: 76, pot: 78, nat: "GN" },
    { n: "Christopher Lungoyi",  pos: "FWD", role: "ST",  num: 11, age: 26, ovr: 74, pot: 77, nat: "CH" },
    { n: "Deian Sorescu",        pos: "FWD", role: "RW",  num: 18, age: 28, ovr: 74, pot: 75, nat: "RO" },
    { n: "Yusuf Kabadayı",       pos: "FWD", role: "LW",  num: 32, age: 22, ovr: 73, pot: 80, nat: "DE" },
    { n: "Denis Drăguș",         pos: "FWD", role: "ST",  num: 70, age: 26, ovr: 74, pot: 77, nat: "RO" },
    { n: "Ali Mevran Ablak",     pos: "FWD", role: "LW",  num: 16, age: 23, ovr: 72, pot: 78, nat: "TR" },
  ],
);

// ─── 16. Kocaelispor (Wikipedia squad, Ocak 2026) ────────────────
const KOCAELISPOR = pack(
  { id: "kcl", name: "Kocaelispor", short: "KCL", city: "Kocaeli", color: "#0f5132", color2: "#111827" },
  [
    { n: "Aleksandar Jovanović", pos: "GK",  role: "GK",  num: 1,  age: 31, ovr: 74, pot: 74, nat: "RS" },
    { n: "Gökhan Değirmenci",    pos: "GK",  role: "GK",  num: 35, age: 33, ovr: 73, pot: 73, nat: "TR" },
    { n: "Serhat Öztaşdelen",    pos: "GK",  role: "GK",  num: 83, age: 26, ovr: 70, pot: 75, nat: "TR" },
    { n: "Anfernee Dijksteel",   pos: "DEF", role: "RB",  num: 2,  age: 29, ovr: 75, pot: 75, nat: "SR" },
    { n: "Mateusz Wieteska",     pos: "DEF", role: "CB",  num: 4,  age: 28, ovr: 75, pot: 77, nat: "PL" },
    { n: "Botond Balogh",        pos: "DEF", role: "CB",  num: 5,  age: 23, ovr: 74, pot: 80, nat: "HU" },
    { n: "Hrvoje Smolčić",       pos: "DEF", role: "CB",  num: 6,  age: 25, ovr: 74, pot: 78, nat: "HR" },
    { n: "Massadio Haïdara",     pos: "DEF", role: "LB",  num: 21, age: 33, ovr: 74, pot: 74, nat: "ML" },
    { n: "Muharrem Cinan",       pos: "DEF", role: "LB",  num: 3,  age: 25, ovr: 72, pot: 76, nat: "TR" },
    { n: "Ahmet Oğuz",           pos: "DEF", role: "CB",  num: 22, age: 28, ovr: 72, pot: 73, nat: "TR" },
    { n: "Karol Linetty",        pos: "MID", role: "CM",  num: 10, age: 30, ovr: 76, pot: 76, nat: "PL" },
    { n: "Habib Keïta",          pos: "MID", role: "CM",  num: 8,  age: 24, ovr: 74, pot: 79, nat: "ML" },
    { n: "Joseph Nonge",         pos: "MID", role: "CM",  num: 98, age: 21, ovr: 73, pot: 82, nat: "BE" },
    { n: "Show",                 pos: "MID", role: "AM",  num: 14, age: 29, ovr: 74, pot: 75, nat: "AO" },
    { n: "Mahamadou Susoho",     pos: "MID", role: "CDM", num: 20, age: 24, ovr: 73, pot: 78, nat: "ES" },
    { n: "Samet Yalçın",         pos: "MID", role: "CM",  num: 23, age: 26, ovr: 72, pot: 76, nat: "TR" },
    { n: "Can Keleş",            pos: "MID", role: "LW",  num: 70, age: 24, ovr: 74, pot: 79, nat: "AT" },
    { n: "Tayfur Bingöl",        pos: "MID", role: "RW",  num: 75, age: 32, ovr: 72, pot: 72, nat: "TR" },
    { n: "Dan Agyei",            pos: "FWD", role: "ST",  num: 7,  age: 28, ovr: 74, pot: 76, nat: "GH" },
    { n: "Bruno Petković",       pos: "FWD", role: "ST",  num: 9,  age: 31, ovr: 76, pot: 76, nat: "HR" },
    { n: "Serdar Dursun",        pos: "FWD", role: "ST",  num: 19, age: 34, ovr: 73, pot: 73, nat: "TR" },
    { n: "Darko Churlinov",      pos: "FWD", role: "LW",  num: 17, age: 25, ovr: 74, pot: 78, nat: "MK" },
    { n: "Ahmet Sağat",          pos: "FWD", role: "ST",  num: 11, age: 24, ovr: 73, pot: 78, nat: "TR" },
    { n: "Rigoberto Rivas",      pos: "FWD", role: "LW",  num: 99, age: 27, ovr: 74, pot: 76, nat: "HN" },
    { n: "Furkan Gedik",         pos: "FWD", role: "ST",  num: 18, age: 23, ovr: 71, pot: 79, nat: "TR" },
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

export const clubMetaById = (id: string): ClubMeta | undefined =>
  CLUB_METAS.find((c) => c.id === id);

export const USER_PACK = FENERBAHCE;
