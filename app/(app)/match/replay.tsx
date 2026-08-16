"use client";

/**
 * The match, played back.
 *
 * The report screen used to print every line at once. That is a transcript,
 * not a match — the result was known before the first sentence, so nothing in
 * the feed could surprise you and there was no reason to read past the
 * scoreline at the top.
 *
 * So the feed plays. Events arrive on a clock, the scoreboard is blank until
 * a goal actually goes in, and the clock holds longer on the moments that
 * matter (weight 3 = a goal) than on the ones that do not (weight 0 = a
 * corner). The manager can speed it up, pause it, or skip straight to the end
 * — the point is to offer the watch, not to enforce it.
 *
 * Two rules this component obeys:
 *
 *  1. `prefers-reduced-motion` reveals everything immediately and hides the
 *     transport. Someone who has asked the system not to animate things has
 *     asked for the transcript, and they should get it without a fight.
 *  2. The autoplay only starts once. Re-rendering (a theme change, a resize)
 *     must not restart a match the user is halfway through watching.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  FastForward,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
} from "lucide-react";
import type { MatchEvent } from "@/lib/engine/match";

/** How long the clock holds on an event, by how much it matters. */
const HOLD_MS: Record<number, number> = {
  0: 900,
  1: 1250,
  2: 1750,
  3: 2800,
};

const SPEEDS = [1, 2, 4] as const;
type Speed = (typeof SPEEDS)[number];

type EventStyle = {
  label: string;
  color: string;
  /** Only the moments worth colouring get a tinted card. */
  emphasis: boolean;
};

const STYLE: Record<MatchEvent["type"], EventStyle> = {
  start: { label: "BAŞLANGIÇ", color: "var(--muted)", emphasis: false },
  goal: { label: "GOL", color: "var(--emerald)", emphasis: true },
  chance: { label: "POZİSYON", color: "var(--cyan)", emphasis: false },
  save: { label: "KURTARIŞ", color: "var(--cyan)", emphasis: true },
  miss: { label: "KAÇAN FIRSAT", color: "var(--muted-2)", emphasis: false },
  corner: { label: "KORNER", color: "var(--muted)", emphasis: false },
  duel: { label: "MÜCADELE", color: "var(--muted)", emphasis: false },
  card: { label: "KART", color: "var(--warn)", emphasis: true },
  sub: { label: "DEĞİŞİKLİK", color: "var(--indigo)", emphasis: false },
  injury: { label: "SAKATLIK", color: "var(--danger)", emphasis: true },
  analysis: { label: "YORUM", color: "var(--gold)", emphasis: false },
  half: { label: "DEVRE ARASI", color: "var(--text-2)", emphasis: true },
  end: { label: "MAÇ SONU", color: "var(--text-2)", emphasis: true },
};

export function MatchReplay({
  events,
  homeClubName,
  awayClubName,
  homeShort,
  awayShort,
  onReveal,
}: {
  events: MatchEvent[];
  homeClubName: string;
  awayClubName: string;
  homeShort: string;
  awayShort: string;
  /**
   * Fired once the result is no longer a secret — the replay reached full
   * time, the reader skipped to the end, or reduced motion revealed
   * everything at once. The page uses it to un-hide the scoreboard.
   */
  onReveal?: () => void;
}) {
  const reduced = usePrefersReducedMotion();

  // `shown` is how many events have been revealed. Starts at 1 so the
  // kick-off line is on screen before the transport does anything.
  const [shown, setShown] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>(1);
  const started = useRef(false);
  const feedRef = useRef<HTMLDivElement | null>(null);

  const total = events.length;
  const done = shown >= total;

  // Autoplay exactly once, and never for a reduced-motion reader.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (reduced) setShown(total);
    else setPlaying(true);
  }, [reduced, total]);

  useEffect(() => {
    if (!playing || done) return;
    const next = events[shown];
    const hold = (HOLD_MS[next?.weight ?? 0] ?? 1000) / speed;
    const t = setTimeout(() => setShown((n) => Math.min(total, n + 1)), hold);
    return () => clearTimeout(t);
  }, [playing, done, shown, speed, events, total]);

  useEffect(() => {
    if (!done) return;
    setPlaying(false);
    onReveal?.();
  }, [done, onReveal]);

  // Keep the newest line in view while playing, but never yank the page
  // around when the reader has taken over and is scrolling back.
  useEffect(() => {
    if (!playing) return;
    const el = feedRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [shown, playing]);

  const visible = useMemo(() => events.slice(0, shown), [events, shown]);
  const latest = visible[visible.length - 1];
  const clock = latest?.minute ?? 0;
  const scoreHome = lastScore(visible, "scoreHome");
  const scoreAway = lastScore(visible, "scoreAway");
  const celebrating = latest?.type === "goal" && playing;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
      {/* ── Transport + live clock ─────────────────────────────── */}
      <div
        style={{
          padding: "12px 18px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div
          className="t-mono"
          aria-live="off"
          style={{
            fontSize: 18,
            fontWeight: 800,
            minWidth: 52,
            color: playing ? "var(--emerald)" : "var(--text)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {clock}&apos;
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "4px 12px",
            borderRadius: 999,
            background: "var(--panel-2)",
            border: "1px solid var(--border)",
          }}
        >
          <span className="t-mono" style={{ fontSize: 11, color: "var(--muted)" }}>
            {homeShort}
          </span>
          <span
            className="t-mono"
            data-replay-score
            style={{
              fontSize: 16,
              fontWeight: 800,
              transition: "transform 220ms var(--ease)",
              transform: celebrating ? "scale(1.25)" : "scale(1)",
              color: celebrating ? "var(--emerald)" : "var(--text)",
            }}
          >
            {scoreHome} – {scoreAway}
          </span>
          <span className="t-mono" style={{ fontSize: 11, color: "var(--muted)" }}>
            {awayShort}
          </span>
        </div>

        <div style={{ flex: 1 }} />

        {!reduced && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {done ? (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setShown(1);
                  setPlaying(true);
                }}
              >
                <RotateCcw size={14} /> Baştan
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setPlaying((p) => !p)}
                aria-label={playing ? "Duraklat" : "Oynat"}
              >
                {playing ? <Pause size={14} /> : <Play size={14} />}
                {playing ? "Duraklat" : "Oynat"}
              </button>
            )}
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() =>
                setSpeed((s) => SPEEDS[(SPEEDS.indexOf(s) + 1) % SPEEDS.length])
              }
              aria-label="Hız"
            >
              <FastForward size={14} />
              {speed}×
            </button>
            {!done && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setPlaying(false);
                  setShown(total);
                }}
              >
                <SkipForward size={14} /> Atla
              </button>
            )}
          </div>
        )}
      </div>

      {/* Progress through the 90 minutes. scaleX, not width — no relayout. */}
      <div
        className="bar"
        style={{ height: 3, borderRadius: 0, background: "var(--border)" }}
      >
        <span style={{ "--fill": shown / total } as React.CSSProperties} />
      </div>

      {/* ── The feed ───────────────────────────────────────────── */}
      <div
        ref={feedRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 18px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          minHeight: 240,
        }}
      >
        {visible.map((e, i) => (
          <ReplayLine
            key={`${e.minute}-${i}`}
            e={e}
            isNewest={i === visible.length - 1 && !done}
            homeClubName={homeClubName}
            awayClubName={awayClubName}
          />
        ))}
      </div>
    </div>
  );
}

/** Last non-undefined running score in the revealed slice. */
function lastScore(events: MatchEvent[], key: "scoreHome" | "scoreAway"): number {
  for (let i = events.length - 1; i >= 0; i--) {
    const v = events[i][key];
    if (typeof v === "number") return v;
  }
  return 0;
}

function ReplayLine({
  e,
  isNewest,
  homeClubName,
  awayClubName,
}: {
  e: MatchEvent;
  isNewest: boolean;
  homeClubName: string;
  awayClubName: string;
}) {
  const s = STYLE[e.type] ?? STYLE.analysis;
  const isGoal = e.type === "goal";
  const club =
    e.side === "home" ? homeClubName : e.side === "away" ? awayClubName : null;

  return (
    <article
      className={isGoal ? "anim-slide-up replay-goal" : "anim-slide-up"}
      style={{ display: "flex", gap: 12, alignItems: "flex-start" }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
          minWidth: 42,
          paddingTop: 8,
        }}
      >
        <span
          className="t-mono"
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: isGoal ? "var(--emerald)" : "var(--muted)",
          }}
        >
          {e.minute}&apos;
        </span>
        <span style={{ fontSize: isGoal ? 20 : 15, lineHeight: 1 }}>{e.icon}</span>
      </div>

      <div
        style={{
          flex: 1,
          minWidth: 0,
          background: s.emphasis
            ? `color-mix(in oklab, ${s.color} 9%, var(--panel))`
            : "var(--panel-2)",
          padding: isGoal ? "14px 16px" : "10px 14px",
          borderRadius: 12,
          border: `1px solid ${
            s.emphasis
              ? `color-mix(in oklab, ${s.color} 32%, var(--border))`
              : "var(--border)"
          }`,
          boxShadow:
            isGoal && isNewest
              ? "0 0 0 3px color-mix(in oklab, var(--emerald) 22%, transparent)"
              : "none",
          transition: "box-shadow 300ms var(--ease)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <span
            className="t-label"
            style={{ color: s.color, fontSize: 9.5, letterSpacing: "0.12em" }}
          >
            {s.label}
          </span>
          {club && (
            <span
              className="t-mono"
              style={{ fontSize: 9.5, color: "var(--muted)" }}
            >
              {club}
            </span>
          )}
        </div>
        <p
          style={{
            fontSize: isGoal ? 15 : 14,
            fontWeight: isGoal ? 600 : 400,
            lineHeight: 1.6,
            color: "var(--text)",
            margin: "5px 0 0",
          }}
        >
          {e.text}
        </p>
      </div>
    </article>
  );
}

/** True when the reader has asked the system not to animate. */
function usePrefersReducedMotion(): boolean {
  // Starts false and corrects on mount: matchMedia does not exist during SSR,
  // and guessing `true` would render the transport-free variant to everyone
  // for one frame.
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}
