"use client";

import { Building2, Dumbbell } from "lucide-react";
import { useTransition } from "react";
import { useToast } from "@/components/ui/toast";
import { upgradeStadium, upgradeTraining } from "./upgrade-actions";

const COST_BY_LEVEL = [0, 500_000_000, 1_000_000_000, 2_000_000_000, 4_000_000_000, 0];
const fmtM = (cents: number) => `€${(cents / 100 / 1_000_000).toFixed(1)}M`;

export function UpgradeWidget({
  stadiumLevel,
  trainingLevel,
}: {
  stadiumLevel: number;
  trainingLevel: number;
}) {
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  const upgrade = (kind: "stadium" | "training") => {
    startTransition(async () => {
      const fn = kind === "stadium" ? upgradeStadium : upgradeTraining;
      const res = await fn();
      if (!res.ok) {
        toast({ icon: "⚠", title: "Yapılamadı", body: res.error, accent: "var(--danger)" });
        return;
      }
      toast({
        icon: "🏗",
        title: kind === "stadium" ? "Stadyum yükseltildi" : "Tesis yükseltildi",
        body: `Yeni seviye: L${res.newLevel}`,
        accent: "var(--emerald)",
      });
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
      <span className="t-label" style={{ fontSize: 11 }}>
        TESİSLER
      </span>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
        <Slot
          Icon={Building2}
          tint="var(--accent)"
          label="Stadyum"
          level={stadiumLevel}
          subline={`Ev avantajı +${(0.5 * (stadiumLevel - 1) + 2.5).toFixed(1)}`}
          cost={COST_BY_LEVEL[stadiumLevel] ?? 0}
          maxed={stadiumLevel >= 5}
          pending={pending}
          onUpgrade={() => upgrade("stadium")}
        />
        <Slot
          Icon={Dumbbell}
          tint="var(--emerald)"
          label="Antrenman"
          level={trainingLevel}
          subline="Genç gelişim hızı"
          cost={COST_BY_LEVEL[trainingLevel] ?? 0}
          maxed={trainingLevel >= 5}
          pending={pending}
          onUpgrade={() => upgrade("training")}
        />
      </div>
    </div>
  );
}

function Slot({
  Icon,
  tint,
  label,
  level,
  subline,
  cost,
  maxed,
  pending,
  onUpgrade,
}: {
  Icon: typeof Building2;
  tint: string;
  label: string;
  level: number;
  subline: string;
  cost: number;
  maxed: boolean;
  pending: boolean;
  onUpgrade: () => void;
}) {
  return (
    <div
      style={{
        padding: 10,
        borderRadius: 8,
        background: "var(--panel)",
        border: "1px solid var(--border)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Icon size={14} strokeWidth={1.6} style={{ color: tint }} />
        <span style={{ flex: 1, fontWeight: 600, fontSize: 13 }}>{label}</span>
        <span
          className="t-mono"
          style={{
            fontSize: 11,
            padding: "2px 6px",
            borderRadius: 4,
            background: `color-mix(in oklab, ${tint} 18%, transparent)`,
            color: tint,
          }}
        >
          L{level}
        </span>
      </div>
      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{subline}</div>
      <button
        type="button"
        className="btn btn-sm"
        style={{
          marginTop: 8,
          width: "100%",
          justifyContent: "center",
          fontSize: 11,
          background: maxed ? "var(--panel-2)" : `color-mix(in oklab, ${tint} 14%, transparent)`,
          color: maxed ? "var(--muted)" : tint,
        }}
        disabled={maxed || pending}
        onClick={onUpgrade}
      >
        {maxed ? "MAX" : `Yükselt · ${fmtM(cost)}`}
      </button>
    </div>
  );
}
