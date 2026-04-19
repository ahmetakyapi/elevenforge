import type { AchievementBadge } from "@/lib/queries/achievements";

/**
 * Horizontal strip of badges shown beneath the user's club crest. Empty
 * state hidden — no point showing "no trophies yet" on day one.
 */
export function AchievementsStrip({ badges }: { badges: AchievementBadge[] }) {
  if (badges.length === 0) return null;
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
        padding: "10px 14px",
        borderRadius: 12,
        background: "color-mix(in oklab, var(--panel-2) 60%, transparent)",
        border: "1px solid var(--border)",
      }}
    >
      <span
        className="t-label"
        style={{ fontSize: 11, alignSelf: "center", marginRight: 4 }}
      >
        VİTRİN
      </span>
      {badges.map((b) => (
        <span
          key={b.code}
          title={`${b.label}${b.latestSeason !== null ? ` · S${b.latestSeason}` : ""}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 10px",
            borderRadius: 999,
            background: `color-mix(in oklab, ${b.tint} 18%, transparent)`,
            border: `1px solid color-mix(in oklab, ${b.tint} 40%, var(--border))`,
            color: b.tint,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          <span style={{ fontSize: 14 }}>{b.emoji}</span>
          {b.label}
          {b.count > 1 && (
            <span
              className="t-mono"
              style={{
                fontSize: 10,
                padding: "1px 5px",
                borderRadius: 3,
                background: `color-mix(in oklab, ${b.tint} 28%, transparent)`,
              }}
            >
              ×{b.count}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
