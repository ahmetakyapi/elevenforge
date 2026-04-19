import { requireLeagueContext } from "@/lib/session";
import { loadLatestNewspaper } from "@/lib/queries/newspaper";
import NewspaperUi from "./newspaper-ui";

export const dynamic = "force-dynamic";

export default async function NewspaperPage() {
  const ctx = await requireLeagueContext();
  const paper = await loadLatestNewspaper(ctx);
  return <NewspaperUi paper={paper} />;
}
