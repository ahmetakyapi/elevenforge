"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { signFreeAgent } from "./actions";
import type { FreeAgentView } from "@/lib/queries/free-agents";

const POS_TINT: Record<FreeAgentView["position"], string> = {
  GK: "var(--gold)",
  DEF: "var(--indigo)",
  MID: "var(--accent)",
  FWD: "var(--emerald)",
};

export function FreeAgentsList({ agents }: { agents: FreeAgentView[] }) {
  const [filter, setFilter] = useState<FreeAgentView["position"] | "ALL">("ALL");
  const [pending, startTransition] = useTransition();
  const [signing, setSigning] = useState<string | null>(null);
  const router = useRouter();
  const toast = useToast();

  const filtered =
    filter === "ALL" ? agents : agents.filter((a) => a.position === filter);

  const sign = (id: string, name: string) => {
    setSigning(id);
    startTransition(async () => {
      const res = await signFreeAgent({ playerId: id });
      setSigning(null);
      if (!res.ok) {
        toast({
          icon: "⚠",
          title: "İmzalanamadı",
          body: res.error,
          accent: "var(--danger)",
        });
        return;
      }
      toast({
        icon: "✍",
        title: `${name} imzaladı`,
        body: "Yeni oyuncun aktif kadroda — 2 yıllık sözleşme.",
        accent: "var(--emerald)",
      });
      router.refresh();
    });
  };

  return (
    <>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {(["ALL", "GK", "DEF", "MID", "FWD"] as const).map((p) => (
          <button
            key={p}
            type="button"
            className={`chip ${filter === p ? "active" : ""}`}
            onClick={() => setFilter(p)}
            style={{ cursor: "pointer", padding: "6px 14px" }}
          >
            {p === "ALL" ? `Tümü (${agents.length})` : p}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map((a) => (
          <div
            key={a.id}
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr 80px 100px 100px 140px",
              gap: 12,
              alignItems: "center",
              padding: "12px 14px",
              borderRadius: 10,
              background: "var(--panel)",
              border: "1px solid var(--border)",
            }}
          >
            <span
              className="t-mono"
              style={{
                fontSize: 11,
                padding: "2px 8px",
                borderRadius: 4,
                background: `color-mix(in oklab, ${POS_TINT[a.position]} 22%, transparent)`,
                color: POS_TINT[a.position],
                fontWeight: 600,
              }}
            >
              {a.role}
            </span>
            <div>
              <div style={{ fontWeight: 600 }}>{a.name}</div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>
                {a.nationality} · {a.age} yaş
              </div>
            </div>
            <span
              className="t-mono"
              style={{
                padding: "4px 10px",
                borderRadius: 4,
                background: "color-mix(in oklab, var(--panel-2) 70%, transparent)",
                textAlign: "center",
              }}
            >
              OVR {a.overall}
            </span>
            <span
              className="t-mono"
              style={{ fontSize: 11, color: "var(--muted)", textAlign: "right" }}
            >
              POT {a.potential}
            </span>
            <span
              className="t-mono"
              style={{ fontSize: 12, textAlign: "right" }}
            >
              €{(a.signingFeeEur / 1_000_000).toFixed(1)}M
            </span>
            <button
              type="button"
              className="btn btn-sm btn-primary"
              disabled={pending && signing !== a.id}
              onClick={() => sign(a.id, a.name)}
              style={{ justifyContent: "center" }}
            >
              {pending && signing === a.id ? "İmzalanıyor…" : "İmzala"}
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
