/**
 * Real footballers a scout can find abroad.
 *
 * ─── Why this file exists ───────────────────────────────────────────────
 *
 * The scout already used real names — Mbappé, Bellingham, Lamine Yamal — but
 * rolled their age and rating at random: `age = ageMin + random`,
 * `overall = 68 + random*12`. So a report could return a 31-year-old Lamine
 * Yamal rated 70, and a 19-year-old Casemiro rated 79. Using a real person's
 * name and then inventing their career is worse than inventing the person:
 * every player the manager recognises is a player he can immediately see is
 * wrong, and once one entry is obviously wrong the whole report reads as
 * noise.
 *
 * So a real name now carries real data. `born` is the actual date of birth,
 * and age is computed from it rather than stored, so the pool does not go
 * stale as the calendar moves. Position and role are the player's real ones.
 *
 * `ovr`/`pot` are the one exception and are GAME-BALANCE NUMBERS, not facts —
 * no public source publishes a single overall rating, and the same caveat
 * applies here as in lib/squad-packs.ts. What they are held to is internal
 * consistency: the ordering is meant to be defensible (Haaland above Boniface,
 * Yamal's ceiling above his current level), and they sit on the same scale as
 * the Süper Lig packs so a scouted player can be compared to one you own.
 *
 * ─── Rules for editing ──────────────────────────────────────────────────
 *
 *  - Nobody here may appear in lib/squad-packs.ts. A scout offering a player
 *    the league already owns is a bug the caller has to filter out; keeping
 *    the pools disjoint means the filter rarely fires. Every Turkish entry
 *    plays ABROAD for exactly this reason.
 *  - If you are not confident about a date of birth, leave the player out.
 *    A short accurate pool beats a long approximate one — the generator falls
 *    back to inventing a player when the pool cannot fill a request, and an
 *    invented player carries no claim to be anyone.
 *
 * Snapshot: squads and ratings as of the 2026-27 pre-season.
 */
import type { Position } from "@/types";

/** [name, nationality, role, date of birth, overall, potential] */
type PoolEntry = readonly [string, string, string, string, number, number];

export type ScoutPoolPlayer = {
  name: string;
  nat: string;
  role: string;
  position: Position;
  age: number;
  overall: number;
  potential: number;
};

const ROLE_POSITION: Record<string, Position> = {
  GK: "GK",
  CB: "DEF",
  LB: "DEF",
  RB: "DEF",
  CDM: "MID",
  CM: "MID",
  AM: "MID",
  LM: "MID",
  RM: "MID",
  LW: "FWD",
  RW: "FWD",
  ST: "FWD",
  CF: "FWD",
};

// prettier-ignore
const POOL: readonly PoolEntry[] = [
  // ── Brazil ────────────────────────────────────────────────────────────
  ["Alisson Becker",      "BR", "GK",  "1992-10-02", 87, 87],
  ["Ederson",             "BR", "GK",  "1993-08-17", 85, 85],
  ["Bento",               "BR", "GK",  "1999-06-10", 78, 82],
  ["Éder Militão",        "BR", "CB",  "1998-01-18", 84, 86],
  ["Gabriel Magalhães",   "BR", "CB",  "1997-12-19", 86, 87],
  ["Casemiro",            "BR", "CDM", "1992-02-23", 80, 80],
  ["Bruno Guimarães",     "BR", "CM",  "1997-11-16", 85, 86],
  ["João Gomes",          "BR", "CDM", "2001-02-12", 79, 83],
  ["Lucas Paquetá",       "BR", "AM",  "1997-08-27", 82, 83],
  ["Vinícius Júnior",     "BR", "LW",  "2000-07-12", 90, 92],
  ["Rodrygo",             "BR", "RW",  "2001-01-09", 86, 89],
  ["Raphinha",            "BR", "LW",  "1996-12-14", 88, 88],
  ["Gabriel Martinelli",  "BR", "LW",  "2001-06-18", 81, 85],
  ["Savinho",             "BR", "RW",  "2004-04-10", 80, 87],
  ["Estêvão",             "BR", "RW",  "2007-04-24", 78, 90],
  ["Endrick",             "BR", "ST",  "2006-07-21", 76, 89],
  ["Richarlison",         "BR", "ST",  "1997-05-10", 79, 80],

  // ── Argentina ─────────────────────────────────────────────────────────
  ["Emiliano Martínez",   "AR", "GK",  "1992-09-02", 85, 85],
  ["Gerónimo Rulli",      "AR", "GK",  "1992-05-20", 79, 79],
  ["Cristian Romero",     "AR", "CB",  "1998-04-27", 85, 86],
  ["Nicolás Otamendi",    "AR", "CB",  "1988-02-12", 78, 78],
  ["Leandro Paredes",     "AR", "CDM", "1994-06-29", 79, 79],
  ["Enzo Fernández",      "AR", "CM",  "2001-01-17", 84, 87],
  ["Alexis Mac Allister", "AR", "CM",  "1998-12-24", 85, 86],
  ["Paulo Dybala",        "AR", "AM",  "1993-11-15", 84, 84],
  ["Valentín Carboni",    "AR", "AM",  "2005-03-05", 72, 84],
  ["Franco Mastantuono",  "AR", "AM",  "2007-08-14", 74, 88],
  ["Alejandro Garnacho",  "AR", "LW",  "2004-07-01", 78, 86],
  ["Nicolás González",    "AR", "LW",  "1998-04-06", 80, 81],
  ["Lautaro Martínez",    "AR", "ST",  "1997-08-22", 87, 87],
  ["Julián Álvarez",      "AR", "ST",  "2000-01-31", 86, 89],

  // ── France ────────────────────────────────────────────────────────────
  ["Mike Maignan",        "FR", "GK",  "1995-07-03", 86, 86],
  ["Lucas Chevalier",     "FR", "GK",  "2001-11-06", 81, 86],
  ["Brice Samba",         "FR", "GK",  "1994-04-25", 79, 79],
  ["William Saliba",      "FR", "CB",  "2001-03-24", 86, 88],
  ["Dayot Upamecano",     "FR", "CB",  "1998-10-27", 83, 84],
  ["Jules Koundé",        "FR", "RB",  "1998-11-12", 84, 85],
  ["Theo Hernández",      "FR", "LB",  "1997-10-06", 84, 85],
  ["Aurélien Tchouaméni", "FR", "CDM", "2000-01-27", 84, 87],
  ["Eduardo Camavinga",   "FR", "CM",  "2002-11-10", 83, 88],
  ["Warren Zaïre-Emery",  "FR", "CM",  "2006-03-08", 80, 88],
  ["Antoine Griezmann",   "FR", "AM",  "1991-03-21", 84, 84],
  ["Désiré Doué",         "FR", "AM",  "2005-06-03", 82, 89],
  ["Michael Olise",       "FR", "RW",  "2001-12-12", 86, 89],
  ["Bradley Barcola",     "FR", "LW",  "2002-09-02", 82, 86],
  ["Ousmane Dembélé",     "FR", "RW",  "1997-05-15", 88, 88],
  ["Kylian Mbappé",       "FR", "ST",  "1998-12-20", 91, 92],

  // ── Spain ─────────────────────────────────────────────────────────────
  ["Unai Simón",          "ES", "GK",  "1997-06-11", 84, 85],
  ["David Raya",          "ES", "GK",  "1995-09-15", 84, 84],
  ["Álex Remiro",         "ES", "GK",  "1995-03-24", 80, 80],
  ["Rodri",               "ES", "CDM", "1996-06-22", 89, 89],
  ["Martín Zubimendi",    "ES", "CDM", "1999-02-02", 84, 86],
  ["Pedri",               "ES", "CM",  "2002-11-25", 87, 90],
  ["Gavi",                "ES", "CM",  "2004-08-05", 82, 88],
  ["Fabián Ruiz",         "ES", "CM",  "1996-04-03", 84, 84],
  ["Dani Olmo",           "ES", "AM",  "1998-05-07", 84, 85],
  ["Lamine Yamal",        "ES", "RW",  "2007-07-13", 87, 94],
  ["Nico Williams",       "ES", "LW",  "2002-07-12", 85, 88],
  ["Ferran Torres",       "ES", "ST",  "2000-02-29", 81, 83],

  // ── Germany ───────────────────────────────────────────────────────────
  ["Marc-André ter Stegen", "DE", "GK", "1992-04-30", 85, 85],
  ["Manuel Neuer",        "DE", "GK",  "1986-03-27", 82, 82],
  ["Alexander Nübel",     "DE", "GK",  "1996-09-30", 80, 82],
  ["Antonio Rüdiger",     "DE", "CB",  "1993-03-03", 84, 84],
  ["Joshua Kimmich",      "DE", "CM",  "1995-02-08", 87, 87],
  ["Leon Goretzka",       "DE", "CM",  "1995-02-06", 81, 81],
  ["Florian Wirtz",       "DE", "AM",  "2003-05-03", 88, 91],
  ["Jamal Musiala",       "DE", "AM",  "2003-02-26", 87, 91],
  ["Julian Brandt",       "DE", "AM",  "1996-05-02", 82, 82],
  ["Kai Havertz",         "DE", "ST",  "1999-06-11", 83, 84],
  ["Niclas Füllkrug",     "DE", "ST",  "1993-02-09", 78, 78],

  // ── Portugal ──────────────────────────────────────────────────────────
  ["Diogo Costa",         "PT", "GK",  "1999-09-19", 84, 87],
  ["José Sá",             "PT", "GK",  "1993-01-17", 79, 79],
  ["Rúben Dias",          "PT", "CB",  "1997-05-14", 88, 88],
  ["João Cancelo",        "PT", "RB",  "1994-05-27", 82, 82],
  ["João Neves",          "PT", "CDM", "2004-09-27", 84, 89],
  ["Vitinha",             "PT", "CM",  "2000-02-13", 86, 88],
  ["Bruno Fernandes",     "PT", "AM",  "1994-09-08", 87, 87],
  ["Bernardo Silva",      "PT", "AM",  "1994-08-10", 86, 86],
  ["Rafael Leão",         "PT", "LW",  "1999-06-10", 85, 87],
  ["Gonçalo Ramos",       "PT", "ST",  "2001-06-20", 82, 85],

  // ── Netherlands ───────────────────────────────────────────────────────
  ["Bart Verbruggen",     "NL", "GK",  "2002-08-18", 80, 85],
  ["Mark Flekken",        "NL", "GK",  "1993-06-13", 79, 79],
  ["Virgil van Dijk",     "NL", "CB",  "1991-07-08", 86, 86],
  ["Matthijs de Ligt",    "NL", "CB",  "1999-08-12", 84, 85],
  ["Micky van de Ven",    "NL", "CB",  "2001-04-19", 83, 87],
  ["Denzel Dumfries",     "NL", "RB",  "1996-04-18", 83, 83],
  ["Frenkie de Jong",     "NL", "CM",  "1997-05-12", 86, 87],
  ["Tijjani Reijnders",   "NL", "CM",  "1998-07-29", 85, 86],
  ["Xavi Simons",         "NL", "AM",  "2003-04-21", 84, 88],
  ["Cody Gakpo",          "NL", "LW",  "1999-05-07", 83, 85],

  // ── Belgium ───────────────────────────────────────────────────────────
  ["Koen Casteels",       "BE", "GK",  "1992-06-25", 81, 81],
  ["Matz Sels",           "BE", "GK",  "1992-02-26", 80, 80],
  ["Youri Tielemans",     "BE", "CM",  "1997-05-07", 83, 83],
  ["Kevin De Bruyne",     "BE", "AM",  "1991-06-28", 85, 85],
  ["Charles De Ketelaere", "BE", "AM", "2001-03-10", 81, 84],
  ["Jérémy Doku",         "BE", "LW",  "2002-05-27", 83, 87],
  ["Dodi Lukebakio",      "BE", "RW",  "1997-09-24", 79, 80],
  ["Loïs Openda",         "BE", "ST",  "2000-02-16", 82, 85],

  // ── England ───────────────────────────────────────────────────────────
  ["Jordan Pickford",     "EN", "GK",  "1994-03-07", 84, 84],
  ["Dean Henderson",      "EN", "GK",  "1997-03-12", 79, 80],
  ["Aaron Ramsdale",      "EN", "GK",  "1998-05-14", 78, 80],
  ["Marc Guéhi",          "EN", "CB",  "2000-07-13", 82, 85],
  ["Jarrad Branthwaite",  "EN", "CB",  "2002-06-27", 80, 86],
  ["Declan Rice",         "EN", "CDM", "1999-01-14", 87, 88],
  ["Jude Bellingham",     "EN", "AM",  "2003-06-29", 89, 92],
  ["Phil Foden",          "EN", "AM",  "2000-05-28", 86, 88],
  ["Cole Palmer",         "EN", "AM",  "2002-05-06", 85, 89],
  ["Morgan Rogers",       "EN", "AM",  "2002-07-26", 79, 85],
  ["Bukayo Saka",         "EN", "RW",  "2001-09-05", 87, 89],
  ["Anthony Gordon",      "EN", "LW",  "2001-02-24", 81, 84],
  ["Harry Kane",          "EN", "ST",  "1993-07-28", 89, 89],

  // ── Italy ─────────────────────────────────────────────────────────────
  ["Gianluigi Donnarumma", "IT", "GK", "1999-02-25", 88, 88],
  ["Guglielmo Vicario",   "IT", "GK",  "1996-10-07", 82, 82],
  ["Alessandro Bastoni",  "IT", "CB",  "1999-04-13", 85, 86],
  ["Federico Dimarco",    "IT", "LB",  "1997-11-10", 85, 85],
  ["Sandro Tonali",       "IT", "CDM", "2000-05-08", 83, 86],
  ["Nicolò Barella",      "IT", "CM",  "1997-02-07", 86, 86],
  ["Cesare Casadei",      "IT", "CM",  "2003-01-10", 74, 82],
  ["Giacomo Raspadori",   "IT", "ST",  "2000-02-18", 78, 81],

  // ── Croatia ───────────────────────────────────────────────────────────
  ["Dominik Livaković",   "HR", "GK",  "1995-01-09", 80, 80],
  ["Joško Gvardiol",      "HR", "CB",  "2002-01-23", 86, 89],
  ["Mateo Kovačić",       "HR", "CM",  "1994-05-06", 83, 83],
  ["Petar Sučić",         "HR", "CM",  "2003-10-25", 76, 84],
  ["Luka Sučić",          "HR", "AM",  "2002-09-08", 75, 82],
  ["Mario Pašalić",       "HR", "AM",  "1995-02-09", 80, 80],
  ["Martin Baturina",     "HR", "AM",  "2003-02-16", 76, 84],

  // ── Norway ────────────────────────────────────────────────────────────
  ["Ørjan Nyland",        "NO", "GK",  "1990-09-10", 73, 73],
  ["Sander Berge",        "NO", "CDM", "1998-02-14", 76, 77],
  ["Martin Ødegaard",     "NO", "AM",  "1998-12-17", 86, 87],
  ["Oscar Bobb",          "NO", "RW",  "2003-07-12", 76, 84],
  ["Antonio Nusa",        "NO", "LW",  "2005-04-17", 78, 86],
  ["Erling Haaland",      "NO", "ST",  "2000-07-21", 91, 93],
  ["Alexander Sørloth",   "NO", "ST",  "1995-12-05", 82, 82],

  // ── Sweden ────────────────────────────────────────────────────────────
  ["Robin Olsen",         "SE", "GK",  "1990-01-08", 74, 74],
  ["Emil Forsberg",       "SE", "AM",  "1991-10-23", 77, 77],
  ["Dejan Kulusevski",    "SE", "RW",  "2000-04-25", 83, 85],
  ["Alexander Isak",      "SE", "ST",  "1999-09-21", 87, 89],
  ["Viktor Gyökeres",     "SE", "ST",  "1998-06-04", 86, 87],

  // ── Denmark ───────────────────────────────────────────────────────────
  ["Kasper Schmeichel",   "DK", "GK",  "1986-11-05", 76, 76],
  ["Joachim Andersen",    "DK", "CB",  "1996-05-31", 81, 81],
  ["Pierre-Emile Højbjerg", "DK", "CDM", "1995-08-05", 81, 81],
  ["Christian Eriksen",   "DK", "AM",  "1992-02-14", 78, 78],
  ["Mikkel Damsgaard",    "DK", "AM",  "2000-07-03", 78, 81],
  ["Rasmus Højlund",      "DK", "ST",  "2003-02-04", 78, 85],

  // ── Senegal ───────────────────────────────────────────────────────────
  ["Édouard Mendy",       "SN", "GK",  "1992-03-01", 80, 80],
  ["Kalidou Koulibaly",   "SN", "CB",  "1991-06-20", 78, 78],
  ["Amadou Onana",        "SN", "CDM", "2001-08-16", 81, 85],
  ["Lamine Camara",       "SN", "CM",  "2004-01-01", 76, 84],
  ["Ismaïla Sarr",        "SN", "RW",  "1998-02-25", 80, 81],
  ["Sadio Mané",          "SN", "LW",  "1992-04-10", 80, 80],
  ["Nicolas Jackson",     "SN", "ST",  "2001-06-20", 80, 85],

  // ── Morocco ───────────────────────────────────────────────────────────
  ["Yassine Bounou",      "MA", "GK",  "1991-04-05", 83, 83],
  ["Achraf Hakimi",       "MA", "RB",  "1998-11-04", 87, 87],
  ["Noussair Mazraoui",   "MA", "RB",  "1997-11-14", 80, 81],
  ["Azzedine Ounahi",     "MA", "CM",  "2000-04-19", 77, 79],
  ["Brahim Díaz",         "MA", "AM",  "1999-08-03", 82, 84],
  ["Eliesse Ben Seghir",  "MA", "AM",  "2005-02-16", 77, 86],
  ["Bilal El Khannouss",  "MA", "AM",  "2004-05-10", 77, 85],

  // ── Nigeria ───────────────────────────────────────────────────────────
  ["Stanley Nwabali",     "NG", "GK",  "1996-10-06", 74, 75],
  ["Calvin Bassey",       "NG", "CB",  "1999-12-31", 80, 82],
  ["Alex Iwobi",          "NG", "CM",  "1996-05-03", 79, 79],
  ["Ademola Lookman",     "NG", "LW",  "1997-10-20", 84, 84],
  ["Samuel Chukwueze",    "NG", "RW",  "1999-05-22", 78, 80],
  ["Victor Boniface",     "NG", "ST",  "2000-12-23", 80, 84],
  ["Taiwo Awoniyi",       "NG", "ST",  "1997-08-12", 76, 77],

  // ── Ivory Coast ───────────────────────────────────────────────────────
  ["Yahia Fofana",        "CI", "GK",  "2000-08-21", 74, 78],
  ["Evan Ndicka",         "CI", "CB",  "1999-08-20", 80, 82],
  ["Amad Diallo",         "CI", "RW",  "2002-07-11", 80, 86],
  ["Simon Adingra",       "CI", "LW",  "2002-01-01", 77, 83],
  ["Sébastien Haller",    "CI", "ST",  "1994-06-22", 77, 77],
  ["Karim Konaté",        "CI", "ST",  "2004-03-24", 74, 83],

  // ── Ghana ─────────────────────────────────────────────────────────────
  ["Lawrence Ati-Zigi",   "GH", "GK",  "1996-11-29", 73, 74],
  ["Thomas Partey",       "GH", "CDM", "1993-06-13", 80, 80],
  ["Mohammed Kudus",      "GH", "AM",  "2000-08-02", 83, 86],
  ["Antoine Semenyo",     "GH", "RW",  "2000-01-07", 80, 83],
  ["Kamaldeen Sulemana",  "GH", "LW",  "2002-02-15", 76, 82],

  // ── Georgia ───────────────────────────────────────────────────────────
  ["Giorgi Mamardashvili", "GE", "GK", "2000-09-29", 84, 88],
  ["Giorgi Chakvetadze",  "GE", "AM",  "1999-08-29", 74, 77],
  ["Khvicha Kvaratskhelia", "GE", "LW", "2001-02-12", 87, 89],

  // ── Türkiye, playing abroad ───────────────────────────────────────────
  // Everyone here is outside the Süper Lig, so a report can never duplicate
  // a player already in a league squad.
  ["Altay Bayındır",      "TR", "GK",  "1998-04-14", 76, 79],
  ["Berke Özer",          "TR", "GK",  "2000-04-25", 77, 82],
  ["Ferdi Kadıoğlu",      "TR", "LB",  "1999-10-07", 80, 83],
  ["Zeki Çelik",          "TR", "RB",  "1997-02-17", 77, 78],
  ["Ahmetcan Kaplan",     "TR", "CB",  "2003-07-16", 72, 80],
  ["Efe Akman",           "TR", "CM",  "2006-02-11", 70, 82],
  ["Arda Güler",          "TR", "AM",  "2005-02-25", 82, 90],
  ["Can Uzun",            "TR", "AM",  "2005-11-11", 77, 87],
  ["Kenan Yıldız",        "TR", "LW",  "2005-05-04", 82, 90],
  ["Doğukan Sinik",       "TR", "RW",  "1999-04-15", 73, 75],
] as const;

/** Age on a given day, from the real date of birth. */
function ageOn(born: string, today: Date): number {
  const [y, m, d] = born.split("-").map((n) => parseInt(n, 10));
  let age = today.getUTCFullYear() - y;
  const monthDiff = today.getUTCMonth() + 1 - m;
  if (monthDiff < 0 || (monthDiff === 0 && today.getUTCDate() < d)) age--;
  return age;
}

/** The pool, resolved against today's date. */
export function scoutPool(today: Date = new Date()): ScoutPoolPlayer[] {
  return POOL.map(([name, nat, role, born, overall, potential]) => ({
    name,
    nat,
    role,
    position: ROLE_POSITION[role] ?? "MID",
    age: ageOn(born, today),
    overall,
    potential,
  }));
}

/** Which nationalities the scout screen may offer. */
export const SCOUT_NATIONALITIES = [
  ...new Set(POOL.map(([, nat]) => nat)),
].sort();

/**
 * Find real players matching a scout's brief.
 *
 * `maxOverall` is the reach of the scouting department: a club with no chief
 * scout does not get told about Mbappé. That is what the staff tier buys —
 * access, rather than a bigger pile of the same players — and it is what
 * makes real ratings work as a mechanic instead of just as decoration.
 */
export function findScoutCandidates(brief: {
  nat: string;
  position: Position | "ANY";
  ageMin: number;
  ageMax: number;
  minOverall: number;
  maxOverall: number;
  exclude: ReadonlySet<string>;
  today?: Date;
}): ScoutPoolPlayer[] {
  return scoutPool(brief.today).filter(
    (p) =>
      p.nat === brief.nat &&
      (brief.position === "ANY" || p.position === brief.position) &&
      p.age >= brief.ageMin &&
      p.age <= brief.ageMax &&
      p.overall >= brief.minOverall &&
      p.overall <= brief.maxOverall &&
      !brief.exclude.has(p.name),
  );
}
