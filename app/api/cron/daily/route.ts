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
 * WHO CALLS IT. `.github/workflows/game-loop.yml` hourly, because leagues
 * choose their own kick-off time and a daily trigger would leave a 21:00
 * fixture unplayed until the next day. `vercel.json` also holds a daily entry
 * as a backstop for when Actions is paused — a public repo's schedules stop
 * after 60 days of inactivity. Two independent triggers are safe precisely
 * because every step below claims its own work first.
 *
 * FAILURE ISOLATION. One failing job must not strand the rest — a transfer-bot
 * error should never stop match day. Each step is caught and reported
 * individually, and the response lists what ran and what did not, so a failure
 * is visible in the Vercel cron log rather than silent.
 */
import { NextResponse } from "next/server";
import { verifyCron } from "@/lib/cron/verify";
import { resolveTransferBids } from "@/lib/jobs/bids";
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
 *  7. price-decay — unsold listings drift down (auctions are exempt).
 *  8. bids        — auctions whose deadline has passed are awarded. After
 *                   ai-managers, because that is where bots place their bids;
 *                   before transfer-bots, whose free-agent top-up counts open
 *                   listings and must not restock against ones about to close.
 *  9. transfer-bots — market activity on the freshly decayed prices.
 * 10. newspaper   — reports the results, so it runs last.
 */
const STEPS = [
  { name: "inactivity", run: () => syncInactiveManagers() },
  { name: "ai-managers", run: () => runAiManagers() },
  { name: "match-day", run: () => runMatchDay() },
  { name: "training", run: () => runDailyTraining() },
  { name: "economy", run: () => runWeeklyEconomy() },
  { name: "scout-returns", run: () => processScoutReturns() },
  { name: "price-decay", run: () => runPriceDecay() },
  { name: "bids", run: () => resolveTransferBids() },
  { name: "transfer-bots", run: () => runTransferBots() },
  { name: "newspaper", run: () => runWeeklyNewspaper() },
] as const;

/**
 * Stop starting new steps this late into the invocation.
 *
 * The platform kills the function at `maxDuration` and the response is lost,
 * so a sweep that overruns reports nothing at all — the Actions log shows a
 * timeout and which steps ran is anyone's guess. Measured on the first sweep
 * of a day, `ai-managers` alone took 236s of the 300s budget, because that is
 * the run where all 120 clubs are still unclaimed.
 *
 * Deferring is cheap and correct: every step claims its own work, so whatever
 * is skipped simply runs on the next hourly sweep. What matters is that the
 * skip is deliberate and reported rather than a silent 504.
 */
const SOFT_DEADLINE_MS = 240_000;

async function runAll() {
  const results: Record<string, unknown> = {};
  const failed: string[] = [];
  const deferred: string[] = [];
  const sweepStartedAt = Date.now();

  for (const step of STEPS) {
    if (Date.now() - sweepStartedAt > SOFT_DEADLINE_MS) {
      deferred.push(step.name);
      results[step.name] = { ok: true, deferred: true };
      continue;
    }
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

  if (deferred.length > 0) {
    console.warn(
      `[cron/daily] deferred to the next sweep after ${Math.round(
        (Date.now() - sweepStartedAt) / 1000,
      )}s: ${deferred.join(", ")}`,
    );
  }

  return NextResponse.json(
    {
      ranAt: new Date().toISOString(),
      elapsedMs: Date.now() - sweepStartedAt,
      failed,
      deferred,
      steps: results,
    },
    // A partial failure is still a failure: return non-200 so the scheduler's
    // log shows it rather than a green tick over a broken game loop. Deferral
    // is NOT a failure — the work is claimed by nobody and runs next hour.
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
