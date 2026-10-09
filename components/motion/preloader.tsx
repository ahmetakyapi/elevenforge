"use client";

/**
 * Kick-off intro for the landing page.
 *
 * A pitch draws itself line by line while a counter runs to 100, the
 * wordmark rises letter by letter, and then the whole sheet lifts away like a
 * stadium curtain with an accent-coloured trailing panel behind it.
 *
 * It plays once per browser session. It is rendered on the server so it
 * covers the page from the very first paint; a blocking script in the root
 * layout stamps `data-intro-seen` on <html> when this session has already
 * seen it, and CSS hides it before anything is drawn — no flash either way.
 *
 * When it finishes it sets `data-intro-done` on <html> and fires
 * `ef:intro-done`, which the hero waits for before running its own entrance.
 */
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { EASE_IN_OUT, EASE_OUT_EXPO, useReduce } from "./reveal";

const KEY = "ef.intro";
const WORD = "ELEVENFORGE";

export function markIntroDone() {
  document.documentElement.setAttribute("data-intro-done", "");
  // Also the server-render guard: a client-side return to "/" would
  // otherwise paint the idle sheet for a frame before the effect hides it.
  document.documentElement.setAttribute("data-intro-seen", "");
  window.dispatchEvent(new Event("ef:intro-done"));
}

export function useIntroDone() {
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (document.documentElement.hasAttribute("data-intro-done")) {
      setDone(true);
      return;
    }
    const on = () => setDone(true);
    window.addEventListener("ef:intro-done", on);
    return () => window.removeEventListener("ef:intro-done", on);
  }, []);
  return done;
}

export function Preloader() {
  const reduce = useReduce();
  const [phase, setPhase] = useState<"idle" | "run" | "exit" | "gone">(() =>
    typeof document !== "undefined" && document.documentElement.hasAttribute("data-intro-done")
      ? "gone"
      : "idle",
  );
  const counter = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(KEY) === "1";
    } catch {}
    if (seen) {
      setPhase("gone");
      markIntroDone();
      return;
    }
    try {
      sessionStorage.setItem(KEY, "1");
    } catch {}
    document.body.style.overflow = "hidden";
    setPhase("run");

    const total = reduce ? 300 : 1400;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / total);
      // ease-in-out-quart: hesitates at the start, sprints, then settles on 100
      const e = t < 0.5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2;
      if (counter.current) counter.current.textContent = String(Math.round(e * 100)).padStart(3, "0");
      if (t < 1) raf = requestAnimationFrame(tick);
      else setPhase("exit");
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = "";
    };
  }, [reduce]);

  useEffect(() => {
    if (phase !== "exit") return;
    // The hero starts rising while the curtain is still lifting, so the two
    // movements overlap instead of playing one after the other.
    const t1 = window.setTimeout(() => {
      document.body.style.overflow = "";
      markIntroDone();
    }, reduce ? 0 : 450);
    const t2 = window.setTimeout(() => setPhase("gone"), reduce ? 250 : 1300);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [phase, reduce]);

  if (phase === "gone") return null;
  const exiting = phase === "exit";

  return (
    <div className="preloader" aria-hidden data-phase={phase}>
      {/* Without JavaScript the curtain would never lift. */}
      <noscript>
        <style>{`.preloader{display:none!important}`}</style>
      </noscript>
      {/* trailing accent panel */}
      <motion.div
        className="preloader-trail"
        initial={{ y: "0%" }}
        animate={exiting ? { y: "-100%" } : { y: "0%" }}
        transition={{ duration: 1.05, ease: EASE_IN_OUT, delay: 0.12 }}
      />
      <motion.div
        className="preloader-sheet"
        initial={{ y: "0%" }}
        animate={exiting ? { y: "-100%" } : { y: "0%" }}
        transition={{ duration: 0.95, ease: EASE_IN_OUT }}
      >
        <svg className="preloader-pitch" viewBox="0 0 1050 680" preserveAspectRatio="xMidYMid meet">
          <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {[
              "M25 25 H1025 V655 H25 Z",
              "M525 25 V655",
              "M25 190 H190 V490 H25",
              "M1025 190 H860 V490 H1025",
              "M25 268 H80 V412 H25",
              "M1025 268 H970 V412 H1025",
            ].map((d, i) => (
              <motion.path
                key={i}
                d={d}
                initial={{ pathLength: 0, opacity: 0.0 }}
                animate={phase !== "idle" ? { pathLength: 1, opacity: 1 } : {}}
                transition={{ duration: 1.3, ease: EASE_OUT_EXPO, delay: 0.1 + i * 0.12 }}
              />
            ))}
            <motion.circle
              cx="525"
              cy="340"
              r="92"
              initial={{ pathLength: 0 }}
              animate={phase !== "idle" ? { pathLength: 1 } : {}}
              transition={{ duration: 1.4, ease: EASE_OUT_EXPO, delay: 0.3 }}
            />
          </g>
          <motion.circle
            cx="525"
            cy="340"
            r="6"
            fill="var(--pre-accent)"
            initial={{ scale: 0 }}
            animate={phase !== "idle" ? { scale: [0, 1.6, 1] } : {}}
            transition={{ duration: 0.8, delay: 1.2 }}
          />
        </svg>

        <div className="preloader-word">
          {Array.from(WORD).map((c, i) => (
            <span key={i} className="preloader-mask">
              <motion.span
                style={{ display: "inline-block", color: i >= 6 ? "var(--pre-accent)" : undefined }}
                initial={{ y: "115%" }}
                animate={
                  exiting
                    ? { y: "-115%" }
                    : phase === "run"
                      ? { y: "0%" }
                      : { y: "115%" }
                }
                transition={
                  exiting
                    ? { duration: 0.6, ease: EASE_IN_OUT, delay: i * 0.018 }
                    : { duration: 0.8, ease: EASE_OUT_EXPO, delay: 0.2 + i * 0.035 }
                }
              >
                {c}
              </motion.span>
            </span>
          ))}
        </div>

        <div className="preloader-foot">
          <span className="preloader-count">
            <span ref={counter}>000</span>
          </span>
          <span className="preloader-caption">
            Sezon 3 · Kadrolar yükleniyor · 21:00 düdük
          </span>
        </div>
        <motion.div
          className="preloader-line"
          initial={{ scaleX: 0 }}
          animate={phase !== "idle" ? { scaleX: 1 } : {}}
          transition={{ duration: reduce ? 0.3 : 1.4, ease: [0.65, 0, 0.35, 1] }}
        />
      </motion.div>
    </div>
  );
}
