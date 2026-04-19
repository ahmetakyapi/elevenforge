import { requireLeagueContext } from "@/lib/session";
import { loadTransferData } from "@/lib/queries/transfer";
import TransferUi from "./transfer-ui";

export const dynamic = "force-dynamic";

export default async function TransferPage() {
  const ctx = await requireLeagueContext();
  const data = await loadTransferData(ctx);
  return <TransferUi data={data} />;
}
