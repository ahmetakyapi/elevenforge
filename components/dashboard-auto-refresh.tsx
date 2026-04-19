"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Polls the dashboard server component every `intervalMs` so other players'
 * actions (transfers, tactics, match-day completion, chat) become visible
 * without a manual refresh. Pauses when the tab is hidden — no point
 * re-rendering for a backgrounded user.
 */
export function DashboardAutoRefresh({
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
