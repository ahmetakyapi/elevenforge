"use client";

import type { ReactNode } from "react";

type FieldProps = {
  label: string;
  children: ReactNode;
  hint?: string;
};
export function Field({ label, children, hint }: FieldProps) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span className="t-label">{label}</span>
      {children}
      {hint && (
        <span className="t-caption" style={{ fontSize: 11 }}>
          {hint}
        </span>
      )}
    </label>
  );
}

type SliderFieldProps = {
  label: string;
  value: string | number;
  min: number;
  max: number;
  cur: number;
  onChange: (n: number) => void;
  color: string;
};
export function SliderField({
  label,
  value,
  min,
  max,
  cur,
  onChange,
  color,
}: SliderFieldProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 6,
        }}
      >
        <span
          className="t-caption"
          style={{ fontSize: 10, whiteSpace: "nowrap" }}
        >
          {label}
        </span>
        <span
          className="t-mono"
          style={{ fontSize: 12, fontWeight: 700, color }}
        >
          {value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={cur}
        onChange={(e) => onChange(+e.target.value)}
        style={{ accentColor: color, width: "100%" }}
      />
    </div>
  );
}
