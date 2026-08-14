/**
 * The whole game loop, in one scheduled call.
 *
 * Every job below already had its own route, and none of them was ever
 * invoked in production: there was no `vercel.json`, no QStash schedule, and
 * `CRON_SECRET` was unset. The result is a game that does not run. Four live
 * leagues sat with 234 overdue fixtures between them — one of them had not
 * played a match since April — and half the app (Maç, Gazete, İstatistikler,
 * Profil) rendered an empty state because there was nothing to render.
 *
 * WHY ONE ROUTE INSTEAD OF EIGHT. Vercel's Hobby plan allows two cron entries
 * and daily granularity only, so eight separate schedules cannot be expressed
 * there. Ordering also matters and separate schedules cannot express it: the
 * economy must charge wages against the squad that just played, the AI must
 * pick line-ups before kick-off and trade after it, and the newspaper must
 * report results that already exist.
 *
 * FAILURE ISOLATION. One failing job must not strand the rest — a transfer-bot
 * error should never stop match day. Each step is caught and reported
 * individually, and the response lists what ran and what did not, so a failure
 * is visible in the Vercel cron log rather than silent.
 */
import { NextResponse } from "next/server";
import { verifyCron } from "@/lib/cron/verify";
import {
  processScoutReturns,
  runAiManagers,
  runDailyTraining,
  runMatchDay,
  runPriceDecay,
  runTransferBots,
  runWeeklyEconomy,
  runWeeklyNewspaper,
  syncInactiveManagers,
} from "@/lib/jobs";

/**
 * Order is the point of this file.
 *
 *  1. inactivity  — a club abandoned since yesterday must be under AI control
 *                   before that AI is asked to pick a line-up.
 *  2. ai-managers — bots set their XI and answer pending offers. Must precede
 *                   kick-off or they play whatever they were left with.
 *  3. match-day   — the fixtures due today. Everything below reacts to it.
 *  4. training    — the daily +1 tick, after matches so fitness reflects them.
 *  5. economy     — wages, staff, interest, sponsor. One tick per match day
 *                   (see runWeeklyEconomy); charging before the gate receipts
 *                   land would bankrupt clubs that are actually solvent.
 *  6. scouts      — assignments that came due.
 *  7. price-decay — unsold listings drift down.
 *  8. transfer-bots — market activity on the freshly decayed prices.
 *  9. newspaper   — reports the results, so it runs last.
 */
const STEPS = [
  { name: "inactivity", run: () => syncInactiveManagers() },
  { name: "ai-managers", run: () => runAiManagers() },
  { name: "match-day", run: () => runMatchDay() },
  { name: "training", run: () => runDailyTraining() },
  { name: "economy", run: () => runWeeklyEconomy() },
  { name: "scout-returns", run: () => processScoutReturns() },
  { name: "price-decay", run: () => runPriceDecay() },
  { name: "transfer-bots", run: () => runTransferBots() },
  { name: "newspaper", run: () => runWeeklyNewspaper() },
] as const;

async function runAll() {
  const results: Record<string, unknown> = {};
  const failed: string[] = [];

  for (const step of STEPS) {
    const startedAt = Date.now();
    try {
      results[step.name] = {
        ok: true,
        ms: 0,
        result: await step.run(),
      };
      (results[step.name] as { ms: number }).ms = Date.now() - startedAt;
    } catch (err) {
      failed.push(step.name);
      results[step.name] = {
        ok: false,
        ms: Date.now() - startedAt,
        error: err instanceof Error ? err.message : String(err),
      };
      console.error(`[cron/daily] ${step.name} failed:`, err);
    }
  }

  return NextResponse.json(
    { ranAt: new Date().toISOString(), failed, steps: results },
    // A partial failure is still a failure: return non-200 so the scheduler's
    // log shows it rather than a green tick over a broken game loop.
    { status: failed.length === 0 ? 200 : 500 },
  );
}

/** Vercel Cron issues GET. QStash and cron-job.org POST. Accept both. */
export async function GET(req: Request) {
  const deny = await verifyCron(req);
  if (deny) return deny;
  return runAll();
}

export async function POST(req: Request) {
  const deny = await verifyCron(req);
  if (deny) return deny;
  return runAll();
}

// The sweep covers every league in the database; give it the full budget.
export const maxDuration = 300;
export const dynamic = "force-dynamic";
