/**
 * Süper Lig 2026-27 squads.
 *
 * GENERATED FILE — do not edit by hand.
 *   source     : scripts/squad-source.ts
 *   regenerate : npm run build:squads
 *
 * Roster data (name, shirt number, position, age, nationality) transcribed
 * from Transfermarkt club pages on 13 August 2026. `ovr` and `pot` are NOT
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
      status: s.status,
    })),
  };
}

const FB_PACK = pack(
  { id: "fb", name: "Fenerbahçe", short: "FB", city: "İstanbul", color: "#001a4b", color2: "#ffed00" },
  [
    // GK
    { n: "Ederson", pos: "GK", role: "GK", num: 31, age: 32, ovr: 85, pot: 85, nat: "BR" },
    { n: "İrfan Can Eğribayat", pos: "GK", role: "GK", num: 1, age: 28, ovr: 78, pot: 78, nat: "TR" },
    { n: "Mert Günok", pos: "GK", role: "GK", num: 34, age: 37, ovr: 76, pot: 76, nat: "TR" },
    // DEF
    { n: "Jayden Oosterwolde", pos: "DEF", role: "CB", num: 24, age: 25, ovr: 78, pot: 78, nat: "NL" },
    { n: "Nathan Aké", pos: "DEF", role: "CB", num: 15, age: 31, ovr: 83, pot: 83, nat: "NL" },
    { n: "Milan Škriniar", pos: "DEF", role: "CB", num: 37, age: 31, ovr: 83, pot: 83, nat: "SK" },
    { n: "Çağlar Söyüncü", pos: "DEF", role: "CB", num: 4, age: 30, ovr: 78, pot: 78, nat: "TR" },
    { n: "Rodrigo Becão", pos: "DEF", role: "CB", num: 50, age: 30, ovr: 77, pot: 77, nat: "BR" },
    { n: "Yiğit Efe Demir", pos: "DEF", role: "CB", num: 14, age: 22, ovr: 74, pot: 82, nat: "TR" },
    { n: "Archie Brown", pos: "DEF", role: "LB", num: 3, age: 24, ovr: 76, pot: 80, nat: "EN" },
    { n: "Levent Mercan", pos: "DEF", role: "LB", num: 22, age: 25, ovr: 80, pot: 80, nat: "TR" },
    { n: "Mert Müldür", pos: "DEF", role: "RB", num: 18, age: 27, ovr: 76, pot: 78, nat: "TR" },
    { n: "Nélson Semedo", pos: "DEF", role: "RB", num: 27, age: 32, ovr: 79, pot: 79, nat: "PT" },
    // MID
    { n: "İsmail Yüksek", pos: "MID", role: "CDM", num: 5, age: 27, ovr: 76, pot: 78, nat: "TR" },
    { n: "N'Golo Kanté", pos: "MID", role: "CDM", num: 91, age: 35, ovr: 82, pot: 82, nat: "FR" },
    { n: "Bartuğ Elmaz", pos: "MID", role: "CDM", num: 28, age: 23, ovr: 78, pot: 81, nat: "TR" },
    { n: "Mattéo Guendouzi", pos: "MID", role: "CM", num: 6, age: 27, ovr: 82, pot: 84, nat: "FR" },
    { n: "Fred", pos: "MID", role: "CM", num: 7, age: 33, ovr: 79, pot: 79, nat: "BR" },
    { n: "Marco Asensio", pos: "MID", role: "AM", num: 10, age: 30, ovr: 83, pot: 83, nat: "ES" },
    { n: "Talisca", pos: "MID", role: "AM", num: 94, age: 32, ovr: 82, pot: 82, nat: "BR" },
    { n: "Mert Hakan Yandaş", pos: "MID", role: "AM", num: 8, age: 31, ovr: 79, pot: 79, nat: "TR" },
    // FWD
    { n: "Kerem Aktürkoğlu", pos: "FWD", role: "LW", num: 9, age: 27, ovr: 82, pot: 84, nat: "TR" },
    { n: "Anthony Musaba", pos: "FWD", role: "LW", num: 20, age: 25, ovr: 80, pot: 81, nat: "NL" },
    { n: "Mason Greenwood", pos: "FWD", role: "RW", num: 11, age: 24, ovr: 84, pot: 89, nat: "EN" },
    { n: "Dorgeles Nene", pos: "FWD", role: "RW", num: 45, age: 23, ovr: 76, pot: 80, nat: "ML" },
    { n: "Cengiz Ünder", pos: "FWD", role: "RW", num: 23, age: 29, ovr: 78, pot: 78, nat: "TR" },
    { n: "İrfan Can Kahveci", pos: "FWD", role: "RW", num: 17, age: 31, ovr: 77, pot: 77, nat: "TR" },
    { n: "Romelu Lukaku", pos: "FWD", role: "ST", num: 2, age: 33, ovr: 84, pot: 84, nat: "BE" },
    { n: "Vedat Muriqi", pos: "FWD", role: "ST", num: 19, age: 32, ovr: 79, pot: 79, nat: "XK" },
    { n: "Sidiki Chérif", pos: "FWD", role: "ST", num: 26, age: 19, ovr: 69, pot: 80, nat: "GN" },
  ],
);

const GS_PACK = pack(
  { id: "gs", name: "Galatasaray", short: "GS", city: "İstanbul", color: "#a90432", color2: "#fdb912" },
  [
    // GK
    { n: "Uğurcan Çakır", pos: "GK", role: "GK", num: 1, age: 30, ovr: 82, pot: 82, nat: "TR" },
    { n: "Günay Güvenç", pos: "GK", role: "GK", num: 19, age: 35, ovr: 73, pot: 73, nat: "TR" },
    { n: "Jankat Yılmaz", pos: "GK", role: "GK", num: 24, age: 21, ovr: 74, pot: 80, nat: "TR" },
    // DEF
    { n: "Davinson Sánchez", pos: "DEF", role: "CB", num: 6, age: 30, ovr: 80, pot: 80, nat: "CO" },
    { n: "Abdülkerim Bardakcı", pos: "DEF", role: "CB", num: 42, age: 31, ovr: 78, pot: 78, nat: "TR" },
    { n: "Victor Nelsson", pos: "DEF", role: "CB", num: 2, age: 27, ovr: 78, pot: 79, nat: "DK" },
    { n: "Kaan Ayhan", pos: "DEF", role: "CB", num: 23, age: 31, ovr: 77, pot: 77, nat: "TR" },
    { n: "Metehan Baltacı", pos: "DEF", role: "CB", num: 3, age: 23, ovr: 76, pot: 79, nat: "TR" },
    { n: "Arda Ünyay", pos: "DEF", role: "CB", num: 91, age: 19, ovr: 69, pot: 80, nat: "TR" },
    { n: "Ismail Jakobs", pos: "DEF", role: "LB", num: 4, age: 26, ovr: 77, pot: 78, nat: "SN" },
    { n: "Eren Elmalı", pos: "DEF", role: "LB", num: 17, age: 26, ovr: 76, pot: 77, nat: "TR" },
    { n: "Wilfried Singo", pos: "DEF", role: "RB", num: 9, age: 25, ovr: 81, pot: 81, nat: "CI" },
    { n: "Roland Sallai", pos: "DEF", role: "RB", num: 7, age: 29, ovr: 78, pot: 78, nat: "HU" },
    { n: "Elias Jelert", pos: "DEF", role: "RB", num: 12, age: 23, ovr: 75, pot: 79, nat: "DK" },
    // MID
    { n: "Lesley Ugochukwu", pos: "MID", role: "CDM", num: 18, age: 22, ovr: 77, pot: 85, nat: "FR" },
    { n: "Lucas Torreira", pos: "MID", role: "CDM", num: 34, age: 30, ovr: 81, pot: 81, nat: "UY" },
    { n: "Mario Lemina", pos: "MID", role: "CDM", num: 99, age: 32, ovr: 79, pot: 79, nat: "GA" },
    { n: "Eyüp Aydın", pos: "MID", role: "CDM", num: 5, age: 22, ovr: 72, pot: 79, nat: "TR" },
    { n: "Gabriel Sara", pos: "MID", role: "CM", num: 8, age: 27, ovr: 80, pot: 81, nat: "BR" },
    { n: "İlkay Gündoğan", pos: "MID", role: "CM", num: 20, age: 35, ovr: 83, pot: 83, nat: "DE" },
    { n: "Renato Nhaga", pos: "MID", role: "CM", num: 74, age: 19, ovr: 69, pot: 78, nat: "GW" },
    { n: "Siraçhan Nas", pos: "MID", role: "AM", num: 53, age: 24, ovr: 77, pot: 80, nat: "TR" },
    // FWD
    { n: "Barış Alper Yılmaz", pos: "FWD", role: "LW", num: 76, age: 26, ovr: 80, pot: 81, nat: "TR" },
    { n: "Leroy Sané", pos: "FWD", role: "RW", num: 10, age: 30, ovr: 85, pot: 85, nat: "DE" },
    { n: "Yunus Akgün", pos: "FWD", role: "RW", num: 11, age: 26, ovr: 78, pot: 80, nat: "TR" },
    { n: "Armando Güner", pos: "FWD", role: "RW", num: 27, age: 18, ovr: 71, pot: 84, nat: "AR" },
    { n: "Victor Osimhen", pos: "FWD", role: "ST", num: 13, age: 27, ovr: 87, pot: 88, nat: "NG" },
    { n: "Halil Dervişoğlu", pos: "FWD", role: "ST", num: 14, age: 26, ovr: 80, pot: 80, nat: "TR" },
    { n: "Yalın Dilek", pos: "FWD", role: "ST", num: 15, age: 20, ovr: 72, pot: 83, nat: "TR" },
  ],
);

const BJK_PACK = pack(
  { id: "bjk", name: "Beşiktaş", short: "BJK", city: "İstanbul", color: "#111114", color2: "#f4f5f7" },
  [
    // GK
    { n: "Alexander Nübel", pos: "GK", role: "GK", num: 1, age: 29, ovr: 82, pot: 82, nat: "DE" },
    { n: "Doğan Alemdar", pos: "GK", role: "GK", num: 80, age: 23, ovr: 72, pot: 76, nat: "TR" },
    { n: "Emre Bilgin", pos: "GK", role: "GK", num: 99, age: 22, ovr: 73, pot: 81, nat: "TR" },
    // DEF
    { n: "Emmanuel Agbadou", pos: "DEF", role: "CB", num: 12, age: 29, ovr: 79, pot: 79, nat: "CI" },
    { n: "Tiago Djaló", pos: "DEF", role: "CB", num: 35, age: 26, ovr: 77, pot: 78, nat: "PT" },
    { n: "Felix Uduokhai", pos: "DEF", role: "CB", num: 14, age: 28, ovr: 77, pot: 77, nat: "DE" },
    { n: "Emirhan Topçu", pos: "DEF", role: "CB", num: 53, age: 25, ovr: 78, pot: 78, nat: "TR" },
    { n: "Yasin Özcan", pos: "DEF", role: "CB", num: 58, age: 20, ovr: 67, pot: 77, nat: "TR" },
    { n: "Emrecan Uzunhan", pos: "DEF", role: "CB", num: 2, age: 25, ovr: 78, pot: 78, nat: "TR" },
    { n: "Kassoum Ouattara", pos: "DEF", role: "LB", num: 11, age: 21, ovr: 74, pot: 82, nat: "FR" },
    { n: "Rıdvan Yılmaz", pos: "DEF", role: "LB", num: 33, age: 25, ovr: 75, pot: 75, nat: "TR" },
    { n: "Amir Murillo", pos: "DEF", role: "RB", num: 62, age: 30, ovr: 77, pot: 77, nat: "TR" },
    { n: "Taylan Bulut", pos: "DEF", role: "RB", num: 22, age: 20, ovr: 67, pot: 77, nat: "DE" },
    // MID
    { n: "Wilfred Ndidi", pos: "MID", role: "CDM", num: 4, age: 29, ovr: 81, pot: 81, nat: "NG" },
    { n: "Moatasem Al-Musrati", pos: "MID", role: "CDM", num: 3, age: 30, ovr: 77, pot: 77, nat: "LY" },
    { n: "Amir Hadziahmetovic", pos: "MID", role: "CDM", num: 5, age: 29, ovr: 75, pot: 75, nat: "BA" },
    { n: "Salih Özcan", pos: "MID", role: "CDM", num: 6, age: 28, ovr: 77, pot: 77, nat: "TR" },
    { n: "Kartal Yılmaz", pos: "MID", role: "CDM", num: 8, age: 25, ovr: 77, pot: 79, nat: "TR" },
    { n: "Orkun Kökçü", pos: "MID", role: "CM", num: 10, age: 25, ovr: 82, pot: 83, nat: "TR" },
    { n: "Fahri Ay", pos: "MID", role: "CM", num: 68, age: 21, ovr: 74, pot: 80, nat: "TR" },
    { n: "Junior Olaitan", pos: "MID", role: "AM", num: 15, age: 24, ovr: 76, pot: 79, nat: "BJ" },
    { n: "João Mário", pos: "MID", role: "AM", num: 13, age: 33, ovr: 78, pot: 78, nat: "PT" },
    // FWD
    { n: "Leandro Trossard", pos: "FWD", role: "LW", num: 19, age: 31, ovr: 84, pot: 84, nat: "BE" },
    { n: "İlhan Fakılı", pos: "FWD", role: "LW", num: 29, age: 20, ovr: 71, pot: 81, nat: "TR" },
    { n: "Vaclav Cerny", pos: "FWD", role: "RW", num: 18, age: 28, ovr: 78, pot: 78, nat: "CZ" },
    { n: "Milot Rashica", pos: "FWD", role: "RW", num: 7, age: 30, ovr: 77, pot: 77, nat: "XK" },
    { n: "Dušan Vlahović", pos: "FWD", role: "ST", num: 28, age: 26, ovr: 84, pot: 85, nat: "RS" },
    { n: "Oh Hyeon-gyu", pos: "FWD", role: "ST", num: 9, age: 25, ovr: 76, pot: 76, nat: "KR" },
    { n: "Semih Kılıçsoy", pos: "FWD", role: "ST", num: 90, age: 20, ovr: 74, pot: 85, nat: "TR" },
    { n: "Mustafa Hekimoğlu", pos: "FWD", role: "ST", num: 23, age: 19, ovr: 67, pot: 78, nat: "TR" },
  ],
);

const TS_PACK = pack(
  { id: "ts", name: "Trabzonspor", short: "TS", city: "Trabzon", color: "#7a1b1f", color2: "#1e3a8a" },
  [
    // GK
    { n: "André Onana", pos: "GK", role: "GK", num: 24, age: 30, ovr: 81, pot: 81, nat: "CM" },
    { n: "Onuralp Çevikkan", pos: "GK", role: "GK", num: 25, age: 20, ovr: 68, pot: 78, nat: "TR" },
    { n: "Ahmet Yıldırım", pos: "GK", role: "GK", num: 1, age: 19, ovr: 70, pot: 81, nat: "TR" },
    // DEF
    { n: "Arseniy Batagov", pos: "DEF", role: "CB", num: 44, age: 24, ovr: 75, pot: 78, nat: "UA" },
    { n: "Chibuike Nwaiwu", pos: "DEF", role: "CB", num: 27, age: 23, ovr: 73, pot: 78, nat: "NG" },
    { n: "Cenk Özkacar", pos: "DEF", role: "CB", num: 39, age: 25, ovr: 74, pot: 74, nat: "TR" },
    { n: "Samet Akaydin", pos: "DEF", role: "CB", num: 4, age: 32, ovr: 75, pot: 75, nat: "TR" },
    { n: "Stefan Savic", pos: "DEF", role: "CB", num: 15, age: 35, ovr: 76, pot: 76, nat: "ME" },
    { n: "Sidny Lopes Cabral", pos: "DEF", role: "LB", num: 55, age: 23, ovr: 74, pot: 77, nat: "CV" },
    { n: "Mustafa Eskihellaç", pos: "DEF", role: "LB", num: 7, age: 29, ovr: 76, pot: 76, nat: "TR" },
    { n: "Wagner Pina", pos: "DEF", role: "RB", num: 20, age: 23, ovr: 76, pot: 79, nat: "CV" },
    // MID
    { n: "Batista Mendy", pos: "MID", role: "CDM", num: 2, age: 26, ovr: 76, pot: 78, nat: "FR" },
    { n: "John Lundstram", pos: "MID", role: "CDM", num: 3, age: 32, ovr: 76, pot: 76, nat: "EN" },
    { n: "Okay Yokuşlu", pos: "MID", role: "CDM", num: 5, age: 32, ovr: 76, pot: 76, nat: "TR" },
    { n: "Melih Kabasakal", pos: "MID", role: "CDM", num: 57, age: 30, ovr: 75, pot: 75, nat: "TR" },
    { n: "Tim Jabol-Folcarelli", pos: "MID", role: "CM", num: 26, age: 26, ovr: 78, pot: 78, nat: "FR" },
    { n: "Benjamin Bouchouari", pos: "MID", role: "CM", num: 8, age: 24, ovr: 75, pot: 80, nat: "MA" },
    { n: "Ruslan Malinovskyi", pos: "MID", role: "CM", num: 17, age: 33, ovr: 79, pot: 79, nat: "UA" },
    { n: "Ozan Tufam", pos: "MID", role: "CM", num: 11, age: 31, ovr: 73, pot: 73, nat: "TR" },
    { n: "Ernest Muci", pos: "MID", role: "AM", num: 10, age: 25, ovr: 77, pot: 79, nat: "AL" },
    { n: "Göktan Gürpüz", pos: "MID", role: "AM", num: 6, age: 23, ovr: 73, pot: 78, nat: "TR" },
    // FWD
    { n: "Aral Şimşir", pos: "FWD", role: "LW", num: 58, age: 24, ovr: 72, pot: 77, nat: "TR" },
    { n: "Noah Saviolo", pos: "FWD", role: "LW", num: 70, age: 22, ovr: 70, pot: 76, nat: "PT" },
    { n: "Metehan Mimaroğlu", pos: "FWD", role: "LW", num: 9, age: 32, ovr: 75, pot: 75, nat: "TR" },
    { n: "Mohamed Salah", pos: "FWD", role: "RW", num: 77, age: 34, ovr: 87, pot: 87, nat: "EG" },
    { n: "Cihan Çanak", pos: "FWD", role: "RW", num: 12, age: 21, ovr: 71, pot: 77, nat: "TR" },
    { n: "Paul Onuachu", pos: "FWD", role: "ST", num: 30, age: 32, ovr: 78, pot: 78, nat: "NG" },
    { n: "Denis Drăguș", pos: "FWD", role: "ST", num: 13, age: 27, ovr: 76, pot: 76, nat: "RO" },
    { n: "René Mitongo", pos: "FWD", role: "ST", num: 19, age: 18, ovr: 68, pot: 82, nat: "BE" },
    { n: "Umut Nayir", pos: "FWD", role: "ST", num: 14, age: 33, ovr: 72, pot: 72, nat: "TR" },
  ],
);

const BFK_PACK = pack(
  { id: "ibfk", name: "Başakşehir FK", short: "İBFK", city: "İstanbul", color: "#f97316", color2: "#1e3a8a" },
  [
    // GK
    { n: "Muhammed Şengezer", pos: "GK", role: "GK", num: 16, age: 29, ovr: 72, pot: 72, nat: "TR" },
    { n: "Volkan Babacan", pos: "GK", role: "GK", num: 1, age: 38, ovr: 72, pot: 72, nat: "TR" },
    { n: "Deniz Dilmen", pos: "GK", role: "GK", num: 98, age: 21, ovr: 69, pot: 76, nat: "TR" },
    // DEF
    { n: "Jerome Opoku", pos: "DEF", role: "CB", num: 3, age: 27, ovr: 71, pot: 72, nat: "GH" },
    { n: "Ousseynou Ba", pos: "DEF", role: "CB", num: 27, age: 30, ovr: 73, pot: 73, nat: "SN" },
    { n: "Emin Bayram", pos: "DEF", role: "CB", num: 23, age: 23, ovr: 72, pot: 76, nat: "TR" },
    { n: "Hamza Güreler", pos: "DEF", role: "CB", num: 15, age: 20, ovr: 67, pot: 77, nat: "TR" },
    { n: "Francis Nzaba", pos: "DEF", role: "CB", num: 2, age: 23, ovr: 73, pot: 76, nat: "CG" },
    { n: "Christopher Operi", pos: "DEF", role: "LB", num: 21, age: 29, ovr: 71, pot: 71, nat: "CI" },
    { n: "Michal Karbownik", pos: "DEF", role: "LB", num: 33, age: 25, ovr: 75, pot: 77, nat: "PL" },
    { n: "Onur Bulut", pos: "DEF", role: "RB", num: 6, age: 32, ovr: 72, pot: 72, nat: "TR" },
    { n: "Ömer Ali Şahiner", pos: "DEF", role: "RB", num: 42, age: 34, ovr: 70, pot: 70, nat: "TR" },
    // MID
    { n: "Jakub Kaluzinski", pos: "MID", role: "CDM", num: 18, age: 23, ovr: 73, pot: 76, nat: "PL" },
    { n: "Onur Ergün", pos: "MID", role: "CDM", num: 4, age: 33, ovr: 70, pot: 70, nat: "TR" },
    { n: "Umut Güneş", pos: "MID", role: "CM", num: 20, age: 26, ovr: 74, pot: 74, nat: "TR" },
    { n: "Olivier Kemen", pos: "MID", role: "CM", num: 8, age: 30, ovr: 74, pot: 74, nat: "CM" },
    { n: "Berkay Özcan", pos: "MID", role: "CM", num: 5, age: 28, ovr: 72, pot: 72, nat: "TR" },
    { n: "Mohamed Hassan Fofana", pos: "MID", role: "CM", num: 17, age: 21, ovr: 69, pot: 77, nat: "CI" },
    { n: "Ömer Beyaz", pos: "MID", role: "AM", num: 22, age: 22, ovr: 71, pot: 79, nat: "TR" },
    // FWD
    { n: "Ivan Brnic", pos: "FWD", role: "LW", num: 77, age: 24, ovr: 73, pot: 77, nat: "HR" },
    { n: "Abbosbek Fayzullaev", pos: "FWD", role: "RW", num: 11, age: 22, ovr: 70, pot: 76, nat: "UZ" },
    { n: "Andreas Skov Olsen", pos: "FWD", role: "RW", num: 70, age: 26, ovr: 76, pot: 78, nat: "DK" },
    { n: "Edin Visca", pos: "FWD", role: "RW", num: 34, age: 36, ovr: 76, pot: 76, nat: "BA" },
    { n: "Eldor Shomurodov", pos: "FWD", role: "ST", num: 14, age: 31, ovr: 76, pot: 76, nat: "UZ" },
    { n: "Bertuğ Yıldırım", pos: "FWD", role: "ST", num: 91, age: 24, ovr: 71, pot: 74, nat: "TR" },
    { n: "Davie Selke", pos: "FWD", role: "ST", num: 7, age: 31, ovr: 73, pot: 73, nat: "DE" },
    { n: "Umut Bozok", pos: "FWD", role: "ST", num: 9, age: 29, ovr: 71, pot: 71, nat: "TR" },
  ],
);

const SAM_PACK = pack(
  { id: "sam", name: "Samsunspor", short: "SAM", city: "Samsun", color: "#dc2626", color2: "#ffffff" },
  [
    // GK
    { n: "Okan Kocuk", pos: "GK", role: "GK", num: 1, age: 31, ovr: 74, pot: 74, nat: "TR" },
    { n: "Bilal Bayazıt", pos: "GK", role: "GK", num: 2, age: 27, ovr: 71, pot: 72, nat: "TR" },
    { n: "Efe Berat Töruz", pos: "GK", role: "GK", num: 3, age: 19, ovr: 68, pot: 77, nat: "TR" },
    // DEF
    { n: "Gabriele Guarino", pos: "DEF", role: "CB", num: 4, age: 22, ovr: 67, pot: 75, nat: "IT" },
    { n: "Toni Borevković", pos: "DEF", role: "CB", num: 5, age: 29, ovr: 73, pot: 73, nat: "HR" },
    { n: "Igor Drapiński", pos: "DEF", role: "CB", num: 6, age: 22, ovr: 71, pot: 77, nat: "PL" },
    { n: "Yunus Emre Çift", pos: "DEF", role: "CB", num: 7, age: 22, ovr: 71, pot: 79, nat: "TR" },
    { n: "Bedirhan Çetin", pos: "DEF", role: "CB", num: 8, age: 20, ovr: 65, pot: 75, nat: "TR" },
    { n: "Logi Tómasson", pos: "DEF", role: "LB", num: 9, age: 25, ovr: 75, pot: 77, nat: "IS" },
    { n: "Enes Albak", pos: "DEF", role: "LB", num: 10, age: 21, ovr: 70, pot: 78, nat: "TR" },
    { n: "Joe Mendes", pos: "DEF", role: "RB", num: 11, age: 23, ovr: 72, pot: 75, nat: "SE" },
    { n: "Mustafa Tan", pos: "DEF", role: "RB", num: 12, age: 21, ovr: 69, pot: 76, nat: "TR" },
    // MID
    { n: "Antoine Makoumbou", pos: "MID", role: "CDM", num: 13, age: 28, ovr: 75, pot: 75, nat: "CG" },
    { n: "Elliot Watt", pos: "MID", role: "CDM", num: 14, age: 26, ovr: 73, pot: 74, nat: "SC" },
    { n: "Antoine Sekongo", pos: "MID", role: "CM", num: 15, age: 22, ovr: 68, pot: 75, nat: "ML" },
    { n: "Yalçın Kayan", pos: "MID", role: "CM", num: 16, age: 27, ovr: 73, pot: 74, nat: "TR" },
    { n: "Celil Yüksel", pos: "MID", role: "CM", num: 17, age: 28, ovr: 72, pot: 72, nat: "TR" },
    { n: "Samed Onur", pos: "MID", role: "CM", num: 18, age: 24, ovr: 72, pot: 76, nat: "TR" },
    { n: "Afonso Sousa", pos: "MID", role: "AM", num: 19, age: 26, ovr: 71, pot: 72, nat: "PT" },
    // FWD
    { n: "Jaurès Assoumou", pos: "FWD", role: "LW", num: 20, age: 23, ovr: 72, pot: 77, nat: "CI" },
    { n: "Emre Kılınç", pos: "FWD", role: "LW", num: 21, age: 31, ovr: 72, pot: 72, nat: "TR" },
    { n: "Arbnor Muja", pos: "FWD", role: "RW", num: 22, age: 27, ovr: 74, pot: 74, nat: "AL" },
    { n: "Elayis Tavsan", pos: "FWD", role: "RW", num: 23, age: 25, ovr: 74, pot: 76, nat: "TR" },
    { n: "Tanguy Coulibaly", pos: "FWD", role: "RW", num: 24, age: 25, ovr: 75, pot: 75, nat: "FR" },
    { n: "Marius Mouandilmadji", pos: "FWD", role: "ST", num: 25, age: 28, ovr: 73, pot: 73, nat: "TD" },
    { n: "Cherif Ndiaye", pos: "FWD", role: "ST", num: 26, age: 30, ovr: 72, pot: 72, nat: "SN" },
    { n: "Fatih Kaya", pos: "FWD", role: "ST", num: 27, age: 26, ovr: 73, pot: 74, nat: "TR" },
    { n: "Richie Omorowa", pos: "FWD", role: "ST", num: 28, age: 22, ovr: 68, pot: 76, nat: "SE" },
  ],
);

const GZT_PACK = pack(
  { id: "gzt", name: "Göztepe", short: "GZT", city: "İzmir", color: "#facc15", color2: "#dc2626" },
  [
    // GK
    { n: "Luka Gugeshashvili", pos: "GK", role: "GK", num: 25, age: 27, ovr: 71, pot: 72, nat: "GE" },
    { n: "Arda Özçimen", pos: "GK", role: "GK", num: 1, age: 24, ovr: 72, pot: 77, nat: "TR" },
    { n: "Şamil Öztürk", pos: "GK", role: "GK", num: 33, age: 21, ovr: 71, pot: 79, nat: "TR" },
    // DEF
    { n: "Malcom Bokele", pos: "DEF", role: "CB", num: 26, age: 26, ovr: 75, pot: 77, nat: "CM" },
    { n: "Taha Altıkardeş", pos: "DEF", role: "CB", num: 4, age: 22, ovr: 68, pot: 76, nat: "TR" },
    { n: "Furkan Bayır", pos: "DEF", role: "CB", num: 23, age: 26, ovr: 75, pot: 75, nat: "TR" },
    { n: "Noah Sonko Sundberg", pos: "DEF", role: "RB", num: 19, age: 30, ovr: 72, pot: 72, nat: "GM" },
    { n: "Allan Godói", pos: "DEF", role: "CB", num: 3, age: 33, ovr: 72, pot: 72, nat: "BR" },
    { n: "Ege Yıldırım", pos: "DEF", role: "LB", num: 13, age: 19, ovr: 65, pot: 75, nat: "TR" },
    // MID
    { n: "Anthony Dennis", pos: "MID", role: "CDM", num: 30, age: 22, ovr: 69, pot: 75, nat: "NG" },
    { n: "Novatus Miroshi", pos: "MID", role: "CDM", num: 20, age: 23, ovr: 69, pot: 72, nat: "TZ" },
    { n: "Musah Mohammed", pos: "MID", role: "CDM", num: 5, age: 24, ovr: 71, pot: 76, nat: "GH" },
    { n: "Rhaldney", pos: "MID", role: "CM", num: 12, age: 27, ovr: 71, pot: 73, nat: "BR" },
    { n: "Alex Matos", pos: "MID", role: "CM", num: 6, age: 21, ovr: 68, pot: 76, nat: "EN" },
    { n: "Arda Okan Kurtulan", pos: "MID", role: "RW", num: 2, age: 23, ovr: 69, pot: 74, nat: "TR" },
    { n: "Ogün Bayrak", pos: "MID", role: "RW", num: 16, age: 27, ovr: 74, pot: 74, nat: "TR" },
    { n: "Amin Cherni", pos: "MID", role: "LW", num: 15, age: 25, ovr: 75, pot: 77, nat: "TN" },
    { n: "Alexis Antunes", pos: "MID", role: "AM", num: 8, age: 26, ovr: 75, pot: 75, nat: "CH" },
    { n: "Efkan Bekiroğlu", pos: "MID", role: "AM", num: 10, age: 30, ovr: 72, pot: 72, nat: "TR" },
    // FWD
    { n: "Juan", pos: "FWD", role: "ST", num: 9, age: 24, ovr: 72, pot: 75, nat: "BR" },
    { n: "Janderson", pos: "FWD", role: "ST", num: 39, age: 27, ovr: 72, pot: 74, nat: "BR" },
    { n: "André Henrique", pos: "FWD", role: "ST", num: 7, age: 24, ovr: 69, pot: 73, nat: "BR" },
    { n: "Sinclair Armstrong", pos: "FWD", role: "ST", num: 22, age: 23, ovr: 71, pot: 75, nat: "IE" },
    { n: "Guilherme Luiz", pos: "FWD", role: "ST", num: 11, age: 21, ovr: 71, pot: 78, nat: "BR" },
    { n: "Gökdeniz Bayrakdar", pos: "FWD", role: "ST", num: 17, age: 24, ovr: 69, pot: 72, nat: "TR" },
  ],
);

const RZ_PACK = pack(
  { id: "riz", name: "Çaykur Rizespor", short: "RİZ", city: "Rize", color: "#16a34a", color2: "#1d4ed8" },
  [
    // GK
    { n: "Yahia Fofana", pos: "GK", role: "GK", num: 2, age: 25, ovr: 73, pot: 75, nat: "CI" },
    { n: "Zafer Görgen", pos: "GK", role: "GK", num: 3, age: 26, ovr: 71, pot: 72, nat: "TR" },
    { n: "Efe Doğan", pos: "GK", role: "GK", num: 4, age: 21, ovr: 69, pot: 75, nat: "TR" },
    // DEF
    { n: "Siaka Bakayoko", pos: "DEF", role: "CB", num: 5, age: 21, ovr: 66, pot: 72, nat: "FR" },
    { n: "Attila Mocsi", pos: "DEF", role: "CB", num: 6, age: 26, ovr: 71, pot: 71, nat: "HU" },
    { n: "Modibo Sagnan", pos: "DEF", role: "CB", num: 7, age: 27, ovr: 69, pot: 71, nat: "ML" },
    { n: "Tayyip Talha Sanuç", pos: "DEF", role: "CB", num: 8, age: 26, ovr: 71, pot: 71, nat: "TR" },
    { n: "Khusniddin Alikulov", pos: "DEF", role: "CB", num: 9, age: 27, ovr: 70, pot: 70, nat: "UZ" },
    { n: "Hüseyincan Kırıkcı", pos: "DEF", role: "CB", num: 10, age: 22, ovr: 67, pot: 73, nat: "TR" },
    { n: "Zakaria Ariss", pos: "DEF", role: "LB", num: 11, age: 22, ovr: 66, pot: 72, nat: "MA" },
    { n: "Umut Erdem", pos: "DEF", role: "LB", num: 12, age: 22, ovr: 67, pot: 73, nat: "TR" },
    { n: "Taha Şahin", pos: "DEF", role: "RB", num: 13, age: 25, ovr: 71, pot: 73, nat: "TR" },
    { n: "Mithat Pala", pos: "DEF", role: "RB", num: 14, age: 25, ovr: 73, pot: 74, nat: "TR" },
    // MID
    { n: "Taylan Antalyalı", pos: "MID", role: "CDM", num: 15, age: 31, ovr: 68, pot: 68, nat: "TR" },
    { n: "Qazim Laci", pos: "MID", role: "CM", num: 16, age: 30, ovr: 71, pot: 71, nat: "AL" },
    { n: "Ibrahim Olawoyin", pos: "MID", role: "CM", num: 17, age: 28, ovr: 73, pot: 73, nat: "NG" },
    { n: "Dal Varesanovic", pos: "MID", role: "AM", num: 18, age: 25, ovr: 71, pot: 72, nat: "BA" },
    { n: "Eren Emre Aydın", pos: "MID", role: "AM", num: 19, age: 21, ovr: 69, pot: 75, nat: "TR" },
    { n: "Valentin Mihăilă", pos: "MID", role: "LW", num: 20, age: 26, ovr: 75, pot: 75, nat: "RO" },
    // FWD
    { n: "Ahmed Kutucu", pos: "FWD", role: "LW", num: 21, age: 26, ovr: 70, pot: 72, nat: "TR" },
    { n: "Emrecan Bulut", pos: "FWD", role: "LW", num: 22, age: 23, ovr: 69, pot: 73, nat: "TR" },
    { n: "Adedire Mebude", pos: "FWD", role: "RW", num: 23, age: 22, ovr: 67, pot: 73, nat: "SC" },
    { n: "Mame Mor Faye", pos: "FWD", role: "RW", num: 24, age: 21, ovr: 69, pot: 76, nat: "SN" },
    { n: "Ali Sowe", pos: "FWD", role: "ST", num: 25, age: 32, ovr: 68, pot: 68, nat: "GM" },
  ],
);

const ALN_PACK = pack(
  { id: "aln", name: "Alanyaspor", short: "ALN", city: "Alanya", color: "#f97316", color2: "#16a34a" },
  [
    // GK
    { n: "Yusuf Karagöz", pos: "GK", role: "GK", num: 2, age: 26, ovr: 71, pot: 72, nat: "TR" },
    { n: "Mert Bayram", pos: "GK", role: "GK", num: 3, age: 21, ovr: 65, pot: 72, nat: "TR" },
    { n: "Paulo Victor", pos: "GK", role: "GK", num: 4, age: 39, ovr: 68, pot: 68, nat: "BR" },
    // DEF
    { n: "Ümit Akdağ", pos: "DEF", role: "CB", num: 5, age: 22, ovr: 68, pot: 75, nat: "RO" },
    { n: "Nuno Lima", pos: "DEF", role: "CB", num: 6, age: 25, ovr: 72, pot: 72, nat: "PT" },
    { n: "Fatih Aksoy", pos: "DEF", role: "CB", num: 7, age: 28, ovr: 70, pot: 70, nat: "TR" },
    { n: "Fidan Aliti", pos: "DEF", role: "CB", num: 8, age: 32, ovr: 71, pot: 71, nat: "XK" },
    { n: "Bedirhan Özyurt", pos: "DEF", role: "CB", num: 9, age: 23, ovr: 70, pot: 75, nat: "TR" },
    { n: "Florent Hadergjonaj", pos: "DEF", role: "RB", num: 10, age: 32, ovr: 69, pot: 69, nat: "XK" },
    { n: "Enes Keskin", pos: "DEF", role: "RB", num: 11, age: 25, ovr: 73, pot: 74, nat: "TR" },
    { n: "Yusuf Özdemir", pos: "DEF", role: "LB", num: 12, age: 25, ovr: 72, pot: 72, nat: "TR" },
    // MID
    { n: "Maestro", pos: "MID", role: "CDM", num: 13, age: 23, ovr: 68, pot: 71, nat: "AO" },
    { n: "Gaius Makouta", pos: "MID", role: "CDM", num: 14, age: 29, ovr: 73, pot: 73, nat: "CG" },
    { n: "Baran Gezek", pos: "MID", role: "CDM", num: 15, age: 20, ovr: 63, pot: 73, nat: "TR" },
    { n: "İzzet Çelik", pos: "MID", role: "CM", num: 16, age: 22, ovr: 69, pot: 77, nat: "TR" },
    { n: "Emirhan Çavuş", pos: "MID", role: "CM", num: 17, age: 23, ovr: 67, pot: 72, nat: "TR" },
    { n: "Ianis Hagi", pos: "MID", role: "AM", num: 18, age: 27, ovr: 76, pot: 76, nat: "RO" },
    { n: "İbrahim Kaya", pos: "MID", role: "AM", num: 19, age: 25, ovr: 72, pot: 73, nat: "TR" },
    { n: "Ui-jo Hwang", pos: "MID", role: "AM", num: 20, age: 33, ovr: 70, pot: 70, nat: "KR" },
    // FWD
    { n: "Ruan", pos: "FWD", role: "LW", num: 21, age: 21, ovr: 68, pot: 76, nat: "BR" },
    { n: "Şahin Dik", pos: "FWD", role: "LW", num: 22, age: 22, ovr: 69, pot: 77, nat: "TR" },
    { n: "Veysel Ünal", pos: "FWD", role: "RW", num: 23, age: 25, ovr: 71, pot: 72, nat: "TR" },
    { n: "Batuhan Yavuz", pos: "FWD", role: "RW", num: 24, age: 21, ovr: 69, pot: 76, nat: "TR" },
    { n: "Meschack Elia", pos: "FWD", role: "ST", num: 25, age: 29, ovr: 72, pot: 72, nat: "CD" },
    { n: "Omar Ben Ali", pos: "FWD", role: "ST", num: 26, age: 21, ovr: 69, pot: 75, nat: "TN" },
  ],
);

const KON_PACK = pack(
  { id: "kon", name: "Konyaspor", short: "KON", city: "Konya", color: "#16a34a", color2: "#ffffff" },
  [
    // GK
    { n: "Bahadır Güngördü", pos: "GK", role: "GK", num: 13, age: 30, ovr: 71, pot: 71, nat: "TR" },
    { n: "Deniz Ertaş", pos: "GK", role: "GK", num: 1, age: 21, ovr: 65, pot: 71, nat: "TR" },
    { n: "Egemen Aydın", pos: "GK", role: "GK", num: 29, age: 19, ovr: 62, pot: 73, nat: "TR" },
    // DEF
    { n: "Adil Demirbağ", pos: "DEF", role: "CB", num: 4, age: 28, ovr: 69, pot: 69, nat: "TR" },
    { n: "Chidozie Awaziem", pos: "DEF", role: "CB", num: 15, age: 29, ovr: 74, pot: 74, nat: "NG" },
    { n: "Uğurcan Yazğılı", pos: "DEF", role: "CB", num: 5, age: 27, ovr: 72, pot: 74, nat: "TR" },
    { n: "Rayyan Baniya", pos: "DEF", role: "CB", num: 22, age: 27, ovr: 69, pot: 70, nat: "TR" },
    { n: "Utku Eriş", pos: "DEF", role: "CB", num: 37, age: 20, ovr: 63, pot: 73, nat: "TR" },
    { n: "Da Mata", pos: "DEF", role: "CB", num: 41, age: 20, ovr: 62, pot: 73, nat: "BR" },
    { n: "Arthur Masuaku", pos: "DEF", role: "LB", num: 3, age: 32, ovr: 75, pot: 75, nat: "CD" },
    { n: "Arif Boşluk", pos: "DEF", role: "LB", num: 23, age: 23, ovr: 67, pot: 72, nat: "TR" },
    { n: "Yhoan Andzouana", pos: "DEF", role: "RB", num: 8, age: 29, ovr: 70, pot: 70, nat: "CG" },
    // MID
    { n: "Marko Jevtovic", pos: "MID", role: "CDM", num: 77, age: 33, ovr: 68, pot: 68, nat: "RS" },
    { n: "Melih İbrahimoğlu", pos: "MID", role: "CM", num: 10, age: 26, ovr: 69, pot: 71, nat: "TR" },
    { n: "Enis Bardhi", pos: "MID", role: "AM", num: 17, age: 31, ovr: 75, pot: 75, nat: "MK" },
    { n: "Diogo Gonçalves", pos: "MID", role: "LW", num: 19, age: 29, ovr: 74, pot: 74, nat: "PT" },
    { n: "Ebrima Colley", pos: "MID", role: "LW", num: 45, age: 26, ovr: 71, pot: 73, nat: "GM" },
    { n: "Emir Bars", pos: "MID", role: "LW", num: 9, age: 21, ovr: 67, pot: 73, nat: "TR" },
    // FWD
    { n: "Deniz Türüç", pos: "FWD", role: "RW", num: 40, age: 33, ovr: 67, pot: 67, nat: "TR" },
    { n: "Jackson Muleka", pos: "FWD", role: "ST", num: 99, age: 26, ovr: 73, pot: 74, nat: "CD" },
    { n: "Blaz Kramer", pos: "FWD", role: "ST", num: 2, age: 30, ovr: 70, pot: 70, nat: "SI" },
  ],
);

const KSM_PACK = pack(
  { id: "ksm", name: "Kasımpaşa", short: "KSM", city: "İstanbul", color: "#1d4ed8", color2: "#ffffff" },
  [
    // GK
    { n: "Andreas Gianniotis", pos: "GK", role: "GK", num: 1, age: 33, ovr: 70, pot: 70, nat: "GR" },
    { n: "Ali Emre Yanar", pos: "GK", role: "GK", num: 25, age: 28, ovr: 70, pot: 70, nat: "TR" },
    { n: "Ramazan Özkanlı", pos: "GK", role: "GK", num: 89, age: 23, ovr: 71, pot: 75, nat: "TR" },
    // DEF
    { n: "Adem Arous", pos: "DEF", role: "CB", num: 4, age: 22, ovr: 68, pot: 76, nat: "TN" },
    { n: "Matei Ilie", pos: "DEF", role: "CB", num: 5, age: 23, ovr: 70, pot: 74, nat: "RO" },
    { n: "Taylan Aydın", pos: "DEF", role: "CB", num: 29, age: 20, ovr: 66, pot: 76, nat: "TR" },
    { n: "Ahmet Taha Dağbaşı", pos: "DEF", role: "CB", num: 30, age: 21, ovr: 66, pot: 73, nat: "TR" },
    { n: "Godfried Frimpong", pos: "DEF", role: "LB", num: 6, age: 27, ovr: 70, pot: 72, nat: "NL" },
    { n: "Jakob Jessen", pos: "DEF", role: "LB", num: 3, age: 22, ovr: 66, pot: 74, nat: "DK" },
    { n: "Cláudio Winck", pos: "DEF", role: "RB", num: 2, age: 32, ovr: 69, pot: 69, nat: "BR" },
    { n: "Kamil Ahmet Çörekçi", pos: "DEF", role: "RB", num: 22, age: 34, ovr: 70, pot: 70, nat: "TR" },
    { n: "Ayberk Karapo", pos: "DEF", role: "RB", num: 20, age: 22, ovr: 66, pot: 73, nat: "TR" },
    // MID
    { n: "Andri Fannar Baldursson", pos: "MID", role: "CDM", num: 16, age: 24, ovr: 69, pot: 72, nat: "IS" },
    { n: "Elson Mendes", pos: "MID", role: "CDM", num: 28, age: 20, ovr: 65, pot: 75, nat: "CV" },
    { n: "Atakan Müjde", pos: "MID", role: "CDM", num: 27, age: 22, ovr: 69, pot: 75, nat: "TR" },
    { n: "Kerem Demirbay", pos: "MID", role: "CM", num: 26, age: 33, ovr: 76, pot: 76, nat: "DE" },
    { n: "Haris Hajradinovic", pos: "MID", role: "AM", num: 10, age: 32, ovr: 68, pot: 68, nat: "BA" },
    { n: "Mortadha Ben Ouanes", pos: "MID", role: "LW", num: 12, age: 32, ovr: 71, pot: 71, nat: "TN" },
    // FWD
    { n: "Thiemoko Diarra", pos: "FWD", role: "LW", num: 13, age: 23, ovr: 67, pot: 70, nat: "ML" },
    { n: "Ali Yavuz Kol", pos: "FWD", role: "LW", num: 11, age: 25, ovr: 71, pot: 72, nat: "TR" },
    { n: "Fousseni Diabaté", pos: "FWD", role: "RW", num: 34, age: 30, ovr: 71, pot: 71, nat: "ML" },
    { n: "Mamadou Fall", pos: "FWD", role: "RW", num: 7, age: 34, ovr: 69, pot: 69, nat: "SN" },
    { n: "Adrian Benedyczak", pos: "FWD", role: "ST", num: 9, age: 25, ovr: 71, pot: 72, nat: "PL" },
    { n: "Güven Yalçın", pos: "FWD", role: "ST", num: 19, age: 27, ovr: 69, pot: 69, nat: "TR" },
    { n: "Yusuf Barası", pos: "FWD", role: "ST", num: 8, age: 23, ovr: 71, pot: 75, nat: "TR" },
  ],
);

const GFK_PACK = pack(
  { id: "gfk", name: "Gaziantep FK", short: "GFK", city: "Gaziantep", color: "#dc2626", color2: "#111114" },
  [
    // GK
    { n: "Kacper Tobiasz", pos: "GK", role: "GK", num: 1, age: 23, ovr: 70, pot: 75, nat: "PL" },
    { n: "İbrahim Kağan Alkış", pos: "GK", role: "GK", num: 2, age: 20, ovr: 66, pot: 77, nat: "TR" },
    { n: "Cemilhan Aslan", pos: "GK", role: "GK", num: 3, age: 18, ovr: 62, pot: 74, nat: "TR" },
    // DEF
    { n: "Arda Kızıldağ", pos: "DEF", role: "CB", num: 4, age: 27, ovr: 70, pot: 70, nat: "TR" },
    { n: "Myenty Abena", pos: "DEF", role: "CB", num: 5, age: 31, ovr: 70, pot: 70, nat: "SR" },
    { n: "Nazım Sangaré", pos: "DEF", role: "CB", num: 6, age: 32, ovr: 69, pot: 69, nat: "TR" },
    { n: "Florin Ștefan", pos: "DEF", role: "LB", num: 7, age: 30, ovr: 69, pot: 69, nat: "RO" },
    { n: "Kerim Calhanoglu", pos: "DEF", role: "LB", num: 8, age: 23, ovr: 67, pot: 70, nat: "DE" },
    { n: "Deian Sorescu", pos: "DEF", role: "RB", num: 9, age: 28, ovr: 73, pot: 73, nat: "RO" },
    { n: "Luis Pérez", pos: "DEF", role: "RB", num: 10, age: 31, ovr: 68, pot: 68, nat: "ES" },
    { n: "Sabahattin Destici", pos: "DEF", role: "RB", num: 11, age: 26, ovr: 72, pot: 74, nat: "TR" },
    // MID
    { n: "Ulrich Meleke", pos: "MID", role: "CDM", num: 12, age: 27, ovr: 71, pot: 71, nat: "CI" },
    { n: "Ogün Özçiçek", pos: "MID", role: "CDM", num: 13, age: 27, ovr: 70, pot: 72, nat: "TR" },
    { n: "Drissa Camara", pos: "MID", role: "CM", num: 14, age: 24, ovr: 70, pot: 74, nat: "CI" },
    { n: "Juninho Bacuna", pos: "MID", role: "CM", num: 15, age: 29, ovr: 73, pot: 73, nat: "CW" },
    { n: "Karamba Gassama", pos: "MID", role: "CM", num: 16, age: 21, ovr: 65, pot: 72, nat: "GM" },
    { n: "Kacper Kozłowski", pos: "MID", role: "AM", num: 17, age: 22, ovr: 67, pot: 73, nat: "PL" },
    { n: "Victor Gidado", pos: "MID", role: "AM", num: 18, age: 22, ovr: 66, pot: 72, nat: "NG" },
    { n: "Alexandru Maxim", pos: "MID", role: "AM", num: 19, age: 36, ovr: 73, pot: 73, nat: "RO" },
    // FWD
    { n: "Mirza Cihan", pos: "FWD", role: "LW", num: 20, age: 25, ovr: 69, pot: 70, nat: "TR" },
    { n: "Enver Kulasin", pos: "FWD", role: "RW", num: 21, age: 22, ovr: 68, pot: 75, nat: "BA" },
    { n: "Ali Mevran Ablak", pos: "FWD", role: "RW", num: 22, age: 23, ovr: 69, pot: 74, nat: "TR" },
    { n: "Trivante Stewart", pos: "FWD", role: "ST", num: 23, age: 26, ovr: 69, pot: 70, nat: "JM" },
    { n: "Serdar Dursun", pos: "FWD", role: "ST", num: 24, age: 34, ovr: 69, pot: 69, nat: "TR" },
    { n: "Fuat Bavuk", pos: "FWD", role: "ST", num: 25, age: 26, ovr: 70, pot: 72, nat: "TR" },
  ],
);

const KOC_PACK = pack(
  { id: "koc", name: "Kocaelispor", short: "KOC", city: "Kocaeli", color: "#16a34a", color2: "#111114" },
  [
    // GK
    { n: "Aleksandar Jovanovic", pos: "GK", role: "GK", num: 2, age: 33, ovr: 67, pot: 67, nat: "RS" },
    { n: "Onurcan Piri", pos: "GK", role: "GK", num: 3, age: 31, ovr: 69, pot: 69, nat: "TR" },
    { n: "Serhat Öztaşdelen", pos: "GK", role: "GK", num: 4, age: 21, ovr: 65, pot: 73, nat: "TR" },
    // DEF
    { n: "Anfernee Dijksteel", pos: "DEF", role: "CB", num: 5, age: 29, ovr: 69, pot: 69, nat: "SR" },
    { n: "Tanguy Zoukrou", pos: "DEF", role: "CB", num: 6, age: 23, ovr: 69, pot: 72, nat: "FR" },
    { n: "Emir Ortakaya", pos: "DEF", role: "CB", num: 7, age: 22, ovr: 65, pot: 71, nat: "TR" },
    { n: "Onur Öztonga", pos: "DEF", role: "CB", num: 8, age: 26, ovr: 72, pot: 72, nat: "TR" },
    { n: "Mikdat Çil", pos: "DEF", role: "CB", num: 9, age: 20, ovr: 62, pot: 73, nat: "TR" },
    { n: "Massadio Haïdara", pos: "DEF", role: "LB", num: 10, age: 33, ovr: 68, pot: 68, nat: "ML" },
    { n: "Muharrem Cinan", pos: "DEF", role: "LB", num: 11, age: 28, ovr: 72, pot: 72, nat: "TR" },
    { n: "Uğur Kaan Yıldız", pos: "DEF", role: "RB", num: 12, age: 24, ovr: 67, pot: 70, nat: "TR" },
    // MID
    { n: "Show", pos: "MID", role: "CDM", num: 13, age: 27, ovr: 69, pot: 70, nat: "AO" },
    { n: "Mahamadou Susoho", pos: "MID", role: "CDM", num: 14, age: 21, ovr: 69, pot: 77, nat: "ES" },
    { n: "Berkan Kutlu", pos: "MID", role: "CM", num: 15, age: 28, ovr: 71, pot: 71, nat: "TR" },
    { n: "Habib Keïta", pos: "MID", role: "CM", num: 16, age: 24, ovr: 69, pot: 73, nat: "ML" },
    { n: "Tayfur Bingöl", pos: "MID", role: "CM", num: 17, age: 33, ovr: 66, pot: 66, nat: "TR" },
    { n: "Samet Yalçın", pos: "MID", role: "CM", num: 18, age: 32, ovr: 72, pot: 72, nat: "TR" },
    // FWD
    { n: "Rigoberto Rivas", pos: "FWD", role: "LW", num: 19, age: 28, ovr: 70, pot: 70, nat: "HN" },
    { n: "Makana Baku", pos: "FWD", role: "LW", num: 20, age: 28, ovr: 73, pot: 73, nat: "DE" },
    { n: "Dan Agyei", pos: "FWD", role: "RW", num: 21, age: 29, ovr: 69, pot: 69, nat: "GH" },
    { n: "Bedirhan Yıldız", pos: "FWD", role: "RW", num: 22, age: 21, ovr: 68, pot: 76, nat: "TR" },
    { n: "Bruno Petkovic", pos: "FWD", role: "ST", num: 23, age: 31, ovr: 75, pot: 75, nat: "HR" },
    { n: "Metehan Altunbaş", pos: "FWD", role: "ST", num: 24, age: 23, ovr: 68, pot: 72, nat: "TR" },
    { n: "Arda Özyar", pos: "FWD", role: "ST", num: 25, age: 19, ovr: 65, pot: 75, nat: "TR" },
  ],
);

const EYP_PACK = pack(
  { id: "eyp", name: "Eyüpspor", short: "EYP", city: "İstanbul", color: "#7c3aed", color2: "#facc15" },
  [
    // GK
    { n: "Horațiu Moldovan", pos: "GK", role: "GK", num: 2, age: 28, ovr: 75, pot: 75, nat: "RO" },
    { n: "Umut Keseci", pos: "GK", role: "GK", num: 3, age: 22, ovr: 67, pot: 75, nat: "TR" },
    // DEF
    { n: "Jawad El Yamiq", pos: "DEF", role: "CB", num: 4, age: 34, ovr: 74, pot: 74, nat: "MA" },
    { n: "Anıl Yaşar", pos: "DEF", role: "CB", num: 5, age: 24, ovr: 67, pot: 70, nat: "TR" },
    { n: "Zak Jules", pos: "DEF", role: "CB", num: 6, age: 29, ovr: 71, pot: 71, nat: "SC" },
    { n: "Gilbert Mendy", pos: "DEF", role: "CB", num: 7, age: 21, ovr: 69, pot: 75, nat: "SN" },
    { n: "Berhan Kutlay Şatlı", pos: "DEF", role: "CB", num: 8, age: 20, ovr: 62, pot: 71, nat: "TR" },
    { n: "Arda Yavuz", pos: "DEF", role: "LB", num: 9, age: 20, ovr: 64, pot: 74, nat: "TR" },
    { n: "Calegari", pos: "DEF", role: "RB", num: 10, age: 24, ovr: 68, pot: 71, nat: "BR" },
    { n: "Talha Ülvan", pos: "DEF", role: "RB", num: 11, age: 25, ovr: 69, pot: 71, nat: "TR" },
    // MID
    { n: "Chandrel Massanga", pos: "MID", role: "CDM", num: 12, age: 26, ovr: 69, pot: 69, nat: "CG" },
    { n: "Taşkın İlter", pos: "MID", role: "CDM", num: 13, age: 32, ovr: 70, pot: 70, nat: "TR" },
    { n: "Charles-André Raux-Yao", pos: "MID", role: "CM", num: 14, age: 24, ovr: 67, pot: 70, nat: "FR" },
    { n: "Hamza Akman", pos: "MID", role: "CM", num: 15, age: 21, ovr: 67, pot: 73, nat: "TR" },
    { n: "Erdem Çalık", pos: "MID", role: "CM", num: 16, age: 20, ovr: 66, pot: 77, nat: "TR" },
    { n: "Abdelhamid Sabiri", pos: "MID", role: "AM", num: 17, age: 29, ovr: 75, pot: 75, nat: "MA" },
    { n: "David Costa", pos: "MID", role: "AM", num: 18, age: 22, ovr: 68, pot: 76, nat: "PT" },
    // FWD
    { n: "Konrad Michalak", pos: "FWD", role: "LW", num: 19, age: 28, ovr: 73, pot: 73, nat: "PL" },
    { n: "Lenny Pintor", pos: "FWD", role: "LW", num: 20, age: 26, ovr: 69, pot: 70, nat: "FR" },
    { n: "Bilal Boutobba", pos: "FWD", role: "RW", num: 21, age: 27, ovr: 70, pot: 70, nat: "FR" },
    { n: "Mete Demir", pos: "FWD", role: "RW", num: 22, age: 28, ovr: 69, pot: 69, nat: "TR" },
    { n: "Berkay Kumlu", pos: "FWD", role: "RW", num: 23, age: 21, ovr: 66, pot: 74, nat: "TR" },
    { n: "Ahmed Abdullahi", pos: "FWD", role: "ST", num: 24, age: 22, ovr: 66, pot: 72, nat: "NG" },
    { n: "Abdou Khadre Sy", pos: "FWD", role: "ST", num: 25, age: 18, ovr: 64, pot: 77, nat: "SN" },
  ],
);

const GBR_PACK = pack(
  { id: "gbr", name: "Gençlerbirliği", short: "GBR", city: "Ankara", color: "#dc2626", color2: "#111114" },
  [
    // GK
    { n: "Gökhan Akkan", pos: "GK", role: "GK", num: 2, age: 31, ovr: 69, pot: 69, nat: "TR" },
    { n: "Berk Deniz Çukurcu", pos: "GK", role: "GK", num: 3, age: 18, ovr: 62, pot: 74, nat: "TR" },
    // DEF
    { n: "Dimitrios Goutas", pos: "DEF", role: "CB", num: 4, age: 32, ovr: 74, pot: 74, nat: "GR" },
    { n: "Thalisson", pos: "DEF", role: "CB", num: 5, age: 28, ovr: 69, pot: 69, nat: "BR" },
    { n: "Zan Zuzek", pos: "DEF", role: "CB", num: 6, age: 29, ovr: 69, pot: 69, nat: "SI" },
    { n: "Ensar Çavuşoğlu", pos: "DEF", role: "CB", num: 7, age: 24, ovr: 67, pot: 70, nat: "TR" },
    { n: "Arda Çağan Çelik", pos: "DEF", role: "CB", num: 8, age: 21, ovr: 66, pot: 72, nat: "TR" },
    { n: "Kévin Rodrigues", pos: "DEF", role: "LB", num: 9, age: 32, ovr: 72, pot: 72, nat: "PT" },
    { n: "Abdurrahim Dursun", pos: "DEF", role: "LB", num: 10, age: 27, ovr: 69, pot: 69, nat: "TR" },
    { n: "Pedro Pereira", pos: "DEF", role: "RB", num: 11, age: 28, ovr: 70, pot: 70, nat: "PT" },
    { n: "Fıratcan Üzüm", pos: "DEF", role: "RB", num: 12, age: 27, ovr: 70, pot: 71, nat: "TR" },
    { n: "Berat Can Sebat", pos: "DEF", role: "RB", num: 13, age: 22, ovr: 68, pot: 74, nat: "TR" },
    // MID
    { n: "Moussa Kyabou", pos: "MID", role: "CDM", num: 14, age: 28, ovr: 72, pot: 72, nat: "ML" },
    { n: "Peter Etebo", pos: "MID", role: "CDM", num: 15, age: 30, ovr: 74, pot: 74, nat: "NG" },
    { n: "Ousmane Diabate", pos: "MID", role: "CDM", num: 16, age: 18, ovr: 60, pot: 72, nat: "GN" },
    { n: "Franco Tongya", pos: "MID", role: "CM", num: 17, age: 24, ovr: 71, pot: 76, nat: "IT" },
    { n: "Oğulcan Ülgün", pos: "MID", role: "CM", num: 18, age: 28, ovr: 71, pot: 71, nat: "TR" },
    { n: "Ensar Kemaloğlu", pos: "MID", role: "CM", num: 19, age: 27, ovr: 72, pot: 72, nat: "TR" },
    { n: "Göktuğ Erdem", pos: "MID", role: "CM", num: 20, age: 22, ovr: 69, pot: 75, nat: "TR" },
    // FWD
    { n: "Adama Traoré", pos: "FWD", role: "RW", num: 21, age: 31, ovr: 76, pot: 76, nat: "ML" },
    { n: "Dilhan Demir", pos: "FWD", role: "RW", num: 22, age: 23, ovr: 68, pot: 73, nat: "DE" },
    { n: "Sékou Koïta", pos: "FWD", role: "ST", num: 23, age: 26, ovr: 74, pot: 76, nat: "ML" },
    { n: "Arda Akgül", pos: "FWD", role: "ST", num: 24, age: 21, ovr: 67, pot: 75, nat: "TR" },
  ],
);

const COR_PACK = pack(
  { id: "cor", name: "Çorum FK", short: "COR", city: "Çorum", color: "#dc2626", color2: "#111114" },
  [
    // GK
    { n: "Marcos Felipe", pos: "GK", role: "GK", num: 2, age: 30, ovr: 68, pot: 68, nat: "BR" },
    { n: "Erhan Erentürk", pos: "GK", role: "GK", num: 3, age: 31, ovr: 71, pot: 71, nat: "TR" },
    { n: "Arif Şimşir", pos: "GK", role: "GK", num: 4, age: 21, ovr: 67, pot: 74, nat: "TR" },
    // DEF
    { n: "Alexandre Penetra", pos: "DEF", role: "CB", num: 5, age: 24, ovr: 67, pot: 70, nat: "PT" },
    { n: "Hrvoje Smolcic", pos: "DEF", role: "CB", num: 6, age: 25, ovr: 72, pot: 74, nat: "HR" },
    { n: "Serdar Saatçı", pos: "DEF", role: "CB", num: 7, age: 23, ovr: 68, pot: 71, nat: "TR" },
    { n: "Arda Şengül", pos: "DEF", role: "CB", num: 8, age: 27, ovr: 73, pot: 74, nat: "TR" },
    { n: "Sinan Osmanoğlu", pos: "DEF", role: "CB", num: 9, age: 36, ovr: 70, pot: 70, nat: "TR" },
    { n: "Andrei Borza", pos: "DEF", role: "LB", num: 10, age: 20, ovr: 64, pot: 75, nat: "RO" },
    { n: "Cemali Sertel", pos: "DEF", role: "LB", num: 11, age: 26, ovr: 69, pot: 69, nat: "TR" },
    { n: "Gökhan Sazdağı", pos: "DEF", role: "RB", num: 12, age: 31, ovr: 69, pot: 69, nat: "TR" },
    { n: "Hüseyin Bulut", pos: "DEF", role: "RB", num: 13, age: 27, ovr: 71, pot: 73, nat: "TR" },
    // MID
    { n: "Berat Özdemir", pos: "MID", role: "CDM", num: 14, age: 28, ovr: 72, pot: 72, nat: "TR" },
    { n: "Ylber Ramadani", pos: "MID", role: "CDM", num: 15, age: 30, ovr: 74, pot: 74, nat: "AL" },
    { n: "Mohamed Diomandé", pos: "MID", role: "CM", num: 16, age: 24, ovr: 74, pot: 78, nat: "CI" },
    { n: "Markus Karlsbakk", pos: "MID", role: "CM", num: 17, age: 26, ovr: 72, pot: 74, nat: "NO" },
    { n: "Atakan Akkaynak", pos: "MID", role: "CM", num: 18, age: 27, ovr: 72, pot: 74, nat: "TR" },
    { n: "Ahmed Ildız", pos: "MID", role: "CM", num: 19, age: 29, ovr: 69, pot: 69, nat: "TR" },
    { n: "Kenan Fakılı", pos: "MID", role: "AM", num: 20, age: 23, ovr: 69, pot: 74, nat: "TR" },
    // FWD
    { n: "Alexandros Kyziridis", pos: "FWD", role: "LW", num: 21, age: 25, ovr: 72, pot: 74, nat: "GR" },
    { n: "Emircan Gürlük", pos: "FWD", role: "LW", num: 22, age: 22, ovr: 69, pot: 76, nat: "TR" },
    { n: "Burak Çoban", pos: "FWD", role: "LW", num: 23, age: 31, ovr: 70, pot: 70, nat: "TR" },
    { n: "Hasan Abdulkareem", pos: "FWD", role: "RW", num: 24, age: 27, ovr: 69, pot: 70, nat: "IQ" },
    { n: "Semih Akyıldız", pos: "FWD", role: "RW", num: 25, age: 25, ovr: 70, pot: 71, nat: "TR" },
    { n: "Jesús Ramírez", pos: "FWD", role: "ST", num: 26, age: 28, ovr: 73, pot: 73, nat: "VE" },
    { n: "Mame Thiam", pos: "FWD", role: "ST", num: 27, age: 33, ovr: 66, pot: 66, nat: "SN" },
  ],
);

const AMD_PACK = pack(
  { id: "amd", name: "Amed SK", short: "AMD", city: "Diyarbakır", color: "#16a34a", color2: "#dc2626" },
  [
    // GK
    { n: "Alban Lafont", pos: "GK", role: "GK", num: 2, age: 27, ovr: 77, pot: 77, nat: "CI" },
    { n: "Burak Bozan", pos: "GK", role: "GK", num: 3, age: 25, ovr: 73, pot: 75, nat: "TR" },
    { n: "Abdulsamed Damlu", pos: "GK", role: "GK", num: 4, age: 27, ovr: 69, pot: 70, nat: "TR" },
    // DEF
    { n: "David Bates", pos: "DEF", role: "CB", num: 5, age: 29, ovr: 69, pot: 69, nat: "SC" },
    { n: "Lumbardh Dellova", pos: "DEF", role: "CB", num: 6, age: 27, ovr: 69, pot: 69, nat: "XK" },
    { n: "Mehmet Yeşil", pos: "DEF", role: "CB", num: 7, age: 28, ovr: 70, pot: 70, nat: "TR" },
    { n: "Amadou Cissé", pos: "DEF", role: "CB", num: 8, age: 20, ovr: 63, pot: 72, nat: "GN" },
    { n: "Miraç Acer", pos: "DEF", role: "CB", num: 9, age: 30, ovr: 71, pot: 71, nat: "TR" },
    { n: "Kahraman Demirtaş", pos: "DEF", role: "CB", num: 10, age: 32, ovr: 68, pot: 68, nat: "TR" },
    { n: "Umut Meraş", pos: "DEF", role: "LB", num: 11, age: 30, ovr: 69, pot: 69, nat: "TR" },
    { n: "Celal Hanalp", pos: "DEF", role: "RB", num: 12, age: 30, ovr: 70, pot: 70, nat: "TR" },
    { n: "Emrullah Ertuş", pos: "DEF", role: "RB", num: 13, age: 25, ovr: 69, pot: 70, nat: "TR" },
    // MID
    { n: "Gökhan Gül", pos: "MID", role: "CDM", num: 14, age: 28, ovr: 72, pot: 72, nat: "DE" },
    { n: "Rayan Raveloson", pos: "MID", role: "CDM", num: 15, age: 29, ovr: 70, pot: 70, nat: "MG" },
    { n: "Cem Üstündag", pos: "MID", role: "CM", num: 16, age: 25, ovr: 71, pot: 71, nat: "AT" },
    { n: "Furkan Soyalp", pos: "MID", role: "CM", num: 17, age: 31, ovr: 71, pot: 71, nat: "TR" },
    { n: "Rayan Lutin", pos: "MID", role: "AM", num: 18, age: 23, ovr: 68, pot: 73, nat: "KM" },
    { n: "Dia Saba", pos: "MID", role: "AM", num: 19, age: 33, ovr: 66, pot: 66, nat: "IL" },
    { n: "Çekdar Orhan", pos: "MID", role: "AM", num: 20, age: 28, ovr: 73, pot: 73, nat: "TR" },
    // FWD
    { n: "Yira Sor", pos: "FWD", role: "LW", num: 21, age: 26, ovr: 73, pot: 75, nat: "NG" },
    { n: "Ermal Krasniqi", pos: "FWD", role: "LW", num: 22, age: 27, ovr: 72, pot: 73, nat: "XK" },
    { n: "Mohamed Khalil", pos: "FWD", role: "LW", num: 23, age: 25, ovr: 72, pot: 72, nat: "SY" },
    { n: "Samuel Ballet", pos: "FWD", role: "RW", num: 24, age: 25, ovr: 73, pot: 75, nat: "CH" },
    { n: "Cıvan Süer", pos: "FWD", role: "RW", num: 25, age: 20, ovr: 62, pot: 72, nat: "TR" },
    { n: "Gift Orban", pos: "FWD", role: "ST", num: 26, age: 24, ovr: 76, pot: 81, nat: "NG" },
    { n: "Mbaye Diagne", pos: "FWD", role: "ST", num: 27, age: 34, ovr: 74, pot: 74, nat: "SN" },
  ],
);

const ERZ_PACK = pack(
  { id: "erz", name: "Erzurumspor FK", short: "ERZ", city: "Erzurum", color: "#1d4ed8", color2: "#ffffff" },
  [
    // GK
    { n: "Matija Orbanic", pos: "GK", role: "GK", num: 2, age: 26, ovr: 70, pot: 70, nat: "HR" },
    { n: "Ertuğrul Taşkıran", pos: "GK", role: "GK", num: 3, age: 36, ovr: 66, pot: 66, nat: "TR" },
    { n: "Erkan Anapa", pos: "GK", role: "GK", num: 4, age: 28, ovr: 72, pot: 72, nat: "TR" },
    // DEF
    { n: "Yakup Kırtay", pos: "DEF", role: "CB", num: 5, age: 23, ovr: 70, pot: 75, nat: "TR" },
    { n: "Nihad Mujakic", pos: "DEF", role: "CB", num: 6, age: 28, ovr: 72, pot: 72, nat: "BA" },
    { n: "Amar Gerxhaliu", pos: "DEF", role: "CB", num: 7, age: 24, ovr: 70, pot: 75, nat: "XK" },
    { n: "Emre Erdem", pos: "DEF", role: "CB", num: 8, age: 24, ovr: 67, pot: 70, nat: "TR" },
    { n: "Enes Yiğit", pos: "DEF", role: "CB", num: 9, age: 23, ovr: 67, pot: 72, nat: "TR" },
    { n: "Yiğit Baran Karaoğlan", pos: "DEF", role: "CB", num: 10, age: 20, ovr: 64, pot: 74, nat: "TR" },
    { n: "Guram Giorbelidze", pos: "DEF", role: "LB", num: 11, age: 30, ovr: 70, pot: 70, nat: "GE" },
    { n: "Cengizhan Bayrak", pos: "DEF", role: "LB", num: 12, age: 26, ovr: 69, pot: 70, nat: "TR" },
    { n: "Festy Ebosele", pos: "DEF", role: "RB", num: 13, age: 24, ovr: 73, pot: 76, nat: "IE" },
    { n: "Orhan Ovacıklı", pos: "DEF", role: "RB", num: 14, age: 37, ovr: 70, pot: 70, nat: "TR" },
    // MID
    { n: "Brandon Baiye", pos: "MID", role: "CDM", num: 15, age: 25, ovr: 71, pot: 71, nat: "BE" },
    { n: "Sefa Akgün", pos: "MID", role: "CM", num: 16, age: 26, ovr: 73, pot: 74, nat: "TR" },
    { n: "Murat Cem Akpınar", pos: "MID", role: "CM", num: 17, age: 27, ovr: 71, pot: 73, nat: "TR" },
    { n: "Enes Karakaş", pos: "MID", role: "CM", num: 18, age: 23, ovr: 71, pot: 74, nat: "TR" },
    { n: "Eren Özdemir", pos: "MID", role: "CM", num: 19, age: 23, ovr: 69, pot: 72, nat: "TR" },
    { n: "Mert Önal", pos: "MID", role: "CM", num: 20, age: 22, ovr: 67, pot: 75, nat: "TR" },
    { n: "Martín Rodríguez", pos: "MID", role: "AM", num: 21, age: 32, ovr: 70, pot: 70, nat: "CL" },
    // FWD
    { n: "Mustafa Fettahoğlu", pos: "FWD", role: "LW", num: 22, age: 25, ovr: 71, pot: 71, nat: "TR" },
    { n: "Fernando Andrade", pos: "FWD", role: "LW", num: 23, age: 33, ovr: 68, pot: 68, nat: "BR" },
    { n: "Gyrano Kerk", pos: "FWD", role: "RW", num: 24, age: 30, ovr: 73, pot: 73, nat: "SR" },
    { n: "Nariman Akhundzada", pos: "FWD", role: "ST", num: 25, age: 22, ovr: 66, pot: 72, nat: "AZ" },
    { n: "İlkan Sever", pos: "FWD", role: "ST", num: 26, age: 21, ovr: 65, pot: 72, nat: "TR" },
    { n: "Eren Tozlu", pos: "FWD", role: "ST", num: 27, age: 35, ovr: 66, pot: 66, nat: "TR" },
  ],
);

/** Every Süper Lig club, in rough order of strength. */
export const SQUAD_PACKS: SquadPack[] = [
  FB_PACK,
  GS_PACK,
  BJK_PACK,
  TS_PACK,
  BFK_PACK,
  SAM_PACK,
  GZT_PACK,
  RZ_PACK,
  ALN_PACK,
  KON_PACK,
  KSM_PACK,
  GFK_PACK,
  KOC_PACK,
  EYP_PACK,
  GBR_PACK,
  COR_PACK,
  AMD_PACK,
  ERZ_PACK,
];

/**
 * The pack the landing-page mock squad is built from. Kept as a named export
 * so lib/mock-data.ts does not depend on array ordering.
 */
export const USER_PACK: SquadPack = SQUAD_PACKS[0];
