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
  /** Market value in EUR — consumed by create-league/seed as p.val. */
  val: number;
  /**
   * Weekly wage in EUR. DEAD FIELD — wages were removed from the game (see
   * lib/economy.ts). It is still emitted by the generator and still present in
   * the seed rows below; nothing reads it. Left in place because this file is
   * generated and regenerating it to drop one unused number would rewrite
   * eleven thousand lines for no behavioural change.
   */
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
      status: s.status,
    })),
  };
}

const FB_PACK = pack(
  { id: "fb", name: "Fenerbahçe", short: "FB", city: "İstanbul", color: "#001a4b", color2: "#ffed00" },
  [
    // GK
    { n: "Ederson", pos: "GK", role: "GK", num: 31, age: 32, ovr: 85, pot: 85, nat: "BR", val: 23890148, wage: 119451 },
    { n: "İrfan Can Eğribayat", pos: "GK", role: "GK", num: 1, age: 28, ovr: 78, pot: 78, nat: "TR", val: 19309364, wage: 96547 },
    { n: "Mert Günok", pos: "GK", role: "GK", num: 34, age: 37, ovr: 76, pot: 76, nat: "TR", val: 1982131, wage: 12000 },
    // DEF
    { n: "Jayden Oosterwolde", pos: "DEF", role: "CB", num: 24, age: 25, ovr: 78, pot: 78, nat: "NL", val: 23171237, wage: 115856 },
    { n: "Nathan Aké", pos: "DEF", role: "CB", num: 15, age: 31, ovr: 83, pot: 83, nat: "NL", val: 18108952, wage: 90545 },
    { n: "Milan Škriniar", pos: "DEF", role: "CB", num: 37, age: 31, ovr: 83, pot: 83, nat: "SK", val: 18108952, wage: 90545 },
    { n: "Çağlar Söyüncü", pos: "DEF", role: "CB", num: 4, age: 30, ovr: 78, pot: 78, nat: "TR", val: 13902742, wage: 69514 },
    { n: "Rodrigo Becão", pos: "DEF", role: "CB", num: 50, age: 30, ovr: 77, pot: 77, nat: "BR", val: 11558606, wage: 57793 },
    { n: "Yiğit Efe Demir", pos: "DEF", role: "CB", num: 14, age: 22, ovr: 74, pot: 82, nat: "TR", val: 13576617, wage: 67883 },
    { n: "Archie Brown", pos: "DEF", role: "LB", num: 3, age: 24, ovr: 76, pot: 80, nat: "EN", val: 16998752, wage: 84994 },
    { n: "Levent Mercan", pos: "DEF", role: "LB", num: 22, age: 25, ovr: 80, pot: 80, nat: "TR", val: 32655993, wage: 163280 },
    { n: "Mert Müldür", pos: "DEF", role: "RB", num: 18, age: 27, ovr: 76, pot: 78, nat: "TR", val: 13399203, wage: 66996 },
    { n: "Nélson Semedo", pos: "DEF", role: "RB", num: 27, age: 32, ovr: 79, pot: 79, nat: "PT", val: 9667156, wage: 48336 },
    // MID
    { n: "İsmail Yüksek", pos: "MID", role: "CDM", num: 5, age: 27, ovr: 76, pot: 78, nat: "TR", val: 13399203, wage: 66996 },
    { n: "N'Golo Kanté", pos: "MID", role: "CDM", num: 91, age: 35, ovr: 82, pot: 82, nat: "FR", val: 5583567, wage: 27918 },
    { n: "Bartuğ Elmaz", pos: "MID", role: "CDM", num: 28, age: 23, ovr: 78, pot: 81, nat: "TR", val: 26453829, wage: 132269 },
    { n: "Mattéo Guendouzi", pos: "MID", role: "CM", num: 6, age: 27, ovr: 82, pot: 84, nat: "FR", val: 37744912, wage: 188725 },
    { n: "Fred", pos: "MID", role: "CM", num: 7, age: 33, ovr: 79, pot: 79, nat: "BR", val: 5984430, wage: 29922 },
    { n: "Marco Asensio", pos: "MID", role: "AM", num: 10, age: 30, ovr: 83, pot: 83, nat: "ES", val: 31043917, wage: 155220 },
    { n: "Talisca", pos: "MID", role: "AM", num: 94, age: 32, ovr: 82, pot: 82, nat: "BR", val: 15633987, wage: 78170 },
    { n: "Mert Hakan Yandaş", pos: "MID", role: "AM", num: 8, age: 31, ovr: 79, pot: 79, nat: "TR", val: 9667156, wage: 48336 },
    // FWD
    { n: "Kerem Aktürkoğlu", pos: "FWD", role: "LW", num: 9, age: 27, ovr: 82, pot: 84, nat: "TR", val: 37744912, wage: 188725 },
    { n: "Anthony Musaba", pos: "FWD", role: "LW", num: 20, age: 25, ovr: 80, pot: 81, nat: "NL", val: 33243800, wage: 166219 },
    { n: "Mason Greenwood", pos: "FWD", role: "RW", num: 11, age: 24, ovr: 84, pot: 89, nat: "EN", val: 64948898, wage: 324744 },
    { n: "Dorgeles Nene", pos: "FWD", role: "RW", num: 45, age: 23, ovr: 76, pot: 80, nat: "ML", val: 18632028, wage: 93160 },
    { n: "Cengiz Ünder", pos: "FWD", role: "RW", num: 23, age: 29, ovr: 78, pot: 78, nat: "TR", val: 13902742, wage: 69514 },
    { n: "İrfan Can Kahveci", pos: "FWD", role: "RW", num: 17, age: 31, ovr: 77, pot: 77, nat: "TR", val: 6742520, wage: 33713 },
    { n: "Romelu Lukaku", pos: "FWD", role: "ST", num: 2, age: 33, ovr: 84, pot: 84, nat: "BE", val: 12910331, wage: 64552 },
    { n: "Vedat Muriqi", pos: "FWD", role: "ST", num: 19, age: 32, ovr: 79, pot: 79, nat: "XK", val: 9667156, wage: 48336 },
    { n: "Sidiki Chérif", pos: "FWD", role: "ST", num: 26, age: 19, ovr: 69, pot: 80, nat: "GN", val: 3858448, wage: 19292 },
  ],
);

const GS_PACK = pack(
  { id: "gs", name: "Galatasaray", short: "GS", city: "İstanbul", color: "#a90432", color2: "#fdb912" },
  [
    // GK
    { n: "Uğurcan Çakır", pos: "GK", role: "GK", num: 1, age: 30, ovr: 82, pot: 82, nat: "TR", val: 26801121, wage: 134006 },
    { n: "Günay Güvenç", pos: "GK", role: "GK", num: 19, age: 35, ovr: 73, pot: 73, nat: "TR", val: 1028205, wage: 12000 },
    { n: "Jankat Yılmaz", pos: "GK", role: "GK", num: 24, age: 21, ovr: 74, pot: 80, nat: "TR", val: 12884815, wage: 64424 },
    // DEF
    { n: "Davinson Sánchez", pos: "DEF", role: "CB", num: 6, age: 30, ovr: 80, pot: 80, nat: "CO", val: 19593596, wage: 97968 },
    { n: "Abdülkerim Bardakcı", pos: "DEF", role: "CB", num: 42, age: 31, ovr: 78, pot: 78, nat: "TR", val: 8109933, wage: 40550 },
    { n: "Victor Nelsson", pos: "DEF", role: "CB", num: 2, age: 27, ovr: 78, pot: 79, nat: "DK", val: 19444530, wage: 97223 },
    { n: "Kaan Ayhan", pos: "DEF", role: "CB", num: 23, age: 31, ovr: 77, pot: 77, nat: "TR", val: 6742520, wage: 33713 },
    { n: "Metehan Baltacı", pos: "DEF", role: "CB", num: 3, age: 23, ovr: 76, pot: 79, nat: "TR", val: 18103460, wage: 90517 },
    { n: "Arda Ünyay", pos: "DEF", role: "CB", num: 91, age: 19, ovr: 69, pot: 80, nat: "TR", val: 3858448, wage: 19292 },
    { n: "Ismail Jakobs", pos: "DEF", role: "LB", num: 4, age: 26, ovr: 77, pot: 78, nat: "SN", val: 19611101, wage: 98056 },
    { n: "Eren Elmalı", pos: "DEF", role: "LB", num: 17, age: 26, ovr: 76, pot: 77, nat: "TR", val: 16142472, wage: 80712 },
    { n: "Wilfried Singo", pos: "DEF", role: "RB", num: 9, age: 25, ovr: 81, pot: 81, nat: "CI", val: 38323172, wage: 191616 },
    { n: "Roland Sallai", pos: "DEF", role: "RB", num: 7, age: 29, ovr: 78, pot: 78, nat: "HU", val: 13902742, wage: 69514 },
    { n: "Elias Jelert", pos: "DEF", role: "RB", num: 12, age: 23, ovr: 75, pot: 79, nat: "DK", val: 15166844, wage: 75834 },
    // MID
    { n: "Lesley Ugochukwu", pos: "MID", role: "CDM", num: 18, age: 22, ovr: 77, pot: 85, nat: "FR", val: 25204182, wage: 126021 },
    { n: "Lucas Torreira", pos: "MID", role: "CDM", num: 34, age: 30, ovr: 81, pot: 81, nat: "UY", val: 22993903, wage: 114970 },
    { n: "Mario Lemina", pos: "MID", role: "CDM", num: 99, age: 32, ovr: 79, pot: 79, nat: "GA", val: 9667156, wage: 48336 },
    { n: "Eyüp Aydın", pos: "MID", role: "CDM", num: 5, age: 22, ovr: 72, pot: 79, nat: "TR", val: 8181112, wage: 40906 },
    { n: "Gabriel Sara", pos: "MID", role: "CM", num: 8, age: 27, ovr: 80, pot: 81, nat: "BR", val: 27403820, wage: 137019 },
    { n: "İlkay Gündoğan", pos: "MID", role: "CM", num: 20, age: 35, ovr: 83, pot: 83, nat: "DE", val: 6467483, wage: 32337 },
    { n: "Renato Nhaga", pos: "MID", role: "CM", num: 74, age: 19, ovr: 69, pot: 78, nat: "GW", val: 3626167, wage: 18131 },
    { n: "Siraçhan Nas", pos: "MID", role: "AM", num: 53, age: 24, ovr: 77, pot: 80, nat: "TR", val: 20304617, wage: 101523 },
    // FWD
    { n: "Barış Alper Yılmaz", pos: "FWD", role: "LW", num: 76, age: 26, ovr: 80, pot: 81, nat: "TR", val: 33243800, wage: 166219 },
    { n: "Leroy Sané", pos: "FWD", role: "RW", num: 10, age: 30, ovr: 85, pot: 85, nat: "DE", val: 40954539, wage: 204773 },
    { n: "Yunus Akgün", pos: "FWD", role: "RW", num: 11, age: 26, ovr: 78, pot: 80, nat: "TR", val: 24005402, wage: 120027 },
    { n: "Armando Güner", pos: "FWD", role: "RW", num: 27, age: 18, ovr: 71, pot: 84, nat: "AR", val: 6490607, wage: 32453 },
    { n: "Victor Osimhen", pos: "FWD", role: "ST", num: 13, age: 27, ovr: 87, pot: 88, nat: "NG", val: 74083630, wage: 370418 },
    { n: "Halil Dervişoğlu", pos: "FWD", role: "ST", num: 14, age: 26, ovr: 80, pot: 80, nat: "TR", val: 32655993, wage: 163280 },
    { n: "Yalın Dilek", pos: "FWD", role: "ST", num: 15, age: 20, ovr: 72, pot: 83, nat: "TR", val: 9193057, wage: 45965 },
  ],
);

const BJK_PACK = pack(
  { id: "bjk", name: "Beşiktaş", short: "BJK", city: "İstanbul", color: "#111114", color2: "#f4f5f7" },
  [
    // GK
    { n: "Alexander Nübel", pos: "GK", role: "GK", num: 1, age: 29, ovr: 82, pot: 82, nat: "DE", val: 26801121, wage: 134006 },
    { n: "Doğan Alemdar", pos: "GK", role: "GK", num: 80, age: 23, ovr: 72, pot: 76, nat: "TR", val: 7539456, wage: 37697 },
    { n: "Emre Bilgin", pos: "GK", role: "GK", num: 99, age: 22, ovr: 73, pot: 81, nat: "TR", val: 10761881, wage: 53809 },
    // DEF
    { n: "Emmanuel Agbadou", pos: "DEF", role: "CB", num: 12, age: 29, ovr: 79, pot: 79, nat: "CI", val: 16572268, wage: 82861 },
    { n: "Tiago Djaló", pos: "DEF", role: "CB", num: 35, age: 26, ovr: 77, pot: 78, nat: "PT", val: 19611101, wage: 98056 },
    { n: "Felix Uduokhai", pos: "DEF", role: "CB", num: 14, age: 28, ovr: 77, pot: 77, nat: "DE", val: 16053619, wage: 80268 },
    { n: "Emirhan Topçu", pos: "DEF", role: "CB", num: 53, age: 25, ovr: 78, pot: 78, nat: "TR", val: 23171237, wage: 115856 },
    { n: "Yasin Özcan", pos: "DEF", role: "CB", num: 58, age: 20, ovr: 67, pot: 77, nat: "TR", val: 1817184, wage: 12000 },
    { n: "Emrecan Uzunhan", pos: "DEF", role: "CB", num: 2, age: 25, ovr: 78, pot: 78, nat: "TR", val: 23171237, wage: 115856 },
    { n: "Kassoum Ouattara", pos: "DEF", role: "LB", num: 11, age: 21, ovr: 74, pot: 82, nat: "FR", val: 13576617, wage: 67883 },
    { n: "Rıdvan Yılmaz", pos: "DEF", role: "LB", num: 33, age: 25, ovr: 75, pot: 75, nat: "TR", val: 12907952, wage: 64540 },
    { n: "Amir Murillo", pos: "DEF", role: "RB", num: 62, age: 30, ovr: 77, pot: 77, nat: "TR", val: 11558606, wage: 57793 },
    { n: "Taylan Bulut", pos: "DEF", role: "RB", num: 22, age: 20, ovr: 67, pot: 77, nat: "DE", val: 1817184, wage: 12000 },
    // MID
    { n: "Wilfred Ndidi", pos: "MID", role: "CDM", num: 4, age: 29, ovr: 81, pot: 81, nat: "NG", val: 22993903, wage: 114970 },
    { n: "Moatasem Al-Musrati", pos: "MID", role: "CDM", num: 3, age: 30, ovr: 77, pot: 77, nat: "LY", val: 11558606, wage: 57793 },
    { n: "Amir Hadziahmetovic", pos: "MID", role: "CDM", num: 5, age: 29, ovr: 75, pot: 75, nat: "BA", val: 7744771, wage: 38724 },
    { n: "Salih Özcan", pos: "MID", role: "CDM", num: 6, age: 28, ovr: 77, pot: 77, nat: "TR", val: 16053619, wage: 80268 },
    { n: "Kartal Yılmaz", pos: "MID", role: "CDM", num: 8, age: 25, ovr: 77, pot: 79, nat: "TR", val: 19957859, wage: 99789 },
    { n: "Orkun Kökçü", pos: "MID", role: "CM", num: 10, age: 25, ovr: 82, pot: 83, nat: "TR", val: 45472568, wage: 227363 },
    { n: "Fahri Ay", pos: "MID", role: "CM", num: 68, age: 21, ovr: 74, pot: 80, nat: "TR", val: 12884815, wage: 64424 },
    { n: "Junior Olaitan", pos: "MID", role: "AM", num: 15, age: 24, ovr: 76, pot: 79, nat: "BJ", val: 16713325, wage: 83567 },
    { n: "João Mário", pos: "MID", role: "AM", num: 13, age: 33, ovr: 78, pot: 78, nat: "PT", val: 5020435, wage: 25102 },
    // FWD
    { n: "Leandro Trossard", pos: "FWD", role: "LW", num: 19, age: 31, ovr: 84, pot: 84, nat: "BE", val: 20855151, wage: 104276 },
    { n: "İlhan Fakılı", pos: "FWD", role: "LW", num: 29, age: 20, ovr: 71, pot: 81, nat: "TR", val: 6828446, wage: 34142 },
    { n: "Vaclav Cerny", pos: "FWD", role: "RW", num: 18, age: 28, ovr: 78, pot: 78, nat: "CZ", val: 19309364, wage: 96547 },
    { n: "Milot Rashica", pos: "FWD", role: "RW", num: 7, age: 30, ovr: 77, pot: 77, nat: "XK", val: 11558606, wage: 57793 },
    { n: "Dušan Vlahović", pos: "FWD", role: "ST", num: 28, age: 26, ovr: 84, pot: 85, nat: "RS", val: 60658696, wage: 303293 },
    { n: "Oh Hyeon-gyu", pos: "FWD", role: "ST", num: 9, age: 25, ovr: 76, pot: 76, nat: "KR", val: 15857045, wage: 79285 },
    { n: "Semih Kılıçsoy", pos: "FWD", role: "ST", num: 90, age: 20, ovr: 74, pot: 85, nat: "TR", val: 14867261, wage: 74336 },
    { n: "Mustafa Hekimoğlu", pos: "FWD", role: "ST", num: 23, age: 19, ovr: 67, pot: 78, nat: "TR", val: 1873579, wage: 12000 },
  ],
);

const TS_PACK = pack(
  { id: "ts", name: "Trabzonspor", short: "TS", city: "Trabzon", color: "#7a1b1f", color2: "#1e3a8a" },
  [
    // GK
    { n: "André Onana", pos: "GK", role: "GK", num: 24, age: 30, ovr: 81, pot: 81, nat: "CM", val: 22993903, wage: 114970 },
    { n: "Onuralp Çevikkan", pos: "GK", role: "GK", num: 25, age: 20, ovr: 68, pot: 78, nat: "TR", val: 2655375, wage: 13277 },
    { n: "Ahmet Yıldırım", pos: "GK", role: "GK", num: 1, age: 19, ovr: 70, pot: 81, nat: "TR", val: 5277783, wage: 26389 },
    // DEF
    { n: "Arseniy Batagov", pos: "DEF", role: "CB", num: 44, age: 24, ovr: 75, pot: 78, nat: "UA", val: 13604982, wage: 68025 },
    { n: "Chibuike Nwaiwu", pos: "DEF", role: "CB", num: 27, age: 23, ovr: 73, pot: 78, nat: "NG", val: 9939317, wage: 49697 },
    { n: "Cenk Özkacar", pos: "DEF", role: "CB", num: 39, age: 25, ovr: 74, pot: 74, nat: "TR", val: 10377032, wage: 51885 },
    { n: "Samet Akaydin", pos: "DEF", role: "CB", num: 4, age: 32, ovr: 75, pot: 75, nat: "TR", val: 4517783, wage: 22589 },
    { n: "Stefan Savic", pos: "DEF", role: "CB", num: 15, age: 35, ovr: 76, pot: 76, nat: "ME", val: 1982131, wage: 12000 },
    { n: "Sidny Lopes Cabral", pos: "DEF", role: "LB", num: 55, age: 23, ovr: 74, pot: 77, nat: "CV", val: 11847112, wage: 59236 },
    { n: "Mustafa Eskihellaç", pos: "DEF", role: "LB", num: 7, age: 29, ovr: 76, pot: 76, nat: "TR", val: 9514227, wage: 47571 },
    { n: "Wagner Pina", pos: "DEF", role: "RB", num: 20, age: 23, ovr: 76, pot: 79, nat: "CV", val: 18103460, wage: 90517 },
    // MID
    { n: "Batista Mendy", pos: "MID", role: "CDM", num: 2, age: 26, ovr: 76, pot: 78, nat: "FR", val: 16427899, wage: 82139 },
    { n: "John Lundstram", pos: "MID", role: "CDM", num: 3, age: 32, ovr: 76, pot: 76, nat: "EN", val: 5549966, wage: 27750 },
    { n: "Okay Yokuşlu", pos: "MID", role: "CDM", num: 5, age: 32, ovr: 76, pot: 76, nat: "TR", val: 5549966, wage: 27750 },
    { n: "Melih Kabasakal", pos: "MID", role: "CDM", num: 57, age: 30, ovr: 75, pot: 75, nat: "TR", val: 7744771, wage: 38724 },
    { n: "Tim Jabol-Folcarelli", pos: "MID", role: "CM", num: 26, age: 26, ovr: 78, pot: 78, nat: "FR", val: 23171237, wage: 115856 },
    { n: "Benjamin Bouchouari", pos: "MID", role: "CM", num: 8, age: 24, ovr: 75, pot: 80, nat: "MA", val: 14069668, wage: 70348 },
    { n: "Ruslan Malinovskyi", pos: "MID", role: "CM", num: 17, age: 33, ovr: 79, pot: 79, nat: "UA", val: 5984430, wage: 29922 },
    { n: "Ozan Tufam", pos: "MID", role: "CM", num: 11, age: 31, ovr: 73, pot: 73, nat: "TR", val: 2878974, wage: 14395 },
    { n: "Ernest Muci", pos: "MID", role: "AM", num: 10, age: 25, ovr: 77, pot: 79, nat: "AL", val: 19957859, wage: 99789 },
    { n: "Göktan Gürpüz", pos: "MID", role: "AM", num: 6, age: 23, ovr: 73, pot: 78, nat: "TR", val: 9939317, wage: 49697 },
    // FWD
    { n: "Aral Şimşir", pos: "FWD", role: "LW", num: 58, age: 24, ovr: 72, pot: 77, nat: "TR", val: 6994049, wage: 34970 },
    { n: "Noah Saviolo", pos: "FWD", role: "LW", num: 70, age: 22, ovr: 70, pot: 76, nat: "PT", val: 4574027, wage: 22870 },
    { n: "Metehan Mimaroğlu", pos: "FWD", role: "LW", num: 9, age: 32, ovr: 75, pot: 75, nat: "TR", val: 4517783, wage: 22589 },
    { n: "Mohamed Salah", pos: "FWD", role: "RW", num: 77, age: 34, ovr: 87, pot: 87, nat: "EG", val: 19127849, wage: 95639 },
    { n: "Cihan Çanak", pos: "FWD", role: "RW", num: 12, age: 21, ovr: 71, pot: 77, nat: "TR", val: 6101580, wage: 30508 },
    { n: "Paul Onuachu", pos: "FWD", role: "ST", num: 30, age: 32, ovr: 78, pot: 78, nat: "NG", val: 8109933, wage: 40550 },
    { n: "Denis Drăguș", pos: "FWD", role: "ST", num: 13, age: 27, ovr: 76, pot: 76, nat: "RO", val: 13214204, wage: 66071 },
    { n: "René Mitongo", pos: "FWD", role: "ST", num: 19, age: 18, ovr: 68, pot: 82, nat: "BE", val: 2595659, wage: 12978 },
    { n: "Umut Nayir", pos: "FWD", role: "ST", num: 14, age: 33, ovr: 72, pot: 72, nat: "TR", val: 1390254, wage: 12000 },
  ],
);

const BFK_PACK = pack(
  { id: "ibfk", name: "Başakşehir FK", short: "İBFK", city: "İstanbul", color: "#f97316", color2: "#1e3a8a" },
  [
    // GK
    { n: "Muhammed Şengezer", pos: "GK", role: "GK", num: 16, age: 29, ovr: 72, pot: 72, nat: "TR", val: 3849935, wage: 19250 },
    { n: "Volkan Babacan", pos: "GK", role: "GK", num: 1, age: 38, ovr: 72, pot: 72, nat: "TR", val: 802070, wage: 12000 },
    { n: "Deniz Dilmen", pos: "GK", role: "GK", num: 98, age: 21, ovr: 69, pot: 76, nat: "TR", val: 3433722, wage: 17169 },
    // DEF
    { n: "Jerome Opoku", pos: "DEF", role: "CB", num: 3, age: 27, ovr: 71, pot: 72, nat: "GH", val: 4123685, wage: 20618 },
    { n: "Ousseynou Ba", pos: "DEF", role: "CB", num: 27, age: 30, ovr: 73, pot: 73, nat: "SN", val: 4935385, wage: 24677 },
    { n: "Emin Bayram", pos: "DEF", role: "CB", num: 23, age: 23, ovr: 72, pot: 76, nat: "TR", val: 7539456, wage: 37697 },
    { n: "Hamza Güreler", pos: "DEF", role: "CB", num: 15, age: 20, ovr: 67, pot: 77, nat: "TR", val: 1817184, wage: 12000 },
    { n: "Francis Nzaba", pos: "DEF", role: "CB", num: 2, age: 23, ovr: 73, pot: 76, nat: "CG", val: 9390941, wage: 46955 },
    { n: "Christopher Operi", pos: "DEF", role: "LB", num: 21, age: 29, ovr: 71, pot: 71, nat: "CI", val: 2948415, wage: 14742 },
    { n: "Michal Karbownik", pos: "DEF", role: "LB", num: 33, age: 25, ovr: 75, pot: 77, nat: "PL", val: 13372639, wage: 66863 },
    { n: "Onur Bulut", pos: "DEF", role: "RB", num: 6, age: 32, ovr: 72, pot: 72, nat: "TR", val: 2245796, wage: 12000 },
    { n: "Ömer Ali Şahiner", pos: "DEF", role: "RB", num: 42, age: 34, ovr: 70, pot: 70, nat: "TR", val: 798152, wage: 12000 },
    // MID
    { n: "Jakub Kaluzinski", pos: "MID", role: "CDM", num: 18, age: 23, ovr: 73, pot: 76, nat: "PL", val: 9390941, wage: 46955 },
    { n: "Onur Ergün", pos: "MID", role: "CDM", num: 4, age: 33, ovr: 70, pot: 70, nat: "TR", val: 798152, wage: 12000 },
    { n: "Umut Güneş", pos: "MID", role: "CM", num: 20, age: 26, ovr: 74, pot: 74, nat: "TR", val: 10377032, wage: 51885 },
    { n: "Olivier Kemen", pos: "MID", role: "CM", num: 8, age: 30, ovr: 74, pot: 74, nat: "CM", val: 6226219, wage: 31131 },
    { n: "Berkay Özcan", pos: "MID", role: "CM", num: 5, age: 28, ovr: 72, pot: 72, nat: "TR", val: 5347132, wage: 26736 },
    { n: "Mohamed Hassan Fofana", pos: "MID", role: "CM", num: 17, age: 21, ovr: 69, pot: 77, nat: "CI", val: 3523492, wage: 17617 },
    { n: "Ömer Beyaz", pos: "MID", role: "AM", num: 22, age: 22, ovr: 71, pot: 79, nat: "TR", val: 6429182, wage: 32146 },
    // FWD
    { n: "Ivan Brnic", pos: "FWD", role: "LW", num: 77, age: 24, ovr: 73, pot: 77, nat: "HR", val: 8817888, wage: 44089 },
    { n: "Abbosbek Fayzullaev", pos: "FWD", role: "RW", num: 11, age: 22, ovr: 70, pot: 76, nat: "UZ", val: 4574027, wage: 22870 },
    { n: "Andreas Skov Olsen", pos: "FWD", role: "RW", num: 70, age: 26, ovr: 76, pot: 78, nat: "DK", val: 16427899, wage: 82139 },
    { n: "Edin Visca", pos: "FWD", role: "RW", num: 34, age: 36, ovr: 76, pot: 76, nat: "BA", val: 1982131, wage: 12000 },
    { n: "Eldor Shomurodov", pos: "FWD", role: "ST", num: 14, age: 31, ovr: 76, pot: 76, nat: "UZ", val: 5549966, wage: 27750 },
    { n: "Bertuğ Yıldırım", pos: "FWD", role: "ST", num: 91, age: 24, ovr: 71, pot: 74, nat: "TR", val: 5179382, wage: 25897 },
    { n: "Davie Selke", pos: "FWD", role: "ST", num: 7, age: 31, ovr: 73, pot: 73, nat: "DE", val: 2878974, wage: 14395 },
    { n: "Umut Bozok", pos: "FWD", role: "ST", num: 9, age: 29, ovr: 71, pot: 71, nat: "TR", val: 2948415, wage: 14742 },
  ],
);

const SAM_PACK = pack(
  { id: "sam", name: "Samsunspor", short: "SAM", city: "Samsun", color: "#dc2626", color2: "#ffffff" },
  [
    // GK
    { n: "Okan Kocuk", pos: "GK", role: "GK", num: 1, age: 31, ovr: 74, pot: 74, nat: "TR", val: 3631961, wage: 18160 },
    { n: "Bilal Bayazıt", pos: "GK", role: "GK", num: 2, age: 27, ovr: 71, pot: 72, nat: "TR", val: 4123685, wage: 20618 },
    { n: "Efe Berat Töruz", pos: "GK", role: "GK", num: 3, age: 19, ovr: 68, pot: 77, nat: "TR", val: 2572967, wage: 12865 },
    // DEF
    { n: "Gabriele Guarino", pos: "DEF", role: "CB", num: 4, age: 22, ovr: 67, pot: 75, nat: "IT", val: 1710932, wage: 12000 },
    { n: "Toni Borevković", pos: "DEF", role: "CB", num: 5, age: 29, ovr: 73, pot: 73, nat: "HR", val: 4935385, wage: 24677 },
    { n: "Igor Drapiński", pos: "DEF", role: "CB", num: 6, age: 22, ovr: 71, pot: 77, nat: "PL", val: 6101580, wage: 30508 },
    { n: "Yunus Emre Çift", pos: "DEF", role: "CB", num: 7, age: 22, ovr: 71, pot: 79, nat: "TR", val: 6429182, wage: 32146 },
    { n: "Bedirhan Çetin", pos: "DEF", role: "CB", num: 8, age: 20, ovr: 65, pot: 75, nat: "TR", val: 735324, wage: 12000 },
    { n: "Logi Tómasson", pos: "DEF", role: "LB", num: 9, age: 25, ovr: 75, pot: 77, nat: "IS", val: 13372639, wage: 66863 },
    { n: "Enes Albak", pos: "DEF", role: "LB", num: 10, age: 21, ovr: 70, pot: 78, nat: "TR", val: 4819613, wage: 24098 },
    { n: "Joe Mendes", pos: "DEF", role: "RB", num: 11, age: 23, ovr: 72, pot: 75, nat: "SE", val: 7325571, wage: 36628 },
    { n: "Mustafa Tan", pos: "DEF", role: "RB", num: 12, age: 21, ovr: 69, pot: 76, nat: "TR", val: 3433722, wage: 17169 },
    // MID
    { n: "Antoine Makoumbou", pos: "MID", role: "CDM", num: 13, age: 28, ovr: 75, pot: 75, nat: "CG", val: 10756627, wage: 53783 },
    { n: "Elliot Watt", pos: "MID", role: "CDM", num: 14, age: 26, ovr: 73, pot: 74, nat: "SC", val: 8373703, wage: 41869 },
    { n: "Antoine Sekongo", pos: "MID", role: "CM", num: 15, age: 22, ovr: 68, pot: 75, nat: "ML", val: 2436416, wage: 12182 },
    { n: "Yalçın Kayan", pos: "MID", role: "CM", num: 16, age: 27, ovr: 73, pot: 74, nat: "TR", val: 6902684, wage: 34513 },
    { n: "Celil Yüksel", pos: "MID", role: "CM", num: 17, age: 28, ovr: 72, pot: 72, nat: "TR", val: 5347132, wage: 26736 },
    { n: "Samed Onur", pos: "MID", role: "CM", num: 18, age: 24, ovr: 72, pot: 76, nat: "TR", val: 6878551, wage: 34393 },
    { n: "Afonso Sousa", pos: "MID", role: "AM", num: 19, age: 26, ovr: 71, pot: 72, nat: "PT", val: 5002477, wage: 25012 },
    // FWD
    { n: "Jaurès Assoumou", pos: "FWD", role: "LW", num: 20, age: 23, ovr: 72, pot: 77, nat: "CI", val: 7753342, wage: 38767 },
    { n: "Emre Kılınç", pos: "FWD", role: "LW", num: 21, age: 31, ovr: 72, pot: 72, nat: "TR", val: 2245796, wage: 12000 },
    { n: "Arbnor Muja", pos: "FWD", role: "RW", num: 22, age: 27, ovr: 74, pot: 74, nat: "AL", val: 8647527, wage: 43238 },
    { n: "Elayis Tavsan", pos: "FWD", role: "RW", num: 23, age: 25, ovr: 74, pot: 76, nat: "TR", val: 10750606, wage: 53753 },
    { n: "Tanguy Coulibaly", pos: "FWD", role: "RW", num: 24, age: 25, ovr: 75, pot: 75, nat: "FR", val: 12907952, wage: 64540 },
    { n: "Marius Mouandilmadji", pos: "FWD", role: "ST", num: 25, age: 28, ovr: 73, pot: 73, nat: "TD", val: 6854701, wage: 34274 },
    { n: "Cherif Ndiaye", pos: "FWD", role: "ST", num: 26, age: 30, ovr: 72, pot: 72, nat: "SN", val: 3849935, wage: 19250 },
    { n: "Fatih Kaya", pos: "FWD", role: "ST", num: 27, age: 26, ovr: 73, pot: 74, nat: "TR", val: 8373703, wage: 41869 },
    { n: "Richie Omorowa", pos: "FWD", role: "ST", num: 28, age: 22, ovr: 68, pot: 76, nat: "SE", val: 2500113, wage: 12501 },
  ],
);

const GZT_PACK = pack(
  { id: "gzt", name: "Göztepe", short: "GZT", city: "İzmir", color: "#facc15", color2: "#dc2626" },
  [
    // GK
    { n: "Luka Gugeshashvili", pos: "GK", role: "GK", num: 25, age: 27, ovr: 71, pot: 72, nat: "GE", val: 4123685, wage: 20618 },
    { n: "Arda Özçimen", pos: "GK", role: "GK", num: 1, age: 24, ovr: 72, pot: 77, nat: "TR", val: 6994049, wage: 34970 },
    { n: "Şamil Öztürk", pos: "GK", role: "GK", num: 33, age: 21, ovr: 71, pot: 79, nat: "TR", val: 6429182, wage: 32146 },
    // DEF
    { n: "Malcom Bokele", pos: "DEF", role: "CB", num: 26, age: 26, ovr: 75, pot: 77, nat: "CM", val: 13372639, wage: 66863 },
    { n: "Taha Altıkardeş", pos: "DEF", role: "CB", num: 4, age: 22, ovr: 68, pot: 76, nat: "TR", val: 2500113, wage: 12501 },
    { n: "Furkan Bayır", pos: "DEF", role: "CB", num: 23, age: 26, ovr: 75, pot: 75, nat: "TR", val: 12907952, wage: 64540 },
    { n: "Noah Sonko Sundberg", pos: "DEF", role: "RB", num: 19, age: 30, ovr: 72, pot: 72, nat: "GM", val: 3849935, wage: 19250 },
    { n: "Allan Godói", pos: "DEF", role: "CB", num: 3, age: 33, ovr: 72, pot: 72, nat: "BR", val: 1390254, wage: 12000 },
    { n: "Ege Yıldırım", pos: "DEF", role: "LB", num: 13, age: 19, ovr: 65, pot: 75, nat: "TR", val: 735324, wage: 12000 },
    // MID
    { n: "Anthony Dennis", pos: "MID", role: "CDM", num: 30, age: 22, ovr: 69, pot: 75, nat: "NG", val: 3343951, wage: 16720 },
    { n: "Novatus Miroshi", pos: "MID", role: "CDM", num: 20, age: 23, ovr: 69, pot: 72, nat: "TZ", val: 3074640, wage: 15373 },
    { n: "Musah Mohammed", pos: "MID", role: "CDM", num: 5, age: 24, ovr: 71, pot: 76, nat: "GH", val: 5356287, wage: 26781 },
    { n: "Rhaldney", pos: "MID", role: "CM", num: 12, age: 27, ovr: 71, pot: 73, nat: "BR", val: 4152351, wage: 20762 },
    { n: "Alex Matos", pos: "MID", role: "CM", num: 6, age: 21, ovr: 68, pot: 76, nat: "EN", val: 2500113, wage: 12501 },
    { n: "Arda Okan Kurtulan", pos: "MID", role: "RW", num: 2, age: 23, ovr: 69, pot: 74, nat: "TR", val: 3254181, wage: 16271 },
    { n: "Ogün Bayrak", pos: "MID", role: "RW", num: 16, age: 27, ovr: 74, pot: 74, nat: "TR", val: 8647527, wage: 43238 },
    { n: "Amin Cherni", pos: "MID", role: "LW", num: 15, age: 25, ovr: 75, pot: 77, nat: "TN", val: 13372639, wage: 66863 },
    { n: "Alexis Antunes", pos: "MID", role: "AM", num: 8, age: 26, ovr: 75, pot: 75, nat: "CH", val: 12907952, wage: 64540 },
    { n: "Efkan Bekiroğlu", pos: "MID", role: "AM", num: 10, age: 30, ovr: 72, pot: 72, nat: "TR", val: 3849935, wage: 19250 },
    // FWD
    { n: "Juan", pos: "FWD", role: "ST", num: 9, age: 24, ovr: 72, pot: 75, nat: "BR", val: 6763053, wage: 33815 },
    { n: "Janderson", pos: "FWD", role: "ST", num: 39, age: 27, ovr: 72, pot: 74, nat: "BR", val: 5421992, wage: 27110 },
    { n: "André Henrique", pos: "FWD", role: "ST", num: 7, age: 24, ovr: 69, pot: 73, nat: "BR", val: 2887019, wage: 14435 },
    { n: "Sinclair Armstrong", pos: "FWD", role: "ST", num: 22, age: 23, ovr: 71, pot: 75, nat: "IE", val: 5773979, wage: 28870 },
    { n: "Guilherme Luiz", pos: "FWD", role: "ST", num: 11, age: 21, ovr: 71, pot: 78, nat: "BR", val: 6265381, wage: 31327 },
    { n: "Gökdeniz Bayrakdar", pos: "FWD", role: "ST", num: 17, age: 24, ovr: 69, pot: 72, nat: "TR", val: 2838543, wage: 14193 },
  ],
);

const RZ_PACK = pack(
  { id: "riz", name: "Çaykur Rizespor", short: "RİZ", city: "Rize", color: "#16a34a", color2: "#1d4ed8" },
  [
    // GK
    { n: "Yahia Fofana", pos: "GK", role: "GK", num: 2, age: 25, ovr: 73, pot: 75, nat: "CI", val: 8521764, wage: 42609 },
    { n: "Zafer Görgen", pos: "GK", role: "GK", num: 3, age: 26, ovr: 71, pot: 72, nat: "TR", val: 5002477, wage: 25012 },
    { n: "Efe Doğan", pos: "GK", role: "GK", num: 4, age: 21, ovr: 69, pot: 75, nat: "TR", val: 3343951, wage: 16720 },
    // DEF
    { n: "Siaka Bakayoko", pos: "DEF", role: "CB", num: 5, age: 21, ovr: 66, pot: 72, nat: "FR", val: 1062601, wage: 12000 },
    { n: "Attila Mocsi", pos: "DEF", role: "CB", num: 6, age: 26, ovr: 71, pot: 71, nat: "HU", val: 4914024, wage: 24570 },
    { n: "Modibo Sagnan", pos: "DEF", role: "CB", num: 7, age: 27, ovr: 69, pot: 71, nat: "ML", val: 2275682, wage: 12000 },
    { n: "Tayyip Talha Sanuç", pos: "DEF", role: "CB", num: 8, age: 26, ovr: 71, pot: 71, nat: "TR", val: 4914024, wage: 24570 },
    { n: "Khusniddin Alikulov", pos: "DEF", role: "CB", num: 9, age: 27, ovr: 70, pot: 70, nat: "UZ", val: 3069817, wage: 15349 },
    { n: "Hüseyincan Kırıkcı", pos: "DEF", role: "CB", num: 10, age: 22, ovr: 67, pot: 73, nat: "TR", val: 1623750, wage: 12000 },
    { n: "Zakaria Ariss", pos: "DEF", role: "LB", num: 11, age: 22, ovr: 66, pot: 72, nat: "MA", val: 1062601, wage: 12000 },
    { n: "Umut Erdem", pos: "DEF", role: "LB", num: 12, age: 22, ovr: 67, pot: 73, nat: "TR", val: 1623750, wage: 12000 },
    { n: "Taha Şahin", pos: "DEF", role: "RB", num: 13, age: 25, ovr: 71, pot: 73, nat: "TR", val: 5090929, wage: 25455 },
    { n: "Mithat Pala", pos: "DEF", role: "RB", num: 14, age: 25, ovr: 73, pot: 74, nat: "TR", val: 8373703, wage: 41869 },
    // MID
    { n: "Taylan Antalyalı", pos: "MID", role: "CDM", num: 15, age: 31, ovr: 68, pot: 68, nat: "TR", val: 668820, wage: 12000 },
    { n: "Qazim Laci", pos: "MID", role: "CM", num: 16, age: 30, ovr: 71, pot: 71, nat: "AL", val: 2948415, wage: 14742 },
    { n: "Ibrahim Olawoyin", pos: "MID", role: "CM", num: 17, age: 28, ovr: 73, pot: 73, nat: "NG", val: 6854701, wage: 34274 },
    { n: "Dal Varesanovic", pos: "MID", role: "AM", num: 18, age: 25, ovr: 71, pot: 72, nat: "BA", val: 5002477, wage: 25012 },
    { n: "Eren Emre Aydın", pos: "MID", role: "AM", num: 19, age: 21, ovr: 69, pot: 75, nat: "TR", val: 3343951, wage: 16720 },
    { n: "Valentin Mihăilă", pos: "MID", role: "LW", num: 20, age: 26, ovr: 75, pot: 75, nat: "RO", val: 12907952, wage: 64540 },
    // FWD
    { n: "Ahmed Kutucu", pos: "FWD", role: "LW", num: 21, age: 26, ovr: 70, pot: 72, nat: "TR", val: 3816396, wage: 19082 },
    { n: "Emrecan Bulut", pos: "FWD", role: "LW", num: 22, age: 23, ovr: 69, pot: 73, nat: "TR", val: 3164410, wage: 15822 },
    { n: "Adedire Mebude", pos: "FWD", role: "RW", num: 23, age: 22, ovr: 67, pot: 73, nat: "SC", val: 1623750, wage: 12000 },
    { n: "Mame Mor Faye", pos: "FWD", role: "RW", num: 24, age: 21, ovr: 69, pot: 76, nat: "SN", val: 3433722, wage: 17169 },
    { n: "Ali Sowe", pos: "FWD", role: "ST", num: 25, age: 32, ovr: 68, pot: 68, nat: "GM", val: 668820, wage: 12000 },
  ],
);

const ALN_PACK = pack(
  { id: "aln", name: "Alanyaspor", short: "ALN", city: "Alanya", color: "#f97316", color2: "#16a34a" },
  [
    // GK
    { n: "Yusuf Karagöz", pos: "GK", role: "GK", num: 2, age: 26, ovr: 71, pot: 72, nat: "TR", val: 5002477, wage: 25012 },
    { n: "Mert Bayram", pos: "GK", role: "GK", num: 3, age: 21, ovr: 65, pot: 72, nat: "TR", val: 674690, wage: 12000 },
    { n: "Paulo Victor", pos: "GK", role: "GK", num: 4, age: 39, ovr: 68, pot: 68, nat: "BR", val: 300000, wage: 12000 },
    // DEF
    { n: "Ümit Akdağ", pos: "DEF", role: "CB", num: 5, age: 22, ovr: 68, pot: 75, nat: "RO", val: 2436416, wage: 12182 },
    { n: "Nuno Lima", pos: "DEF", role: "CB", num: 6, age: 25, ovr: 72, pot: 72, nat: "PT", val: 6416559, wage: 32083 },
    { n: "Fatih Aksoy", pos: "DEF", role: "CB", num: 7, age: 28, ovr: 70, pot: 70, nat: "TR", val: 3069817, wage: 15349 },
    { n: "Fidan Aliti", pos: "DEF", role: "CB", num: 8, age: 32, ovr: 71, pot: 71, nat: "XK", val: 1719909, wage: 12000 },
    { n: "Bedirhan Özyurt", pos: "DEF", role: "CB", num: 9, age: 23, ovr: 70, pot: 75, nat: "TR", val: 4451235, wage: 22256 },
    { n: "Florent Hadergjonaj", pos: "DEF", role: "RB", num: 10, age: 32, ovr: 69, pot: 69, nat: "XK", val: 942590, wage: 12000 },
    { n: "Enes Keskin", pos: "DEF", role: "RB", num: 11, age: 25, ovr: 73, pot: 74, nat: "TR", val: 8373703, wage: 41869 },
    { n: "Yusuf Özdemir", pos: "DEF", role: "LB", num: 12, age: 25, ovr: 72, pot: 72, nat: "TR", val: 6416559, wage: 32083 },
    // MID
    { n: "Maestro", pos: "MID", role: "CDM", num: 13, age: 23, ovr: 68, pot: 71, nat: "AO", val: 2181627, wage: 12000 },
    { n: "Gaius Makouta", pos: "MID", role: "CDM", num: 14, age: 29, ovr: 73, pot: 73, nat: "CG", val: 4935385, wage: 24677 },
    { n: "Baran Gezek", pos: "MID", role: "CDM", num: 15, age: 20, ovr: 63, pot: 73, nat: "TR", val: 300000, wage: 12000 },
    { n: "İzzet Çelik", pos: "MID", role: "CM", num: 16, age: 22, ovr: 69, pot: 77, nat: "TR", val: 3523492, wage: 17617 },
    { n: "Emirhan Çavuş", pos: "MID", role: "CM", num: 17, age: 23, ovr: 67, pot: 72, nat: "TR", val: 1580160, wage: 12000 },
    { n: "Ianis Hagi", pos: "MID", role: "AM", num: 18, age: 27, ovr: 76, pot: 76, nat: "RO", val: 13214204, wage: 66071 },
    { n: "İbrahim Kaya", pos: "MID", role: "AM", num: 19, age: 25, ovr: 72, pot: 73, nat: "TR", val: 6532057, wage: 32660 },
    { n: "Ui-jo Hwang", pos: "MID", role: "AM", num: 20, age: 33, ovr: 70, pot: 70, nat: "KR", val: 798152, wage: 12000 },
    // FWD
    { n: "Ruan", pos: "FWD", role: "LW", num: 21, age: 21, ovr: 68, pot: 76, nat: "BR", val: 2500113, wage: 12501 },
    { n: "Şahin Dik", pos: "FWD", role: "LW", num: 22, age: 22, ovr: 69, pot: 77, nat: "TR", val: 3523492, wage: 17617 },
    { n: "Veysel Ünal", pos: "FWD", role: "RW", num: 23, age: 25, ovr: 71, pot: 72, nat: "TR", val: 5002477, wage: 25012 },
    { n: "Batuhan Yavuz", pos: "FWD", role: "RW", num: 24, age: 21, ovr: 69, pot: 76, nat: "TR", val: 3433722, wage: 17169 },
    { n: "Meschack Elia", pos: "FWD", role: "ST", num: 25, age: 29, ovr: 72, pot: 72, nat: "CD", val: 3849935, wage: 19250 },
    { n: "Omar Ben Ali", pos: "FWD", role: "ST", num: 26, age: 21, ovr: 69, pot: 75, nat: "TN", val: 3343951, wage: 16720 },
  ],
);

const KON_PACK = pack(
  { id: "kon", name: "Konyaspor", short: "KON", city: "Konya", color: "#16a34a", color2: "#ffffff" },
  [
    // GK
    { n: "Bahadır Güngördü", pos: "GK", role: "GK", num: 13, age: 30, ovr: 71, pot: 71, nat: "TR", val: 2948415, wage: 14742 },
    { n: "Deniz Ertaş", pos: "GK", role: "GK", num: 1, age: 21, ovr: 65, pot: 71, nat: "TR", val: 657051, wage: 12000 },
    { n: "Egemen Aydın", pos: "GK", role: "GK", num: 29, age: 19, ovr: 62, pot: 73, nat: "TR", val: 300000, wage: 12000 },
    // DEF
    { n: "Adil Demirbağ", pos: "DEF", role: "CB", num: 4, age: 28, ovr: 69, pot: 69, nat: "TR", val: 2244263, wage: 12000 },
    { n: "Chidozie Awaziem", pos: "DEF", role: "CB", num: 15, age: 29, ovr: 74, pot: 74, nat: "NG", val: 6226219, wage: 31131 },
    { n: "Uğurcan Yazğılı", pos: "DEF", role: "CB", num: 5, age: 27, ovr: 72, pot: 74, nat: "TR", val: 5421992, wage: 27110 },
    { n: "Rayyan Baniya", pos: "DEF", role: "CB", num: 22, age: 27, ovr: 69, pot: 70, nat: "TR", val: 2259972, wage: 12000 },
    { n: "Utku Eriş", pos: "DEF", role: "CB", num: 37, age: 20, ovr: 63, pot: 73, nat: "TR", val: 300000, wage: 12000 },
    { n: "Da Mata", pos: "DEF", role: "CB", num: 41, age: 20, ovr: 62, pot: 73, nat: "BR", val: 300000, wage: 12000 },
    { n: "Arthur Masuaku", pos: "DEF", role: "LB", num: 3, age: 32, ovr: 75, pot: 75, nat: "CD", val: 4517783, wage: 22589 },
    { n: "Arif Boşluk", pos: "DEF", role: "LB", num: 23, age: 23, ovr: 67, pot: 72, nat: "TR", val: 1580160, wage: 12000 },
    { n: "Yhoan Andzouana", pos: "DEF", role: "RB", num: 8, age: 29, ovr: 70, pot: 70, nat: "CG", val: 2210268, wage: 12000 },
    // MID
    { n: "Marko Jevtovic", pos: "MID", role: "CDM", num: 77, age: 33, ovr: 68, pot: 68, nat: "RS", val: 414031, wage: 12000 },
    { n: "Melih İbrahimoğlu", pos: "MID", role: "CM", num: 10, age: 26, ovr: 69, pot: 71, nat: "TR", val: 2790067, wage: 13950 },
    { n: "Enis Bardhi", pos: "MID", role: "AM", num: 17, age: 31, ovr: 75, pot: 75, nat: "MK", val: 4517783, wage: 22589 },
    { n: "Diogo Gonçalves", pos: "MID", role: "LW", num: 19, age: 29, ovr: 74, pot: 74, nat: "PT", val: 6226219, wage: 31131 },
    { n: "Ebrima Colley", pos: "MID", role: "LW", num: 45, age: 26, ovr: 71, pot: 73, nat: "GM", val: 5090929, wage: 25455 },
    { n: "Emir Bars", pos: "MID", role: "LW", num: 9, age: 21, ovr: 67, pot: 73, nat: "TR", val: 1623750, wage: 12000 },
    // FWD
    { n: "Deniz Türüç", pos: "FWD", role: "RW", num: 40, age: 33, ovr: 67, pot: 67, nat: "TR", val: 300000, wage: 12000 },
    { n: "Jackson Muleka", pos: "FWD", role: "ST", num: 99, age: 26, ovr: 73, pot: 74, nat: "CD", val: 8373703, wage: 41869 },
    { n: "Blaz Kramer", pos: "FWD", role: "ST", num: 2, age: 30, ovr: 70, pot: 70, nat: "SI", val: 2210268, wage: 12000 },
  ],
);

const KSM_PACK = pack(
  { id: "ksm", name: "Kasımpaşa", short: "KSM", city: "İstanbul", color: "#1d4ed8", color2: "#ffffff" },
  [
    // GK
    { n: "Andreas Gianniotis", pos: "GK", role: "GK", num: 1, age: 33, ovr: 70, pot: 70, nat: "GR", val: 798152, wage: 12000 },
    { n: "Ali Emre Yanar", pos: "GK", role: "GK", num: 25, age: 28, ovr: 70, pot: 70, nat: "TR", val: 3069817, wage: 15349 },
    { n: "Ramazan Özkanlı", pos: "GK", role: "GK", num: 89, age: 23, ovr: 71, pot: 75, nat: "TR", val: 5773979, wage: 28870 },
    // DEF
    { n: "Adem Arous", pos: "DEF", role: "CB", num: 4, age: 22, ovr: 68, pot: 76, nat: "TN", val: 2500113, wage: 12501 },
    { n: "Matei Ilie", pos: "DEF", role: "CB", num: 5, age: 23, ovr: 70, pot: 74, nat: "RO", val: 4328442, wage: 21642 },
    { n: "Taylan Aydın", pos: "DEF", role: "CB", num: 29, age: 20, ovr: 66, pot: 76, nat: "TR", val: 1189186, wage: 12000 },
    { n: "Ahmet Taha Dağbaşı", pos: "DEF", role: "CB", num: 30, age: 21, ovr: 66, pot: 73, nat: "TR", val: 1091127, wage: 12000 },
    { n: "Godfried Frimpong", pos: "DEF", role: "LB", num: 6, age: 27, ovr: 70, pot: 72, nat: "NL", val: 3112794, wage: 15564 },
    { n: "Jakob Jessen", pos: "DEF", role: "LB", num: 3, age: 22, ovr: 66, pot: 74, nat: "DK", val: 1119653, wage: 12000 },
    { n: "Cláudio Winck", pos: "DEF", role: "RB", num: 2, age: 32, ovr: 69, pot: 69, nat: "BR", val: 942590, wage: 12000 },
    { n: "Kamil Ahmet Çörekçi", pos: "DEF", role: "RB", num: 22, age: 34, ovr: 70, pot: 70, nat: "TR", val: 798152, wage: 12000 },
    { n: "Ayberk Karapo", pos: "DEF", role: "RB", num: 20, age: 22, ovr: 66, pot: 73, nat: "TR", val: 1091127, wage: 12000 },
    // MID
    { n: "Andri Fannar Baldursson", pos: "MID", role: "CDM", num: 16, age: 24, ovr: 69, pot: 72, nat: "IS", val: 2838543, wage: 14193 },
    { n: "Elson Mendes", pos: "MID", role: "CDM", num: 28, age: 20, ovr: 65, pot: 75, nat: "CV", val: 735324, wage: 12000 },
    { n: "Atakan Müjde", pos: "MID", role: "CDM", num: 27, age: 22, ovr: 69, pot: 75, nat: "TR", val: 3343951, wage: 16720 },
    { n: "Kerem Demirbay", pos: "MID", role: "CM", num: 26, age: 33, ovr: 76, pot: 76, nat: "DE", val: 3435693, wage: 17178 },
    { n: "Haris Hajradinovic", pos: "MID", role: "AM", num: 10, age: 32, ovr: 68, pot: 68, nat: "BA", val: 668820, wage: 12000 },
    { n: "Mortadha Ben Ouanes", pos: "MID", role: "LW", num: 12, age: 32, ovr: 71, pot: 71, nat: "TN", val: 1719909, wage: 12000 },
    // FWD
    { n: "Thiemoko Diarra", pos: "FWD", role: "LW", num: 13, age: 23, ovr: 67, pot: 70, nat: "ML", val: 1492979, wage: 12000 },
    { n: "Ali Yavuz Kol", pos: "FWD", role: "LW", num: 11, age: 25, ovr: 71, pot: 72, nat: "TR", val: 5002477, wage: 25012 },
    { n: "Fousseni Diabaté", pos: "FWD", role: "RW", num: 34, age: 30, ovr: 71, pot: 71, nat: "ML", val: 2948415, wage: 14742 },
    { n: "Mamadou Fall", pos: "FWD", role: "RW", num: 7, age: 34, ovr: 69, pot: 69, nat: "SN", val: 583508, wage: 12000 },
    { n: "Adrian Benedyczak", pos: "FWD", role: "ST", num: 9, age: 25, ovr: 71, pot: 72, nat: "PL", val: 5002477, wage: 25012 },
    { n: "Güven Yalçın", pos: "FWD", role: "ST", num: 19, age: 27, ovr: 69, pot: 69, nat: "TR", val: 2244263, wage: 12000 },
    { n: "Yusuf Barası", pos: "FWD", role: "ST", num: 8, age: 23, ovr: 71, pot: 75, nat: "TR", val: 5773979, wage: 28870 },
  ],
);

const GFK_PACK = pack(
  { id: "gfk", name: "Gaziantep FK", short: "GFK", city: "Gaziantep", color: "#dc2626", color2: "#111114" },
  [
    // GK
    { n: "Kacper Tobiasz", pos: "GK", role: "GK", num: 1, age: 23, ovr: 70, pot: 75, nat: "PL", val: 4451235, wage: 22256 },
    { n: "İbrahim Kağan Alkış", pos: "GK", role: "GK", num: 2, age: 20, ovr: 66, pot: 77, nat: "TR", val: 1226092, wage: 12000 },
    { n: "Cemilhan Aslan", pos: "GK", role: "GK", num: 3, age: 18, ovr: 62, pot: 74, nat: "TR", val: 300000, wage: 12000 },
    // DEF
    { n: "Arda Kızıldağ", pos: "DEF", role: "CB", num: 4, age: 27, ovr: 70, pot: 70, nat: "TR", val: 3069817, wage: 15349 },
    { n: "Myenty Abena", pos: "DEF", role: "CB", num: 5, age: 31, ovr: 70, pot: 70, nat: "SR", val: 1289323, wage: 12000 },
    { n: "Nazım Sangaré", pos: "DEF", role: "CB", num: 6, age: 32, ovr: 69, pot: 69, nat: "TR", val: 942590, wage: 12000 },
    { n: "Florin Ștefan", pos: "DEF", role: "LB", num: 7, age: 30, ovr: 69, pot: 69, nat: "RO", val: 1615869, wage: 12000 },
    { n: "Kerim Calhanoglu", pos: "DEF", role: "LB", num: 8, age: 23, ovr: 67, pot: 70, nat: "DE", val: 1492979, wage: 12000 },
    { n: "Deian Sorescu", pos: "DEF", role: "RB", num: 9, age: 28, ovr: 73, pot: 73, nat: "RO", val: 6854701, wage: 34274 },
    { n: "Luis Pérez", pos: "DEF", role: "RB", num: 10, age: 31, ovr: 68, pot: 68, nat: "ES", val: 668820, wage: 12000 },
    { n: "Sabahattin Destici", pos: "DEF", role: "RB", num: 11, age: 26, ovr: 72, pot: 74, nat: "TR", val: 6647555, wage: 33238 },
    // MID
    { n: "Ulrich Meleke", pos: "MID", role: "CDM", num: 12, age: 27, ovr: 71, pot: 71, nat: "CI", val: 4095020, wage: 20475 },
    { n: "Ogün Özçiçek", pos: "MID", role: "CDM", num: 13, age: 27, ovr: 70, pot: 72, nat: "TR", val: 3112794, wage: 15564 },
    { n: "Drissa Camara", pos: "MID", role: "CM", num: 14, age: 24, ovr: 70, pot: 74, nat: "CI", val: 3949013, wage: 19745 },
    { n: "Juninho Bacuna", pos: "MID", role: "CM", num: 15, age: 29, ovr: 73, pot: 73, nat: "CW", val: 4935385, wage: 24677 },
    { n: "Karamba Gassama", pos: "MID", role: "CM", num: 16, age: 21, ovr: 65, pot: 72, nat: "GM", val: 674690, wage: 12000 },
    { n: "Kacper Kozłowski", pos: "MID", role: "AM", num: 17, age: 22, ovr: 67, pot: 73, nat: "PL", val: 1623750, wage: 12000 },
    { n: "Victor Gidado", pos: "MID", role: "AM", num: 18, age: 22, ovr: 66, pot: 72, nat: "NG", val: 1062601, wage: 12000 },
    { n: "Alexandru Maxim", pos: "MID", role: "AM", num: 19, age: 36, ovr: 73, pot: 73, nat: "RO", val: 1028205, wage: 12000 },
    // FWD
    { n: "Mirza Cihan", pos: "FWD", role: "LW", num: 20, age: 25, ovr: 69, pot: 70, nat: "TR", val: 2741591, wage: 13708 },
    { n: "Enver Kulasin", pos: "FWD", role: "RW", num: 21, age: 22, ovr: 68, pot: 75, nat: "BA", val: 2436416, wage: 12182 },
    { n: "Ali Mevran Ablak", pos: "FWD", role: "RW", num: 22, age: 23, ovr: 69, pot: 74, nat: "TR", val: 3254181, wage: 16271 },
    { n: "Trivante Stewart", pos: "FWD", role: "ST", num: 23, age: 26, ovr: 69, pot: 70, nat: "JM", val: 2741591, wage: 13708 },
    { n: "Serdar Dursun", pos: "FWD", role: "ST", num: 24, age: 34, ovr: 69, pot: 69, nat: "TR", val: 583508, wage: 12000 },
    { n: "Fuat Bavuk", pos: "FWD", role: "ST", num: 25, age: 26, ovr: 70, pot: 72, nat: "TR", val: 3816396, wage: 19082 },
  ],
);

const KOC_PACK = pack(
  { id: "koc", name: "Kocaelispor", short: "KOC", city: "Kocaeli", color: "#16a34a", color2: "#111114" },
  [
    // GK
    { n: "Aleksandar Jovanovic", pos: "GK", role: "GK", num: 2, age: 33, ovr: 67, pot: 67, nat: "RS", val: 300000, wage: 12000 },
    { n: "Onurcan Piri", pos: "GK", role: "GK", num: 3, age: 31, ovr: 69, pot: 69, nat: "TR", val: 942590, wage: 12000 },
    { n: "Serhat Öztaşdelen", pos: "GK", role: "GK", num: 4, age: 21, ovr: 65, pot: 73, nat: "TR", val: 692329, wage: 12000 },
    // DEF
    { n: "Anfernee Dijksteel", pos: "DEF", role: "CB", num: 5, age: 29, ovr: 69, pot: 69, nat: "SR", val: 1615869, wage: 12000 },
    { n: "Tanguy Zoukrou", pos: "DEF", role: "CB", num: 6, age: 23, ovr: 69, pot: 72, nat: "FR", val: 3074640, wage: 15373 },
    { n: "Emir Ortakaya", pos: "DEF", role: "CB", num: 7, age: 22, ovr: 65, pot: 71, nat: "TR", val: 657051, wage: 12000 },
    { n: "Onur Öztonga", pos: "DEF", role: "CB", num: 8, age: 26, ovr: 72, pot: 72, nat: "TR", val: 6416559, wage: 32083 },
    { n: "Mikdat Çil", pos: "DEF", role: "CB", num: 9, age: 20, ovr: 62, pot: 73, nat: "TR", val: 300000, wage: 12000 },
    { n: "Massadio Haïdara", pos: "DEF", role: "LB", num: 10, age: 33, ovr: 68, pot: 68, nat: "ML", val: 414031, wage: 12000 },
    { n: "Muharrem Cinan", pos: "DEF", role: "LB", num: 11, age: 28, ovr: 72, pot: 72, nat: "TR", val: 5347132, wage: 26736 },
    { n: "Uğur Kaan Yıldız", pos: "DEF", role: "RB", num: 12, age: 24, ovr: 67, pot: 70, nat: "TR", val: 1378335, wage: 12000 },
    // MID
    { n: "Show", pos: "MID", role: "CDM", num: 13, age: 27, ovr: 69, pot: 70, nat: "AO", val: 2259972, wage: 12000 },
    { n: "Mahamadou Susoho", pos: "MID", role: "CDM", num: 14, age: 21, ovr: 69, pot: 77, nat: "ES", val: 3523492, wage: 17617 },
    { n: "Berkan Kutlu", pos: "MID", role: "CM", num: 15, age: 28, ovr: 71, pot: 71, nat: "TR", val: 4095020, wage: 20475 },
    { n: "Habib Keïta", pos: "MID", role: "CM", num: 16, age: 24, ovr: 69, pot: 73, nat: "ML", val: 2887019, wage: 14435 },
    { n: "Tayfur Bingöl", pos: "MID", role: "CM", num: 17, age: 33, ovr: 66, pot: 66, nat: "TR", val: 300000, wage: 12000 },
    { n: "Samet Yalçın", pos: "MID", role: "CM", num: 18, age: 32, ovr: 72, pot: 72, nat: "TR", val: 2245796, wage: 12000 },
    // FWD
    { n: "Rigoberto Rivas", pos: "FWD", role: "LW", num: 19, age: 28, ovr: 70, pot: 70, nat: "HN", val: 3069817, wage: 15349 },
    { n: "Makana Baku", pos: "FWD", role: "LW", num: 20, age: 28, ovr: 73, pot: 73, nat: "DE", val: 6854701, wage: 34274 },
    { n: "Dan Agyei", pos: "FWD", role: "RW", num: 21, age: 29, ovr: 69, pot: 69, nat: "GH", val: 1615869, wage: 12000 },
    { n: "Bedirhan Yıldız", pos: "FWD", role: "RW", num: 22, age: 21, ovr: 68, pot: 76, nat: "TR", val: 2500113, wage: 12501 },
    { n: "Bruno Petkovic", pos: "FWD", role: "ST", num: 23, age: 31, ovr: 75, pot: 75, nat: "HR", val: 4517783, wage: 22589 },
    { n: "Metehan Altunbaş", pos: "FWD", role: "ST", num: 24, age: 23, ovr: 68, pot: 72, nat: "TR", val: 2245324, wage: 12000 },
    { n: "Arda Özyar", pos: "FWD", role: "ST", num: 25, age: 19, ovr: 65, pot: 75, nat: "TR", val: 735324, wage: 12000 },
  ],
);

const EYP_PACK = pack(
  { id: "eyp", name: "Eyüpspor", short: "EYP", city: "İstanbul", color: "#7c3aed", color2: "#facc15" },
  [
    // GK
    { n: "Horațiu Moldovan", pos: "GK", role: "GK", num: 2, age: 28, ovr: 75, pot: 75, nat: "RO", val: 10756627, wage: 53783 },
    { n: "Umut Keseci", pos: "GK", role: "GK", num: 3, age: 22, ovr: 67, pot: 75, nat: "TR", val: 1710932, wage: 12000 },
    // DEF
    { n: "Jawad El Yamiq", pos: "DEF", role: "CB", num: 4, age: 34, ovr: 74, pot: 74, nat: "MA", val: 2248357, wage: 12000 },
    { n: "Anıl Yaşar", pos: "DEF", role: "CB", num: 5, age: 24, ovr: 67, pot: 70, nat: "TR", val: 1378335, wage: 12000 },
    { n: "Zak Jules", pos: "DEF", role: "CB", num: 6, age: 29, ovr: 71, pot: 71, nat: "SC", val: 2948415, wage: 14742 },
    { n: "Gilbert Mendy", pos: "DEF", role: "CB", num: 7, age: 21, ovr: 69, pot: 75, nat: "SN", val: 3343951, wage: 16720 },
    { n: "Berhan Kutlay Şatlı", pos: "DEF", role: "CB", num: 8, age: 20, ovr: 62, pot: 71, nat: "TR", val: 300000, wage: 12000 },
    { n: "Arda Yavuz", pos: "DEF", role: "LB", num: 9, age: 20, ovr: 64, pot: 74, nat: "TR", val: 422153, wage: 12000 },
    { n: "Calegari", pos: "DEF", role: "RB", num: 10, age: 24, ovr: 68, pot: 71, nat: "BR", val: 2014104, wage: 12000 },
    { n: "Talha Ülvan", pos: "DEF", role: "RB", num: 11, age: 25, ovr: 69, pot: 71, nat: "TR", val: 2790067, wage: 13950 },
    // MID
    { n: "Chandrel Massanga", pos: "MID", role: "CDM", num: 12, age: 26, ovr: 69, pot: 69, nat: "CG", val: 2693115, wage: 13466 },
    { n: "Taşkın İlter", pos: "MID", role: "CDM", num: 13, age: 32, ovr: 70, pot: 70, nat: "TR", val: 1289323, wage: 12000 },
    { n: "Charles-André Raux-Yao", pos: "MID", role: "CM", num: 14, age: 24, ovr: 67, pot: 70, nat: "FR", val: 1378335, wage: 12000 },
    { n: "Hamza Akman", pos: "MID", role: "CM", num: 15, age: 21, ovr: 67, pot: 73, nat: "TR", val: 1623750, wage: 12000 },
    { n: "Erdem Çalık", pos: "MID", role: "CM", num: 16, age: 20, ovr: 66, pot: 77, nat: "TR", val: 1226092, wage: 12000 },
    { n: "Abdelhamid Sabiri", pos: "MID", role: "AM", num: 17, age: 29, ovr: 75, pot: 75, nat: "MA", val: 7744771, wage: 38724 },
    { n: "David Costa", pos: "MID", role: "AM", num: 18, age: 22, ovr: 68, pot: 76, nat: "PT", val: 2500113, wage: 12501 },
    // FWD
    { n: "Konrad Michalak", pos: "FWD", role: "LW", num: 19, age: 28, ovr: 73, pot: 73, nat: "PL", val: 6854701, wage: 34274 },
    { n: "Lenny Pintor", pos: "FWD", role: "LW", num: 20, age: 26, ovr: 69, pot: 70, nat: "FR", val: 2741591, wage: 13708 },
    { n: "Bilal Boutobba", pos: "FWD", role: "RW", num: 21, age: 27, ovr: 70, pot: 70, nat: "FR", val: 3069817, wage: 15349 },
    { n: "Mete Demir", pos: "FWD", role: "RW", num: 22, age: 28, ovr: 69, pot: 69, nat: "TR", val: 2244263, wage: 12000 },
    { n: "Berkay Kumlu", pos: "FWD", role: "RW", num: 23, age: 21, ovr: 66, pot: 74, nat: "TR", val: 1119653, wage: 12000 },
    { n: "Ahmed Abdullahi", pos: "FWD", role: "ST", num: 24, age: 22, ovr: 66, pot: 72, nat: "NG", val: 1062601, wage: 12000 },
    { n: "Abdou Khadre Sy", pos: "FWD", role: "ST", num: 25, age: 18, ovr: 64, pot: 77, nat: "SN", val: 401267, wage: 12000 },
  ],
);

const GBR_PACK = pack(
  { id: "gbr", name: "Gençlerbirliği", short: "GBR", city: "Ankara", color: "#dc2626", color2: "#111114" },
  [
    // GK
    { n: "Gökhan Akkan", pos: "GK", role: "GK", num: 2, age: 31, ovr: 69, pot: 69, nat: "TR", val: 942590, wage: 12000 },
    { n: "Berk Deniz Çukurcu", pos: "GK", role: "GK", num: 3, age: 18, ovr: 62, pot: 74, nat: "TR", val: 300000, wage: 12000 },
    // DEF
    { n: "Dimitrios Goutas", pos: "DEF", role: "CB", num: 4, age: 32, ovr: 74, pot: 74, nat: "GR", val: 3631961, wage: 18160 },
    { n: "Thalisson", pos: "DEF", role: "CB", num: 5, age: 28, ovr: 69, pot: 69, nat: "BR", val: 2244263, wage: 12000 },
    { n: "Zan Zuzek", pos: "DEF", role: "CB", num: 6, age: 29, ovr: 69, pot: 69, nat: "SI", val: 1615869, wage: 12000 },
    { n: "Ensar Çavuşoğlu", pos: "DEF", role: "CB", num: 7, age: 24, ovr: 67, pot: 70, nat: "TR", val: 1378335, wage: 12000 },
    { n: "Arda Çağan Çelik", pos: "DEF", role: "CB", num: 8, age: 21, ovr: 66, pot: 72, nat: "TR", val: 1062601, wage: 12000 },
    { n: "Kévin Rodrigues", pos: "DEF", role: "LB", num: 9, age: 32, ovr: 72, pot: 72, nat: "PT", val: 2245796, wage: 12000 },
    { n: "Abdurrahim Dursun", pos: "DEF", role: "LB", num: 10, age: 27, ovr: 69, pot: 69, nat: "TR", val: 2244263, wage: 12000 },
    { n: "Pedro Pereira", pos: "DEF", role: "RB", num: 11, age: 28, ovr: 70, pot: 70, nat: "PT", val: 3069817, wage: 15349 },
    { n: "Fıratcan Üzüm", pos: "DEF", role: "RB", num: 12, age: 27, ovr: 70, pot: 71, nat: "TR", val: 3091306, wage: 15457 },
    { n: "Berat Can Sebat", pos: "DEF", role: "RB", num: 13, age: 22, ovr: 68, pot: 74, nat: "TR", val: 2372719, wage: 12000 },
    // MID
    { n: "Moussa Kyabou", pos: "MID", role: "CDM", num: 14, age: 28, ovr: 72, pot: 72, nat: "ML", val: 5347132, wage: 26736 },
    { n: "Peter Etebo", pos: "MID", role: "CDM", num: 15, age: 30, ovr: 74, pot: 74, nat: "NG", val: 6226219, wage: 31131 },
    { n: "Ousmane Diabate", pos: "MID", role: "CDM", num: 16, age: 18, ovr: 60, pot: 72, nat: "GN", val: 300000, wage: 12000 },
    { n: "Franco Tongya", pos: "MID", role: "CM", num: 17, age: 24, ovr: 71, pot: 76, nat: "IT", val: 5356287, wage: 26781 },
    { n: "Oğulcan Ülgün", pos: "MID", role: "CM", num: 18, age: 28, ovr: 71, pot: 71, nat: "TR", val: 4095020, wage: 20475 },
    { n: "Ensar Kemaloğlu", pos: "MID", role: "CM", num: 19, age: 27, ovr: 72, pot: 72, nat: "TR", val: 5347132, wage: 26736 },
    { n: "Göktuğ Erdem", pos: "MID", role: "CM", num: 20, age: 22, ovr: 69, pot: 75, nat: "TR", val: 3343951, wage: 16720 },
    // FWD
    { n: "Adama Traoré", pos: "FWD", role: "RW", num: 21, age: 31, ovr: 76, pot: 76, nat: "ML", val: 5549966, wage: 27750 },
    { n: "Dilhan Demir", pos: "FWD", role: "RW", num: 22, age: 23, ovr: 68, pot: 73, nat: "DE", val: 2309022, wage: 12000 },
    { n: "Sékou Koïta", pos: "FWD", role: "ST", num: 23, age: 26, ovr: 74, pot: 76, nat: "ML", val: 10750606, wage: 53753 },
    { n: "Arda Akgül", pos: "FWD", role: "ST", num: 24, age: 21, ovr: 67, pot: 75, nat: "TR", val: 1710932, wage: 12000 },
  ],
);

const COR_PACK = pack(
  { id: "cor", name: "Çorum FK", short: "COR", city: "Çorum", color: "#dc2626", color2: "#111114" },
  [
    // GK
    { n: "Marcos Felipe", pos: "GK", role: "GK", num: 2, age: 30, ovr: 68, pot: 68, nat: "BR", val: 1146549, wage: 12000 },
    { n: "Erhan Erentürk", pos: "GK", role: "GK", num: 3, age: 31, ovr: 71, pot: 71, nat: "TR", val: 1719909, wage: 12000 },
    { n: "Arif Şimşir", pos: "GK", role: "GK", num: 4, age: 21, ovr: 67, pot: 74, nat: "TR", val: 1667341, wage: 12000 },
    // DEF
    { n: "Alexandre Penetra", pos: "DEF", role: "CB", num: 5, age: 24, ovr: 67, pot: 70, nat: "PT", val: 1378335, wage: 12000 },
    { n: "Hrvoje Smolcic", pos: "DEF", role: "CB", num: 6, age: 25, ovr: 72, pot: 74, nat: "HR", val: 6647555, wage: 33238 },
    { n: "Serdar Saatçı", pos: "DEF", role: "CB", num: 7, age: 23, ovr: 68, pot: 71, nat: "TR", val: 2181627, wage: 12000 },
    { n: "Arda Şengül", pos: "DEF", role: "CB", num: 8, age: 27, ovr: 73, pot: 74, nat: "TR", val: 6902684, wage: 34513 },
    { n: "Sinan Osmanoğlu", pos: "DEF", role: "CB", num: 9, age: 36, ovr: 70, pot: 70, nat: "TR", val: 460473, wage: 12000 },
    { n: "Andrei Borza", pos: "DEF", role: "LB", num: 10, age: 20, ovr: 64, pot: 75, nat: "RO", val: 435255, wage: 12000 },
    { n: "Cemali Sertel", pos: "DEF", role: "LB", num: 11, age: 26, ovr: 69, pot: 69, nat: "TR", val: 2693115, wage: 13466 },
    { n: "Gökhan Sazdağı", pos: "DEF", role: "RB", num: 12, age: 31, ovr: 69, pot: 69, nat: "TR", val: 942590, wage: 12000 },
    { n: "Hüseyin Bulut", pos: "DEF", role: "RB", num: 13, age: 27, ovr: 71, pot: 73, nat: "TR", val: 4152351, wage: 20762 },
    // MID
    { n: "Berat Özdemir", pos: "MID", role: "CDM", num: 14, age: 28, ovr: 72, pot: 72, nat: "TR", val: 5347132, wage: 26736 },
    { n: "Ylber Ramadani", pos: "MID", role: "CDM", num: 15, age: 30, ovr: 74, pot: 74, nat: "AL", val: 6226219, wage: 31131 },
    { n: "Mohamed Diomandé", pos: "MID", role: "CM", num: 16, age: 24, ovr: 74, pot: 78, nat: "CI", val: 11124179, wage: 55621 },
    { n: "Markus Karlsbakk", pos: "MID", role: "CM", num: 17, age: 26, ovr: 72, pot: 74, nat: "NO", val: 6647555, wage: 33238 },
    { n: "Atakan Akkaynak", pos: "MID", role: "CM", num: 18, age: 27, ovr: 72, pot: 74, nat: "TR", val: 5421992, wage: 27110 },
    { n: "Ahmed Ildız", pos: "MID", role: "CM", num: 19, age: 29, ovr: 69, pot: 69, nat: "TR", val: 1615869, wage: 12000 },
    { n: "Kenan Fakılı", pos: "MID", role: "AM", num: 20, age: 23, ovr: 69, pot: 74, nat: "TR", val: 3254181, wage: 16271 },
    // FWD
    { n: "Alexandros Kyziridis", pos: "FWD", role: "LW", num: 21, age: 25, ovr: 72, pot: 74, nat: "GR", val: 6647555, wage: 33238 },
    { n: "Emircan Gürlük", pos: "FWD", role: "LW", num: 22, age: 22, ovr: 69, pot: 76, nat: "TR", val: 3433722, wage: 17169 },
    { n: "Burak Çoban", pos: "FWD", role: "LW", num: 23, age: 31, ovr: 70, pot: 70, nat: "TR", val: 1289323, wage: 12000 },
    { n: "Hasan Abdulkareem", pos: "FWD", role: "RW", num: 24, age: 27, ovr: 69, pot: 70, nat: "IQ", val: 2259972, wage: 12000 },
    { n: "Semih Akyıldız", pos: "FWD", role: "RW", num: 25, age: 25, ovr: 70, pot: 71, nat: "TR", val: 3750088, wage: 18750 },
    { n: "Jesús Ramírez", pos: "FWD", role: "ST", num: 26, age: 28, ovr: 73, pot: 73, nat: "VE", val: 6854701, wage: 34274 },
    { n: "Mame Thiam", pos: "FWD", role: "ST", num: 27, age: 33, ovr: 66, pot: 66, nat: "SN", val: 300000, wage: 12000 },
  ],
);

const AMD_PACK = pack(
  { id: "amd", name: "Amed SK", short: "AMD", city: "Diyarbakır", color: "#16a34a", color2: "#dc2626" },
  [
    // GK
    { n: "Alban Lafont", pos: "GK", role: "GK", num: 2, age: 27, ovr: 77, pot: 77, nat: "CI", val: 16053619, wage: 80268 },
    { n: "Burak Bozan", pos: "GK", role: "GK", num: 3, age: 25, ovr: 73, pot: 75, nat: "TR", val: 8521764, wage: 42609 },
    { n: "Abdulsamed Damlu", pos: "GK", role: "GK", num: 4, age: 27, ovr: 69, pot: 70, nat: "TR", val: 2259972, wage: 12000 },
    // DEF
    { n: "David Bates", pos: "DEF", role: "CB", num: 5, age: 29, ovr: 69, pot: 69, nat: "SC", val: 1615869, wage: 12000 },
    { n: "Lumbardh Dellova", pos: "DEF", role: "CB", num: 6, age: 27, ovr: 69, pot: 69, nat: "XK", val: 2244263, wage: 12000 },
    { n: "Mehmet Yeşil", pos: "DEF", role: "CB", num: 7, age: 28, ovr: 70, pot: 70, nat: "TR", val: 3069817, wage: 15349 },
    { n: "Amadou Cissé", pos: "DEF", role: "CB", num: 8, age: 20, ovr: 63, pot: 72, nat: "GN", val: 300000, wage: 12000 },
    { n: "Miraç Acer", pos: "DEF", role: "CB", num: 9, age: 30, ovr: 71, pot: 71, nat: "TR", val: 2948415, wage: 14742 },
    { n: "Kahraman Demirtaş", pos: "DEF", role: "CB", num: 10, age: 32, ovr: 68, pot: 68, nat: "TR", val: 668820, wage: 12000 },
    { n: "Umut Meraş", pos: "DEF", role: "LB", num: 11, age: 30, ovr: 69, pot: 69, nat: "TR", val: 1615869, wage: 12000 },
    { n: "Celal Hanalp", pos: "DEF", role: "RB", num: 12, age: 30, ovr: 70, pot: 70, nat: "TR", val: 2210268, wage: 12000 },
    { n: "Emrullah Ertuş", pos: "DEF", role: "RB", num: 13, age: 25, ovr: 69, pot: 70, nat: "TR", val: 2741591, wage: 13708 },
    // MID
    { n: "Gökhan Gül", pos: "MID", role: "CDM", num: 14, age: 28, ovr: 72, pot: 72, nat: "DE", val: 5347132, wage: 26736 },
    { n: "Rayan Raveloson", pos: "MID", role: "CDM", num: 15, age: 29, ovr: 70, pot: 70, nat: "MG", val: 2210268, wage: 12000 },
    { n: "Cem Üstündag", pos: "MID", role: "CM", num: 16, age: 25, ovr: 71, pot: 71, nat: "AT", val: 4914024, wage: 24570 },
    { n: "Furkan Soyalp", pos: "MID", role: "CM", num: 17, age: 31, ovr: 71, pot: 71, nat: "TR", val: 1719909, wage: 12000 },
    { n: "Rayan Lutin", pos: "MID", role: "AM", num: 18, age: 23, ovr: 68, pot: 73, nat: "KM", val: 2309022, wage: 12000 },
    { n: "Dia Saba", pos: "MID", role: "AM", num: 19, age: 33, ovr: 66, pot: 66, nat: "IL", val: 300000, wage: 12000 },
    { n: "Çekdar Orhan", pos: "MID", role: "AM", num: 20, age: 28, ovr: 73, pot: 73, nat: "TR", val: 6854701, wage: 34274 },
    // FWD
    { n: "Yira Sor", pos: "FWD", role: "LW", num: 21, age: 26, ovr: 73, pot: 75, nat: "NG", val: 8521764, wage: 42609 },
    { n: "Ermal Krasniqi", pos: "FWD", role: "LW", num: 22, age: 27, ovr: 72, pot: 73, nat: "XK", val: 5384562, wage: 26923 },
    { n: "Mohamed Khalil", pos: "FWD", role: "LW", num: 23, age: 25, ovr: 72, pot: 72, nat: "SY", val: 6416559, wage: 32083 },
    { n: "Samuel Ballet", pos: "FWD", role: "RW", num: 24, age: 25, ovr: 73, pot: 75, nat: "CH", val: 8521764, wage: 42609 },
    { n: "Cıvan Süer", pos: "FWD", role: "RW", num: 25, age: 20, ovr: 62, pot: 72, nat: "TR", val: 300000, wage: 12000 },
    { n: "Gift Orban", pos: "FWD", role: "ST", num: 26, age: 24, ovr: 76, pot: 81, nat: "NG", val: 17284179, wage: 86421 },
    { n: "Mbaye Diagne", pos: "FWD", role: "ST", num: 27, age: 34, ovr: 74, pot: 74, nat: "SN", val: 2248357, wage: 12000 },
  ],
);

const ERZ_PACK = pack(
  { id: "erz", name: "Erzurumspor FK", short: "ERZ", city: "Erzurum", color: "#1d4ed8", color2: "#ffffff" },
  [
    // GK
    { n: "Matija Orbanic", pos: "GK", role: "GK", num: 2, age: 26, ovr: 70, pot: 70, nat: "HR", val: 3683780, wage: 18419 },
    { n: "Ertuğrul Taşkıran", pos: "GK", role: "GK", num: 3, age: 36, ovr: 66, pot: 66, nat: "TR", val: 300000, wage: 12000 },
    { n: "Erkan Anapa", pos: "GK", role: "GK", num: 4, age: 28, ovr: 72, pot: 72, nat: "TR", val: 5347132, wage: 26736 },
    // DEF
    { n: "Yakup Kırtay", pos: "DEF", role: "CB", num: 5, age: 23, ovr: 70, pot: 75, nat: "TR", val: 4451235, wage: 22256 },
    { n: "Nihad Mujakic", pos: "DEF", role: "CB", num: 6, age: 28, ovr: 72, pot: 72, nat: "BA", val: 5347132, wage: 26736 },
    { n: "Amar Gerxhaliu", pos: "DEF", role: "CB", num: 7, age: 24, ovr: 70, pot: 75, nat: "XK", val: 4015321, wage: 20077 },
    { n: "Emre Erdem", pos: "DEF", role: "CB", num: 8, age: 24, ovr: 67, pot: 70, nat: "TR", val: 1378335, wage: 12000 },
    { n: "Enes Yiğit", pos: "DEF", role: "CB", num: 9, age: 23, ovr: 67, pot: 72, nat: "TR", val: 1580160, wage: 12000 },
    { n: "Yiğit Baran Karaoğlan", pos: "DEF", role: "CB", num: 10, age: 20, ovr: 64, pot: 74, nat: "TR", val: 422153, wage: 12000 },
    { n: "Guram Giorbelidze", pos: "DEF", role: "LB", num: 11, age: 30, ovr: 70, pot: 70, nat: "GE", val: 2210268, wage: 12000 },
    { n: "Cengizhan Bayrak", pos: "DEF", role: "LB", num: 12, age: 26, ovr: 69, pot: 70, nat: "TR", val: 2741591, wage: 13708 },
    { n: "Festy Ebosele", pos: "DEF", role: "RB", num: 13, age: 24, ovr: 73, pot: 76, nat: "IE", val: 8669826, wage: 43349 },
    { n: "Orhan Ovacıklı", pos: "DEF", role: "RB", num: 14, age: 37, ovr: 70, pot: 70, nat: "TR", val: 460473, wage: 12000 },
    // MID
    { n: "Brandon Baiye", pos: "MID", role: "CDM", num: 15, age: 25, ovr: 71, pot: 71, nat: "BE", val: 4914024, wage: 24570 },
    { n: "Sefa Akgün", pos: "MID", role: "CM", num: 16, age: 26, ovr: 73, pot: 74, nat: "TR", val: 8373703, wage: 41869 },
    { n: "Murat Cem Akpınar", pos: "MID", role: "CM", num: 17, age: 27, ovr: 71, pot: 73, nat: "TR", val: 4152351, wage: 20762 },
    { n: "Enes Karakaş", pos: "MID", role: "CM", num: 18, age: 23, ovr: 71, pot: 74, nat: "TR", val: 5610178, wage: 28051 },
    { n: "Eren Özdemir", pos: "MID", role: "CM", num: 19, age: 23, ovr: 69, pot: 72, nat: "TR", val: 3074640, wage: 15373 },
    { n: "Mert Önal", pos: "MID", role: "CM", num: 20, age: 22, ovr: 67, pot: 75, nat: "TR", val: 1710932, wage: 12000 },
    { n: "Martín Rodríguez", pos: "MID", role: "AM", num: 21, age: 32, ovr: 70, pot: 70, nat: "CL", val: 1289323, wage: 12000 },
    // FWD
    { n: "Mustafa Fettahoğlu", pos: "FWD", role: "LW", num: 22, age: 25, ovr: 71, pot: 71, nat: "TR", val: 4914024, wage: 24570 },
    { n: "Fernando Andrade", pos: "FWD", role: "LW", num: 23, age: 33, ovr: 68, pot: 68, nat: "BR", val: 414031, wage: 12000 },
    { n: "Gyrano Kerk", pos: "FWD", role: "RW", num: 24, age: 30, ovr: 73, pot: 73, nat: "SR", val: 4935385, wage: 24677 },
    { n: "Nariman Akhundzada", pos: "FWD", role: "ST", num: 25, age: 22, ovr: 66, pot: 72, nat: "AZ", val: 1062601, wage: 12000 },
    { n: "İlkan Sever", pos: "FWD", role: "ST", num: 26, age: 21, ovr: 65, pot: 72, nat: "TR", val: 674690, wage: 12000 },
    { n: "Eren Tozlu", pos: "FWD", role: "ST", num: 27, age: 35, ovr: 66, pot: 66, nat: "TR", val: 300000, wage: 12000 },
  ],
);

const BRS_PACK = pack(
  { id: "brs", name: "Bursaspor", short: "BRS", city: "Bursa", color: "#16a34a", color2: "#ffffff" },
  [
    // GK
    { n: "Çağlar Şanlı", pos: "GK", role: "GK", num: 1, age: 31, ovr: 63, pot: 63, nat: "TR", val: 300000, wage: 12000 },
    { n: "Eren Şahin", pos: "GK", role: "GK", num: 2, age: 34, ovr: 63, pot: 63, nat: "TR", val: 300000, wage: 12000 },
    { n: "Barış Bulut", pos: "GK", role: "GK", num: 3, age: 28, ovr: 63, pot: 63, nat: "TR", val: 300000, wage: 12000 },
    // DEF
    { n: "Efe Ünal", pos: "DEF", role: "CB", num: 4, age: 29, ovr: 68, pot: 68, nat: "TR", val: 1146549, wage: 12000 },
    { n: "Görkem Çelik", pos: "DEF", role: "CB", num: 5, age: 34, ovr: 66, pot: 66, nat: "TR", val: 300000, wage: 12000 },
    { n: "Umut Duman", pos: "DEF", role: "CB", num: 6, age: 20, ovr: 62, pot: 74, nat: "TR", val: 300000, wage: 12000 },
    { n: "Semih Başaran", pos: "DEF", role: "CB", num: 7, age: 30, ovr: 63, pot: 63, nat: "TR", val: 300000, wage: 12000 },
    { n: "Sinan Yalçın", pos: "DEF", role: "LB", num: 8, age: 33, ovr: 61, pot: 61, nat: "TR", val: 300000, wage: 12000 },
    { n: "Furkan Şahin", pos: "DEF", role: "LB", num: 9, age: 23, ovr: 59, pot: 67, nat: "TR", val: 300000, wage: 12000 },
    { n: "Mert Aydın", pos: "DEF", role: "RB", num: 10, age: 27, ovr: 62, pot: 62, nat: "TR", val: 300000, wage: 12000 },
    { n: "Volkan Çolak", pos: "DEF", role: "RB", num: 11, age: 32, ovr: 61, pot: 61, nat: "TR", val: 300000, wage: 12000 },
    // MID
    { n: "Burak Taş", pos: "MID", role: "CDM", num: 12, age: 18, ovr: 61, pot: 73, nat: "TR", val: 300000, wage: 12000 },
    { n: "Sinan Çelik", pos: "MID", role: "CDM", num: 13, age: 20, ovr: 62, pot: 74, nat: "TR", val: 300000, wage: 12000 },
    { n: "Eren Aydın", pos: "MID", role: "CM", num: 14, age: 29, ovr: 68, pot: 68, nat: "TR", val: 1146549, wage: 12000 },
    { n: "Batuhan Yılmaz", pos: "MID", role: "CM", num: 15, age: 32, ovr: 63, pot: 63, nat: "TR", val: 300000, wage: 12000 },
    { n: "Yiğit Erdoğan", pos: "MID", role: "CM", num: 16, age: 23, ovr: 63, pot: 71, nat: "TR", val: 300000, wage: 12000 },
    { n: "Yusuf Ünal", pos: "MID", role: "AM", num: 17, age: 31, ovr: 64, pot: 64, nat: "TR", val: 300000, wage: 12000 },
    { n: "Semih Güneş", pos: "MID", role: "AM", num: 18, age: 34, ovr: 63, pot: 63, nat: "TR", val: 300000, wage: 12000 },
    // FWD
    { n: "Hakan Yılmaz", pos: "FWD", role: "LW", num: 19, age: 33, ovr: 60, pot: 60, nat: "TR", val: 300000, wage: 12000 },
    { n: "Eren Demir", pos: "FWD", role: "LW", num: 20, age: 32, ovr: 61, pot: 61, nat: "TR", val: 300000, wage: 12000 },
    { n: "Semih Aslan", pos: "FWD", role: "RW", num: 21, age: 32, ovr: 64, pot: 64, nat: "TR", val: 300000, wage: 12000 },
    { n: "Tolga Korkmaz", pos: "FWD", role: "RW", num: 22, age: 31, ovr: 61, pot: 61, nat: "TR", val: 300000, wage: 12000 },
    { n: "Yunus Polat", pos: "FWD", role: "ST", num: 23, age: 21, ovr: 61, pot: 69, nat: "TR", val: 300000, wage: 12000 },
    { n: "Volkan Kılıç", pos: "FWD", role: "ST", num: 24, age: 18, ovr: 56, pot: 68, nat: "TR", val: 300000, wage: 12000 },
    { n: "Koray Yılmaz", pos: "FWD", role: "ST", num: 25, age: 34, ovr: 66, pot: 66, nat: "TR", val: 300000, wage: 12000 },
  ],
);

const KAY_PACK = pack(
  { id: "kay", name: "Kayserispor", short: "KAY", city: "Kayseri", color: "#facc15", color2: "#dc2626" },
  [
    // GK
    { n: "Yusuf Çolak", pos: "GK", role: "GK", num: 1, age: 25, ovr: 64, pot: 68, nat: "TR", val: 325672, wage: 12000 },
    { n: "Doğan Çakır", pos: "GK", role: "GK", num: 2, age: 30, ovr: 64, pot: 64, nat: "TR", val: 300000, wage: 12000 },
    { n: "Kuzey Erdoğan", pos: "GK", role: "GK", num: 3, age: 21, ovr: 65, pot: 73, nat: "TR", val: 692329, wage: 12000 },
    // DEF
    { n: "Ferdi Şanlı", pos: "DEF", role: "CB", num: 4, age: 32, ovr: 65, pot: 65, nat: "TR", val: 300000, wage: 12000 },
    { n: "Kuzey Yıldız", pos: "DEF", role: "CB", num: 5, age: 24, ovr: 67, pot: 71, nat: "TR", val: 1401874, wage: 12000 },
    { n: "Doğan Taş", pos: "DEF", role: "CB", num: 6, age: 25, ovr: 66, pot: 70, nat: "TR", val: 917403, wage: 12000 },
    { n: "Koray Doğan", pos: "DEF", role: "CB", num: 7, age: 33, ovr: 63, pot: 63, nat: "TR", val: 300000, wage: 12000 },
    { n: "Efe Başaran", pos: "DEF", role: "LB", num: 8, age: 27, ovr: 67, pot: 67, nat: "TR", val: 1089765, wage: 12000 },
    { n: "Yiğit Kılıç", pos: "DEF", role: "LB", num: 9, age: 23, ovr: 59, pot: 67, nat: "TR", val: 300000, wage: 12000 },
    { n: "Emre Şanlı", pos: "DEF", role: "RB", num: 10, age: 26, ovr: 66, pot: 70, nat: "TR", val: 917403, wage: 12000 },
    { n: "Kaan Başaran", pos: "DEF", role: "RB", num: 11, age: 28, ovr: 64, pot: 64, nat: "TR", val: 300000, wage: 12000 },
    // MID
    { n: "Yunus Taş", pos: "MID", role: "CDM", num: 12, age: 28, ovr: 66, pot: 66, nat: "TR", val: 713155, wage: 12000 },
    { n: "Doğan Aslan", pos: "MID", role: "CDM", num: 13, age: 30, ovr: 61, pot: 61, nat: "TR", val: 300000, wage: 12000 },
    { n: "Enes Yıldız", pos: "MID", role: "CM", num: 14, age: 20, ovr: 56, pot: 68, nat: "TR", val: 300000, wage: 12000 },
    { n: "Ahmet Ünal", pos: "MID", role: "CM", num: 15, age: 32, ovr: 61, pot: 61, nat: "TR", val: 300000, wage: 12000 },
    { n: "Berke Sezer", pos: "MID", role: "CM", num: 16, age: 20, ovr: 60, pot: 72, nat: "TR", val: 300000, wage: 12000 },
    { n: "Hakan Bulut", pos: "MID", role: "AM", num: 17, age: 32, ovr: 61, pot: 61, nat: "TR", val: 300000, wage: 12000 },
    { n: "Mert Taş", pos: "MID", role: "AM", num: 18, age: 23, ovr: 64, pot: 72, nat: "TR", val: 397470, wage: 12000 },
    // FWD
    { n: "Kaan Akın", pos: "FWD", role: "LW", num: 19, age: 30, ovr: 61, pot: 61, nat: "TR", val: 300000, wage: 12000 },
    { n: "Efe Koç", pos: "FWD", role: "LW", num: 20, age: 21, ovr: 64, pot: 72, nat: "TR", val: 397470, wage: 12000 },
    { n: "Cenk Erdoğan", pos: "FWD", role: "RW", num: 21, age: 23, ovr: 61, pot: 69, nat: "TR", val: 300000, wage: 12000 },
    { n: "Ahmet Taş", pos: "FWD", role: "RW", num: 22, age: 27, ovr: 65, pot: 65, nat: "TR", val: 440974, wage: 12000 },
    { n: "Semih Korkmaz", pos: "FWD", role: "ST", num: 23, age: 20, ovr: 56, pot: 68, nat: "TR", val: 300000, wage: 12000 },
    { n: "Kerem Yalçın", pos: "FWD", role: "ST", num: 24, age: 28, ovr: 67, pot: 67, nat: "TR", val: 1089765, wage: 12000 },
    { n: "Ferdi Akgün", pos: "FWD", role: "ST", num: 25, age: 30, ovr: 64, pot: 64, nat: "TR", val: 300000, wage: 12000 },
  ],
);

const ANT_PACK = pack(
  { id: "ant", name: "Antalyaspor", short: "ANT", city: "Antalya", color: "#dc2626", color2: "#ffffff" },
  [
    // GK
    { n: "Furkan Öztürk", pos: "GK", role: "GK", num: 1, age: 27, ovr: 65, pot: 65, nat: "TR", val: 440974, wage: 12000 },
    { n: "Volkan Türk", pos: "GK", role: "GK", num: 2, age: 28, ovr: 68, pot: 68, nat: "TR", val: 1592429, wage: 12000 },
    { n: "Berke Bulut", pos: "GK", role: "GK", num: 3, age: 33, ovr: 66, pot: 66, nat: "TR", val: 300000, wage: 12000 },
    // DEF
    { n: "Görkem Sezer", pos: "DEF", role: "CB", num: 4, age: 29, ovr: 68, pot: 68, nat: "TR", val: 1146549, wage: 12000 },
    { n: "Eren Özkan", pos: "DEF", role: "CB", num: 5, age: 26, ovr: 67, pot: 71, nat: "TR", val: 1401874, wage: 12000 },
    { n: "Cenk Şahin", pos: "DEF", role: "CB", num: 6, age: 33, ovr: 60, pot: 60, nat: "TR", val: 300000, wage: 12000 },
    { n: "Semih Taş", pos: "DEF", role: "CB", num: 7, age: 23, ovr: 64, pot: 72, nat: "TR", val: 397470, wage: 12000 },
    { n: "Doğan Arslan", pos: "DEF", role: "LB", num: 8, age: 19, ovr: 59, pot: 71, nat: "TR", val: 300000, wage: 12000 },
    { n: "Burak Türk", pos: "DEF", role: "LB", num: 9, age: 22, ovr: 63, pot: 71, nat: "TR", val: 300000, wage: 12000 },
    { n: "Umut Bulut", pos: "DEF", role: "RB", num: 10, age: 25, ovr: 63, pot: 67, nat: "TR", val: 300000, wage: 12000 },
    { n: "Emre Arslan", pos: "DEF", role: "RB", num: 11, age: 21, ovr: 60, pot: 68, nat: "TR", val: 300000, wage: 12000 },
    // MID
    { n: "Tolga Türk", pos: "MID", role: "CDM", num: 12, age: 33, ovr: 65, pot: 65, nat: "TR", val: 300000, wage: 12000 },
    { n: "Mert Sezer", pos: "MID", role: "CDM", num: 13, age: 30, ovr: 62, pot: 62, nat: "TR", val: 300000, wage: 12000 },
    { n: "Görkem Akın", pos: "MID", role: "CM", num: 14, age: 19, ovr: 58, pot: 70, nat: "TR", val: 300000, wage: 12000 },
    { n: "Ozan Çelik", pos: "MID", role: "CM", num: 15, age: 24, ovr: 66, pot: 70, nat: "TR", val: 917403, wage: 12000 },
    { n: "Semih Akın", pos: "MID", role: "CM", num: 16, age: 31, ovr: 66, pot: 66, nat: "TR", val: 300000, wage: 12000 },
    { n: "Bora Duman", pos: "MID", role: "AM", num: 17, age: 28, ovr: 65, pot: 65, nat: "TR", val: 440974, wage: 12000 },
    { n: "Kerem Çelik", pos: "MID", role: "AM", num: 18, age: 27, ovr: 63, pot: 63, nat: "TR", val: 300000, wage: 12000 },
    // FWD
    { n: "Kerem Demir", pos: "FWD", role: "LW", num: 19, age: 20, ovr: 60, pot: 72, nat: "TR", val: 300000, wage: 12000 },
    { n: "Ahmet Koç", pos: "FWD", role: "LW", num: 20, age: 29, ovr: 62, pot: 62, nat: "TR", val: 300000, wage: 12000 },
    { n: "Yusuf Yılmaz", pos: "FWD", role: "RW", num: 21, age: 33, ovr: 60, pot: 60, nat: "TR", val: 300000, wage: 12000 },
    { n: "Semih Yıldız", pos: "FWD", role: "RW", num: 22, age: 19, ovr: 60, pot: 72, nat: "TR", val: 300000, wage: 12000 },
    { n: "Semih Duman", pos: "FWD", role: "ST", num: 23, age: 27, ovr: 68, pot: 68, nat: "TR", val: 1592429, wage: 12000 },
    { n: "Serkan Yılmaz", pos: "FWD", role: "ST", num: 24, age: 28, ovr: 68, pot: 68, nat: "TR", val: 1592429, wage: 12000 },
    { n: "Efe Başaran", pos: "FWD", role: "ST", num: 25, age: 28, ovr: 68, pot: 68, nat: "TR", val: 1592429, wage: 12000 },
  ],
);

const SVS_PACK = pack(
  { id: "svs", name: "Sivasspor", short: "SVS", city: "Sivas", color: "#dc2626", color2: "#ffffff" },
  [
    // GK
    { n: "Eren Erdoğan", pos: "GK", role: "GK", num: 1, age: 30, ovr: 63, pot: 63, nat: "TR", val: 300000, wage: 12000 },
    { n: "Doğan Sezer", pos: "GK", role: "GK", num: 2, age: 20, ovr: 62, pot: 74, nat: "TR", val: 300000, wage: 12000 },
    { n: "Burak Taş", pos: "GK", role: "GK", num: 3, age: 29, ovr: 64, pot: 64, nat: "TR", val: 300000, wage: 12000 },
    // DEF
    { n: "Yusuf Başaran", pos: "DEF", role: "CB", num: 4, age: 31, ovr: 65, pot: 65, nat: "TR", val: 300000, wage: 12000 },
    { n: "Efe Kaya", pos: "DEF", role: "CB", num: 5, age: 33, ovr: 62, pot: 62, nat: "TR", val: 300000, wage: 12000 },
    { n: "Taner Taş", pos: "DEF", role: "CB", num: 6, age: 30, ovr: 64, pot: 64, nat: "TR", val: 300000, wage: 12000 },
    { n: "Görkem Başaran", pos: "DEF", role: "CB", num: 7, age: 18, ovr: 57, pot: 69, nat: "TR", val: 300000, wage: 12000 },
    { n: "Volkan Yıldız", pos: "DEF", role: "LB", num: 8, age: 19, ovr: 62, pot: 74, nat: "TR", val: 300000, wage: 12000 },
    { n: "Semih Aydın", pos: "DEF", role: "LB", num: 9, age: 34, ovr: 60, pot: 60, nat: "TR", val: 300000, wage: 12000 },
    { n: "Yusuf Demir", pos: "DEF", role: "RB", num: 10, age: 21, ovr: 64, pot: 72, nat: "TR", val: 397470, wage: 12000 },
    { n: "Arda Çolak", pos: "DEF", role: "RB", num: 11, age: 32, ovr: 65, pot: 65, nat: "TR", val: 300000, wage: 12000 },
    // MID
    { n: "Enes Erdoğan", pos: "MID", role: "CDM", num: 12, age: 19, ovr: 56, pot: 68, nat: "TR", val: 300000, wage: 12000 },
    { n: "Ahmet Ünal", pos: "MID", role: "CDM", num: 13, age: 32, ovr: 61, pot: 61, nat: "TR", val: 300000, wage: 12000 },
    { n: "Onur Yalçın", pos: "MID", role: "CM", num: 14, age: 31, ovr: 66, pot: 66, nat: "TR", val: 300000, wage: 12000 },
    { n: "Furkan Yıldız", pos: "MID", role: "CM", num: 15, age: 22, ovr: 62, pot: 70, nat: "TR", val: 300000, wage: 12000 },
    { n: "Umut Akgün", pos: "MID", role: "CM", num: 16, age: 24, ovr: 64, pot: 68, nat: "TR", val: 325672, wage: 12000 },
    { n: "Görkem Arslan", pos: "MID", role: "AM", num: 17, age: 33, ovr: 64, pot: 64, nat: "TR", val: 300000, wage: 12000 },
    { n: "Bora Erdoğan", pos: "MID", role: "AM", num: 18, age: 32, ovr: 61, pot: 61, nat: "TR", val: 300000, wage: 12000 },
    // FWD
    { n: "Koray Demir", pos: "FWD", role: "LW", num: 19, age: 22, ovr: 64, pot: 72, nat: "TR", val: 397470, wage: 12000 },
    { n: "Furkan Ünal", pos: "FWD", role: "LW", num: 20, age: 34, ovr: 65, pot: 65, nat: "TR", val: 300000, wage: 12000 },
    { n: "Cenk Aslan", pos: "FWD", role: "RW", num: 21, age: 23, ovr: 59, pot: 67, nat: "TR", val: 300000, wage: 12000 },
    { n: "Ferdi Öztürk", pos: "FWD", role: "RW", num: 22, age: 27, ovr: 68, pot: 68, nat: "TR", val: 1592429, wage: 12000 },
    { n: "Batuhan Ünal", pos: "FWD", role: "ST", num: 23, age: 19, ovr: 62, pot: 74, nat: "TR", val: 300000, wage: 12000 },
    { n: "Tolga Güler", pos: "FWD", role: "ST", num: 24, age: 20, ovr: 62, pot: 74, nat: "TR", val: 300000, wage: 12000 },
    { n: "Arda Kaya", pos: "FWD", role: "ST", num: 25, age: 22, ovr: 64, pot: 72, nat: "TR", val: 397470, wage: 12000 },
  ],
);

const BDR_PACK = pack(
  { id: "bdr", name: "Bodrum FK", short: "BDR", city: "Bodrum", color: "#16a34a", color2: "#ffffff" },
  [
    // GK
    { n: "Ahmet Taş", pos: "GK", role: "GK", num: 1, age: 28, ovr: 62, pot: 62, nat: "TR", val: 300000, wage: 12000 },
    { n: "Yunus Şanlı", pos: "GK", role: "GK", num: 2, age: 33, ovr: 64, pot: 64, nat: "TR", val: 300000, wage: 12000 },
    { n: "Tolga Şahin", pos: "GK", role: "GK", num: 3, age: 22, ovr: 63, pot: 71, nat: "TR", val: 300000, wage: 12000 },
    // DEF
    { n: "Efe Yılmaz", pos: "DEF", role: "CB", num: 4, age: 30, ovr: 66, pot: 66, nat: "TR", val: 513472, wage: 12000 },
    { n: "Batuhan Bulut", pos: "DEF", role: "CB", num: 5, age: 26, ovr: 62, pot: 66, nat: "TR", val: 300000, wage: 12000 },
    { n: "Cenk Ünal", pos: "DEF", role: "CB", num: 6, age: 33, ovr: 63, pot: 63, nat: "TR", val: 300000, wage: 12000 },
    { n: "Efe Şanlı", pos: "DEF", role: "CB", num: 7, age: 29, ovr: 67, pot: 67, nat: "TR", val: 784631, wage: 12000 },
    { n: "Onur Yıldız", pos: "DEF", role: "LB", num: 8, age: 18, ovr: 58, pot: 70, nat: "TR", val: 300000, wage: 12000 },
    { n: "Volkan Başaran", pos: "DEF", role: "LB", num: 9, age: 34, ovr: 60, pot: 60, nat: "TR", val: 300000, wage: 12000 },
    { n: "Görkem Polat", pos: "DEF", role: "RB", num: 10, age: 21, ovr: 62, pot: 70, nat: "TR", val: 300000, wage: 12000 },
    { n: "Deniz Öztürk", pos: "DEF", role: "RB", num: 11, age: 26, ovr: 68, pot: 72, nat: "TR", val: 2048500, wage: 12000 },
    // MID
    { n: "Yusuf Akın", pos: "MID", role: "CDM", num: 12, age: 23, ovr: 63, pot: 71, nat: "TR", val: 300000, wage: 12000 },
    { n: "Ege Güneş", pos: "MID", role: "CDM", num: 13, age: 30, ovr: 66, pot: 66, nat: "TR", val: 513472, wage: 12000 },
    { n: "Eren Koç", pos: "MID", role: "CM", num: 14, age: 34, ovr: 66, pot: 66, nat: "TR", val: 300000, wage: 12000 },
    { n: "Mehmet Yıldız", pos: "MID", role: "CM", num: 15, age: 24, ovr: 66, pot: 70, nat: "TR", val: 917403, wage: 12000 },
    { n: "Arda Akın", pos: "MID", role: "CM", num: 16, age: 29, ovr: 65, pot: 65, nat: "TR", val: 317501, wage: 12000 },
    { n: "Emre Öztürk", pos: "MID", role: "AM", num: 17, age: 24, ovr: 67, pot: 71, nat: "TR", val: 1401874, wage: 12000 },
    { n: "Taner Akın", pos: "MID", role: "AM", num: 18, age: 28, ovr: 67, pot: 67, nat: "TR", val: 1089765, wage: 12000 },
    // FWD
    { n: "Cenk Öztürk", pos: "FWD", role: "LW", num: 19, age: 25, ovr: 62, pot: 66, nat: "TR", val: 300000, wage: 12000 },
    { n: "Koray Erdoğan", pos: "FWD", role: "LW", num: 20, age: 19, ovr: 58, pot: 70, nat: "TR", val: 300000, wage: 12000 },
    { n: "Yusuf Ünal", pos: "FWD", role: "RW", num: 21, age: 28, ovr: 68, pot: 68, nat: "TR", val: 1592429, wage: 12000 },
    { n: "Kerem Özkan", pos: "FWD", role: "RW", num: 22, age: 32, ovr: 65, pot: 65, nat: "TR", val: 300000, wage: 12000 },
    { n: "Furkan Aydın", pos: "FWD", role: "ST", num: 23, age: 27, ovr: 62, pot: 62, nat: "TR", val: 300000, wage: 12000 },
    { n: "Burak Çolak", pos: "FWD", role: "ST", num: 24, age: 25, ovr: 66, pot: 70, nat: "TR", val: 917403, wage: 12000 },
    { n: "Halil Başaran", pos: "FWD", role: "ST", num: 25, age: 30, ovr: 61, pot: 61, nat: "TR", val: 300000, wage: 12000 },
  ],
);

const FKG_PACK = pack(
  { id: "fkg", name: "Fatih Karagümrük", short: "FKG", city: "İstanbul", color: "#dc2626", color2: "#111114" },
  [
    // GK
    { n: "Tolga Aydın", pos: "GK", role: "GK", num: 1, age: 21, ovr: 60, pot: 68, nat: "TR", val: 300000, wage: 12000 },
    { n: "Doğan Yalçın", pos: "GK", role: "GK", num: 2, age: 26, ovr: 64, pot: 68, nat: "TR", val: 325672, wage: 12000 },
    { n: "Enes Kılıç", pos: "GK", role: "GK", num: 3, age: 26, ovr: 64, pot: 68, nat: "TR", val: 325672, wage: 12000 },
    // DEF
    { n: "Kaan Kaya", pos: "DEF", role: "CB", num: 4, age: 22, ovr: 65, pot: 73, nat: "TR", val: 692329, wage: 12000 },
    { n: "Halil Çakır", pos: "DEF", role: "CB", num: 5, age: 26, ovr: 64, pot: 68, nat: "TR", val: 325672, wage: 12000 },
    { n: "Efe Öztürk", pos: "DEF", role: "CB", num: 6, age: 20, ovr: 57, pot: 69, nat: "TR", val: 300000, wage: 12000 },
    { n: "Taner Türk", pos: "DEF", role: "CB", num: 7, age: 22, ovr: 60, pot: 68, nat: "TR", val: 300000, wage: 12000 },
    { n: "Onur Öztürk", pos: "DEF", role: "LB", num: 8, age: 21, ovr: 61, pot: 69, nat: "TR", val: 300000, wage: 12000 },
    { n: "Furkan Öztürk", pos: "DEF", role: "LB", num: 9, age: 23, ovr: 59, pot: 67, nat: "TR", val: 300000, wage: 12000 },
    { n: "Ahmet Çolak", pos: "DEF", role: "RB", num: 10, age: 30, ovr: 63, pot: 63, nat: "TR", val: 300000, wage: 12000 },
    { n: "Sinan Güneş", pos: "DEF", role: "RB", num: 11, age: 27, ovr: 66, pot: 66, nat: "TR", val: 713155, wage: 12000 },
    // MID
    { n: "Yunus Korkmaz", pos: "MID", role: "CDM", num: 12, age: 30, ovr: 63, pot: 63, nat: "TR", val: 300000, wage: 12000 },
    { n: "Serkan Başaran", pos: "MID", role: "CDM", num: 13, age: 20, ovr: 61, pot: 73, nat: "TR", val: 300000, wage: 12000 },
    { n: "Umut Kaya", pos: "MID", role: "CM", num: 14, age: 20, ovr: 58, pot: 70, nat: "TR", val: 300000, wage: 12000 },
    { n: "Emre Demir", pos: "MID", role: "CM", num: 15, age: 19, ovr: 56, pot: 68, nat: "TR", val: 300000, wage: 12000 },
    { n: "Barış Özkan", pos: "MID", role: "CM", num: 16, age: 32, ovr: 60, pot: 60, nat: "TR", val: 300000, wage: 12000 },
    { n: "Arda Şahin", pos: "MID", role: "AM", num: 17, age: 18, ovr: 58, pot: 70, nat: "TR", val: 300000, wage: 12000 },
    { n: "Ozan Aslan", pos: "MID", role: "AM", num: 18, age: 29, ovr: 62, pot: 62, nat: "TR", val: 300000, wage: 12000 },
    // FWD
    { n: "Bora Doğan", pos: "FWD", role: "LW", num: 19, age: 18, ovr: 59, pot: 71, nat: "TR", val: 300000, wage: 12000 },
    { n: "Barış Çelik", pos: "FWD", role: "LW", num: 20, age: 34, ovr: 63, pot: 63, nat: "TR", val: 300000, wage: 12000 },
    { n: "Burak Şahin", pos: "FWD", role: "RW", num: 21, age: 21, ovr: 65, pot: 73, nat: "TR", val: 692329, wage: 12000 },
    { n: "Barış Çolak", pos: "FWD", role: "RW", num: 22, age: 22, ovr: 63, pot: 71, nat: "TR", val: 300000, wage: 12000 },
    { n: "Cenk Kaya", pos: "FWD", role: "ST", num: 23, age: 21, ovr: 60, pot: 68, nat: "TR", val: 300000, wage: 12000 },
    { n: "Alperen Erdoğan", pos: "FWD", role: "ST", num: 24, age: 25, ovr: 62, pot: 66, nat: "TR", val: 300000, wage: 12000 },
    { n: "Berke Ünal", pos: "FWD", role: "ST", num: 25, age: 21, ovr: 63, pot: 71, nat: "TR", val: 300000, wage: 12000 },
  ],
);

const PND_PACK = pack(
  { id: "pnd", name: "Pendikspor", short: "PND", city: "İstanbul", color: "#1d4ed8", color2: "#ffffff" },
  [
    // GK
    { n: "Çağlar Şanlı", pos: "GK", role: "GK", num: 1, age: 22, ovr: 59, pot: 67, nat: "TR", val: 300000, wage: 12000 },
    { n: "Ferdi Korkmaz", pos: "GK", role: "GK", num: 2, age: 25, ovr: 67, pot: 71, nat: "TR", val: 1401874, wage: 12000 },
    { n: "Kaan Öztürk", pos: "GK", role: "GK", num: 3, age: 25, ovr: 62, pot: 66, nat: "TR", val: 300000, wage: 12000 },
    // DEF
    { n: "Kaan Özkan", pos: "DEF", role: "CB", num: 4, age: 19, ovr: 62, pot: 74, nat: "TR", val: 300000, wage: 12000 },
    { n: "Kaan Aslan", pos: "DEF", role: "CB", num: 5, age: 29, ovr: 67, pot: 67, nat: "TR", val: 784631, wage: 12000 },
    { n: "Deniz Taş", pos: "DEF", role: "CB", num: 6, age: 22, ovr: 59, pot: 67, nat: "TR", val: 300000, wage: 12000 },
    { n: "Eren Yıldız", pos: "DEF", role: "CB", num: 7, age: 20, ovr: 59, pot: 71, nat: "TR", val: 300000, wage: 12000 },
    { n: "Eren Çakır", pos: "DEF", role: "LB", num: 8, age: 28, ovr: 67, pot: 67, nat: "TR", val: 1089765, wage: 12000 },
    { n: "Tolga Güler", pos: "DEF", role: "LB", num: 9, age: 23, ovr: 63, pot: 71, nat: "TR", val: 300000, wage: 12000 },
    { n: "Mehmet Aydın", pos: "DEF", role: "RB", num: 10, age: 31, ovr: 66, pot: 66, nat: "TR", val: 300000, wage: 12000 },
    { n: "Emre Güler", pos: "DEF", role: "RB", num: 11, age: 33, ovr: 65, pot: 65, nat: "TR", val: 300000, wage: 12000 },
    // MID
    { n: "Mert Yılmaz", pos: "MID", role: "CDM", num: 12, age: 30, ovr: 63, pot: 63, nat: "TR", val: 300000, wage: 12000 },
    { n: "Eren Türk", pos: "MID", role: "CDM", num: 13, age: 22, ovr: 65, pot: 73, nat: "TR", val: 692329, wage: 12000 },
    { n: "Serkan Yıldız", pos: "MID", role: "CM", num: 14, age: 32, ovr: 60, pot: 60, nat: "TR", val: 300000, wage: 12000 },
    { n: "Ahmet Aslan", pos: "MID", role: "CM", num: 15, age: 31, ovr: 60, pot: 60, nat: "TR", val: 300000, wage: 12000 },
    { n: "Yiğit Arslan", pos: "MID", role: "CM", num: 16, age: 22, ovr: 60, pot: 68, nat: "TR", val: 300000, wage: 12000 },
    { n: "Berke Güler", pos: "MID", role: "AM", num: 17, age: 20, ovr: 60, pot: 72, nat: "TR", val: 300000, wage: 12000 },
    { n: "Kuzey Sezer", pos: "MID", role: "AM", num: 18, age: 22, ovr: 60, pot: 68, nat: "TR", val: 300000, wage: 12000 },
    // FWD
    { n: "Hakan Güneş", pos: "FWD", role: "LW", num: 19, age: 23, ovr: 63, pot: 71, nat: "TR", val: 300000, wage: 12000 },
    { n: "Yusuf Çelik", pos: "FWD", role: "LW", num: 20, age: 25, ovr: 67, pot: 71, nat: "TR", val: 1401874, wage: 12000 },
    { n: "Ahmet Bulut", pos: "FWD", role: "RW", num: 21, age: 21, ovr: 62, pot: 70, nat: "TR", val: 300000, wage: 12000 },
    { n: "Kuzey Taş", pos: "FWD", role: "RW", num: 22, age: 29, ovr: 68, pot: 68, nat: "TR", val: 1146549, wage: 12000 },
    { n: "Koray Akın", pos: "FWD", role: "ST", num: 23, age: 25, ovr: 63, pot: 67, nat: "TR", val: 300000, wage: 12000 },
    { n: "Sinan Çakır", pos: "FWD", role: "ST", num: 24, age: 31, ovr: 65, pot: 65, nat: "TR", val: 300000, wage: 12000 },
    { n: "Furkan Çolak", pos: "FWD", role: "ST", num: 25, age: 32, ovr: 66, pot: 66, nat: "TR", val: 300000, wage: 12000 },
  ],
);

const BOL_PACK = pack(
  { id: "bol", name: "Boluspor", short: "BOL", city: "Bolu", color: "#dc2626", color2: "#ffffff" },
  [
    // GK
    { n: "Volkan Bulut", pos: "GK", role: "GK", num: 1, age: 28, ovr: 68, pot: 68, nat: "TR", val: 1592429, wage: 12000 },
    { n: "Mert Çolak", pos: "GK", role: "GK", num: 2, age: 27, ovr: 65, pot: 65, nat: "TR", val: 440974, wage: 12000 },
    { n: "Deniz Akın", pos: "GK", role: "GK", num: 3, age: 32, ovr: 60, pot: 60, nat: "TR", val: 300000, wage: 12000 },
    // DEF
    { n: "Onur Akın", pos: "DEF", role: "CB", num: 4, age: 20, ovr: 62, pot: 74, nat: "TR", val: 300000, wage: 12000 },
    { n: "Yusuf Yalçın", pos: "DEF", role: "CB", num: 5, age: 27, ovr: 68, pot: 68, nat: "TR", val: 1592429, wage: 12000 },
    { n: "Burak Erdoğan", pos: "DEF", role: "CB", num: 6, age: 23, ovr: 60, pot: 68, nat: "TR", val: 300000, wage: 12000 },
    { n: "Emre Akgün", pos: "DEF", role: "CB", num: 7, age: 29, ovr: 67, pot: 67, nat: "TR", val: 784631, wage: 12000 },
    { n: "Efe Çakır", pos: "DEF", role: "LB", num: 8, age: 21, ovr: 59, pot: 67, nat: "TR", val: 300000, wage: 12000 },
    { n: "Berke Başaran", pos: "DEF", role: "LB", num: 9, age: 18, ovr: 58, pot: 70, nat: "TR", val: 300000, wage: 12000 },
    { n: "Kaan Demir", pos: "DEF", role: "RB", num: 10, age: 27, ovr: 68, pot: 68, nat: "TR", val: 1592429, wage: 12000 },
    { n: "Semih Özkan", pos: "DEF", role: "RB", num: 11, age: 30, ovr: 60, pot: 60, nat: "TR", val: 300000, wage: 12000 },
    // MID
    { n: "Semih Polat", pos: "MID", role: "CDM", num: 12, age: 25, ovr: 64, pot: 68, nat: "TR", val: 325672, wage: 12000 },
    { n: "Ege Aslan", pos: "MID", role: "CDM", num: 13, age: 28, ovr: 66, pot: 66, nat: "TR", val: 713155, wage: 12000 },
    { n: "Çağlar Yılmaz", pos: "MID", role: "CM", num: 14, age: 31, ovr: 60, pot: 60, nat: "TR", val: 300000, wage: 12000 },
    { n: "Enes Akgün", pos: "MID", role: "CM", num: 15, age: 30, ovr: 66, pot: 66, nat: "TR", val: 513472, wage: 12000 },
    { n: "Kerem Korkmaz", pos: "MID", role: "CM", num: 16, age: 25, ovr: 62, pot: 66, nat: "TR", val: 300000, wage: 12000 },
    { n: "Kaan Korkmaz", pos: "MID", role: "AM", num: 17, age: 34, ovr: 62, pot: 62, nat: "TR", val: 300000, wage: 12000 },
    { n: "Kaan Doğan", pos: "MID", role: "AM", num: 18, age: 32, ovr: 65, pot: 65, nat: "TR", val: 300000, wage: 12000 },
    // FWD
    { n: "Burak Öztürk", pos: "FWD", role: "LW", num: 19, age: 33, ovr: 60, pot: 60, nat: "TR", val: 300000, wage: 12000 },
    { n: "Volkan Koç", pos: "FWD", role: "LW", num: 20, age: 20, ovr: 59, pot: 71, nat: "TR", val: 300000, wage: 12000 },
    { n: "Eren Koç", pos: "FWD", role: "RW", num: 21, age: 21, ovr: 65, pot: 73, nat: "TR", val: 692329, wage: 12000 },
    { n: "Hakan Demir", pos: "FWD", role: "RW", num: 22, age: 18, ovr: 57, pot: 69, nat: "TR", val: 300000, wage: 12000 },
    { n: "Kerem Akgün", pos: "FWD", role: "ST", num: 23, age: 28, ovr: 63, pot: 63, nat: "TR", val: 300000, wage: 12000 },
    { n: "Yiğit Erdoğan", pos: "FWD", role: "ST", num: 24, age: 33, ovr: 61, pot: 61, nat: "TR", val: 300000, wage: 12000 },
    { n: "Umut Kaya", pos: "FWD", role: "ST", num: 25, age: 31, ovr: 66, pot: 66, nat: "TR", val: 300000, wage: 12000 },
  ],
);

const MR_PACK = pack(
  { id: "umr", name: "Ümraniyespor", short: "ÜMR", city: "İstanbul", color: "#dc2626", color2: "#facc15" },
  [
    // GK
    { n: "Eren Türk", pos: "GK", role: "GK", num: 1, age: 28, ovr: 68, pot: 68, nat: "TR", val: 1592429, wage: 12000 },
    { n: "Yiğit Başaran", pos: "GK", role: "GK", num: 2, age: 23, ovr: 59, pot: 67, nat: "TR", val: 300000, wage: 12000 },
    { n: "Tolga Taş", pos: "GK", role: "GK", num: 3, age: 34, ovr: 60, pot: 60, nat: "TR", val: 300000, wage: 12000 },
    // DEF
    { n: "Furkan Kılıç", pos: "DEF", role: "CB", num: 4, age: 20, ovr: 62, pot: 74, nat: "TR", val: 300000, wage: 12000 },
    { n: "Yusuf Aydın", pos: "DEF", role: "CB", num: 5, age: 21, ovr: 60, pot: 68, nat: "TR", val: 300000, wage: 12000 },
    { n: "Tolga Bulut", pos: "DEF", role: "CB", num: 6, age: 28, ovr: 64, pot: 64, nat: "TR", val: 300000, wage: 12000 },
    { n: "Hakan Sezer", pos: "DEF", role: "CB", num: 7, age: 24, ovr: 66, pot: 70, nat: "TR", val: 917403, wage: 12000 },
    { n: "Bora Demir", pos: "DEF", role: "LB", num: 8, age: 27, ovr: 67, pot: 67, nat: "TR", val: 1089765, wage: 12000 },
    { n: "Burak Özkan", pos: "DEF", role: "LB", num: 9, age: 31, ovr: 64, pot: 64, nat: "TR", val: 300000, wage: 12000 },
    { n: "Mehmet Akgün", pos: "DEF", role: "RB", num: 10, age: 21, ovr: 62, pot: 70, nat: "TR", val: 300000, wage: 12000 },
    { n: "Ahmet Yılmaz", pos: "DEF", role: "RB", num: 11, age: 18, ovr: 58, pot: 70, nat: "TR", val: 300000, wage: 12000 },
    // MID
    { n: "Mehmet Arslan", pos: "MID", role: "CDM", num: 12, age: 19, ovr: 57, pot: 69, nat: "TR", val: 300000, wage: 12000 },
    { n: "Eren Güneş", pos: "MID", role: "CDM", num: 13, age: 27, ovr: 65, pot: 65, nat: "TR", val: 440974, wage: 12000 },
    { n: "Halil Doğan", pos: "MID", role: "CM", num: 14, age: 22, ovr: 60, pot: 68, nat: "TR", val: 300000, wage: 12000 },
    { n: "Sinan Güneş", pos: "MID", role: "CM", num: 15, age: 31, ovr: 63, pot: 63, nat: "TR", val: 300000, wage: 12000 },
    { n: "Halil Korkmaz", pos: "MID", role: "CM", num: 16, age: 33, ovr: 64, pot: 64, nat: "TR", val: 300000, wage: 12000 },
    { n: "Bora Özkan", pos: "MID", role: "AM", num: 17, age: 29, ovr: 65, pot: 65, nat: "TR", val: 317501, wage: 12000 },
    { n: "Serkan Türk", pos: "MID", role: "AM", num: 18, age: 20, ovr: 58, pot: 70, nat: "TR", val: 300000, wage: 12000 },
    // FWD
    { n: "Deniz Kaya", pos: "FWD", role: "LW", num: 19, age: 25, ovr: 63, pot: 67, nat: "TR", val: 300000, wage: 12000 },
    { n: "Ege Erdoğan", pos: "FWD", role: "LW", num: 20, age: 21, ovr: 64, pot: 72, nat: "TR", val: 397470, wage: 12000 },
    { n: "Bora Aydın", pos: "FWD", role: "RW", num: 21, age: 24, ovr: 65, pot: 69, nat: "TR", val: 567269, wage: 12000 },
    { n: "Doğan Arslan", pos: "FWD", role: "RW", num: 22, age: 31, ovr: 64, pot: 64, nat: "TR", val: 300000, wage: 12000 },
    { n: "Batuhan Aslan", pos: "FWD", role: "ST", num: 23, age: 34, ovr: 65, pot: 65, nat: "TR", val: 300000, wage: 12000 },
    { n: "Onur Aslan", pos: "FWD", role: "ST", num: 24, age: 34, ovr: 66, pot: 66, nat: "TR", val: 300000, wage: 12000 },
    { n: "Doğan Güneş", pos: "FWD", role: "ST", num: 25, age: 23, ovr: 65, pot: 73, nat: "TR", val: 692329, wage: 12000 },
  ],
);

const ST_PACK = pack(
  { id: "ist", name: "İstanbulspor", short: "İST", city: "İstanbul", color: "#facc15", color2: "#111114" },
  [
    // GK
    { n: "Çağlar Erdoğan", pos: "GK", role: "GK", num: 1, age: 21, ovr: 61, pot: 69, nat: "TR", val: 300000, wage: 12000 },
    { n: "Serkan Şanlı", pos: "GK", role: "GK", num: 2, age: 19, ovr: 59, pot: 71, nat: "TR", val: 300000, wage: 12000 },
    { n: "Koray Başaran", pos: "GK", role: "GK", num: 3, age: 25, ovr: 66, pot: 70, nat: "TR", val: 917403, wage: 12000 },
    // DEF
    { n: "Furkan Polat", pos: "DEF", role: "CB", num: 4, age: 30, ovr: 64, pot: 64, nat: "TR", val: 300000, wage: 12000 },
    { n: "Doğan Yılmaz", pos: "DEF", role: "CB", num: 5, age: 34, ovr: 64, pot: 64, nat: "TR", val: 300000, wage: 12000 },
    { n: "Burak Türk", pos: "DEF", role: "CB", num: 6, age: 29, ovr: 67, pot: 67, nat: "TR", val: 784631, wage: 12000 },
    { n: "Furkan Çakır", pos: "DEF", role: "CB", num: 7, age: 25, ovr: 67, pot: 71, nat: "TR", val: 1401874, wage: 12000 },
    { n: "Furkan Türk", pos: "DEF", role: "LB", num: 8, age: 19, ovr: 62, pot: 74, nat: "TR", val: 300000, wage: 12000 },
    { n: "Ozan Sezer", pos: "DEF", role: "LB", num: 9, age: 24, ovr: 66, pot: 70, nat: "TR", val: 917403, wage: 12000 },
    { n: "Koray Çelik", pos: "DEF", role: "RB", num: 10, age: 31, ovr: 61, pot: 61, nat: "TR", val: 300000, wage: 12000 },
    { n: "Bora Yalçın", pos: "DEF", role: "RB", num: 11, age: 25, ovr: 65, pot: 69, nat: "TR", val: 567269, wage: 12000 },
    // MID
    { n: "Emre Ünal", pos: "MID", role: "CDM", num: 12, age: 26, ovr: 67, pot: 71, nat: "TR", val: 1401874, wage: 12000 },
    { n: "Yusuf Aslan", pos: "MID", role: "CDM", num: 13, age: 32, ovr: 65, pot: 65, nat: "TR", val: 300000, wage: 12000 },
    { n: "Halil Çelik", pos: "MID", role: "CM", num: 14, age: 34, ovr: 63, pot: 63, nat: "TR", val: 300000, wage: 12000 },
    { n: "Deniz Yılmaz", pos: "MID", role: "CM", num: 15, age: 22, ovr: 61, pot: 69, nat: "TR", val: 300000, wage: 12000 },
    { n: "Cenk Güneş", pos: "MID", role: "CM", num: 16, age: 19, ovr: 60, pot: 72, nat: "TR", val: 300000, wage: 12000 },
    { n: "Berke Güneş", pos: "MID", role: "AM", num: 17, age: 30, ovr: 64, pot: 64, nat: "TR", val: 300000, wage: 12000 },
    { n: "Ege Şanlı", pos: "MID", role: "AM", num: 18, age: 24, ovr: 65, pot: 69, nat: "TR", val: 567269, wage: 12000 },
    // FWD
    { n: "Furkan Güneş", pos: "FWD", role: "LW", num: 19, age: 22, ovr: 62, pot: 70, nat: "TR", val: 300000, wage: 12000 },
    { n: "Yunus Doğan", pos: "FWD", role: "LW", num: 20, age: 32, ovr: 63, pot: 63, nat: "TR", val: 300000, wage: 12000 },
    { n: "Furkan Aslan", pos: "FWD", role: "RW", num: 21, age: 27, ovr: 68, pot: 68, nat: "TR", val: 1592429, wage: 12000 },
    { n: "Yusuf Erdoğan", pos: "FWD", role: "RW", num: 22, age: 19, ovr: 56, pot: 68, nat: "TR", val: 300000, wage: 12000 },
    { n: "Hakan Öztürk", pos: "FWD", role: "ST", num: 23, age: 32, ovr: 64, pot: 64, nat: "TR", val: 300000, wage: 12000 },
    { n: "Doğan Aydın", pos: "FWD", role: "ST", num: 24, age: 30, ovr: 62, pot: 62, nat: "TR", val: 300000, wage: 12000 },
    { n: "Bora Türk", pos: "FWD", role: "ST", num: 25, age: 25, ovr: 65, pot: 69, nat: "TR", val: 567269, wage: 12000 },
  ],
);

const SAR_PACK = pack(
  { id: "sar", name: "Sarıyer", short: "SAR", city: "İstanbul", color: "#1d4ed8", color2: "#ffffff" },
  [
    // GK
    { n: "Doğan Ünal", pos: "GK", role: "GK", num: 1, age: 24, ovr: 67, pot: 71, nat: "TR", val: 1401874, wage: 12000 },
    { n: "Berke Korkmaz", pos: "GK", role: "GK", num: 2, age: 19, ovr: 60, pot: 72, nat: "TR", val: 300000, wage: 12000 },
    { n: "Arda Bulut", pos: "GK", role: "GK", num: 3, age: 21, ovr: 65, pot: 73, nat: "TR", val: 692329, wage: 12000 },
    // DEF
    { n: "Efe Şahin", pos: "DEF", role: "CB", num: 4, age: 25, ovr: 62, pot: 66, nat: "TR", val: 300000, wage: 12000 },
    { n: "Halil Çelik", pos: "DEF", role: "CB", num: 5, age: 28, ovr: 66, pot: 66, nat: "TR", val: 713155, wage: 12000 },
    { n: "Hakan Özkan", pos: "DEF", role: "CB", num: 6, age: 33, ovr: 65, pot: 65, nat: "TR", val: 300000, wage: 12000 },
    { n: "Sinan Şanlı", pos: "DEF", role: "CB", num: 7, age: 34, ovr: 60, pot: 60, nat: "TR", val: 300000, wage: 12000 },
    { n: "Onur Güneş", pos: "DEF", role: "LB", num: 8, age: 19, ovr: 60, pot: 72, nat: "TR", val: 300000, wage: 12000 },
    { n: "Ferdi Güneş", pos: "DEF", role: "LB", num: 9, age: 21, ovr: 65, pot: 73, nat: "TR", val: 692329, wage: 12000 },
    { n: "Taner Türk", pos: "DEF", role: "RB", num: 10, age: 18, ovr: 62, pot: 74, nat: "TR", val: 300000, wage: 12000 },
    { n: "Semih Akgün", pos: "DEF", role: "RB", num: 11, age: 18, ovr: 62, pot: 74, nat: "TR", val: 300000, wage: 12000 },
    // MID
    { n: "Umut Güler", pos: "MID", role: "CDM", num: 12, age: 20, ovr: 58, pot: 70, nat: "TR", val: 300000, wage: 12000 },
    { n: "Alperen Çolak", pos: "MID", role: "CDM", num: 13, age: 21, ovr: 64, pot: 72, nat: "TR", val: 397470, wage: 12000 },
    { n: "Arda Özkan", pos: "MID", role: "CM", num: 14, age: 21, ovr: 60, pot: 68, nat: "TR", val: 300000, wage: 12000 },
    { n: "Ozan Yıldız", pos: "MID", role: "CM", num: 15, age: 23, ovr: 64, pot: 72, nat: "TR", val: 397470, wage: 12000 },
    { n: "Volkan Yalçın", pos: "MID", role: "CM", num: 16, age: 29, ovr: 68, pot: 68, nat: "TR", val: 1146549, wage: 12000 },
    { n: "Çağlar Erdoğan", pos: "MID", role: "AM", num: 17, age: 33, ovr: 66, pot: 66, nat: "TR", val: 300000, wage: 12000 },
    { n: "Batuhan Sezer", pos: "MID", role: "AM", num: 18, age: 25, ovr: 68, pot: 72, nat: "TR", val: 2048500, wage: 12000 },
    // FWD
    { n: "Deniz Yıldız", pos: "FWD", role: "LW", num: 19, age: 26, ovr: 64, pot: 68, nat: "TR", val: 325672, wage: 12000 },
    { n: "Ferdi Türk", pos: "FWD", role: "LW", num: 20, age: 33, ovr: 66, pot: 66, nat: "TR", val: 300000, wage: 12000 },
    { n: "Volkan Akın", pos: "FWD", role: "RW", num: 21, age: 29, ovr: 65, pot: 65, nat: "TR", val: 317501, wage: 12000 },
    { n: "Furkan Arslan", pos: "FWD", role: "RW", num: 22, age: 34, ovr: 63, pot: 63, nat: "TR", val: 300000, wage: 12000 },
    { n: "Cenk Sezer", pos: "FWD", role: "ST", num: 23, age: 27, ovr: 64, pot: 64, nat: "TR", val: 300000, wage: 12000 },
    { n: "Çağlar Çelik", pos: "FWD", role: "ST", num: 24, age: 18, ovr: 58, pot: 70, nat: "TR", val: 300000, wage: 12000 },
    { n: "Mert Kaya", pos: "FWD", role: "ST", num: 25, age: 28, ovr: 68, pot: 68, nat: "TR", val: 1592429, wage: 12000 },
  ],
);

const MAN_PACK = pack(
  { id: "man", name: "Manisa FK", short: "MAN", city: "Manisa", color: "#111114", color2: "#facc15" },
  [
    // GK
    { n: "Koray Başaran", pos: "GK", role: "GK", num: 1, age: 33, ovr: 65, pot: 65, nat: "TR", val: 300000, wage: 12000 },
    { n: "Onur Aslan", pos: "GK", role: "GK", num: 2, age: 34, ovr: 66, pot: 66, nat: "TR", val: 300000, wage: 12000 },
    { n: "Halil Şahin", pos: "GK", role: "GK", num: 3, age: 28, ovr: 63, pot: 63, nat: "TR", val: 300000, wage: 12000 },
    // DEF
    { n: "Halil Güneş", pos: "DEF", role: "CB", num: 4, age: 19, ovr: 61, pot: 73, nat: "TR", val: 300000, wage: 12000 },
    { n: "Tolga Güneş", pos: "DEF", role: "CB", num: 5, age: 24, ovr: 64, pot: 68, nat: "TR", val: 325672, wage: 12000 },
    { n: "Deniz Arslan", pos: "DEF", role: "CB", num: 6, age: 29, ovr: 65, pot: 65, nat: "TR", val: 317501, wage: 12000 },
    { n: "Barış Yılmaz", pos: "DEF", role: "CB", num: 7, age: 19, ovr: 56, pot: 68, nat: "TR", val: 300000, wage: 12000 },
    { n: "Cenk Polat", pos: "DEF", role: "LB", num: 8, age: 27, ovr: 65, pot: 65, nat: "TR", val: 440974, wage: 12000 },
    { n: "Mert Çelik", pos: "DEF", role: "LB", num: 9, age: 27, ovr: 63, pot: 63, nat: "TR", val: 300000, wage: 12000 },
    { n: "Kerem Koç", pos: "DEF", role: "RB", num: 10, age: 24, ovr: 67, pot: 71, nat: "TR", val: 1401874, wage: 12000 },
    { n: "Halil Güler", pos: "DEF", role: "RB", num: 11, age: 31, ovr: 66, pot: 66, nat: "TR", val: 300000, wage: 12000 },
    // MID
    { n: "Ege Yılmaz", pos: "MID", role: "CDM", num: 12, age: 21, ovr: 60, pot: 68, nat: "TR", val: 300000, wage: 12000 },
    { n: "Ahmet Erdoğan", pos: "MID", role: "CDM", num: 13, age: 22, ovr: 59, pot: 67, nat: "TR", val: 300000, wage: 12000 },
    { n: "Yusuf Kılıç", pos: "MID", role: "CM", num: 14, age: 34, ovr: 62, pot: 62, nat: "TR", val: 300000, wage: 12000 },
    { n: "Enes Arslan", pos: "MID", role: "CM", num: 15, age: 24, ovr: 62, pot: 66, nat: "TR", val: 300000, wage: 12000 },
    { n: "Çağlar Aydın", pos: "MID", role: "CM", num: 16, age: 18, ovr: 61, pot: 73, nat: "TR", val: 300000, wage: 12000 },
    { n: "Çağlar Kaya", pos: "MID", role: "AM", num: 17, age: 29, ovr: 66, pot: 66, nat: "TR", val: 513472, wage: 12000 },
    { n: "Serkan Güneş", pos: "MID", role: "AM", num: 18, age: 34, ovr: 64, pot: 64, nat: "TR", val: 300000, wage: 12000 },
    // FWD
    { n: "Efe Güler", pos: "FWD", role: "LW", num: 19, age: 33, ovr: 63, pot: 63, nat: "TR", val: 300000, wage: 12000 },
    { n: "Kerem Ünal", pos: "FWD", role: "LW", num: 20, age: 29, ovr: 65, pot: 65, nat: "TR", val: 317501, wage: 12000 },
    { n: "Arda Şanlı", pos: "FWD", role: "RW", num: 21, age: 29, ovr: 68, pot: 68, nat: "TR", val: 1146549, wage: 12000 },
    { n: "Eren Ünal", pos: "FWD", role: "RW", num: 22, age: 34, ovr: 63, pot: 63, nat: "TR", val: 300000, wage: 12000 },
    { n: "Yunus Yalçın", pos: "FWD", role: "ST", num: 23, age: 22, ovr: 65, pot: 73, nat: "TR", val: 692329, wage: 12000 },
    { n: "Berke Türk", pos: "FWD", role: "ST", num: 24, age: 24, ovr: 64, pot: 68, nat: "TR", val: 325672, wage: 12000 },
    { n: "Deniz Sezer", pos: "FWD", role: "ST", num: 25, age: 33, ovr: 66, pot: 66, nat: "TR", val: 300000, wage: 12000 },
  ],
);

const BND_PACK = pack(
  { id: "bnd", name: "Bandırmaspor", short: "BND", city: "Bandırma", color: "#dc2626", color2: "#111114" },
  [
    // GK
    { n: "Mert Sezer", pos: "GK", role: "GK", num: 1, age: 27, ovr: 68, pot: 68, nat: "TR", val: 1592429, wage: 12000 },
    { n: "Efe Çolak", pos: "GK", role: "GK", num: 2, age: 33, ovr: 64, pot: 64, nat: "TR", val: 300000, wage: 12000 },
    { n: "Kaan Akın", pos: "GK", role: "GK", num: 3, age: 18, ovr: 62, pot: 74, nat: "TR", val: 300000, wage: 12000 },
    // DEF
    { n: "Furkan Yılmaz", pos: "DEF", role: "CB", num: 4, age: 26, ovr: 64, pot: 68, nat: "TR", val: 325672, wage: 12000 },
    { n: "Yusuf Polat", pos: "DEF", role: "CB", num: 5, age: 20, ovr: 56, pot: 68, nat: "TR", val: 300000, wage: 12000 },
    { n: "Hakan Şahin", pos: "DEF", role: "CB", num: 6, age: 29, ovr: 65, pot: 65, nat: "TR", val: 317501, wage: 12000 },
    { n: "Berke Başaran", pos: "DEF", role: "CB", num: 7, age: 31, ovr: 66, pot: 66, nat: "TR", val: 300000, wage: 12000 },
    { n: "Doğan Yıldız", pos: "DEF", role: "LB", num: 8, age: 18, ovr: 59, pot: 71, nat: "TR", val: 300000, wage: 12000 },
    { n: "Emre Ünal", pos: "DEF", role: "LB", num: 9, age: 27, ovr: 67, pot: 67, nat: "TR", val: 1089765, wage: 12000 },
    { n: "Umut Güneş", pos: "DEF", role: "RB", num: 10, age: 33, ovr: 60, pot: 60, nat: "TR", val: 300000, wage: 12000 },
    { n: "Mehmet Çolak", pos: "DEF", role: "RB", num: 11, age: 29, ovr: 66, pot: 66, nat: "TR", val: 513472, wage: 12000 },
    // MID
    { n: "Kerem Polat", pos: "MID", role: "CDM", num: 12, age: 27, ovr: 64, pot: 64, nat: "TR", val: 300000, wage: 12000 },
    { n: "Koray Çolak", pos: "MID", role: "CDM", num: 13, age: 28, ovr: 65, pot: 65, nat: "TR", val: 440974, wage: 12000 },
    { n: "Çağlar Aslan", pos: "MID", role: "CM", num: 14, age: 18, ovr: 61, pot: 73, nat: "TR", val: 300000, wage: 12000 },
    { n: "Halil Başaran", pos: "MID", role: "CM", num: 15, age: 34, ovr: 62, pot: 62, nat: "TR", val: 300000, wage: 12000 },
    { n: "Yusuf Ünal", pos: "MID", role: "CM", num: 16, age: 34, ovr: 63, pot: 63, nat: "TR", val: 300000, wage: 12000 },
    { n: "Emre Türk", pos: "MID", role: "AM", num: 17, age: 19, ovr: 57, pot: 69, nat: "TR", val: 300000, wage: 12000 },
    { n: "Serkan Türk", pos: "MID", role: "AM", num: 18, age: 33, ovr: 66, pot: 66, nat: "TR", val: 300000, wage: 12000 },
    // FWD
    { n: "Yusuf Öztürk", pos: "FWD", role: "LW", num: 19, age: 20, ovr: 60, pot: 72, nat: "TR", val: 300000, wage: 12000 },
    { n: "Ege Koç", pos: "FWD", role: "LW", num: 20, age: 32, ovr: 65, pot: 65, nat: "TR", val: 300000, wage: 12000 },
    { n: "Serkan Koç", pos: "FWD", role: "RW", num: 21, age: 23, ovr: 60, pot: 68, nat: "TR", val: 300000, wage: 12000 },
    { n: "Semih Duman", pos: "FWD", role: "RW", num: 22, age: 30, ovr: 65, pot: 65, nat: "TR", val: 317501, wage: 12000 },
    { n: "Görkem Özkan", pos: "FWD", role: "ST", num: 23, age: 25, ovr: 62, pot: 66, nat: "TR", val: 300000, wage: 12000 },
    { n: "Çağlar Şahin", pos: "FWD", role: "ST", num: 24, age: 30, ovr: 66, pot: 66, nat: "TR", val: 513472, wage: 12000 },
    { n: "Yusuf Aslan", pos: "FWD", role: "ST", num: 25, age: 21, ovr: 61, pot: 69, nat: "TR", val: 300000, wage: 12000 },
  ],
);

const ESR_PACK = pack(
  { id: "esr", name: "Esenler Erokspor", short: "ESR", city: "İstanbul", color: "#7c3aed", color2: "#ffffff" },
  [
    // GK
    { n: "Doğan Bulut", pos: "GK", role: "GK", num: 1, age: 21, ovr: 63, pot: 71, nat: "TR", val: 300000, wage: 12000 },
    { n: "Semih Çelik", pos: "GK", role: "GK", num: 2, age: 34, ovr: 62, pot: 62, nat: "TR", val: 300000, wage: 12000 },
    { n: "Arda Çakır", pos: "GK", role: "GK", num: 3, age: 20, ovr: 62, pot: 74, nat: "TR", val: 300000, wage: 12000 },
    // DEF
    { n: "Halil Yılmaz", pos: "DEF", role: "CB", num: 4, age: 24, ovr: 68, pot: 72, nat: "TR", val: 2048500, wage: 12000 },
    { n: "Sinan Arslan", pos: "DEF", role: "CB", num: 5, age: 31, ovr: 66, pot: 66, nat: "TR", val: 300000, wage: 12000 },
    { n: "Koray Koç", pos: "DEF", role: "CB", num: 6, age: 23, ovr: 59, pot: 67, nat: "TR", val: 300000, wage: 12000 },
    { n: "Cenk Akın", pos: "DEF", role: "CB", num: 7, age: 23, ovr: 60, pot: 68, nat: "TR", val: 300000, wage: 12000 },
    { n: "Burak Korkmaz", pos: "DEF", role: "LB", num: 8, age: 33, ovr: 62, pot: 62, nat: "TR", val: 300000, wage: 12000 },
    { n: "Hakan Çelik", pos: "DEF", role: "LB", num: 9, age: 25, ovr: 67, pot: 71, nat: "TR", val: 1401874, wage: 12000 },
    { n: "Taner Çolak", pos: "DEF", role: "RB", num: 10, age: 19, ovr: 56, pot: 68, nat: "TR", val: 300000, wage: 12000 },
    { n: "Kaan Koç", pos: "DEF", role: "RB", num: 11, age: 25, ovr: 65, pot: 69, nat: "TR", val: 567269, wage: 12000 },
    // MID
    { n: "Arda Ünal", pos: "MID", role: "CDM", num: 12, age: 30, ovr: 63, pot: 63, nat: "TR", val: 300000, wage: 12000 },
    { n: "Deniz Akın", pos: "MID", role: "CDM", num: 13, age: 34, ovr: 66, pot: 66, nat: "TR", val: 300000, wage: 12000 },
    { n: "Koray Polat", pos: "MID", role: "CM", num: 14, age: 30, ovr: 63, pot: 63, nat: "TR", val: 300000, wage: 12000 },
    { n: "Yunus Çelik", pos: "MID", role: "CM", num: 15, age: 28, ovr: 66, pot: 66, nat: "TR", val: 713155, wage: 12000 },
    { n: "Berke Özkan", pos: "MID", role: "CM", num: 16, age: 30, ovr: 64, pot: 64, nat: "TR", val: 300000, wage: 12000 },
    { n: "Tolga Çolak", pos: "MID", role: "AM", num: 17, age: 25, ovr: 66, pot: 70, nat: "TR", val: 917403, wage: 12000 },
    { n: "Burak Bulut", pos: "MID", role: "AM", num: 18, age: 25, ovr: 67, pot: 71, nat: "TR", val: 1401874, wage: 12000 },
    // FWD
    { n: "Yiğit Aydın", pos: "FWD", role: "LW", num: 19, age: 32, ovr: 63, pot: 63, nat: "TR", val: 300000, wage: 12000 },
    { n: "Onur Başaran", pos: "FWD", role: "LW", num: 20, age: 22, ovr: 59, pot: 67, nat: "TR", val: 300000, wage: 12000 },
    { n: "Çağlar Koç", pos: "FWD", role: "RW", num: 21, age: 19, ovr: 60, pot: 72, nat: "TR", val: 300000, wage: 12000 },
    { n: "Görkem Türk", pos: "FWD", role: "RW", num: 22, age: 23, ovr: 62, pot: 70, nat: "TR", val: 300000, wage: 12000 },
    { n: "Ahmet Duman", pos: "FWD", role: "ST", num: 23, age: 28, ovr: 66, pot: 66, nat: "TR", val: 713155, wage: 12000 },
    { n: "Enes Çakır", pos: "FWD", role: "ST", num: 24, age: 27, ovr: 68, pot: 68, nat: "TR", val: 1592429, wage: 12000 },
    { n: "Cenk Çakır", pos: "FWD", role: "ST", num: 25, age: 19, ovr: 60, pot: 72, nat: "TR", val: 300000, wage: 12000 },
  ],
);

const KE_PACK = pack(
  { id: "kec", name: "Keçiörengücü", short: "KEÇ", city: "Ankara", color: "#1d4ed8", color2: "#facc15" },
  [
    // GK
    { n: "Efe Yalçın", pos: "GK", role: "GK", num: 1, age: 30, ovr: 62, pot: 62, nat: "TR", val: 300000, wage: 12000 },
    { n: "Burak Öztürk", pos: "GK", role: "GK", num: 2, age: 34, ovr: 65, pot: 65, nat: "TR", val: 300000, wage: 12000 },
    { n: "Burak Duman", pos: "GK", role: "GK", num: 3, age: 22, ovr: 60, pot: 68, nat: "TR", val: 300000, wage: 12000 },
    // DEF
    { n: "Ferdi Korkmaz", pos: "DEF", role: "CB", num: 4, age: 33, ovr: 60, pot: 60, nat: "TR", val: 300000, wage: 12000 },
    { n: "Koray Arslan", pos: "DEF", role: "CB", num: 5, age: 21, ovr: 63, pot: 71, nat: "TR", val: 300000, wage: 12000 },
    { n: "Barış Güneş", pos: "DEF", role: "CB", num: 6, age: 34, ovr: 64, pot: 64, nat: "TR", val: 300000, wage: 12000 },
    { n: "Onur Bulut", pos: "DEF", role: "CB", num: 7, age: 31, ovr: 62, pot: 62, nat: "TR", val: 300000, wage: 12000 },
    { n: "Yusuf Akın", pos: "DEF", role: "LB", num: 8, age: 22, ovr: 65, pot: 73, nat: "TR", val: 692329, wage: 12000 },
    { n: "Deniz Yılmaz", pos: "DEF", role: "LB", num: 9, age: 20, ovr: 56, pot: 68, nat: "TR", val: 300000, wage: 12000 },
    { n: "Onur Sezer", pos: "DEF", role: "RB", num: 10, age: 26, ovr: 64, pot: 68, nat: "TR", val: 325672, wage: 12000 },
    { n: "Volkan Yılmaz", pos: "DEF", role: "RB", num: 11, age: 29, ovr: 68, pot: 68, nat: "TR", val: 1146549, wage: 12000 },
    // MID
    { n: "Onur Şanlı", pos: "MID", role: "CDM", num: 12, age: 18, ovr: 58, pot: 70, nat: "TR", val: 300000, wage: 12000 },
    { n: "Mehmet Doğan", pos: "MID", role: "CDM", num: 13, age: 33, ovr: 62, pot: 62, nat: "TR", val: 300000, wage: 12000 },
    { n: "Ege Şahin", pos: "MID", role: "CM", num: 14, age: 27, ovr: 64, pot: 64, nat: "TR", val: 300000, wage: 12000 },
    { n: "Halil Sezer", pos: "MID", role: "CM", num: 15, age: 18, ovr: 61, pot: 73, nat: "TR", val: 300000, wage: 12000 },
    { n: "Eren Türk", pos: "MID", role: "CM", num: 16, age: 26, ovr: 63, pot: 67, nat: "TR", val: 300000, wage: 12000 },
    { n: "Serkan Erdoğan", pos: "MID", role: "AM", num: 17, age: 29, ovr: 65, pot: 65, nat: "TR", val: 317501, wage: 12000 },
    { n: "Görkem Çolak", pos: "MID", role: "AM", num: 18, age: 25, ovr: 66, pot: 70, nat: "TR", val: 917403, wage: 12000 },
    // FWD
    { n: "Hakan Demir", pos: "FWD", role: "LW", num: 19, age: 31, ovr: 63, pot: 63, nat: "TR", val: 300000, wage: 12000 },
    { n: "Ozan Erdoğan", pos: "FWD", role: "LW", num: 20, age: 31, ovr: 63, pot: 63, nat: "TR", val: 300000, wage: 12000 },
    { n: "Doğan Yalçın", pos: "FWD", role: "RW", num: 21, age: 27, ovr: 68, pot: 68, nat: "TR", val: 1592429, wage: 12000 },
    { n: "Halil Çolak", pos: "FWD", role: "RW", num: 22, age: 28, ovr: 64, pot: 64, nat: "TR", val: 300000, wage: 12000 },
    { n: "Ahmet Güneş", pos: "FWD", role: "ST", num: 23, age: 18, ovr: 58, pot: 70, nat: "TR", val: 300000, wage: 12000 },
    { n: "Burak Yalçın", pos: "FWD", role: "ST", num: 24, age: 33, ovr: 61, pot: 61, nat: "TR", val: 300000, wage: 12000 },
    { n: "Kaan Şahin", pos: "FWD", role: "ST", num: 25, age: 27, ovr: 63, pot: 63, nat: "TR", val: 300000, wage: 12000 },
  ],
);

const VAN_PACK = pack(
  { id: "van", name: "Van Spor FK", short: "VAN", city: "Van", color: "#dc2626", color2: "#ffffff" },
  [
    // GK
    { n: "Halil Koç", pos: "GK", role: "GK", num: 1, age: 33, ovr: 60, pot: 60, nat: "TR", val: 300000, wage: 12000 },
    { n: "Umut Ünal", pos: "GK", role: "GK", num: 2, age: 19, ovr: 57, pot: 69, nat: "TR", val: 300000, wage: 12000 },
    { n: "Mert Kılıç", pos: "GK", role: "GK", num: 3, age: 22, ovr: 64, pot: 72, nat: "TR", val: 397470, wage: 12000 },
    // DEF
    { n: "Alperen Taş", pos: "DEF", role: "CB", num: 4, age: 29, ovr: 67, pot: 67, nat: "TR", val: 784631, wage: 12000 },
    { n: "Görkem Arslan", pos: "DEF", role: "CB", num: 5, age: 26, ovr: 62, pot: 66, nat: "TR", val: 300000, wage: 12000 },
    { n: "Volkan Kaya", pos: "DEF", role: "CB", num: 6, age: 21, ovr: 61, pot: 69, nat: "TR", val: 300000, wage: 12000 },
    { n: "Yusuf Sezer", pos: "DEF", role: "CB", num: 7, age: 32, ovr: 62, pot: 62, nat: "TR", val: 300000, wage: 12000 },
    { n: "Yunus Şahin", pos: "DEF", role: "LB", num: 8, age: 18, ovr: 56, pot: 68, nat: "TR", val: 300000, wage: 12000 },
    { n: "Serkan Akgün", pos: "DEF", role: "LB", num: 9, age: 30, ovr: 62, pot: 62, nat: "TR", val: 300000, wage: 12000 },
    { n: "Bora Şahin", pos: "DEF", role: "RB", num: 10, age: 32, ovr: 64, pot: 64, nat: "TR", val: 300000, wage: 12000 },
    { n: "Arda Taş", pos: "DEF", role: "RB", num: 11, age: 24, ovr: 67, pot: 71, nat: "TR", val: 1401874, wage: 12000 },
    // MID
    { n: "Ferdi Türk", pos: "MID", role: "CDM", num: 12, age: 21, ovr: 59, pot: 67, nat: "TR", val: 300000, wage: 12000 },
    { n: "Sinan Doğan", pos: "MID", role: "CDM", num: 13, age: 33, ovr: 64, pot: 64, nat: "TR", val: 300000, wage: 12000 },
    { n: "Halil Türk", pos: "MID", role: "CM", num: 14, age: 28, ovr: 62, pot: 62, nat: "TR", val: 300000, wage: 12000 },
    { n: "Çağlar Yılmaz", pos: "MID", role: "CM", num: 15, age: 19, ovr: 57, pot: 69, nat: "TR", val: 300000, wage: 12000 },
    { n: "Taner Arslan", pos: "MID", role: "CM", num: 16, age: 30, ovr: 62, pot: 62, nat: "TR", val: 300000, wage: 12000 },
    { n: "Berke Arslan", pos: "MID", role: "AM", num: 17, age: 33, ovr: 61, pot: 61, nat: "TR", val: 300000, wage: 12000 },
    { n: "Kerem Şahin", pos: "MID", role: "AM", num: 18, age: 32, ovr: 60, pot: 60, nat: "TR", val: 300000, wage: 12000 },
    // FWD
    { n: "Kaan Doğan", pos: "FWD", role: "LW", num: 19, age: 18, ovr: 56, pot: 68, nat: "TR", val: 300000, wage: 12000 },
    { n: "Ferdi Yıldız", pos: "FWD", role: "LW", num: 20, age: 22, ovr: 60, pot: 68, nat: "TR", val: 300000, wage: 12000 },
    { n: "Mert Demir", pos: "FWD", role: "RW", num: 21, age: 29, ovr: 66, pot: 66, nat: "TR", val: 513472, wage: 12000 },
    { n: "Taner Korkmaz", pos: "FWD", role: "RW", num: 22, age: 28, ovr: 62, pot: 62, nat: "TR", val: 300000, wage: 12000 },
    { n: "Kaan Kılıç", pos: "FWD", role: "ST", num: 23, age: 20, ovr: 59, pot: 71, nat: "TR", val: 300000, wage: 12000 },
    { n: "Yiğit Öztürk", pos: "FWD", role: "ST", num: 24, age: 29, ovr: 66, pot: 66, nat: "TR", val: 513472, wage: 12000 },
    { n: "Halil Doğan", pos: "FWD", role: "ST", num: 25, age: 31, ovr: 64, pot: 64, nat: "TR", val: 300000, wage: 12000 },
  ],
);

const ID_PACK = pack(
  { id: "igd", name: "Iğdır FK", short: "IĞD", city: "Iğdır", color: "#16a34a", color2: "#dc2626" },
  [
    // GK
    { n: "Burak Yılmaz", pos: "GK", role: "GK", num: 1, age: 28, ovr: 67, pot: 67, nat: "TR", val: 1089765, wage: 12000 },
    { n: "Kerem Çelik", pos: "GK", role: "GK", num: 2, age: 32, ovr: 66, pot: 66, nat: "TR", val: 300000, wage: 12000 },
    { n: "Ferdi Sezer", pos: "GK", role: "GK", num: 3, age: 33, ovr: 60, pot: 60, nat: "TR", val: 300000, wage: 12000 },
    // DEF
    { n: "Cenk Akgün", pos: "DEF", role: "CB", num: 4, age: 28, ovr: 66, pot: 66, nat: "TR", val: 713155, wage: 12000 },
    { n: "Yiğit Korkmaz", pos: "DEF", role: "CB", num: 5, age: 22, ovr: 60, pot: 68, nat: "TR", val: 300000, wage: 12000 },
    { n: "Koray Kılıç", pos: "DEF", role: "CB", num: 6, age: 24, ovr: 64, pot: 68, nat: "TR", val: 325672, wage: 12000 },
    { n: "Kerem Yalçın", pos: "DEF", role: "CB", num: 7, age: 31, ovr: 65, pot: 65, nat: "TR", val: 300000, wage: 12000 },
    { n: "Burak Güneş", pos: "DEF", role: "LB", num: 8, age: 22, ovr: 60, pot: 68, nat: "TR", val: 300000, wage: 12000 },
    { n: "Koray Yılmaz", pos: "DEF", role: "LB", num: 9, age: 21, ovr: 62, pot: 70, nat: "TR", val: 300000, wage: 12000 },
    { n: "Batuhan Çelik", pos: "DEF", role: "RB", num: 10, age: 22, ovr: 65, pot: 73, nat: "TR", val: 692329, wage: 12000 },
    { n: "Alperen Çolak", pos: "DEF", role: "RB", num: 11, age: 32, ovr: 61, pot: 61, nat: "TR", val: 300000, wage: 12000 },
    // MID
    { n: "Yiğit Güler", pos: "MID", role: "CDM", num: 12, age: 32, ovr: 64, pot: 64, nat: "TR", val: 300000, wage: 12000 },
    { n: "Halil Bulut", pos: "MID", role: "CDM", num: 13, age: 31, ovr: 61, pot: 61, nat: "TR", val: 300000, wage: 12000 },
    { n: "Doğan Sezer", pos: "MID", role: "CM", num: 14, age: 22, ovr: 63, pot: 71, nat: "TR", val: 300000, wage: 12000 },
    { n: "Ege Akın", pos: "MID", role: "CM", num: 15, age: 30, ovr: 63, pot: 63, nat: "TR", val: 300000, wage: 12000 },
    { n: "Furkan Türk", pos: "MID", role: "CM", num: 16, age: 30, ovr: 60, pot: 60, nat: "TR", val: 300000, wage: 12000 },
    { n: "Görkem Doğan", pos: "MID", role: "AM", num: 17, age: 26, ovr: 66, pot: 70, nat: "TR", val: 917403, wage: 12000 },
    { n: "Kerem Demir", pos: "MID", role: "AM", num: 18, age: 33, ovr: 61, pot: 61, nat: "TR", val: 300000, wage: 12000 },
    // FWD
    { n: "Tolga Özkan", pos: "FWD", role: "LW", num: 19, age: 25, ovr: 63, pot: 67, nat: "TR", val: 300000, wage: 12000 },
    { n: "Ferdi Ünal", pos: "FWD", role: "LW", num: 20, age: 34, ovr: 62, pot: 62, nat: "TR", val: 300000, wage: 12000 },
    { n: "Kaan Polat", pos: "FWD", role: "RW", num: 21, age: 34, ovr: 62, pot: 62, nat: "TR", val: 300000, wage: 12000 },
    { n: "Ferdi Türk", pos: "FWD", role: "RW", num: 22, age: 20, ovr: 59, pot: 71, nat: "TR", val: 300000, wage: 12000 },
    { n: "Ahmet Doğan", pos: "FWD", role: "ST", num: 23, age: 23, ovr: 61, pot: 69, nat: "TR", val: 300000, wage: 12000 },
    { n: "Sinan Çolak", pos: "FWD", role: "ST", num: 24, age: 25, ovr: 64, pot: 68, nat: "TR", val: 325672, wage: 12000 },
    { n: "Enes Güler", pos: "FWD", role: "ST", num: 25, age: 28, ovr: 67, pot: 67, nat: "TR", val: 1089765, wage: 12000 },
  ],
);

const MU_PACK = pack(
  { id: "mug", name: "Muğlaspor", short: "MUĞ", city: "Muğla", color: "#16a34a", color2: "#ffffff" },
  [
    // GK
    { n: "Burak Bulut", pos: "GK", role: "GK", num: 1, age: 22, ovr: 62, pot: 70, nat: "TR", val: 300000, wage: 12000 },
    { n: "Enes Bulut", pos: "GK", role: "GK", num: 2, age: 33, ovr: 62, pot: 62, nat: "TR", val: 300000, wage: 12000 },
    { n: "Ferdi Taş", pos: "GK", role: "GK", num: 3, age: 32, ovr: 62, pot: 62, nat: "TR", val: 300000, wage: 12000 },
    // DEF
    { n: "Ahmet Yılmaz", pos: "DEF", role: "CB", num: 4, age: 21, ovr: 62, pot: 70, nat: "TR", val: 300000, wage: 12000 },
    { n: "Arda Çelik", pos: "DEF", role: "CB", num: 5, age: 23, ovr: 64, pot: 72, nat: "TR", val: 397470, wage: 12000 },
    { n: "Onur Çolak", pos: "DEF", role: "CB", num: 6, age: 22, ovr: 63, pot: 71, nat: "TR", val: 300000, wage: 12000 },
    { n: "Enes Kılıç", pos: "DEF", role: "CB", num: 7, age: 25, ovr: 62, pot: 66, nat: "TR", val: 300000, wage: 12000 },
    { n: "Barış Taş", pos: "DEF", role: "LB", num: 8, age: 21, ovr: 62, pot: 70, nat: "TR", val: 300000, wage: 12000 },
    { n: "Ferdi Çelik", pos: "DEF", role: "LB", num: 9, age: 22, ovr: 60, pot: 68, nat: "TR", val: 300000, wage: 12000 },
    { n: "Sinan Duman", pos: "DEF", role: "RB", num: 10, age: 24, ovr: 63, pot: 67, nat: "TR", val: 300000, wage: 12000 },
    { n: "Efe Taş", pos: "DEF", role: "RB", num: 11, age: 21, ovr: 63, pot: 71, nat: "TR", val: 300000, wage: 12000 },
    // MID
    { n: "Hakan Arslan", pos: "MID", role: "CDM", num: 12, age: 28, ovr: 66, pot: 66, nat: "TR", val: 713155, wage: 12000 },
    { n: "Bora Aydın", pos: "MID", role: "CDM", num: 13, age: 34, ovr: 60, pot: 60, nat: "TR", val: 300000, wage: 12000 },
    { n: "Batuhan Yalçın", pos: "MID", role: "CM", num: 14, age: 33, ovr: 64, pot: 64, nat: "TR", val: 300000, wage: 12000 },
    { n: "Yusuf Yalçın", pos: "MID", role: "CM", num: 15, age: 25, ovr: 67, pot: 71, nat: "TR", val: 1401874, wage: 12000 },
    { n: "Mehmet Bulut", pos: "MID", role: "CM", num: 16, age: 33, ovr: 66, pot: 66, nat: "TR", val: 300000, wage: 12000 },
    { n: "Yusuf Başaran", pos: "MID", role: "AM", num: 17, age: 20, ovr: 56, pot: 68, nat: "TR", val: 300000, wage: 12000 },
    { n: "Furkan Aydın", pos: "MID", role: "AM", num: 18, age: 29, ovr: 68, pot: 68, nat: "TR", val: 1146549, wage: 12000 },
    // FWD
    { n: "Enes Öztürk", pos: "FWD", role: "LW", num: 19, age: 18, ovr: 57, pot: 69, nat: "TR", val: 300000, wage: 12000 },
    { n: "Görkem Çakır", pos: "FWD", role: "LW", num: 20, age: 21, ovr: 59, pot: 67, nat: "TR", val: 300000, wage: 12000 },
    { n: "Yusuf Aydın", pos: "FWD", role: "RW", num: 21, age: 34, ovr: 60, pot: 60, nat: "TR", val: 300000, wage: 12000 },
    { n: "Kaan Bulut", pos: "FWD", role: "RW", num: 22, age: 22, ovr: 60, pot: 68, nat: "TR", val: 300000, wage: 12000 },
    { n: "Berke Güneş", pos: "FWD", role: "ST", num: 23, age: 34, ovr: 63, pot: 63, nat: "TR", val: 300000, wage: 12000 },
    { n: "Deniz Arslan", pos: "FWD", role: "ST", num: 24, age: 23, ovr: 64, pot: 72, nat: "TR", val: 397470, wage: 12000 },
    { n: "Berke Kılıç", pos: "FWD", role: "ST", num: 25, age: 28, ovr: 67, pot: 67, nat: "TR", val: 1089765, wage: 12000 },
  ],
);

/** Süper Lig clubs, in rough order of strength. */
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

/** 1. Lig — the division below. Promotion and relegation move clubs between them. */
export const SQUAD_PACKS_D2: SquadPack[] = [
  BRS_PACK,
  KAY_PACK,
  ANT_PACK,
  SVS_PACK,
  BDR_PACK,
  FKG_PACK,
  PND_PACK,
  BOL_PACK,
  MR_PACK,
  ST_PACK,
  SAR_PACK,
  MAN_PACK,
  BND_PACK,
  ESR_PACK,
  KE_PACK,
  VAN_PACK,
  ID_PACK,
  MU_PACK,
];

/**
 * The pack the landing-page mock squad is built from. Kept as a named export
 * so lib/mock-data.ts does not depend on array ordering.
 */
export const USER_PACK: SquadPack = SQUAD_PACKS[0];
