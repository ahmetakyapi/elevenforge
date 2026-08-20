"use client";

import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  Coins,
  Columns3,
  LayoutGrid,
  List,
  Search,
  Target,
  X,
  Zap,
  Dumbbell,
  Square,
  Tag,
  Bandage as BandageIcon,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/toast";
import { playFriendly, toggleTraining } from "./actions";
import { FormationSwitcher } from "./formation-switcher";
import { SquadBoard } from "./squad-board";
import type { FriendlyAllowance } from "@/lib/queries/friendlies";
import { TrainingPanel } from "./training-panel";
import { ComparePanel } from "./compare-panel";
import {
  Crest,
  PosBadge,
  RatingDot,
} from "@/components/ui/primitives";
import { fmtEUR, posColor } from "@/lib/utils";
import { ATTR_LABEL, type TrainableAttr } from "@/lib/attributes";
import type { Player, Position } from "@/types";

export type SquadUiProps = {
  squad: Player[];
  userClubId: string;
  userClubName: string;
  userClubCrest: { color: string; color2: string; short: string };
  /** The club's current shape, for the one-tap switcher. */
  formation: string;
  /** clubs.trainingLevel, 1-5 — feeds the training preview. */
  trainingLevel: number;
  /** Head coach staff tier, 0-3. */
  coachTier: number;
  /** Today's friendly allowance, so the cap is visible before it refuses. */
  friendly: FriendlyAllowance;
};

type PosFilter = Position | "ALL";
type SortKey = "ovr" | "pot" | "age" | "val";
type View = "board" | "grid" | "list";

const avgForm = (p: Player) =>
  !p.form || p.form.length === 0
    ? 0
    : p.form.reduce((a, b) => a + b, 0) / p.form.length;

export default function SquadPage({
  squad,
  userClubId,
  userClubName,
  userClubCrest,
  formation,
  trainingLevel,
  coachTier,
  friendly,
}: SquadUiProps) {
  const [filter, setFilter] = useState<PosFilter>("ALL");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("ovr");
  /*
    The board is the default.

    The card grid was, and it made the page 2,800px tall — seeing your own
    squad took four screenfuls. A squad list is a thing you scan for shape
    (who is thin, who is old, where the quality sits), and you cannot see a
    shape one quarter at a time. The cards are still one tap away for when you
    are judging a single player, which is what they are good at.
  */
  const [view, setView] = useState<View>("board");
  const [selected, setSelected] = useState<Player | null>(null);
  const [hoveredNum, setHoveredNum] = useState<number | null>(null);
  // Compare mode: when active, clicking a player adds it to the slot pair
  // instead of opening the player sheet. Two slots → side-by-side panel.
  const [compareMode, setCompareMode] = useState(false);
  const [compareA, setCompareA] = useState<Player | null>(null);
  const [compareB, setCompareB] = useState<Player | null>(null);

  // Freeze the page behind the sheet. Without this the wheel scrolls the
  // squad list under the dialog, which reads as the modal moving.
  useEffect(() => {
    if (!selected) return;
    document.body.dataset.modalOpen = "true";
    return () => {
      delete document.body.dataset.modalOpen;
    };
  }, [selected]);

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
      <FormationSwitcher current={formation} />

      <TrainingPanel
        squad={squad}
        trainingLevel={trainingLevel}
        coachTier={coachTier}
        friendly={friendly}
      />

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
            <ViewToggle v="board" current={view} onClick={() => setView("board")} />
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

      {/* Results.

          Grouped by line — keeper, defence, midfield, attack — rather than
          one continuous grid of thirty cards. A squad is not a list: the
          question you bring to this screen is almost always positional
          ("who can play right back", "is my midfield thin"), and a flat grid
          sorted by rating makes you scan the whole thing to answer it. Each
          line gets its own headed band with air around it, so the four groups
          read as four things instead of one wall.

          The grouping is suppressed while a position filter is active — one
          heading over one group is a heading that says nothing. */}
      {view === "board" ? (
        <SquadBoard
          squad={filtered}
          onSelect={handlePlayerClick}
          compareMode={compareMode}
          compareA={compareA}
          compareB={compareB}
        />
      ) : view === "grid" ? (
        filter === "ALL" ? (
          <div style={{ display: "grid", gap: 30 }}>
            {POSITION_GROUPS.map(({ pos, label }) => {
              const group = filtered.filter((p) => p.pos === pos);
              if (group.length === 0) return null;
              return (
                <PositionBand
                  key={pos}
                  pos={pos}
                  label={label}
                  players={group}
                  onClick={handlePlayerClick}
                  hoveredNum={hoveredNum}
                  onHover={setHoveredNum}
                  compareMode={compareMode}
                  compareA={compareA}
                  compareB={compareB}
                />
              );
            })}
          </div>
        ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 18,
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
        )
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
  const Icon = v === "board" ? Columns3 : v === "grid" ? LayoutGrid : List;
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

/**
 * The squad header, as a ribbon.
 *
 * It used to be a 200px hero: a 420-unit inline pitch SVG, two radial washes,
 * the club name at clamp(28px, 4vw, 42px), and four boxed stat tiles. Handsome
 * once. But it is the same club, on the same screen, every single time you
 * open it — and it was pushing the thing you came for below the fold, on a
 * page whose entire problem was that you had to scroll to see your own squad.
 *
 * Decoration earns its space on a screen you visit occasionally. This is not
 * one of those. So: one line, the crest, the name, and the five numbers, all
 * of which are things that actually change.
 */
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
  const unavailable = injured + suspended;
  const stats: Array<[string, string, string?]> = [
    ["KADRO", `${squadCount}`, `${activeCount} hazır`],
    ["ORT. OVR", avgOvr],
    ["ORT. YAŞ", avgAge],
    ["DEĞER", fmtEUR(totalVal)],
  ];
  return (
    <header
      data-squad-ribbon
      style={{
        display: "flex",
        alignItems: "center",
        gap: 18,
        flexWrap: "wrap",
        padding: "12px 18px",
        marginBottom: 14,
        borderRadius: 14,
        background: "var(--panel)",
        border: "1px solid var(--border)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
        <Crest clubId={userClubId} size={34} club={userClubCrest} />
        <div style={{ minWidth: 0 }}>
          <div
            className="t-h2"
            style={{ fontSize: 19, lineHeight: 1.1, letterSpacing: "-0.02em" }}
          >
            {userClubName}
          </div>
          <span className="t-label" style={{ fontSize: 9, color: "var(--muted)" }}>
            KADRO YÖNETİMİ
          </span>
        </div>
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
        {stats.map(([label, value, sub]) => (
          <div key={label} style={{ textAlign: "right" }}>
            <span className="t-label" style={{ fontSize: 8.5 }}>
              {label}
            </span>
            <div
              className="t-mono"
              style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.15 }}
            >
              {value}
            </div>
            {sub && (
              <span className="t-caption" style={{ fontSize: 9.5 }}>
                {sub}
              </span>
            )}
          </div>
        ))}
        {/* Only shown when there is something to show. A permanent "0 sakat"
            is a tile that never changes, which is the whole problem above. */}
        {unavailable > 0 && (
          <div
            style={{
              textAlign: "right",
              paddingLeft: 18,
              borderLeft: "1px solid var(--border)",
            }}
          >
            <span className="t-label" style={{ fontSize: 8.5, color: "var(--warn)" }}>
              YOK
            </span>
            <div
              className="t-mono"
              style={{ fontSize: 16, fontWeight: 800, color: "var(--warn)", lineHeight: 1.15 }}
            >
              {unavailable}
            </div>
            <span className="t-caption" style={{ fontSize: 9.5 }}>
              {injured} sakat · {suspended} cezalı
            </span>
          </div>
        )}
      </div>
    </header>
  );
}

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

const POSITION_GROUPS: Array<{ pos: Position; label: string }> = [
  { pos: "GK", label: "Kaleci" },
  { pos: "DEF", label: "Defans" },
  { pos: "MID", label: "Orta Saha" },
  { pos: "FWD", label: "Forvet" },
];

/**
 * One line of the team, in its own band.
 *
 * The band carries a tinted rule and a heading in the position's colour, and
 * the cards sit inside with generous gutters. The tint is deliberately faint:
 * it is there to bound the group, and anything stronger would compete with the
 * cards, which are the thing you are actually reading.
 */
function PositionBand({
  pos,
  label,
  players,
  onClick,
  hoveredNum,
  onHover,
  compareMode,
  compareA,
  compareB,
}: {
  pos: Position;
  label: string;
  players: Player[];
  onClick: (p: Player) => void;
  hoveredNum: number | null;
  onHover: (n: number | null) => void;
  compareMode: boolean;
  compareA: Player | null;
  compareB: Player | null;
}) {
  const tint = posColor(pos);
  const avg =
    players.length === 0
      ? 0
      : Math.round(
          (players.reduce((sum, p) => sum + p.ovr, 0) / players.length) * 10,
        ) / 10;

  return (
    <section>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <PosBadge pos={pos} size={26} />
        <h2
          style={{
            fontFamily: "var(--font-manrope)",
            fontSize: 17,
            fontWeight: 750,
            letterSpacing: "-0.015em",
            color: "var(--text)",
            margin: 0,
          }}
        >
          {label}
        </h2>
        <span
          className="t-mono"
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            padding: "3px 9px",
            borderRadius: 999,
            background: `color-mix(in oklab, ${tint} 15%, transparent)`,
            color: tint,
          }}
        >
          {players.length} oyuncu · ort {avg}
        </span>
        {/* A rule that runs to the edge, so the eye reads the band as a
            container without needing a box around it. */}
        <span
          aria-hidden
          style={{
            flex: 1,
            height: 1,
            background: `linear-gradient(90deg, color-mix(in oklab, ${tint} 35%, transparent), transparent)`,
          }}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: 18,
        }}
      >
        {players.map((p, i) => (
          <PlayerCardGrid
            key={p.num ?? p.n}
            p={p}
            i={i}
            onClick={() => onClick(p)}
            hovered={hoveredNum === p.num}
            onHover={onHover}
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
    </section>
  );
}

/**
 * The squad card, built as a football card.
 *
 * The previous card was a small dashboard panel: a header row, a name, a meta
 * line, three attribute bars and a footer strip. It carried the right data and
 * none of the feeling — every player looked like every other player, and the
 * difference between an 85 and a 68 was a number in a corner.
 *
 * A football card front-loads three things and lets everything else recede:
 * the rating, the face of the player (his name), and the six attributes. The
 * tier owns the card's colour, so a squad reads as a spread of gold, green and
 * grey before a single number is read — which is exactly how you actually
 * assess a squad.
 *
 * SIX ATTRIBUTES, ALWAYS. The old card showed three, chosen by role. That made
 * cards incomparable: you could not tell whether the winger's missing DEF was
 * 40 or 75. Six in a fixed order means any two cards can be read against each
 * other, which is the whole point of a card.
 */
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
  const tier = tierPalette(p.ovr);
  const status = STATUS_STYLE[p.status ?? "_"] ?? null;
  const growth = p.pot - p.ovr;
  const form = (p.form ?? []).slice(-5);
  const fit = p.fit ?? 0;

  // Fixed order, fixed labels — the FIFA convention, so the eye learns one
  // layout and reads every card with it.
  const STATS: Array<[keyof Player, string]> = [
    ["pace", "HIZ"],
    ["shooting", "ŞUT"],
    ["passing", "PAS"],
    ["defending", "DEF"],
    ["physical", "FİZ"],
    ["goalkeeping", "KAL"],
  ];

  return (
    <article
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
      className="anim-slide-up player-card"
      style={{
        animationDelay: `${Math.min(i * 26, 320)}ms`,
        position: "relative",
        borderRadius: 18,
        overflow: "hidden",
        cursor: "pointer",
        // The tier tints the whole card, not just a stripe. This is the one
        // gradient here and it is a surface depth, not a colour transition —
        // the same exemption the glass panels use.
        background: `linear-gradient(168deg,
          color-mix(in oklab, ${tier.accent} 20%, var(--panel)) 0%,
          var(--panel) 46%,
          var(--panel-2) 100%)`,
        border: compareMark
          ? "2px solid var(--accent)"
          : `1px solid color-mix(in oklab, ${tier.accent} ${localHover ? 55 : 28}%, var(--border))`,
        transform: localHover ? "translateY(-4px)" : "translateY(0)",
        boxShadow: localHover ? tier.glow : "var(--shadow-sm)",
        transition:
          "transform 240ms var(--ease), box-shadow 240ms var(--ease), border-color 240ms var(--ease)",
      }}
    >
      {compareMark && (
        <span
          style={{
            position: "absolute",
            top: 10,
            right: 10,
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
        </span>
      )}

      {/* ── Head: rating block on the left, identity on the right ────── */}
      <div style={{ display: "flex", gap: 14, padding: "16px 16px 12px" }}>
        <div style={{ textAlign: "center", flexShrink: 0, minWidth: 52 }}>
          <div
            style={{
              fontFamily: "var(--font-manrope)",
              fontSize: 42,
              fontWeight: 800,
              lineHeight: 0.92,
              letterSpacing: "-0.045em",
              color: tier.accent,
            }}
          >
            {p.ovr}
          </div>
          <div
            className="t-mono"
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: tier.accent,
              marginTop: 2,
            }}
          >
            {p.pos}
          </div>
          {growth > 0 && (
            <div
              className="t-mono"
              title={`Potansiyel ${p.pot}`}
              style={{
                fontSize: 9.5,
                fontWeight: 700,
                color: "var(--emerald)",
                marginTop: 4,
              }}
            >
              ↑{growth}
            </div>
          )}
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontFamily: "var(--font-manrope)",
              fontWeight: 750,
              fontSize: 16,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              color: "var(--text)",
              // Two lines, then ellipsis: a long name must not push the stats
              // grid down and make the cards different heights.
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
            title={p.n}
          >
            {p.n}
          </div>
          <div
            className="t-mono"
            style={{
              fontSize: 10,
              color: "var(--muted)",
              marginTop: 4,
              letterSpacing: "0.06em",
            }}
          >
            {p.role} · {p.nat} · {p.age}y
            {p.num !== undefined && ` · #${p.num}`}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 7,
              flexWrap: "wrap",
            }}
          >
            <span
              className="t-mono"
              style={{
                fontSize: 9.5,
                fontWeight: 700,
                letterSpacing: "0.07em",
                padding: "2px 7px",
                borderRadius: 5,
                background: `color-mix(in oklab, ${tier.accent} 16%, transparent)`,
                color: tier.accent,
              }}
            >
              {tier.label}
            </span>
            {status && (
              <span
                className="t-mono"
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  padding: "2px 6px",
                  borderRadius: 5,
                  background: status.bg,
                  color: status.c,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <status.Icon size={9} strokeWidth={2.4} />
                {status.label}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Six attributes, two columns of three ─────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "6px 16px",
          padding: "0 16px 12px",
        }}
      >
        {STATS.map(([key, label]) => {
          const v = (p[key] as number | undefined) ?? 0;
          return (
            <div
              key={key as string}
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 7,
              }}
            >
              <span
                className="t-mono"
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  minWidth: 22,
                  color: attrTone(v),
                }}
              >
                {v}
              </span>
              <span
                className="t-label"
                style={{ fontSize: 9.5, letterSpacing: "0.1em" }}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Foot: value, condition, form ─────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "9px 16px",
          borderTop: "1px solid var(--border)",
          background: "color-mix(in oklab, var(--bg-2) 55%, transparent)",
        }}
      >
        <span
          className="t-mono"
          style={{ fontSize: 12.5, fontWeight: 700, color: "var(--emerald)" }}
        >
          {fmtEUR(p.val ?? 0)}
        </span>

        <span
          className="t-mono"
          title={`Kondisyon ${fit}`}
          style={{
            fontSize: 11,
            fontWeight: 700,
            marginLeft: "auto",
            color:
              fit >= 90
                ? "var(--emerald)"
                : fit >= 75
                  ? "var(--cyan)"
                  : "var(--warn)",
          }}
        >
          {fit}
        </span>

        <div
          style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 14 }}
          title={
            form.length
              ? `Son ${form.length} maç: ${form.join(" · ")}`
              : "Henüz maç oynamadı"
          }
        >
          {form.map((f, j) => (
            <span
              key={`f-${j}`}
              style={{
                width: 4,
                height: `${Math.max(24, Math.min(100, (f / 10) * 100))}%`,
                borderRadius: 1.5,
                background: formTone(f),
              }}
            />
          ))}
        </div>
      </div>
    </article>
  );
}

/**
 * Attribute colour band.
 *
 * The same thresholds a football card uses, so 90+ reads as exceptional at a
 * glance and a 45 reads as a hole — without the reader having to know what
 * "good" is for that attribute.
 */
/** Match-rating colour band, shared by the card's form sparkline. */
function formTone(rating: number): string {
  if (rating >= 8) return "var(--gold)";
  if (rating >= 7) return "var(--emerald)";
  if (rating >= 6) return "var(--cyan)";
  return "var(--muted-2)";
}

function attrTone(v: number): string {
  if (v >= 88) return "var(--gold)";
  if (v >= 78) return "var(--emerald)";
  if (v >= 68) return "var(--cyan)";
  if (v >= 55) return "var(--text-2)";
  return "var(--muted)";
}

const STATUS_STYLE: Record<
  string,
  { bg: string; c: string; label: string; Icon: LucideIcon }
> = {
  injured: {
    bg: "color-mix(in oklab, var(--danger) 20%, transparent)",
    c: "var(--danger)",
    label: "SAKAT",
    Icon: BandageIcon,
  },
  suspended: {
    bg: "color-mix(in oklab, var(--warn) 20%, transparent)",
    c: "var(--warn)",
    label: "CEZALI",
    Icon: Square,
  },
  listed: {
    bg: "color-mix(in oklab, var(--emerald) 20%, transparent)",
    c: "var(--emerald)",
    label: "SATIŞTA",
    Icon: Tag,
  },
  training: {
    bg: "color-mix(in oklab, var(--cyan) 20%, transparent)",
    c: "var(--cyan)",
    label: "EĞİTİM",
    Icon: Dumbbell,
  },
};

// ─── Player table (list view) ───────────────────────────────
/**
 * The dense view.
 *
 * This is not a smaller version of the card grid — it answers a different
 * question. The cards are for judging one player; the table is for comparing
 * thirty, which means every column has to be a number you can scan down. So it
 * shows all six attributes as figures rather than three as bars: a bar tells
 * you "quite high", and comparing quite-high to quite-high down a column is
 * exactly the thing a table exists to make unnecessary.
 *
 * It is a real table element. The previous version was nested divs with a
 * `gridTemplateColumns` string repeated in two places — headers and rows drift
 * apart the moment a column is added, and a screen reader gets a pile of
 * unlabelled text. `position: sticky` on the head keeps the labels while you
 * scroll a thirty-player squad.
 */
function PlayerTable({
  list,
  onSelect,
}: {
  list: Player[];
  onSelect: (p: Player) => void;
}) {
  const COLS: Array<[keyof Player, string]> = [
    ["pace", "HIZ"],
    ["shooting", "ŞUT"],
    ["passing", "PAS"],
    ["defending", "DEF"],
    ["physical", "FİZ"],
    ["goalkeeping", "KAL"],
  ];

  return (
    <div
      data-dense-table
      data-dense-table-xwide
      style={{
        borderRadius: 16,
        border: "1px solid var(--border)",
        background: "var(--panel)",
        overflow: "auto",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 13,
        }}
      >
        <thead>
          <tr>
            {[
              ["", "left"],
              ["OYUNCU", "left"],
              ["OVR", "center"],
              ["POT", "center"],
              ["YAŞ", "center"],
              ...COLS.map(([, l]) => [l, "center"] as [string, string]),
              ["KOND", "center"],
              ["FORM", "center"],
              ["DEĞER", "right"],
            ].map(([label, align], idx) => (
              <th
                key={`${label}-${idx}`}
                className="t-label"
                style={{
                  position: "sticky",
                  top: 0,
                  zIndex: 1,
                  fontSize: 9.5,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textAlign: align as "left" | "center" | "right",
                  padding: "11px 8px",
                  background: "var(--panel-2)",
                  borderBottom: "1px solid var(--border)",
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {list.map((p, i) => {
            const tier = tierPalette(p.ovr);
            const status = STATUS_STYLE[p.status ?? "_"] ?? null;
            const growth = p.pot - p.ovr;
            const fit = p.fit ?? 0;
            return (
              <tr
                key={p.num ?? p.n}
                onClick={() => onSelect(p)}
                className="squad-row"
                style={{
                  cursor: "pointer",
                  background:
                    i % 2 === 0
                      ? "color-mix(in oklab, var(--panel-2) 38%, transparent)"
                      : "transparent",
                }}
              >
                <td style={{ padding: "8px 8px 8px 14px", width: 30 }}>
                  <PosBadge pos={p.pos} size={20} />
                </td>

                <td style={{ padding: "8px", minWidth: 190 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      minWidth: 0,
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 620,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {p.n}
                    </span>
                    {status && (
                      <status.Icon
                        size={11}
                        strokeWidth={2.2}
                        style={{ color: status.c, flexShrink: 0 }}
                        aria-label={status.label}
                      />
                    )}
                  </div>
                  <span
                    className="t-mono"
                    style={{ fontSize: 9.5, color: "var(--muted)" }}
                  >
                    {p.role} · {p.nat}
                    {p.num !== undefined && ` · #${p.num}`}
                  </span>
                </td>

                <td style={{ padding: "8px", textAlign: "center" }}>
                  <span
                    className="t-mono"
                    style={{ fontSize: 15, fontWeight: 800, color: tier.accent }}
                  >
                    {p.ovr}
                  </span>
                </td>

                <td style={{ padding: "8px", textAlign: "center" }}>
                  <span
                    className="t-mono"
                    style={{
                      fontSize: 12,
                      color: growth > 0 ? "var(--emerald)" : "var(--muted)",
                    }}
                  >
                    {p.pot}
                    {growth > 0 && (
                      <span style={{ fontSize: 9.5 }}> +{growth}</span>
                    )}
                  </span>
                </td>

                <td
                  className="t-mono"
                  style={{
                    padding: "8px",
                    textAlign: "center",
                    fontSize: 12,
                    color: "var(--muted)",
                  }}
                >
                  {p.age}
                </td>

                {/* All six, as figures. This is the column you scan. */}
                {COLS.map(([key]) => {
                  const v = (p[key] as number | undefined) ?? 0;
                  return (
                    <td
                      key={key as string}
                      className="t-mono"
                      style={{
                        padding: "8px",
                        textAlign: "center",
                        fontSize: 12.5,
                        fontWeight: 700,
                        color: attrTone(v),
                      }}
                    >
                      {v}
                    </td>
                  );
                })}

                <td
                  className="t-mono"
                  style={{
                    padding: "8px",
                    textAlign: "center",
                    fontSize: 12,
                    fontWeight: 700,
                    color:
                      fit >= 90
                        ? "var(--emerald)"
                        : fit >= 75
                          ? "var(--cyan)"
                          : "var(--warn)",
                  }}
                >
                  {fit}
                </td>

                <td style={{ padding: "8px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-end",
                      justifyContent: "center",
                      gap: 2,
                      height: 13,
                    }}
                  >
                    {(p.form ?? []).slice(-5).map((f, j) => (
                      <span
                        key={`f-${j}`}
                        style={{
                          width: 3.5,
                          height: `${Math.max(24, Math.min(100, (f / 10) * 100))}%`,
                          borderRadius: 1.5,
                          background: formTone(f),
                        }}
                      />
                    ))}
                  </div>
                </td>

                <td
                  className="t-mono"
                  style={{
                    padding: "8px 14px 8px 8px",
                    textAlign: "right",
                    fontSize: 12.5,
                    fontWeight: 650,
                    color: "var(--emerald)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {fmtEUR(p.val ?? 0)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}


// ─── Player sheet (modal detail) ─────────────────────────────
/**
 * The player detail sheet, rebuilt as a card.
 *
 * ─── Two things were wrong ──────────────────────────────────────────────
 *
 * 1. THE NUMBERS WERE FICTION. The attribute panel and the radar were built
 *    from literals keyed off the position — `["Hız", 82]`, `["Dripling", 81]`,
 *    `p.pos === "FWD" ? 84 : 72`. Every goalkeeper in the game showed the
 *    same six figures, and none of them were his. The real attributes were
 *    sitting on the row the whole time (the card grid reads them), so the one
 *    screen dedicated to a single player was the only screen not showing him.
 *
 * 2. THE ATTRIBUTES WERE BELOW THE FOLD. A 120px shirt tile, a name at 42px,
 *    a chip row, then a 220px radar and a contract panel — and only then, past
 *    a tab bar, the attributes. You had to scroll a dialog to find the thing
 *    you opened it for, and the sticky action bar covered the top of it.
 *
 * The fix for both is the same: make the card BE the detail. Six real
 * attributes sit in the top-left, above the fold on any laptop, in the fixed
 * FIFA order so this sheet and the squad grid read identically. The radar is
 * gone — it was the same six numbers drawn a second time, and dropping 220px
 * of duplicate is most of what makes this compact.
 */
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
  const tier = tierPalette(p.ovr);
  const growth = p.pot - p.ovr;
  const form = p.form ?? [];
  const fit = p.fit ?? 0;

  // Rendered into <body>, not in place.
  //
  // The bug this was written for is now fixed at its source: <main> carried
  // `animation: page-enter ... both`, and a fill-mode animation leaves the
  // final keyframe's transform on the element forever, which made <main> the
  // containing block for every fixed-position descendant in the app. See the
  // note on [data-page-enter] in app/globals.css.
  //
  // The portal stays anyway. It costs nothing and it makes this dialog
  // independent of whatever any ancestor does later — a `filter`,
  // `backdrop-filter` or `will-change: transform` added to a wrapper in a
  // year's time would silently reintroduce exactly the same symptom, and the
  // symptom (a dialog somewhere down the page) does not point at its cause.
  if (typeof document === "undefined") return null;
  return createPortal(
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
        alignItems: "center",
        padding: 20,
      }}
    >
      <div
        data-modal-sheet
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 860,
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          borderRadius: 22,
          border: "1px solid var(--border-strong)",
          animation: "modal-in 260ms var(--ease)",
          background: `
            radial-gradient(560px 260px at 12% 0%, color-mix(in oklab, ${tier.accent} 14%, transparent), transparent 62%),
            var(--bg-2)`,
          boxShadow: "0 30px 90px -20px rgba(0,0,0,0.6)",
        }}
      >
        {/* ── Identity strip. One line of meta, one name, nothing else. ── */}
        <div
          style={{
            padding: "18px 22px 14px",
            borderBottom: "1px solid var(--border)",
            position: "relative",
          }}
        >
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ position: "absolute", top: 12, right: 12 }}
            onClick={onClose}
            aria-label="Kapat"
          >
            <X size={16} strokeWidth={1.6} />
          </button>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 6,
            }}
          >
            <Crest clubId={userClubId} size={18} club={userClubCrest} />
            <span className="t-mono" style={{ fontSize: 10.5, color: "var(--muted)", letterSpacing: "0.06em" }}>
              {userClubName} · {p.nat} · {p.role}
              {p.num !== undefined && ` · #${p.num}`}
            </span>
            {p.status && STATUS_STYLE[p.status] && (
              <span
                className="t-mono"
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  padding: "2px 6px",
                  borderRadius: 5,
                  background: STATUS_STYLE[p.status].bg,
                  color: STATUS_STYLE[p.status].c,
                }}
              >
                {STATUS_STYLE[p.status].label}
              </span>
            )}
          </div>
          <div
            style={{
              fontFamily: "var(--font-manrope)",
              fontWeight: 800,
              fontSize: "clamp(24px, 3.4vw, 34px)",
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              color: "var(--text)",
              paddingRight: 44,
            }}
          >
            {p.n}
          </div>
        </div>

        {/* ── Card on the left, everything about him on the right ─────── */}
        <div data-sheet-body style={{ display: "grid", gridTemplateColumns: "268px 1fr", gap: 16, padding: 18 }}>
          {/* The card. This is the point of the screen, so it is first in
              the DOM and first on the page. */}
          <div
            style={{
              borderRadius: 18,
              overflow: "hidden",
              border: `1px solid color-mix(in oklab, ${tier.accent} 35%, var(--border))`,
              background: `linear-gradient(168deg,
                color-mix(in oklab, ${tier.accent} 22%, var(--panel)) 0%,
                var(--panel) 48%,
                var(--panel-2) 100%)`,
              alignSelf: "start",
            }}
          >
            <div style={{ display: "flex", gap: 12, padding: "16px 16px 12px", alignItems: "center" }}>
              <div style={{ textAlign: "center", minWidth: 62 }}>
                <div
                  style={{
                    fontFamily: "var(--font-manrope)",
                    fontSize: 46,
                    fontWeight: 800,
                    lineHeight: 0.9,
                    letterSpacing: "-0.05em",
                    color: tier.accent,
                  }}
                >
                  {p.ovr}
                </div>
                <div
                  className="t-mono"
                  style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.1em", color: tier.accent, marginTop: 3 }}
                >
                  {p.pos}
                </div>
              </div>
              <div style={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <span
                  className="t-mono"
                  style={{
                    fontSize: 9.5,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    padding: "3px 8px",
                    borderRadius: 6,
                    background: `color-mix(in oklab, ${tier.accent} 18%, transparent)`,
                    color: tier.accent,
                    alignSelf: "flex-start",
                  }}
                >
                  {tier.label}
                </span>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span className="t-label" style={{ fontSize: 9 }}>POT</span>
                  <span
                    className="t-mono"
                    style={{ fontSize: 15, fontWeight: 800, color: growth > 0 ? "var(--emerald)" : "var(--text-2)" }}
                  >
                    {p.pot}
                  </span>
                  {growth > 0 && (
                    <span className="t-mono" style={{ fontSize: 10, color: "var(--emerald)" }}>
                      +{growth}
                    </span>
                  )}
                </div>
                <span className="t-mono" style={{ fontSize: 10, color: "var(--muted)" }}>
                  {p.age} yaş
                </span>
              </div>
            </div>

            {/* Six real attributes, fixed FIFA order — identical to the
                squad grid, so a card here and a card there are comparable. */}
            <div style={{ padding: "0 16px 14px", display: "flex", flexDirection: "column", gap: 9 }}>
              {SHEET_STATS.map(([key, label]) => {
                const v = (p[key] as number | undefined) ?? 0;
                return (
                  <div key={key as string} style={{ display: "grid", gridTemplateColumns: "34px 26px 1fr", gap: 8, alignItems: "center" }}>
                    <span className="t-label" style={{ fontSize: 9.5, letterSpacing: "0.1em" }}>{label}</span>
                    <span
                      className="t-mono"
                      style={{ fontSize: 13, fontWeight: 800, color: attrTone(v), textAlign: "right" }}
                    >
                      {v}
                    </span>
                    <div style={{ height: 4, borderRadius: 2, background: "var(--panel-2)", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          background: attrTone(v),
                          width: "100%",
                          transformOrigin: "left",
                          transform: `scaleX(${Math.max(0, Math.min(1, v / 99))})`,
                          transition: "transform 600ms var(--ease)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 16px",
                borderTop: "1px solid var(--border)",
                background: "color-mix(in oklab, var(--bg-2) 55%, transparent)",
              }}
            >
              <span className="t-mono" style={{ fontSize: 13, fontWeight: 700, color: "var(--emerald)" }}>
                {fmtEUR(p.val ?? 0)}
              </span>
              <span className="t-mono" style={{ fontSize: 10.5, color: "var(--muted)" }}>
              </span>
            </div>
          </div>

          {/* ── Right column: condition, contract, form, career ───────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              <StatTile
                label="KONDİSYON"
                value={String(fit)}
                tone={fit >= 90 ? "var(--emerald)" : fit >= 75 ? "var(--cyan)" : "var(--warn)"}
                bar={fit / 100}
              />
              <StatTile
                label="MORAL"
                value={`${p.mor ?? 0}/5`}
                tone={(p.mor ?? 0) >= 4 ? "var(--emerald)" : (p.mor ?? 0) >= 3 ? "var(--cyan)" : "var(--warn)"}
                bar={(p.mor ?? 0) / 5}
              />
              <StatTile
                label="SON 5 ORT."
                value={form.length ? avgForm(p).toFixed(2) : "—"}
                tone={avgForm(p) >= 7.3 ? "var(--emerald)" : "var(--text)"}
                bar={form.length ? Math.min(1, avgForm(p) / 10) : 0}
              />
            </div>

            {/* The contract panel used to live here. Contracts and wages are
                gone from the game (see lib/economy.ts), so what a manager
                wants in this slot is the thing that DOES change about a
                player he owns: how far he still has to run. */}
            <div className="glass" style={{ padding: 14 }}>
              <span className="t-label">GELİŞİM</span>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 10 }}>
                <span className="t-mono" style={{ fontSize: 20, fontWeight: 800, color: tier.accent }}>
                  {p.ovr}
                </span>
                <span className="t-caption" style={{ fontSize: 11 }}>→</span>
                <span
                  className="t-mono"
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: growth > 0 ? "var(--emerald)" : "var(--muted)",
                  }}
                >
                  {p.pot}
                </span>
                <span className="t-caption" style={{ fontSize: 11, marginLeft: "auto" }}>
                  {growth > 0 ? `+${growth} kaldı` : "tavanında"}
                </span>
              </div>
              <div
                style={{
                  height: 5,
                  borderRadius: 999,
                  background: "var(--panel-2)",
                  overflow: "hidden",
                  marginTop: 10,
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: "100%",
                    background: tier.accent,
                    transformOrigin: "left",
                    transform: `scaleX(${p.pot > 0 ? Math.min(1, p.ovr / p.pot) : 1})`,
                    transition: "transform 600ms var(--ease)",
                  }}
                />
              </div>
            </div>

            <div className="glass" style={{ padding: 14 }}>
              <span className="t-label">FORM GEÇMİŞİ</span>
              {form.length ? (
                <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                  {form.map((r, i) => (
                    <div key={`f-${i}`} style={{ textAlign: "center" }}>
                      <RatingDot rating={r} size={36} />
                      <div className="t-mono" style={{ fontSize: 9, color: "var(--muted)", marginTop: 4 }}>
                        M-{form.length - i}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="t-caption" style={{ fontSize: 12, marginTop: 10 }}>
                  Henüz maça çıkmadı.
                </p>
              )}
            </div>

            {p.trainingFocus && (
              <div className="glass" style={{ padding: 14 }}>
                <span className="t-label">ANTRENMAN ODAĞI</span>
                <div className="t-mono" style={{ fontSize: 14, fontWeight: 700, marginTop: 8, color: "var(--accent)" }}>
                  {ATTR_LABEL[p.trainingFocus as TrainableAttr] ?? p.trainingFocus}
                </div>
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            padding: "14px 22px",
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
    </div>,
    document.body,
  );
}

/** Fixed order, shared with the squad grid so two cards can be read against each other. */
const SHEET_STATS: Array<[keyof Player, string]> = [
  ["pace", "HIZ"],
  ["shooting", "ŞUT"],
  ["passing", "PAS"],
  ["defending", "DEF"],
  ["physical", "FİZ"],
  ["goalkeeping", "KAL"],
];

function StatTile({
  label,
  value,
  tone,
  bar,
}: {
  label: string;
  value: string;
  tone: string;
  bar: number;
}) {
  return (
    <div className="glass" style={{ padding: "10px 12px" }}>
      <span className="t-label" style={{ fontSize: 9 }}>{label}</span>
      <div className="t-mono" style={{ fontSize: 18, fontWeight: 800, color: tone, marginTop: 4 }}>
        {value}
      </div>
      <div style={{ height: 3, borderRadius: 2, background: "var(--panel-2)", overflow: "hidden", marginTop: 6 }}>
        <div
          style={{
            height: "100%",
            background: tone,
            width: "100%",
            transformOrigin: "left",
            transform: `scaleX(${Math.max(0, Math.min(1, bar))})`,
            transition: "transform 600ms var(--ease)",
          }}
        />
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
          icon: res.status === "training" ? "▲" : "✓",
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
          icon: res.ovrBump ? "▲" : "✓",
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
