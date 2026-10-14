import { LiveRefresh } from "@/components/dashboard-auto-refresh";
import { requireLeagueContext } from "@/lib/session";
import { loadTransferData } from "@/lib/queries/transfer";
import { loadOffers } from "@/lib/queries/offers";
import TransferUi from "./transfer-ui";
import OffersPanel from "./offers-panel";

export const dynamic = "force-dynamic";

export default async function TransferPage() {
  const ctx = await requireLeagueContext();
  const [data, offers] = await Promise.all([
    loadTransferData(ctx),
    loadOffers(ctx),
  ]);
  return (
    <div className="space-y-8">
      <LiveRefresh intervalMs={30000} />
      {/* Offers lead the page only when there are some. Empty, the panel was
          a full-width "no offers yet" box above the market itself — on a
          phone the first screen of the transfer tab was that box. */}
      {offers.length > 0 && <OffersPanel offers={offers} />}
      <TransferUi data={data} />
      {offers.length === 0 && <OffersPanel offers={offers} />}
    </div>
  );
}
