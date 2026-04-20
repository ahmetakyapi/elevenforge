/**
 * Landing + seed demo data.
 *
 * Everything here is presentational — it drives the marketing page
 * (landing-ui.tsx) and provides the initial Fenerbahçe roster that
 * seed.ts and create-league.ts ship into a user's first club. None of
 * it feeds match engine, transfer market, or any runtime DB read once
 * the user is inside a league — gameplay data lives in Postgres.
 *
 * Anything you'd expect to find here (TRANSFER_LIST, LIVE_MATCH, TOTW,
 * LEAGUE_TABLE, CHAT, CREW, GLOBAL_FEED, TOP_SCORERS, TOP_ASSISTS,
 * POSITIONS, playerByName, USER_CLUB_ID, USER_CLUB, FIXTURES) used to
 * live here for the pre-auth prototype; they were stripped when every
 * consumer moved to real DB queries. Re-add if a future landing panel
 * needs mock scaffolding, but prefer a newspaper/dashboard preview
 * built from the seed league instead.
 */
import type {
  Club,
  Commentary,
  GlobalTransfer,
  Player,
} from "@/types";

export const CLUBS: Club[] = [
  { id: "ist", name: "Fenerbahçe SK",      short: "FB",  city: "İstanbul",   color: "#1e3a8a", color2: "#facc15" },
  { id: "ank", name: "Ankara Kale",        short: "ANK", city: "Ankara",     color: "#1e40af", color2: "#f4f5f7" },
  { id: "izm", name: "İzmir Körfez SK",    short: "İZM", city: "İzmir",      color: "#059669", color2: "#facc15" },
  { id: "brs", name: "Bursa Yeşil",        short: "BYŞ", city: "Bursa",      color: "#15803d", color2: "#f4f5f7" },
  { id: "tra", name: "Trabzon Karadeniz",  short: "TRK", city: "Trabzon",    color: "#7c2d12", color2: "#fbbf24" },
  { id: "ada", name: "Adana Demir",        short: "ADM", city: "Adana",      color: "#1e3a8a", color2: "#ef4444" },
  { id: "kay", name: "Kayseri Erciyes",    short: "KAY", city: "Kayseri",    color: "#be123c", color2: "#facc15" },
  { id: "kon", name: "Konya Ova",          short: "KON", city: "Konya",      color: "#0f766e", color2: "#f4f5f7" },
  { id: "ant", name: "Antalya Akdeniz",    short: "ANT", city: "Antalya",    color: "#ea580c", color2: "#f4f5f7" },
  { id: "sam", name: "Samsun Çakır",       short: "SAM", city: "Samsun",     color: "#b91c1c", color2: "#f4f5f7" },
  { id: "gaz", name: "Gaziantep Kale",     short: "GAZ", city: "Gaziantep",  color: "#881337", color2: "#fbbf24" },
  { id: "esk", name: "Eskişehir Porsuk",   short: "ESK", city: "Eskişehir",  color: "#ca8a04", color2: "#111827" },
  { id: "mal", name: "Malatya Kayısı",     short: "MAL", city: "Malatya",    color: "#9d174d", color2: "#fbbf24" },
  { id: "riz", name: "Rize Çay",           short: "RİZ", city: "Rize",       color: "#065f46", color2: "#f4f5f7" },
  { id: "diy", name: "Diyarbakır Surlar",  short: "DYB", city: "Diyarbakır", color: "#1f2937", color2: "#ef4444" },
  { id: "sak", name: "Sakarya Nehir",      short: "SAK", city: "Sakarya",    color: "#475569", color2: "#22d3ee" },
];

export const clubById = (id: string): Club | undefined =>
  CLUBS.find((c) => c.id === id);

// Fenerbahçe SK 2025-26 squad — refreshed for the new season. Used by both
// the landing page demo and the local seed / create-league flows, so new
// players land in a recognisable modern line-up (Talisca, Asensio, Kanté,
// Guendouzi, Kerem, En-Nesyri, Škriniar, Ederson) rather than last
// season's roster. 21 players: 2 GK / 7 DEF / 7 MID / 5 FWD.
export const SQUAD: Player[] = [
  // GK
  { n: "Ederson",             pos: "GK",  role: "GK",  num: 1,  age: 32, ovr: 87, pot: 87, nat: "BR", fit: 93, mor: 5, wage: 320000, val: 28000000, form: [7.8,7.6,7.9,7.5,7.7], ctr: 3 },
  { n: "Dominik Livaković",   pos: "GK",  role: "GK",  num: 34, age: 30, ovr: 82, pot: 82, nat: "HR", fit: 90, mor: 4, wage: 180000, val: 12000000, form: [7.0,7.1,7.2,7.0,6.9], ctr: 2 },
  // DEF
  { n: "Milan Škriniar",      pos: "DEF", role: "CB",  num: 37, age: 31, ovr: 86, pot: 86, nat: "SK", fit: 93, mor: 5, wage: 300000, val: 32000000, form: [7.7,7.8,7.5,7.6,7.9], ctr: 4 },
  { n: "Çağlar Söyüncü",      pos: "DEF", role: "CB",  num: 4,  age: 30, ovr: 82, pot: 82, nat: "TR", fit: 90, mor: 4, wage: 180000, val: 14000000, form: [7.2,7.0,7.3,7.1,7.2], ctr: 2 },
  { n: "Alexander Djiku",     pos: "DEF", role: "CB",  num: 18, age: 31, ovr: 80, pot: 80, nat: "GH", fit: 88, mor: 4, wage: 150000, val:  9500000, form: [7.0,7.1,6.9,7.2,7.0], ctr: 2 },
  { n: "Jayden Oosterwolde",  pos: "DEF", role: "LB",  num: 14, age: 25, ovr: 81, pot: 85, nat: "NL", fit: 93, mor: 5, wage: 150000, val: 20000000, form: [7.3,7.2,7.4,7.1,7.3], ctr: 4 },
  { n: "Archie Brown",        pos: "DEF", role: "LB",  num: 3,  age: 23, ovr: 78, pot: 85, nat: "EN", fit: 94, mor: 4, wage: 130000, val: 16000000, form: [7.1,7.0,7.3,7.2,7.1], ctr: 5 },
  { n: "Bright Osayi-Samuel", pos: "DEF", role: "RB",  num: 17, age: 28, ovr: 82, pot: 82, nat: "NG", fit: 91, mor: 4, wage: 170000, val: 16000000, form: [7.3,7.5,7.1,7.4,7.2], ctr: 2 },
  { n: "Mert Müldür",         pos: "DEF", role: "RB",  num: 32, age: 27, ovr: 76, pot: 79, nat: "TR", fit: 90, mor: 4, wage: 100000, val:  7500000, form: [6.8,6.9,6.7,7.0,6.8], ctr: 3 },
  // MID
  { n: "N'Golo Kanté",        pos: "MID", role: "CDM", num: 7,  age: 35, ovr: 85, pot: 85, nat: "FR", fit: 88, mor: 5, wage: 380000, val: 18000000, form: [7.6,7.4,7.7,7.5,7.6], ctr: 2 },
  { n: "Mateo Guendouzi",     pos: "MID", role: "CM",  num: 6,  age: 27, ovr: 83, pot: 85, nat: "FR", fit: 94, mor: 5, wage: 240000, val: 30000000, form: [7.5,7.3,7.6,7.4,7.5], ctr: 4 },
  { n: "Sofyan Amrabat",      pos: "MID", role: "CDM", num: 28, age: 28, ovr: 81, pot: 83, nat: "MA", fit: 92, mor: 4, wage: 190000, val: 18000000, form: [7.2,7.4,7.1,7.3,7.2], ctr: 3 },
  { n: "İsmail Yüksek",       pos: "MID", role: "CM",  num: 8,  age: 26, ovr: 78, pot: 82, nat: "TR", fit: 92, mor: 4, wage: 115000, val: 11000000, form: [6.9,7.1,7.0,7.2,6.8], ctr: 4 },
  { n: "Sebastian Szymański", pos: "MID", role: "AM",  num: 10, age: 27, ovr: 85, pot: 86, nat: "PL", fit: 93, mor: 5, wage: 260000, val: 36000000, form: [7.8,7.9,7.5,8.0,7.7], ctr: 4 },
  { n: "Marco Asensio",       pos: "MID", role: "AM",  num: 20, age: 30, ovr: 84, pot: 84, nat: "ES", fit: 90, mor: 4, wage: 280000, val: 24000000, form: [7.6,7.4,7.8,7.5,7.6], ctr: 3 },
  { n: "Oğuz Aydın",          pos: "MID", role: "RW",  num: 29, age: 23, ovr: 76, pot: 83, nat: "TR", fit: 94, mor: 4, wage:  95000, val: 10000000, form: [6.9,7.1,6.8,7.2,7.0], ctr: 4, status: "training" },
  // FWD
  { n: "Anderson Talisca",    pos: "FWD", role: "ST",  num: 9,  age: 32, ovr: 85, pot: 85, nat: "BR", fit: 92, mor: 5, wage: 340000, val: 30000000, form: [7.7,7.9,7.6,8.1,7.5], ctr: 3 },
  { n: "Youssef En-Nesyri",   pos: "FWD", role: "ST",  num: 15, age: 28, ovr: 84, pot: 85, nat: "MA", fit: 93, mor: 5, wage: 280000, val: 34000000, form: [7.8,7.6,7.9,7.7,8.0], ctr: 4 },
  { n: "Kerem Aktürkoğlu",    pos: "MID", role: "LW",  num: 11, age: 27, ovr: 83, pot: 84, nat: "TR", fit: 92, mor: 5, wage: 230000, val: 30000000, form: [7.6,7.8,7.4,7.7,7.5], ctr: 4 },
  { n: "Cherif Ndiaye",       pos: "FWD", role: "ST",  num: 22, age: 26, ovr: 77, pot: 81, nat: "SN", fit: 90, mor: 4, wage: 110000, val:  9500000, form: [7.0,6.9,7.2,6.8,7.1], ctr: 3 },
  { n: "Cenk Tosun",          pos: "FWD", role: "ST",  num: 19, age: 33, ovr: 73, pot: 73, nat: "TR", fit: 80, mor: 3, wage:  80000, val:  3000000, form: [6.6,6.8,6.5,6.9,6.7], ctr: 1, status: "injured" },
];

// ─── Landing page marquee + commentary ────────────────────────
// These two arrays are the only landing content left here; the rest of
// the landing-ui.tsx renders from its own inline copy. When the 2026
// roster is refreshed, these should be updated together so the marketing
// page reads as a single coherent narrative.

export const COMMENTARY: Commentary[] = [
  { m: 74, icon: "⚽", type: "goal",     text: "TALISCA! Ceza yayının sağından, dış kötü ayakla kaleciyi çaresiz bırakacak bir vuruş. FB 2-1 öne geçti. Derbilerde ilk golü atan takım bu sezon %71 kazanıyor." },
  { m: 72, icon: "🎯", type: "shot",     text: "Kerem Aktürkoğlu sol kanattan içeri döndü, vuruşu direğin dibinden auta gitti. Şehir Arena inledi." },
  { m: 68, icon: "🟨", type: "card",     text: "Ankara Kale 10 numarası sert girdi — sarı kart. Kanté kaşları çatık halde soğukkanlılık çağrısı yapıyor." },
  { m: 64, icon: "🔄", type: "sub",      text: "Cherif Ndiaye yerine Oğuz Aydın — taze bacaklar, kanat baskısı." },
  { m: 58, icon: "📣", type: "analysis", text: "Son 6 dakikada Ankara Kale topa daha çok sahip — ev sahibi geri çekildi, tehlike sinyalleri." },
  { m: 52, icon: "⚽", type: "goal",     text: "ANKARA EŞİTLEDİ! Orta sahadan gelen topu klasik bir vuruşla filelerle buluşturdu. 1-1!" },
  { m: 45, icon: "⏱", type: "half",     text: "İlk yarı sonu. FB 1, Ankara Kale 0. Asensio'nun direkten dönen vuruşu hâlâ aklımda." },
  { m: 38, icon: "⚽", type: "goal",     text: "SZYMAŃSKI! 10 numaranın sol çaprazdan vuruşu köşeye, kalecinin uzandığı yerden bir santim içeri. FB öne geçti!" },
  { m: 24, icon: "🎯", type: "shot",     text: "Asensio'nun frikiği direkten döndü. Milim farkla gol değil." },
  { m: 12, icon: "⚽", type: "start",    text: "Düdük çaldı. Derbi Şehir Arena'da başladı. 42.000 kişi ayakta." },
];

export const GLOBAL_TRANSFERS: GlobalTransfer[] = [
  { buyer: "Ahmet D.",  buyerClub: "ank", player: "M. Guendouzi",     price: 32000000, seller: "bot" },
  { buyer: "Elif Ö.",   buyerClub: "izm", player: "A. Talisca",       price: 30000000, seller: "bot" },
  { buyer: "Kaan T.",   buyerClub: "brs", player: "C. Ndiaye",        price:  9500000, seller: "user", sellerName: "Mehmet S." },
  { buyer: "Deniz A.",  buyerClub: "kay", player: "M. Asensio",       price: 24000000, seller: "bot" },
  { buyer: "Zeynep K.", buyerClub: "ada", player: "N. Kanté",         price: 18000000, seller: "bot" },
  { buyer: "Ceren P.",  buyerClub: "gaz", player: "A. Brown",         price: 16000000, seller: "bot" },
];
