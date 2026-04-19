/**
 * Daily training + recovery tick.
 *  - Every active player on "training" status gets a small overall bump.
 *    Young players (<=22) progress 3x faster; high-potential players gain more.
 *  - Injured players whose injuryUntil has passed → back to "active".
 *  - Suspension matches counted down (done post-match, but safety sync here).
 *  - Fitness regenerates by +8 per day, capped at 100.
 */
import { eq, lte, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { players } from "@/lib/schema";

export async function runDailyTraining(opts: { leagueId?: string } = {}) {
  const where = opts.leagueId ? eq(players.leagueId, opts.leagueId) : undefined;
  const allPlayers = await (where
    ? db.select().from(players).where(where)
    : db.select().from(players));

  const now = new Date();
  let promoted = 0;
  let healed = 0;
  let fitnessBumped = 0;

  for (const p of allPlayers) {
    const updates: Partial<typeof players.$inferInsert> = {};

    // Injury recovery
    if (p.status === "injured" && p.injuryUntil && p.injuryUntil <= now) {
      updates.status = "active";
      updates.injuryUntil = null;
      healed++;
    }

    // Training progression
    if ((updates.status ?? p.status) === "training" && p.overall < p.potential) {
      const ageBonus = p.age <= 19 ? 3 : p.age <= 22 ? 2 : p.age <= 26 ? 1 : 0.5;
      const progress = Math.random() < 0.35 * ageBonus / 2 ? 1 : 0;
      if (progress > 0) {
        updates.overall = Math.min(p.potential, p.overall + 1);
        promoted++;
      }
    }

    // Fitness regen
    if (p.fitness < 100) {
      updates.fitness = Math.min(100, p.fitness + 8);
      fitnessBumped++;
    }

    if (Object.keys(updates).length > 0) {
      await db.update(players).set(updates).where(eq(players.id, p.id));
    }
  }

  return { promoted, healed, fitnessBumped };
}

export async function runWeeklyEconomy(opts: { leagueId?: string } = {}) {
  // Weekly wage deduction + bank interest on positive balance + sponsor
  // contract tick (decrements weeksLeft, pays season bonus + ends contract).
  const { clubs, players, feedEvents } = await import("@/lib/schema");
  const allClubs = await (opts.leagueId
    ? db.select().from(clubs).where(eq(clubs.leagueId, opts.leagueId))
    : db.select().from(clubs));
  for (const c of allClubs) {
    const squad = await db
      .select({ wage: players.wageCents })
      .from(players)
      .where(eq(players.clubId, c.id));
    const weeklyWage = squad.reduce((s, r) => s + Number(r.wage), 0);
    const interest = Math.max(0, Math.round(c.balanceCents * 0.005)); // 0.5% weekly on positive
    // Staff weekly wages — head coach + physio + scout combined.
    let staffWage = 0;
    if (c.staffJson) {
      try {
        const raw = JSON.parse(c.staffJson) as Partial<{
          headCoach: { id: string };
          physio: { id: string };
          scout: { id: string };
        }>;
        const { staffById } = await import("@/lib/staff");
        for (const ref of [raw.headCoach, raw.physio, raw.scout]) {
          if (!ref) continue;
          const m = staffById(ref.id);
          if (m) staffWage += m.weeklyWageCents;
        }
      } catch {}
    }
    let delta = -weeklyWage - staffWage + interest;

    // Sponsor tick
    let nextSponsorJson: string | null = c.activeSponsorJson;
    if (c.activeSponsorJson) {
      try {
        const sp = JSON.parse(c.activeSponsorJson) as {
          name: string;
          payPerMatchCents: number;
          bonusPerWinCents: number;
          seasonBonusCents: number;
          weeksLeft: number;
        };
        const remaining = sp.weeksLeft - 1;
        if (remaining <= 0) {
          // Final tick — pay season bonus and clear sponsor.
          delta += sp.seasonBonusCents;
          nextSponsorJson = null;
          await db.insert(feedEvents).values({
            leagueId: c.leagueId,
            clubId: c.id,
            eventType: "morale",
            text: `${c.name} ${sp.name} sponsorluk dönemini tamamladı — sezon bonusu €${(sp.seasonBonusCents / 100 / 1_000_000).toFixed(1)}M ödendi.`,
          });
        } else {
          nextSponsorJson = JSON.stringify({ ...sp, weeksLeft: remaining });
        }
      } catch {
        // malformed JSON — clear it
        nextSponsorJson = null;
      }
    }

    await db
      .update(clubs)
      .set({
        balanceCents: c.balanceCents + delta,
        activeSponsorJson: nextSponsorJson,
      })
      .where(eq(clubs.id, c.id));
  }
  return { clubs: allClubs.length };
}
