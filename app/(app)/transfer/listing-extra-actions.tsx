"use client";

import { Bookmark, ArrowDownToLine } from "lucide-react";
import { useState, useTransition } from "react";
import { useToast } from "@/components/ui/toast";
import { placeAutoBid } from "./auto-bid-actions";
import { loanPlayer } from "./loan-actions";

/**
 * Auto-bid + loan quick actions on an expanded listing card. Loan button
 * triggers immediately (€=20% market value, 30 days). Auto-bid opens an
 * inline max-price input and persists when submitted.
 */
export function ListingExtraActions({
  listingId,
  playerId,
  priceEur,
}: {
  listingId: string;
  playerId: string;
  priceEur: number;
}) {
  const [bidOpen, setBidOpen] = useState(false);
  const [maxEur, setMaxEur] = useState(priceEur);
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  const onLoan = () => {
    startTransition(async () => {
      const res = await loanPlayer({ playerId });
      if (!res.ok) {
        toast({ icon: "⚠", title: "Kiralanamadı", body: res.error, accent: "var(--danger)" });
        return;
      }
      toast({
        icon: "📥",
        title: "Oyuncu kiralandı",
        body: "30 gün sonra eski kulübüne döner.",
        accent: "var(--emerald)",
      });
    });
  };

  const onBid = () => {
    if (maxEur <= 0) {
      toast({ icon: "⚠", title: "Geçersiz", body: "Max fiyat 0'dan büyük olmalı.", accent: "var(--danger)" });
      return;
    }
    startTransition(async () => {
      const res = await placeAutoBid({ listingId, maxEur });
      if (!res.ok) {
        toast({ icon: "⚠", title: "Teklif konamadı", body: res.error, accent: "var(--danger)" });
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
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={(e) => {
          e.stopPropagation();
          onLoan();
        }}
        disabled={pending}
        title="30 gün kiralama (piyasa değerinin %20'si)"
        style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
      >
        <ArrowDownToLine size={12} strokeWidth={1.6} />
        Kirala
      </button>
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
          <Bookmark size={12} strokeWidth={1.6} />
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
      <span style={{ flex: 1 }} />
      <span style={{ fontSize: 11, color: "var(--muted)" }}>
        Kira ücreti: €{(priceEur * 0.2 / 1_000_000).toFixed(1)}M · 30 gün
      </span>
    </div>
  );
}
