/**
 * League table ordering.
 *
 * The table was previously ordered in SQL by points → goal difference →
 * goals for, with nothing after that. Two clubs level on all three came back
 * in whatever order Postgres happened to return them, which meant the
 * standings could reorder between two page loads with no match played in
 * between — and, at the end of a season, which club took the title (and the
 * €120M) was effectively arbitrary.
 *
 * This adds the head-to-head record as a tiebreak and a final deterministic
 * fallback, so the table is stable and reproducible.
 */

export type StandingsClub = {
  id: string;
  name: string;
  seasonPoints: number;
  seasonGoalsFor: number;
  seasonGoalsAgainst: number;
};

export type StandingsFixture = {
  homeClubId: string;
  awayClubId: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
};

type HeadToHead = { points: number; scored: number; conceded: number };

/**
 * Head-to-head record of `clubId` restricted to matches against `rivals`.
 * Only meaningful when comparing clubs that are otherwise level.
 */
function headToHead(
  clubId: string,
  rivals: Set<string>,
  fixtures: StandingsFixture[],
): HeadToHead {
  const acc: HeadToHead = { points: 0, scored: 0, conceded: 0 };
  for (const f of fixtures) {
    if (f.status !== "finished") continue;
    if (f.homeScore === null || f.awayScore === null) continue;
    const isHome = f.homeClubId === clubId;
    const isAway = f.awayClubId === clubId;
    if (!isHome && !isAway) continue;
    const opponent = isHome ? f.awayClubId : f.homeClubId;
    if (!rivals.has(opponent)) continue;
    const gf = isHome ? f.homeScore : f.awayScore;
    const ga = isHome ? f.awayScore : f.homeScore;
    acc.scored += gf;
    acc.conceded += ga;
    acc.points += gf > ga ? 3 : gf === ga ? 1 : 0;
  }
  return acc;
}

/**
 * Sort clubs into league-table order.
 *
 * Order: points → goal difference → goals for → head-to-head points →
 * head-to-head goal difference → name. The name comparison is never a
 * football rule; it exists so the result is deterministic rather than
 * dependent on row order.
 */
export function sortStandings<T extends StandingsClub>(
  clubs: T[],
  fixtures: StandingsFixture[],
): T[] {
  const gd = (c: StandingsClub) => c.seasonGoalsFor - c.seasonGoalsAgainst;

  // Group clubs that are level on the primary criteria; head-to-head is only
  // computed within such a group, which is both correct and cheap.
  const keyOf = (c: StandingsClub) =>
    `${c.seasonPoints}|${gd(c)}|${c.seasonGoalsFor}`;
  const groups = new Map<string, Set<string>>();
  for (const c of clubs) {
    const key = keyOf(c);
    const set = groups.get(key);
    if (set) set.add(c.id);
    else groups.set(key, new Set([c.id]));
  }

  const h2hCache = new Map<string, HeadToHead>();
  const h2hFor = (c: StandingsClub): HeadToHead => {
    const cached = h2hCache.get(c.id);
    if (cached) return cached;
    const rivals = new Set(groups.get(keyOf(c)) ?? []);
    rivals.delete(c.id);
    const computed =
      rivals.size === 0
        ? { points: 0, scored: 0, conceded: 0 }
        : headToHead(c.id, rivals, fixtures);
    h2hCache.set(c.id, computed);
    return computed;
  };

  return [...clubs].sort((a, b) => {
    if (b.seasonPoints !== a.seasonPoints) return b.seasonPoints - a.seasonPoints;
    if (gd(b) !== gd(a)) return gd(b) - gd(a);
    if (b.seasonGoalsFor !== a.seasonGoalsFor) {
      return b.seasonGoalsFor - a.seasonGoalsFor;
    }
    const ha = h2hFor(a);
    const hb = h2hFor(b);
    if (hb.points !== ha.points) return hb.points - ha.points;
    const hgdA = ha.scored - ha.conceded;
    const hgdB = hb.scored - hb.conceded;
    if (hgdB !== hgdA) return hgdB - hgdA;
    if (hb.scored !== ha.scored) return hb.scored - ha.scored;
    return a.name.localeCompare(b.name, "tr");
  });
}
