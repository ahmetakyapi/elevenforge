/**
 * Single-elimination 16-team cup that runs alongside the league season.
 *
 * Bracket: R1 (8 ties) → QF (4) → SF (2) → Final (1) = 15 fixtures total.
 * Round R fixture in slot N is between the winners of slot 2N and 2N+1
 * from round R-1.
 *
 * Cup matches are scheduled on weeks 4, 8, 12 of the league season (so
 * roughly one cup round every 4 league rounds), with the final on week 15.
 * Prizes: €15M champion, €5M runner-up, +5/+3 prestige.
 */
import { and, asc, eq, inArray, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { clubs, cupFixtures, feedEvents, leagues, players } from "@/lib/schema";
import { simulateMatch } from "@/lib/engine/match";
import { applyMatchTime } from "@/lib/match-time";

const CUP_WEEK_BY_ROUND: Record<number, number> = {
  1: 4,
  2: 8,
  3: 12,
  4: 15,
};

export async function generateCupBracket(
  leagueId: string,
  seasonNumber: number,
): Promise<{ matches: number }> {
  // Wipe any existing cup fixtures for this season (idempotent).
  const existing = await db
    .select({ id: cupFixtures.id })
    .from(cupFixtures)
    .where(
      and(
        eq(cupFixtures.leagueId, leagueId),
        eq(cupFixtures.seasonNumber, seasonNumber),
      ),
    );
  if (existing.length > 0) return { matches: 0 };

  const cs = await db.select().from(clubs).where(eq(clubs.leagueId, leagueId));
  if (cs.length < 16) return { matches: 0 };
  const [lg] = await db.select().from(leagues).where(eq(leagues.id, leagueId));
  if (!lg) return { matches: 0 };

  // Random pairing for R1, scheduled at the league's matchTime.
  const shuffled = [...cs].sort(() => Math.random() - 0.5);
  const today = applyMatchTime(new Date(), lg.matchTime);

  const rows: Array<typeof cupFixtures.$inferInsert> = [];
  // R1: 8 ties from the 16-team pool
  for (let slot = 0; slot < 8; slot++) {
    const home = shuffled[slot * 2];
    const away = shuffled[slot * 2 + 1];
    const day = new Date(today);
    day.setDate(today.getDate() + (CUP_WEEK_BY_ROUND[1] - 1));
    rows.push({
      leagueId,
      seasonNumber,
      round: 1,
      slot,
      homeClubId: home.id,
      awayClubId: away.id,
      scheduledAt: day,
      status: "scheduled",
    });
  }
  // R2-R4: empty placeholders, populated as winners advance
  for (let round = 2; round <= 4; round++) {
    const slots = round === 2 ? 4 : round === 3 ? 2 : 1;
    for (let slot = 0; slot < slots; slot++) {
      const day = new Date(today);
      day.setDate(today.getDate() + (CUP_WEEK_BY_ROUND[round] - 1));
      rows.push({
        leagueId,
        seasonNumber,
        round,
        slot,
        homeClubId: null,
        awayClubId: null,
        scheduledAt: day,
        status: "scheduled",
      });
    }
  }
  await db.insert(cupFixtures).values(rows);
  return { matches: rows.length };
}

/**
 * Play any cup fixtures that are due (scheduledAt <= now). Advances winners
 * into the next round's slot. Called from runMatchDay after league fixtures
 * for the day are processed.
 */
export async function runCupRound(opts: { leagueId: string }): Promise<{
  played: number;
}> {
  const now = new Date();
  const due = await db
    .select()
    .from(cupFixtures)
    .where(
      and(
        eq(cupFixtures.leagueId, opts.leagueId),
        eq(cupFixtures.status, "scheduled"),
        lte(cupFixtures.scheduledAt, now),
      ),
    )
    .orderBy(asc(cupFixtures.round), asc(cupFixtures.slot));

  let played = 0;
  for (const fx of due) {
    if (!fx.homeClubId || !fx.awayClubId) continue; // bracket not yet filled
    const [home] = await db.select().from(clubs).where(eq(clubs.id, fx.homeClubId));
    const [away] = await db.select().from(clubs).where(eq(clubs.id, fx.awayClubId));
    if (!home || !away) continue;
    const [homeSquad, awaySquad] = await Promise.all([
      db.select().from(players).where(eq(players.clubId, home.id)),
      db.select().from(players).where(eq(players.clubId, away.id)),
    ]);
    const seed = hashSeed(fx.id);
    const result = simulateMatch({
      homeClubId: home.id,
      awayClubId: away.id,
      homeClubName: home.name,
      awayClubName: away.name,
      homeSquad,
      awaySquad,
      homeTactics: {
        formation: home.formation,
        mentality: home.mentality,
        pressing: home.pressing,
        tempo: home.tempo,
      },
      awayTactics: {
        formation: away.formation,
        mentality: away.mentality,
        pressing: away.pressing,
        tempo: away.tempo,
      },
      homeCity: home.city,
      awayCity: away.city,
      homeStadiumLevel: home.stadiumLevel,
      homePrestige: home.prestige,
      seed,
    });

    // Cup ties cannot end in a draw — extra-time/pen-shootout sim. Loosely
    // model: if drawn, give home 50/50 chance to win.
    let homeScore = result.homeScore;
    let awayScore = result.awayScore;
    let winnerId: string;
    if (homeScore !== awayScore) {
      winnerId = homeScore > awayScore ? home.id : away.id;
    } else {
      const homeWins = (seed % 2) === 0;
      winnerId = homeWins ? home.id : away.id;
      if (homeWins) homeScore += 1;
      else awayScore += 1;
    }

    await db
      .update(cupFixtures)
      .set({
        status: "finished",
        homeScore,
        awayScore,
        winnerClubId: winnerId,
        playedAt: now,
      })
      .where(eq(cupFixtures.id, fx.id));

    // Apply per-player goals/assists/cards just like league matches do, so
    // a striker's 3 cup goals show up in their season tally + TOTW eligibility.
    const playerIds = result.playerUpdates.map((u) => u.playerId);
    if (playerIds.length > 0) {
      const rows = await db
        .select()
        .from(players)
        .where(inArray(players.id, playerIds));
      for (const row of rows) {
        const u = result.playerUpdates.find((x) => x.playerId === row.id);
        if (!u) continue;
        await db
          .update(players)
          .set({
            goalsSeason: row.goalsSeason + u.goals,
            assistsSeason: row.assistsSeason + u.assists,
            yellowCardsSeason: row.yellowCardsSeason + u.yellow,
            redCardsSeason: row.redCardsSeason + u.red,
          })
          .where(eq(players.id, row.id));
      }
    }

    // Per-round feed event so users see cup progression in their feed,
    // not just a single line at the final.
    const winnerName =
      winnerId === home.id ? home.name : away.name;
    const loserName = winnerId === home.id ? away.name : home.name;
    const roundLabel: Record<number, string> = {
      1: "Kupa Son 16",
      2: "Kupa Çeyrek Final",
      3: "Kupa Yarı Final",
      4: "KUPA FİNALİ",
    };
    await db.insert(feedEvents).values({
      leagueId: opts.leagueId,
      clubId: winnerId,
      eventType: "match",
      text: `${roundLabel[fx.round]}: ${winnerName} ${homeScore}-${awayScore} ${loserName}`,
    });

    // Advance winner to next round's slot.
    if (fx.round < 4) {
      const nextSlot = Math.floor(fx.slot / 2);
      const isHomeOfNext = fx.slot % 2 === 0;
      const [nextFix] = await db
        .select()
        .from(cupFixtures)
        .where(
          and(
            eq(cupFixtures.leagueId, opts.leagueId),
            eq(cupFixtures.seasonNumber, fx.seasonNumber),
            eq(cupFixtures.round, fx.round + 1),
            eq(cupFixtures.slot, nextSlot),
          ),
        )
        .limit(1);
      if (nextFix) {
        await db
          .update(cupFixtures)
          .set(
            isHomeOfNext
              ? { homeClubId: winnerId }
              : { awayClubId: winnerId },
          )
          .where(eq(cupFixtures.id, nextFix.id));
      }
    } else {
      // Final — award prize money + prestige
      const [winner] = await db.select().from(clubs).where(eq(clubs.id, winnerId));
      if (winner) {
        await db
          .update(clubs)
          .set({
            balanceCents: winner.balanceCents + 1_500_000_000, // €15M
            prestige: Math.min(100, winner.prestige + 5),
          })
          .where(eq(clubs.id, winner.id));
        const runnerUpId = winnerId === home.id ? away.id : home.id;
        const [runnerUp] = await db.select().from(clubs).where(eq(clubs.id, runnerUpId));
        if (runnerUp) {
          await db
            .update(clubs)
            .set({
              balanceCents: runnerUp.balanceCents + 500_000_000, // €5M
              prestige: Math.min(100, runnerUp.prestige + 3),
            })
            .where(eq(clubs.id, runnerUp.id));
        }
        await db.insert(feedEvents).values({
          leagueId: opts.leagueId,
          clubId: winner.id,
          eventType: "paper",
          text: `KUPA ${winner.name}'IN! Sezon ${fx.seasonNumber} kupası kaldırıldı.`,
        });
      }
    }
    played++;
  }
  return { played };
}

function hashSeed(id: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}
