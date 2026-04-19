"use client";

import type { CSSProperties, MouseEventHandler, ReactNode } from "react";
import { clubById } from "@/lib/mock-data";
import { fmtEUR, posColor, tierColor, tierLabel } from "@/lib/utils";
import type { Position } from "@/types";

// ─── Crest — club monogram with gradient ────────────────────────
type CrestClubInfo = { color: string; color2: string; short: string };
type CrestProps = {
  clubId: string;
  size?: number;
  ring?: boolean;
  club?: CrestClubInfo;
};
export function Crest({ clubId, size = 28, ring = false, club }: CrestProps) {
  const c = club ?? clubById(clubId);
  if (!c) return null;
  const s = size;
  return (
    <div
      style={{
        width: s,
        height: s,
        flexShrink: 0,
        borderRadius: "50%",
        background: `linear-gradient(135deg, ${c.color} 0%, ${c.color2} 120%)`,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-manrope)",
        fontWeight: 800,
        fontSize: s * 0.38,
        color: "#fff",
        letterSpacing: "-0.03em",
        boxShadow: ring
          ? "0 0 0 2px var(--bg), 0 0 0 3px var(--border-strong)"
          : `0 2px 6px ${c.color}44`,
        textShadow: "0 1px 2px rgba(0,0,0,0.3)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg,rgba(255,255,255,0.2),transparent 50%)",
        }}
      />
      <span style={{ position: "relative", zIndex: 1 }}>{c.short.slice(0, 2)}</span>
    </div>
  );
}

// ─── PosBadge — position marker ────────────────────────────────
type PosBadgeProps = { pos: Position; size?: number; showLabel?: boolean };
export function PosBadge({ pos, size = 28, showLabel = false }: PosBadgeProps) {
  const label = pos === "DEF" ? "DEF" : pos === "MID" ? "MID" : pos === "FWD" ? "FWD" : "GK";
  const color = posColor(pos);
  if (showLabel) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 10px 4px 4px",
          borderRadius: 999,
          background: `linear-gradient(135deg, color-mix(in oklab, ${color} 30%, transparent), color-mix(in oklab, ${color} 10%, transparent))`,
          border: `1px solid color-mix(in oklab, ${color} 45%, var(--border))`,
        }}
      >
        <span
          style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: color,
            color: "#fff",
            fontFamily: "var(--font-jetbrains)",
            fontWeight: 800,
            fontSize: 10,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 0 2px color-mix(in oklab, ${color} 25%, transparent)`,
          }}
        >
          {label[0]}
        </span>
        <span
          style={{
            fontFamily: "var(--font-jetbrains)",
            fontWeight: 700,
            fontSize: 11,
            color,
            letterSpacing: "0.08em",
          }}
        >
          {label}
        </span>
      </span>
    );
  }
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        background: `linear-gradient(135deg, ${color} 0%, color-mix(in oklab, ${color} 40%, var(--bg-2)) 100%)`,
        border: `1px solid color-mix(in oklab, ${color} 60%, transparent)`,
        color: "#fff",
        fontFamily: "var(--font-jetbrains)",
        fontWeight: 800,
        fontSize: size * 0.38,
        letterSpacing: "0.02em",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: `0 2px 8px -2px color-mix(in oklab, ${color} 60%, transparent), inset 0 1px 0 rgba(255,255,255,0.2)`,
        textShadow: "0 1px 2px rgba(0,0,0,0.3)",
      }}
    >
      {label}
    </span>
  );
}

// ─── AgePill — age + career stage ──────────────────────────────
type AgePillProps = { age: number; size?: "sm" | "md" };
export function AgePill({ age, size = "md" }: AgePillProps) {
  const stage =
    age <= 21 ? { l: "GENÇ", c: "var(--emerald)" } :
    age <= 25 ? { l: "YÜKSELİŞ", c: "var(--cyan)" } :
    age <= 29 ? { l: "ZİRVE", c: "var(--accent)" } :
    age <= 32 ? { l: "TECRÜBE", c: "var(--gold)" } :
                { l: "VETERAN", c: "var(--warn)" };
  const fs = size === "sm" ? 11 : 13;
  const lfs = size === "sm" ? 8 : 9;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 9px 3px 6px",
        borderRadius: 7,
        background: `color-mix(in oklab, ${stage.c} 10%, var(--panel-2))`,
        border: `1px solid color-mix(in oklab, ${stage.c} 32%, var(--border))`,
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-jetbrains)",
          fontSize: fs,
          fontWeight: 700,
          color: "var(--text)",
          letterSpacing: "-0.02em",
          lineHeight: 1,
        }}
      >
        {age}
      </span>
      <span style={{ width: 1, height: 10, background: "var(--border-strong)" }} />
      <span
        style={{
          fontFamily: "var(--font-jetbrains)",
          fontSize: lfs,
          fontWeight: 700,
          color: stage.c,
          letterSpacing: "0.08em",
          lineHeight: 1,
        }}
      >
        {stage.l}
      </span>
    </span>
  );
}

// ─── OvrChip — two-line tier badge ─────────────────────────────
type OvrChipProps = { ovr: number; size?: "sm" | "md" | "lg" };
export function OvrChip({ ovr, size = "md" }: OvrChipProps) {
  const color = tierColor(ovr);
  const tier = tierLabel(ovr);
  const dims =
    size === "sm" ? { w: 38, h: 38, fs: 18, lfs: 8, r: 8, gap: 0 } :
    size === "lg" ? { w: 64, h: 64, fs: 32, lfs: 10, r: 12, gap: 1 } :
                    { w: 48, h: 48, fs: 22, lfs: 9, r: 10, gap: 1 };
  return (
    <div
      style={{
        width: dims.w,
        height: dims.h,
        borderRadius: dims.r,
        background: `linear-gradient(145deg, color-mix(in oklab, ${color} 28%, var(--panel)) 0%, color-mix(in oklab, ${color} 12%, var(--bg-2)) 100%)`,
        border: `1.5px solid color-mix(in oklab, ${color} 55%, var(--border))`,
        boxShadow: `0 4px 14px -4px color-mix(in oklab, ${color} 40%, transparent), inset 0 1px 0 color-mix(in oklab, ${color} 30%, transparent)`,
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: dims.gap,
        flexShrink: 0,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-manrope)",
          fontWeight: 800,
          fontSize: dims.fs,
          color,
          letterSpacing: "-0.04em",
          lineHeight: 1,
          textShadow: `0 1px 8px color-mix(in oklab, ${color} 30%, transparent)`,
        }}
      >
        {ovr}
      </span>
      {size !== "sm" && (
        <span
          style={{
            fontFamily: "var(--font-jetbrains)",
            fontSize: dims.lfs,
            fontWeight: 700,
            color: `color-mix(in oklab, ${color} 75%, var(--muted))`,
            letterSpacing: "0.1em",
            lineHeight: 1,
          }}
        >
          {tier}
        </span>
      )}
    </div>
  );
}

// ─── UserAvatar — initials, hash-based color ───────────────────
type UserAvatarProps = { name: string; size?: number };
export function UserAvatar({ name, size = 24 }: UserAvatarProps) {
  const initials = (name || "?")
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `oklch(0.5 0.08 ${hue})`,
        color: "#fff",
        fontWeight: 600,
        fontSize: size * 0.4,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        fontFamily: "var(--font-manrope)",
      }}
    >
      {initials}
    </div>
  );
}

// ─── GlassCard — glass morphism wrapper ────────────────────────
type GlassCardProps = {
  children?: ReactNode;
  style?: CSSProperties;
  className?: string;
  onClick?: MouseEventHandler<HTMLDivElement>;
  hover?: boolean;
  pad?: number;
};
export function GlassCard({
  children,
  style,
  className = "",
  onClick,
  hover = true,
  pad = 16,
}: GlassCardProps) {
  return (
    <div
      className={`glass ${hover ? "glass-hover" : ""} ${className}`}
      onClick={onClick}
      style={{ padding: pad, cursor: onClick ? "pointer" : "default", ...style }}
    >
      {children}
    </div>
  );
}

// ─── SectionHead — label + title + optional right slot ────────
type SectionHeadProps = {
  label?: string;
  title?: ReactNode;
  right?: ReactNode;
};
export function SectionHead({ label, title, right }: SectionHeadProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        marginBottom: 16,
        gap: 12,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {label && <span className="t-label">{label}</span>}
        {title && <span className="t-h2">{title}</span>}
      </div>
      {right}
    </div>
  );
}

// ─── Currency ──────────────────────────────────────────────────
type CurrencyProps = { value: number; size?: number; color?: string };
export function Currency({ value, size = 14, color }: CurrencyProps) {
  return (
    <span
      className="t-mono"
      style={{
        fontSize: size,
        fontWeight: 600,
        color: color || "var(--text)",
        letterSpacing: 0,
      }}
    >
      {fmtEUR(value)}
    </span>
  );
}

// ─── Bar — horizontal progress ────────────────────────────────
type BarProps = {
  value: number;
  max?: number;
  color?: string;
  height?: number;
  showValue?: boolean;
};
export function Bar({ value, max = 100, color, height = 4, showValue = false }: BarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
      <div
        style={{
          flex: 1,
          height,
          borderRadius: 999,
          background: "var(--border)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: color || "var(--accent)",
            borderRadius: 999,
            transition: "width 400ms var(--ease)",
          }}
        />
      </div>
      {showValue && (
        <span
          className="t-mono"
          style={{ fontSize: 11, color: "var(--muted)", minWidth: 24, textAlign: "right" }}
        >
          {Math.round(pct)}
        </span>
      )}
    </div>
  );
}

// ─── FormDot — W/D/L indicator ────────────────────────────────
type FormDotProps = { result: "W" | "D" | "L" };
export function FormDot({ result }: FormDotProps) {
  const map = {
    W: { bg: "var(--emerald)", t: "G" },
    D: { bg: "var(--warn)", t: "B" },
    L: { bg: "var(--danger)", t: "M" },
  } as const;
  const m = map[result];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 18,
        height: 18,
        borderRadius: 4,
        background: `color-mix(in oklab, ${m.bg} 18%, transparent)`,
        color: m.bg,
        border: `1px solid color-mix(in oklab, ${m.bg} 40%, transparent)`,
        fontFamily: "var(--font-jetbrains)",
        fontWeight: 600,
        fontSize: 10,
        letterSpacing: 0,
      }}
    >
      {m.t}
    </span>
  );
}

// ─── RatingDot — 0-10 match rating ─────────────────────────────
type RatingDotProps = { rating: number; size?: number };
export function RatingDot({ rating, size = 28 }: RatingDotProps) {
  const color =
    rating >= 8 ? "var(--gold)" :
    rating >= 7 ? "var(--emerald)" :
    rating >= 6 ? "var(--cyan)" :
                  "var(--muted)";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: "50%",
        background: `color-mix(in oklab, ${color} 15%, transparent)`,
        border: `1px solid color-mix(in oklab, ${color} 40%, transparent)`,
        color,
        fontFamily: "var(--font-jetbrains)",
        fontWeight: 600,
        fontSize: size * 0.38,
      }}
    >
      {rating.toFixed(1)}
    </span>
  );
}

// ─── StatChip — icon + value + label ──────────────────────────
type StatChipProps = {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  accent?: string;
};
export function StatChip({ label, value, icon, accent }: StatChipProps) {
  return (
    <div
      className="glass"
      style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}
    >
      {icon && <span style={{ fontSize: 16, opacity: 0.9 }}>{icon}</span>}
      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <span
          className="t-mono"
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: accent || "var(--text)",
            lineHeight: 1,
          }}
        >
          {value}
        </span>
        <span className="t-label" style={{ fontSize: 10, lineHeight: 1 }}>
          {label}
        </span>
      </div>
    </div>
  );
}

// ─── ProgressRing — circular SVG progress ─────────────────────
type ProgressRingProps = { pct: number; size?: number; stroke?: number };
export function ProgressRing({ pct, size = 56, stroke = 4 }: ProgressRingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--border)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={stroke}
        strokeDasharray={c}
        strokeDashoffset={c - (pct / 100) * c}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        strokeLinecap="round"
      />
    </svg>
  );
}
