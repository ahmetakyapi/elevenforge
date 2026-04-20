import Link from "next/link";
import { Award, Briefcase, ListOrdered, Trophy, User2 } from "lucide-react";
import { requireLeagueContext } from "@/lib/session";
import { loadManagerProfile } from "@/lib/queries/manager-profile";
import { fmtEUR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const ctx = await requireLeagueContext();
  const p = await loadManagerProfile(ctx);
  const since = new Date(p.joinedAtMs);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 28px 60px" }}>
      <div
        style={{
          padding: 24,
          borderRadius: 16,
          background:
            "linear-gradient(135deg, color-mix(in oklab, var(--indigo) 18%, var(--panel)), var(--panel))",
          border: "1px solid var(--border)",
          display: "grid",
          gridTemplateColumns: "auto 1fr auto",
          gap: 20,
          alignItems: "center",
          marginBottom: 18,
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "linear-gradient(135deg, var(--indigo), var(--emerald))",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <User2 size={36} strokeWidth={1.6} style={{ color: "#fff" }} />
        </div>
        <div>
          <span className="t-label" style={{ color: "var(--indigo)" }}>
            MENAJER PROFİLİ
          </span>
          <div className="t-h1" style={{ marginTop: 4 }}>
            {p.name}
          </div>
          <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>
            {p.email} · {since.getFullYear()}&apos;den beri menajer
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            className="t-mono"
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: "var(--gold)",
            }}
          >
            {p.totals.championships}
          </div>
          <span style={{ fontSize: 11, color: "var(--muted)" }}>şampiyonluk</span>
        </div>
      </div>

      {/* Totals grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          marginBottom: 18,
        }}
        data-lp-grid="4"
      >
        <Stat label="Lig" value={p.totals.leaguesPlayed} Icon={ListOrdered} />
        <Stat label="Kupa" value={p.totals.cupsWon} Icon={Trophy} />
        <Stat label="Yenilmez Sezon" value={p.totals.perfectSeasons} Icon={Award} />
        <Stat label="Transfer" value={p.totals.transfersMade} Icon={Briefcase} />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 18,
        }}
        data-lp-grid="2"
      >
        <KV
          label="Toplam kasa"
          value={fmtEUR(p.totals.totalBalanceEur)}
          tint="var(--emerald)"
        />
        <KV
          label="Toplam kadro değeri"
          value={fmtEUR(p.totals.totalSquadValueEur)}
          tint="var(--accent)"
        />
      </div>

      {/* Leagues */}
      <div
        style={{
          padding: "16px 18px",
          background: "var(--panel)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          marginBottom: 18,
        }}
      >
        <span className="t-label">LİGLERİM</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
          {p.ownedLeagues.map((l) => (
            <Link
              key={l.leagueId}
              href="/dashboard"
              data-profile-league-row
              style={{
                display: "grid",
                gridTemplateColumns: "10px 1fr 60px 90px 100px",
                gap: 12,
                alignItems: "center",
                padding: "10px 12px",
                borderRadius: 8,
                background: "color-mix(in oklab, var(--panel-2) 60%, transparent)",
                textDecoration: "none",
                color: "var(--text)",
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  background: l.clubColor,
                }}
              />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{l.leagueName}</div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>
                  {l.clubName} · S{l.seasonNumber} W{l.weekNumber}
                  {l.isCommissioner && " · ⚙ kurucu"}
                </div>
              </div>
              <span
                className="t-mono"
                style={{
                  fontSize: 12,
                  textAlign: "center",
                  color: l.rank === 1 ? "var(--gold)" : "var(--text)",
                  fontWeight: l.rank === 1 ? 700 : 500,
                }}
              >
                #{l.rank}
              </span>
              <span
                className="t-mono"
                style={{
                  fontSize: 12,
                  color: "var(--muted)",
                  textAlign: "right",
                }}
              >
                {l.points}p
              </span>
              <span style={{ textAlign: "right", color: "var(--muted)", fontSize: 12 }}>
                Aç →
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Trophy cabinet */}
      <div
        style={{
          padding: "16px 18px",
          background: "var(--panel)",
          border: "1px solid var(--border)",
          borderRadius: 12,
        }}
      >
        <span className="t-label">VİTRİN</span>
        {p.trophies.length === 0 ? (
          <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 10 }}>
            Henüz kupa yok. İlk şampiyonluğa hadi.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 10,
              marginTop: 12,
            }}
          >
            {p.trophies.map((t, i) => (
              <div
                key={i}
                style={{
                  padding: "12px 14px",
                  borderRadius: 10,
                  background: `color-mix(in oklab, ${t.tint} 12%, transparent)`,
                  border: `1px solid color-mix(in oklab, ${t.tint} 30%, var(--border))`,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <span style={{ fontSize: 24 }}>{t.emoji}</span>
                <div>
                  <div style={{ fontWeight: 600, color: t.tint }}>{t.label}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>
                    {t.leagueName}
                    {t.season !== null && ` · Sezon ${t.season}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  Icon,
}: {
  label: string;
  value: number | string;
  Icon: typeof Trophy;
}) {
  return (
    <div
      style={{
        padding: "14px 16px",
        background: "var(--panel)",
        border: "1px solid var(--border)",
        borderRadius: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <Icon size={12} strokeWidth={1.6} style={{ color: "var(--muted)" }} />
        <span className="t-caption" style={{ fontSize: 10 }}>
          {label}
        </span>
      </div>
      <div className="t-mono" style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>
        {value}
      </div>
    </div>
  );
}

function KV({
  label,
  value,
  tint,
}: {
  label: string;
  value: string;
  tint: string;
}) {
  return (
    <div
      style={{
        padding: "12px 14px",
        background: "var(--panel)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span className="t-caption" style={{ fontSize: 11 }}>
        {label}
      </span>
      <span className="t-mono" style={{ fontWeight: 700, color: tint }}>
        {value}
      </span>
    </div>
  );
}
