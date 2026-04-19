/**
 * Dev-mode cron runner: fires the game-loop jobs on local timers.
 * Usage: `npm run cron:dev` (keep running in a separate terminal).
 *
 * Schedules:
 *  - transfer-bots: every 10 minutes
 *  - price-decay:   every 30 minutes
 *  - scout-returns: every 2 minutes
 *  - training:      every 12 hours
 *  - match-day:     every 5 minutes (picks up any due fixtures)
 *  - newspaper:     every 10 minutes (generates missing papers)
 *  - economy:       every 6 hours
 */
import {
  runDailyTraining,
  runMatchDay,
  runPriceDecay,
  runTransferBots,
  runWeeklyEconomy,
  runWeeklyNewspaper,
  processScoutReturns,
} from "../lib/jobs";

type Job = { name: string; intervalMs: number; run: () => Promise<unknown> };

const MIN = 60 * 1000;
const HOUR = 60 * MIN;

const JOBS: Job[] = [
  { name: "match-day",     intervalMs: 5 * MIN,  run: () => runMatchDay() },
  { name: "transfer-bots", intervalMs: 10 * MIN, run: () => runTransferBots() },
  { name: "price-decay",   intervalMs: 30 * MIN, run: () => runPriceDecay() },
  { name: "scout-returns", intervalMs: 2 * MIN,  run: () => processScoutReturns() },
  { name: "training",      intervalMs: 12 * HOUR, run: () => runDailyTraining() },
  { name: "newspaper",     intervalMs: 10 * MIN, run: () => runWeeklyNewspaper() },
  { name: "economy",       intervalMs: 6 * HOUR, run: () => runWeeklyEconomy() },
];

async function fire(j: Job) {
  const t0 = Date.now();
  try {
    const out = await j.run();
    const ms = Date.now() - t0;
    console.log(`[${new Date().toISOString()}] ${j.name} (${ms}ms) →`, out);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ${j.name} failed:`, err);
  }
}

async function main() {
  console.log("⏰ dev cron runner starting");
  for (const j of JOBS) {
    await fire(j);
    setInterval(() => fire(j), j.intervalMs);
  }
  console.log("✓ all jobs scheduled. Ctrl+C to stop.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
