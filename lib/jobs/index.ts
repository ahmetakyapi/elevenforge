export { runMatchDay } from "./match-day";
export { runTransferBots } from "./transfer-bots";
export { runPriceDecay } from "./price-decay";
export {
  processScoutReturns,
  sendScout,
  claimScoutPlayer,
} from "./scout";
export { runDailyTraining, runWeeklyEconomy } from "./training";
export { runWeeklyNewspaper, generateNewspaper } from "./newspaper";
export { runAiManagers } from "@/lib/ai/manager";
export { syncInactiveManagers } from "@/lib/ai/inactivity";
export { resolveTransferBids, cancelBidsForListings } from "./bids";
