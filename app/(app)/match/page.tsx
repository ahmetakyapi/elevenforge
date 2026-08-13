import { LiveRefresh } from "@/components/dashboard-auto-refresh";
import { requireLeagueContext } from "@/lib/session";
import { loadLatestMatch } from "@/lib/queries/match";
import MatchUi from "./match-ui";

export const dynamic = "force-dynamic";

export default async function MatchPage() {
  const ctx = await requireLeagueContext();
  const match = await loadLatestMatch(ctx);
  return (
    <>
      {/* Match day fires from a cron, so this page has to notice the result
          arriving without the user reloading. */}
      <LiveRefresh intervalMs={30_000} />
      <MatchUi match={match} />
    </>
  );
}
