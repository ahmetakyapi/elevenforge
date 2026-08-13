"use client";

import { useMemo, useTransition } from "react";
import { Dumbbell, Plus, X, Zap } from "lucide-react";
import { OvrChip, PosBadge } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { posColor } from "@/lib/utils";
import { toggleTraining } from "./actions";
import type { Player, Position } from "@/types";

const GROUPS: Array<{ pos: Position; label: string }> = [
  { pos: "GK", label: "Kaleci" },
  { pos: "DEF", label: "Defans" },
  { pos: "MID", label: "Orta Saha" },
  { pos: "FWD", label: "Forvet" },
];

/** Daily progression multiplier, mirroring runDailyTraining's age curve. */
function speedFor(age: number): { mult: string; tone: string } {
  if (age <= 19) return { mult: "3×", tone: "var(--emerald)" };
  if (age <= 22) return { mult: "2×", tone: "var(--cyan, #22d3ee)" };
  if (age <= 26) return { mult: "1×", tone: "var(--muted)" };
  return { mult: "0.5×", tone: "var(--warn, #f59e0b)" };
}

/**
 * The training ground.
 *
 * This used to be a single strip: the text "1 / 4 dolu" and four coloured
 * pills. It told you a slot was filled but not by whom, how close that player
 * was to his ceiling, or how fast he was moving — and you could not act on it
 * without hunting for the right card further down the page. Four slots is the
 * whole mechanic, so it earns four real slots.
 */
export function TrainingPanel({ squad }: { squad: Player[] }) {
  const [pending, startTransition] = useTransition();
  const pushToast = useToast();

  const bySlot = useMemo(() => {
    const map = new Map<Position, Player | undefined>();
    for (const { pos } of GROUPS) {
      map.set(
        pos,
        squad.find((p) => p.pos === pos && p.status === "training"),
      );
    }
    return map;
  }, [squad]);

  /** Best untrained candidate for an empty slot: most headroom, then youngest. */
  const suggestionFor = (pos: Position): Player | undefined =>
    squad
      .filter(
        (p) =>
          p.pos === pos &&
          p.status !== "training" &&
          p.status !== "injured" &&
          p.status !== "suspended" &&
          p.ovr < p.pot,
      )
      .sort((a, b) => b.pot - b.ovr - (a.pot - a.ovr) || a.age - b.age)[0];

  const run = (playerId: string, adding: boolean, name: string) => {
    startTransition(async () => {
      const res = await toggleTraining(playerId);
      if (res.ok) {
        pushToast({
          icon: adding ? "🔥" : "✓",
          title: adding ? `${name} antrenmana alındı` : `${name} antrenmandan çıktı`,
          accent: adding ? "var(--emerald)" : undefined,
        });
      } else {
        pushToast({ title: "Olmadı", body: res.error, accent: "var(--danger)" });
      }
    });
  };

  const filled = GROUPS.filter(({ pos }) => bySlot.get(pos)).length;

  return (
    <section
      style={{
        borderRadius: 18,
        border: "1px solid var(--border)",
        background: "var(--panel)",
        padding: 18,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 14,
          flexWrap: "wrap",
        }}
      >
        <Dumbbell size={16} strokeWidth={1.7} style={{ color: "var(--accent)" }} />
        <span className="t-label" style={{ fontSize: 11 }}>
          ANTRENMAN SAHASI
        </span>
        <span
          className="t-mono"
          style={{
            fontSize: 11,
            padding: "2px 8px",
            borderRadius: 999,
            fontWeight: 700,
            background:
              filled === 4
                ? "color-mix(in oklab, var(--emerald) 22%, transparent)"
                : "color-mix(in oklab, var(--warn, #f59e0b) 18%, transparent)",
            color: filled === 4 ? "var(--emerald)" : "var(--warn, #f59e0b)",
          }}
        >
          {filled}/4 slot dolu
        </span>
        <span
          className="t-caption"
          style={{ fontSize: 11, marginLeft: "auto", color: "var(--muted)" }}
        >
          Her mevkiden bir oyuncu · günlük +1 OVR şansı, tavanına kadar
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gap: 10,
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        }}
      >
        {GROUPS.map(({ pos, label }) => {
          const p = bySlot.get(pos);
          const tint = posColor(pos);

          if (!p) {
            const pick = suggestionFor(pos);
            return (
              <div
                key={pos}
                style={{
                  borderRadius: 14,
                  border: "1px dashed var(--border-strong)",
                  background: "color-mix(in oklab, var(--bg-2) 60%, transparent)",
                  padding: 14,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  minHeight: 132,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <PosBadge pos={pos} size={20} />
                  <span className="t-label" style={{ fontSize: 10.5 }}>
                    {label.toUpperCase()}
                  </span>
                </div>
                <span className="t-caption" style={{ fontSize: 11, flex: 1 }}>
                  Slot boş — bu mevkiden bir oyuncu gelişmiyor.
                </span>
                {pick ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => run(pick.id!, true, pick.n)}
                    className="btn btn-ghost btn-sm"
                    style={{ justifyContent: "flex-start", gap: 8 }}
                  >
                    <Plus size={13} strokeWidth={1.8} />
                    <span style={{ fontSize: 12 }}>
                      {pick.n} <span className="t-mono">+{pick.pot - pick.ovr}</span>
                    </span>
                  </button>
                ) : (
                  <span className="t-caption" style={{ fontSize: 10.5 }}>
                    Bu mevkide gelişebilecek oyuncu yok.
                  </span>
                )}
              </div>
            );
          }

          const room = p.pot - p.ovr;
          const pct = p.pot > 0 ? Math.round((p.ovr / p.pot) * 100) : 100;
          const speed = speedFor(p.age);
          return (
            <div
              key={pos}
              style={{
                borderRadius: 14,
                border: `1px solid color-mix(in oklab, ${tint} 40%, var(--border))`,
                background: `linear-gradient(160deg, color-mix(in oklab, ${tint} 12%, var(--bg-2)), var(--bg-2))`,
                padding: 14,
                display: "flex",
                flexDirection: "column",
                gap: 10,
                minHeight: 132,
                position: "relative",
              }}
            >
              <button
                type="button"
                disabled={pending}
                onClick={() => run(p.id!, false, p.n)}
                title="Antrenmandan çıkar"
                aria-label={`${p.n} antrenmandan çıkar`}
                style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                  background: "var(--panel)",
                  color: "var(--muted)",
                  cursor: "pointer",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <X size={12} strokeWidth={2} />
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <PosBadge pos={pos} size={20} />
                <span className="t-label" style={{ fontSize: 10.5 }}>
                  {label.toUpperCase()}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <OvrChip ovr={p.ovr} size="sm" />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 650,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  title={p.n}
                >
                  {p.n}
                </span>
              </div>

              {/* Progress toward the ceiling — the number that actually
                  matters when choosing who to train. */}
              <div style={{ marginTop: "auto" }}>
                <div
                  style={{
                    height: 5,
                    borderRadius: 999,
                    background: "color-mix(in oklab, var(--muted) 22%, transparent)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      height: "100%",
                      borderRadius: 999,
                      background: tint,
                      transition: "width var(--t) var(--ease)",
                    }}
                  />
                </div>
                <div
                  className="t-mono"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 10,
                    color: "var(--muted)",
                    marginTop: 5,
                  }}
                >
                  <span>
                    {p.ovr} → {p.pot}
                    {room > 0 && (
                      <span style={{ color: tint }}> · +{room} kaldı</span>
                    )}
                  </span>
                  <span
                    style={{
                      color: speed.tone,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 3,
                    }}
                    title={`${p.age} yaş — gelişim hızı ${speed.mult}`}
                  >
                    <Zap size={9} strokeWidth={2.2} />
                    {speed.mult}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
