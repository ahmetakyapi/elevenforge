"use client";

import { useEffect, useState } from "react";

/**
 * Live ticking "X hours Y minutes" pill until the next fixture.
 * Kept client-side so `Date.now()` doesn't fire during server render
 * (would mismatch hydration + warn under React 19 strict).
 */
export function NextMatchCountdown({
  scheduledAtMs,
}: {
  scheduledAtMs: number;
}) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  if (now === null) return null;
  const seconds = Math.max(0, Math.floor((scheduledAtMs - now) / 1000));
  if (seconds <= 0) return null;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return (
    <div className="chip chip-success" style={{ marginTop: 8 }}>
      <span className="t-mono" style={{ fontSize: 12, fontWeight: 700 }}>
        ⏱ {hours}s {minutes}dk
      </span>
    </div>
  );
}
