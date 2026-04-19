import { requireLeagueContext } from "@/lib/session";
import { loadSquad } from "@/lib/queries/squad";
import SquadUi from "./squad-ui";

export const dynamic = "force-dynamic";

export default async function SquadPage() {
  const ctx = await requireLeagueContext();
  const squad = await loadSquad(ctx);
  return (
    <SquadUi
      squad={squad}
      userClubId={ctx.club.id}
      userClubName={ctx.club.name}
      userClubCrest={{
        color: ctx.club.color,
        color2: ctx.club.color2,
        short: ctx.club.shortName,
      }}
    />
  );
}
