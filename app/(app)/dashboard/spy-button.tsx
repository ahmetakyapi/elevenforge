"use client";

import { Eye } from "lucide-react";
import { useState, useTransition } from "react";
import { useToast } from "@/components/ui/toast";
import { sendSpy, type SpyReport } from "./spy-actions";

const MENTALITY_LABEL = ["Çok Defansif", "Defansif", "Dengeli", "Hücumcu", "Çok Hücumcu"];
const PRESSING_LABEL = ["Az", "Düşük", "Orta", "Yoğun", "Çok Yoğun"];
const TEMPO_LABEL = ["Yavaş", "Sakin", "Orta", "Hızlı", "Çok Hızlı"];

/**
 * Inline spy button + modal panel. One click → server-side spy → modal with
 * opponent formation, dial readout, projected XI. Idempotent per fixture
 * (cached row), so re-clicking is free.
 */
export function SpyButton() {
  const [report, setReport] = useState<SpyReport | null>(null);
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  return (
    <>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            const res = await sendSpy();
            if (!res.ok) {
              toast({
                icon: "⚠",
                title: "Casus geri döndü",
                body: res.error,
                accent: "var(--danger)",
              });
              return;
            }
            setReport(res.report);
            toast({
              icon: "🕵",
              title: res.report.cached ? "Rapor önbellekte" : "Casus döndü",
              body: `${res.report.targetName} taktik raporu hazır`,
              accent: "var(--indigo)",
            });
          });
        }}
        title="Rakibin taktiğini ve dizilişini öğren — €1M"
      >
        <Eye size={14} strokeWidth={1.6} />
        {pending ? "Casus yolda…" : "Casus Gönder"}
      </button>
      {report && (
        <div
          onClick={() => setReport(null)}
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
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--panel)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: 24,
              maxWidth: 560,
              width: "100%",
              maxHeight: "80vh",
              overflow: "auto",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <span className="t-label" style={{ color: "var(--indigo)" }}>
                  CASUS RAPORU
                </span>
                <div className="t-h2" style={{ marginTop: 4 }}>
                  {report.targetName}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setReport(null)}
              >
                Kapat
              </button>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 10,
                marginTop: 18,
              }}
            >
              <Stat label="Diziliş" value={report.formation} />
              <Stat label="Mentalite" value={MENTALITY_LABEL[Math.max(0, Math.min(4, report.mentality))]} />
              <Stat label="Press" value={PRESSING_LABEL[Math.max(0, Math.min(4, report.pressing))]} />
              <Stat label="Tempo" value={TEMPO_LABEL[Math.max(0, Math.min(4, report.tempo))]} />
            </div>
            <div style={{ marginTop: 22 }}>
              <span className="t-label">BEKLENEN İLK 11</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
                {report.lineup.map((p, i) => (
                  <div
                    key={`${p.name}-${i}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "8px 12px",
                      borderRadius: 8,
                      background: "color-mix(in oklab, var(--panel-2) 60%, transparent)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <span
                      className="t-mono"
                      style={{
                        width: 36,
                        textAlign: "center",
                        color: "var(--muted)",
                        fontSize: 11,
                      }}
                    >
                      {p.role}
                    </span>
                    <span style={{ flex: 1 }}>{p.name}</span>
                    <span
                      className="t-mono"
                      style={{
                        padding: "2px 8px",
                        borderRadius: 4,
                        background:
                          p.ovr >= 85
                            ? "color-mix(in oklab, var(--emerald) 30%, transparent)"
                            : p.ovr >= 78
                              ? "color-mix(in oklab, var(--indigo) 22%, transparent)"
                              : "color-mix(in oklab, var(--muted) 22%, transparent)",
                        fontSize: 12,
                      }}
                    >
                      {p.ovr}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {report.cached && (
              <div
                style={{
                  marginTop: 16,
                  fontSize: 12,
                  color: "var(--muted)",
                  textAlign: "center",
                }}
              >
                Bu rapor önbellekten — bu maç için yeni bir ücret alınmadı.
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: "10px 12px",
        borderRadius: 8,
        background: "color-mix(in oklab, var(--panel-2) 60%, transparent)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="t-caption" style={{ fontSize: 10 }}>
        {label}
      </div>
      <div style={{ fontWeight: 600, marginTop: 2, fontSize: 13 }}>{value}</div>
    </div>
  );
}
