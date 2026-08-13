import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Bot, ChevronRight, MapPin, Trophy, User2 } from "lucide-react";
import { Crest, OvrChip, PosBadge } from "@/components/ui/primitives";
import { requireLeagueContext } from "@/lib/session";
import { loadClubDetail } from "@/lib/queries/club-detail";
import { fmtEUR } from "@/lib/utils";

export const dynamic = "force-dynamic";

const RESULT_TINT: Record<"W" | "D" | "L", string> = {
  W: "var(--emerald)",
  D: "var(--muted)",
  L: "var(--danger)",
};

const STATUS_BADGE: Record<string, { label: string; tint: string }> = {
  injured: { label: "SAKAT", tint: "var(--danger)" },
  suspended: { label: "CEZALI", tint: "var(--warn)" },
  listed: { label: "SATIŞTA", tint: "var(--emerald)" },
  training: { label: "ANTRENMAN", tint: "var(--cyan)" },
};

export default async function ClubPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireLeagueContext();
  const club = await loadClubDetail(ctx, id);
  if (!club) notFound();

  const gd = club.goalsFor - club.goalsAgainst;

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "20px 28px 60px" }}>
      <Link
        href="/standings"
        className="btn btn-ghost btn-sm"
        style={{ gap: 7, marginBottom: 18 }}
      >
        <ArrowLeft size={14} strokeWidth={1.8} />
        Puan Durumu
      </Link>

      {/* Identity band, painted in the club's own colours so two rival pages
          never look like the same page. */}
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 20,
          border: "1px solid var(--border)",
          background: `linear-gradient(120deg, color-mix(in oklab, ${club.color} 26%, var(--panel)) 0%, var(--panel) 55%, var(--panel-2) 100%)`,
          padding: "26px 28px",
          marginBottom: 18,
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(circle at 88% 12%, color-mix(in oklab, ${club.color2} 30%, transparent), transparent 55%)`,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          <Crest
            clubId={club.id}
            size={72}
            ring
            club={{ color: club.color, color2: club.color2, short: club.shortName }}
          />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <span className="t-label" style={{ fontSize: 10.5 }}>
                {club.division === 1 ? "SÜPER LİG" : "1. LİG"}
              </span>
              <span
                className="t-mono"
                style={{
                  fontSize: 10,
                  padding: "2px 8px",
                  borderRadius: 999,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  background: club.isBot
                    ? "color-mix(in oklab, var(--muted) 18%, transparent)"
                    : "color-mix(in oklab, var(--accent) 20%, transparent)",
                  color: club.isBot ? "var(--muted)" : "var(--accent)",
                  fontWeight: 700,
                }}
              >
                {club.isBot ? (
                  <Bot size={11} strokeWidth={1.9} />
                ) : (
                  <User2 size={11} strokeWidth={1.9} />
                )}
                {club.managerLabel}
              </span>
              {club.isMine && (
                <span
                  className="t-mono"
                  style={{
                    fontSize: 10,
                    padding: "2px 8px",
                    borderRadius: 999,
                    background: "color-mix(in oklab, var(--accent) 28%, transparent)",
                    color: "var(--accent)",
                    fontWeight: 700,
                  }}
                >
                  SENİN KULÜBÜN
                </span>
              )}
            </div>
            <h1 className="t-h1" style={{ margin: "6px 0 4px" }}>
              {club.name}
            </h1>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                color: "var(--muted)",
                fontSize: 13,
                flexWrap: "wrap",
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                <MapPin size={13} strokeWidth={1.7} />
                {club.city}
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                <Trophy size={13} strokeWidth={1.7} />
                Prestij {club.prestige}
              </span>
            </div>
          </div>

          {/* Position, given the weight it has in a table-driven game. */}
          <div style={{ textAlign: "right" }}>
            <div
              className="t-mono"
              style={{
                fontSize: 46,
                fontWeight: 800,
                lineHeight: 1,
                letterSpacing: "-0.04em",
                color: "var(--text)",
              }}
            >
              {club.position}
              <span style={{ fontSize: 18, color: "var(--muted)" }}>
                /{club.divisionSize}
              </span>
            </div>
            <span className="t-label" style={{ fontSize: 10 }}>
              SIRA · {club.points} PUAN
            </span>
          </div>
        </div>
      </section>

      {/* Season line + squad shape, as numbers you can compare at a glance. */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(128px, 1fr))",
          gap: 10,
          marginBottom: 18,
        }}
      >
        {(
          [
            ["OYNANAN", String(club.played), "var(--text)"],
            ["G / B / M", `${club.wins}/${club.draws}/${club.losses}`, "var(--text)"],
            [
              "AVERAJ",
              `${gd > 0 ? "+" : ""}${gd}`,
              gd > 0 ? "var(--emerald)" : gd < 0 ? "var(--danger)" : "var(--muted)",
            ],
            ["ATILAN / YENEN", `${club.goalsFor}/${club.goalsAgainst}`, "var(--text)"],
            ["KADRO DEĞERİ", fmtEUR(club.squadValueEur), "var(--emerald)"],
            ["ORT. OVERALL", club.avgOverall.toFixed(1), "var(--gold)"],
            ["ORT. YAŞ", club.avgAge.toFixed(1), "var(--text)"],
          ] as Array<[string, string, string]>
        ).map(([label, value, tint]) => (
          <div
            key={label}
            style={{
              borderRadius: 14,
              border: "1px solid var(--border)",
              background: "var(--panel)",
              padding: "12px 14px",
            }}
          >
            <span className="t-label" style={{ fontSize: 9.5 }}>
              {label}
            </span>
            <div
              className="t-mono"
              style={{ fontSize: 19, fontWeight: 700, color: tint, marginTop: 4 }}
            >
              {value}
            </div>
          </div>
        ))}
      </section>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 320px",
          gap: 18,
          alignItems: "start",
        }}
        data-club-layout
      >
        {/* Squad. Every row goes to the player page, which is where an offer
            is actually made — the point of coming here from the table. */}
        <section
          style={{
            borderRadius: 18,
            border: "1px solid var(--border)",
            background: "var(--panel)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 18px",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <span className="t-label" style={{ fontSize: 11 }}>
              KADRO · {club.squad.length} OYUNCU
            </span>
            <span className="t-caption" style={{ fontSize: 11 }}>
              Bir oyuncuya tıkla → teklif yap
            </span>
          </div>

          {club.squad.length === 0 ? (
            <div style={{ padding: 30, textAlign: "center", color: "var(--muted)" }}>
              Bu kulübün kadrosu boş.
            </div>
          ) : (
            club.squad.map((p, i) => {
              const badge = STATUS_BADGE[p.status];
              return (
                <Link
                  key={p.id}
                  href={`/player/${p.id}`}
                  className="club-squad-row"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "44px 34px minmax(0, 1fr) 86px 54px 96px 18px",
                    gap: 10,
                    alignItems: "center",
                    padding: "10px 18px",
                    textDecoration: "none",
                    color: "var(--text)",
                    borderBottom:
                      i === club.squad.length - 1 ? "none" : "1px solid var(--border)",
                    background:
                      i % 2 === 0
                        ? "color-mix(in oklab, var(--panel-2) 40%, transparent)"
                        : "transparent",
                  }}
                >
                  <OvrChip ovr={p.ovr} size="sm" />
                  <PosBadge pos={p.pos} size={22} />
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {p.name}
                    </div>
                    <span
                      className="t-mono"
                      style={{ fontSize: 10, color: "var(--muted)" }}
                    >
                      {p.role} · {p.nat}
                      {p.num !== null && ` · #${p.num}`}
                    </span>
                  </div>
                  <div>
                    {badge && (
                      <span
                        className="t-mono"
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          padding: "2px 7px",
                          borderRadius: 5,
                          background: `color-mix(in oklab, ${badge.tint} 16%, transparent)`,
                          color: badge.tint,
                        }}
                      >
                        {badge.label}
                      </span>
                    )}
                  </div>
                  <span
                    className="t-mono"
                    style={{ fontSize: 12, color: "var(--muted)", textAlign: "center" }}
                  >
                    {p.age}y
                  </span>
                  <span
                    className="t-mono"
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--emerald)",
                      textAlign: "right",
                    }}
                  >
                    {fmtEUR(p.valueEur)}
                  </span>
                  <ChevronRight
                    size={14}
                    strokeWidth={1.8}
                    style={{ color: "var(--muted-2)" }}
                  />
                </Link>
              );
            })
          )}
        </section>

        <aside style={{ display: "grid", gap: 14 }}>
          {club.next && (
            <section
              style={{
                borderRadius: 18,
                border: "1px solid var(--border)",
                background: "var(--panel)",
                padding: 16,
              }}
            >
              <span className="t-label" style={{ fontSize: 10.5 }}>
                SIRADAKİ MAÇ
              </span>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginTop: 10,
                }}
              >
                <Crest
                  clubId={club.next.opponentId}
                  size={30}
                  club={{
                    color: club.next.opponentColor,
                    color2: club.next.opponentColor2,
                    short: club.next.opponentShort,
                  }}
                />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>
                    {club.next.opponentName}
                  </div>
                  <span className="t-mono" style={{ fontSize: 10, color: "var(--muted)" }}>
                    {club.next.isHome ? "EV SAHİBİ" : "DEPLASMAN"} · HAFTA{" "}
                    {club.next.week}
                  </span>
                </div>
              </div>
            </section>
          )}

          <section
            style={{
              borderRadius: 18,
              border: "1px solid var(--border)",
              background: "var(--panel)",
              padding: 16,
            }}
          >
            <span className="t-label" style={{ fontSize: 10.5 }}>
              SON MAÇLAR
            </span>
            {club.recent.length === 0 ? (
              <p className="t-caption" style={{ fontSize: 12, marginTop: 10 }}>
                Henüz maç oynanmadı.
              </p>
            ) : (
              <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                {club.recent.map((f) => (
                  <Link
                    key={f.id}
                    href={`/match/${f.id}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 9,
                      textDecoration: "none",
                      color: "var(--text)",
                    }}
                  >
                    <span
                      className="t-mono"
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 5,
                        flexShrink: 0,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        fontWeight: 800,
                        color: f.result ? RESULT_TINT[f.result] : "var(--muted)",
                        background: f.result
                          ? `color-mix(in oklab, ${RESULT_TINT[f.result]} 16%, transparent)`
                          : "transparent",
                      }}
                    >
                      {f.result ?? "–"}
                    </span>
                    <span
                      style={{
                        fontSize: 12.5,
                        flex: 1,
                        minWidth: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {f.isHome ? "" : "@ "}
                      {f.opponentName}
                    </span>
                    <span className="t-mono" style={{ fontSize: 12, fontWeight: 700 }}>
                      {f.homeScore}-{f.awayScore}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
