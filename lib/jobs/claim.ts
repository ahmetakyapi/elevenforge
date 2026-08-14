/**
 * Atomic once-per-period claim for a global scheduled job.
 *
 * The per-club jobs guard themselves — the economy tick claims each club with
 * a conditional UPDATE on `lastEconomyRunAt`, the AI manager on `aiLastRunAt`.
 * The jobs that operate on every row at once have nothing to claim, so they
 * need a marker of their own.
 *
 * The whole thing is a single statement. `INSERT … ON CONFLICT DO UPDATE …
 * WHERE` lets Postgres decide, under row lock, whether the previous run is old
 * enough — so two concurrent invocations (a scheduler retry landing on a
 * second serverless instance) cannot both win. A read-then-write would race.
 */
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { jobRuns } from "@/lib/schema";

export const ONE_DAY_MS = 24 * 3600 * 1000;

/**
 * Try to claim `key` for this run.
 *
 * Returns true when the caller owns the tick and should do the work, false
 * when another run already did it inside `cooldownMs`.
 *
 * The cooldown is deliberately shorter than a day for daily jobs: a scheduler
 * that fires at 03:00:04 one night and 02:59:58 the next must not skip a day
 * over six seconds of jitter.
 */
export async function claimJob(
  key: string,
  cooldownMs = 20 * 3600 * 1000,
): Promise<boolean> {
  const cutoff = new Date(Date.now() - cooldownMs);
  const claimed = await db
    .insert(jobRuns)
    .values({ key, ranAt: new Date() })
    .onConflictDoUpdate({
      target: jobRuns.key,
      set: { ranAt: new Date() },
      setWhere: sql`${jobRuns.ranAt} <= ${cutoff}`,
    })
    .returning();
  return claimed.length > 0;
}
