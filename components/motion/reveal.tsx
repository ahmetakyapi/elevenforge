"use client";

/**
 * The reveal vocabulary shared by the landing and auth surfaces.
 *
 * Every piece answers to `prefers-reduced-motion`: the content is rendered in
 * its final state and nothing moves. All entrance motion happens once, the
 * first time an element enters the viewport — re-animating on every scroll
 * pass reads as a gimmick by the third time.
 */
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import {
  Children,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";

export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
export const EASE_IN_OUT = [0.76, 0, 0.24, 1] as const;

// ─── SplitReveal ──────────────────────────────────────────
/**
 * Text that rises out of its own baseline, word by word or letter by letter.
 * Each unit sits in an overflow mask, so it appears to slide up from behind
 * an invisible edge rather than fading in place. The full string stays in an
 * aria-label so a screen reader hears one sentence, not forty fragments.
 */
export function SplitReveal({
  text,
  as = "span",
  by = "word",
  delay = 0,
  stagger,
  duration = 0.9,
  className,
  style,
  unitStyle,
  once = true,
  trigger,
}: {
  text: string;
  as?: ElementType;
  by?: "word" | "char";
  delay?: number;
  stagger?: number;
  duration?: number;
  className?: string;
  style?: CSSProperties;
  unitStyle?: (i: number, unit: string) => CSSProperties | undefined;
  once?: boolean;
  /** Drive from outside (e.g. after the preloader) instead of viewport entry. */
  trigger?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once, margin: "0px 0px -10% 0px" });
  const reduce = useReducedMotion();
  const show = trigger ?? inView;
  const Tag = as as ElementType;
  const words = text.split(" ");
  const step = stagger ?? (by === "char" ? 0.035 : 0.06);
  let idx = 0;

  return (
    <Tag ref={ref} className={className} style={style} aria-label={text}>
      {words.map((word, wi) => {
        const units = by === "char" ? Array.from(word) : [word];
        return (
          <span
            key={wi}
            aria-hidden
            style={{ display: "inline-block", whiteSpace: "nowrap" }}
          >
            {units.map((u) => {
              const i = idx++;
              return (
                <span
                  key={i}
                  style={{
                    display: "inline-block",
                    overflow: "hidden",
                    verticalAlign: "top",
                    // Room for Turkish diacritics (İ, Ü, Ğ, Ş, Ç) above and
                    // below the cap height — display lines run at ~0.86
                    // line-height, so a tight mask would shave them off.
                    padding: "0.2em 0.04em 0.1em",
                    margin: "-0.2em -0.04em -0.1em",
                  }}
                >
                  <motion.span
                    style={{ display: "inline-block", willChange: "transform", ...unitStyle?.(i, u) }}
                    initial={reduce ? false : { y: "130%", rotate: by === "char" ? 6 : 2 }}
                    animate={show || reduce ? { y: "0%", rotate: 0 } : { y: "130%", rotate: by === "char" ? 6 : 2 }}
                    transition={{ duration, ease: EASE_OUT_EXPO, delay: delay + i * step }}
                  >
                    {u}
                  </motion.span>
                </span>
              );
            })}
            {wi < words.length - 1 ? " " : null}
          </span>
        );
      })}
    </Tag>
  );
}

// ─── Reveal ───────────────────────────────────────────────
/** Fade, rise and un-blur. With `stagger`, each direct child takes its turn. */
export function Reveal({
  children,
  delay = 0,
  y = 28,
  blur = 8,
  stagger,
  duration = 1,
  className,
  style,
  as = "div",
  amount = 0.2,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  blur?: number;
  stagger?: number;
  duration?: number;
  className?: string;
  style?: CSSProperties;
  as?: "div" | "section" | "li" | "ul" | "span";
  amount?: number;
}) {
  const reduce = useReducedMotion();
  const M = motion[as] as typeof motion.div;
  const hidden = { opacity: 0, y, filter: `blur(${blur}px)` };
  const shown = { opacity: 1, y: 0, filter: "blur(0px)" };
  if (stagger !== undefined) {
    return (
      <M
        className={className}
        style={style}
        initial={reduce ? false : "hidden"}
        whileInView="shown"
        viewport={{ once: true, amount }}
        variants={{ hidden: {}, shown: { transition: { staggerChildren: stagger, delayChildren: delay } } }}
      >
        {Children.map(children, (c, i) =>
          isValidElement(c) ? (
            <motion.div
              key={i}
              style={{ minWidth: 0 }}
              variants={{
                hidden,
                shown: { ...shown, transition: { duration, ease: EASE_OUT_EXPO } },
              }}
            >
              {c}
            </motion.div>
          ) : (
            c
          ),
        )}
      </M>
    );
  }
  return (
    <M
      className={className}
      style={style}
      initial={reduce ? false : hidden}
      whileInView={shown}
      viewport={{ once: true, amount }}
      transition={{ duration, ease: EASE_OUT_EXPO, delay }}
    >
      {children}
    </M>
  );
}

// ─── CountUp ──────────────────────────────────────────────
export function CountUp({
  to,
  from = 0,
  duration = 2,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
  style,
}: {
  to: number;
  from?: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  const reduce = useReducedMotion();
  const fmt = (n: number) =>
    prefix +
    n.toLocaleString("tr-TR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) +
    suffix;

  useEffect(() => {
    const el = ref.current;
    if (!el || !inView) return;
    if (reduce) {
      el.textContent = fmt(to);
      return;
    }
    const c = animate(from, to, {
      duration,
      ease: EASE_OUT_EXPO,
      onUpdate: (v) => (el.textContent = fmt(v)),
    });
    return () => c.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, reduce, to, from, duration]);

  return (
    <span ref={ref} className={className} style={style}>
      {fmt(reduce ? to : from)}
    </span>
  );
}

// ─── Magnetic ─────────────────────────────────────────────
/** Pulls its child toward the pointer while hovered, then springs home. */
export function Magnetic({
  children,
  strength = 0.35,
  className,
  style,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.6 });
  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ display: "inline-flex", x: sx, y: sy, ...style }}
      onPointerMove={(e) => {
        if (reduce || e.pointerType !== "mouse" || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * strength);
        y.set((e.clientY - (r.top + r.height / 2)) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

// ─── ScrubText ────────────────────────────────────────────
/**
 * A paragraph that lights up word by word as it scrolls through the
 * viewport. Words in `accent` light up in the accent colour instead of the
 * text colour.
 */
export function ScrubText({
  text,
  accent = [],
  className,
  style,
}: {
  text: string;
  accent?: string[];
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 45%"] });
  const words = text.split(" ");
  return (
    <p ref={ref} className={className} style={style}>
      {words.map((w, i) => (
        <ScrubWord
          key={i}
          progress={scrollYProgress}
          range={[i / words.length, (i + 1) / words.length]}
          accent={accent.includes(w.replace(/[.,!?]/g, ""))}
          reduce={!!reduce}
        >
          {w}
        </ScrubWord>
      ))}
    </p>
  );
}

function ScrubWord({
  children,
  progress,
  range,
  accent,
  reduce,
}: {
  children: string;
  progress: MotionValue<number>;
  range: [number, number];
  accent: boolean;
  reduce: boolean;
}) {
  const opacity = useTransform(progress, range, [0.14, 1]);
  const y = useTransform(progress, range, [6, 0]);
  return (
    <span style={{ display: "inline-block", marginRight: "0.26em" }}>
      <motion.span
        style={{
          display: "inline-block",
          opacity: reduce ? 1 : opacity,
          y: reduce ? 0 : y,
          color: accent ? "var(--accent)" : undefined,
          fontFamily: accent ? "var(--font-editorial)" : undefined,
          fontStyle: accent ? "italic" : undefined,
          fontWeight: accent ? 400 : undefined,
        }}
      >
        {children}
      </motion.span>
    </span>
  );
}

// ─── Parallax ─────────────────────────────────────────────
export function Parallax({
  children,
  speed = 0.2,
  className,
  style,
}: {
  children: ReactNode;
  speed?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [`${speed * 100}%`, `${-speed * 100}%`]);
  return (
    <motion.div ref={ref} className={className} style={{ ...style, y: reduce ? 0 : y }}>
      {children}
    </motion.div>
  );
}

// ─── useMounted ───────────────────────────────────────────
export function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}
