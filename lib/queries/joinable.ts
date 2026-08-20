/**
 * Which clubs a new manager can take over, and what taking each one means.
 *
 * ─── Why this exists ────────────────────────────────────────────────────
 *
 * `joinLeagueByInviteCode` picked a club by sorting the bots by `id` and
 * taking the first one that a conditional UPDATE would claim. `id` is a
 * random UUID, so the "choice" was a coin toss across the whole league —
 * including the second division, which the joiner was never told about.
 *
 * Three friends joining the same league got, in whatever order they happened
 * to type the code: the title favourite, a mid-table side, and a 1. Lig club
 * with no way to know why. The in-code comment claimed it preferred a
 * mid-strength bot; it did nothing of the sort.
 *
 * Joining is the first decision a manager makes and it shapes the entire
 * season. It should be a decision, and it needs the numbers that make it one:
 * which tier, how good the squad is, what the board expects, what is in the
 * bank.
 */
import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { clubs, players } from "@/lib/schema";

export type JoinableClub = {
  id: string;
  name: string;
  shortName: string;
  city: string;
  color: string;
  color2: string;
  division: number;
  prestige: number;
  budgetEur: number;
  squadSize: number;
  /** Mean overall of the squad — the honest one-number summary. */
  avgOverall: number;
  /** Best player, because that is what everyone actually looks at first. */
  starName: string | null;
  starOverall: number | null;
  /** What the board will expect of this club, in the manager's language. */
  expectation: string;
};

/** Board expectation, phrased the way the club would phrase it. */
function expectationFor(division: number, prestige: number): string {
  if (division === 2) {
    return prestige >= 26 ? "Küme çıkma yarışı" : "Ligde kal, kadroyu kur";
  }
  if (prestige >= 78) return "Şampiyonluk bekleniyor";
  if (prestige >= 60) return "İlk dörde gir";
  if (prestige >= 40) return "Orta sıra yeterli";
  return "Küme düşme, sonra düşün";
}

export async function loadJoinableClubs(
  leagueId: string,
): Promise<JoinableClub[]> {
  const rows = await db
    .select()
    .from(clubs)
    .where(
      and(
        eq(clubs.leagueId, leagueId),
        eq(clubs.isBot, true),
        isNull(clubs.ownerUserId),
      ),
    );
  if (rows.length === 0) return [];

  /*
    Squad summaries in ONE query rather than one per club.

    A league is 36 clubs across two tiers; a per-club round trip here would be
    36 sequential hops on a serverless connection just to render a picker.
  */
  const summaries = await db
    .select({
      clubId: players.clubId,
      squadSize: sql<string>`count(*)`,
      avgOverall: sql<string>`avg(${players.overall})`,
      bestOverall: sql<string>`max(${players.overall})`,
    })
    .from(players)
    .where(eq(players.leagueId, leagueId))
    .groupBy(players.clubId);
  const byClub = new Map(summaries.map((s) => [s.clubId, s]));

  // The best player per club, for the one line everybody reads first.
  const stars = await db
    .select({ clubId: players.clubId, name: players.name, overall: players.overall })
    .from(players)
    .where(eq(players.leagueId, leagueId));
  const starByClub = new Map<string, { name: string; overall: number }>();
  for (const p of stars) {
    if (!p.clubId) continue;
    const cur = starByClub.get(p.clubId);
    if (!cur || p.overall > cur.overall) {
      starByClub.set(p.clubId, { name: p.name, overall: p.overall });
    }
  }

  return rows
    .map((c) => {
      const s = byClub.get(c.id);
      const star = starByClub.get(c.id);
      return {
        id: c.id,
        name: c.name,
        shortName: c.shortName,
        city: c.city,
        color: c.color,
        color2: c.color2,
        division: c.division,
        prestige: c.prestige,
        budgetEur: Math.round(Number(c.balanceCents) / 100),
        squadSize: Number(s?.squadSize ?? 0),
        avgOverall: Math.round(Number(s?.avgOverall ?? 0) * 10) / 10,
        starName: star?.name ?? null,
        starOverall: star?.overall ?? null,
        expectation: expectationFor(c.division, c.prestige),
      };
    })
    // Strongest first inside each tier: the list reads as a ladder, which is
    // the shape of the decision — how much of a head start do you want.
    .sort((a, b) => a.division - b.division || b.avgOverall - a.avgOverall);
}
