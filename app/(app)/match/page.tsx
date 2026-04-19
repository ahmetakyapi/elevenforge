import { requireLeagueContext } from "@/lib/session";
import { loadLatestMatch } from "@/lib/queries/match";
import MatchUi from "./match-ui";

export const dynamic = "force-dynamic";

export default async function MatchPage() {
  const ctx = await requireLeagueContext();
  const match = await loadLatestMatch(ctx);
  return <MatchUi match={match} />;
}
