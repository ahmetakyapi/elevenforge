"use client";

import { Fragment, useEffect, useState } from "react";

export function useCountdown(targetSeconds: number) {
  const [s, setS] = useState(targetSeconds);
  useEffect(() => {
    const i = setInterval(() => setS((p) => Math.max(0, p - 1)), 1000);
    return () => clearInterval(i);
  }, []);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad = (x: number) => String(x).padStart(2, "0");
  return {
    d,
    h,
    m,
    s: ss,
    str: `${pad(d)}:${pad(h)}:${pad(m)}:${pad(ss)}`,
    total: s,
  };
}

type CountdownProps = {
  seconds?: number;
  size?: number;
  labels?: boolean;
};
export function Countdown({
  seconds = 14 * 3600 + 23 * 60 + 7,
  size = 48,
  labels = true,
}: CountdownProps) {
  const { d, h, m, s, total } = useCountdown(seconds);
  const pad = (x: number) => String(x).padStart(2, "0");
  const urgent = total < 3600;
  const color = urgent ? "var(--warn)" : "var(--text)";
  const parts = [
    { v: pad(d), l: "GÜN" },
    { v: pad(h), l: "SAAT" },
    { v: pad(m), l: "DK" },
    { v: pad(s), l: "SN" },
  ];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 10,
        animation: urgent ? "pulse-accent 1.5s ease-in-out infinite" : "none",
      }}
    >
      {parts.map((p, i) => (
        <Fragment key={p.l}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span
              className="t-mono"
              style={{
                fontSize: size,
                fontWeight: 600,
                color,
                lineHeight: 0.9,
                letterSpacing: "-0.02em",
              }}
            >
              {p.v}
            </span>
            {labels && (
              <span className="t-label" style={{ fontSize: 10 }}>
                {p.l}
              </span>
            )}
          </div>
          {i < parts.length - 1 && (
            <span
              className="t-mono"
              style={{
                fontSize: size * 0.7,
                color: "var(--muted-2)",
                lineHeight: 0.9,
                paddingBottom: labels ? 14 : 0,
              }}
            >
              :
            </span>
          )}
        </Fragment>
      ))}
    </div>
  );
}
