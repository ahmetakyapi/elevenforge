"use client";

/**
 * ElevenForge Spor — the weekly paper.
 *
 * ─── What was wrong with the old one ────────────────────────────────────
 *
 * Five tabs: cover, team of the week, scorers, press room, a fun fact. Four of
 * the five were a single list each, and the cover was one match. So the paper
 * carried less than the standings page did, hid most of it behind tabs, and
 * gave the reader nothing to do but click through four short lists and leave.
 * Tabs are the wrong shape for a newspaper anyway — a paper is something you
 * scroll down through, not something you file.
 *
 * ─── What this is ───────────────────────────────────────────────────────
 *
 * One continuous broadsheet. Masthead, then a lead story, then every other
 * result with its own report, then the table as it stood at press time, the
 * team of the week, both scoring charts, the transfer desk, the discipline
 * column, manager of the week, the fans, the numbers, and next week's card.
 * You read it downwards and it keeps going, which is the point.
 *
 * ─── On the colours ─────────────────────────────────────────────────────
 *
 * The page is deliberately NOT theme-aware. Every other surface in the app
 * follows the reader's light/dark choice; this one is newsprint in both,
 * because the joke only works if it looks like a paper. The palette is
 * therefore local constants rather than tokens — the one place in the app
 * where hard-coded colour is the correct answer, and it is confined to this
 * file so it cannot leak into anything that should be themed.
 */

import Link from "next/link";
import { Newspaper as NewspaperIcon } from "lucide-react";
import { EmptyState, GlassCard } from "@/components/ui/primitives";
import type { NewspaperData } from "@/lib/queries/newspaper";

// ─── Newsprint palette ──────────────────────────────────────────────────
const PAPER = "#ece5d6";
const PAPER_2 = "#e2d9c6";
const INK = "#17110b";
const INK_2 = "#4a3f33";
const INK_3 = "#6f6152";
const RULE = "rgba(23,17,11,0.22)";
const RULE_SOFT = "rgba(23,17,11,0.11)";
const RED = "#a51c1c";

const SERIF = "Georgia, 'Times New Roman', serif";

export default function NewspaperUi({ paper }: { paper: NewspaperData }) {
  if (!paper) {
    return (
      <div style={{ maxWidth: 720, margin: "80px auto", padding: "0 24px" }}>
        <GlassCard pad={0} hover={false} className="glass-hero">
          <EmptyState
            Icon={NewspaperIcon}
            title="Henüz gazete çıkmadı"
            description="İlk haftanın maçları oynandıktan sonra ElevenForge Spor'un manşeti, haftanın bütün maç raporları, puan durumu ve transfer borsası burada yayımlanır."
            tint="var(--gold)"
            action={
              <Link
                href="/dashboard"
                className="btn btn-outline"
                style={{ textDecoration: "none" }}
              >
                Haftayı oyna
              </Link>
            }
          />
        </GlassCard>
      </div>
    );
  }

  const { cover, sections } = paper;

  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", padding: "16px 20px 48px" }}>
      <article
        data-newspaper
        style={{
          background: PAPER,
          color: INK,
          fontFamily: SERIF,
          borderRadius: 10,
          overflow: "hidden",
          boxShadow: "0 30px 70px -24px rgba(0,0,0,0.55)",
          border: "1px solid rgba(0,0,0,0.25)",
        }}
      >
        <Masthead paper={paper} />

        <div style={{ padding: "0 clamp(16px, 3.5vw, 40px) 36px" }}>
          <LeadStory paper={paper} />

          {sections.results.length > 1 && (
            <Section title="Haftanın Diğer Maçları" kicker="Raporlar">
              <div data-paper-grid style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "22px 34px" }}>
                {sections.results
                  .filter((r) => r.homeClubId !== cover.heroHomeClubId)
                  .map((r, i) => (
                    <MatchReport key={`${r.homeClubId}-${i}`} r={r} />
                  ))}
              </div>
            </Section>
          )}

          {sections.table.length > 0 && (
            <Section title="Puan Durumu" kicker="Baskıya girerken">
              <StandingsTable rows={sections.table} />
            </Section>
          )}

          {paper.totw.length > 0 && (
            <Section title="Haftanın On Biri" kicker="Seçki">
              <TotwStrip paper={paper} />
            </Section>
          )}

          <div data-paper-grid style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 34 }}>
            <ChartList
              title="Gol Krallığı"
              rows={paper.scorers.map((s) => [s.name, s.g])}
              unit="gol"
            />
            <ChartList
              title="Asist Krallığı"
              rows={paper.assists.map((a) => [a.name, a.a])}
              unit="asist"
            />
          </div>

          {sections.weekStats.length > 0 && (
            <Section title="Rakamlarla Hafta" kicker="İstatistik">
              <div
                data-paper-grid
                style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}
              >
                {sections.weekStats.map((s) => (
                  <div
                    key={s.label}
                    style={{
                      borderTop: `2px solid ${INK}`,
                      paddingTop: 10,
                    }}
                  >
                    <div style={{ fontSize: 34, fontWeight: 700, lineHeight: 1 }}>
                      {s.value}
                    </div>
                    <div style={{ fontSize: 13, marginTop: 6, fontWeight: 700 }}>
                      {s.label}
                    </div>
                    {s.note && (
                      <div style={{ fontSize: 12, color: INK_3, marginTop: 3 }}>
                        {s.note}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {(sections.transfers.length > 0 || sections.discipline.length > 0) && (
            <div data-paper-grid style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 34 }}>
              {sections.transfers.length > 0 && (
                <Section title="Transfer Borsası" kicker="Piyasa">
                  <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                    {sections.transfers.map((t, i) => (
                      <li
                        key={`${t.player}-${i}`}
                        style={{
                          padding: "9px 0",
                          borderBottom: `1px solid ${RULE_SOFT}`,
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{t.player}</div>
                        <div style={{ fontSize: 12.5, color: INK_2, marginTop: 2 }}>
                          {t.fromName} → {t.toName} ·{" "}
                          <span style={{ color: RED, fontWeight: 700 }}>
                            €{(t.priceEur / 1_000_000).toFixed(1)}M
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
              {sections.discipline.length > 0 && (
                <Section title="Disiplin" kicker="Kart cetveli">
                  <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                    {sections.discipline.map((d, i) => (
                      <li
                        key={`${d.name}-${i}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "9px 0",
                          borderBottom: `1px solid ${RULE_SOFT}`,
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>
                            {d.name}
                            {d.banned && (
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  color: PAPER,
                                  background: RED,
                                  padding: "1px 6px",
                                  borderRadius: 3,
                                  marginLeft: 8,
                                  verticalAlign: "middle",
                                }}
                              >
                                CEZALI
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 12.5, color: INK_3 }}>
                            {d.clubName}
                          </div>
                        </div>
                        <CardPips yellows={d.yellows} reds={d.reds} />
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
            </div>
          )}

          {sections.managerOfWeek && (
            <Section title="Haftanın Teknik Direktörü" kicker="Övgü">
              <blockquote
                style={{
                  margin: 0,
                  borderLeft: `4px solid ${RED}`,
                  paddingLeft: 18,
                }}
              >
                <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.2 }}>
                  {sections.managerOfWeek.clubName}
                </div>
                <p style={{ fontSize: 15, lineHeight: 1.65, color: INK_2, margin: "8px 0 0" }}>
                  {sections.managerOfWeek.note}
                </p>
              </blockquote>
            </Section>
          )}

          {sections.quotes.length > 0 && (
            <Section title="Tribün Köşesi" kicker="Sesler">
              <div
                data-paper-grid
                style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}
              >
                {sections.quotes.map((q, i) => (
                  <div key={`q-${i}`}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 15.5,
                        fontStyle: "italic",
                        lineHeight: 1.6,
                      }}
                    >
                      “{q.text}”
                    </p>
                    <div
                      style={{
                        fontSize: 11.5,
                        letterSpacing: "0.09em",
                        textTransform: "uppercase",
                        color: INK_3,
                        marginTop: 7,
                      }}
                    >
                      — {q.voice}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {paper.funFact && (
            <div
              style={{
                marginTop: 26,
                padding: "14px 18px",
                background: PAPER_2,
                border: `1px solid ${RULE}`,
                fontSize: 14,
                lineHeight: 1.6,
              }}
            >
              <strong style={{ letterSpacing: "0.06em" }}>NOT DÜŞÜLDÜ · </strong>
              {paper.funFact}
            </div>
          )}

          {sections.upcoming.length > 0 && (
            <Section title="Gelecek Hafta" kicker="Program">
              <div
                data-paper-grid
                style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px 24px" }}
              >
                {sections.upcoming.map((u, i) => (
                  <div
                    key={`u-${i}`}
                    style={{
                      fontSize: 13.5,
                      padding: "7px 0",
                      borderBottom: `1px solid ${RULE_SOFT}`,
                    }}
                  >
                    <span style={{ fontWeight: 700 }}>{u.homeName}</span>
                    <span style={{ color: INK_3 }}> — {u.awayName}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>

        <div
          style={{
            borderTop: `3px double ${INK}`,
            padding: "14px clamp(16px, 3.5vw, 40px)",
            display: "flex",
            justifyContent: "space-between",
            fontSize: 11.5,
            letterSpacing: "0.09em",
            textTransform: "uppercase",
            color: INK_3,
          }}
        >
          <span>ElevenForge Spor</span>
          <span>
            Sezon {cover.seasonNumber} · Hafta {cover.weekNumber}
          </span>
        </div>
      </article>

      {/* The paper is a fixed multi-column layout by design; below 860px the
          columns are what break it, so they collapse rather than the type
          shrinking to nothing. */}
      <style>{`
        @media (max-width: 860px) {
          [data-paper-grid] { grid-template-columns: 1fr !important; }
          [data-newspaper] [data-lead] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

// ─── Pieces ─────────────────────────────────────────────────────────────

function Masthead({ paper }: { paper: NonNullable<NewspaperData> }) {
  const { cover } = paper;
  return (
    <header
      style={{
        padding: "22px clamp(16px, 3.5vw, 40px) 14px",
        borderBottom: `3px double ${INK}`,
        textAlign: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 11,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: INK_3,
          marginBottom: 10,
        }}
      >
        <span>{paper.publishedAtLabel}</span>
        <span>
          Sezon {cover.seasonNumber} · Hafta {cover.weekNumber}
        </span>
      </div>
      <h1
        style={{
          margin: 0,
          fontFamily: "var(--font-manrope)",
          fontWeight: 900,
          fontSize: "clamp(30px, 6vw, 56px)",
          letterSpacing: "-0.03em",
          lineHeight: 1,
        }}
      >
        ElevenForge <span style={{ color: RED }}>SPOR</span>
      </h1>
      <div
        style={{
          fontSize: 11,
          letterSpacing: "0.24em",
          textTransform: "uppercase",
          color: INK_3,
          marginTop: 8,
        }}
      >
        Haftalık Futbol Gazetesi
      </div>
    </header>
  );
}

function LeadStory({ paper }: { paper: NonNullable<NewspaperData> }) {
  const { cover, sections } = paper;
  const heroReport = sections.results.find(
    (r) => r.homeClubId === cover.heroHomeClubId && r.awayClubId === cover.heroAwayClubId,
  );
  return (
    <div style={{ paddingTop: 24 }}>
      <div
        style={{
          fontSize: 11,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: RED,
          fontWeight: 700,
          marginBottom: 10,
        }}
      >
        Manşet
      </div>
      <h2
        style={{
          margin: 0,
          fontFamily: "var(--font-manrope)",
          fontWeight: 900,
          fontSize: "clamp(32px, 6.6vw, 68px)",
          lineHeight: 0.98,
          letterSpacing: "-0.035em",
        }}
      >
        {cover.headline}
      </h2>

      <div
        data-lead
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 220px",
          gap: 28,
          marginTop: 18,
          alignItems: "start",
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontSize: 18,
              lineHeight: 1.55,
              fontWeight: 600,
              color: INK,
            }}
          >
            {cover.subhead}
          </p>
          {heroReport && (
            <>
              <p style={{ fontSize: 15.5, lineHeight: 1.72, color: INK_2, marginTop: 12 }}>
                {heroReport.report}
              </p>
              {heroReport.scorers.length > 0 && (
                <p style={{ fontSize: 13.5, lineHeight: 1.6, color: INK_3, marginTop: 8 }}>
                  <strong>Goller:</strong> {heroReport.scorers.join(", ")}
                </p>
              )}
            </>
          )}
        </div>

        {/* The scoreline, set like a results box rather than a UI card. */}
        <div
          style={{
            border: `2px solid ${INK}`,
            padding: "14px 16px",
            background: PAPER_2,
          }}
        >
          <ScoreLine
            home={cover.heroHomeClubName}
            away={cover.heroAwayClubName}
            hs={cover.homeScore}
            as={cover.awayScore}
            large
          />
        </div>
      </div>
      <div style={{ borderBottom: `1px solid ${RULE}`, marginTop: 26 }} />
    </div>
  );
}

function ScoreLine({
  home,
  away,
  hs,
  as,
  large = false,
}: {
  home: string;
  away: string;
  hs: number;
  as: number;
  large?: boolean;
}) {
  const row = (name: string, score: number, won: boolean) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: 12,
        padding: "3px 0",
      }}
    >
      <span
        style={{
          fontSize: large ? 15 : 13.5,
          fontWeight: won ? 700 : 500,
          color: won ? INK : INK_2,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {name}
      </span>
      <span
        style={{
          fontSize: large ? 26 : 18,
          fontWeight: 800,
          fontVariantNumeric: "tabular-nums",
          color: won ? INK : INK_3,
        }}
      >
        {score}
      </span>
    </div>
  );
  return (
    <div>
      {row(home, hs, hs > as)}
      {row(away, as, as > hs)}
    </div>
  );
}

function MatchReport({
  r,
}: {
  r: NonNullable<NewspaperData>["sections"]["results"][number];
}) {
  return (
    <div style={{ borderTop: `2px solid ${INK}`, paddingTop: 12 }}>
      {r.derby && (
        <div
          style={{
            fontSize: 10,
            letterSpacing: "0.18em",
            color: RED,
            fontWeight: 700,
            marginBottom: 6,
          }}
        >
          DERBİ
        </div>
      )}
      <ScoreLine home={r.homeName} away={r.awayName} hs={r.homeScore} as={r.awayScore} />
      <p style={{ fontSize: 14, lineHeight: 1.65, color: INK_2, margin: "8px 0 0" }}>
        {r.report}
      </p>
      {r.scorers.length > 0 && (
        <p style={{ fontSize: 12.5, lineHeight: 1.55, color: INK_3, margin: "6px 0 0" }}>
          {r.scorers.join(", ")}
        </p>
      )}
    </div>
  );
}

function StandingsTable({
  rows,
}: {
  rows: NonNullable<NewspaperData>["sections"]["table"];
}) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 13.5,
          fontFamily: SERIF,
        }}
      >
        <thead>
          <tr>
            {["#", "Takım", "O", "AV", "P", "Form"].map((h, i) => (
              <th
                key={h}
                style={{
                  textAlign: i === 1 ? "left" : i === 5 ? "right" : "center",
                  padding: "6px 8px",
                  borderBottom: `2px solid ${INK}`,
                  fontSize: 10.5,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: INK_2,
                  whiteSpace: "nowrap",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.clubId}
              style={{
                background: i % 2 === 0 ? "transparent" : "rgba(23,17,11,0.045)",
              }}
            >
              <td
                style={{
                  padding: "7px 8px",
                  textAlign: "center",
                  fontWeight: 700,
                  color: i < 4 ? RED : INK_3,
                  width: 32,
                }}
              >
                {i + 1}
              </td>
              <td style={{ padding: "7px 8px", fontWeight: 600 }}>{r.name}</td>
              <td style={{ padding: "7px 8px", textAlign: "center", color: INK_3 }}>
                {r.played}
              </td>
              <td style={{ padding: "7px 8px", textAlign: "center", color: INK_2 }}>
                {r.goalsFor - r.goalsAgainst > 0 ? "+" : ""}
                {r.goalsFor - r.goalsAgainst}
              </td>
              <td
                style={{
                  padding: "7px 8px",
                  textAlign: "center",
                  fontWeight: 800,
                }}
              >
                {r.points}
              </td>
              <td style={{ padding: "7px 8px", textAlign: "right", whiteSpace: "nowrap" }}>
                {r.form.map((f, j) => (
                  <span
                    key={`f-${j}`}
                    title={f === "W" ? "Galibiyet" : f === "D" ? "Beraberlik" : "Mağlubiyet"}
                    style={{
                      display: "inline-block",
                      width: 15,
                      height: 15,
                      lineHeight: "15px",
                      textAlign: "center",
                      fontSize: 9.5,
                      fontWeight: 800,
                      marginLeft: 2,
                      color: PAPER,
                      background: f === "W" ? "#1d6b3a" : f === "D" ? INK_3 : RED,
                    }}
                  >
                    {f === "W" ? "G" : f === "D" ? "B" : "M"}
                  </span>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TotwStrip({ paper }: { paper: NonNullable<NewspaperData> }) {
  const lines: Array<[string, typeof paper.totw]> = [
    ["Kaleci", paper.totw.filter((t) => t.position === "GK")],
    [
      "Defans",
      paper.totw.filter((t) => ["CB", "LB", "RB"].includes(t.position)),
    ],
    [
      "Orta Saha",
      paper.totw.filter((t) => ["CDM", "CM", "AM", "LM", "RM"].includes(t.position)),
    ],
    [
      "Hücum",
      paper.totw.filter((t) => ["ST", "CF", "LW", "RW"].includes(t.position)),
    ],
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {lines
        .filter(([, list]) => list.length > 0)
        .map(([label, list]) => (
          <div key={label}>
            <div
              style={{
                fontSize: 10.5,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: INK_3,
                marginBottom: 6,
              }}
            >
              {label}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {list.map((t) => (
                <div
                  key={t.playerId}
                  style={{
                    border: `1px solid ${RULE}`,
                    background: PAPER_2,
                    padding: "7px 12px",
                    minWidth: 150,
                  }}
                >
                  <div style={{ fontSize: 13.5, fontWeight: 700 }}>{t.name}</div>
                  <div style={{ fontSize: 11.5, color: INK_3, marginTop: 2 }}>
                    {t.position} ·{" "}
                    <strong style={{ color: RED }}>{t.rating.toFixed(1)}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}

function ChartList({
  title,
  rows,
  unit,
}: {
  title: string;
  rows: Array<[string, number]>;
  unit: string;
}) {
  return (
    <Section title={title} kicker="Sıralama">
      {rows.length === 0 ? (
        <p style={{ fontSize: 13.5, color: INK_3, margin: 0 }}>
          Henüz kimse listeye giremedi.
        </p>
      ) : (
        <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {rows.map(([name, n], i) => (
            <li
              key={`${name}-${i}`}
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 10,
                padding: "8px 0",
                borderBottom: `1px solid ${RULE_SOFT}`,
              }}
            >
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: i === 0 ? RED : INK_3,
                  minWidth: 20,
                }}
              >
                {i + 1}
              </span>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{name}</span>
              <span style={{ fontSize: 14, fontWeight: 800 }}>
                {n}{" "}
                <span style={{ fontSize: 11, fontWeight: 400, color: INK_3 }}>
                  {unit}
                </span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </Section>
  );
}

function CardPips({ yellows, reds }: { yellows: number; reds: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 3, flexShrink: 0 }}>
      {Array.from({ length: Math.min(yellows, 8) }).map((_, i) => (
        <span
          key={`y-${i}`}
          style={{ width: 7, height: 11, background: "#c99a06", borderRadius: 1 }}
        />
      ))}
      {Array.from({ length: Math.min(reds, 4) }).map((_, i) => (
        <span
          key={`r-${i}`}
          style={{ width: 7, height: 11, background: RED, borderRadius: 1 }}
        />
      ))}
    </span>
  );
}

function Section({
  title,
  kicker,
  children,
}: {
  title: string;
  kicker?: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginTop: 34 }}>
      <div style={{ marginBottom: 14 }}>
        {kicker && (
          <div
            style={{
              fontSize: 10.5,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: RED,
              fontWeight: 700,
            }}
          >
            {kicker}
          </div>
        )}
        <h3
          style={{
            margin: "4px 0 0",
            fontFamily: "var(--font-manrope)",
            fontWeight: 800,
            fontSize: "clamp(20px, 2.6vw, 28px)",
            letterSpacing: "-0.02em",
            borderBottom: `2px solid ${INK}`,
            paddingBottom: 8,
          }}
        >
          {title}
        </h3>
      </div>
      {children}
    </section>
  );
}
