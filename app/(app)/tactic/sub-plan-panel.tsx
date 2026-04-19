"use client";

import { useState, useTransition } from "react";
import { ArrowRightLeft, Plus, X } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { saveSubPlan } from "./actions";
import type { Player } from "@/types";

type Sub = { minute: number; outId: string; inId: string };

/**
 * In-match substitution planner — 3 slots, each picks an "out" player from
 * the user's squad + an "in" player + a minute (1-90). Engine swaps at the
 * configured minute during simulation; subbed-off players can no longer
 * score post-sub.
 */
export function SubPlanPanel({
  squad,
  initial,
}: {
  squad: Player[];
  initial: Sub[];
}) {
  // Pad initial up to 3 slots with sentinel rows (empty strings) so the
  // user always sees 3 inputs instead of an "add" button on an empty plan.
  const padded: Sub[] = [...initial];
  while (padded.length < 3) padded.push({ minute: 60 + padded.length * 10, outId: "", inId: "" });
  const [subs, setSubs] = useState<Sub[]>(padded);
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  const update = (i: number, patch: Partial<Sub>) => {
    setSubs((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  };
  const clear = (i: number) => {
    setSubs((prev) => prev.map((s, idx) => (idx === i ? { minute: 60 + idx * 10, outId: "", inId: "" } : s)));
  };

  const save = () => {
    startTransition(async () => {
      const filled = subs.filter((s) => s.outId && s.inId);
      const res = await saveSubPlan({ subs: filled });
      if (!res.ok) {
        toast({ icon: "⚠", title: "Plan kaydedilmedi", body: res.error, accent: "var(--danger)" });
        return;
      }
      toast({
        icon: "🔄",
        title: "Değişiklik planı kaydedildi",
        body: `${filled.length}/3 slot dolu — bir sonraki maçta uygulanacak`,
        accent: "var(--emerald)",
      });
    });
  };

  const dirty = JSON.stringify(initial) !== JSON.stringify(subs.filter((s) => s.outId && s.inId));

  return (
    <div
      style={{
        marginTop: 24,
        padding: "18px 22px",
        borderRadius: 14,
        background: "var(--panel)",
        border: "1px solid var(--border)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ArrowRightLeft size={16} strokeWidth={1.6} style={{ color: "var(--accent)" }} />
          <div>
            <span className="t-label">MAÇ İÇİ DEĞİŞİKLİKLER</span>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
              3 slot. Engine maç dakikası geldiğinde otomatik uygular.
            </div>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={save}
          disabled={!dirty || pending}
        >
          {pending ? "Kaydediliyor…" : "Planı Kaydet"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10, marginTop: 14 }}>
        {subs.map((sub, i) => (
          <SubRow
            key={i}
            index={i}
            sub={sub}
            squad={squad}
            onChange={(p) => update(i, p)}
            onClear={() => clear(i)}
          />
        ))}
      </div>
    </div>
  );
}

function SubRow({
  index,
  sub,
  squad,
  onChange,
  onClear,
}: {
  index: number;
  sub: Sub;
  squad: Player[];
  onChange: (p: Partial<Sub>) => void;
  onClear: () => void;
}) {
  const filled = !!(sub.outId && sub.inId);
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "32px 80px 1fr 24px 1fr 32px",
        gap: 8,
        alignItems: "center",
        padding: "8px 10px",
        borderRadius: 8,
        background: filled
          ? "color-mix(in oklab, var(--accent) 8%, var(--panel-2))"
          : "var(--panel-2)",
        border: filled
          ? "1px solid color-mix(in oklab, var(--accent) 30%, var(--border))"
          : "1px solid var(--border)",
      }}
    >
      <span
        className="t-mono"
        style={{
          width: 26,
          height: 26,
          borderRadius: 6,
          background: "var(--bg)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          fontWeight: 700,
        }}
      >
        {index + 1}
      </span>
      <input
        type="number"
        min={1}
        max={90}
        value={sub.minute}
        onChange={(e) => onChange({ minute: Math.max(1, Math.min(90, Number(e.target.value) || 60)) })}
        className="input"
        style={{ padding: "6px 10px", fontSize: 13, fontFamily: "var(--font-jetbrains)", textAlign: "center" }}
      />
      <PlayerSelect
        value={sub.outId}
        squad={squad}
        placeholder="Çıkacak oyuncu"
        onChange={(id) => onChange({ outId: id })}
      />
      <Plus size={14} strokeWidth={1.6} style={{ color: "var(--muted)", justifySelf: "center" }} />
      <PlayerSelect
        value={sub.inId}
        squad={squad}
        placeholder="Giren oyuncu"
        onChange={(id) => onChange({ inId: id })}
      />
      <button
        type="button"
        onClick={onClear}
        title="Slotu temizle"
        style={{
          width: 26,
          height: 26,
          borderRadius: 6,
          background: "transparent",
          border: "1px solid var(--border)",
          color: "var(--muted)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <X size={12} strokeWidth={1.8} />
      </button>
    </div>
  );
}

function PlayerSelect({
  value,
  squad,
  placeholder,
  onChange,
}: {
  value: string;
  squad: Player[];
  placeholder: string;
  onChange: (id: string) => void;
}) {
  return (
    <select
      className="input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ padding: "6px 10px", fontSize: 13, width: "100%" }}
    >
      <option value="">{placeholder}</option>
      {squad
        .filter((p): p is Player & { id: string } => typeof p.id === "string")
        .map((p) => (
          <option key={p.id} value={p.id}>
            {p.role} · {p.n} ({p.ovr})
          </option>
        ))}
    </select>
  );
}
