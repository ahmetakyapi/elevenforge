"use client";

/**
 * Site-wide motion that has no single owner.
 *
 * Mounted once in the root layout, so it survives every navigation:
 *
 *   - Spotlight: the cursor carries a soft light across glass cards. One
 *     pointermove listener writes `--mx/--my` onto whichever `.glass` is under
 *     the pointer; the glow itself is pure CSS (`.glass::before`). No React
 *     state, no per-card listeners.
 *   - Route progress: a hairline across the top of the viewport that starts
 *     the instant an internal link is clicked and completes when the new path
 *     renders — the server components behind each route can take a moment.
 *   - Grain: a fixed film-grain layer that keeps the large dark fields from
 *     looking like flat digital black.
 */
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { Cursor } from "./cursor";

function useSpotlight() {
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    let last: HTMLElement | null = null;
    let raf = 0;
    let ev: PointerEvent | null = null;
    const flush = () => {
      raf = 0;
      if (!ev) return;
      const target = (ev.target as Element | null)?.closest?.(".glass, [data-spotlight]") as HTMLElement | null;
      if (last && last !== target) last.removeAttribute("data-lit");
      last = target;
      if (!target) return;
      const r = target.getBoundingClientRect();
      target.style.setProperty("--mx", `${ev.clientX - r.left}px`);
      target.style.setProperty("--my", `${ev.clientY - r.top}px`);
      target.setAttribute("data-lit", "");
    };
    const onMove = (e: PointerEvent) => {
      ev = e;
      if (!raf) raf = requestAnimationFrame(flush);
    };
    const onLeave = () => {
      last?.removeAttribute("data-lit");
      last = null;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);
}

function RouteProgressInner() {
  const pathname = usePathname();
  const search = useSearchParams();
  const bar = useRef<HTMLDivElement>(null);
  const timer = useRef<number | null>(null);

  // Start on click of any same-origin link that leads somewhere else.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
      const el = bar.current;
      if (!el) return;
      el.dataset.state = "loading";
      if (timer.current) window.clearTimeout(timer.current);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // Complete when the route actually changes.
  useEffect(() => {
    const el = bar.current;
    if (!el || el.dataset.state !== "loading") return;
    el.dataset.state = "done";
    timer.current = window.setTimeout(() => {
      el.dataset.state = "idle";
    }, 520);
  }, [pathname, search]);

  return <div ref={bar} className="route-progress" data-state="idle" aria-hidden />;
}

export function MotionLayer() {
  useSpotlight();
  return (
    <>
      <Suspense fallback={null}>
        <RouteProgressInner />
      </Suspense>
      <div className="grain" aria-hidden />
      <Cursor />
    </>
  );
}
