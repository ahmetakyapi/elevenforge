"use client";

import { useState } from "react";
import { Crest, GlassCard } from "@/components/ui/primitives";
import type { MatchReplayData } from "@/lib/queries/match";
import type { MatchEvent } from "@/lib/engine/match";

type StatsTab = "feed" | "stats";

export default function MatchUi({ match }: { match: MatchReplayData }) {
  const [tab, setTab] = useState<StatsTab>("feed");

  if (!match) {
    return (
      <div style={{ maxWidth: 720, margin: "80px auto", padding: "0 24px" }}>
        <GlassCard pad={48} hover={false} style={{ textAlign: "center" }}>
          <div className="t-h2">Henüz maç oynanmadı</div>
          <div
            className="t-small"
            style={{ marginTop: 10, color: "var(--muted)" }}
          >
            Dashboard&apos;dan &ldquo;Sıradaki Haftayı Oyna&rdquo; butonuna bas,
            ilk maçlar simüle olsun.
          </div>
        </GlassCard>
      </div>
    );
  }

  const isDerby = match.homeClubCity === match.awayClubCity;

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "16px 24px" }}>
      {/* Scoreboard */}
      <GlassCard
        pad={0}
        hover={false}
        style={{
          overflow: "hidden",
          position: "relative",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            padding: "22px 28px",
            display: "grid",
            gridTemplateColumns: "1fr 280px 1fr",
            alignItems: "center",
            gap: 20,
            position: "relative",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Crest clubId={match.homeClubId} size={56} club={match.homeClubCrest} />
            <div>
              <div className="t-h2" style={{ fontSize: 18 }}>
                {match.homeClubName}
              </div>
              <div className="t-caption">
                Ev sahibi · %{match.stats.possessionHome}
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span
                className="t-mono"
                style={{
                  fontSize: 54,
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                }}
              >
                {match.homeScore}
              </span>
              <span style={{ fontSize: 24, color: "var(--muted)" }}>−</span>
              <span
                className="t-mono"
                style={{
                  fontSize: 54,
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                }}
              >
                {match.awayScore}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 2,
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              <span
                className="t-mono"
                style={{
                  fontSize: 13,
                  color: "var(--muted)",
                  letterSpacing: "0.1em",
                }}
              >
                HAFTA {match.weekNumber} · SEZON {match.seasonNumber}
              </span>
              {isDerby && (
                <span
                  className="chip"
                  style={{
                    color: "var(--gold)",
                    fontSize: 10,
                    padding: "2px 8px",
                    borderColor:
                      "color-mix(in oklab, var(--gold) 40%, var(--border))",
                  }}
                >
                  DERBİ
                </span>
              )}
            </div>
            <div className="t-caption" style={{ fontSize: 11, marginTop: 4 }}>
              {match.playedAt.toLocaleDateString("tr-TR", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              justifyContent: "flex-end",
            }}
          >
            <div style={{ textAlign: "right" }}>
              <div className="t-h2" style={{ fontSize: 18 }}>
                {match.awayClubName}
              </div>
              <div className="t-caption">
                Deplasman · %{match.stats.possessionAway}
              </div>
            </div>
            <Crest clubId={match.awayClubId} size={56} club={match.awayClubCrest} />
          </div>
        </div>
      </GlassCard>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 360px",
          gap: 16,
        }}
      >
        {/* Commentary */}
        <GlassCard
          pad={0}
          hover={false}
          style={{
            overflow: "hidden",
            maxHeight: "calc(100vh - 260px)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "14px 20px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg, var(--indigo), var(--emerald))",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  color: "#fff",
                  fontWeight: 700,
                }}
              >
                AI
              </div>
              <span className="t-h3" style={{ fontSize: 14 }}>
                Maç Anlatımı
              </span>
            </div>
            <span
              className="t-caption"
              style={{ fontSize: 11, color: "var(--muted)" }}
            >
              {match.events.length} olay
            </span>
          </div>
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "14px 20px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {match.events.map((c, i) => (
              <CommentaryItem key={`${c.minute}-${i}`} c={c} />
            ))}
          </div>
        </GlassCard>

        {/* Stats drawer */}
        <GlassCard
          pad={0}
          hover={false}
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
            {tab === "feed" && <FeedTab match={match} />}
            {tab === "stats" && <StatsPanel match={match} />}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function FeedTab({ match }: { match: NonNullable<MatchReplayData> }) {
  const goalEvents = match.events.filter((e) => e.type === "goal");
  const cardEvents = match.events.filter((e) => e.type === "card");
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

function CommentaryItem({ c }: { c: MatchEvent }) {
  const color =
    c.type === "goal"
      ? "var(--emerald)"
      : c.type === "card"
        ? "var(--warn)"
        : c.type === "shot"
          ? "var(--cyan)"
          : "var(--muted)";
  const label =
    c.type === "goal"
      ? "GOL"
      : c.type === "card"
        ? "KART"
        : c.type === "shot"
          ? "ŞUT"
          : c.type === "sub"
            ? "DEĞİŞİKLİK"
            : c.type === "half"
              ? "DEVRE"
              : c.type === "start"
                ? "BAŞLANGIÇ"
                : c.type === "end"
                  ? "BİTTİ"
                  : "ANALİZ";
  return (
    <div
      className="anim-slide-up"
      style={{ display: "flex", gap: 12, alignItems: "flex-start" }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
          minWidth: 48,
        }}
      >
        <span
          className="t-mono"
          style={{ fontSize: 12, color: "var(--muted)" }}
        >
          {c.minute}&apos;
        </span>
        <span style={{ fontSize: 18 }}>{c.icon}</span>
      </div>
      <div
        style={{
          flex: 1,
          background:
            c.type === "goal"
              ? `color-mix(in oklab, ${color} 8%, var(--panel))`
              : "var(--panel-2)",
          padding: "10px 14px",
          borderRadius: 12,
          border: `1px solid ${
            c.type === "goal"
              ? `color-mix(in oklab, ${color} 30%, var(--border))`
              : "var(--border)"
          }`,
        }}
      >
        <span className="t-label" style={{ color, fontSize: 10 }}>
          {label}
        </span>
        <div
          style={{
            fontSize: 14,
            lineHeight: 1.55,
            color: "var(--text)",
            marginTop: 4,
          }}
        >
          {c.text}
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
