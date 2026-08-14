import "./load-env";
import { runMatchDay, runDailyTraining, runWeeklyEconomy, runWeeklyNewspaper, runAiManagers, runPriceDecay, runTransferBots, processScoutReturns, syncInactiveManagers } from "@/lib/jobs";
const STEPS: Array<[string, () => Promise<unknown>]> = [
  ["inactivity", () => syncInactiveManagers()],
  ["ai-managers", () => runAiManagers()],
  ["match-day", () => runMatchDay()],
  ["training", () => runDailyTraining()],
  ["economy", () => runWeeklyEconomy()],
  ["scout-returns", () => processScoutReturns()],
  ["price-decay", () => runPriceDecay()],
  ["transfer-bots", () => runTransferBots()],
  ["newspaper", () => runWeeklyNewspaper()],
];
async function main() {
  for (const [name, run] of STEPS) {
    const t = Date.now();
    try { console.log(`${name.padEnd(14)} ${JSON.stringify(await run())}  (${Date.now() - t}ms)`); }
    catch (e) { console.log(`${name.padEnd(14)} FAILED: ${e instanceof Error ? e.message : e}`); }
  }
}
main().then(() => process.exit(0));
