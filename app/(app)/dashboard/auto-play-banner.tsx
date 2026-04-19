import { Clock } from "lucide-react";

/**
 * Tells users when matches will play next. With manual-advance OFF
 * (default) the daily cron is the only path forward — without this
 * banner, players who don't see a button are confused about how the
 * game progresses.
 */
export function AutoPlayBanner({
  matchTime,
  manualAdvance,
  isCommissioner,
  nextFixtureMs,
}: {
  matchTime: string;
  manualAdvance: boolean;
  isCommissioner: boolean;
  nextFixtureMs: number | null;
}) {
  const now = Date.now();
  const upcoming = nextFixtureMs && nextFixtureMs > now ? nextFixtureMs : null;
  const hours = upcoming ? Math.floor((upcoming - now) / 3600000) : null;
  const minutes = upcoming ? Math.floor(((upcoming - now) % 3600000) / 60000) : null;
  return (
    <div
      style={{
        padding: "10px 14px",
        borderRadius: 10,
        background: manualAdvance
          ? "color-mix(in oklab, var(--warn) 12%, var(--panel))"
          : "color-mix(in oklab, var(--cyan) 12%, var(--panel))",
        border: manualAdvance
          ? "1px solid color-mix(in oklab, var(--warn) 28%, var(--border))"
          : "1px solid color-mix(in oklab, var(--cyan) 28%, var(--border))",
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
      }}
    >
      <Clock
        size={14}
        strokeWidth={1.6}
        style={{ color: manualAdvance ? "var(--warn)" : "var(--cyan)" }}
      />
      <span style={{ fontSize: 13, fontWeight: 600 }}>
        Maçlar her gün {matchTime}'da otomatik oynanır.
      </span>
      {upcoming && (
        <span
          className="t-mono"
          style={{
            fontSize: 12,
            color: "var(--muted)",
            marginLeft: "auto",
          }}
        >
          Sıradaki maça {hours}sa {minutes}dk
        </span>
      )}
      {manualAdvance && isCommissioner && (
        <span
          style={{
            fontSize: 11,
            padding: "2px 8px",
            borderRadius: 4,
            background: "color-mix(in oklab, var(--warn) 28%, transparent)",
            color: "var(--warn)",
            fontWeight: 600,
          }}
        >
          MANUEL OYNATMA AÇIK
        </span>
      )}
    </div>
  );
}
