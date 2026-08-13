"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Re-renders the server component tree every `intervalMs` so other players'
 * actions (transfers, offers, match results, standings) become visible
 * without a manual refresh. Pauses when the tab is hidden — no point
 * re-rendering for a backgrounded user.
 *
 * Mounted on every page whose content another player can change. Only the
 * dashboard had it before, so a manager sat on /transfer or /standings could
 * be looking at minutes-old data with no indication anything had moved.
 */
export function LiveRefresh({
  intervalMs = 30_000,
}: {
  intervalMs?: number;
}) {
  const router = useRouter();
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (timer) return;
      timer = setInterval(() => router.refresh(), intervalMs);
    };
    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        router.refresh();
        start();
      } else {
        stop();
      }
    };
    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [router, intervalMs]);
  return null;
}

/** @deprecated Use `LiveRefresh` — the component is not dashboard-specific. */
export const DashboardAutoRefresh = LiveRefresh;
