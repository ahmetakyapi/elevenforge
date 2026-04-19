import Link from "next/link";
import { BarChart2, Goal, Hand, Star, Square, ShieldCheck } from "lucide-react";
import { requireLeagueContext } from "@/lib/session";
import { loadLeagueStats, type StatsRow } from "@/lib/queries/stats";

export const dynamic = "force-dynamic";

const POS_TINT: Record<StatsRow["position"], string> = {
  GK: "var(--gold)",
  DEF: "var(--indigo)",
  MID: "var(--accent)",
  FWD: "var(--emerald)",
};

export default async function StatsPage() {
  const ctx = await requireLeagueContext();
  const s = await loadLeagueStats(ctx);

  return (
    <div style={{ maxWidth: 1300, margin: "0 auto", padding: "20px 28px 60px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "color-mix(in oklab, var(--accent) 22%, transparent)",
            color: "var(--accent)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <BarChart2 size={22} strokeWidth={1.6} />
        </div>
        <div>
          <span className="t-label" style={{ color: "var(--accent)" }}>
            İSTATİSTİKLER
          </span>
          <div className="t-h1" style={{ marginTop: 4 }}>
            Lig Sıralamaları
          </div>
          <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>
            Sezon {ctx.league.seasonNumber} · Hafta {ctx.league.weekNumber} ·
            Toplam {s.totalGoals} gol · {s.totalCards} kart
          </div>
        </div>
      </div>

      {(s.goldenBoot || s.playmaker) && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            marginBottom: 18,
          }}
          data-lp-grid="2"
        >
          {s.goldenBoot && (
            <Crown
              title="Gol Krallığı"
              subtitle={`${s.goldenBoot.goals} gol`}
              row={s.goldenBoot}
              tint="var(--gold)"
              Icon={Goal}
            />
          )}
          {s.playmaker && (
            <Crown
              title="Asist Lideri"
              subtitle={`${s.playmaker.assists} asist`}
              row={s.playmaker}
              tint="var(--cyan)"
              Icon={Hand}
            />
          )}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} data-lp-grid="2">
        <Leaderboard title="Gol" Icon={Goal} tint="var(--emerald)" rows={s.topScorers} valueKey="goals" />
        <Leaderboard title="Asist" Icon={Hand} tint="var(--cyan)" rows={s.topAssists} valueKey="assists" />
        <Leaderboard title="Form (5 maç ort.)" Icon={Star} tint="var(--accent)" rows={s.topRated} valueKey="ratingAvg" decimals />
        <Leaderboard title="Kart Liderleri" Icon={Square} tint="var(--warn)" rows={s.cardsLeaders} valueKey="yellow" extraKey="red" />
      </div>
      <div style={{ marginTop: 14 }}>
        <Leaderboard
          title="Centilmen Oyuncular"
          Icon={ShieldCheck}
          tint="var(--emerald)"
          rows={s.cleanestPlayers}
          valueKey="ratingAvg"
          decimals
          fullWidth
        />
      </div>
    </div>
  );
}

function Crown({
  title,
  subtitle,
  row,
  tint,
  Icon,
}: {
  title: string;
  subtitle: string;
  row: StatsRow;
  tint: string;
  Icon: typeof Goal;
}) {
  return (
    <Link
      href={`/player/${row.playerId}`}
      style={{
        textDecoration: "none",
        padding: "20px 22px",
        borderRadius: 14,
        background: `linear-gradient(135deg, color-mix(in oklab, ${tint} 22%, var(--panel)), var(--panel))`,
        border: `1px solid color-mix(in oklab, ${tint} 30%, var(--border))`,
        display: "flex",
        gap: 16,
        alignItems: "center",
        color: "var(--text)",
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          background: `color-mix(in oklab, ${tint} 30%, transparent)`,
          color: tint,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={28} strokeWidth={1.6} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span className="t-label" style={{ color: tint }}>
          {title.toUpperCase()}
        </span>
        <div style={{ fontSize: 22, fontWeight: 700, marginTop: 2 }}>{row.name}</div>
        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
          {row.clubName ?? "Serbest"} · {subtitle}
        </div>
      </div>
      <div
        className="t-mono"
        style={{
          padding: "6px 14px",
          borderRadius: 8,
          background: "color-mix(in oklab, var(--panel-2) 60%, transparent)",
          color: tint,
          fontWeight: 700,
          fontSize: 18,
        }}
      >
        {row.overall}
      </div>
    </Link>
  );
}

function Leaderboard({
  title,
  Icon,
  tint,
  rows,
  valueKey,
  extraKey,
  decimals,
  fullWidth,
}: {
  title: string;
  Icon: typeof Goal;
  tint: string;
  rows: StatsRow[];
  valueKey: keyof StatsRow;
  extraKey?: keyof StatsRow;
  decimals?: boolean;
  fullWidth?: boolean;
}) {
  if (rows.length === 0) {
    return (
      <div
        style={{
          padding: "20px 22px",
          borderRadius: 12,
          background: "var(--panel)",
          border: "1px solid var(--border)",
          gridColumn: fullWidth ? "1 / -1" : undefined,
        }}
      >
        <Header Icon={Icon} tint={tint} title={title} />
        <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 12 }}>
          Henüz veri yok.
        </div>
      </div>
    );
  }
  return (
    <div
      style={{
        padding: "16px 18px",
        borderRadius: 12,
        background: "var(--panel)",
        border: "1px solid var(--border)",
        gridColumn: fullWidth ? "1 / -1" : undefined,
      }}
    >
      <Header Icon={Icon} tint={tint} title={title} />
      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 12 }}>
        {rows.map((r, i) => {
          const v = r[valueKey] as number | null | string;
          const e = extraKey ? (r[extraKey] as number) : null;
          return (
            <Link
              key={r.playerId}
              href={`/player/${r.playerId}`}
              style={{
                display: "grid",
                gridTemplateColumns: "24px 24px minmax(0, 1fr) 60px 60px",
                gap: 8,
                alignItems: "center",
                padding: "8px 10px",
                borderRadius: 8,
                background:
                  i === 0
                    ? `color-mix(in oklab, ${tint} 14%, transparent)`
                    : "color-mix(in oklab, var(--panel-2) 50%, transparent)",
                textDecoration: "none",
                color: "var(--text)",
              }}
            >
              <span
                className="t-mono"
                style={{
                  fontSize: 11,
                  color: i === 0 ? tint : "var(--muted)",
                  fontWeight: 700,
                  textAlign: "center",
                }}
              >
                {i + 1}
              </span>
              <span
                className="t-mono"
                style={{
                  fontSize: 9,
                  padding: "1px 5px",
                  borderRadius: 3,
                  background: `color-mix(in oklab, ${POS_TINT[r.position]} 22%, transparent)`,
                  color: POS_TINT[r.position],
                  textAlign: "center",
                  fontWeight: 700,
                }}
              >
                {r.role}
              </span>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {r.name}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--muted)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {r.clubName ?? "Serbest"}
                </div>
              </div>
              <span
                className="t-mono"
                style={{ fontSize: 11, color: "var(--muted)", textAlign: "right" }}
              >
                OVR {r.overall}
              </span>
              <span
                className="t-mono"
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: tint,
                  textAlign: "right",
                }}
              >
                {decimals && typeof v === "number" ? v.toFixed(1) : (v ?? "—")}
                {extraKey && e !== null && e > 0 && (
                  <span style={{ fontSize: 10, color: "var(--danger)", marginLeft: 4 }}>
                    +{e}🟥
                  </span>
                )}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function Header({
  Icon,
  tint,
  title,
}: {
  Icon: typeof Goal;
  tint: string;
  title: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <Icon size={14} strokeWidth={1.6} style={{ color: tint }} />
      <span className="t-label" style={{ color: tint }}>
        {title.toUpperCase()}
      </span>
    </div>
  );
}
