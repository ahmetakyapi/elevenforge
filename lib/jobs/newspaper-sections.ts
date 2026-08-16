/**
 * Everything the newspaper carries below the fold.
 *
 * The paper used to be a cover and three lists behind tabs: hero match, team
 * of the week, top scorers, one fun fact. A real matchday paper is mostly the
 * other stuff — every result with a paragraph on it, the table as it stands
 * tonight, who is in form, who is suspended, what moved in the market, and
 * what is on next week. That is what makes it worth opening rather than a
 * duplicate of the standings page with a serif font.
 *
 * Composed here rather than in generateNewspaper so that file stays about
 * choosing the hero and building the TOTW, and so the shape of the sections is
 * defined in one place — the reader in lib/queries/newspaper.ts parses exactly
 * this type.
 */
import { and, desc, eq, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  clubs,
  fixtures,
  players,
  transferHistory,
  type Club,
  type Fixture,
} from "@/lib/schema";
import { sortStandings } from "@/lib/standings";

export type ResultRow = {
  homeClubId: string;
  awayClubId: string;
  homeName: string;
  awayName: string;
  homeScore: number;
  awayScore: number;
  /** One sentence on how it went. */
  report: string;
  /** Scorers, in the order they scored. */
  scorers: string[];
  derby: boolean;
};

export type TableRow = {
  clubId: string;
  name: string;
  played: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  /** Most recent first: "W" | "D" | "L". */
  form: string[];
};

export type TransferRow = {
  player: string;
  fromName: string;
  toName: string;
  priceEur: number;
};

export type DisciplineRow = {
  name: string;
  clubName: string;
  yellows: number;
  reds: number;
  /** True when the player is currently serving a ban. */
  banned: boolean;
};

export type UpcomingRow = {
  homeName: string;
  awayName: string;
  homeClubId: string;
  awayClubId: string;
};

export type NewspaperSections = {
  results: ResultRow[];
  table: TableRow[];
  transfers: TransferRow[];
  discipline: DisciplineRow[];
  upcoming: UpcomingRow[];
  /** Club that most outperformed expectations this week, and why. */
  managerOfWeek: { clubId: string; clubName: string; note: string } | null;
  /** Short lines of colour, generated from what actually happened. */
  quotes: Array<{ voice: string; text: string }>;
  /** Numbers worth printing: goals, biggest win, cleanest sheet. */
  weekStats: Array<{ label: string; value: string; note?: string }>;
};

export const EMPTY_SECTIONS: NewspaperSections = {
  results: [],
  table: [],
  transfers: [],
  discipline: [],
  upcoming: [],
  managerOfWeek: null,
  quotes: [],
  weekStats: [],
};

/** A one-sentence verdict on a scoreline. */
function reportFor(
  home: string,
  away: string,
  hs: number,
  as: number,
  derby: boolean,
): string {
  const diff = Math.abs(hs - as);
  const winner = hs > as ? home : away;
  const loser = hs > as ? away : home;
  if (hs === as) {
    if (hs === 0) {
      return `${home} ile ${away} birbirini tanıdı, kale önlerinde iş çıkmadı.`;
    }
    return `${home} ve ${away} puanları paylaştı; iki taraf da öne geçmenin yolunu buldu ama koruyamadı.`;
  }
  if (diff >= 4) {
    return `${winner} sahada tek başınaydı. ${loser} maçın hiçbir bölümünde karşılık veremedi.`;
  }
  if (diff === 3) {
    return `${winner} farkı üç maddeye çıkardı; ${loser} için üzerinde konuşulacak çok şey var.`;
  }
  if (diff === 2) {
    return `${winner} kontrolü hiç bırakmadı, ${loser} baskı kuramadı.`;
  }
  return derby
    ? `Derbiyi ${winner} tek golle aldı — bu şehirde bir gol yeter.`
    : `${winner} tek farkla döndü; ${loser} son bölümde beraberliği zorladı.`;
}

/** Scorer names in minute order, from the stored commentary. */
function scorersOf(
  fx: Fixture,
  nameById: Map<string, string>,
): string[] {
  if (!fx.commentaryJson) return [];
  try {
    const events = JSON.parse(fx.commentaryJson) as Array<{
      type?: string;
      minute?: number;
      scorerId?: string;
    }>;
    if (!Array.isArray(events)) return [];
    return events
      .filter((e) => e.type === "goal" && e.scorerId)
      .sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0))
      .map((e) => nameById.get(e.scorerId as string))
      .filter((n): n is string => Boolean(n));
  } catch {
    return [];
  }
}

/**
 * Build every section for one league's week.
 *
 * `weekFixtures` are the finished fixtures being reported on; they are passed
 * in rather than re-queried because the caller has already chosen them (and
 * has already decided which division the paper covers).
 */
export async function buildSections(opts: {
  leagueId: string;
  seasonNumber: number;
  weekNumber: number;
  weekFixtures: Fixture[];
}): Promise<NewspaperSections> {
  const { leagueId, seasonNumber, weekNumber, weekFixtures } = opts;
  if (weekFixtures.length === 0) return EMPTY_SECTIONS;

  const leagueClubs = await db
    .select()
    .from(clubs)
    .where(eq(clubs.leagueId, leagueId));
  const clubById = new Map<string, Club>(leagueClubs.map((c) => [c.id, c]));

  // Every player in the league, once — used for scorer names and discipline.
  const leaguePlayers = await db
    .select()
    .from(players)
    .where(eq(players.leagueId, leagueId));
  const playerNameById = new Map(leaguePlayers.map((p) => [p.id, p.name]));

  // ── Results ───────────────────────────────────────────────────────────
  const results: ResultRow[] = weekFixtures.map((fx) => {
    const home = clubById.get(fx.homeClubId);
    const away = clubById.get(fx.awayClubId);
    const homeName = home?.name ?? "?";
    const awayName = away?.name ?? "?";
    const hs = fx.homeScore ?? 0;
    const as = fx.awayScore ?? 0;
    const derby = Boolean(home && away && home.city === away.city);
    return {
      homeClubId: fx.homeClubId,
      awayClubId: fx.awayClubId,
      homeName,
      awayName,
      homeScore: hs,
      awayScore: as,
      report: reportFor(homeName, awayName, hs, as, derby),
      scorers: scorersOf(fx, playerNameById),
      derby,
    };
  });

  // ── Table, with a form guide ──────────────────────────────────────────
  // Restricted to the division the paper covers, so a two-tier league does
  // not print one table containing both.
  const division = weekFixtures[0].division;
  const divisionClubs = leagueClubs.filter((c) => c.division === division);
  const seasonFixtures = await db
    .select()
    .from(fixtures)
    .where(
      and(
        eq(fixtures.leagueId, leagueId),
        eq(fixtures.seasonNumber, seasonNumber),
        eq(fixtures.division, division),
      ),
    );
  const finished = seasonFixtures.filter(
    (f) => f.status === "finished" && f.homeScore !== null && f.awayScore !== null,
  );

  const formOf = (clubId: string): string[] =>
    finished
      .filter((f) => f.homeClubId === clubId || f.awayClubId === clubId)
      .sort((a, b) => b.weekNumber - a.weekNumber)
      .slice(0, 5)
      .map((f) => {
        const isHome = f.homeClubId === clubId;
        const gf = (isHome ? f.homeScore : f.awayScore) ?? 0;
        const ga = (isHome ? f.awayScore : f.homeScore) ?? 0;
        return gf > ga ? "W" : gf === ga ? "D" : "L";
      });

  const ordered = sortStandings(
    divisionClubs.map((c) => ({
      id: c.id,
      name: c.name,
      seasonPoints: c.seasonPoints,
      seasonGoalsFor: c.seasonGoalsFor,
      seasonGoalsAgainst: c.seasonGoalsAgainst,
    })),
    seasonFixtures,
  );
  const table: TableRow[] = ordered.map((c) => {
    const row = clubById.get(c.id);
    return {
      clubId: c.id,
      name: c.name,
      played:
        (row?.seasonWins ?? 0) + (row?.seasonDraws ?? 0) + (row?.seasonLosses ?? 0),
      points: c.seasonPoints,
      goalsFor: c.seasonGoalsFor,
      goalsAgainst: c.seasonGoalsAgainst,
      form: formOf(c.id),
    };
  });

  // ── Transfer desk ─────────────────────────────────────────────────────
  // The week's business. `transferHistory` has no week column, so it is read
  // by time: everything since the previous round was played.
  const since = new Date(Date.now() - 26 * 3600 * 1000);
  const moves = await db
    .select()
    .from(transferHistory)
    .where(
      and(eq(transferHistory.leagueId, leagueId), gte(transferHistory.completedAt, since)),
    )
    .orderBy(desc(transferHistory.priceCents))
    .limit(8);
  const transfers: TransferRow[] = moves.map((m) => ({
    player: playerNameById.get(m.playerId) ?? "?",
    fromName: m.fromClubId
      ? (clubById.get(m.fromClubId)?.name ?? "?")
      : "Serbest",
    toName: m.toClubId ? (clubById.get(m.toClubId)?.name ?? "?") : "Serbest",
    priceEur: Math.round(Number(m.priceCents) / 100),
  }));

  // ── Discipline ────────────────────────────────────────────────────────
  const discipline: DisciplineRow[] = leaguePlayers
    .filter((p) => p.clubId && (p.yellowCardsSeason > 0 || p.redCardsSeason > 0))
    .sort(
      (a, b) =>
        b.redCardsSeason * 5 + b.yellowCardsSeason -
        (a.redCardsSeason * 5 + a.yellowCardsSeason),
    )
    .slice(0, 6)
    .map((p) => ({
      name: p.name,
      clubName: clubById.get(p.clubId ?? "")?.name ?? "?",
      yellows: p.yellowCardsSeason,
      reds: p.redCardsSeason,
      banned: p.suspensionMatchesLeft > 0 || p.status === "suspended",
    }));

  // ── Next week ─────────────────────────────────────────────────────────
  const nextRound = await db
    .select()
    .from(fixtures)
    .where(
      and(
        eq(fixtures.leagueId, leagueId),
        eq(fixtures.seasonNumber, seasonNumber),
        eq(fixtures.division, division),
        eq(fixtures.weekNumber, weekNumber + 1),
      ),
    );
  const upcoming: UpcomingRow[] = nextRound.map((f) => ({
    homeClubId: f.homeClubId,
    awayClubId: f.awayClubId,
    homeName: clubById.get(f.homeClubId)?.name ?? "?",
    awayName: clubById.get(f.awayClubId)?.name ?? "?",
  }));

  // ── Manager of the week ───────────────────────────────────────────────
  // The win that least deserved to happen: the biggest prestige gap beaten.
  // "Best result" would just crown whoever is top of the table every week.
  let managerOfWeek: NewspaperSections["managerOfWeek"] = null;
  let bestUpset = 0;
  for (const fx of weekFixtures) {
    const home = clubById.get(fx.homeClubId);
    const away = clubById.get(fx.awayClubId);
    if (!home || !away) continue;
    const hs = fx.homeScore ?? 0;
    const as = fx.awayScore ?? 0;
    if (hs === as) continue;
    const winner = hs > as ? home : away;
    const loser = hs > as ? away : home;
    const gap = loser.prestige - winner.prestige;
    if (gap <= bestUpset) continue;
    bestUpset = gap;
    managerOfWeek = {
      clubId: winner.id,
      clubName: winner.name,
      note: `${winner.name}, kâğıt üzerinde üstün olan ${loser.name} karşısında ${Math.max(hs, as)}-${Math.min(hs, as)} kazandı. Haftanın işi buydu.`,
    };
  }

  // ── Numbers ───────────────────────────────────────────────────────────
  const totalGoals = weekFixtures.reduce(
    (s, f) => s + (f.homeScore ?? 0) + (f.awayScore ?? 0),
    0,
  );
  const biggest = [...results].sort(
    (a, b) =>
      Math.abs(b.homeScore - b.awayScore) - Math.abs(a.homeScore - a.awayScore),
  )[0];
  const cleanSheets = weekFixtures.filter(
    (f) => f.homeScore === 0 || f.awayScore === 0,
  ).length;
  const weekStats: NewspaperSections["weekStats"] = [
    {
      label: "Toplam gol",
      value: String(totalGoals),
      note: `${weekFixtures.length} maçta, maç başına ${(totalGoals / weekFixtures.length).toFixed(1)}`,
    },
    ...(biggest
      ? [
          {
            label: "En farklı skor",
            value: `${biggest.homeScore}-${biggest.awayScore}`,
            note: `${biggest.homeName} — ${biggest.awayName}`,
          },
        ]
      : []),
    { label: "Gol yemeyen takım", value: String(cleanSheets) },
  ];

  // ── Colour ────────────────────────────────────────────────────────────
  // Generated from what happened, not from a fixed list — a quote that could
  // have been printed in any week is not colour, it is filler.
  const quotes: NewspaperSections["quotes"] = [];
  if (managerOfWeek) {
    quotes.push({
      voice: `${managerOfWeek.clubName} taraftarı`,
      text: "Kimse bize şans vermiyordu. Sahada kim olduğumuzu gösterdik.",
    });
  }
  const thrashed = results.find(
    (r) => Math.abs(r.homeScore - r.awayScore) >= 3,
  );
  if (thrashed) {
    const beaten =
      thrashed.homeScore > thrashed.awayScore ? thrashed.awayName : thrashed.homeName;
    quotes.push({
      voice: `${beaten} taraftarı`,
      text: "Böyle bir akşamı hak etmedik. Cevabı gelecek hafta sahada vereceğiz.",
    });
  }
  const goalless = results.find((r) => r.homeScore === 0 && r.awayScore === 0);
  if (goalless) {
    quotes.push({
      voice: "Tribün",
      text: `${goalless.homeName} — ${goalless.awayName} maçında kale önü diye bir yer olduğunu unuttuk.`,
    });
  }
  if (transfers.length > 0) {
    quotes.push({
      voice: "Transfer masası",
      text: `${transfers[0].player} el değiştirdi. Bu haftanın en büyük hamlesi ${transfers[0].toName} adına yazıldı.`,
    });
  }

  return {
    results,
    table,
    transfers,
    discipline,
    upcoming,
    managerOfWeek,
    quotes,
    weekStats,
  };
}
