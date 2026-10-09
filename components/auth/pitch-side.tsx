"use client";

/**
 * The art panel beside the login and register forms.
 *
 * A pitch draws itself in, eleven players jog between three formations on
 * a loop, floodlight beams sweep the turf, and the headline rises line by
 * line. Purely decorative — hidden on phones by the auth layout.
 */
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { LogoLockup } from "@/components/brand/logo";
import "@/components/landing/landing.css";
import { SplitReveal } from "@/components/motion/reveal";

type P = [number, number];
const FORMATIONS: Array<{ name: string; pts: P[] }> = [
  {
    name: "4-3-3",
    pts: [[50, 90], [16, 72], [38, 76], [62, 76], [84, 72], [30, 52], [50, 56], [70, 52], [22, 30], [50, 22], [78, 30]],
  },
  {
    name: "4-2-3-1",
    pts: [[50, 90], [16, 72], [38, 76], [62, 76], [84, 72], [38, 60], [62, 60], [22, 40], [50, 40], [78, 40], [50, 20]],
  },
  {
    name: "3-5-2",
    pts: [[50, 90], [28, 74], [50, 78], [72, 74], [12, 52], [32, 56], [50, 60], [68, 56], [88, 52], [38, 24], [62, 24]],
  },
];
const ROLE = (i: number) => (i === 0 ? "var(--pos-gk)" : i < 5 ? "var(--pos-def)" : i < 8 ? "var(--pos-mid)" : "var(--pos-fwd)");

export function PitchPatternSide() {
  const reduce = useReducedMotion();
  const [f, setF] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const iv = setInterval(() => setF((x) => (x + 1) % FORMATIONS.length), 3200);
    return () => clearInterval(iv);
  }, [reduce]);
  const form = FORMATIONS[f];

  return (
    <div
      style={{
        position: "relative",
        height: "100%",
        minHeight: 520,
        background: `
          radial-gradient(700px 500px at 80% 20%, color-mix(in oklab, var(--indigo) 26%, transparent), transparent 60%),
          radial-gradient(600px 420px at 10% 90%, color-mix(in oklab, var(--emerald) 22%, transparent), transparent 60%),
          #050912`,
        overflow: "hidden",
        borderRadius: 22,
        border: "1px solid var(--border)",
        color: "#f4f5f7",
      }}
    >
      <div aria-hidden className="lp-beams" style={{ opacity: 0.8 }}>
        <span />
        <span />
      </div>
      <svg
        aria-hidden
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ position: "absolute", inset: "64px 28px 150px", width: "calc(100% - 56px)", height: "calc(100% - 214px)" }}
      >
        <g fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="0.35" vectorEffect="non-scaling-stroke">
          {[
            "M2 2 H98 V98 H2 Z",
            "M2 50 H98",
            "M30 2 V16 H70 V2",
            "M30 98 V84 H70 V98",
            "M42 2 V7 H58 V2",
            "M42 98 V93 H58 V98",
          ].map((d, i) => (
            <motion.path
              key={i}
              d={d}
              vectorEffect="non-scaling-stroke"
              initial={reduce ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.6, delay: 0.1 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
            />
          ))}
          <motion.ellipse
            cx="50"
            cy="50"
            rx="11"
            ry="8"
            vectorEffect="non-scaling-stroke"
            initial={reduce ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          />
        </g>
      </svg>
      <div style={{ position: "absolute", inset: "64px 28px 150px" }} aria-hidden>
        {form.pts.map(([x, y], i) => (
          <motion.span
            key={i}
            initial={reduce ? false : { opacity: 0, scale: 0 }}
            animate={{ left: `${x}%`, top: `${y}%`, opacity: 1, scale: 1 }}
            transition={{
              left: { duration: 1.1, ease: [0.65, 0, 0.35, 1], delay: i * 0.03 },
              top: { duration: 1.1, ease: [0.65, 0, 0.35, 1], delay: i * 0.03 },
              opacity: { duration: 0.5, delay: 0.8 + i * 0.05 },
              scale: { type: "spring", stiffness: 300, damping: 16, delay: 0.8 + i * 0.05 },
            }}
            style={{
              position: "absolute",
              width: 14,
              height: 14,
              marginLeft: -7,
              marginTop: -7,
              borderRadius: "50%",
              background: ROLE(i),
              border: "2px solid rgba(255,255,255,0.8)",
              boxShadow: `0 0 16px ${ROLE(i)}`,
            }}
          />
        ))}
      </div>
      <div style={{ position: "absolute", top: 24, left: 28, right: 28, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/" style={{ textDecoration: "none", display: "flex" }}>
          <LogoLockup size={22} color="#f4f5f7" />
        </Link>
        <motion.span
          key={form.name}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="t-mono"
          style={{
            fontSize: 11,
            letterSpacing: "0.14em",
            padding: "5px 10px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.18)",
            background: "rgba(0,0,0,0.35)",
          }}
        >
          DİZİLİŞ · <b style={{ color: "#facc15" }}>{form.name}</b>
        </motion.span>
      </div>
      <div style={{ position: "absolute", bottom: 28, left: 28, right: 28 }}>
        <h2 className="t-stadium" style={{ fontSize: "clamp(40px, 4.4vw, 64px)", margin: 0 }}>
          <SplitReveal text="Futbol yönetimine" delay={0.3} style={{ display: "block" }} />
          <SplitReveal
            text="yeni bir başlangıç."
            delay={0.45}
            style={{ display: "block", color: "#818cf8" }}
          />
        </h2>
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          style={{ marginTop: 10, color: "rgba(244,245,247,0.6)", fontSize: 13.5 }}
        >
          16 kişilik özel ligini kur, her akşam 21:00&apos;de maç oyna.
        </motion.div>
      </div>
    </div>
  );
}
