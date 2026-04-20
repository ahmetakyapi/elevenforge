import { ListOrdered } from "lucide-react";
import { Crest } from "@/components/ui/primitives";
import { requireLeagueContext } from "@/lib/session";
import { loadDashboardData } from "@/lib/queries/dashboard";

export const dynamic = "force-dynamic";

const FORM_TINT: Record<"W" | "D" | "L", string> = {
  W: "var(--emerald)",
  D: "var(--muted)",
  L: "var(--danger)",
};

export default async function StandingsPage() {
  const ctx = await requireLeagueContext();
  const d = await loadDashboardData(ctx);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 28px 60px" }}>
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
          <ListOrdered size={22} strokeWidth={1.6} />
        </div>
        <div>
          <span className="t-label" style={{ color: "var(--accent)" }}>
            PUAN DURUMU
          </span>
          <div className="t-h1" style={{ marginTop: 4 }}>
            {d.leagueInfo.name}
          </div>
          <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>
            Sezon {d.leagueInfo.seasonNumber} · Hafta {d.leagueInfo.weekNumber} ·
            {d.leagueInfo.memberCount} insan + {d.leagueInfo.botCount} bot
          </div>
        </div>
      </div>

      <div
        data-dense-table
        data-dense-table-xwide
        style={{
          background: "var(--panel)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "32px 32px minmax(0, 1fr) repeat(7, 44px) 110px",
            gap: 6,
            padding: "12px 14px",
            background: "color-mix(in oklab, var(--panel-2) 60%, transparent)",
            borderBottom: "1px solid var(--border)",
            fontSize: 11,
            color: "var(--muted)",
            fontWeight: 600,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          <span>#</span>
          <span></span>
          <span>Takım</span>
          <span style={{ textAlign: "center" }}>O</span>
          <span style={{ textAlign: "center" }}>G</span>
          <span style={{ textAlign: "center" }}>B</span>
          <span style={{ textAlign: "center" }}>M</span>
          <span style={{ textAlign: "center" }}>A</span>
          <span style={{ textAlign: "center" }}>Y</span>
          <span style={{ textAlign: "center", color: "var(--text)" }}>P</span>
          <span style={{ textAlign: "center" }}>Form</span>
        </div>
        {d.standings.map((row, i) => {
          const rank = i + 1;
          const promo = rank <= 4;
          const releg = rank >= 14;
          return (
            <div
              key={row.clubId}
              style={{
                display: "grid",
                gridTemplateColumns: "32px 32px minmax(0, 1fr) repeat(7, 44px) 110px",
                gap: 6,
                padding: "10px 14px",
                alignItems: "center",
                borderBottom: i === d.standings.length - 1 ? "none" : "1px solid var(--border)",
                background: row.isMe
                  ? "color-mix(in oklab, var(--accent) 10%, transparent)"
                  : "transparent",
                position: "relative",
              }}
            >
              <span
                className="t-mono"
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: promo
                    ? "var(--emerald)"
                    : releg
                      ? "var(--danger)"
                      : "var(--text)",
                  textAlign: "center",
                }}
              >
                {rank}
              </span>
              <Crest
                clubId={row.clubId}
                size={26}
                club={{ color: row.color, color2: row.color2, short: row.shortName }}
              />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  minWidth: 0,
                  overflow: "hidden",
                }}
              >
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {row.name}
                </span>
                {row.isMe && (
                  <span
                    style={{
                      fontSize: 9,
                      padding: "1px 6px",
                      borderRadius: 3,
                      background: "color-mix(in oklab, var(--accent) 30%, transparent)",
                      color: "var(--accent)",
                      fontWeight: 700,
                    }}
                  >
                    SEN
                  </span>
                )}
              </div>
              <Cell value={row.p} />
              <Cell value={row.w} c="var(--emerald)" />
              <Cell value={row.d} c="var(--muted)" />
              <Cell value={row.l} c="var(--danger)" />
              <Cell value={row.gf} />
              <Cell value={row.ga} />
              <Cell
                value={row.pts}
                c="var(--text)"
                w={700}
              />
              <div style={{ display: "flex", gap: 3, justifyContent: "center" }}>
                {row.form.length === 0 ? (
                  <span style={{ fontSize: 10, color: "var(--muted)" }}>—</span>
                ) : (
                  row.form.map((r, j) => (
                    <span
                      key={j}
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 3,
                        background: `color-mix(in oklab, ${FORM_TINT[r]} 28%, transparent)`,
                        color: FORM_TINT[r],
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 9,
                        fontWeight: 700,
                      }}
                    >
                      {r}
                    </span>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 14,
          display: "flex",
          gap: 14,
          flexWrap: "wrap",
          fontSize: 11,
          color: "var(--muted)",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--emerald)" }} />
          1-4: Avrupa kupası + prize money
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--danger)" }} />
          14-16: Küme düşme bölgesi (board &quot;survive&quot; hedefi)
        </span>
      </div>
    </div>
  );
}

function Cell({
  value,
  c = "var(--text)",
  w = 500,
}: {
  value: number;
  c?: string;
  w?: number;
}) {
  return (
    <span
      className="t-mono"
      style={{ fontSize: 13, color: c, fontWeight: w, textAlign: "center" }}
    >
      {value}
    </span>
  );
}
