"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  AlertTriangle,
  Calendar,
  Coins,
  LayoutGrid,
  List,
  Plus,
  Search,
  Star,
  Target,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/toast";
import { playFriendly, toggleTraining } from "./actions";
import { renewContract } from "./contract-actions";
import { ComparePanel } from "./compare-panel";
import {
  AgePill,
  Bar,
  Crest,
  Currency,
  OvrChip,
  PosBadge,
  RatingDot,
} from "@/components/ui/primitives";
import { fmtEUR, fmtWage, posColor, tierColor } from "@/lib/utils";
import type { Player, Position } from "@/types";

export type SquadUiProps = {
  squad: Player[];
  userClubId: string;
  userClubName: string;
  userClubCrest: { color: string; color2: string; short: string };
};

type PosFilter = Position | "ALL";
type SortKey = "ovr" | "pot" | "age" | "val";
type View = "grid" | "list";

const avgForm = (p: Player) =>
  !p.form || p.form.length === 0
    ? 0
    : p.form.reduce((a, b) => a + b, 0) / p.form.length;

export default function SquadPage({
  squad,
  userClubId,
  userClubName,
  userClubCrest,
}: SquadUiProps) {
  const [filter, setFilter] = useState<PosFilter>("ALL");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("ovr");
  const [view, setView] = useState<View>("grid");
  const [selected, setSelected] = useState<Player | null>(null);
  const [hoveredNum, setHoveredNum] = useState<number | null>(null);
  // Compare mode: when active, clicking a player adds it to the slot pair
  // instead of opening the player sheet. Two slots → side-by-side panel.
  const [compareMode, setCompareMode] = useState(false);
  const [compareA, setCompareA] = useState<Player | null>(null);
  const [compareB, setCompareB] = useState<Player | null>(null);

  const handlePlayerClick = (p: Player) => {
    if (!compareMode) {
      setSelected(p);
      return;
    }
    if (!compareA) setCompareA(p);
    else if (!compareB && p.n !== compareA.n) setCompareB(p);
    else {
      setCompareA(p);
      setCompareB(null);
    }
  };

  const filtered = squad
    .filter((p) => filter === "ALL" || p.pos === filter)
    .filter((p) => !q || p.n.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) =>
      sort === "ovr"
        ? b.ovr - a.ovr
        : sort === "pot"
          ? b.pot - a.pot
          : sort === "age"
            ? a.age - b.age
            : (b.val ?? 0) - (a.val ?? 0),
    );

  const totalVal = squad.reduce((s, p) => s + (p.val ?? 0), 0);
  const avgOvr = squad.length === 0 ? "0" :
    (squad.reduce((s, p) => s + p.ovr, 0) / squad.length).toFixed(1);
  const avgAge = squad.length === 0 ? "0" :
    (squad.reduce((s, p) => s + p.age, 0) / squad.length).toFixed(1);
  const injured = squad.filter((p) => p.status === "injured").length;
  const suspended = squad.filter((p) => p.status === "suspended").length;
  // Training slot summary — 1 per position group, 4 max total.
  const trainingByPos = {
    GK: squad.filter((p) => p.status === "training" && p.pos === "GK").length,
    DEF: squad.filter((p) => p.status === "training" && p.pos === "DEF").length,
    MID: squad.filter((p) => p.status === "training" && p.pos === "MID").length,
    FWD: squad.filter((p) => p.status === "training" && p.pos === "FWD").length,
  };
  const trainingFilled =
    trainingByPos.GK + trainingByPos.DEF + trainingByPos.MID + trainingByPos.FWD;

  return (
    <div
      style={{ maxWidth: 1400, margin: "0 auto", padding: "20px 28px 60px" }}
    >
      <SquadHero
        totalVal={totalVal}
        avgOvr={avgOvr}
        avgAge={avgAge}
        injured={injured}
        suspended={suspended}
        squadCount={squad.length}
        activeCount={squad.filter(p => p.status !== "injured" && p.status !== "suspended").length}
        userClubId={userClubId}
        userClubName={userClubName}
        userClubCrest={userClubCrest}
      />

      {/* Training slot summary — 4 slots, 1 per position group.
          Explains the rule so "2/4" isn't a mystery: each slot is 1 player
          per position group, and trained players pick up +1 overall on the
          daily tick (faster if ≤22 yaş). */}
      <div
        data-training-slots
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 12,
          padding: "12px 14px",
          marginTop: 10,
          marginBottom: 12,
          borderRadius: 10,
          background: "color-mix(in oklab, var(--panel-2) 60%, transparent)",
          border: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            minWidth: 200,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <span className="t-label" style={{ fontSize: 11 }}>
              ANTRENMAN
            </span>
            <span
              className="t-mono"
              style={{
                fontSize: 12,
                padding: "2px 8px",
                borderRadius: 4,
                background:
                  trainingFilled === 4
                    ? "color-mix(in oklab, var(--emerald) 22%, transparent)"
                    : "color-mix(in oklab, var(--panel) 80%, transparent)",
                color: trainingFilled === 4 ? "var(--emerald)" : "var(--muted)",
                fontWeight: 700,
              }}
            >
              {trainingFilled} / 4 dolu
            </span>
          </div>
          <span
            className="t-caption"
            style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.4 }}
          >
            Her pozisyondan 1 oyuncu. Günlük tick +1 OVR şansı verir
            (≤22 yaş = 3× hız).
          </span>
        </div>
        <div
          style={{
            display: "flex",
            gap: 6,
            marginLeft: "auto",
            flexWrap: "wrap",
          }}
        >
          {(["GK", "DEF", "MID", "FWD"] as const).map((pos) => {
            const filled = trainingByPos[pos] > 0;
            const label =
              pos === "GK" ? "Kaleci" : pos === "DEF" ? "Defans" : pos === "MID" ? "Orta" : "Forvet";
            return (
              <span
                key={pos}
                title={
                  filled
                    ? `${label} slotu dolu — kartta 🔥 olan oyuncu antrenmanda`
                    : `${label} slotu boş — bir oyuncuya Antrenman ekle`
                }
                style={{
                  fontSize: 11,
                  padding: "4px 9px",
                  borderRadius: 999,
                  background: filled
                    ? "color-mix(in oklab, var(--emerald) 24%, transparent)"
                    : "color-mix(in oklab, var(--muted) 14%, transparent)",
                  color: filled ? "var(--emerald)" : "var(--muted)",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                {label} {filled ? "●" : "○"}
              </span>
            );
          })}
        </div>
      </div>

      {/* Toolbar */}
      <div
        className="anim-slide-up"
        data-squad-toolbar
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          marginTop: 32,
          marginBottom: 20,
          animationDelay: "200ms",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 6,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {([
            ["ALL", "Tümü", squad.length],
            ["GK", "Kaleci", squad.filter((p) => p.pos === "GK").length],
            ["DEF", "Defans", squad.filter((p) => p.pos === "DEF").length],
            ["MID", "Orta", squad.filter((p) => p.pos === "MID").length],
            ["FWD", "Forvet", squad.filter((p) => p.pos === "FWD").length],
          ] as Array<[PosFilter, string, number]>).map(([f, l, n]) => (
            <button
              key={f}
              type="button"
              className={`chip ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
              style={{
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>{l}</span>
              <span
                className="t-mono"
                style={{
                  fontSize: 10,
                  color: filter === f ? "var(--accent)" : "var(--muted)",
                  padding: "1px 6px",
                  borderRadius: 4,
                  background:
                    filter === f
                      ? "color-mix(in oklab, var(--accent) 15%, transparent)"
                      : "var(--panel-2)",
                }}
              >
                {n}
              </span>
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div
            className="glass"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 14px",
              borderRadius: 10,
            }}
          >
            <Search size={14} strokeWidth={1.6} />
            <input
              placeholder="İsim ara…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                color: "var(--text)",
                fontSize: 13,
                width: 140,
                fontFamily: "var(--font-manrope)",
              }}
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="input"
            style={{ padding: "8px 12px", fontSize: 13, width: "auto" }}
          >
            <option value="ovr">Overall ↓</option>
            <option value="pot">Potansiyel ↓</option>
            <option value="age">Yaş ↑</option>
            <option value="val">Değer ↓</option>
          </select>
          <div
            style={{
              display: "flex",
              gap: 2,
              padding: 3,
              borderRadius: 8,
              background: "var(--panel-2)",
              border: "1px solid var(--border)",
            }}
          >
            <ViewToggle v="grid" current={view} onClick={() => setView("grid")} />
            <ViewToggle v="list" current={view} onClick={() => setView("list")} />
          </div>
          <button
            type="button"
            className={`btn btn-sm ${compareMode ? "btn-primary" : "btn-ghost"}`}
            onClick={() => {
              setCompareMode((v) => !v);
              setCompareA(null);
              setCompareB(null);
            }}
            title="İki oyuncuyu yan yana karşılaştır"
          >
            {compareMode ? "Karşılaştırmadan Çık" : "Karşılaştır"}
          </button>
        </div>
      </div>

      {/* Results */}
      {view === "grid" ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 14,
          }}
        >
          {filtered.map((p, i) => (
            <PlayerCardGrid
              key={p.num ?? p.n}
              p={p}
              i={i}
              onClick={() => handlePlayerClick(p)}
              hovered={hoveredNum === p.num}
              onHover={setHoveredNum}
              compareMark={
                compareMode
                  ? compareA?.n === p.n
                    ? "A"
                    : compareB?.n === p.n
                      ? "B"
                      : null
                  : null
              }
            />
          ))}
        </div>
      ) : (
        <PlayerTable list={filtered} onSelect={handlePlayerClick} />
      )}

      {filtered.length === 0 && (
        <div
          className="glass"
          style={{ padding: 48, textAlign: "center", color: "var(--muted)" }}
        >
          <Search size={24} strokeWidth={1.6} />
          <div style={{ marginTop: 10, fontSize: 14 }}>
            Bu filtrelerle oyuncu bulunamadı.
          </div>
        </div>
      )}

      {selected && (
        <PlayerSheet
          player={selected}
          onClose={() => setSelected(null)}
          userClubId={userClubId}
          userClubName={userClubName}
          userClubCrest={userClubCrest}
        />
      )}

      {compareMode && compareA && compareB && (
        <ComparePanel
          a={compareA}
          b={compareB}
          onClose={() => {
            setCompareA(null);
            setCompareB(null);
          }}
        />
      )}
    </div>
  );
}

function ViewToggle({
  v,
  current,
  onClick,
}: {
  v: View;
  current: View;
  onClick: () => void;
}) {
  const Icon = v === "grid" ? LayoutGrid : List;
  return (
    <button
      type="button"
      onClick={onClick}
      className="btn btn-ghost btn-sm"
      style={{
        padding: "6px 10px",
        background: current === v ? "var(--panel)" : "transparent",
        color: current === v ? "var(--text)" : "var(--muted)",
      }}
    >
      <Icon size={14} strokeWidth={1.6} />
    </button>
  );
}

// ─── Hero header ────────────────────────────────────────────
function SquadHero({
  totalVal,
  avgOvr,
  avgAge,
  injured,
  suspended,
  squadCount,
  activeCount,
  userClubId,
  userClubName,
  userClubCrest,
}: {
  totalVal: number;
  avgOvr: string;
  avgAge: string;
  injured: number;
  suspended: number;
  squadCount: number;
  activeCount: number;
  userClubId: string;
  userClubName: string;
  userClubCrest: { color: string; color2: string; short: string };
}) {
  return (
    <div
      style={{
        position: "relative",
        borderRadius: 20,
        overflow: "hidden",
        background: `
          radial-gradient(800px 400px at 15% 20%, color-mix(in oklab, var(--indigo) 18%, transparent), transparent 60%),
          radial-gradient(600px 400px at 90% 100%, color-mix(in oklab, var(--emerald) 14%, transparent), transparent 60%),
          linear-gradient(135deg, color-mix(in oklab, var(--panel) 120%, transparent) 0%, color-mix(in oklab, var(--bg-2) 120%, transparent) 100%)`,
        border: "1px solid var(--border-strong)",
        boxShadow: "var(--shadow-lg)",
      }}
    >
      <svg
        viewBox="0 0 1600 420"
        preserveAspectRatio="xMidYMid slice"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0.22,
          pointerEvents: "none",
        }}
      >
        <defs>
          <linearGradient id="pitchHero" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        <g stroke="url(#pitchHero)" strokeWidth="1.2" fill="none">
          <rect x="40" y="40" width="1520" height="340" />
          <line x1="800" y1="40" x2="800" y2="380" />
          <circle cx="800" cy="210" r="85" />
          <rect x="40" y="130" width="170" height="160" />
          <rect x="1390" y="130" width="170" height="160" />
        </g>
      </svg>

      <div
        style={{
          position: "relative",
          padding: "28px 32px",
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: 24,
          alignItems: "center",
        }}
      >
        <div className="anim-slide-up">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 10,
            }}
          >
            <Crest clubId={userClubId} size={32} club={userClubCrest} />
            <span className="t-label" style={{ color: "var(--muted)" }}>
              KADRO YÖNETİMİ
            </span>
          </div>
          <h1
            className="t-display"
            style={{
              fontSize: "clamp(38px, 5vw, 64px)",
              letterSpacing: "-0.035em",
              lineHeight: 0.95,
              margin: 0,
              background:
                "linear-gradient(180deg, var(--text) 0%, color-mix(in oklab, var(--text) 55%, transparent) 120%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {userClubName}
          </h1>
          <p
            style={{
              color: "var(--text-2)",
              fontSize: 15,
              marginTop: 8,
              letterSpacing: "-0.005em",
            }}
          >
            <span className="t-mono" style={{ color: "var(--text)" }}>
              {squadCount}
            </span>{" "}
            oyuncu ·{" "}
            <span className="t-mono" style={{ color: "var(--text)" }}>
              {activeCount}
            </span>{" "}
            aktif
          </p>
        </div>
        <div className="anim-slide-up" style={{ animationDelay: "100ms" }}>
          <Link
            href="/transfer"
            className="btn btn-primary btn-lg"
            style={{ padding: "12px 22px", textDecoration: "none" }}
          >
            <Plus size={14} strokeWidth={1.6} /> Transfer Pazarı
          </Link>
        </div>
      </div>

      {/* Stat strip */}
      <div
        data-squad-hero-stats
        style={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          borderTop: "1px solid var(--border)",
        }}
      >
        {[
          {
            label: "TOPLAM DEĞER",
            value: fmtEUR(totalVal),
            sub: "Piyasa",
            color: "var(--emerald)",
            Icon: Coins,
            delay: 0,
          },
          {
            label: "ORT. OVERALL",
            value: avgOvr,
            sub:
              Number(avgOvr) >= 80
                ? "Elit"
                : Number(avgOvr) >= 75
                  ? "Güçlü"
                  : "Gelişiyor" + " kadro",
            color: "var(--accent)",
            Icon: Star,
            delay: 80,
          },
          {
            label: "ORT. YAŞ",
            value: avgAge,
            sub:
              Number(avgAge) < 25
                ? "Genç"
                : Number(avgAge) < 28
                  ? "Dengeli"
                  : "Tecrübeli",
            color: "var(--cyan)",
            Icon: Calendar,
            delay: 160,
          },
          {
            label: "SAKAT / CEZALI",
            value: `${injured + suspended}`,
            sub: "Bu hafta",
            color: "var(--warn)",
            Icon: AlertTriangle,
            delay: 240,
          },
        ].map((s, i) => (
          <div
            key={s.label}
            className="anim-slide-up"
            style={{
              padding: "18px 24px",
              borderLeft: i === 0 ? "none" : "1px solid var(--border)",
              animationDelay: `${s.delay + 300}ms`,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 7,
                  background: `color-mix(in oklab, ${s.color} 18%, transparent)`,
                  color: s.color,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <s.Icon size={13} strokeWidth={1.6} />
              </div>
              <span className="t-label" style={{ fontSize: 10 }}>
                {s.label}
              </span>
            </div>
            <div
              className="t-mono"
              style={{
                fontSize: 26,
                fontWeight: 700,
                color: "var(--text)",
                letterSpacing: "-0.02em",
              }}
            >
              {s.value}
            </div>
            <div className="t-caption" style={{ fontSize: 11, marginTop: 2 }}>
              {s.sub}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Player card (grid view) ────────────────────────────────
//
// Premium layout: the card leads with a giant tier-coloured OVR
// chip (sağ üst), a bold name, and a 3-attribute micro-bar strip
// chosen by role. Secondary info (age, value, fitness pill) sits
// on a single line below. Status + potential / listed / training
// show as small top-left chips only when non-default.
//
// Removed from the previous card: the 5-match form bar chart, the
// fit+moral dual bars, and the watermarked jersey number — they
// made every tile feel busy. The PlayerSheet still has all of it.

// Role → the 3 attributes most relevant to that role. Strikers see
// pace/shooting/physical; CBs see defending/physical/pace; etc. If a
// role isn't mapped we fall back to a generic trio for that position.
const ROLE_KEY_ATTRS: Record<string, Array<["pace" | "shooting" | "passing" | "defending" | "physical" | "goalkeeping", string]>> = {
  GK:  [["goalkeeping", "SAV"], ["physical", "FIZ"], ["passing", "PAS"]],
  CB:  [["defending", "DEF"], ["physical", "FIZ"], ["pace", "HIZ"]],
  LB:  [["pace", "HIZ"], ["defending", "DEF"], ["passing", "PAS"]],
  RB:  [["pace", "HIZ"], ["defending", "DEF"], ["passing", "PAS"]],
  CDM: [["defending", "DEF"], ["passing", "PAS"], ["physical", "FIZ"]],
  CM:  [["passing", "PAS"], ["defending", "DEF"], ["pace", "HIZ"]],
  AM:  [["passing", "PAS"], ["shooting", "ŞUT"], ["pace", "HIZ"]],
  LW:  [["pace", "HIZ"], ["shooting", "ŞUT"], ["passing", "PAS"]],
  RW:  [["pace", "HIZ"], ["shooting", "ŞUT"], ["passing", "PAS"]],
  ST:  [["shooting", "ŞUT"], ["pace", "HIZ"], ["physical", "FIZ"]],
  CF:  [["shooting", "ŞUT"], ["passing", "PAS"], ["physical", "FIZ"]],
};

const POS_FALLBACK_ATTRS: Record<Position, Array<["pace" | "shooting" | "passing" | "defending" | "physical" | "goalkeeping", string]>> = {
  GK:  [["goalkeeping", "SAV"], ["physical", "FIZ"], ["passing", "PAS"]],
  DEF: [["defending", "DEF"], ["physical", "FIZ"], ["pace", "HIZ"]],
  MID: [["passing", "PAS"], ["defending", "DEF"], ["pace", "HIZ"]],
  FWD: [["shooting", "ŞUT"], ["pace", "HIZ"], ["physical", "FIZ"]],
};

// Tier palette: gives the OVR chip + the top edge a recognisable
// colour so a quick scan distinguishes stars from squad depth.
function tierPalette(ovr: number): {
  label: string;
  accent: string;
  glow: string;
} {
  if (ovr >= 85)
    return {
      label: "ELITE",
      accent: "var(--gold)",
      glow: "0 0 40px -8px color-mix(in oklab, var(--gold) 45%, transparent)",
    };
  if (ovr >= 80)
    return {
      label: "STAR",
      accent: "var(--emerald)",
      glow:
        "0 0 32px -10px color-mix(in oklab, var(--emerald) 40%, transparent)",
    };
  if (ovr >= 75)
    return {
      label: "FIRST-11",
      accent: "var(--cyan)",
      glow:
        "0 0 28px -12px color-mix(in oklab, var(--cyan) 35%, transparent)",
    };
  if (ovr >= 70)
    return { label: "ROTATION", accent: "var(--indigo)", glow: "none" };
  return { label: "DEPTH", accent: "var(--muted)", glow: "none" };
}

function PlayerCardGrid({
  p,
  i,
  onClick,
  onHover,
  compareMark,
}: {
  p: Player;
  i: number;
  onClick: () => void;
  hovered: boolean;
  onHover: (n: number | null) => void;
  compareMark?: "A" | "B" | null;
}) {
  const [localHover, setLocalHover] = useState(false);
  const potBuff = p.pot - p.ovr;
  const statusStyles = STATUS_STYLE[p.status ?? "_"] ?? null;
  const tier = tierPalette(p.ovr);
  const keyAttrs = ROLE_KEY_ATTRS[p.role] ?? POS_FALLBACK_ATTRS[p.pos];
  const valueEur = p.val ?? 0;

  return (
    <div
      onClick={onClick}
      data-cmp={compareMark ?? undefined}
      onMouseEnter={() => {
        setLocalHover(true);
        if (p.num !== undefined) onHover(p.num);
      }}
      onMouseLeave={() => {
        setLocalHover(false);
        onHover(null);
      }}
      className="anim-slide-up"
      style={{
        animationDelay: `${Math.min(i * 30, 360)}ms`,
        position: "relative",
        borderRadius: 16,
        overflow: "hidden",
        background:
          "linear-gradient(180deg, color-mix(in oklab, var(--panel-hover) 35%, var(--panel)) 0%, var(--panel) 60%, var(--panel-2) 100%)",
        border: compareMark
          ? "2px solid var(--accent)"
          : `1px solid ${
              localHover
                ? `color-mix(in oklab, ${tier.accent} 50%, var(--border))`
                : "var(--border)"
            }`,
        cursor: "pointer",
        transform: localHover ? "translateY(-3px)" : "translateY(0)",
        boxShadow: localHover ? tier.glow : "var(--shadow-sm)",
        transition: "all 260ms var(--ease)",
      }}
    >
      {/* Tier accent stripe along the top edge */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${tier.accent} 0%, color-mix(in oklab, ${tier.accent} 40%, transparent) 100%)`,
          zIndex: 2,
        }}
      />

      {compareMark && (
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            zIndex: 5,
            width: 22,
            height: 22,
            borderRadius: 6,
            background: "var(--accent)",
            color: "#fff",
            fontWeight: 800,
            fontSize: 11,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {compareMark}
        </div>
      )}

      {statusStyles && !compareMark && (
        <div
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            padding: "3px 8px",
            borderRadius: 6,
            fontSize: 10,
            fontFamily: "var(--font-jetbrains)",
            fontWeight: 600,
            letterSpacing: "0.04em",
            background: statusStyles.bg,
            color: statusStyles.c,
            border: "1px solid currentColor",
            zIndex: 2,
          }}
        >
          {statusStyles.label}
        </div>
      )}

      <div style={{ position: "relative", padding: "16px 16px 14px", zIndex: 1 }}>
        {/* Header row: pos + role aside, giant OVR right */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 10,
            marginBottom: 10,
            marginTop: statusStyles || compareMark ? 20 : 0,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <PosBadge pos={p.pos} showLabel />
            <span
              className="t-mono"
              style={{
                fontSize: 10,
                color: "var(--muted)",
                letterSpacing: "0.09em",
              }}
            >
              {p.role} · {p.nat}
              {p.num !== undefined && ` · #${p.num}`}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 2,
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-manrope)",
                fontWeight: 800,
                fontSize: 34,
                letterSpacing: "-0.04em",
                lineHeight: 1,
                color: tier.accent,
                textShadow: localHover
                  ? `0 0 18px color-mix(in oklab, ${tier.accent} 55%, transparent)`
                  : "none",
                transition: "text-shadow 260ms var(--ease)",
              }}
            >
              {p.ovr}
            </div>
            <span
              className="t-mono"
              style={{
                fontSize: 9,
                letterSpacing: "0.14em",
                fontWeight: 700,
                color: tier.accent,
                opacity: 0.85,
              }}
            >
              {tier.label}
            </span>
          </div>
        </div>

        {/* Name */}
        <div
          style={{
            fontFamily: "var(--font-manrope)",
            fontWeight: 700,
            fontSize: 17,
            letterSpacing: "-0.015em",
            lineHeight: 1.15,
            color: "var(--text)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            marginBottom: 6,
          }}
          title={p.n}
        >
          {p.n}
        </div>

        {/* Secondary meta line: age · value · potential arrow */}
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            marginBottom: 14,
            flexWrap: "wrap",
          }}
        >
          <AgePill age={p.age} size="sm" />
          <span
            className="t-mono"
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--emerald)",
            }}
          >
            {fmtEUR(valueEur)}
          </span>
          {potBuff > 0 && (
            <span
              className="t-mono"
              title={`Potansiyel: ${p.pot}`}
              style={{
                fontSize: 10,
                fontWeight: 600,
                padding: "2px 6px",
                borderRadius: 999,
                background:
                  "color-mix(in oklab, var(--gold) 14%, transparent)",
                color: "var(--gold)",
                letterSpacing: "0.02em",
              }}
            >
              ↑ +{potBuff}
            </span>
          )}
        </div>

        {/* Role-aware attribute strip — 3 mini bars */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)",
            gap: 10,
            paddingTop: 10,
            borderTop: "1px solid var(--border)",
          }}
        >
          {keyAttrs.map(([key, label]) => {
            const v = (p[key] as number | undefined) ?? p.ovr;
            const bandColor =
              v >= 85
                ? "var(--gold)"
                : v >= 78
                  ? "var(--emerald)"
                  : v >= 70
                    ? "var(--cyan)"
                    : "var(--muted-2)";
            return (
              <div
                key={key}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                  }}
                >
                  <span
                    className="t-label"
                    style={{ fontSize: 9, letterSpacing: "0.1em" }}
                  >
                    {label}
                  </span>
                  <span
                    className="t-mono"
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: bandColor,
                    }}
                  >
                    {v}
                  </span>
                </div>
                <div
                  style={{
                    height: 3,
                    borderRadius: 3,
                    background: "var(--panel-2)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(100, Math.max(10, v))}%`,
                      height: "100%",
                      background: bandColor,
                      transition: "width 400ms var(--ease)",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const STATUS_STYLE: Record<string, { bg: string; c: string; label: string }> = {
  injured: {
    bg: "color-mix(in oklab, var(--danger) 20%, transparent)",
    c: "var(--danger)",
    label: "🩹 SAKAT",
  },
  suspended: {
    bg: "color-mix(in oklab, var(--warn) 20%, transparent)",
    c: "var(--warn)",
    label: "🟥 CEZALI",
  },
  listed: {
    bg: "color-mix(in oklab, var(--emerald) 20%, transparent)",
    c: "var(--emerald)",
    label: "💰 SATIŞTA",
  },
  training: {
    bg: "color-mix(in oklab, var(--cyan) 20%, transparent)",
    c: "var(--cyan)",
    label: "💪 EĞİTİM",
  },
};

// ─── Player table (list view) ───────────────────────────────
function PlayerTable({
  list,
  onSelect,
}: {
  list: Player[];
  onSelect: (p: Player) => void;
}) {
  return (
    <div
      className="glass"
      data-dense-table
      data-dense-table-xwide
      style={{ padding: 0, overflow: "hidden" }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "40px 1fr 100px 70px 90px 100px 100px 70px 90px 60px",
          gap: 12,
          padding: "12px 18px",
          borderBottom: "1px solid var(--border)",
          background: "var(--panel-2)",
        }}
      >
        {[
          "#",
          "OYUNCU",
          "POS",
          "OVR",
          "POT",
          "YAŞ",
          "FORM",
          "FIT",
          "DEĞER",
          "DURUM",
        ].map((h) => (
          <span key={h} className="t-label" style={{ fontSize: 10 }}>
            {h}
          </span>
        ))}
      </div>
      {list.map((p, i) => (
        <div
          key={p.num ?? p.n}
          onClick={() => onSelect(p)}
          className="anim-slide-up"
          style={{
            display: "grid",
            gridTemplateColumns:
              "40px 1fr 100px 70px 90px 100px 100px 70px 90px 60px",
            gap: 12,
            padding: "12px 18px",
            alignItems: "center",
            borderBottom:
              i < list.length - 1 ? "1px solid var(--border)" : "none",
            cursor: "pointer",
            transition: "background 200ms var(--ease)",
            animationDelay: `${Math.min(i * 20, 300)}ms`,
          }}
        >
          <span
            className="t-mono"
            style={{ color: "var(--muted)", fontSize: 13 }}
          >
            {p.num ?? "?"}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: `linear-gradient(135deg, ${posColor(
                  p.pos,
                )}, color-mix(in oklab, ${posColor(p.pos)} 30%, var(--bg-2)))`,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 12,
                fontFamily: "var(--font-jetbrains)",
              }}
            >
              {p.n
                .split(" ")
                .map((s) => s[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div style={{ minWidth: 0, overflow: "hidden" }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={p.n}
              >
                {p.n}
              </div>
              <div className="t-caption" style={{ fontSize: 11 }}>
                {p.role} · {p.nat}
              </div>
            </div>
          </div>
          <PosBadge pos={p.pos} showLabel />
          <OvrChip ovr={p.ovr} size="sm" />
          <div>
            <Bar value={p.pot} color="var(--gold)" height={4} />
            <span
              className="t-mono"
              style={{ fontSize: 10, color: "var(--muted)" }}
            >
              {p.ovr}→{p.pot}
            </span>
          </div>
          <AgePill age={p.age} size="sm" />
          <div style={{ display: "flex", gap: 2 }}>
            {(p.form ?? []).map((f, j) => (
              <span
                key={`f-${j}`}
                style={{
                  flex: 1,
                  height: 14,
                  borderRadius: 2,
                  background:
                    f >= 8
                      ? "var(--gold)"
                      : f >= 7
                        ? "var(--emerald)"
                        : f >= 6
                          ? "var(--cyan)"
                          : "var(--muted-2)",
                }}
              />
            ))}
          </div>
          <Bar
            value={p.fit ?? 0}
            height={4}
            color={
              (p.fit ?? 0) >= 90
                ? "var(--emerald)"
                : (p.fit ?? 0) >= 75
                  ? "var(--cyan)"
                  : "var(--warn)"
            }
          />
          <Currency value={p.val ?? 0} size={13} />
          <div style={{ fontSize: 14 }}>{STATUS_ICON[p.status ?? "_"] ?? ""}</div>
        </div>
      ))}
    </div>
  );
}

const STATUS_ICON: Record<string, string> = {
  injured: "🩹",
  suspended: "🟥",
  training: "💪",
  listed: "💰",
};

// ─── Player sheet (modal detail) ─────────────────────────────
function PlayerSheet({
  player: p,
  onClose,
  userClubId,
  userClubName,
  userClubCrest,
}: {
  player: Player;
  onClose: () => void;
  userClubId: string;
  userClubName: string;
  userClubCrest: { color: string; color2: string; short: string };
}) {
  const [tab, setTab] = useState<"attr" | "form" | "hist">("attr");
  const attrs: Record<string, Array<[string, number]>> = {
    fiziksel: [
      ["Hız", 82],
      ["Güç", 78],
      ["Dayanıklılık", 84],
      ["Sıçrama", 71],
    ],
    teknik: [
      ["Şut", p.pos === "FWD" ? 86 : 72],
      ["Pas", p.pos === "MID" ? 85 : 74],
      ["Dripling", 81],
      ["Top kontrol", 82],
    ],
    mental: [
      ["Karar", 79],
      ["Agresyon", 73],
      ["Vizyon", 81],
      ["Liderlik", 70],
    ],
  };
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        zIndex: 200,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-end",
      }}
    >
      <div
        data-modal-sheet
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 920,
          width: "100%",
          maxHeight: "92vh",
          overflowY: "auto",
          borderRadius: "24px 24px 0 0",
          border: "1px solid var(--border-strong)",
          animation: "slide-up 400ms var(--ease)",
          background: `
            radial-gradient(600px 300px at 10% 0%, color-mix(in oklab, ${posColor(
              p.pos,
            )} 16%, transparent), transparent 60%),
            var(--bg-2)`,
          boxShadow: "0 -40px 80px -20px rgba(0,0,0,0.5)",
        }}
      >
        <div
          style={{
            padding: "32px 32px 24px",
            borderBottom: "1px solid var(--border)",
            display: "grid",
            gridTemplateColumns: "auto 1fr auto",
            gap: 24,
            alignItems: "center",
            position: "relative",
          }}
        >
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ position: "absolute", top: 16, right: 16 }}
            onClick={onClose}
          >
            <X size={16} strokeWidth={1.6} />
          </button>

          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: 20,
              position: "relative",
              overflow: "hidden",
              background: `linear-gradient(135deg, ${posColor(
                p.pos,
              )} 0%, color-mix(in oklab, ${posColor(p.pos)} 30%, var(--bg-2)) 120%)`,
              boxShadow: `0 12px 32px -8px color-mix(in oklab, ${posColor(
                p.pos,
              )} 50%, transparent)`,
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <span
              className="t-mono"
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 64,
                fontWeight: 800,
                color: "rgba(255,255,255,0.95)",
                letterSpacing: "-0.04em",
                textShadow: "0 4px 16px rgba(0,0,0,0.4)",
              }}
            >
              {p.num ?? "?"}
            </span>
            <div
              style={{
                position: "absolute",
                top: 8,
                left: 8,
                fontSize: 10,
                fontFamily: "var(--font-jetbrains)",
                fontWeight: 700,
                color: "rgba(255,255,255,0.7)",
              }}
            >
              {p.pos}
            </div>
          </div>

          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 8,
              }}
            >
              <Crest clubId={userClubId} size={20} club={userClubCrest} />
              <span className="t-small">
                {userClubName} · {p.nat} · {p.role}
              </span>
            </div>
            <div
              style={{
                fontFamily: "var(--font-manrope)",
                fontWeight: 800,
                fontSize: "clamp(28px, 4vw, 42px)",
                letterSpacing: "-0.03em",
                lineHeight: 1,
                background:
                  "linear-gradient(180deg, var(--text) 0%, color-mix(in oklab, var(--text) 65%, transparent) 120%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {p.n}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginTop: 14,
                flexWrap: "wrap",
              }}
            >
              <OvrChip ovr={p.ovr} size="lg" />
              <PosBadge pos={p.pos} showLabel />
              <AgePill age={p.age} />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "4px 10px",
                  borderRadius: 8,
                  background:
                    "color-mix(in oklab, var(--gold) 12%, transparent)",
                  border:
                    "1px solid color-mix(in oklab, var(--gold) 30%, transparent)",
                }}
              >
                <span
                  className="t-label"
                  style={{ fontSize: 9, color: "var(--gold)" }}
                >
                  POT
                </span>
                <span
                  className="t-mono"
                  style={{
                    fontSize: 13,
                    color: "var(--gold)",
                    fontWeight: 700,
                  }}
                >
                  {p.pot}
                </span>
              </div>
              <Currency value={p.val ?? 0} size={16} color="var(--emerald)" />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              alignItems: "flex-end",
            }}
          >
            <div style={{ textAlign: "right" }}>
              <span className="t-label" style={{ fontSize: 9 }}>
                SON 5 ORT.
              </span>
              <div
                className="t-mono"
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color:
                    avgForm(p) >= 7.3 ? "var(--emerald)" : "var(--text)",
                  letterSpacing: "-0.02em",
                }}
              >
                {avgForm(p).toFixed(2)}
              </div>
            </div>
            <div style={{ display: "flex", gap: 3 }}>
              {(p.form ?? []).map((r, i) => (
                <RatingDot key={`s-${i}`} rating={r} size={26} />
              ))}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            padding: "20px 32px",
          }}
        >
          <div className="glass" style={{ padding: 18 }}>
            <span className="t-label">PROFİL RADARI</span>
            <RadarChart p={p} />
          </div>
          <div
            className="glass"
            style={{
              padding: 18,
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <span className="t-label">SÖZLEŞME</span>
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <span className="t-caption">Kalan yıl</span>
                <span
                  className="t-mono"
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: (p.ctr ?? 0) <= 1 ? "var(--warn)" : "var(--text)",
                  }}
                >
                  {p.ctr ?? 0} yıl
                </span>
              </div>
              <div style={{ display: "flex", gap: 3, height: 8 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      borderRadius: 3,
                      background:
                        i < (p.ctr ?? 0)
                          ? (p.ctr ?? 0) <= 1
                            ? "var(--warn)"
                            : "var(--accent)"
                          : "var(--panel-2)",
                      transition: `all 500ms ${i * 80}ms var(--ease)`,
                    }}
                  />
                ))}
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                paddingTop: 10,
                borderTop: "1px solid var(--border)",
              }}
            >
              <div>
                <span
                  className="t-caption"
                  style={{ display: "block", marginBottom: 4 }}
                >
                  Haftalık
                </span>
                <span
                  className="t-mono"
                  style={{ fontSize: 15, fontWeight: 600 }}
                >
                  {fmtWage(p.wage ?? 0)}
                </span>
              </div>
              <div>
                <span
                  className="t-caption"
                  style={{ display: "block", marginBottom: 4 }}
                >
                  Bırakma
                </span>
                <span
                  className="t-mono"
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: "var(--text-2)",
                  }}
                >
                  {fmtEUR((p.val ?? 0) * 1.8)}
                </span>
              </div>
              <div>
                <span
                  className="t-caption"
                  style={{ display: "block", marginBottom: 4 }}
                >
                  Kondisyon
                </span>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Bar
                    value={p.fit ?? 0}
                    height={4}
                    color={
                      (p.fit ?? 0) >= 90
                        ? "var(--emerald)"
                        : "var(--cyan)"
                    }
                  />
                  <span className="t-mono" style={{ fontSize: 11 }}>
                    {p.fit ?? 0}
                  </span>
                </div>
              </div>
              <div>
                <span
                  className="t-caption"
                  style={{ display: "block", marginBottom: 4 }}
                >
                  Moral
                </span>
                <span style={{ fontSize: 14, letterSpacing: "-0.03em" }}>
                  {"❤".repeat(p.mor ?? 0)}
                  <span style={{ color: "var(--muted-2)" }}>
                    {"❤".repeat(5 - (p.mor ?? 0))}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ padding: "0 32px 24px" }}>
          <div
            style={{
              display: "flex",
              gap: 4,
              marginBottom: 16,
              borderBottom: "1px solid var(--border)",
            }}
          >
            {(
              [
                ["attr", "Nitelikler"],
                ["form", "Form Geçmişi"],
                ["hist", "Kariyer"],
              ] as const
            ).map(([k, l]) => (
              <button
                key={k}
                type="button"
                onClick={() => setTab(k)}
                style={{
                  padding: "10px 14px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: tab === k ? "var(--text)" : "var(--muted)",
                  fontSize: 13,
                  fontWeight: tab === k ? 600 : 500,
                  borderBottom:
                    tab === k
                      ? "2px solid var(--accent)"
                      : "2px solid transparent",
                  marginBottom: -1,
                  transition: "all 200ms var(--ease)",
                }}
              >
                {l}
              </button>
            ))}
          </div>
          {tab === "attr" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 14,
              }}
            >
              {Object.entries(attrs).map(([grp, rows], gi) => (
                <div
                  key={grp}
                  className="glass anim-slide-up"
                  style={{ padding: 16, animationDelay: `${gi * 60}ms` }}
                >
                  <span className="t-label" style={{ textTransform: "uppercase" }}>
                    {grp}
                  </span>
                  <div
                    style={{
                      marginTop: 12,
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    {rows.map(([name, val], ri) => (
                      <div
                        key={name}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr auto 80px",
                          gap: 8,
                          alignItems: "center",
                        }}
                      >
                        <span style={{ fontSize: 12.5, color: "var(--text-2)" }}>
                          {name}
                        </span>
                        <span
                          className="t-mono"
                          style={{
                            fontSize: 12,
                            color: tierColor(val),
                            fontWeight: 700,
                            minWidth: 22,
                            textAlign: "right",
                          }}
                        >
                          {val}
                        </span>
                        <div
                          style={{
                            height: 4,
                            borderRadius: 2,
                            background: "var(--panel-2)",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              background: tierColor(val),
                              width: `${val}%`,
                              transition: `width 700ms ${200 + gi * 100 + ri * 50}ms var(--ease)`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {tab === "form" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: 12,
              }}
            >
              {(p.form ?? []).map((r, i) => (
                <div
                  key={`ft-${i}`}
                  className="glass anim-slide-up"
                  style={{
                    padding: 14,
                    textAlign: "center",
                    animationDelay: `${i * 80}ms`,
                  }}
                >
                  <span className="t-label" style={{ fontSize: 10 }}>
                    M-{5 - i}
                  </span>
                  <div style={{ marginTop: 10 }}>
                    <RatingDot rating={r} size={48} />
                  </div>
                  <div
                    className="t-caption"
                    style={{ marginTop: 8, fontSize: 11 }}
                  >
                    {r >= 8
                      ? "Maç Adamı"
                      : r >= 7.3
                        ? "Güçlü"
                        : r >= 6.5
                          ? "Ortalama"
                          : "Zayıf"}
                  </div>
                </div>
              ))}
            </div>
          )}
          {tab === "hist" && (
            <div className="glass" style={{ padding: 20 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 14,
                }}
              >
                <Crest clubId={userClubId} size={32} club={userClubCrest} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>
                    {userClubName}
                  </div>{/* Career tab: same user club */}
                  <span className="t-caption">
                    Altyapı · Sezon 1&apos;den beri
                  </span>
                </div>
              </div>
              <div
                style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6 }}
              >
                Bu oyuncu kulübünde yetişti. Transfer geçmişi bulunmuyor. Kulüp
                efsanesi yolunda.
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            padding: "16px 32px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            gap: 10,
            position: "sticky",
            bottom: 0,
            background: "color-mix(in oklab, var(--bg-2) 96%, transparent)",
            backdropFilter: "blur(10px)",
          }}
        >
          <PlayerSheetActions player={p} onClose={onClose} />
        </div>
      </div>
    </div>
  );
}

function PlayerSheetActions({
  player: p,
  onClose,
}: {
  player: Player;
  onClose: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const isTraining = p.status === "training";
  const canFriendly =
    p.status !== "injured" && p.status !== "suspended" && p.id !== undefined;

  const handleToggleTraining = () => {
    if (!p.id) return;
    startTransition(async () => {
      const res = await toggleTraining(p.id!);
      if (res.ok) {
        toast({
          icon: res.status === "training" ? "💪" : "✓",
          title: res.status === "training" ? "Antrenmana kondu" : "Antrenmandan çıktı",
          body: p.n,
          accent: "var(--emerald)",
        });
        router.refresh();
      } else {
        toast({
          icon: "⚠",
          title: "Olmadı",
          body: res.error,
          accent: "var(--danger)",
        });
      }
    });
  };

  const handleFriendly = () => {
    if (!p.id) return;
    startTransition(async () => {
      const res = await playFriendly(p.id!);
      if (res.ok) {
        toast({
          icon: res.ovrBump ? "⭐" : "⚽",
          title: res.ovrBump
            ? `${p.n} 1 basamak yükseldi!`
            : `Dostluk maçı oynandı`,
          body: `Fitness ${res.fitness} · Moral ${res.morale} · ${res.remaining} hak kaldı`,
          accent: res.ovrBump ? "var(--gold)" : "var(--emerald)",
        });
        router.refresh();
      } else {
        toast({
          icon: "⚠",
          title: "Dostluk maçı oynanamadı",
          body: res.error,
          accent: "var(--danger)",
        });
      }
    });
  };

  return (
    <>
      <button
        type="button"
        className="btn btn-primary"
        style={{ flex: 1, justifyContent: "center" }}
        onClick={onClose}
      >
        <Coins size={14} strokeWidth={1.6} /> Transfer Listesine
      </button>
      <button
        type="button"
        className="btn"
        style={{ flex: 1, justifyContent: "center" }}
        disabled={pending || !p.id}
        onClick={handleToggleTraining}
      >
        <Target size={14} strokeWidth={1.6} />{" "}
        {isTraining ? "Antrenmandan Çıkar" : "Antrenmana Koy"}
      </button>
      <button
        type="button"
        className="btn btn-ghost"
        disabled={pending || !canFriendly}
        onClick={handleFriendly}
      >
        <Zap size={14} strokeWidth={1.6} /> Dostluk Maçı
      </button>
      <button
        type="button"
        className="btn btn-ghost"
        disabled={pending || !p.id}
        onClick={() => {
          if (!p.id) return;
          startTransition(async () => {
            const res = await renewContract({ playerId: p.id!, years: 2 });
            if (!res.ok) {
              toast({ icon: "⚠", title: "Sözleşme uzatılamadı", body: res.error, accent: "var(--danger)" });
              return;
            }
            toast({
              icon: "✍",
              title: `${p.n} sözleşme yeniledi`,
              body: `Yeni süre: ${res.newYears} yıl`,
              accent: "var(--emerald)",
            });
            router.refresh();
          });
        }}
      >
        Sözleşme +2y
      </button>
      {p.id && (
        <Link
          href={`/player/${p.id}`}
          className="btn btn-ghost"
          style={{ textDecoration: "none" }}
        >
          Profil →
        </Link>
      )}
    </>
  );
}

// ─── Radar chart ─────────────────────────────────────────────
function RadarChart({ p }: { p: Player }) {
  const stats: Array<[string, number]> = [
    ["PAC", p.pos === "FWD" ? 84 : p.pos === "MID" ? 78 : 72],
    ["SHO", p.pos === "FWD" ? 82 : p.pos === "MID" ? 72 : p.pos === "GK" ? 40 : 55],
    ["PAS", p.pos === "MID" ? 85 : p.pos === "DEF" ? 74 : 72],
    ["DRI", p.pos === "FWD" ? 82 : p.pos === "MID" ? 84 : 68],
    ["DEF", p.pos === "DEF" ? 85 : p.pos === "MID" ? 72 : p.pos === "GK" ? 78 : 55],
    ["PHY", p.pos === "DEF" ? 82 : p.pos === "FWD" ? 78 : p.pos === "GK" ? 80 : 74],
  ];
  const cx = 110;
  const cy = 110;
  const r = 80;
  const pts = stats.map(([, v], i) => {
    const a = ((i * 60 - 90) * Math.PI) / 180;
    const rr = (v / 99) * r;
    return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)] as const;
  });
  return (
    <svg width="100%" viewBox="0 0 220 220" style={{ marginTop: 10 }}>
      <defs>
        <radialGradient id="radarFill">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.45" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.1" />
        </radialGradient>
      </defs>
      {[0.33, 0.66, 1].map((s, i) => {
        const pp = Array.from({ length: 6 })
          .map((_, k) => {
            const a = ((k * 60 - 90) * Math.PI) / 180;
            return `${cx + s * r * Math.cos(a)},${cy + s * r * Math.sin(a)}`;
          })
          .join(" ");
        return (
          <polygon
            key={i}
            points={pp}
            fill={i === 2 ? "var(--panel-2)" : "none"}
            stroke="var(--border)"
            strokeWidth="1"
            opacity={i === 2 ? 0.5 : 1}
          />
        );
      })}
      {stats.map((_, i) => {
        const a = ((i * 60 - 90) * Math.PI) / 180;
        return (
          <line
            key={`ax-${i}`}
            x1={cx}
            y1={cy}
            x2={cx + r * Math.cos(a)}
            y2={cy + r * Math.sin(a)}
            stroke="var(--border)"
            strokeWidth="1"
          />
        );
      })}
      <polygon
        points={pts.map((pt) => pt.join(",")).join(" ")}
        fill="url(#radarFill)"
        stroke="var(--accent)"
        strokeWidth="2.5"
      />
      {pts.map((pt, i) => (
        <circle key={`pt-${i}`} cx={pt[0]} cy={pt[1]} r="4" fill="var(--accent)" />
      ))}
      {stats.map(([l, v], i) => {
        const a = ((i * 60 - 90) * Math.PI) / 180;
        const tx = cx + (r + 18) * Math.cos(a);
        const ty = cy + (r + 18) * Math.sin(a);
        return (
          <g key={`lab-${i}`}>
            <text
              x={tx}
              y={ty}
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="var(--font-jetbrains)"
              fontSize="11"
              fill="var(--muted)"
              fontWeight="700"
            >
              {l}
            </text>
            <text
              x={tx}
              y={ty + 12}
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="var(--font-jetbrains)"
              fontSize="10"
              fill={tierColor(v)}
              fontWeight="700"
            >
              {v}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
