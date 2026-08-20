"use client";

import { useMemo, useTransition } from "react";
import { AlertTriangle, Dumbbell, Plus, X, Zap } from "lucide-react";
import { OvrChip, PosBadge } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { posColor } from "@/lib/utils";
import { playFriendly, setTrainingFocus, toggleTraining } from "./actions";
import type { FriendlyAllowance } from "@/lib/queries/friendlies";
import {
  ATTR_LABEL,
  PRIMARY_ATTR,
  TRAINABLE,
  type TrainableAttr,
} from "@/lib/attributes";
import type { Player, Position } from "@/types";
import { growthLabel, weeklyGain } from "@/lib/progression";

const GROUPS: Array<{ pos: Position; label: string }> = [
  { pos: "GK", label: "Kaleci" },
  { pos: "DEF", label: "Defans" },
  { pos: "MID", label: "Orta Saha" },
  { pos: "FWD", label: "Forvet" },
];

/**
 * What this player will actually gain, per week, in this club.
 *
 * The panel used to print a bare "3×" / "2×" / "1×" / "0.5×" multiplier
 * copied by hand from the training job's age check. Two problems: a
 * multiplier of an unstated base is not a number a manager can act on, and
 * the copy drifted the moment the job's curve changed — the panel went on
 * quoting an age rule the simulation had stopped using.
 *
 * It now calls the same `weeklyGain` the job rolls against, with the club's
 * real training level and coach tier, and states the result in the unit the
 * decision is made in: rating points per week.
 */
function previewFor(
  p: Player,
  ctx: { trainingLevel: number; coachTier: number },
): { perWeek: number; label: string; tone: string } {
  const perWeek = weeklyGain(
    {
      age: p.age,
      overall: p.ovr,
      potential: p.pot,
      morale: p.mor ?? 3,
      fitness: p.fit ?? 90,
    },
    ctx,
  );
  const { label, tone } = growthLabel(perWeek);
  const TONE: Record<typeof tone, string> = {
    gold: "var(--gold)",
    emerald: "var(--emerald)",
    cyan: "var(--cyan)",
    muted: "var(--muted)",
  };
  return { perWeek, label, tone: TONE[tone] };
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
export function TrainingPanel({
  squad,
  trainingLevel,
  coachTier,
  friendly,
}: {
  squad: Player[];
  trainingLevel: number;
  coachTier: number;
  /** Today's friendly allowance — see lib/queries/friendlies.ts. */
  friendly: FriendlyAllowance;
}) {
  const progressCtx = { trainingLevel, coachTier };
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

  /**
   * Best untrained candidate for an empty slot.
   *
   * Ranked by what the slot would actually be worth — the same weekly gain
   * the card prints — rather than by raw headroom. A 33-year-old twelve
   * points off his ceiling gains almost nothing; an 18-year-old four points
   * off gains far more, and the old `b.pot - b.ovr` ordering recommended the
   * veteran. The `p.ovr < p.pot` filter is gone with it: potential is a brake,
   * not a wall, so a player at his ceiling is a poor suggestion rather than an
   * ineligible one.
   */
  const suggestionFor = (pos: Position): Player | undefined =>
    squad
      .filter(
        (p) =>
          p.pos === pos &&
          p.status !== "training" &&
          p.status !== "injured" &&
          p.status !== "suspended",
      )
      .sort(
        (a, b) =>
          previewFor(b, progressCtx).perWeek - previewFor(a, progressCtx).perWeek,
      )[0];

  const focus = (playerId: string, attr: TrainableAttr, name: string) => {
    startTransition(async () => {
      const res = await setTrainingFocus({ playerId, focus: attr });
      if (res.ok) {
        pushToast({
          icon: "◎",
          title: `${name} artık ${ATTR_LABEL[attr]} çalışıyor`,
          accent: "var(--accent)",
        });
      } else {
        pushToast({ title: "Olmadı", body: res.error, accent: "var(--danger)" });
      }
    });
  };

  const run = (playerId: string, adding: boolean, name: string) => {
    startTransition(async () => {
      const res = await toggleTraining(playerId);
      if (res.ok) {
        pushToast({
          icon: adding ? "▲" : "✓",
          title: adding ? `${name} antrenmana alındı` : `${name} antrenmandan çıktı`,
          accent: adding ? "var(--emerald)" : undefined,
        });
      } else {
        pushToast({ title: "Olmadı", body: res.error, accent: "var(--danger)" });
      }
    });
  };

  const filled = GROUPS.filter(({ pos }) => bySlot.get(pos)).length;

  /*
    ── Friendlies ────────────────────────────────────────────────────────

    A friendly restored fitness, lifted morale and rolled the progression
    curve — a genuine mechanic — and the only way to reach it was a button
    buried in an individual player's sheet. You had to already know it
    existed, already know it was capped at three a day, and already know
    which player you wanted, before you could find it. Most of that is not
    discoverable from a button inside a dialog.

    It belongs here because it answers the same question the training slots
    answer: how do I make this squad better. The candidate is whoever most
    needs it — lowest fitness among the fit-to-play — because that is what a
    friendly is actually for.
  */
  const friendlyPick = useMemo(
    () =>
      squad
        .filter(
          (p) =>
            p.id &&
            p.status !== "injured" &&
            p.status !== "suspended" &&
            p.status !== "listed",
        )
        .sort((a, b) => (a.fit ?? 100) - (b.fit ?? 100))[0],
    [squad],
  );

  const runFriendly = (p: Player) => {
    startTransition(async () => {
      const res = await playFriendly(p.id!);
      if (res.ok) {
        pushToast({
          icon: "⚡",
          title: `${p.n} dostluk maçında oynadı`,
          body: `Kondisyon ${res.fitness}${res.ovrBump ? " · bir basamak yükseldi" : ""} · ${res.remaining} hak kaldı`,
          accent: "var(--emerald)",
        });
      } else {
        pushToast({ title: "Olmadı", body: res.error, accent: "var(--danger)" });
      }
    });
  };

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
          Her mevkiden bir oyuncu · gençler hızlı gelişir, potansiyelin üstünde
          gelişim durmaz ama çok yavaşlar
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
            /*
              An empty slot is ONE LINE, not a card.

              All four rendered as 132px boxes carrying a sentence that said
              nothing ("Slot boş — bu mevkiden bir oyuncu gelişmiyor" is the
              slot being empty, restated) plus one button. Four of them cost
              ~200px at the top of the squad screen — the screen whose whole
              problem was that you had to scroll to see your own squad — to
              tell you that nothing was happening.

              The suggestion is the only thing here worth space, so the row IS
              the suggestion: tap it and that player starts training.
            */
            return (
              <button
                key={pos}
                type="button"
                disabled={pending || !pick}
                onClick={() => pick && run(pick.id!, true, pick.n)}
                title={
                  pick
                    ? `${pick.n} antrenmana alınsın — haftada yaklaşık +${previewFor(pick, progressCtx).perWeek.toFixed(1)}`
                    : "Bu mevkide gelişebilecek oyuncu yok"
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  textAlign: "left",
                  font: "inherit",
                  color: "inherit",
                  padding: "9px 12px",
                  borderRadius: 12,
                  border: "1px dashed var(--border-strong)",
                  background: "color-mix(in oklab, var(--bg-2) 55%, transparent)",
                  cursor: pick ? "pointer" : "default",
                  opacity: pick ? 1 : 0.6,
                }}
              >
                <PosBadge pos={pos} size={18} />
                <span className="t-label" style={{ fontSize: 9.5 }}>
                  {label.toUpperCase()}
                </span>
                {pick ? (
                  <>
                    <Plus
                      size={12}
                      strokeWidth={2}
                      style={{ color: tint, marginLeft: "auto", flexShrink: 0 }}
                    />
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: 118,
                      }}
                    >
                      {pick.n}
                    </span>
                    <span
                      className="t-mono"
                      style={{ fontSize: 10.5, color: tint, flexShrink: 0 }}
                    >
                      +{previewFor(pick, progressCtx).perWeek.toFixed(1)}
                    </span>
                  </>
                ) : (
                  <span
                    className="t-caption"
                    style={{ fontSize: 10.5, marginLeft: "auto" }}
                  >
                    aday yok
                  </span>
                )}
              </button>
            );
          }

          const room = p.pot - p.ovr;
          const atCeiling = room <= 0;
          const pct = p.pot > 0 ? Math.round((p.ovr / p.pot) * 100) : 100;
          const speed = previewFor(p, progressCtx);
          return (
            <div
              key={pos}
              style={{
                borderRadius: 14,
                border: atCeiling
                  ? "1px solid color-mix(in oklab, var(--warn, #f59e0b) 35%, var(--border))"
                  : `1px solid color-mix(in oklab, ${tint} 40%, var(--border))`,
                background: atCeiling
                  ? "var(--bg-2)"
                  : `linear-gradient(160deg, color-mix(in oklab, ${tint} 12%, var(--bg-2)), var(--bg-2))`,
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

              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {TRAINABLE.filter((a) =>
                  // A keeper has no use for shooting drills, and an outfielder
                  // none for goalkeeping. Offering them would be noise.
                  p.pos === "GK" ? a === "goalkeeping" || a === "physical" || a === "pace"
                    : a !== "goalkeeping",
                ).map((a) => {
                  const active = (p.trainingFocus ?? PRIMARY_ATTR[p.pos]) === a;
                  const primary = PRIMARY_ATTR[p.pos] === a;
                  return (
                    <button
                      key={a}
                      type="button"
                      disabled={pending}
                      onClick={() => focus(p.id!, a, p.n)}
                      title={
                        primary
                          ? `${ATTR_LABEL[a]} — bu mevkinin ana özelliği, OVR'yi de yükseltir`
                          : `${ATTR_LABEL[a]} — maçta işe yarar, OVR'yi yükseltmez`
                      }
                      className="t-mono"
                      style={{
                        fontSize: 9.5,
                        fontWeight: 700,
                        padding: "3px 7px",
                        borderRadius: 6,
                        cursor: "pointer",
                        border: `1px solid ${active ? tint : "var(--border)"}`,
                        background: active
                          ? `color-mix(in oklab, ${tint} 20%, transparent)`
                          : "transparent",
                        color: active ? tint : "var(--muted)",
                      }}
                    >
                      {ATTR_LABEL[a]}
                      {primary && " ★"}
                    </button>
                  );
                })}
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
                  matters when choosing who to train.

                  A player already at his ceiling used to render as a solid
                  full bar over "77 → 77": indistinguishable from a player
                  making progress, and in a warm position colour it read as an
                  error. He cannot improve, so the slot is being wasted — say
                  so, and point at the way out. */}
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
                      // scaleX, not width — see the note on Bar in
                      // components/ui/primitives.tsx.
                      width: "100%",
                      height: "100%",
                      borderRadius: 999,
                      background: atCeiling
                        ? "color-mix(in oklab, var(--muted) 55%, transparent)"
                        : tint,
                      transformOrigin: "left",
                      transform: `scaleX(${pct / 100})`,
                      transition: "transform var(--t) var(--ease)",
                    }}
                  />
                </div>
                <div
                  className="t-mono"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 10,
                    color: "var(--muted)",
                    marginTop: 5,
                  }}
                >
                  {atCeiling ? (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        color: "var(--warn, #f59e0b)",
                        fontWeight: 700,
                      }}
                      title={`${p.n} potansiyelinin (${p.pot}) üstünde çalışıyor — gelişim çok yavaş ama durmuş değil.`}
                    >
                      <AlertTriangle size={10} strokeWidth={2.2} />
                      TAVANIN ÜSTÜNDE · ÇOK YAVAŞ
                    </span>
                  ) : (
                    <span>
                      {p.ovr} → {p.pot}
                      <span style={{ color: tint }}> · +{room} kaldı</span>
                    </span>
                  )}
                  <span
                    style={{
                      color: speed.tone,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 3,
                      flexShrink: 0,
                      fontWeight: 700,
                    }}
                    title={`${p.age} yaş · tesis ${trainingLevel} · antrenör ${coachTier} — haftada yaklaşık +${speed.perWeek.toFixed(1)} (${speed.label})`}
                  >
                    <Zap size={9} strokeWidth={2.2} />+{speed.perWeek.toFixed(1)}/hf
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          marginTop: 12,
          paddingTop: 12,
          borderTop: "1px solid var(--border)",
        }}
      >
        <Zap size={14} strokeWidth={1.8} style={{ color: "var(--gold)" }} />
        <span className="t-label" style={{ fontSize: 10 }}>
          DOSTLUK MAÇI
        </span>
        <span style={{ display: "inline-flex", gap: 3 }}>
          {Array.from({ length: friendly.cap }).map((_, i) => (
            <span
              key={i}
              title={
                i < friendly.remaining ? "Kullanılabilir" : "Bugün kullanıldı"
              }
              style={{
                width: 16,
                height: 5,
                borderRadius: 3,
                background:
                  i < friendly.remaining ? "var(--gold)" : "var(--panel-2)",
              }}
            />
          ))}
        </span>
        <span className="t-caption" style={{ fontSize: 11 }}>
          {friendly.remaining > 0
            ? `${friendly.remaining} hak kaldı · €150K · kondisyon ve moral yükselir, gelişim şansı verir`
            : "Bugünlük bitti — 24 saat içinde yenilenir"}
        </span>

        <div style={{ flex: 1 }} />

        {friendlyPick && friendly.remaining > 0 ? (
          <button
            type="button"
            className="btn btn-sm btn-outline"
            disabled={pending}
            onClick={() => runFriendly(friendlyPick)}
            title={`En yorgun oyuncun — kondisyon ${friendlyPick.fit ?? 0}`}
          >
            <Zap size={12} strokeWidth={2} />
            {friendlyPick.n} ile oyna
            <span className="t-mono" style={{ opacity: 0.7 }}>
              {friendlyPick.fit ?? 0}
            </span>
          </button>
        ) : (
          <span className="t-caption" style={{ fontSize: 10.5 }}>
            {friendly.remaining === 0 ? "" : "Uygun oyuncu yok"}
          </span>
        )}
      </div>
    </section>
  );
}
