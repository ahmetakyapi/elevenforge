import { requireLeagueContext } from "@/lib/session";
import { loadCrewData } from "@/lib/queries/crew";
import CrewUi from "./crew-ui";

export const dynamic = "force-dynamic";

export default async function CrewPage() {
  const ctx = await requireLeagueContext();
  const data = await loadCrewData(ctx);
  return <CrewUi data={data} />;
}
