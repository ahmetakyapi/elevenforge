"use client";

import { X } from "lucide-react";
import type { Player } from "@/types";

const stat = (
  label: string,
  a: number,
  b: number,
  hi: "max" | "min" = "max",
): { label: string; a: number; b: number; winner: "a" | "b" } => {
  const winner: "a" | "b" =
    hi === "max" ? (a >= b ? "a" : "b") : a <= b ? "a" : "b";
  return { label, a, b, winner };
};

export function ComparePanel({
  a,
  b,
  onClose,
}: {
  a: Player;
  b: Player;
  onClose: () => void;
}) {
  const rows = [
    stat("Genel (OVR)", a.ovr, b.ovr),
    stat("Potansiyel", a.pot, b.pot),
    stat("Yaş", a.age, b.age, "min"),
    stat("Form", a.fit ?? 0, b.fit ?? 0),
    stat("Moral", a.mor ?? 0, b.mor ?? 0),
    stat("Maaş (€)", a.wage ?? 0, b.wage ?? 0, "min"),
    stat("Değer (€)", a.val ?? 0, b.val ?? 0),
    stat("Kontrat (yıl)", a.ctr ?? 0, b.ctr ?? 0),
  ];
  return (
    <div
      onClick={onClose}
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <span className="t-label" style={{ color: "var(--indigo)" }}>
            KARŞILAŞTIRMA
          </span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            <X size={14} strokeWidth={1.6} />
          </button>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 80px 1fr",
            gap: 12,
            marginTop: 18,
            alignItems: "center",
          }}
        >
          <PlayerHead p={a} align="right" />
          <div className="t-mono" style={{ textAlign: "center", color: "var(--muted)" }}>VS</div>
          <PlayerHead p={b} align="left" />
        </div>
        <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 4 }}>
          {rows.map((r) => (
            <Row key={r.label} {...r} />
          ))}
        </div>
      </div>
    </div>
  );
}

function PlayerHead({ p, align }: { p: Player; align: "left" | "right" }) {
  return (
    <div style={{ textAlign: align }}>
      <div className="t-h3">{p.n}</div>
      <div className="t-small" style={{ color: "var(--muted)" }}>
        {p.role} · #{p.num} · {p.nat}
      </div>
    </div>
  );
}

function Row({
  label,
  a,
  b,
  winner,
}: {
  label: string;
  a: number;
  b: number;
  winner: "a" | "b";
}) {
  const fmt = (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n.toLocaleString("tr-TR");
  const accent = "color-mix(in oklab, var(--emerald) 28%, var(--panel-2))";
  const flat = "color-mix(in oklab, var(--panel-2) 60%, transparent)";
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 140px 1fr",
        gap: 8,
        alignItems: "center",
      }}
    >
      <div
        style={{
          padding: "8px 12px",
          borderRadius: 8,
          background: winner === "a" ? accent : flat,
          textAlign: "right",
          fontWeight: winner === "a" ? 700 : 400,
        }}
      >
        {fmt(a)}
      </div>
      <div className="t-caption" style={{ textAlign: "center", fontSize: 11 }}>
        {label}
      </div>
      <div
        style={{
          padding: "8px 12px",
          borderRadius: 8,
          background: winner === "b" ? accent : flat,
          textAlign: "left",
          fontWeight: winner === "b" ? 700 : 400,
        }}
      >
        {fmt(b)}
      </div>
    </div>
  );
}
