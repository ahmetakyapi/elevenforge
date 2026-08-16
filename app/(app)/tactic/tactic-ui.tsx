"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { ChevronRight } from "lucide-react";
import { GlassCard, OvrChip, PosBadge } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { posColor } from "@/lib/utils";
import type { Formation, Player, Position } from "@/types";
import {
  TACTIC_DIALS,
  TACTIC_KEYS,
  TACTIC_STYLES,
  type TacticDial,
  type TacticKey,
} from "@/lib/tactics";
import { teamPower, type PowerPlayer } from "@/lib/engine/power";
import {
  loadTacticPreset,
  saveTacticPreset,
  type TacticPreset,
} from "./actions";
import { saveLineup } from "./lineup-actions";
import { SubPlanPanel } from "./sub-plan-panel";

export type TacticUiProps = {
  squad: Player[];
  initial: {
    formation: Formation;
    mentality: number;
    pressing: number;
    tempo: number;
    defLine: number;
    passingStyle: number;
    width: number;
    aggression: number;
  };
  presets: Array<TacticPreset | null>;
  subPlan: Array<{ minute: number; outId: string; inId: string }>;
  /** The manager's persisted team sheet (clubs.lineup_json). */
  savedXi: string[];
  savedBench: string[];
};

// ─── Formations with role tags per slot ─────────────────────────
type Slot = { x: number; y: number; r: string };

const FORMATIONS: Record<Formation, Slot[]> = {
  "4-3-3": [
    { x: 50, y: 88, r: "GK" },
    { x: 18, y: 70, r: "LB" },
    { x: 38, y: 74, r: "CB" },
    { x: 62, y: 74, r: "CB" },
    { x: 82, y: 70, r: "RB" },
    { x: 30, y: 50, r: "CM" },
    { x: 50, y: 55, r: "CDM" },
    { x: 70, y: 50, r: "CM" },
    { x: 22, y: 28, r: "LW" },
    { x: 50, y: 20, r: "ST" },
    { x: 78, y: 28, r: "RW" },
  ],
  "4-4-2": [
    { x: 50, y: 88, r: "GK" },
    { x: 18, y: 70, r: "LB" },
    { x: 38, y: 74, r: "CB" },
    { x: 62, y: 74, r: "CB" },
    { x: 82, y: 70, r: "RB" },
    { x: 18, y: 50, r: "LM" },
    { x: 38, y: 54, r: "CM" },
    { x: 62, y: 54, r: "CM" },
    { x: 82, y: 50, r: "RM" },
    { x: 38, y: 22, r: "ST" },
    { x: 62, y: 22, r: "ST" },
  ],
  "3-5-2": [
    { x: 50, y: 88, r: "GK" },
    { x: 28, y: 72, r: "CB" },
    { x: 50, y: 76, r: "CB" },
    { x: 72, y: 72, r: "CB" },
    { x: 14, y: 54, r: "LM" },
    { x: 34, y: 56, r: "CM" },
    { x: 50, y: 60, r: "CDM" },
    { x: 66, y: 56, r: "CM" },
    { x: 86, y: 54, r: "RM" },
    { x: 38, y: 22, r: "ST" },
    { x: 62, y: 22, r: "ST" },
  ],
  "5-3-2": [
    { x: 50, y: 88, r: "GK" },
    { x: 12, y: 66, r: "LB" },
    { x: 30, y: 74, r: "CB" },
    { x: 50, y: 78, r: "CB" },
    { x: 70, y: 74, r: "CB" },
    { x: 88, y: 66, r: "RB" },
    { x: 30, y: 50, r: "CM" },
    { x: 50, y: 54, r: "CDM" },
    { x: 70, y: 50, r: "CM" },
    { x: 38, y: 22, r: "ST" },
    { x: 62, y: 22, r: "ST" },
  ],
  "4-2-3-1": [
    { x: 50, y: 88, r: "GK" },
    { x: 18, y: 70, r: "LB" },
    { x: 38, y: 74, r: "CB" },
    { x: 62, y: 74, r: "CB" },
    { x: 82, y: 70, r: "RB" },
    { x: 36, y: 58, r: "CDM" },
    { x: 64, y: 58, r: "CDM" },
    { x: 22, y: 38, r: "LW" },
    { x: 50, y: 40, r: "AM" },
    { x: 78, y: 38, r: "RW" },
    { x: 50, y: 18, r: "ST" },
  ],
  "4-1-4-1": [
    { x: 50, y: 88, r: "GK" },
    { x: 18, y: 70, r: "LB" },
    { x: 38, y: 74, r: "CB" },
    { x: 62, y: 74, r: "CB" },
    { x: 82, y: 70, r: "RB" },
    { x: 50, y: 58, r: "CDM" },
    { x: 16, y: 42, r: "LM" },
    { x: 38, y: 44, r: "CM" },
    { x: 62, y: 44, r: "CM" },
    { x: 84, y: 42, r: "RM" },
    { x: 50, y: 20, r: "ST" },
  ],
};

const FORMATION_KEYS = Object.keys(FORMATIONS) as Formation[];
const PRESETS = ["A", "B", "C", "D", "E", "F", "G"] as const;

// ─── Role → position group ──────────────────────────────────────
const ROLE_POS: Record<string, Position> = {
  GK: "GK",
  LB: "DEF", CB: "DEF", RB: "DEF",
  CDM: "MID", CM: "MID", AM: "MID", LM: "MID", RM: "MID",
  LW: "MID", RW: "MID",
  ST: "FWD", CF: "FWD",
};

// Compatibility score: 3=perfect role, 2=secondary, 1=same position group, 0=poor
function slotScore(player: Player, slotRole: string): number {
  if (player.role === slotRole) return 3;
  if (player.secondaryRoles?.includes(slotRole)) return 2;
  const slotPos = ROLE_POS[slotRole];
  if (slotPos && player.pos === slotPos) return 1;
  return 0;
}

// Greedy assignment: for each slot (in order GK→DEF→MID→FWD priority) pick
// the best-fitting available player.
function assignStarters(
  squad: Player[],
  formation: Formation,
): Array<Player | null> {
  const available = squad.filter(
    (p) => p.status !== "injured" && p.status !== "suspended",
  );
  const slots = FORMATIONS[formation];
  const out: Array<Player | null> = Array(slots.length).fill(null);
  const used = new Set<string>();

  // Prefer to fill perfect-match slots first (GK, CBs), then fall back.
  const order = slots
    .map((s, i) => ({ slot: s, i }))
    .sort((a, b) => {
      // Priority: GK > DEF > MID > FWD (so CBs lock in before CMs roam)
      const rank = (r: string) => {
        if (r === "GK") return 0;
        if (ROLE_POS[r] === "DEF") return 1;
        if (ROLE_POS[r] === "MID") return 2;
        return 3;
      };
      return rank(a.slot.r) - rank(b.slot.r);
    });

  for (const { slot, i } of order) {
    let best: Player | null = null;
    let bestScore = -1;
    for (const p of available) {
      const keyId = p.id ?? p.n;
      if (used.has(keyId)) continue;
      const score = slotScore(p, slot.r) * 100 + p.ovr;
      if (score > bestScore) {
        bestScore = score;
        best = p;
      }
    }
    if (best) {
      out[i] = best;
      used.add(best.id ?? best.n);
    }
  }
  return out;
}

/**
 * Seed the pitch from the manager's saved XI, in their order, then fill any
 * remaining slots with the best available fit. A saved sheet can go stale
 * (players sold, injured), so it is a starting point rather than gospel.
 */
function startersFromSaved(
  squad: Player[],
  formation: Formation,
  savedXi: string[],
): Array<Player | null> {
  const slots = FORMATIONS[formation];
  if (savedXi.length === 0) return assignStarters(squad, formation);

  const byId = new Map(squad.map((p) => [p.id ?? p.n, p]));
  const out: Array<Player | null> = Array(slots.length).fill(null);
  const used = new Set<string>();

  savedXi.slice(0, slots.length).forEach((playerId, i) => {
    const p = byId.get(playerId);
    if (!p || used.has(playerId)) return;
    out[i] = p;
    used.add(playerId);
  });

  // Fill the gaps by slot fit from whoever is left.
  const available = squad.filter(
    (p) =>
      p.status !== "injured" &&
      p.status !== "suspended" &&
      !used.has(p.id ?? p.n),
  );
  for (let i = 0; i < out.length; i++) {
    if (out[i]) continue;
    let best: Player | null = null;
    let bestScore = -1;
    for (const p of available) {
      const keyId = p.id ?? p.n;
      if (used.has(keyId)) continue;
      const score = slotScore(p, slots[i].r) * 100 + p.ovr;
      if (score > bestScore) {
        bestScore = score;
        best = p;
      }
    }
    if (best) {
      out[i] = best;
      used.add(best.id ?? best.n);
    }
  }
  return out;
}

// ─── Main ───────────────────────────────────────────────────────
export default function TacticPage({
  squad,
  initial,
  presets,
  subPlan,
  savedXi,
  savedBench,
}: TacticUiProps) {
  const [formation, setFormation] = useState<Formation>(initial.formation);
  /*
    One record, not seven useStates.

    Seven dials as seven pieces of state means every save call, every preset
    load and every style button has to name all seven — and the day an eighth
    is added, the one place that forgot it silently writes a neutral value
    over the manager's setting. A record is threaded whole.
  */
  const [dials, setDials] = useState<Record<TacticKey, number>>({
    mentality: initial.mentality,
    pressing: initial.pressing,
    tempo: initial.tempo,
    defLine: initial.defLine,
    passingStyle: initial.passingStyle,
    width: initial.width,
    aggression: initial.aggression,
  });
  const setDial = (key: TacticKey, value: number) => {
    setDials((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };
  const [preset, setPreset] = useState(0);
  const [presetState, setPresetState] =
    useState<Array<TacticPreset | null>>(presets);
  // Start from the manager's SAVED team sheet, not a fresh auto-pick.
  // The pitch below is fully interactive but its state was never persisted:
  // you could arrange an eleven, watch it render, navigate away and lose it,
  // and the match engine never saw it.
  const [starters, setStarters] = useState<Array<Player | null>>(() =>
    startersFromSaved(squad, initial.formation, savedXi),
  );
  const [dirty, setDirty] = useState(false);
  const [selected, setSelected] = useState<
    | { type: "pitch"; slot: number }
    | { type: "bench"; id: string }
    | null
  >(null);
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  // Re-assign when formation changes
  useEffect(() => {
    setStarters(assignStarters(squad, formation));
    setSelected(null);
    setDirty(true);
  }, [formation, squad]);

  const bench = useMemo(() => {
    const starterIds = new Set(
      starters
        .filter((p): p is Player => !!p)
        .map((p) => p.id ?? p.n),
    );
    return squad
      .filter((p) => p.status !== "injured" && p.status !== "suspended")
      .filter((p) => !starterIds.has(p.id ?? p.n))
      .sort((a, b) => {
        // Respect the manager's saved bench order; anyone not on it falls
        // back to rating.
        const ai = savedBench.indexOf(a.id ?? a.n);
        const bi = savedBench.indexOf(b.id ?? b.n);
        if (ai !== -1 && bi !== -1) return ai - bi;
        if (ai !== -1) return -1;
        if (bi !== -1) return 1;
        return b.ovr - a.ovr;
      });
  }, [squad, starters, savedBench]);

  const slots = FORMATIONS[formation];

  const onPitchClick = (slotIdx: number) => {
    if (selected?.type === "bench") {
      // Swap bench player into this slot; previous occupant goes to bench.
      const benchPlayer = squad.find(
        (p) => (p.id ?? p.n) === selected.id,
      );
      if (!benchPlayer) return;
      setStarters((prev) => {
        const next = [...prev];
        next[slotIdx] = benchPlayer;
        return next;
      });
      setSelected(null);
      setDirty(true);
    } else if (selected?.type === "pitch" && selected.slot !== slotIdx) {
      // Swap two pitch slots
      setStarters((prev) => {
        const next = [...prev];
        const tmp = next[selected.slot];
        next[selected.slot] = next[slotIdx];
        next[slotIdx] = tmp;
        return next;
      });
      setSelected(null);
      setDirty(true);
    } else {
      setSelected({ type: "pitch", slot: slotIdx });
    }
  };

  const onBenchClick = (player: Player) => {
    const id = player.id ?? player.n;
    if (selected?.type === "pitch") {
      // Put this bench player into the selected pitch slot
      setStarters((prev) => {
        const next = [...prev];
        next[selected.slot] = player;
        return next;
      });
      setSelected(null);
      setDirty(true);
    } else if (selected?.type === "bench" && selected.id === id) {
      setSelected(null);
    } else {
      setSelected({ type: "bench", id });
    }
  };

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "20px 28px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <span className="t-label">TAKTİK</span>
          <div className="t-h1" style={{ marginTop: 6 }}>
            İlk 11
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <span className="t-caption">Preset:</span>
          {PRESETS.map((l, i) => {
            const slot = presetState[i];
            const filled = !!slot;
            return (
              <button
                key={l}
                type="button"
                className={`chip ${preset === i ? "active" : ""}`}
                title={
                  filled
                    ? `${slot!.formation} · M${slot!.mentality + 1} P${slot!.pressing + 1} T${slot!.tempo + 1} (yüklemek için tıkla)`
                    : "Boş slot — kaydet butonu bunu doldurur"
                }
                onClick={() => {
                  setPreset(i);
                  if (!filled) return;
                  startTransition(async () => {
                    const res = await loadTacticPreset(i);
                    if (res.ok) {
                      setFormation(res.preset.formation);
                      setDials({
                        mentality: res.preset.mentality,
                        pressing: res.preset.pressing,
                        tempo: res.preset.tempo,
                        defLine: res.preset.defLine ?? 2,
                        passingStyle: res.preset.passingStyle ?? 2,
                        width: res.preset.width ?? 2,
                        aggression: res.preset.aggression ?? 2,
                      });
                      toast({
                        icon: "↻",
                        title: `Preset ${l} yüklendi`,
                        body: `${res.preset.formation}`,
                        accent: "var(--cyan)",
                      });
                    }
                  });
                }}
                style={{
                  cursor: "pointer",
                  minWidth: 32,
                  padding: "4px 6px",
                  justifyContent: "center",
                  position: "relative",
                  borderColor: filled
                    ? "color-mix(in oklab, var(--accent) 30%, var(--border))"
                    : undefined,
                  opacity: pending ? 0.7 : 1,
                }}
              >
                {l}
                {filled && (
                  <span
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: "50%",
                      background: "var(--accent)",
                      marginLeft: 4,
                    }}
                  />
                )}
              </button>
            );
          })}
          <button
            type="button"
            className="btn btn-primary"
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                // Save current config into the active preset slot AND set it
                // as the live tactic for the next match.
                const res = await saveTacticPreset({
                  slot: preset,
                  formation,
                  ...dials,
                });
                // Persist the arranged eleven too. This pitch was purely
                // decorative before: the engine re-picked by rating and threw
                // the arrangement away.
                const xi = starters
                  .filter((p): p is Player => !!p)
                  .map((p) => p.id ?? p.n);
                const lineupRes = await saveLineup({
                  xi,
                  bench: bench.map((p) => p.id ?? p.n).slice(0, 9),
                });
                if (!lineupRes.ok) {
                  toast({
                    icon: "!",
                    title: "Kadro kaydedilemedi",
                    body: lineupRes.error,
                    accent: "var(--danger)",
                  });
                } else {
                  setDirty(false);
                }
                if (res.ok) {
                  setPresetState((prev) => {
                    const next = [...prev];
                    next[preset] = { formation, ...dials };
                    return next;
                  });
                  toast({
                    icon: "✓",
                    title: `Preset ${PRESETS[preset]} kaydedildi`,
                    body: `${formation} · sıradaki maçta uygulanır`,
                    accent: "var(--emerald)",
                  });
                } else {
                  toast({
                    icon: "⚠",
                    title: "Kayıt başarısız",
                    body: res.error,
                    accent: "var(--danger)",
                  });
                }
              });
            }}
          >
            {pending
              ? "Kaydediliyor…"
              : dirty
                ? "Kadroyu ve Taktiği Kaydet •"
                : "Kaydet"}
          </button>
        </div>
      </div>

      <div
        data-tactic-layout
        style={{
          display: "grid",
          gridTemplateColumns: "260px minmax(0, 1fr) 320px",
          gap: 16,
          minHeight: 600,
        }}
      >
        {/* Left — controls */}
        <GlassCard
          pad={18}
          hover={false}
          data-tactic-controls
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          <div>
            <span className="t-label">DİZİLİŞ</span>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
                gap: 6,
                marginTop: 10,
              }}
            >
              {FORMATION_KEYS.map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`chip ${formation === f ? "active" : ""}`}
                  onClick={() => setFormation(f)}
                  style={{
                    cursor: "pointer",
                    padding: "8px 12px",
                    justifyContent: "center",
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          {/* Named setups. Seven sliders is depth for the manager who wants
              it and a wall for the one who does not — a style is the on-ramp:
              tap "Otobüs" and you have a coherent defensive plan, then find
              the sliders by seeing where it moved them. */}
          <div>
            <span className="t-label">HAZIR KURULUM</span>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 5,
                marginTop: 9,
              }}
            >
              {TACTIC_STYLES.map((st) => {
                const active =
                  formation === st.formation &&
                  TACTIC_KEYS.every((k) => dials[k] === st.dials[k]);
                return (
                  <button
                    key={st.id}
                    type="button"
                    className={`chip ${active ? "active" : ""}`}
                    title={st.blurb}
                    onClick={() => {
                      setFormation(st.formation as Formation);
                      setDials({ ...st.dials });
                      setDirty(true);
                    }}
                    style={{ cursor: "pointer", fontSize: 11 }}
                  >
                    {st.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* The projection. A tactics screen that cannot tell you what your
              tactics did is a form filled in blind — these are the same three
              numbers the match engine will compute. */}
          <PowerProjection squad={starters} dials={dials} formation={formation} />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {TACTIC_DIALS.map((d) => (
              <DialControl
                key={d.key}
                dial={d}
                value={dials[d.key]}
                onChange={(n) => setDial(d.key, n)}
              />
            ))}
          </div>
          <div
            style={{
              marginTop: "auto",
              padding: "10px 12px",
              borderRadius: 10,
              background: "var(--panel-2)",
              border: "1px solid var(--border)",
            }}
          >
            <span className="t-caption" style={{ fontSize: 11 }}>
              💡 Yedek → 11&apos;e almak için yedekten birini tıkla, ardından
              değiştirmek istediğin oyuncuya tıkla.
            </span>
          </div>
        </GlassCard>

        {/* Pitch */}
        <GlassCard
          pad={0}
          hover={false}
          data-tactic-pitch
          style={{ overflow: "hidden", position: "relative", minHeight: 600 }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, color-mix(in oklab, #0a1e14 80%, var(--bg)) 0%, color-mix(in oklab, #051a10 80%, var(--bg)) 100%)",
            }}
          >
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 600 800"
              preserveAspectRatio="none"
              style={{ position: "absolute", inset: 0, opacity: 0.5 }}
            >
              <g stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" fill="none">
                <rect x="20" y="20" width="560" height="760" />
                <line x1="20" y1="400" x2="580" y2="400" strokeDasharray="4,4" />
                <circle cx="300" cy="400" r="70" />
                <rect x="140" y="20" width="320" height="150" />
                <rect x="220" y="20" width="160" height="60" />
                <rect x="140" y="630" width="320" height="150" />
                <rect x="220" y="720" width="160" height="60" />
              </g>
            </svg>
            {slots.map((slot, i) => {
              const player = starters[i];
              const isSelected =
                selected?.type === "pitch" && selected.slot === i;
              return (
                <div
                  key={`slot-${i}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPitchClick(i);
                  }}
                  style={{
                    position: "absolute",
                    left: `${slot.x}%`,
                    top: `${slot.y}%`,
                    transform: "translate(-50%, -50%)",
                    cursor: "pointer",
                    userSelect: "none",
                    transition: "opacity var(--t) var(--ease), transform var(--t) var(--ease), color var(--t) var(--ease), background-color var(--t) var(--ease), border-color var(--t) var(--ease), box-shadow var(--t) var(--ease)",
                    zIndex: isSelected ? 10 : 1,
                  }}
                >
                  <PitchSlot
                    player={player}
                    slotRole={slot.r}
                    highlighted={isSelected}
                  />
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Right — bench */}
        <GlassCard
          pad={14}
          hover={false}
          data-tactic-bench
          style={{ display: "flex", flexDirection: "column", gap: 8 }}
        >
          <span className="t-label">YEDEKLER ({bench.length})</span>
          <div
            data-tactic-bench-list
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              overflowY: "auto",
              maxHeight: 640,
            }}
          >
            {bench.map((p) => {
              const id = p.id ?? p.n;
              const isSelected =
                selected?.type === "bench" && selected.id === id;
              const canFillSelected =
                selected?.type === "pitch"
                  ? slotScore(p, slots[selected.slot].r) > 0
                  : false;
              return (
                <div
                  key={id}
                  onClick={() => onBenchClick(p)}
                  className="glass"
                  style={{
                    padding: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: "pointer",
                    border: isSelected
                      ? "1px solid var(--accent)"
                      : canFillSelected
                        ? "1px solid color-mix(in oklab, var(--emerald) 50%, var(--border))"
                        : "1px solid var(--border)",
                    background: isSelected
                      ? "color-mix(in oklab, var(--accent) 15%, var(--panel))"
                      : "var(--panel)",
                    transition: "opacity var(--t) var(--ease), transform var(--t) var(--ease), color var(--t) var(--ease), background-color var(--t) var(--ease), border-color var(--t) var(--ease), box-shadow var(--t) var(--ease)",
                  }}
                >
                  <span
                    className="t-mono"
                    style={{
                      fontSize: 11,
                      color: "var(--muted)",
                      width: 18,
                    }}
                  >
                    {p.num ?? "?"}
                  </span>
                  <PosBadge pos={p.pos} size={18} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12.5,
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={p.n}
                    >
                      {p.n}
                    </div>
                    <div
                      className="t-caption"
                      style={{ fontSize: 10, marginTop: 1 }}
                    >
                      {[p.role, ...(p.secondaryRoles ?? [])].join(" · ")}
                    </div>
                  </div>
                  <OvrChip ovr={p.ovr} size="sm" />
                </div>
              );
            })}
            {bench.length === 0 && (
              <div className="t-small" style={{ color: "var(--muted)" }}>
                Yedek yok.
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {selected && (
        <div
          data-selected-chip
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 500,
            padding: "10px 18px",
            borderRadius: 999,
            background:
              "color-mix(in oklab, var(--bg-2) 92%, var(--accent) 8%)",
            border: "1px solid color-mix(in oklab, var(--accent) 40%, var(--border))",
            boxShadow: "var(--shadow-lg)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 13,
          }}
        >
          <span className="t-label" style={{ color: "var(--accent)" }}>
            SEÇİLİ
          </span>
          <span>
            {selected.type === "pitch"
              ? `${slots[selected.slot].r} slotu`
              : `${squad.find((p) => (p.id ?? p.n) === selected.id)?.n}`}
          </span>
          <ChevronRight size={12} strokeWidth={1.8} />
          <span className="t-caption" style={{ fontSize: 11 }}>
            {selected.type === "pitch"
              ? "Yedekten bir oyuncuya tıkla"
              : "Saha'daki bir oyuncuya tıkla"}
          </span>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setSelected(null)}
            style={{ padding: "2px 8px" }}
          >
            İptal
          </button>
        </div>
      )}
      <SubPlanPanel squad={squad} initial={subPlan} />
    </div>
  );
}

// ─── Pitch slot (player node or empty) ─────────────────────────
function PitchSlot({
  player,
  slotRole,
  highlighted,
}: {
  player: Player | null;
  slotRole: string;
  highlighted: boolean;
}) {
  const score = player ? slotScore(player, slotRole) : 0;
  const slotColor =
    score === 3
      ? "var(--emerald)"
      : score === 2
        ? "var(--cyan)"
        : score === 1
          ? "var(--warn)"
          : "var(--danger)";

  if (!player) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
          opacity: 0.5,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
            border: `2px dashed ${highlighted ? "var(--accent)" : "rgba(255,255,255,0.3)"}`,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-jetbrains)",
            fontWeight: 700,
            fontSize: 11,
            color: "#fff",
          }}
        >
          —
        </div>
        <div
          style={{
            background: "rgba(0,0,0,0.6)",
            padding: "2px 7px",
            borderRadius: 6,
            fontSize: 9,
            fontWeight: 700,
            whiteSpace: "nowrap",
            color: "#fff",
            letterSpacing: "0.04em",
          }}
        >
          {slotRole}
        </div>
      </div>
    );
  }

  const pColor = posColor(player.pos);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        filter: highlighted ? "drop-shadow(0 0 12px var(--accent))" : "none",
      }}
    >
      <div style={{ position: "relative" }}>
        <div
          style={{
            position: "absolute",
            inset: -4,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${slotColor}55, transparent 70%)`,
            opacity: score >= 2 ? 1 : 0.4,
          }}
        />
        <div
          style={{
            position: "relative",
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${pColor}, color-mix(in oklab, ${pColor} 40%, #0a0e1a))`,
            border: `2px solid ${
              highlighted ? "var(--accent)" : `color-mix(in oklab, ${slotColor} 70%, rgba(255,255,255,0.3))`
            }`,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-jetbrains)",
            fontWeight: 700,
            fontSize: 15,
            color: "#fff",
            boxShadow: `0 4px 12px rgba(0,0,0,0.5), 0 0 0 2px ${slotColor}33`,
          }}
        >
          {player.num ?? "?"}
        </div>
      </div>
      <div
        style={{
          background: "rgba(0,0,0,0.7)",
          padding: "2px 7px",
          borderRadius: 6,
          fontSize: 10,
          fontWeight: 600,
          whiteSpace: "nowrap",
          color: "#fff",
          maxWidth: 140,
          overflow: "hidden",
          textOverflow: "ellipsis",
          border: `1px solid ${slotColor}`,
        }}
        title={player.n}
      >
        {player.n}
      </div>
      <div
        style={{
          fontFamily: "var(--font-jetbrains)",
          fontSize: 8,
          fontWeight: 700,
          color: slotColor,
          letterSpacing: "0.08em",
        }}
      >
        {slotRole} · OVR {player.ovr}
      </div>
    </div>
  );
}

/**
 * One tactic dial.
 *
 * The old control was five numbered buttons with the extreme labels printed
 * underneath — so the manager knew the dial went from "Defansif" to
 * "Saldırgan" and nothing about what any of that cost. A dial whose price is
 * invisible always ends up at 5, which is how three sliders became three
 * chores with a right answer.
 *
 * So each step names itself, and the gain and the cost are both on screen.
 * The cost line is the one that makes the screen a decision.
 */
function DialControl({
  dial,
  value,
  onChange,
}: {
  dial: TacticDial;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <span className="t-label">{dial.label}</span>
        <span
          className="t-mono"
          style={{ fontSize: 10.5, color: "var(--accent)", fontWeight: 700 }}
        >
          {dial.steps[value]}
        </span>
      </div>
      <div
        style={{
          display: "flex",
          gap: 3,
          marginTop: 8,
        }}
        role="group"
        aria-label={dial.label}
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            title={dial.steps[i]}
            aria-label={dial.steps[i]}
            aria-pressed={i === value}
            style={{
              flex: 1,
              height: 26,
              borderRadius: 6,
              cursor: "pointer",
              border: "1px solid var(--border)",
              background:
                i === value
                  ? "color-mix(in oklab, var(--accent) 32%, transparent)"
                  : i < value
                    ? "color-mix(in oklab, var(--accent) 10%, var(--panel))"
                    : "var(--panel)",
              color: i === value ? "var(--accent)" : "var(--muted)",
              fontFamily: "var(--font-jetbrains)",
              fontWeight: 700,
              fontSize: 11,
              transition:
                "color var(--t) var(--ease), background-color var(--t) var(--ease), border-color var(--t) var(--ease)",
            }}
          >
            {i + 1}
          </button>
        ))}
      </div>
      <div
        style={{
          marginTop: 7,
          display: "flex",
          flexDirection: "column",
          gap: 3,
          fontSize: 10.5,
          lineHeight: 1.45,
        }}
      >
        <span style={{ color: "var(--emerald)" }}>+ {dial.gain}</span>
        <span style={{ color: "var(--warn)" }}>− {dial.cost}</span>
      </div>
    </div>
  );
}

/**
 * What this eleven, with these dials, is worth in each phase.
 *
 * Runs the ACTUAL engine model (lib/engine/power.ts) rather than an
 * approximation of it, so the bars cannot drift away from what the simulation
 * does on match day. `homeBoost` is zero here: this is the neutral strength of
 * the setup, not a prediction of one specific fixture.
 */
function PowerProjection({
  squad,
  dials,
  formation,
}: {
  squad: Array<Player | null>;
  dials: Record<TacticKey, number>;
  formation: Formation;
}) {
  const power = useMemo(() => {
    const eleven: PowerPlayer[] = squad
      .filter((p): p is Player => !!p)
      .map((p) => ({
        position: p.pos,
        role: p.role,
        // The landing-page mock players carry no attributes; falling back to
        // the rating keeps the bars sane instead of rendering a squad of 0s.
        pace: p.pace ?? p.ovr,
        shooting: p.shooting ?? p.ovr,
        passing: p.passing ?? p.ovr,
        defending: p.defending ?? p.ovr,
        physical: p.physical ?? p.ovr,
        goalkeeping: p.goalkeeping ?? (p.pos === "GK" ? p.ovr : 30),
        overall: p.ovr,
        morale: p.mor ?? 3,
        fitness: p.fit ?? 90,
      }));
    return teamPower(eleven, { formation, ...dials }, 0);
  }, [squad, dials, formation]);

  // The bars are scaled across 40-95, the band real elevens actually occupy.
  // Scaling 0-99 would leave every side sitting between 60% and 85% full and
  // moving a dial would look like it did nothing.
  const pct = (v: number) => Math.max(2, Math.min(100, ((v - 40) / 55) * 100));
  const rows: Array<[string, number, string]> = [
    ["HÜCUM", power.attack, "var(--danger)"],
    ["ORTA SAHA", power.midfield, "var(--accent)"],
    ["DEFANS", power.defense, "var(--cyan)"],
  ];

  return (
    <div
      style={{
        padding: "12px 14px",
        borderRadius: 12,
        background: "var(--panel-2)",
        border: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <span className="t-label">TAKIM GÜCÜ</span>
      {rows.map(([label, value, color]) => (
        <div key={label}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 4,
            }}
          >
            <span className="t-caption" style={{ fontSize: 10.5 }}>
              {label}
            </span>
            <span
              className="t-mono"
              style={{ fontSize: 11.5, fontWeight: 700, color }}
            >
              {Math.round(value)}
            </span>
          </div>
          <div
            style={{
              height: 4,
              borderRadius: 2,
              background: "var(--border)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                background: color,
                width: "100%",
                transformOrigin: "left",
                transform: `scaleX(${pct(value) / 100})`,
                transition: "transform 320ms var(--ease)",
              }}
            />
          </div>
        </div>
      ))}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          fontSize: 10,
          color: "var(--muted)",
        }}
      >
        <span>Kondisyon yükü +{Math.round(power.fatigue)}</span>
        <span>Kart riski ×{power.cardRisk.toFixed(2)}</span>
      </div>
    </div>
  );
}
