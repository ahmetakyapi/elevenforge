import { Target } from "lucide-react";
import { goalLabel, type BoardGoal } from "@/lib/jobs/board";

/**
 * Compact season-objective banner. Shows the board's expected finish and
 * current confidence — a 0-100 bar that drops when seasons end below
 * target. Hits 0 → manager fired (action handled in season.ts).
 */
export function BoardBanner({
  goal,
  confidence,
}: {
  goal: BoardGoal;
  confidence: number;
}) {
  const tone =
    confidence >= 60
      ? { fg: "var(--emerald)", chip: "Sağlam" }
      : confidence >= 30
        ? { fg: "var(--accent)", chip: "Tetikte" }
        : { fg: "var(--danger)", chip: "Risk altında" };
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "12px 16px",
        borderRadius: 12,
        background: "color-mix(in oklab, var(--panel-2) 60%, transparent)",
        border: "1px solid var(--border)",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: `color-mix(in oklab, ${tone.fg} 18%, transparent)`,
          color: tone.fg,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Target size={18} strokeWidth={1.6} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="t-caption" style={{ fontSize: 11 }}>
          YÖNETİM HEDEFİ
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
          <span style={{ fontWeight: 600 }}>{goalLabel(goal)}</span>
          <span
            style={{
              fontSize: 11,
              padding: "2px 8px",
              borderRadius: 4,
              background: `color-mix(in oklab, ${tone.fg} 22%, transparent)`,
              color: tone.fg,
            }}
          >
            {tone.chip}
          </span>
        </div>
      </div>
      <div style={{ width: 140 }}>
        <div className="t-mono" style={{ fontSize: 11, color: "var(--muted)" }}>
          GÜVEN {confidence}/100
        </div>
        <div
          style={{
            height: 6,
            borderRadius: 3,
            background: "var(--panel-2)",
            marginTop: 4,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${confidence}%`,
              background: tone.fg,
              transition: "width .25s",
            }}
          />
        </div>
      </div>
    </div>
  );
}
