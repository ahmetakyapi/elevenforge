"use client";

import { Briefcase } from "lucide-react";
import { useState, useTransition } from "react";
import { useToast } from "@/components/ui/toast";
import { signSponsor } from "./sponsor-actions";
import type { Sponsor } from "@/lib/sponsors";

type ActiveSponsor = {
  id: string;
  name: string;
  payPerMatchCents: number;
  bonusPerWinCents: number;
  seasonBonusCents: number;
  weeksLeft: number;
};

const TIER_TINT: Record<number, string> = {
  1: "color-mix(in oklab, var(--muted) 30%, transparent)",
  2: "color-mix(in oklab, var(--indigo) 30%, transparent)",
  3: "color-mix(in oklab, var(--gold) 30%, transparent)",
};

export function SponsorWidget({
  active,
  offers,
  prestige,
}: {
  active: ActiveSponsor | null;
  offers: Sponsor[];
  prestige: number;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  const sign = (id: string) => {
    startTransition(async () => {
      const res = await signSponsor({ sponsorId: id });
      if (!res.ok) {
        toast({
          icon: "⚠",
          title: "Sponsor reddedildi",
          body: res.error,
          accent: "var(--danger)",
        });
        return;
      }
      toast({
        icon: "✍",
        title: "Sponsor anlaşması imzalandı",
        body: "Maç başı + galibiyet + sezon bonusu aktif.",
        accent: "var(--emerald)",
      });
      setOpen(false);
    });
  };

  return (
    <div
      style={{
        padding: "14px 16px",
        borderRadius: 12,
        background: "color-mix(in oklab, var(--panel-2) 60%, transparent)",
        border: "1px solid var(--border)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "color-mix(in oklab, var(--indigo) 18%, transparent)",
            color: "var(--indigo)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Briefcase size={16} strokeWidth={1.6} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="t-caption" style={{ fontSize: 11 }}>
            SPONSOR
          </div>
          {active ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontWeight: 600 }}>{active.name}</span>
              <span className="t-mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                {active.weeksLeft}w · €{(active.payPerMatchCents / 100 / 1_000_000).toFixed(1)}M/maç
              </span>
            </div>
          ) : (
            <div style={{ color: "var(--muted)", fontSize: 13 }}>Anlaşmasız</div>
          )}
        </div>
        {!active && (
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={() => setOpen(true)}
          >
            Sponsor Bul
          </button>
        )}
      </div>

      {open && (
        <div
          onClick={() => !pending && setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.6)",
            backdropFilter: "blur(4px)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            data-modal
            data-modal-panel
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--panel)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: 24,
              maxWidth: 720,
              width: "100%",
              maxHeight: "85vh",
              overflow: "auto",
            }}
          >
            <span className="t-label" style={{ color: "var(--indigo)" }}>
              SPONSOR TEKLİFLERİ
            </span>
            <div className="t-h2" style={{ marginTop: 4 }}>
              Sözleşme imzala
            </div>
            <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>
              Prestij {prestige} — daha yüksek tiere geçmek için sezon yarışında üst sıralara tırman.
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginTop: 18,
              }}
            >
              {offers.map((sp) => {
                const eligible = prestige >= sp.minPrestige;
                return (
                  <div
                    key={sp.id}
                    style={{
                      padding: 14,
                      borderRadius: 10,
                      background: TIER_TINT[sp.tier] ?? TIER_TINT[1],
                      border: "1px solid var(--border)",
                      opacity: eligible ? 1 : 0.55,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: 600 }}>{sp.name}</span>
                      <span
                        className="t-mono"
                        style={{
                          fontSize: 11,
                          padding: "2px 6px",
                          borderRadius: 4,
                          background: "var(--panel-2)",
                        }}
                      >
                        T{sp.tier}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
                      Min prestij {sp.minPrestige}
                    </div>
                    <div style={{ marginTop: 10, fontSize: 12, lineHeight: 1.6 }}>
                      <div>Maç başı: €{(sp.payPerMatchCents / 100 / 1_000_000).toFixed(2)}M</div>
                      <div>Galibiyet bonusu: €{(sp.bonusPerWinCents / 100 / 1_000_000).toFixed(2)}M</div>
                      <div>Sezon bonusu: €{(sp.seasonBonusCents / 100 / 1_000_000).toFixed(2)}M</div>
                      <div>Süre: {sp.weeks} hafta</div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      style={{ marginTop: 12, width: "100%", justifyContent: "center" }}
                      disabled={!eligible || pending}
                      onClick={() => sign(sp.id)}
                    >
                      {eligible ? "İmzala" : "Yetersiz prestij"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
