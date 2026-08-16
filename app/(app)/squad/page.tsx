import { LiveRefresh } from "@/components/dashboard-auto-refresh";
import { requireLeagueContext } from "@/lib/session";
import { loadSquad } from "@/lib/queries/squad";
import { parseStaffJson } from "@/lib/staff";
import SquadUi from "./squad-ui";

export const dynamic = "force-dynamic";

export default async function SquadPage() {
  const ctx = await requireLeagueContext();
  const squad = await loadSquad(ctx);
  return (
    <>
      <LiveRefresh intervalMs={60_000} />
      <SquadUi
        squad={squad}
        userClubId={ctx.club.id}
        userClubName={ctx.club.name}
        userClubCrest={{
          color: ctx.club.color,
          color2: ctx.club.color2,
          short: ctx.club.shortName,
        }}
        // The two things a club buys that change how fast players develop.
        // Without them the training preview would quote the same number to a
        // club with a level-5 ground and a gold coach as to one with neither,
        // which is exactly the information the preview exists to give.
        formation={ctx.club.formation}
        trainingLevel={ctx.club.trainingLevel}
        coachTier={parseStaffJson(ctx.club.staffJson).headCoach?.tier ?? 0}
      />
    </>
  );
}
