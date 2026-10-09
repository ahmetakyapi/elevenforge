"use client";

/**
 * Scroll-driven set pieces for the landing page.
 *
 * Each one turns scroll position into a timeline rather than just fading
 * blocks in: the live card tilts up out of the pitch, the marquee leans with
 * the speed you scroll at, a whole matchday pans sideways while the section
 * stays pinned, and the footer wordmark climbs out of the floor.
 */
import Link from "next/link";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  type MotionValue,
} from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowUpRight, Clock, Dumbbell, Newspaper, Repeat2, Target, Trophy } from "lucide-react";
import { CountUp, EASE_OUT_EXPO, Magnetic, ScrubText, SplitReveal } from "@/components/motion/reveal";

// ─── Scroll progress ──────────────────────────────────────
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.4 });
  return (
    <motion.div
      aria-hidden
      style={{
        scaleX,
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        transformOrigin: "0 50%",
        zIndex: 120,
        background: "linear-gradient(90deg, var(--accent), var(--accent-2), var(--cyan))",
      }}
    />
  );
}

// ─── Section head ─────────────────────────────────────────
export function SectionHead({
  index,
  kicker,
  title,
  muted,
  color = "var(--accent)",
  align = "left",
}: {
  index: string;
  kicker: string;
  title: string;
  muted?: string;
  color?: string;
  align?: "left" | "center";
}) {
  return (
    <div style={{ textAlign: align }}>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          fontFamily: "var(--font-jetbrains)",
          fontSize: 11,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color,
        }}
      >
        <span style={{ width: 28, height: 1, background: "currentColor", opacity: 0.6 }} />
        {index} — {kicker}
      </div>
      <h2 className="t-stadium lp-h2" style={{ margin: "14px 0 0" }}>
        <SplitReveal text={title} by="word" style={{ display: "block" }} />
        {muted && (
          <SplitReveal
            text={muted}
            by="word"
            delay={0.12}
            style={{ display: "block", color: "var(--muted)" }}
          />
        )}
      </h2>
    </div>
  );
}

// ─── Card stage ───────────────────────────────────────────
/**
 * The live match card rises out of the hero like a screen tilting up toward
 * you: perspective rotate + scale scrubbed by scroll, with a floodlight glow
 * that intensifies as it settles.
 */
export function CardStage({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const rotateX = useTransform(scrollYProgress, [0, 1], [38, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.78, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [80, 0]);
  const glow = useTransform(scrollYProgress, [0.3, 1], [0, 1]);
  return (
    <section
      ref={ref}
      style={{ position: "relative", padding: "0 24px 60px", perspective: 1400, marginTop: -40 }}
    >
      <motion.div
        aria-hidden
        style={{
          opacity: reduce ? 1 : glow,
          position: "absolute",
          left: "50%",
          top: "40%",
          width: "min(1100px, 90vw)",
          height: 420,
          translateX: "-50%",
          background:
            "radial-gradient(closest-side, color-mix(in oklab, var(--accent) 34%, transparent), transparent)",
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />
      <motion.div
        style={{
          maxWidth: 1000,
          margin: "0 auto",
          rotateX: reduce ? 0 : rotateX,
          scale: reduce ? 1 : scale,
          y: reduce ? 0 : y,
          transformOrigin: "50% 100%",
        }}
      >
        {children}
      </motion.div>
    </section>
  );
}

// ─── Velocity marquee ─────────────────────────────────────
function wrap(min: number, max: number, v: number) {
  const r = max - min;
  return ((((v - min) % r) + r) % r) + min;
}

function VelocityRow({
  children,
  baseVelocity,
  skew,
  velocityFactor,
}: {
  children: ReactNode;
  baseVelocity: number;
  skew: MotionValue<number>;
  velocityFactor: MotionValue<number>;
}) {
  const reduce = useReducedMotion();
  const baseX = useMotionValue(0);
  const x = useTransform(baseX, (v) => `${wrap(-25, 0, v)}%`);
  const dir = useRef(1);
  useAnimationFrame((_, delta) => {
    if (reduce) return;
    let move = dir.current * baseVelocity * (delta / 1000);
    const vf = velocityFactor.get();
    if (vf < 0) dir.current = -1;
    else if (vf > 0) dir.current = 1;
    move += dir.current * move * vf;
    baseX.set(baseX.get() + move);
  });
  return (
    <div style={{ overflow: "hidden", whiteSpace: "nowrap", display: "flex" }}>
      <motion.div style={{ x, skewX: reduce ? 0 : skew, display: "flex", flexWrap: "nowrap" }}>
        {[0, 1, 2, 3].map((k) => (
          <span key={k} style={{ display: "flex", flexShrink: 0 }}>
            {children}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

export function VelocityMarquee({ words }: { words: string[] }) {
  const { scrollY } = useScroll();
  const v = useVelocity(scrollY);
  const smooth = useSpring(v, { damping: 50, stiffness: 400 });
  const velocityFactor = useTransform(smooth, [-1000, 0, 1000], [-4, 0, 4], { clamp: false });
  const skew = useTransform(smooth, [-2000, 0, 2000], [8, 0, -8]);
  const item = (w: string, i: number, outline: boolean) => (
    <span
      key={`${w}-${i}`}
      className="t-stadium"
      style={{
        fontSize: "clamp(56px, 9vw, 150px)",
        padding: "0 0.25em",
        display: "inline-flex",
        alignItems: "center",
        gap: "0.35em",
        color: outline ? "transparent" : "var(--text)",
        WebkitTextStroke: outline ? "1.5px color-mix(in oklab, var(--text) 40%, transparent)" : undefined,
      }}
    >
      {w}
      <span
        aria-hidden
        style={{
          width: "0.22em",
          height: "0.22em",
          borderRadius: "50%",
          background: i % 2 ? "var(--accent-2)" : "var(--accent)",
          boxShadow: `0 0 24px ${i % 2 ? "var(--accent-2)" : "var(--accent)"}`,
        }}
      />
    </span>
  );
  return (
    <div
      aria-hidden
      style={{
        padding: "56px 0",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        overflow: "hidden",
        background: "color-mix(in oklab, var(--bg) 60%, var(--panel))",
      }}
    >
      <VelocityRow baseVelocity={-2.2} skew={skew} velocityFactor={velocityFactor}>
        {words.map((w, i) => item(w, i, i % 2 === 1))}
      </VelocityRow>
      <VelocityRow baseVelocity={2.2} skew={skew} velocityFactor={velocityFactor}>
        {[...words].reverse().map((w, i) => item(w, i, i % 2 === 0))}
      </VelocityRow>
    </div>
  );
}

// ─── Manifesto ────────────────────────────────────────────
export function Manifesto() {
  return (
    <section
      data-lp-section
      style={{ padding: "160px 32px 120px", maxWidth: 1240, margin: "0 auto", position: "relative" }}
    >
      <div
        style={{
          fontFamily: "var(--font-jetbrains)",
          fontSize: 11,
          letterSpacing: "0.16em",
          color: "var(--muted)",
          marginBottom: 28,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--accent)" }} />
        MANİFESTO
      </div>
      <ScrubText
        className="lp-manifesto"
        text="Futbol menajerliği tek başına oynanmaz. Arkadaşlarınla aynı ligde, aynı pazarda, aynı gece 21:00'de sahaya çıkarsın. Her transfer bir hamle, her derbi bir hikâye, her sezon bir efsane."
        accent={["Arkadaşlarınla", "21:00'de", "hikâye", "efsane"]}
      />
    </section>
  );
}

// ─── Matchday rail (pinned horizontal scroll) ─────────────
const MATCHDAY = [
  {
    t: "09:00",
    k: "Antrenman",
    Icon: Dumbbell,
    color: "var(--cyan)",
    h: "Sabah idmanı",
    d: "Dört pozisyon slotu, genç gelişimi, form eğrisi. Her sabah kadronun yarını şekillenir.",
    stat: ["+1", "OVR · 19 yaş"],
  },
  {
    t: "13:30",
    k: "Transfer",
    Icon: Repeat2,
    color: "var(--emerald)",
    h: "Pazar açık",
    d: "Arkadaşının listelediği forvet saat başı ucuzluyor. Otomatik teklif kur, gerisini bekle.",
    stat: ["€42M", "→ €37.8M"],
  },
  {
    t: "18:00",
    k: "Taktik",
    Icon: Target,
    color: "var(--warn)",
    h: "Kadro kilitlenir",
    d: "Diziliş, pres, tempo. Casus raporu geldi: rakip 3-5-2 oynayacak.",
    stat: ["4-3-3", "yüksek pres"],
  },
  {
    t: "21:00",
    k: "Düdük",
    Icon: Clock,
    color: "var(--danger)",
    h: "Bütün lig aynı anda",
    d: "Ligdeki bütün maçlar aynı saniyede simüle edilir. Canlı anlatım dakika dakika akar.",
    stat: ["2–1", "74' CANLI"],
  },
  {
    t: "23:30",
    k: "Gazete",
    Icon: Newspaper,
    color: "var(--gold)",
    h: "Manşet senin",
    d: "Gecenin hikâyesi gazeteye düşer. Derbi kazandıysan kapak seni yazar.",
    stat: ["ARDA", "UÇURDU"],
  },
  {
    t: "Sezon sonu",
    k: "Kupa",
    Icon: Trophy,
    color: "var(--accent)",
    h: "Efsane yazılır",
    d: "3 düşer, 3 çıkar. Şampiyonluk, kupa, rozetler — ve grupta bitmeyen tartışma.",
    stat: ["€30M", "şampiyonluk"],
  },
];

export function MatchdayRail() {
  const ref = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [distance, setDistance] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], [0, -distance]);
  const sx = useSpring(x, { stiffness: 120, damping: 28, mass: 0.5 });
  const bar = useTransform(scrollYProgress, [0, 1], [0, 1]);

  useEffect(() => {
    const measure = () => {
      if (!track.current) return;
      setDistance(Math.max(0, track.current.scrollWidth - window.innerWidth + 48));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (track.current) ro.observe(track.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <section
      ref={ref}
      className="lp-rail"
      style={{ height: reduce ? "auto" : `calc(100vh + ${distance}px)`, position: "relative" }}
    >
      <div className="lp-rail-sticky">
        <div style={{ padding: "0 32px", maxWidth: 1400, margin: "0 auto", width: "100%" }}>
          <SectionHead index="02" kicker="Bir maç günü" title="Sabahtan düdüğe" muted="tek bir gün." color="var(--cyan)" />
        </div>
        <motion.div ref={track} className="lp-rail-track" style={{ x: reduce ? 0 : sx }}>
          {MATCHDAY.map((m, i) => (
            <article key={m.t} className="glass lp-rail-card" data-cursor="Sürükle">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span
                  className="t-stadium"
                  style={{ fontSize: "clamp(40px, 5vw, 64px)", color: m.color, lineHeight: 0.9 }}
                >
                  {m.t}
                </span>
                <span
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 14,
                    display: "grid",
                    placeItems: "center",
                    color: m.color,
                    background: `color-mix(in oklab, ${m.color} 14%, transparent)`,
                    border: `1px solid color-mix(in oklab, ${m.color} 35%, transparent)`,
                  }}
                >
                  <m.Icon size={20} strokeWidth={1.7} />
                </span>
              </div>
              <div style={{ marginTop: "auto" }}>
                <div className="t-label" style={{ color: m.color }}>
                  {String(i + 1).padStart(2, "0")} · {m.k}
                </div>
                <h3 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", margin: "8px 0 10px" }}>
                  {m.h}
                </h3>
                <p style={{ color: "var(--text-2)", fontSize: 14.5, lineHeight: 1.6, margin: 0 }}>{m.d}</p>
                <div
                  style={{
                    marginTop: 20,
                    paddingTop: 16,
                    borderTop: "1px dashed var(--border-strong)",
                    display: "flex",
                    alignItems: "baseline",
                    gap: 10,
                  }}
                >
                  <span className="t-mono" style={{ fontSize: 22, fontWeight: 700 }}>
                    {m.stat[0]}
                  </span>
                  <span className="t-mono" style={{ fontSize: 12, color: "var(--muted)" }}>
                    {m.stat[1]}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </motion.div>
        <div style={{ padding: "0 32px", maxWidth: 1400, margin: "0 auto", width: "100%" }}>
          <div style={{ height: 2, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
            <motion.div
              style={{
                scaleX: bar,
                transformOrigin: "0 50%",
                height: "100%",
                background: "linear-gradient(90deg, var(--cyan), var(--accent), var(--gold))",
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Numbers band ─────────────────────────────────────────
export function NumbersBand() {
  const items = [
    { n: 36, l: "kulüp", s: "iki kademe" },
    { n: 918, l: "gerçek oyuncu", s: "2025-26 kadroları" },
    { n: 612, l: "fikstür", s: "her sezon" },
    { n: 21, l: "düdük saati", s: ":00 — her gece", suffix: "" },
  ];
  return (
    <section data-lp-section style={{ padding: "100px 32px", maxWidth: 1400, margin: "0 auto" }}>
      <div className="lp-numbers">
        {items.map((it, i) => (
          <motion.div
            key={it.l}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 1, ease: EASE_OUT_EXPO, delay: i * 0.08 }}
            className="lp-number"
          >
            <CountUp
              to={it.n}
              duration={2.2}
              className="t-stadium"
              style={{
                fontSize: "clamp(72px, 10vw, 160px)",
                display: "block",
                backgroundImage: "linear-gradient(180deg, var(--text) 30%, color-mix(in oklab, var(--text) 20%, transparent))",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            />
            <div style={{ fontWeight: 700, fontSize: 16, marginTop: 6 }}>{it.l}</div>
            <div className="t-mono" style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
              {it.s}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ─── Closing CTA ──────────────────────────────────────────
export function KickoffCTA() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const x1 = useTransform(scrollYProgress, [0, 1], ["8%", "-18%"]);
  const x2 = useTransform(scrollYProgress, [0, 1], ["-18%", "8%"]);
  return (
    <section
      ref={ref}
      data-lp-section
      style={{ padding: "140px 0 120px", position: "relative", overflow: "hidden" }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(700px 420px at 50% 55%, color-mix(in oklab, var(--accent) 22%, transparent), transparent 65%)",
          pointerEvents: "none",
        }}
      />
      <div className="t-stadium" style={{ fontSize: "clamp(80px, 17vw, 300px)", position: "relative" }}>
        <motion.div style={{ x: reduce ? 0 : x1, whiteSpace: "nowrap" }}>
          SAHAYA <span className="t-serif" style={{ textTransform: "none", color: "var(--accent)", fontSize: "0.8em" }}>sen</span> ÇIK
        </motion.div>
        <motion.div
          style={{
            x: reduce ? 0 : x2,
            whiteSpace: "nowrap",
            color: "transparent",
            WebkitTextStroke: "2px color-mix(in oklab, var(--text) 35%, transparent)",
          }}
        >
          LİGİNİ KUR · LİGİNİ KUR
        </motion.div>
      </div>
      <div
        style={{
          position: "relative",
          display: "flex",
          justifyContent: "center",
          marginTop: -60,
        }}
      >
        <Magnetic strength={0.4}>
          <Link href="/register" className="lp-kickoff" data-cursor="Başla">
            <span className="lp-kickoff-fill" />
            <span style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <ArrowUpRight size={30} strokeWidth={1.6} />
              <span>Ligini kur</span>
            </span>
          </Link>
        </Magnetic>
      </div>
      <p
        style={{
          position: "relative",
          textAlign: "center",
          color: "var(--text-2)",
          maxWidth: 520,
          margin: "34px auto 0",
          padding: "0 24px",
          fontSize: 16,
          lineHeight: 1.6,
        }}
      >
        5 dakikada ligin hazır. İlk sezon sonunda hâlâ sevmiyorsan silebilirsin — ama silmeyeceksin.
      </p>
    </section>
  );
}

// ─── Footer wordmark ──────────────────────────────────────
export function FooterWordmark() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const letters = Array.from("ELEVENFORGE");
  return (
    <div
      ref={ref}
      aria-hidden
      className="t-stadium"
      style={{
        fontSize: "clamp(64px, 17.4vw, 330px)",
        lineHeight: 0.78,
        display: "flex",
        justifyContent: "center",
        overflow: "hidden",
        paddingTop: 40,
        userSelect: "none",
      }}
    >
      {letters.map((c, i) => (
        <FooterLetter key={i} c={c} i={i} n={letters.length} progress={scrollYProgress} reduce={!!reduce} />
      ))}
    </div>
  );
}

function FooterLetter({
  c,
  i,
  n,
  progress,
  reduce,
}: {
  c: string;
  i: number;
  n: number;
  progress: MotionValue<number>;
  reduce: boolean;
}) {
  const start = (i / n) * 0.45;
  const y = useTransform(progress, [start, start + 0.55], ["100%", "0%"]);
  return (
    <motion.span
      style={{
        display: "inline-block",
        y: reduce ? 0 : y,
        backgroundImage:
          i >= 6
            ? "linear-gradient(180deg, var(--accent) 0%, color-mix(in oklab, var(--accent-2) 70%, transparent) 100%)"
            : "linear-gradient(180deg, var(--text) 0%, color-mix(in oklab, var(--text) 15%, transparent) 100%)",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
      }}
    >
      {c}
    </motion.span>
  );
}
