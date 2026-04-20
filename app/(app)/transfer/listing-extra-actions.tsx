"use client";

import { Bookmark as BidBookmark } from "lucide-react";
import { useState, useTransition } from "react";
import { useToast } from "@/components/ui/toast";
import { placeAutoBid } from "./auto-bid-actions";
import { WishlistToggle } from "./wishlist-toggle";

/**
 * Expanded-listing quick actions: auto-bid + wishlist. The auto-bid
 * button opens an inline max-price input; once submitted, the next
 * transfer-bots tick (or a direct buy) completes the purchase the
 * moment the listing price drops at or below the ceiling.
 */
export function ListingExtraActions({
  listingId,
  playerId,
  priceEur,
  watching = false,
}: {
  listingId: string;
  playerId: string;
  priceEur: number;
  watching?: boolean;
}) {
  const [bidOpen, setBidOpen] = useState(false);
  const [maxEur, setMaxEur] = useState(priceEur);
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  const onBid = () => {
    if (maxEur <= 0) {
      toast({
        icon: "⚠",
        title: "Geçersiz",
        body: "Max fiyat 0'dan büyük olmalı.",
        accent: "var(--danger)",
      });
      return;
    }
    startTransition(async () => {
      const res = await placeAutoBid({ listingId, maxEur });
      if (!res.ok) {
        toast({
          icon: "⚠",
          title: "Teklif konamadı",
          body: res.error,
          accent: "var(--danger)",
        });
        return;
      }
      setBidOpen(false);
      toast({
        icon: "🎯",
        title: "Auto-bid aktif",
        body: `Fiyat €${(maxEur / 1_000_000).toFixed(1)}M altına düştüğünde alınacak.`,
        accent: "var(--cyan)",
      });
    });
  };

  return (
    <div
      style={{
        gridColumn: "1 / -1",
        display: "flex",
        gap: 8,
        marginTop: 6,
        paddingTop: 12,
        borderTop: "1px solid var(--border)",
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      {!bidOpen ? (
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={(e) => {
            e.stopPropagation();
            setBidOpen(true);
          }}
          disabled={pending}
          title="Max fiyat ayarla — düşünce otomatik alınır"
          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          <BidBookmark size={12} strokeWidth={1.6} />
          Auto-bid
        </button>
      ) : (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          <input
            type="number"
            value={maxEur}
            onChange={(e) => setMaxEur(Number(e.target.value) || 0)}
            className="input"
            style={{
              padding: "4px 8px",
              fontSize: 12,
              width: 130,
              fontFamily: "var(--font-jetbrains, monospace)",
            }}
            placeholder="Max €"
          />
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={onBid}
            disabled={pending}
            style={{ padding: "4px 10px" }}
          >
            Onayla
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setBidOpen(false)}
            style={{ padding: "4px 8px" }}
          >
            İptal
          </button>
        </div>
      )}
      <WishlistToggle playerId={playerId} initial={watching} />
    </div>
  );
}
