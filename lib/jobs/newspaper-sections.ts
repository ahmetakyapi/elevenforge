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
import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  clubs,
  fixtures,
  players,
  transferHistory,
  users,
  type Club,
  type Fixture,
} from "@/lib/schema";
import { managersByClub } from "@/lib/managers";
import { sortStandings } from "@/lib/standings";
import {
  column,
  leadArticle,
  letters as buildLetters,
  managerCard,
  matchVerdict,
  predictions as buildPredictions,
  rumours as buildRumours,
  seededRng,
} from "./newspaper-prose";

/** Stable 32-bit seed from a string, so a league-week always reads the same. */
function hashSeed(key: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

export type ResultRow = {
  homeClubId: string;
  awayClubId: string;
  homeName: string;
  awayName: string;
  homeScore: number;
  awayScore: number;
  /** The verdict — written, not templated from the scoreline alone. */
  report: string;
  /** Scorers, in the order they scored. */
  scorers: string[];
  derby: boolean;
  /** Who was in the dugout. A report about clubs is a report about nobody. */
  homeManager: string;
  awayManager: string;
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
  managerOfWeek: {
    clubId: string;
    clubName: string;
    managerName: string;
    note: string;
  } | null;
  /** Short lines of colour, generated from what actually happened. */
  quotes: Array<{ voice: string; text: string }>;
  /** Numbers worth printing: goals, biggest win, cleanest sheet. */
  weekStats: Array<{ label: string; value: string; note?: string }>;

  // ── The parts that make it a paper rather than a results service ──────
  /** Three paragraphs on the lead match. */
  lead: string[];
  /** A signed opinion piece about the week. */
  column: { author: string; title: string; body: string[] } | null;
  /** Every manager, graded on the week. */
  managerCards: Array<{
    manager: string;
    club: string;
    grade: string;
    note: string;
    human: boolean;
  }>;
  /** Deliberately unreliable transfer gossip. */
  rumours: string[];
  /** Letters to the editor. */
  letters: Array<{ from: string; text: string }>;
  /** Calls on next week's fixtures, made with no evidence whatsoever. */
  predictions: Array<{ fixture: string; call: string }>;
  /** The club of the week, as opposed to the eleven. */
  clubOfWeek: {
    clubName: string;
    managerName: string;
    line: string;
  } | null;
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
  lead: [],
  column: null,
  managerCards: [],
  rumours: [],
  letters: [],
  predictions: [],
  clubOfWeek: null,
};

// The old one-sentence verdict template lived here. It has been replaced by
// matchVerdict in ./newspaper-prose.ts, which knows who the managers are and
// therefore has something to be rude about.

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
  const { leagueId, seasonNumber, weekNumber } = opts;
  if (opts.weekFixtures.length === 0) return EMPTY_SECTIONS;

  /*
    ONE DIVISION PER PAPER.

    The caller hands over every finished fixture of the week, and a league can
    have two tiers playing on the same day. The table was already scoped to a
    division, but the results and the manager report cards were not — so the
    paper printed a Süper Lig table above a results list that also contained
    1. Lig matches, and graded thirty-six managers against a table of
    eighteen. The tiers are separate competitions; a paper that mixes them is
    reporting on a league that does not exist.

    The top flight is the front page when it played; otherwise the paper
    covers whichever tier actually has fixtures.
  */
  const divisionsPlayed = [...new Set(opts.weekFixtures.map((f) => f.division))];
  const division = divisionsPlayed.includes(1) ? 1 : divisionsPlayed[0];
  const weekFixtures = opts.weekFixtures.filter((f) => f.division === division);
  if (weekFixtures.length === 0) return EMPTY_SECTIONS;

  const leagueClubs = await db
    .select()
    .from(clubs)
    .where(eq(clubs.leagueId, leagueId));
  const clubById = new Map<string, Club>(leagueClubs.map((c) => [c.id, c]));

  /*
    Who is in the dugout.

    A match report that only names clubs is a report about logos. Human
    managers get the name on their account; bot clubs get a stable invented
    one (see lib/managers.ts), because a paper that can only be rude about
    half the division is not much of a paper.
  */
  const ownerIds = leagueClubs
    .map((c) => c.ownerUserId)
    .filter((v): v is string => Boolean(v));
  const owners = new Map(
    ownerIds.length > 0
      ? (
          await db
            .select({ id: users.id, name: users.name })
            .from(users)
            .where(inArray(users.id, ownerIds))
        ).map((u) => [u.id, u.name] as const)
      : [],
  );
  const managerBy = managersByClub(leagueClubs, owners);
  const managerName = (clubId: string) =>
    managerBy.get(clubId)?.name ?? "Teknik Direktör";

  // One seed per league-week, so regenerating a paper reproduces it exactly
  // rather than quietly rewriting the jokes people already quoted.
  const rng = seededRng(
    hashSeed(`${leagueId}:${seasonNumber}:${weekNumber}`),
  );

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
    const winner = hs >= as ? homeName : awayName;
    const loser = hs >= as ? awayName : homeName;
    const winnerManager = managerName(hs >= as ? fx.homeClubId : fx.awayClubId);
    const loserManager = managerName(hs >= as ? fx.awayClubId : fx.homeClubId);
    return {
      homeClubId: fx.homeClubId,
      awayClubId: fx.awayClubId,
      homeName,
      awayName,
      homeScore: hs,
      awayScore: as,
      report: matchVerdict(
        {
          winner,
          loser,
          winnerManager,
          loserManager,
          home: homeName,
          away: awayName,
          diff: Math.abs(hs - as),
          goalless: hs === 0 && as === 0,
          drawn: hs === as,
          derby,
        },
        rng,
      ),
      scorers: scorersOf(fx, playerNameById),
      derby,
      homeManager: managerName(fx.homeClubId),
      awayManager: managerName(fx.awayClubId),
    };
  });

  // ── Table, with a form guide ──────────────────────────────────────────
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
      managerName: managerName(winner.id),
      note: `${managerName(winner.id)}, kâğıt üzerinde üstün olan ${loser.name} karşısında ${Math.max(hs, as)}-${Math.min(hs, as)} kazandı. Bu hafta kimse bunu yapamadı.`,
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

  // ── The written paper ─────────────────────────────────────────────────
  // Everything below is prose. It is composed here rather than in the UI so a
  // paper is FIXED at publication: the joke you read on Tuesday is the joke
  // your rival reads on Thursday, and re-rendering the page cannot rewrite it.

  const managerList = leagueClubs
    .filter((c) => c.division === division)
    .map((c) => ({ manager: managerName(c.id), club: c.name }));

  // Lead story: the match the cover is about, which is the biggest margin.
  const heroResult =
    [...results].sort(
      (a, b) =>
        Math.abs(b.homeScore - b.awayScore) - Math.abs(a.homeScore - a.awayScore),
    )[0] ?? null;
  const heroFixture = heroResult
    ? weekFixtures.find(
        (f) =>
          f.homeClubId === heroResult.homeClubId &&
          f.awayClubId === heroResult.awayClubId,
      )
    : undefined;
  let heroReferee = "hakem";
  if (heroFixture?.statsJson) {
    try {
      const st = JSON.parse(heroFixture.statsJson) as { refereeName?: string };
      if (st?.refereeName) heroReferee = st.refereeName;
    } catch {
      /* unreadable stats — the generic word still reads correctly */
    }
  }
  const lead = heroResult
    ? leadArticle(
        {
          winner:
            heroResult.homeScore >= heroResult.awayScore
              ? heroResult.homeName
              : heroResult.awayName,
          loser:
            heroResult.homeScore >= heroResult.awayScore
              ? heroResult.awayName
              : heroResult.homeName,
          winnerManager:
            heroResult.homeScore >= heroResult.awayScore
              ? heroResult.homeManager
              : heroResult.awayManager,
          loserManager:
            heroResult.homeScore >= heroResult.awayScore
              ? heroResult.awayManager
              : heroResult.homeManager,
          home: heroResult.homeName,
          away: heroResult.awayName,
          diff: Math.abs(heroResult.homeScore - heroResult.awayScore),
          goalless: heroResult.homeScore === 0 && heroResult.awayScore === 0,
          drawn: heroResult.homeScore === heroResult.awayScore,
          derby: heroResult.derby,
          homeScore: heroResult.homeScore,
          awayScore: heroResult.awayScore,
          scorers: heroResult.scorers,
          crowd: 0,
          referee: heroReferee,
        },
        rng,
      )
    : [];

  const topRow = table[0];
  const bottomRow = table[table.length - 1];
  const columnPiece =
    topRow && bottomRow
      ? column(
          {
            topClub: topRow.name,
            topManager: managerName(topRow.clubId),
            bottomClub: bottomRow.name,
            bottomManager: managerName(bottomRow.clubId),
            upsetClub: managerOfWeek?.clubName ?? null,
            upsetManager: managerOfWeek?.managerName ?? null,
            biggestScore: biggest
              ? `${biggest.homeScore}-${biggest.awayScore}`
              : null,
            totalGoals,
            matchCount: weekFixtures.length,
          },
          rng,
        )
      : null;

  // Report cards. Ranked by grade so the paper opens on whoever had the week,
  // which is how a report card page is read.
  const rankByClub = new Map(table.map((t, i) => [t.clubId, i + 1]));
  const managerCards = weekFixtures
    .flatMap((fx) => {
      const build = (clubId: string, gf: number, ga: number, oppId: string) => {
        const club = clubById.get(clubId);
        const opp = clubById.get(oppId);
        if (!club || !opp) return [];
        const ref = managerBy.get(clubId);
        return [
          managerCard(
            {
              manager: ref?.name ?? "Teknik Direktör",
              club: club.name,
              result: gf > ga ? "W" : gf === ga ? "D" : "L",
              goalsFor: gf,
              goalsAgainst: ga,
              // Positive when the opponent was the stronger side on paper.
              prestigeEdge:
                gf > ga
                  ? opp.prestige - club.prestige
                  : gf < ga
                    ? -(club.prestige - opp.prestige)
                    : 0,
              rank: rankByClub.get(clubId) ?? table.length,
              totalClubs: Math.max(1, table.length),
              human: ref?.human ?? false,
            },
            rng,
          ),
        ];
      };
      const hs = fx.homeScore ?? 0;
      const as = fx.awayScore ?? 0;
      return [
        ...build(fx.homeClubId, hs, as, fx.awayClubId),
        ...build(fx.awayClubId, as, hs, fx.homeClubId),
      ];
    })
    .sort((a, b) => GRADE_ORDER.indexOf(a.grade) - GRADE_ORDER.indexOf(b.grade));

  // Club of the week: best goal difference on the week, which is a different
  // question from "who beat the strongest opponent" (that is manager of the
  // week) and so does not simply repeat it.
  let clubOfWeek: NewspaperSections["clubOfWeek"] = null;
  let bestSwing = -99;
  for (const r of results) {
    const pairs: Array<[string, string, number]> = [
      [r.homeName, r.homeManager, r.homeScore - r.awayScore],
      [r.awayName, r.awayManager, r.awayScore - r.homeScore],
    ];
    for (const [name, mgr, swing] of pairs) {
      if (swing <= bestSwing) continue;
      bestSwing = swing;
      clubOfWeek = {
        clubName: name,
        managerName: mgr,
        line:
          swing >= 3
            ? `${name} bu hafta kimseye şans tanımadı. ${mgr} istediği her şeyi aldı.`
            : swing > 0
              ? `${name} işini temiz yaptı. ${mgr} için sakin bir hafta.`
              : `${name} en azından dağılmadı. ${mgr} bunu bir başlangıç sayacak.`,
      };
    }
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
    lead,
    column: columnPiece,
    managerCards,
    rumours: buildRumours(managerList, rng),
    letters: buildLetters(
      { managers: managerList, topClub: topRow?.name ?? "lider" },
      rng,
    ),
    predictions: buildPredictions(upcoming, rng),
    clubOfWeek,
  };
}

/** Best grade first — the report-card page is read from the top. */
const GRADE_ORDER = ["A+", "A", "B", "C", "D", "F", "—"];
