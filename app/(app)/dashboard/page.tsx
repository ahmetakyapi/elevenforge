import Link from "next/link";
import { ChevronRight } from "lucide-react";
import {
  Crest,
  FormDot,
  GlassCard,
  SectionHead,
  StatChip,
} from "@/components/ui/primitives";
import { loadDashboardData } from "@/lib/queries/dashboard";
import { requireLeagueContext } from "@/lib/session";
import { fmtEUR } from "@/lib/utils";
import { PlayNextRoundButton } from "./play-round-button";
import { InviteChip } from "./invite-chip";
import { StreakBanner } from "./streak-banner";
import { SpyButton } from "./spy-button";
import { BoardBanner } from "./board-banner";
import { SponsorWidget } from "./sponsor-widget";
import { StaffWidget } from "./staff-widget";
import { UpgradeWidget } from "./upgrade-widget";
import { AchievementsStrip } from "./achievements-strip";
import { PressWidget } from "./press-widget";
import { ExpiringContractsCard } from "./expiring-contracts";
import { AutoPlayBanner } from "./auto-play-banner";
import { NextMatchCountdown } from "./next-match-countdown";
import { DashboardAutoRefresh } from "@/components/dashboard-auto-refresh";
import type { BoardGoal } from "@/lib/jobs/board";
import { SPONSORS } from "@/lib/sponsors";
import { loadClubAchievements } from "@/lib/queries/achievements";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const ctx = await requireLeagueContext();
  const d = await loadDashboardData(ctx);
  const badges = await loadClubAchievements(ctx.club.id);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        padding: "20px 28px",
        maxWidth: 1400,
        margin: "0 auto",
      }}
    >
      <DashboardAutoRefresh intervalMs={30_000} />
      <AutoPlayBanner
        matchTime={ctx.league.matchTime}
        manualAdvance={ctx.league.manualAdvanceEnabled}
        isCommissioner={ctx.isCommissioner}
        nextFixtureMs={d.nextFixture?.scheduledAtMs ?? null}
      />
      {/* Top ribbon — club identity + quick stats first, so the page
          opens with "who am I / what's my state" before diving into
          strategic widgets. */}
      <div
        data-dashboard-ribbon
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Crest
            clubId={d.myClub.id}
            size={44}
            club={{
              color: d.myClub.color,
              color2: d.myClub.color2,
              short: d.myClub.shortName,
            }}
          />
          <div>
            <div className="t-h2" style={{ fontSize: 19 }}>
              {d.myClub.name}
            </div>
            <div className="t-small" style={{ color: "var(--muted)" }}>
              Teknik Direktör · {ctx.user.name}
            </div>
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <StatChip
          label="KASA"
          value={
            <span className="t-mono">{fmtEUR(d.myClub.balanceEur)}</span>
          }
          icon={<span style={{ color: "var(--emerald)" }}>◉</span>}
        />
        <StatChip label="MORAL" value={`${d.myClub.morale}/5`} icon="❤" />
        <StatChip
          label="SIRALAMA"
          value={`${d.myClub.position}.`}
          icon={<span style={{ color: "var(--gold)" }}>★</span>}
        />
        <StreakBanner streak={d.streak} />
      </div>

      {/* Hero: next match + play button */}
      <GlassCard
        pad={0}
        hover={false}
        className="glass-hero"
        style={{ overflow: "hidden", position: "relative" }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "radial-gradient(700px 320px at 15% 0%, color-mix(in oklab, var(--accent) 22%, transparent), transparent 60%), radial-gradient(700px 320px at 100% 100%, color-mix(in oklab, var(--accent-2) 16%, transparent), transparent 60%)",
          }}
        />
        <div
          style={{
            position: "relative",
            padding: 32,
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr",
            gap: 32,
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <span className="chip chip-success">
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "var(--emerald)",
                    animation: "pulse-accent 2s ease-in-out infinite",
                  }}
                />
                {d.nextFixture ? "SONRAKİ MAÇ" : "MAÇ YOK"}
                {d.nextFixture
                  ? " · " +
                    new Date(d.nextFixture.scheduledAtMs).toLocaleString(
                      "tr-TR",
                      { dateStyle: "short", timeStyle: "short" },
                    )
                  : ""}
              </span>
              {d.nextFixture?.isDerby && (
                <span className="chip chip-gold">
                  🔥 ŞEHİR DERBİSİ · 2× bahis
                </span>
              )}
            </div>
            {d.nextFixture && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 22,
                  marginTop: 2,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 10,
                    minWidth: 88,
                  }}
                >
                  <Crest
                    clubId={d.nextFixture.homeClubId}
                    size={72}
                    club={d.crestLookup[d.nextFixture.homeClubId]}
                  />
                  <span className="t-h4" style={{ textAlign: "center" }}>
                    {d.nextFixture.homeClubShort}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <span
                    className="t-mono"
                    style={{
                      fontSize: 32,
                      fontWeight: 700,
                      color: "var(--muted-2)",
                      letterSpacing: "-0.04em",
                    }}
                  >
                    vs
                  </span>
                  <span className="t-eyebrow" style={{ color: "var(--muted)" }}>
                    {d.nextFixture.isHome ? "EV SAHİBİ" : "DEPLASMAN"}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 10,
                    minWidth: 88,
                  }}
                >
                  <Crest
                    clubId={d.nextFixture.awayClubId}
                    size={72}
                    club={d.crestLookup[d.nextFixture.awayClubId]}
                  />
                  <span className="t-h4" style={{ textAlign: "center" }}>
                    {d.nextFixture.awayClubShort}
                  </span>
                </div>
              </div>
            )}
            {d.nextFixture && (
              <div className="t-small" style={{ color: "var(--muted)" }}>
                {d.nextFixture.venue}
              </div>
            )}
            {d.nextFixture && d.nextFixture.opponentForm.length > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  flexWrap: "wrap",
                  paddingTop: 10,
                  borderTop: "1px solid var(--border)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="t-label" style={{ fontSize: 10 }}>
                    RAKİBİN SON 5
                  </span>
                  <div style={{ display: "flex", gap: 3 }}>
                    {d.nextFixture.opponentForm.map((r, i) => (
                      <FormDot key={i} result={r} />
                    ))}
                  </div>
                </div>
                {d.nextFixture.h2h.length > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="t-label" style={{ fontSize: 10 }}>
                      H2H
                    </span>
                    <div style={{ display: "flex", gap: 5 }}>
                      {d.nextFixture.h2h.map((m, i) => (
                        <span
                          key={i}
                          className="t-mono"
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "3px 7px",
                            borderRadius: 6,
                            background:
                              m.result === "W"
                                ? "color-mix(in oklab, var(--emerald) 18%, transparent)"
                                : m.result === "L"
                                  ? "color-mix(in oklab, var(--danger) 18%, transparent)"
                                  : "color-mix(in oklab, var(--warn) 18%, transparent)",
                            color:
                              m.result === "W"
                                ? "var(--emerald)"
                                : m.result === "L"
                                  ? "var(--danger)"
                                  : "var(--warn)",
                            border: `1px solid ${
                              m.result === "W"
                                ? "color-mix(in oklab, var(--emerald) 30%, transparent)"
                                : m.result === "L"
                                  ? "color-mix(in oklab, var(--danger) 30%, transparent)"
                                  : "color-mix(in oklab, var(--warn) 30%, transparent)"
                            }`,
                          }}
                        >
                          {m.ourScore}-{m.theirScore}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <div style={{ display: "flex", gap: 10, marginTop: 2, flexWrap: "wrap" }}>
              <Link
                href="/tactic"
                className="btn btn-primary"
                style={{ textDecoration: "none" }}
              >
                Taktik Hazırla <ChevronRight size={14} strokeWidth={1.6} />
              </Link>
              <SpyButton />
              {ctx.league.manualAdvanceEnabled && ctx.isCommissioner && (
                <PlayNextRoundButton />
              )}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              padding: "4px 0",
            }}
          >
            <span className="t-eyebrow" style={{ color: "var(--muted)" }}>
              LİG HAFTA
            </span>
            <div
              className="t-mono"
              data-big-stat
              style={{
                fontSize: 72,
                fontWeight: 800,
                letterSpacing: "-0.04em",
                lineHeight: 1,
                background: "linear-gradient(180deg, var(--text) 0%, color-mix(in oklab, var(--text) 50%, transparent) 120%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                color: "transparent",
              }}
            >
              {d.leagueInfo.weekNumber}
              <span style={{ color: "var(--muted-2)", fontSize: 40, fontWeight: 600 }}>
                /{d.leagueInfo.seasonLength}
              </span>
            </div>
            <div className="t-small" style={{ color: "var(--muted)" }}>
              Sezon {d.leagueInfo.seasonNumber}
            </div>
            {d.nextFixture && (
              <NextMatchCountdown scheduledAtMs={d.nextFixture.scheduledAtMs} />
            )}
          </div>
        </div>
      </GlassCard>

      {/* Widgets row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 16,
        }}
      >
        <GlassCard pad={18} hover={false}>
          <span className="t-label">POZİSYON</span>
          <div
            className="t-mono"
            style={{ fontSize: 26, fontWeight: 600, marginTop: 10 }}
          >
            {d.myClub.position}.
          </div>
          <div className="t-small" style={{ color: "var(--muted)" }}>
            {d.leagueInfo.name}
          </div>
        </GlassCard>
        <GlassCard pad={18} hover={false}>
          <span className="t-label">PUAN</span>
          <div
            className="t-mono"
            style={{ fontSize: 26, fontWeight: 600, marginTop: 10 }}
          >
            {d.myClub.points}
          </div>
          <div className="t-small" style={{ color: "var(--muted)" }}>
            16 takım içinde
          </div>
        </GlassCard>
        <GlassCard pad={18} hover={false}>
          <span className="t-label">KADRO</span>
          <div
            className="t-mono"
            style={{ fontSize: 26, fontWeight: 600, marginTop: 10 }}
          >
            {d.squadStatus.total}
          </div>
          <div
            className="t-small"
            style={{ color: "var(--muted)", display: "flex", gap: 12 }}
          >
            <span>🩹 {d.squadStatus.injured}</span>
            <span>🟥 {d.squadStatus.suspended}</span>
            <span>💪 {d.squadStatus.training}</span>
          </div>
        </GlassCard>
        <GlassCard pad={18} hover={false}>
          <span className="t-label">KASA</span>
          <div
            className="t-mono"
            style={{
              fontSize: 26,
              fontWeight: 600,
              marginTop: 10,
              color: "var(--emerald)",
            }}
          >
            {fmtEUR(d.myClub.balanceEur)}
          </div>
          <div className="t-small" style={{ color: "var(--muted)" }}>
            Toplam bakiye
          </div>
        </GlassCard>
      </div>

      {/* Table + feed */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.3fr) minmax(0, 1fr)",
          gap: 16,
        }}
      >
        <GlassCard pad={20} hover={false}>
          <SectionHead
            label="LİG TABLOSU"
            title={`${d.leagueInfo.name} · Sezon ${d.leagueInfo.seasonNumber}`}
            right={
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <InviteChip code={d.leagueInfo.inviteCode} />
                <span
                  className="t-caption"
                  style={{ color: "var(--muted)", fontSize: 11 }}
                >
                  {d.leagueInfo.memberCount} insan · {d.leagueInfo.botCount} bot
                </span>
                <span className="t-mono" style={{ color: "var(--muted)" }}>
                  Hafta {d.leagueInfo.weekNumber} / {d.leagueInfo.seasonLength}
                </span>
              </div>
            }
          />
          <div
            data-dense-table
            data-dense-table-wide
            style={{ borderRadius: 12, overflow: "hidden" }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "32px 1fr 36px 36px 36px 36px 50px 120px",
                gap: 10,
                padding: "8px 4px",
                alignItems: "center",
              }}
            >
              {["#", "Kulüp", "O", "G", "B", "M", "P", "Form"].map((h, i) => (
                <span
                  key={h}
                  className="t-label"
                  style={{
                    fontSize: 10,
                    textAlign: i > 1 && i < 7 ? "center" : "left",
                  }}
                >
                  {h}
                </span>
              ))}
            </div>
            {d.standings.map((row, i) => (
              <div
                key={row.clubId}
                style={{
                  display: "grid",
                  gridTemplateColumns: "32px 1fr 36px 36px 36px 36px 50px 120px",
                  gap: 10,
                  padding: "8px 4px",
                  alignItems: "center",
                  background: row.isMe
                    ? "color-mix(in oklab, var(--accent) 8%, transparent)"
                    : "transparent",
                  borderRadius: 8,
                }}
              >
                <span
                  className="t-mono"
                  style={{
                    color: i < 3 ? "var(--gold)" : "var(--muted)",
                    fontSize: 13,
                  }}
                >
                  {i + 1}
                </span>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    minWidth: 0,
                  }}
                >
                  <Crest
                    clubId={row.clubId}
                    size={22}
                    club={{
                      color: row.color,
                      color2: row.color2,
                      short: row.shortName,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: row.isMe ? 600 : 500,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {row.name}
                  </span>
                </div>
                {[row.p, row.w, row.d, row.l].map((v, j) => (
                  <span
                    key={`${row.clubId}-${j}`}
                    className="t-mono"
                    style={{
                      textAlign: "center",
                      fontSize: 13,
                      color: "var(--text-2)",
                    }}
                  >
                    {v}
                  </span>
                ))}
                <span
                  className="t-mono"
                  style={{
                    textAlign: "center",
                    fontSize: 13,
                    fontWeight: 600,
                    color: i < 4 ? "var(--emerald)" : "var(--text)",
                  }}
                >
                  {row.pts}
                </span>
                <div style={{ display: "flex", gap: 3 }}>
                  {row.form.slice(0, 5).map((r, j) => (
                    <FormDot key={`${row.clubId}-f${j}`} result={r} />
                  ))}
                  {Array.from({ length: Math.max(0, 5 - row.form.length) }).map(
                    (_, j) => (
                      <span
                        key={`empty-${j}`}
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 4,
                          background: "var(--panel-2)",
                        }}
                      />
                    ),
                  )}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
        <GlassCard pad={20} hover={false}>
          <SectionHead
            label="AKTİVİTE"
            title="Crew feed'i"
            right={
              <Link
                href="/crew"
                className="btn btn-ghost btn-sm"
                style={{ textDecoration: "none" }}
              >
                Tümünü gör
              </Link>
            }
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              maxHeight: 400,
              overflowY: "auto",
              paddingRight: 4,
            }}
          >
            {d.feed.length === 0 && (
              <div className="t-small" style={{ color: "var(--muted)" }}>
                Henüz aktivite yok. Bir hafta oynayalım.
              </div>
            )}
            {d.feed.map((f) => (
              <div
                key={f.id}
                style={{ display: "flex", gap: 10, padding: "8px 2px" }}
              >
                {f.clubId && (
                  <Crest
                    clubId={f.clubId}
                    size={22}
                    club={d.crestLookup[f.clubId]}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: 13,
                      color: "var(--text-2)",
                      lineHeight: 1.5,
                    }}
                  >
                    {f.text}
                  </span>
                  <div className="t-caption" style={{ marginTop: 2 }}>
                    {f.relativeTime} önce
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* ─── Strategic widgets — below the primary table/feed fold.
          Users usually come to the dashboard to check "what's my next
          match" and "where do I sit in the league" first; board goals,
          sponsor offers, staff hires, stadium upgrades, press duties,
          expiring contracts are all turn-by-turn tactical decisions
          that belong under a second-tier heading. */}
      <div
        style={{
          marginTop: 16,
          paddingTop: 4,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span className="t-label" style={{ fontSize: 11, color: "var(--muted)" }}>
          SEZON KARARLARI
        </span>
        <div
          style={{
            flex: 1,
            height: 1,
            background:
              "linear-gradient(90deg, var(--border) 0%, transparent 80%)",
          }}
        />
      </div>
      <AchievementsStrip badges={badges} />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
        }}
      >
        <BoardBanner
          goal={ctx.club.boardSeasonGoal as BoardGoal}
          confidence={ctx.club.boardConfidence}
        />
        <PressWidget />
      </div>
      <ExpiringContractsCard clubId={ctx.club.id} />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
        }}
      >
        <SponsorWidget
          active={
            ctx.club.activeSponsorJson
              ? (() => {
                  try {
                    return JSON.parse(ctx.club.activeSponsorJson);
                  } catch {
                    return null;
                  }
                })()
              : null
          }
          offers={SPONSORS}
          prestige={ctx.club.prestige}
        />
        <StaffWidget staffJson={ctx.club.staffJson} />
      </div>
      <UpgradeWidget
        stadiumLevel={ctx.club.stadiumLevel}
        trainingLevel={ctx.club.trainingLevel}
      />
    </div>
  );
}
