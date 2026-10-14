"use client";

import { useEffect, useState } from "react";
import { Timer } from "lucide-react";
import { durationTr } from "@/lib/time-words";

/**
 * Live "2 gün 23 saat" pill until the next fixture. It printed "71s 28dk",
 * where "s" read as seconds rather than hours.
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
  return (
    <div className="chip chip-success" style={{ marginTop: 8 }}>
      <Timer size={13} strokeWidth={1.8} aria-hidden />
      <span style={{ fontSize: 12.5, fontWeight: 600 }}>
        {durationTr(seconds)} kaldı
      </span>
    </div>
  );
}
