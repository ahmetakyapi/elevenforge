/**
 * Run all scheduled fixtures whose time is due.
 * Called by the daily cron (fires at league matchTime).
 */
import { and, eq, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { clubs, fixtures, leagues, players } from "@/lib/schema";
import { applyMatchResult } from "@/lib/engine/apply-match";
import { simulateMatch, type TacticInput } from "@/lib/engine/match";
import { rollSeasonIfDone } from "./season";
import { runCupRound } from "./cup";
import { dispatchMatchPush } from "@/lib/push-dispatch";

/**
 * Derive a stable 32-bit unsigned seed from a fixture UUID. Same fixture →
 * same simulation, regardless of when or how many times we run it. Prevents
 * "refresh-to-reroll" exploits and makes test runs reproducible.
 */
function seedFromFixtureId(fixtureId: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < fixtureId.length; i++) {
    h ^= fixtureId.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

export async function runMatchDay(opts: {
  leagueId?: string;
  /**
   * When true (default), rolls into the next season after the last fixture
   * of the season is played. Tests pass false so they can snapshot the final
   * standings before the season-roll resets clubs.
   */
  autoRoll?: boolean;
} = {}) {
  const autoRoll = opts.autoRoll !== false;
  const now = new Date();
  const due = await db
    .select()
    .from(fixtures)
    .where(
      opts.leagueId
        ? and(
            eq(fixtures.leagueId, opts.leagueId),
            eq(fixtures.status, "scheduled"),
            lte(fixtures.scheduledAt, now),
          )
        : and(
            eq(fixtures.status, "scheduled"),
            lte(fixtures.scheduledAt, now),
          ),
    );

  if (due.length === 0) return { simulated: 0 };

  // Group by league
  const leagueIds = Array.from(new Set(due.map((f) => f.leagueId)));
  let simulated = 0;

  for (const leagueId of leagueIds) {
    const leagueRow = (
      await db.select().from(leagues).where(eq(leagues.id, leagueId)).limit(1)
    )[0];
    if (!leagueRow) continue;

    const leagueFixtures = due.filter((f) => f.leagueId === leagueId);
    for (const fx of leagueFixtures) {
      const [homeRow, awayRow] = await Promise.all([
        db.select().from(clubs).where(eq(clubs.id, fx.homeClubId)).limit(1),
        db.select().from(clubs).where(eq(clubs.id, fx.awayClubId)).limit(1),
      ]);
      const home = homeRow[0];
      const away = awayRow[0];
      if (!home || !away) continue;

      const [homeSquad, awaySquad] = await Promise.all([
        db.select().from(players).where(eq(players.clubId, home.id)),
        db.select().from(players).where(eq(players.clubId, away.id)),
      ]);

      const homeTactics: TacticInput = {
        formation: home.formation,
        mentality: home.mentality,
        pressing: home.pressing,
        tempo: home.tempo,
      };
      const awayTactics: TacticInput = {
        formation: away.formation,
        mentality: away.mentality,
        pressing: away.pressing,
        tempo: away.tempo,
      };

      // Deterministic seed: stored on the fixture row at first sim and
      // reused thereafter. Replays produce identical scorelines.
      const seed = fx.rngSeed ?? seedFromFixtureId(fx.id);
      const result = simulateMatch({
        homeClubId: home.id,
        awayClubId: away.id,
        homeClubName: home.name,
        awayClubName: away.name,
        homeSquad,
        awaySquad,
        homeTactics,
        awayTactics,
        homeCity: home.city,
        awayCity: away.city,
        homeStadiumLevel: home.stadiumLevel,
        homePrestige: home.prestige,
        seed,
      });

      await db
        .update(fixtures)
        .set({ rngSeed: seed })
        .where(eq(fixtures.id, fx.id));
      await applyMatchResult(fx.id, leagueId, result);
      // Push notify both club owners (no-op if they have no subscription)
      await dispatchMatchPush({
        leagueId,
        homeClubId: home.id,
        awayClubId: away.id,
        homeClubName: home.name,
        awayClubName: away.name,
        homeScore: result.homeScore,
        awayScore: result.awayScore,
      }).catch(() => {});
      simulated++;
    }

    // Cup ties scheduled for today, if any.
    await runCupRound({ leagueId }).catch(() => {});

    // Bump league week number
    await db
      .update(leagues)
      .set({ weekNumber: leagueRow.weekNumber + 1 })
      .where(eq(leagues.id, leagueId));

    // If we just played the last scheduled round, roll into next season
    // (age players, decay veterans, regenerate fixtures). Tests opt out so
    // they can snapshot the final standings.
    if (autoRoll) await rollSeasonIfDone(leagueId);
  }

  return { simulated };
}
