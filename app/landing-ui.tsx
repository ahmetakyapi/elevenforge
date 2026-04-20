"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ArrowRight, Play, Plus } from "lucide-react";
import { Crest } from "@/components/ui/primitives";
import { LogoLockup } from "@/components/brand/logo";
import { CLUBS, COMMENTARY, GLOBAL_TRANSFERS, clubById } from "@/lib/mock-data";
import { fmtEUR } from "@/lib/utils";

// Top-nav + footer product targets. Each label scrolls to the matching
// section on the landing page (sections expose these IDs below).
const NAV_TARGETS = [
  { label: "Platform", href: "#platform" },
  { label: "Canlı Maç", href: "#canli-mac" },
  { label: "Gazete", href: "#gazete" },
  { label: "Akış", href: "#akis" },
] as const;

// ─── Hooks ────────────────────────────────────────────────
function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setOn(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && setOn(true),
      { threshold },
    );
    io.observe(ref.current);
    const t = setTimeout(() => setOn(true), 2000);
    return () => {
      io.disconnect();
      clearTimeout(t);
    };
  }, [threshold]);
  return [ref, on] as const;
}

function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setY(window.scrollY));
    };
    window.addEventListener("scroll", on, { passive: true });
    return () => {
      window.removeEventListener("scroll", on);
      cancelAnimationFrame(raf);
    };
  }, []);
  return y;
}

function useMouse() {
  const [p, setP] = useState({ x: 0.5, y: 0.5 });
  useEffect(() => {
    const on = (e: MouseEvent) =>
      setP({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    window.addEventListener("mousemove", on);
    return () => window.removeEventListener("mousemove", on);
  }, []);
  return p;
}

// ─── Main ─────────────────────────────────────────────────
export default function LandingUi() {
  const y = useScrollY();
  return (
    <div style={{ position: "relative", overflow: "hidden", background: "var(--bg)" }}>
      <LandingNav />
      <Hero y={y} />
      <MarqueeBand />
      <CrewSection />
      <StadiumSection />
      <MarketSection />
      <TacticSection />
      <NewspaperStack />
      <TestimonialWall />
      <FaqBlock />
      <ClosingCTA />
      <LandingFooter />
      <style>{`
        /* ─── Mobile responsiveness ─────────────────────────────────
           Landing was designed desktop-first with hardcoded multi-col
           grids; on phones they squashed unreadably. These rules collapse
           every multi-col split to a single column under 760px and shrink
           the most aggressive padding values. */
        @media (max-width: 760px) {
          [data-lp-grid="2"], [data-lp-grid="3"], [data-lp-grid="4"] {
            grid-template-columns: 1fr !important;
          }
          [data-lp-grid="3-marquee"] {
            grid-template-columns: 1fr !important;
            text-align: center;
          }
          [data-lp-section] {
            padding-left: 18px !important;
            padding-right: 18px !important;
            padding-top: 60px !important;
            padding-bottom: 60px !important;
          }
          [data-lp-hero-title] { font-size: clamp(46px, 14vw, 96px) !important; }
          [data-lp-h2] { font-size: clamp(28px, 7vw, 44px) !important; }
          [data-lp-card] { padding: 18px !important; }
          [data-lp-stack-mobile] {
            display: flex !important;
            flex-direction: column !important;
            gap: 14px !important;
          }
          [data-lp-hide-mobile] { display: none !important; }
          [data-lp-nav] { padding: 12px 14px !important; }
          [data-lp-nav-links] { display: none !important; }
          [data-lp-orbit] {
            max-width: min(100%, 340px) !important;
            margin-top: 8px !important;
          }
        }
        @keyframes scroll-hint { 0%{opacity:0;transform:translateY(0);} 40%{opacity:1;} 100%{opacity:0;transform:translateY(10px);} }
        @keyframes formSwap { 0%{opacity:0;transform:translateY(-4px);} 100%{opacity:1;transform:translateY(0);} }
        @keyframes posGlow { 0%,100%{opacity:0.4;transform:scale(1);} 50%{opacity:0.8;transform:scale(1.2);} }
        @keyframes dragPulse { 0%,100%{filter:drop-shadow(0 0 0 transparent);transform:translateX(0);} 50%{filter:drop-shadow(0 6px 18px color-mix(in oklab, var(--warn) 40%, transparent));transform:translateX(4px);} }
        @keyframes foldBreathe { 0%,100%{opacity:0.6;} 50%{opacity:1;} }
        @keyframes headlineType { 0%{clip-path:inset(0 100% 0 0);} 100%{clip-path:inset(0 0 0 0);} }
        @keyframes dragPath {
          0%{left:30%;top:50%;transform:translate(-50%,-50%) scale(1);opacity:0;}
          8%{opacity:1;transform:translate(-50%,-50%) scale(1.15);}
          15%{left:30%;top:50%;transform:translate(-50%,-50%) scale(1.1);}
          55%{left:50%;top:20%;transform:translate(-50%,-50%) scale(1.1);}
          62%{left:50%;top:20%;transform:translate(-50%,-50%) scale(1.4);opacity:1;}
          70%{left:50%;top:20%;transform:translate(-50%,-50%) scale(1);opacity:1;}
          100%{left:50%;top:20%;transform:translate(-50%,-50%) scale(1);opacity:0;}
        }
      `}</style>
    </div>
  );
}

// ─── Nav ──────────────────────────────────────────────────
function LandingNav() {
  const y = useScrollY();
  const solid = y > 40;
  return (
    <nav
      data-lp-nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        padding: solid ? "10px 28px" : "18px 28px",
        transition: "all 300ms var(--ease)",
        background: solid
          ? "color-mix(in oklab, var(--bg) 78%, transparent)"
          : "transparent",
        backdropFilter: solid ? "blur(24px) saturate(140%)" : "none",
        WebkitBackdropFilter: solid ? "blur(24px) saturate(140%)" : "none",
        borderBottom: solid ? "1px solid var(--border)" : "1px solid transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Link href="/" style={{ textDecoration: "none", display: "flex" }}>
        <LogoLockup size={22} icon="anvil" />
      </Link>
      <div data-lp-nav-links className="desktop-only" style={{ display: "flex", gap: 4 }}>
        {NAV_TARGETS.map(({ label, href }) => (
          <a
            key={label}
            href={href}
            className="btn btn-ghost btn-sm"
            style={{ textDecoration: "none" }}
          >
            {label}
          </a>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <Link
          href="/login"
          className="btn btn-ghost btn-sm"
          style={{ textDecoration: "none" }}
        >
          Giriş
        </Link>
        <Link
          href="/register"
          className="btn btn-primary btn-sm"
          style={{ textDecoration: "none" }}
        >
          Başla <ArrowRight size={14} strokeWidth={1.8} />
        </Link>
      </div>
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────
function Hero({ y }: { y: number }) {
  const m = useMouse();
  const parallax = (d: number) =>
    `translate3d(${(m.x - 0.5) * d}px, ${(m.y - 0.5) * d}px, 0)`;
  return (
    <section
      style={{
        position: "relative",
        minHeight: "100vh",
        paddingTop: 120,
        paddingBottom: 80,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden
        className="hero-stadium"
        style={{
          position: "absolute",
          inset: 0,
          opacity: Math.max(0, 1 - y / 800),
          pointerEvents: "none",
        }}
      >
        <StadiumBackdrop mouse={m} scrollY={y} />
      </div>
      <div
        aria-hidden
        className="hero-light-veil"
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      />
      <style>{`
        [data-theme="light"] .hero-stadium { opacity: 0.18 !important; filter: saturate(0.55) brightness(1.6); }
        [data-theme="light"] .hero-light-veil {
          background: radial-gradient(ellipse at 50% 0%, color-mix(in oklab, var(--bg) 0%, transparent) 0%, color-mix(in oklab, var(--bg) 70%, transparent) 55%, var(--bg) 100%);
        }
        :root:not([data-theme="light"]) .hero-light-veil { display: none; }
      `}</style>
      <div
        aria-hidden
        style={{ position: "absolute", inset: 0, pointerEvents: "none", transform: parallax(20) }}
      >
        <div
          style={{
            position: "absolute",
            top: "10%",
            left: "-10%",
            width: 700,
            height: 700,
            borderRadius: "50%",
            background:
              "radial-gradient(circle at center, color-mix(in oklab, var(--indigo) 30%, transparent) 0%, transparent 60%)",
            filter: "blur(10px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-10%",
            right: "-10%",
            width: 800,
            height: 800,
            borderRadius: "50%",
            background:
              "radial-gradient(circle at center, color-mix(in oklab, var(--emerald) 24%, transparent) 0%, transparent 60%)",
            filter: "blur(10px)",
          }}
        />
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 3,
          maxWidth: 1400,
          margin: "0 auto",
          padding: "0 32px",
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr)",
          justifyItems: "center",
          transform: `translateY(${y * -0.1}px)`,
          transition: "transform 0.1s linear",
        }}
      >
        <div className="anim-slide-up" style={{ animationDelay: "50ms" }}>
          <div
            className="chip"
            style={{
              padding: "8px 14px",
              background: "color-mix(in oklab, var(--emerald) 10%, var(--panel-2))",
              borderColor: "color-mix(in oklab, var(--emerald) 30%, var(--border))",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--emerald)",
                boxShadow: "0 0 8px var(--emerald)",
                animation: "pulse-accent 2s ease-in-out infinite",
              }}
            />
            <span
              className="t-mono"
              style={{
                fontSize: 11,
                letterSpacing: "0.08em",
                color: "var(--emerald)",
              }}
            >
              SEZON 3 · 1.248 AKTİF LİG
            </span>
          </div>
        </div>
        <h1
          className="anim-slide-up t-display"
          style={{
            margin: "22px 0 0",
            fontSize: "clamp(64px, 12vw, 184px)",
            letterSpacing: "-0.05em",
            lineHeight: 0.86,
            textAlign: "center",
            animationDelay: "120ms",
            padding: "0 24px",
          }}
        >
          <span
            style={{
              background:
                "linear-gradient(180deg, var(--text) 0%, color-mix(in oklab, var(--text) 50%, transparent) 120%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              display: "inline-block",
            }}
          >
            ELEVEN
          </span>
          <span
            style={{
              backgroundImage: "linear-gradient(100deg, #818cf8 0%, #10b981 50%, #22d3ee 100%)",
              backgroundSize: "200% 100%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              animation: "shimmer 6s linear infinite",
              display: "inline-block",
            }}
          >
            FORGE
          </span>
        </h1>
        <div
          className="anim-slide-up"
          style={{
            marginTop: 20,
            textAlign: "center",
            maxWidth: 680,
            animationDelay: "220ms",
          }}
        >
          <p
            style={{
              fontSize: "clamp(20px, 2.4vw, 28px)",
              fontWeight: 600,
              color: "var(--text-2)",
              margin: 0,
              letterSpacing: "-0.01em",
              lineHeight: 1.25,
            }}
          >
            <span style={{ color: "var(--text)" }}>16 arkadaş.</span>{" "}
            <span style={{ color: "var(--indigo)" }}>1 lig.</span>{" "}
            <span style={{ color: "var(--emerald)" }}>1 efsane.</span>
          </p>
          <p
            style={{
              fontSize: 15,
              color: "var(--muted)",
              marginTop: 16,
              lineHeight: 1.65,
            }}
          >
            Her akşam 21:00&apos;de maçlar simule olur, canlı maç anlatımı saniye
            saniye gelişmeleri aktarır.
            <br />
            Derbilerinde{" "}
            <em
              style={{
                color: "var(--text-2)",
                fontStyle: "normal",
                borderBottom: "1px dashed var(--border-strong)",
              }}
            >
              kulübünün tarihini
            </em>{" "}
            hatırlatır.
          </p>
        </div>
        <div
          className="anim-slide-up"
          style={{
            marginTop: 30,
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            justifyContent: "center",
            animationDelay: "320ms",
          }}
        >
          <Link
            href="/register"
            className="btn btn-primary btn-lg"
            style={{
              padding: "14px 26px",
              fontSize: 15,
              textDecoration: "none",
            }}
          >
            Ligini Kur <ArrowRight size={16} strokeWidth={1.8} />
          </Link>
          <Link
            href="/login"
            className="btn btn-lg"
            style={{ padding: "14px 26px", textDecoration: "none" }}
          >
            <Play size={14} strokeWidth={1.8} /> Demo&apos;yu Gez
          </Link>
        </div>
        <div
          className="anim-slide-up"
          style={{
            marginTop: 26,
            display: "flex",
            gap: 20,
            color: "var(--muted)",
            fontSize: 12,
            animationDelay: "420ms",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <span>⚡ 5 dakikada lig</span>
          <span style={{ opacity: 0.4 }}>—</span>
          <span>🏟 Canlı maç anlatımı</span>
          <span style={{ opacity: 0.4 }}>—</span>
          <span>🇹🇷 Türkçe · İngilizce</span>
        </div>

        <div
          className="anim-slide-up"
          style={{
            marginTop: 70,
            width: "100%",
            maxWidth: 980,
            animationDelay: "600ms",
          }}
        >
          <HeroLiveCard />
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 22,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          color: "var(--muted)",
          opacity: Math.max(0, 1 - y / 200),
        }}
      >
        <span className="t-label" style={{ fontSize: 10 }}>
          KAYDIR
        </span>
        <div
          style={{
            width: 22,
            height: 34,
            borderRadius: 12,
            border: "1px solid var(--border-strong)",
            display: "flex",
            justifyContent: "center",
            paddingTop: 6,
          }}
        >
          <span
            style={{
              width: 2,
              height: 6,
              borderRadius: 2,
              background: "var(--muted)",
              animation: "scroll-hint 1.6s ease-in-out infinite",
            }}
          />
        </div>
      </div>
    </section>
  );
}

function StadiumBackdrop({
  mouse,
  scrollY,
}: {
  mouse: { x: number; y: number };
  scrollY: number;
}) {
  const tiltX = (mouse.x - 0.5) * 8;
  const tiltY = (mouse.y - 0.5) * 4;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        perspective: 1400,
        perspectiveOrigin: "50% 20%",
        background:
          "linear-gradient(180deg, transparent 0%, transparent 40%, color-mix(in oklab, var(--bg) 60%, transparent) 80%, var(--bg) 100%)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `rotateX(${62 + tiltY}deg) rotateZ(${tiltX}deg) translateY(${scrollY * 0.25}px)`,
          transformStyle: "preserve-3d",
          transition: "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <svg
          viewBox="0 0 1600 900"
          preserveAspectRatio="xMidYMax slice"
          style={{
            width: "100%",
            height: "120%",
            position: "absolute",
            bottom: "-10%",
          }}
        >
          <defs>
            <linearGradient id="pitch-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0a3e24" stopOpacity="0.0" />
              <stop offset="40%" stopColor="#0a3e24" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#051a10" stopOpacity="0.65" />
            </linearGradient>
            <linearGradient id="line-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.55" />
            </linearGradient>
            <pattern id="grass" width="80" height="80" patternUnits="userSpaceOnUse">
              <rect width="80" height="80" fill="url(#pitch-grad)" />
              <rect x="0" y="0" width="40" height="80" fill="#10b981" fillOpacity="0.02" />
            </pattern>
          </defs>
          <rect width="1600" height="900" fill="url(#grass)" />
          <g stroke="url(#line-grad)" strokeWidth="2" fill="none">
            <rect x="100" y="80" width="1400" height="760" />
            <line x1="800" y1="80" x2="800" y2="840" />
            <circle cx="800" cy="460" r="150" />
            <circle cx="800" cy="460" r="4" fill="url(#line-grad)" />
            <rect x="100" y="260" width="220" height="400" />
            <rect x="1280" y="260" width="220" height="400" />
            <rect x="100" y="340" width="80" height="240" />
            <rect x="1420" y="340" width="80" height="240" />
          </g>
          <rect x="0" y="0" width="1600" height="900" fill="url(#line-grad)" opacity="0.05">
            <animate
              attributeName="opacity"
              values="0.03;0.12;0.03"
              dur="6s"
              repeatCount="indefinite"
            />
          </rect>
        </svg>
      </div>
    </div>
  );
}

function HeroLiveCard() {
  const [idx, setIdx] = useState(0);
  const feed = [
    { m: 74, text: "ARDA! 21 yaşındaki 10 numara — köşeye bıraktı.", type: "goal" },
    { m: 72, text: "Kerem soldan içeri döndü, direğin dibinden auta.", type: "shot" },
    { m: 68, text: "Hakan'ın pası Arda'yı tamamen boşa çıkardı.", type: "analysis" },
  ];
  useEffect(() => {
    const iv = setInterval(() => setIdx((i) => (i + 1) % feed.length), 2600);
    return () => clearInterval(iv);
  }, [feed.length]);
  return (
    <div
      className="glass"
      style={{
        padding: 0,
        overflow: "hidden",
        borderRadius: 20,
        background: "color-mix(in oklab, var(--bg-2) 90%, transparent)",
        border: "1px solid var(--border-strong)",
        boxShadow:
          "var(--shadow-lg), 0 0 0 1px color-mix(in oklab, var(--accent) 12%, transparent)",
      }}
    >
      <div
        data-lp-grid="3-marquee"
        style={{
          padding: "18px 22px",
          display: "grid",
          gridTemplateColumns: "1fr 220px 1fr",
          alignItems: "center",
          gap: 16,
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Crest clubId="ist" size={40} />
          <div>
            <div style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: 15 }}>
              İstanbul Şehir FK
            </div>
            <span className="t-caption" style={{ fontSize: 11 }}>
              Ev · %58 topla oynama
            </span>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span
              className="t-mono"
              style={{ fontSize: 42, fontWeight: 700, letterSpacing: "-0.03em" }}
            >
              2
            </span>
            <span style={{ fontSize: 18, color: "var(--muted)" }}>−</span>
            <span
              className="t-mono"
              style={{ fontSize: 42, fontWeight: 700, letterSpacing: "-0.03em" }}
            >
              1
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--emerald)",
                animation: "pulse-accent 1.5s ease-in-out infinite",
              }}
            />
            <span
              className="t-mono"
              style={{
                fontSize: 11,
                color: "var(--emerald)",
                letterSpacing: "0.1em",
              }}
            >
              74&apos; CANLI
            </span>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            justifyContent: "flex-end",
          }}
        >
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: 15 }}>
              Ankara Kale
            </div>
            <span className="t-caption" style={{ fontSize: 11 }}>
              Dep · %42 topla oynama
            </span>
          </div>
          <Crest clubId="ank" size={40} />
        </div>
      </div>
      <div
        style={{
          padding: "14px 22px",
          display: "flex",
          gap: 12,
          alignItems: "center",
          minHeight: 64,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "linear-gradient(135deg, var(--indigo), var(--emerald))",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          AI
        </div>
        <div key={idx} className="anim-slide-up" style={{ flex: 1 }}>
          <span
            className="t-label"
            style={{
              fontSize: 10,
              color: feed[idx].type === "goal" ? "var(--emerald)" : "var(--muted)",
            }}
          >
            {feed[idx].m}&apos; ·{" "}
            {feed[idx].type === "goal"
              ? "GOL"
              : feed[idx].type === "shot"
                ? "ŞUT"
                : "ANALİZ"}
          </span>
          <div
            style={{
              fontSize: 14,
              color: "var(--text)",
              marginTop: 3,
              lineHeight: 1.5,
            }}
          >
            {feed[idx].text}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Marquee ──────────────────────────────────────────────
function MarqueeBand() {
  const words = [
    "SÜPER LİG",
    "PREMIER LEAGUE",
    "LA LIGA",
    "SERIE A",
    "BUNDESLIGA",
    "LIGUE 1",
    "EREDIVISIE",
    "ŞAMPİYONLAR LİGİ",
    "AVRUPA LİGİ",
    "PRIMEIRA LIGA",
    "MLS",
  ];
  const items = [...words, ...words, ...words];
  return (
    <div
      style={{
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
        padding: "20px 0",
        overflow: "hidden",
        background: "color-mix(in oklab, var(--bg) 50%, var(--panel))",
        margin: "80px 0",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 60,
          whiteSpace: "nowrap",
          animation: "marquee 90s linear infinite",
          width: "max-content",
        }}
      >
        {items.map((w, i) => (
          <span
            key={i}
            style={{
              fontFamily: "var(--font-manrope)",
              fontWeight: 800,
              fontSize: "clamp(32px, 5vw, 68px)",
              letterSpacing: "-0.03em",
              display: "inline-flex",
              alignItems: "center",
              gap: 40,
              color:
                i % 3 === 0
                  ? "var(--text)"
                  : "color-mix(in oklab, var(--text) 25%, transparent)",
            }}
          >
            {w}
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: i % 3 === 0 ? "var(--emerald)" : "var(--indigo)",
                display: "inline-block",
              }}
            />
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Crew ─────────────────────────────────────────────────
function CrewSection() {
  const [ref, on] = useReveal();
  const y = useScrollY();
  return (
    <section
      ref={ref}
      id="platform"
      data-lp-section
      style={{ padding: "120px 32px", maxWidth: 1400, margin: "0 auto", scrollMarginTop: 80 }}
    >
      <div
        data-lp-grid="2"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.1fr",
          gap: 80,
          alignItems: "center",
        }}
      >
        <div
          style={{
            opacity: on ? 1 : 0,
            transform: on ? "translateY(0)" : "translateY(40px)",
            transition: "all 700ms var(--ease)",
          }}
        >
          <span className="t-label" style={{ color: "var(--indigo)" }}>
            01 / AKIŞ
          </span>
          <h2
            className="t-h1"
            style={{
              fontSize: "clamp(40px, 5vw, 64px)",
              letterSpacing: "-0.03em",
              marginTop: 12,
              lineHeight: 1.05,
            }}
          >
            16 kişiye kadar
            <br />
            <span style={{ color: "var(--muted)" }}>tek bir kulüp hikayesi.</span>
          </h2>
          <p
            style={{
              color: "var(--text-2)",
              fontSize: 16,
              lineHeight: 1.7,
              marginTop: 20,
              maxWidth: 500,
            }}
          >
            Davet linkiyle ligini kur. Boş kalan slotları bot takımlar doldurur.
            Her üye farklı şehri yönetir, ligde 16 takım kıyasıya rekabet eder.
          </p>
          <div style={{ display: "flex", gap: 18, marginTop: 26 }}>
            {[
              ["16", "takım"],
              ["10", "kişi + 6 bot"],
              ["7", "preset"],
            ].map(([v, l]) => (
              <div key={l}>
                <div
                  className="t-mono"
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color: "var(--text)",
                  }}
                >
                  {v}
                </div>
                <div className="t-label" style={{ fontSize: 11 }}>
                  {l}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div
          data-lp-orbit
          style={{
            position: "relative",
            aspectRatio: "1/1",
            width: "100%",
            maxWidth: 540,
            margin: "0 auto",
            opacity: on ? 1 : 0,
            transform: on ? "scale(1)" : "scale(0.9)",
            transition: "all 900ms var(--ease)",
          }}
        >
          <OrbitRing clubs={CLUBS.slice(0, 8)} sizePct={88} crestSize={40} duration={40} y={y} />
          <OrbitRing clubs={CLUBS.slice(8, 16)} sizePct={56} crestSize={32} duration={24} reverse y={y} />
          <div
            data-lp-orbit-core
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%,-50%)",
              width: "22%",
              height: "22%",
              minWidth: 72,
              minHeight: 72,
              maxWidth: 110,
              maxHeight: 110,
              borderRadius: "50%",
              background:
                "linear-gradient(135deg, color-mix(in oklab, var(--indigo) 80%, transparent), color-mix(in oklab, var(--emerald) 80%, transparent))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow:
                "0 0 80px color-mix(in oklab, var(--indigo) 50%, transparent)",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-manrope)",
                fontWeight: 800,
                fontSize: "clamp(22px, 6vw, 36px)",
                color: "#fff",
                letterSpacing: "-0.03em",
              }}
            >
              11
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function OrbitRing({
  clubs,
  sizePct,
  crestSize,
  duration,
  reverse,
  y,
}: {
  clubs: typeof CLUBS;
  sizePct: number;
  crestSize: number;
  duration: number;
  reverse?: boolean;
  y: number;
}) {
  const spin = y * 0.2 * (reverse ? -1 : 1);
  const inset = `${(100 - sizePct) / 2}%`;
  return (
    <div
      style={{
        position: "absolute",
        top: inset,
        left: inset,
        right: inset,
        bottom: inset,
        borderRadius: "50%",
        border: "1px dashed color-mix(in oklab, var(--text) 10%, transparent)",
        animation: `spin ${duration}s linear infinite ${reverse ? "reverse" : ""}`,
        transform: `rotate(${spin}deg)`,
      }}
    >
      {clubs.map((c, i) => {
        const angle = (i / clubs.length) * Math.PI * 2;
        const cx = Math.cos(angle) * 50;
        const cy = Math.sin(angle) * 50;
        return (
          <div
            key={c.id}
            style={{
              position: "absolute",
              top: `${50 + cy}%`,
              left: `${50 + cx}%`,
              transform: `translate(-50%,-50%) rotate(${-spin}deg)`,
            }}
          >
            <Crest clubId={c.id} size={crestSize} />
          </div>
        );
      })}
    </div>
  );
}

// ─── Stadium ──────────────────────────────────────────────
function StadiumSection() {
  const [ref, on] = useReveal();
  return (
    <section
      ref={ref}
      id="canli-mac"
      data-lp-section style={{ padding: "120px 32px", position: "relative", overflow: "hidden", scrollMarginTop: 80 }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(900px 600px at 50% 100%, color-mix(in oklab, var(--indigo) 12%, transparent), transparent 60%)",
          pointerEvents: "none",
        }}
      />
      <div style={{ maxWidth: 1300, margin: "0 auto", position: "relative" }}>
        <div
          style={{
            textAlign: "center",
            marginBottom: 50,
            opacity: on ? 1 : 0,
            transform: on ? "translateY(0)" : "translateY(30px)",
            transition: "all 700ms var(--ease)",
          }}
        >
          <span className="t-label" style={{ color: "var(--emerald)" }}>
            02 / CANLI MAÇ
          </span>
          <h2
            className="t-h1"
            style={{
              fontSize: "clamp(40px, 5vw, 64px)",
              letterSpacing: "-0.03em",
              marginTop: 12,
              lineHeight: 1.12,
              paddingBottom: 8,
            }}
          >
            Canlı maç anlatımı,
            <br />
            <span
              style={{
                fontStyle: "italic",
                fontWeight: 500,
                background: "linear-gradient(100deg, var(--emerald), var(--cyan))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                paddingRight: 4,
                paddingBottom: 4,
                display: "inline-block",
                lineHeight: 1.15,
              }}
            >
              maçları
            </span>{" "}
            saniye saniye yayınlar.
          </h2>
          <p
            style={{
              color: "var(--text-2)",
              fontSize: 16,
              marginTop: 16,
              maxWidth: 620,
              margin: "16px auto 0",
            }}
          >
            Her vuruş, her değişiklik, her kart — anlık anlatım. &ldquo;Neden
            kaybettim?&rdquo; butonuyla motor kararlarını açıklar.
          </p>
        </div>
        <div
          data-lp-grid="2"
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr",
            gap: 24,
            alignItems: "center",
            opacity: on ? 1 : 0,
            transform: on ? "translateY(0)" : "translateY(40px)",
            transition: "all 900ms 150ms var(--ease)",
          }}
        >
          <HeroLiveCard />
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {COMMENTARY.slice(0, 4).map((c, i) => (
              <div
                key={i}
                className="glass"
                style={{
                  padding: "14px 16px",
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  animationDelay: `${200 + i * 100}ms`,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background:
                      c.type === "goal"
                        ? "color-mix(in oklab, var(--emerald) 18%, transparent)"
                        : "var(--panel-2)",
                    color: c.type === "goal" ? "var(--emerald)" : "var(--text)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    fontSize: 15,
                  }}
                >
                  {c.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                      marginBottom: 3,
                    }}
                  >
                    <span
                      className="t-mono"
                      style={{ fontSize: 11, color: "var(--muted)" }}
                    >
                      {c.m}&apos;
                    </span>
                    <span
                      className="t-label"
                      style={{
                        fontSize: 10,
                        color:
                          c.type === "goal" ? "var(--emerald)" : "var(--muted)",
                      }}
                    >
                      {c.type === "goal"
                        ? "GOL"
                        : c.type === "shot"
                          ? "ŞUT"
                          : c.type === "card"
                            ? "KART"
                            : "ANALİZ"}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--text-2)",
                      lineHeight: 1.5,
                    }}
                  >
                    {c.text}
                  </div>
                </div>
              </div>
            ))}
            <Link
              href="/login"
              className="btn btn-ghost btn-sm"
              style={{
                alignSelf: "flex-start",
                marginTop: 6,
                textDecoration: "none",
              }}
            >
              Canlı maçı aç <ArrowRight size={13} strokeWidth={1.8} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Market ───────────────────────────────────────────────
function MarketSection() {
  const [ref, on] = useReveal();
  return (
    <section ref={ref} id="akis" data-lp-section style={{ padding: "120px 0 120px", position: "relative", scrollMarginTop: 80 }}>
      <div
        style={{
          maxWidth: 1300,
          margin: "0 auto",
          padding: "0 32px",
          marginBottom: 50,
          opacity: on ? 1 : 0,
          transform: on ? "translateY(0)" : "translateY(30px)",
          transition: "all 700ms var(--ease)",
        }}
      >
        <span className="t-label" style={{ color: "var(--cyan)" }}>
          03 / PAYLAŞILAN EVREN
        </span>
        <h2
          className="t-h1"
          style={{
            fontSize: "clamp(40px, 5vw, 64px)",
            letterSpacing: "-0.03em",
            marginTop: 12,
            lineHeight: 1.05,
          }}
        >
          Arkadaşının transferi,
          <br />
          <span style={{ color: "var(--muted)" }}>senin akışında.</span>
        </h2>
      </div>
      <div
        style={{
          position: "relative",
          padding: "40px 0",
          background:
            "linear-gradient(180deg, transparent, color-mix(in oklab, var(--panel) 140%, transparent), transparent)",
        }}
      >
        <TickerRow speed={56} />
        <TickerRow speed={72} reverse />
        <TickerRow speed={88} />
      </div>
      <div style={{ textAlign: "center", marginTop: 30 }}>
        <Link
          href="/login"
          className="btn btn-sm"
          style={{ textDecoration: "none" }}
        >
          Pazara bak <ArrowRight size={13} strokeWidth={1.8} />
        </Link>
      </div>
    </section>
  );
}

function TickerRow({ speed = 60, reverse }: { speed?: number; reverse?: boolean }) {
  const list = [...GLOBAL_TRANSFERS, ...GLOBAL_TRANSFERS, ...GLOBAL_TRANSFERS];
  return (
    <div
      style={{
        overflow: "hidden",
        padding: "10px 0",
        maskImage:
          "linear-gradient(90deg, transparent, black 10%, black 90%, transparent)",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 14,
          whiteSpace: "nowrap",
          animation: `marquee ${speed}s linear infinite ${reverse ? "reverse" : ""}`,
          width: "max-content",
        }}
      >
        {list.map((t, i) => (
          <div
            key={i}
            className="glass"
            style={{
              padding: "10px 18px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              borderRadius: 999,
              background:
                i % 5 === 0
                  ? "color-mix(in oklab, var(--accent) 8%, var(--panel))"
                  : "var(--panel)",
              borderColor:
                i % 5 === 0
                  ? "color-mix(in oklab, var(--accent) 24%, var(--border))"
                  : "var(--border)",
            }}
          >
            <Crest clubId={t.buyerClub} size={22} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>{t.buyer}</span>
            <ArrowRight size={12} strokeWidth={1.8} />
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-2)",
              }}
            >
              {t.player}
            </span>
            <span
              className="t-mono"
              style={{ fontSize: 13, fontWeight: 600, color: "var(--emerald)" }}
            >
              {fmtEUR(t.price)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tactic ───────────────────────────────────────────────
const TACTIC_FORMS = ["4-3-3", "4-2-3-1", "3-5-2", "5-3-2"] as const;
type TForm = (typeof TACTIC_FORMS)[number];
const TACTIC_POSITIONS: Record<
  TForm,
  Array<{ x: number; y: number; r: string; n: number }>
> = {
  "4-3-3": [
    { x: 50, y: 88, r: "GK", n: 1 }, { x: 18, y: 70, r: "LB", n: 3 }, { x: 38, y: 74, r: "CB", n: 4 }, { x: 62, y: 74, r: "CB", n: 5 }, { x: 82, y: 70, r: "RB", n: 2 },
    { x: 30, y: 50, r: "LM", n: 8 }, { x: 50, y: 55, r: "CM", n: 6 }, { x: 70, y: 50, r: "RM", n: 10 },
    { x: 22, y: 28, r: "LW", n: 11 }, { x: 50, y: 20, r: "ST", n: 9 }, { x: 78, y: 28, r: "RW", n: 7 },
  ],
  "4-2-3-1": [
    { x: 50, y: 88, r: "GK", n: 1 }, { x: 18, y: 70, r: "LB", n: 3 }, { x: 38, y: 74, r: "CB", n: 4 }, { x: 62, y: 74, r: "CB", n: 5 }, { x: 82, y: 70, r: "RB", n: 2 },
    { x: 36, y: 58, r: "DM", n: 6 }, { x: 64, y: 58, r: "DM", n: 8 },
    { x: 22, y: 38, r: "LW", n: 11 }, { x: 50, y: 40, r: "AM", n: 10 }, { x: 78, y: 38, r: "RW", n: 7 }, { x: 50, y: 18, r: "ST", n: 9 },
  ],
  "3-5-2": [
    { x: 50, y: 88, r: "GK", n: 1 }, { x: 28, y: 72, r: "CB", n: 3 }, { x: 50, y: 76, r: "CB", n: 4 }, { x: 72, y: 72, r: "CB", n: 5 },
    { x: 14, y: 54, r: "LM", n: 11 }, { x: 34, y: 56, r: "CM", n: 8 }, { x: 50, y: 60, r: "CM", n: 6 }, { x: 66, y: 56, r: "CM", n: 10 }, { x: 86, y: 54, r: "RM", n: 7 },
    { x: 38, y: 22, r: "ST", n: 9 }, { x: 62, y: 22, r: "ST", n: 19 },
  ],
  "5-3-2": [
    { x: 50, y: 88, r: "GK", n: 1 }, { x: 12, y: 66, r: "LB", n: 3 }, { x: 30, y: 74, r: "CB", n: 4 }, { x: 50, y: 78, r: "CB", n: 5 }, { x: 70, y: 74, r: "CB", n: 15 }, { x: 88, y: 66, r: "RB", n: 2 },
    { x: 30, y: 50, r: "LM", n: 8 }, { x: 50, y: 54, r: "CM", n: 6 }, { x: 70, y: 50, r: "RM", n: 10 },
    { x: 38, y: 22, r: "ST", n: 9 }, { x: 62, y: 22, r: "ST", n: 19 },
  ],
};

function TacticSection() {
  const [ref, on] = useReveal();
  const [form, setForm] = useState<TForm>("4-3-3");
  useEffect(() => {
    const iv = setInterval(
      () =>
        setForm((f) => {
          const i = TACTIC_FORMS.indexOf(f);
          return TACTIC_FORMS[(i + 1) % TACTIC_FORMS.length];
        }),
      3800,
    );
    return () => clearInterval(iv);
  }, []);
  const roleColor = (r: string): string => {
    if (r === "GK") return "#f59e0b";
    if (["LB", "CB", "RB"].includes(r)) return "#3b82f6";
    if (["DM", "CM", "AM", "LM", "RM"].includes(r)) return "#10b981";
    return "#ef4444";
  };
  return (
    <section
      ref={ref}
      data-lp-section
      style={{ padding: "120px 32px", maxWidth: 1400, margin: "0 auto" }}
    >
      <div
        data-lp-grid="2"
        style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 1fr",
          gap: 80,
          alignItems: "center",
        }}
      >
        <div
          style={{
            position: "relative",
            aspectRatio: "5/7",
            width: "100%",
            maxWidth: 520,
            minHeight: 540,
            margin: "0 auto",
            opacity: on ? 1 : 0,
            transform: on ? "translateX(0)" : "translateX(-40px)",
            transition: "all 800ms var(--ease)",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 16,
              overflow: "hidden",
              background: "linear-gradient(180deg, #0d4a2b 0%, #062014 100%)",
              border: "1px solid var(--border-strong)",
              boxShadow:
                "0 30px 80px -30px color-mix(in oklab, var(--warn) 40%, transparent), var(--shadow-lg)",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                opacity: 0.25,
                backgroundImage:
                  "repeating-linear-gradient(0deg, rgba(255,255,255,0.08) 0 8%, transparent 8% 16%)",
              }}
            />
            <svg
              viewBox="0 0 600 800"
              preserveAspectRatio="none"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                opacity: 0.6,
              }}
            >
              <g stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" fill="none">
                <rect x="20" y="20" width="560" height="760" />
                <line x1="20" y1="400" x2="580" y2="400" />
                <circle cx="300" cy="400" r="70" />
                <circle cx="300" cy="400" r="3" fill="rgba(255,255,255,0.35)" />
                <rect x="140" y="20" width="320" height="150" />
                <rect x="220" y="20" width="160" height="60" />
                <rect x="140" y="630" width="320" height="150" />
                <rect x="220" y="720" width="160" height="60" />
                <path d="M 220 170 Q 300 220 380 170" />
                <path d="M 220 630 Q 300 580 380 630" />
              </g>
            </svg>

            <div
              style={{
                position: "absolute",
                top: 16,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 4,
                padding: "6px 18px",
                borderRadius: 999,
                background: "color-mix(in oklab, #000 60%, transparent)",
                border: "1px solid rgba(255,255,255,0.2)",
                backdropFilter: "blur(8px)",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-jetbrains)",
                  fontWeight: 700,
                  fontSize: 12,
                  color: "#fff",
                  letterSpacing: "0.12em",
                }}
              >
                DİZİLİŞ ·{" "}
              </span>
              <span
                key={form}
                style={{
                  fontFamily: "var(--font-jetbrains)",
                  fontWeight: 800,
                  fontSize: 14,
                  color: "var(--warn)",
                  letterSpacing: "0.04em",
                  animation: "formSwap 500ms var(--ease)",
                }}
              >
                {form}
              </span>
            </div>

            {TACTIC_POSITIONS[form].map((p, i) => {
              const color = roleColor(p.r);
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: `${p.x}%`,
                    top: `${p.y}%`,
                    transform: "translate(-50%,-50%)",
                    transition:
                      "left 900ms cubic-bezier(0.65, 0, 0.35, 1), top 900ms cubic-bezier(0.65, 0, 0.35, 1)",
                    zIndex: 3,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: -6,
                      borderRadius: "50%",
                      background: `radial-gradient(circle, ${color}66, transparent 70%)`,
                      animation: "posGlow 2.4s ease-in-out infinite",
                      animationDelay: `${i * 90}ms`,
                    }}
                  />
                  <div
                    style={{
                      position: "relative",
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${color}, color-mix(in oklab, ${color} 30%, #051a10))`,
                      border: "2px solid rgba(255,255,255,0.5)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontFamily: "var(--font-jetbrains)",
                      fontWeight: 800,
                      fontSize: 13,
                      boxShadow: `0 4px 16px ${color}99`,
                    }}
                  >
                    {p.n}
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 4px)",
                      left: "50%",
                      transform: "translateX(-50%)",
                      padding: "2px 7px",
                      borderRadius: 10,
                      background: "rgba(0,0,0,0.75)",
                      border: `1px solid ${color}`,
                      color: color,
                      fontFamily: "var(--font-jetbrains)",
                      fontWeight: 700,
                      fontSize: 9,
                      letterSpacing: "0.06em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {p.r}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div
          style={{
            opacity: on ? 1 : 0,
            transform: on ? "translateX(0)" : "translateX(40px)",
            transition: "all 800ms 100ms var(--ease)",
          }}
        >
          <span className="t-label" style={{ color: "var(--warn)" }}>
            04 / TAKTİK
          </span>
          <h2
            className="t-h1"
            style={{
              fontSize: "clamp(40px, 5vw, 64px)",
              letterSpacing: "-0.03em",
              marginTop: 12,
              lineHeight: 1.05,
            }}
          >
            <span
              style={{
                display: "inline-block",
                background: "linear-gradient(100deg, var(--warn), var(--accent))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                animation: "dragPulse 2.4s var(--ease) infinite",
              }}
            >
              Sürükle, bırak,
            </span>
            <br />
            <span style={{ color: "var(--muted)" }}>ligi yönet.</span>
          </h2>
          <p
            style={{
              color: "var(--text-2)",
              fontSize: 16,
              lineHeight: 1.7,
              marginTop: 20,
              maxWidth: 500,
            }}
          >
            6 preset formation, mentalite-pressing-tempo sliderı, 7 kayıtlı
            taktik slotu. Maç sırasında değiştirebilirsin — motor gerçek zamanlı
            tepki verir.
          </p>
          <div
            style={{ display: "flex", gap: 8, marginTop: 24, flexWrap: "wrap" }}
          >
            {TACTIC_FORMS.map((f) => (
              <button
                key={f}
                type="button"
                className={`chip ${form === f ? "active" : ""}`}
                onClick={() => setForm(f)}
                style={{ cursor: "pointer" }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Newspaper stack ──────────────────────────────────────
type PaperCover = {
  head: string;
  sub: string;
  tint: string;
  clubId: string;
  week: number;
  score: string;
  opp: string;
};

function NewspaperStack() {
  const [ref, on] = useReveal(0.1);
  const [active, setActive] = useState(0);
  const covers: PaperCover[] = [
    { head: "ARDA UÇURDU", sub: "Derbi 4-1 bitti", tint: "#b91c1c", clubId: "ist", week: 7, score: "4-1", opp: "Ankara Kale" },
    { head: "KARADENİZ DERSİ", sub: "Üst üste 3 galibiyet", tint: "#7c2d12", clubId: "tra", week: 7, score: "2-0", opp: "Bursa Bulut" },
    { head: "NKEMBA ŞOV", sub: "İzmir'de fırtına", tint: "#047857", clubId: "izm", week: 7, score: "3-1", opp: "Gaziantep G." },
  ];
  useEffect(() => {
    if (!on) return;
    const iv = setInterval(() => setActive((a) => (a + 1) % covers.length), 3400);
    return () => clearInterval(iv);
  }, [on, covers.length]);
  return (
    <section
      ref={ref}
      id="gazete"
      data-lp-section
      style={{
        padding: "120px 32px",
        maxWidth: 1300,
        margin: "0 auto",
        position: "relative",
        scrollMarginTop: 80,
      }}
    >
      <div
        style={{
          textAlign: "center",
          marginBottom: 60,
          opacity: on ? 1 : 0,
          transform: on ? "translateY(0)" : "translateY(30px)",
          transition: "all 700ms var(--ease)",
        }}
      >
        <span className="t-label" style={{ color: "var(--gold)" }}>
          05 / GAZETE
        </span>
        <h2
          className="t-h1"
          style={{
            fontSize: "clamp(40px, 5vw, 64px)",
            letterSpacing: "-0.03em",
            marginTop: 12,
            lineHeight: 1.05,
          }}
        >
          Her pazar,{" "}
          <span style={{ fontStyle: "italic", fontWeight: 500, color: "var(--muted)" }}>
            kulübüne özel
          </span>
          <br />
          gazete çıkar.
        </h2>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          perspective: 2000,
          minHeight: 560,
          position: "relative",
        }}
      >
        {covers.map((c, i) => (
          <NewspaperCard
            key={i}
            cover={c}
            idx={i}
            active={active}
            total={covers.length}
            revealed={on}
            onClick={() => setActive(i)}
          />
        ))}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 8,
          marginTop: 30,
        }}
      >
        {covers.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`Sayfa ${i + 1}`}
            style={{
              width: active === i ? 32 : 8,
              height: 8,
              borderRadius: 4,
              border: "none",
              cursor: "pointer",
              background: active === i ? "var(--gold)" : "var(--border-strong)",
              transition: "all 400ms var(--ease)",
            }}
          />
        ))}
      </div>
    </section>
  );
}

function NewspaperCard({
  cover,
  idx,
  active,
  total,
  revealed,
  onClick,
}: {
  cover: PaperCover;
  idx: number;
  active: number;
  total: number;
  revealed: boolean;
  onClick: () => void;
}) {
  const rel = ((idx - active) + total) % total;
  const isActive = rel === 0;
  const isRight = rel === 1;
  const isLeft = rel === total - 1;
  const club = clubById(cover.clubId);
  const transform = !revealed
    ? "translateY(60px) rotateY(0)"
    : isActive
      ? "translate(-50%, 0) rotateY(0deg) rotateZ(-1.2deg) scale(1)"
      : isRight
        ? "translate(calc(-50% + 300px), 20px) rotateY(-22deg) rotateZ(3deg) scale(0.84)"
        : isLeft
          ? "translate(calc(-50% - 300px), 20px) rotateY(22deg) rotateZ(-3deg) scale(0.84)"
          : "translate(-50%, 40px) rotateY(0deg) scale(0.7)";
  return (
    <div
      onClick={onClick}
      style={{
        position: "absolute",
        left: "50%",
        top: 10,
        width: 360,
        height: 500,
        cursor: "pointer",
        transformStyle: "preserve-3d",
        transform,
        opacity: revealed ? (isActive ? 1 : 0.7) : 0,
        transition: "all 900ms cubic-bezier(0.22, 1, 0.36, 1)",
        zIndex: isActive ? 3 : 1,
        filter: isActive ? "none" : "blur(0.5px)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 4,
          background: "#f4efe4",
          boxShadow: isActive
            ? "0 60px 100px -40px rgba(0,0,0,0.8), 0 0 0 1px rgba(0,0,0,0.2), inset 0 0 120px rgba(139, 110, 50, 0.08)"
            : "0 30px 60px -30px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,0,0,0.15)",
          padding: "20px 22px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            opacity: 0.5,
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent 0 2px, rgba(139,110,50,0.03) 2px 3px), radial-gradient(circle at 20% 30%, rgba(139,110,50,0.1), transparent 40%), radial-gradient(circle at 80% 70%, rgba(139,110,50,0.08), transparent 40%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "50%",
            height: 14,
            pointerEvents: "none",
            background:
              "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.08) 45%, rgba(0,0,0,0.12) 50%, rgba(0,0,0,0.08) 55%, transparent 100%)",
            animation: isActive ? "foldBreathe 3s ease-in-out infinite" : "none",
          }}
        />
        <div
          style={{
            borderBottom: "2px solid #1a1410",
            paddingBottom: 6,
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 9,
              color: "#6b5a3c",
              fontFamily: "var(--font-jetbrains)",
              letterSpacing: "0.12em",
            }}
          >
            <span>PAZAR · SEZON 3 · HAFTA {cover.week}</span>
            <span>No. 0{47 + idx}</span>
          </div>
          <div
            style={{
              fontFamily: "Georgia, serif",
              fontWeight: 900,
              fontSize: 38,
              color: "#1a1410",
              letterSpacing: "-0.02em",
              lineHeight: 1,
              marginTop: 2,
              textAlign: "center",
              textShadow: "0 1px 0 rgba(139,110,50,0.15)",
            }}
          >
            <span style={{ fontStyle: "italic" }}>The</span> Spor Times
          </div>
          <div
            style={{
              fontSize: 9,
              color: "#6b5a3c",
              textAlign: "center",
              marginTop: 2,
              fontFamily: "var(--font-jetbrains)",
              letterSpacing: "0.08em",
            }}
          >
            — ELEVENFORGE LİGA —
          </div>
        </div>
        <div style={{ position: "relative", zIndex: 1, marginTop: 6 }}>
          <div
            style={{
              fontSize: 9,
              color: cover.tint,
              fontFamily: "var(--font-jetbrains)",
              fontWeight: 700,
              letterSpacing: "0.14em",
              marginBottom: 4,
            }}
          >
            ★ MANŞET ★
          </div>
          <div
            style={{
              fontFamily: "Georgia, serif",
              fontWeight: 900,
              fontSize: 36,
              lineHeight: 0.95,
              color: "#1a1410",
              letterSpacing: "-0.02em",
              animation: isActive ? "headlineType 900ms var(--ease)" : "none",
            }}
          >
            {cover.head}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "#3a2e1e",
              marginTop: 6,
              fontStyle: "italic",
              fontFamily: "Georgia, serif",
            }}
          >
            {cover.sub} — {club?.name}, {cover.opp}&apos;ı {cover.score} mağlup etti.
          </div>
        </div>
        <div
          style={{
            position: "relative",
            zIndex: 1,
            height: 120,
            borderRadius: 2,
            background: `linear-gradient(180deg, ${cover.tint}22 0%, ${cover.tint}44 100%)`,
            border: "1px solid rgba(26,20,16,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `radial-gradient(300px 150px at center, ${cover.tint}55, transparent 70%)`,
              opacity: isActive ? 1 : 0.5,
              transition: "opacity 800ms var(--ease)",
            }}
          />
          <div
            style={{
              transform: isActive ? "scale(1.08)" : "scale(1)",
              transition: "transform 2s var(--ease)",
            }}
          >
            <Crest clubId={cover.clubId} size={72} />
          </div>
        </div>
        <div
          data-lp-grid="2"
          style={{
            position: "relative",
            zIndex: 1,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            flex: 1,
            marginTop: 2,
          }}
        >
          {[0, 1].map((col) => (
            <div
              key={col}
              style={{ display: "flex", flexDirection: "column", gap: 3 }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: "#1a1410",
                  fontFamily: "Georgia, serif",
                  borderBottom: "1px solid rgba(26,20,16,0.3)",
                  paddingBottom: 2,
                  marginBottom: 3,
                }}
              >
                {col === 0 ? "MAÇ ÖZETİ" : "YORUM"}
              </div>
              {Array.from({ length: 7 }).map((_, li) => (
                <div
                  key={li}
                  style={{
                    height: 3,
                    background: "rgba(26,20,16,0.6)",
                    borderRadius: 1,
                    width: `${60 + ((li * 17 + col * 13) % 40)}%`,
                    opacity: 0.7,
                  }}
                />
              ))}
            </div>
          ))}
        </div>
        <div
          style={{
            position: "relative",
            zIndex: 1,
            borderTop: "1px solid rgba(26,20,16,0.3)",
            paddingTop: 6,
            display: "flex",
            justifyContent: "space-between",
            fontSize: 9,
            color: "#6b5a3c",
            fontFamily: "var(--font-jetbrains)",
          }}
        >
          <span>s. 1 / 16</span>
          <span>₺ 12.50</span>
        </div>
      </div>
    </div>
  );
}

// ─── Testimonials ─────────────────────────────────────────
function TestimonialWall() {
  const [ref, on] = useReveal();
  const items = [
    { name: "Baran Y.", club: "ist", text: "Derbiyi kaybedince anlatıcı geçen sezonun acısını hatırlatıyor. Yazarları var sanki.", delay: 0 },
    { name: "Elif Ö.", club: "izm", text: "Scout sistemi bağımlılık yapar. Her sabah rapor bekleyen adama dönüştüm.", delay: 100 },
    { name: "Mehmet S.", club: "tra", text: "Ligimizin WhatsApp grubu bu uygulama sayesinde Cehennem Chat oldu.", delay: 200 },
    { name: "Ceren P.", club: "gaz", text: "Taktik sliderı gerçekten çalışıyor. Tempoyu hızlandırınca gol yedim.", delay: 50 },
    { name: "Deniz A.", club: "kay", text: "Gazete kapağım evde çerçeveli duruyor artık. Ciddiyim.", delay: 150 },
    { name: "Ahmet D.", club: "ank", text: "Neden kaybettim butonu kafamın içindeki tartışmaya son verdi.", delay: 250 },
  ];
  return (
    <section
      ref={ref}
      data-lp-section style={{ padding: "120px 32px", maxWidth: 1300, margin: "0 auto" }}
    >
      <div style={{ textAlign: "center", marginBottom: 50 }}>
        <span className="t-label" style={{ color: "var(--danger)" }}>
          06 / AKIŞTAN
        </span>
        <h2
          className="t-h1"
          style={{
            fontSize: "clamp(36px, 4.5vw, 56px)",
            letterSpacing: "-0.03em",
            marginTop: 12,
            lineHeight: 1.05,
          }}
        >
          Grupta iyi giden hiçbir{" "}
          <span style={{ color: "var(--muted)" }}>şaka</span> yok.
        </h2>
      </div>
      <div className="testimonial-grid" style={{ columnCount: 3, columnGap: 18 }}>
        {items.map((t, i) => (
          <div
            key={i}
            className="glass"
            style={{
              padding: 20,
              marginBottom: 18,
              breakInside: "avoid",
              opacity: on ? 1 : 0,
              transform: on ? "translateY(0)" : "translateY(30px)",
              transition: `all 600ms ${t.delay}ms var(--ease)`,
            }}
          >
            <p
              style={{
                fontSize: 15,
                lineHeight: 1.6,
                color: "var(--text)",
                margin: 0,
                letterSpacing: "-0.005em",
              }}
            >
              &ldquo;{t.text}&rdquo;
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginTop: 14,
              }}
            >
              <Crest clubId={t.club} size={22} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>{t.name}</span>
              <span className="t-caption" style={{ fontSize: 11 }}>
                · {clubById(t.club)?.name}
              </span>
            </div>
          </div>
        ))}
      </div>
      <style>{`
        @media (max-width: 900px) { .testimonial-grid { column-count: 2 !important; } }
        @media (max-width: 600px) { .testimonial-grid { column-count: 1 !important; } }
      `}</style>
    </section>
  );
}

// ─── FAQ ──────────────────────────────────────────────────
function FaqBlock() {
  const [open, setOpen] = useState(0);
  const [ref, on] = useReveal();
  const items: Array<{ q: string; a: ReactNode }> = [
    { q: "Maç hangi saatte oynanır?", a: "Ligi kurarken sabit saat seçersin (ör. 21:00). Tüm maçlar her gün o saatte aynı anda simüle edilir." },
    { q: "Arkadaşım katılmazsa?", a: "Boş slotları bot takımlar doldurur. Bot zorluğu kolay / normal / rekabetçi ayarlanabilir." },
    { q: "Transfer piyasası nasıl işliyor?", a: "5 slota kadar listeleme yapabilir, saat bazlı otomatik fiyat düşüşü kurarsın. Diğer ligdeki kullanıcılardan da alabilirsin." },
    { q: "Canlı maç anlatımı kulübümü gerçekten tanıyor mu?", a: "Evet. Kulübünün geçmiş sezonlarını, derbi geçmişini ve yıldız oyuncularının hikayesini kullanarak anlatım yapar." },
    { q: "Mobil cihazda kullanılır mı?", a: "Evet, önce mobil-yatay için tasarlandı. Dikey ve masaüstünde de aynı tasarım ölçeklenir." },
  ];
  return (
    <section
      ref={ref}
      data-lp-section style={{ padding: "120px 32px", maxWidth: 820, margin: "0 auto" }}
    >
      <div
        style={{
          textAlign: "center",
          marginBottom: 40,
          opacity: on ? 1 : 0,
          transform: on ? "translateY(0)" : "translateY(30px)",
          transition: "all 700ms var(--ease)",
        }}
      >
        <span className="t-label">07 / SORU-CEVAP</span>
        <h2
          className="t-h1"
          style={{
            fontSize: "clamp(36px, 4.5vw, 56px)",
            letterSpacing: "-0.03em",
            marginTop: 12,
          }}
        >
          Sık sorulanlar.
        </h2>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((it, i) => (
          <div
            key={i}
            className="glass"
            style={{
              padding: 0,
              cursor: "pointer",
              borderColor:
                open === i
                  ? "color-mix(in oklab, var(--accent) 30%, var(--border))"
                  : "var(--border)",
            }}
            onClick={() => setOpen(open === i ? -1 : i)}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "18px 22px",
              }}
            >
              <span className="t-h3" style={{ fontSize: 16 }}>
                {it.q}
              </span>
              <div
                style={{
                  transform: open === i ? "rotate(45deg)" : "rotate(0)",
                  transition: "transform 300ms var(--ease)",
                  color: open === i ? "var(--accent)" : "var(--muted)",
                }}
              >
                <Plus size={18} strokeWidth={1.8} />
              </div>
            </div>
            <div
              style={{
                maxHeight: open === i ? 200 : 0,
                overflow: "hidden",
                transition: "max-height 400ms var(--ease)",
              }}
            >
              <div
                style={{
                  padding: "0 22px 18px",
                  color: "var(--text-2)",
                  fontSize: 14,
                  lineHeight: 1.65,
                }}
              >
                {it.a}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Closing CTA ──────────────────────────────────────────
function ClosingCTA() {
  const [ref, on] = useReveal();
  return (
    <section
      ref={ref}
      data-lp-section style={{ padding: "120px 32px", position: "relative", overflow: "hidden" }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(800px 500px at 50% 50%, color-mix(in oklab, var(--indigo) 20%, transparent), transparent 60%), radial-gradient(600px 400px at 30% 100%, color-mix(in oklab, var(--emerald) 18%, transparent), transparent 60%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          maxWidth: 960,
          margin: "0 auto",
          textAlign: "center",
          position: "relative",
          opacity: on ? 1 : 0,
          transform: on ? "scale(1)" : "scale(0.95)",
          transition: "all 800ms var(--ease)",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-manrope)",
            fontWeight: 800,
            fontSize: "clamp(56px, 9vw, 140px)",
            letterSpacing: "-0.05em",
            lineHeight: 0.9,
            margin: 0,
            background:
              "linear-gradient(180deg, var(--text) 0%, color-mix(in oklab, var(--text) 40%, transparent) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Akış&apos;ı{" "}
          <span
            style={{
              fontStyle: "italic",
              fontWeight: 600,
              background: "linear-gradient(100deg, #818cf8, #10b981)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            kur.
          </span>
        </h2>
        <p
          style={{
            fontSize: "clamp(16px, 1.6vw, 20px)",
            color: "var(--text-2)",
            maxWidth: 560,
            margin: "24px auto 0",
            lineHeight: 1.5,
          }}
        >
          5 dakikada ligin hazır. İlk sezon sonunda hâlâ sevmiyorsan silebilirsin
          — ama silmeyeceksin.
        </p>
        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            marginTop: 36,
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/register"
            className="btn btn-primary btn-lg"
            style={{
              padding: "16px 32px",
              fontSize: 15.5,
              textDecoration: "none",
            }}
          >
            Hesap Aç <ArrowRight size={16} strokeWidth={1.8} />
          </Link>
          <Link
            href="/login"
            className="btn btn-lg"
            style={{ padding: "16px 28px", textDecoration: "none" }}
          >
            <Play size={14} strokeWidth={1.8} /> Demo&apos;yu Gez
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────
function LandingFooter() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--border)",
        padding: "48px 32px 32px",
        maxWidth: 1400,
        margin: "0 auto",
      }}
    >
      <div
        data-lp-grid="4"
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr 1fr",
          gap: 32,
          marginBottom: 36,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Link href="/" style={{ textDecoration: "none", display: "flex" }}>
            <LogoLockup size={20} icon="anvil" />
          </Link>
          <span
            style={{
              fontSize: 13,
              color: "var(--muted)",
              maxWidth: 320,
              lineHeight: 1.6,
            }}
          >
            Arkadaşların için kurulmuş futbol yönetim oyunu. İstanbul&apos;da
            yapıldı.
          </span>
        </div>
        {(
          [
            {
              h: "Ürün",
              items: NAV_TARGETS.map((t) => ({ label: t.label, href: t.href })),
            },
            {
              h: "Giriş",
              items: [
                { label: "Hesap Aç", href: "/register" },
                { label: "Giriş Yap", href: "/login" },
                { label: "Demo'yu Gez", href: "/login" },
              ],
            },
            {
              h: "İletişim",
              items: [
                { label: "ahmetakyapii@gmail.com", href: "mailto:ahmetakyapii@gmail.com" },
                { label: "GitHub", href: "https://github.com/ahmetakyapi/elevenforge" },
              ],
            },
          ] as const
        ).map((col) => (
          <div
            key={col.h}
            style={{ display: "flex", flexDirection: "column", gap: 10 }}
          >
            <span className="t-label">{col.h}</span>
            {col.items.map((it) => (
              <a
                key={it.label}
                href={it.href}
                style={{
                  fontSize: 13,
                  color: "var(--text-2)",
                  textDecoration: "none",
                  transition: "color var(--t) var(--ease)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--text)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--text-2)";
                }}
              >
                {it.label}
              </a>
            ))}
          </div>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 12,
          color: "var(--muted)",
          paddingTop: 20,
          borderTop: "1px solid var(--border)",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <span>© 2026 ElevenForge · Kurgusal oyun evreni.</span>
        <span className="t-mono">v1.1.0 · İstanbul, TR</span>
      </div>
    </footer>
  );
}
