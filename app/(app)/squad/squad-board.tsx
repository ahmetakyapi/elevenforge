"use client";

/**
 * The squad, on one screen.
 *
 * ─── The problem ────────────────────────────────────────────────────────
 *
 * The squad page was 2,800px tall. A hero block with the club name at 42px,
 * four stat tiles, a formation bar, four training cards, a toolbar, and then
 * thirty player cards stacked in four position bands. Every one of those
 * pieces was fine on its own; together they meant that seeing your own squad
 * took four screenfuls of scrolling, and comparing a centre-back to another
 * centre-back meant remembering one while you scrolled to the other.
 *
 * A squad list is a thing you SCAN. The whole point is the shape of the
 * group: who is thin, who is old, where the quality is. Scrolling destroys
 * that — you cannot see a shape one quarter at a time.
 *
 * ─── The layout ─────────────────────────────────────────────────────────
 *
 * Four columns, one per line of the team, filled top to bottom. A thirty-man
 * squad is at most ten or eleven players in the biggest column, so the entire
 * squad lands inside a single viewport at 38px a row — and the columns
 * themselves carry the information the old bands were spelling out in
 * headings: how deep each position is, and where the strength sits.
 *
 * Each row is one line and stays one line. Position colour on the left edge,
 * shirt number, name, the three attributes that matter for that line, then
 * the rating. Everything else — the full six attributes, contract, form —
 * lives one click away in the player sheet, which is where detail belongs.
 * A row that tries to be a card is what made the cards 180px tall.
 */

import { useMemo } from "react";
import { AlertTriangle, Ban, Dumbbell, Tag } from "lucide-react";
import type { Player, Position } from "@/types";
import { fmtEUR } from "@/lib/utils";

const GROUPS: Array<{ pos: Position; label: string; token: string }> = [
  { pos: "GK", label: "Kaleci", token: "var(--pos-gk)" },
  { pos: "DEF", label: "Defans", token: "var(--pos-def)" },
  { pos: "MID", label: "Orta Saha", token: "var(--pos-mid)" },
  { pos: "FWD", label: "Forvet", token: "var(--pos-fwd)" },
];

/**
 * The three attributes worth printing for each line.
 *
 * Not six. Six is what the card shows and what the sheet shows, and it is the
 * right number when you are judging one player. Scanning a column for "who is
 * my quickest full-back" needs the three that decide that job and nothing
 * else — the other three are noise at this density, and they are what forced
 * the old rows to be two lines tall.
 */
const KEY_ATTRS: Record<Position, Array<[keyof Player, string]>> = {
  GK: [
    ["goalkeeping", "KAL"],
    ["physical", "FİZ"],
    ["passing", "PAS"],
  ],
  DEF: [
    ["defending", "DEF"],
    ["physical", "FİZ"],
    ["pace", "HIZ"],
  ],
  MID: [
    ["passing", "PAS"],
    ["defending", "DEF"],
    ["physical", "FİZ"],
  ],
  FWD: [
    ["shooting", "ŞUT"],
    ["pace", "HIZ"],
    ["physical", "FİZ"],
  ],
};

const STATUS_ICON: Record<
  string,
  { Icon: typeof AlertTriangle; c: string; label: string }
> = {
  injured: { Icon: AlertTriangle, c: "var(--danger)", label: "Sakat" },
  suspended: { Icon: Ban, c: "var(--warn)", label: "Cezalı" },
  training: { Icon: Dumbbell, c: "var(--accent)", label: "Antrenmanda" },
  listed: { Icon: Tag, c: "var(--cyan)", label: "Listede" },
};

function ovrTone(v: number): string {
  if (v >= 85) return "var(--gold)";
  if (v >= 80) return "var(--emerald)";
  if (v >= 75) return "var(--cyan)";
  if (v >= 68) return "var(--text)";
  return "var(--muted)";
}

function attrTone(v: number): string {
  if (v >= 85) return "var(--gold)";
  if (v >= 76) return "var(--emerald)";
  if (v >= 66) return "var(--cyan)";
  return "var(--muted)";
}

export function SquadBoard({
  squad,
  onSelect,
  compareMode,
  compareA,
  compareB,
}: {
  squad: Player[];
  onSelect: (p: Player) => void;
  compareMode: boolean;
  compareA: Player | null;
  compareB: Player | null;
}) {
  const byGroup = useMemo(() => {
    const m = new Map<Position, Player[]>();
    for (const g of GROUPS) {
      m.set(
        g.pos,
        squad
          .filter((p) => p.pos === g.pos)
          .sort((a, b) => b.ovr - a.ovr),
      );
    }
    return m;
  }, [squad]);

  return (
    <div
      data-squad-board
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        gap: 14,
        alignItems: "start",
      }}
    >
      {GROUPS.map((g) => {
        const list = byGroup.get(g.pos) ?? [];
        const avg =
          list.length === 0
            ? 0
            : Math.round(list.reduce((s, p) => s + p.ovr, 0) / list.length);
        return (
          <section
            key={g.pos}
            style={{
              borderRadius: 14,
              border: "1px solid var(--border)",
              background: "var(--panel)",
              overflow: "hidden",
            }}
          >
            {/* Band head. Depth and average rating are the two things you
                want to know about a line before you read any of its names. */}
            <header
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "9px 12px",
                borderBottom: "1px solid var(--border)",
                background: `color-mix(in oklab, ${g.token} 10%, transparent)`,
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 4,
                  height: 16,
                  borderRadius: 2,
                  background: g.token,
                  flexShrink: 0,
                }}
              />
              <span
                className="t-label"
                style={{ fontSize: 10, color: g.token, letterSpacing: "0.1em" }}
              >
                {g.label.toUpperCase()}
              </span>
              <div style={{ flex: 1 }} />
              <span
                className="t-mono"
                style={{ fontSize: 10, color: "var(--muted)" }}
              >
                {list.length}
              </span>
              {list.length > 0 && (
                <span
                  className="t-mono"
                  style={{ fontSize: 11, fontWeight: 700, color: ovrTone(avg) }}
                  title="Ortalama reyting"
                >
                  {avg}
                </span>
              )}
            </header>

            {list.length === 0 ? (
              <p
                className="t-caption"
                style={{ fontSize: 11.5, padding: "14px 12px", margin: 0 }}
              >
                Bu mevkide oyuncun yok.
              </p>
            ) : (
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {list.map((p, i) => (
                  <BoardRow
                    key={p.id ?? `${p.n}-${i}`}
                    p={p}
                    striped={i % 2 === 1}
                    onSelect={onSelect}
                    mark={
                      compareMode && compareA?.n === p.n
                        ? "A"
                        : compareMode && compareB?.n === p.n
                          ? "B"
                          : null
                    }
                  />
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

function BoardRow({
  p,
  striped,
  onSelect,
  mark,
}: {
  p: Player;
  striped: boolean;
  onSelect: (p: Player) => void;
  mark: "A" | "B" | null;
}) {
  const status = p.status ? STATUS_ICON[p.status] : undefined;
  const attrs = KEY_ATTRS[p.pos];
  const growth = p.pot - p.ovr;

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(p)}
        className="squad-board-row"
        style={{
          width: "100%",
          display: "grid",
          gridTemplateColumns: "26px minmax(0, 1fr) auto 30px",
          alignItems: "center",
          gap: 8,
          padding: "7px 10px",
          border: "none",
          borderLeft: mark
            ? "3px solid var(--accent)"
            : "3px solid transparent",
          background: striped
            ? "color-mix(in oklab, var(--panel-2) 45%, transparent)"
            : "transparent",
          cursor: "pointer",
          textAlign: "left",
          font: "inherit",
          color: "inherit",
        }}
      >
        <span
          className="t-mono"
          style={{ fontSize: 10.5, color: "var(--muted)" }}
        >
          {p.num ?? "–"}
        </span>

        <span style={{ minWidth: 0, display: "flex", alignItems: "center", gap: 5 }}>
          <span
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={`${p.n} · ${p.role} · ${p.age} yaş · ${fmtEUR(p.val ?? 0)}`}
          >
            {p.n}
          </span>
          {status && (
            <status.Icon
              size={10}
              strokeWidth={2.4}
              style={{ color: status.c, flexShrink: 0 }}
              aria-label={status.label}
            />
          )}
        </span>

        {/* The three numbers this line is judged on. */}
        <span style={{ display: "flex", gap: 6 }}>
          {attrs.map(([key, label]) => {
            const v = (p[key] as number | undefined) ?? 0;
            return (
              <span
                key={key as string}
                className="t-mono"
                title={label}
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: attrTone(v),
                  minWidth: 17,
                  textAlign: "right",
                }}
              >
                {v}
              </span>
            );
          })}
        </span>

        <span
          className="t-mono"
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: ovrTone(p.ovr),
            textAlign: "right",
            position: "relative",
          }}
        >
          {p.ovr}
          {growth > 0 && (
            <span
              aria-hidden
              title={`Potansiyel ${p.pot}`}
              style={{
                position: "absolute",
                top: -5,
                right: -6,
                fontSize: 7.5,
                fontWeight: 700,
                color: "var(--emerald)",
              }}
            >
              +{growth}
            </span>
          )}
        </span>
      </button>
    </li>
  );
}
