"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { PlayCircle } from "lucide-react";
import { Crest, EmptyState, GlassCard } from "@/components/ui/primitives";
import type { MatchReplayData } from "@/lib/queries/match";
import { MatchReplay } from "./replay";

type StatsTab = "feed" | "stats";

export default function MatchUi({ match }: { match: MatchReplayData }) {
  const [tab, setTab] = useState<StatsTab>("feed");
  /*
    Do not spoil the result.

    The scoreboard prints the final score at 72px and the summary lists every
    goal with its minute — directly above and beside a replay whose whole
    purpose is to reveal them one at a time. Watching it was pointless: you
    already knew.

    So the score and the goal list stay hidden until the replay gets there,
    and a button reveals them for anyone who just wants the result. Reduced
    motion, skipping to the end and reaching full time all reveal it, so
    nobody is ever stuck looking at a hidden score they cannot open.
  */
  const [revealed, setRevealed] = useState(false);
  const reveal = useCallback(() => setRevealed(true), []);

  if (!match) {
    return (
      <div style={{ maxWidth: 720, margin: "80px auto", padding: "0 24px" }}>
        <GlassCard pad={0} hover={false} className="glass-hero">
          <EmptyState
            Icon={PlayCircle}
            title="Henüz maç oynanmadı"
            description="Takımının ilk maçı henüz simüle edilmedi. Dashboard'dan haftayı oyna, canlı anlatım burada belirecek."
            tint="var(--emerald)"
            action={
              <Link
                href="/dashboard"
                className="btn btn-primary"
                style={{ textDecoration: "none" }}
              >
                Dashboard&apos;a git
              </Link>
            }
          />
        </GlassCard>
      </div>
    );
  }

  const isDerby = match.homeClubCity === match.awayClubCity;

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "16px 24px" }}>
      {/* Scoreboard — dramatic full-bleed treatment with giant score,
          80px crests, and winner-highlighting via color weight. */}
      {(() => {
        const homeWon = revealed && match.homeScore > match.awayScore;
        const awayWon = revealed && match.awayScore > match.homeScore;
        return (
          <GlassCard
            pad={0}
            hover={false}
            data-match-scoreboard
            className="glass-hero"
            style={{
              overflow: "hidden",
              position: "relative",
              marginBottom: 16,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                background: `
                  radial-gradient(600px 220px at 20% 0%, color-mix(in oklab, ${homeWon ? "var(--emerald)" : "var(--accent)"} 16%, transparent), transparent 60%),
                  radial-gradient(600px 220px at 80% 100%, color-mix(in oklab, ${awayWon ? "var(--emerald)" : "var(--accent-2)"} 14%, transparent), transparent 60%)
                `,
              }}
            />
            <div
              style={{
                position: "relative",
                padding: "28px 28px 22px",
                display: "grid",
                gridTemplateColumns: "1fr 280px 1fr",
                alignItems: "center",
                gap: 20,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                <Crest clubId={match.homeClubId} size={80} club={match.homeClubCrest} />
                <div>
                  <div
                    className="t-h2"
                    style={{ color: homeWon ? "var(--text)" : "var(--text-2)", opacity: awayWon ? 0.75 : 1 }}
                  >
                    {match.homeClubName}
                  </div>
                  <div className="t-caption" style={{ marginTop: 2 }}>
                    Ev sahibi · <span className="t-mono">%{match.stats.possessionHome}</span>
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
                  <span
                    className="t-mono"
                    data-match-score
                    style={{
                      fontSize: 72,
                      fontWeight: 800,
                      letterSpacing: "-0.04em",
                      lineHeight: 1,
                      color: homeWon ? "var(--emerald)" : awayWon ? "var(--muted-2)" : "var(--text)",
                      textShadow: homeWon ? "0 0 32px color-mix(in oklab, var(--emerald) 35%, transparent)" : "none",
                    }}
                  >
                    {revealed ? match.homeScore : "•"}
                  </span>
                  <span style={{ fontSize: 28, color: "var(--muted-2)", fontWeight: 300 }}>–</span>
                  <span
                    className="t-mono"
                    data-match-score
                    style={{
                      fontSize: 72,
                      fontWeight: 800,
                      letterSpacing: "-0.04em",
                      lineHeight: 1,
                      color: awayWon ? "var(--emerald)" : homeWon ? "var(--muted-2)" : "var(--text)",
                      textShadow: awayWon ? "0 0 32px color-mix(in oklab, var(--emerald) 35%, transparent)" : "none",
                    }}
                  >
                    {revealed ? match.awayScore : "•"}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 4,
                    flexWrap: "wrap",
                    justifyContent: "center",
                  }}
                >
                  <span className="t-eyebrow" style={{ color: "var(--muted)" }}>
                    HAFTA {match.weekNumber} · SEZON {match.seasonNumber}
                  </span>
                  {isDerby && (
                    <span className="chip chip-gold chip-sm">DERBİ</span>
                  )}
                </div>
                <div className="t-caption" style={{ fontSize: 11 }}>
                  {/* Formatted on the server in the league's timezone. A
                      bare toLocaleDateString here produced one string during
                      SSR (Vercel runs at UTC) and a different one on
                      hydration — a guaranteed mismatch, and three hours wrong
                      for Turkish players. */}
                  {match.playedAtLabel}
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 18,
                  justifyContent: "flex-end",
                }}
              >
                <div style={{ textAlign: "right" }}>
                  <div
                    className="t-h2"
                    style={{ color: awayWon ? "var(--text)" : "var(--text-2)", opacity: homeWon ? 0.75 : 1 }}
                  >
                    {match.awayClubName}
                  </div>
                  <div className="t-caption" style={{ marginTop: 2 }}>
                    Deplasman · <span className="t-mono">%{match.stats.possessionAway}</span>
                  </div>
                </div>
                <Crest clubId={match.awayClubId} size={80} club={match.awayClubCrest} />
              </div>
            </div>
          </GlassCard>
        );
      })()}

      <div
        data-match-body
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 360px",
          gap: 16,
        }}
      >
        {/* The match, played back — see ./replay.tsx for why it plays
            rather than printing. */}
        <GlassCard
          pad={0}
          hover={false}
          data-match-commentary
          style={{
            overflow: "hidden",
            maxHeight: "calc(100vh - 260px)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <MatchReplay
            onReveal={reveal}
            events={match.events}
            homeClubName={match.homeClubName}
            awayClubName={match.awayClubName}
            homeShort={match.homeClubCrest.short}
            awayShort={match.awayClubCrest.short}
          />
        </GlassCard>

        {/* Stats drawer */}
        <GlassCard
          pad={0}
          hover={false}
          data-match-stats
          style={{ overflow: "hidden", alignSelf: "start" }}
        >
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              gap: 4,
            }}
          >
            {(
              [
                ["feed", "Özet"],
                ["stats", "İstatistik"],
              ] as const
            ).map(([k, l]) => (
              <button
                key={k}
                type="button"
                className={`chip ${tab === k ? "active" : ""}`}
                onClick={() => setTab(k)}
                style={{ cursor: "pointer" }}
              >
                {l}
              </button>
            ))}
          </div>
          <div style={{ padding: 16 }}>
            {tab === "feed" && (
              <FeedTab match={match} revealed={revealed} onReveal={reveal} />
            )}
            {tab === "stats" && <StatsPanel match={match} />}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function FeedTab({
  match,
  revealed,
  onReveal,
}: {
  match: NonNullable<MatchReplayData>;
  revealed: boolean;
  onReveal: () => void;
}) {
  const goalEvents = match.events.filter((e) => e.type === "goal");
  const cardEvents = match.events.filter((e) => e.type === "card");

  // The goal list is the scoreline in another form: minute, club, minute,
  // club. Printing it beside a replay that is still at 13' hands over the
  // result the replay is in the middle of telling.
  if (!revealed) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <span className="t-label">TARAFTAR ENERJİSİ</span>
        <div className="t-mono" style={{ fontSize: 32, color: "var(--gold)" }}>
          {Math.round(match.stats.crowdEnergy)}
        </div>
        <p className="t-caption" style={{ fontSize: 12, lineHeight: 1.6, margin: 0 }}>
          Maç devam ediyor. Goller ve kartlar anlatım oraya geldikçe burada
          listelenecek.
        </p>
        <button type="button" className="btn btn-outline btn-sm" onClick={onReveal}>
          Sonucu Göster
        </button>
      </div>
    );
  }

  return (
    <div>
      <span className="t-label">TARAFTAR ENERJİSİ</span>
      <div
        className="t-mono"
        style={{
          fontSize: 32,
          color: "var(--gold)",
          marginTop: 10,
          marginBottom: 4,
        }}
      >
        {Math.round(match.stats.crowdEnergy)}
      </div>
      <div style={{ marginTop: 16 }}>
        <span className="t-label">GOLLER</span>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            marginTop: 10,
          }}
        >
          {goalEvents.map((c, i) => (
            <div
              key={`g-${i}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
              }}
            >
              <span
                className="t-mono"
                style={{ fontSize: 11, color: "var(--muted)", minWidth: 24 }}
              >
                {c.minute}&apos;
              </span>
              <span>⚽</span>
              <span className="t-caption" style={{ flex: 1 }}>
                {c.side === "home"
                  ? match.homeClubName
                  : match.awayClubName}
              </span>
            </div>
          ))}
          {goalEvents.length === 0 && (
            <div className="t-small" style={{ color: "var(--muted)" }}>
              Gol yok.
            </div>
          )}
        </div>
        <span className="t-label" style={{ marginTop: 12, display: "block" }}>
          KARTLAR
        </span>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            marginTop: 10,
          }}
        >
          {cardEvents.map((c, i) => (
            <div
              key={`c-${i}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
              }}
            >
              <span
                className="t-mono"
                style={{ fontSize: 11, color: "var(--muted)", minWidth: 24 }}
              >
                {c.minute}&apos;
              </span>
              <span>{c.icon}</span>
              <span className="t-caption" style={{ flex: 1 }}>
                {c.side === "home"
                  ? match.homeClubName
                  : match.awayClubName}
              </span>
            </div>
          ))}
          {cardEvents.length === 0 && (
            <div className="t-small" style={{ color: "var(--muted)" }}>
              Kart yok.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatsPanel({ match }: { match: NonNullable<MatchReplayData> }) {
  const stats: Array<[string, number, number, boolean?]> = [
    ["Topla oynama", match.stats.possessionHome, match.stats.possessionAway, true],
    ["Şut", match.stats.shotsHome, match.stats.shotsAway],
    ["İsabetli şut", match.stats.shotsOnHome, match.stats.shotsOnAway],
    ["Korner", match.stats.cornersHome, match.stats.cornersAway],
    ["Kart", match.stats.cardsHome, match.stats.cardsAway],
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* xG first, because it is the one number that says whether the
          scoreline was deserved — which is what a manager actually wants to
          know after a 1-0 that felt like a 4-0. Decimal, so it gets its own
          row rather than being forced into the integer bars below. */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 10px",
          borderRadius: 10,
          background: "var(--panel-2)",
          border: "1px solid var(--border)",
        }}
      >
        <span
          className="t-mono"
          style={{
            fontSize: 14,
            fontWeight: 700,
            color:
              match.stats.xgHome > match.stats.xgAway
                ? "var(--emerald)"
                : "var(--text)",
          }}
        >
          {match.stats.xgHome.toFixed(1)}
        </span>
        <span className="t-label" style={{ fontSize: 9.5 }}>
          BEKLENEN GOL
        </span>
        <span
          className="t-mono"
          style={{
            fontSize: 14,
            fontWeight: 700,
            color:
              match.stats.xgAway > match.stats.xgHome
                ? "var(--emerald)"
                : "var(--text)",
          }}
        >
          {match.stats.xgAway.toFixed(1)}
        </span>
      </div>

      {stats.map(([l, h, a, pct]) => (
        <div key={l}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 4,
            }}
          >
            <span
              className="t-mono"
              style={{
                fontSize: 13,
                color: h > a ? "var(--emerald)" : "var(--text)",
              }}
            >
              {h}
              {pct ? "%" : ""}
            </span>
            <span className="t-caption" style={{ fontSize: 11 }}>
              {l}
            </span>
            <span
              className="t-mono"
              style={{
                fontSize: 13,
                color: a > h ? "var(--emerald)" : "var(--text)",
              }}
            >
              {a}
              {pct ? "%" : ""}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              height: 4,
              borderRadius: 2,
              overflow: "hidden",
              background: "var(--border)",
            }}
          >
            <div style={{ flex: h, background: "var(--indigo)" }} />
            <div style={{ width: 1, background: "var(--bg)" }} />
            <div style={{ flex: a, background: "var(--emerald)" }} />
          </div>
        </div>
      ))}
    </div>
  );
}
