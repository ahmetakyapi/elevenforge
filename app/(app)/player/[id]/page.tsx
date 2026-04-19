import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { requireLeagueContext } from "@/lib/session";
import { loadPlayerDetail } from "@/lib/queries/player-detail";
import { fmtEUR } from "@/lib/utils";

export const dynamic = "force-dynamic";

const POS_TINT: Record<string, string> = {
  GK: "var(--gold)",
  DEF: "var(--indigo)",
  MID: "var(--accent)",
  FWD: "var(--emerald)",
};

const STATUS_LABEL: Record<string, { label: string; tint: string }> = {
  active: { label: "Aktif", tint: "var(--emerald)" },
  injured: { label: "Sakat", tint: "var(--danger)" },
  suspended: { label: "Cezalı", tint: "var(--warn)" },
  training: { label: "Antrenmanda", tint: "var(--cyan)" },
  listed: { label: "Listede", tint: "var(--muted)" },
};

export default async function PlayerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireLeagueContext();
  const p = await loadPlayerDetail(ctx, id);
  if (!p) notFound();

  const status = STATUS_LABEL[p.status] ?? STATUS_LABEL.active;
  const ratingAvg =
    p.recentForm.length > 0
      ? (p.recentForm.reduce((s, r) => s + r, 0) / p.recentForm.length).toFixed(1)
      : "—";

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 28px 60px" }}>
      <Link
        href="/squad"
        className="btn btn-ghost btn-sm"
        style={{
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 18,
        }}
      >
        <ArrowLeft size={14} strokeWidth={1.6} /> Kadroya dön
      </Link>

      {/* Hero */}
      <div
        style={{
          padding: 28,
          borderRadius: 16,
          background: `linear-gradient(160deg, color-mix(in oklab, ${POS_TINT[p.position]} 18%, var(--panel)) 0%, var(--panel) 60%, var(--panel-2) 100%)`,
          border: "1px solid var(--border)",
          display: "grid",
          gridTemplateColumns: "auto 1fr auto",
          gap: 24,
          alignItems: "center",
          marginBottom: 18,
        }}
      >
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${POS_TINT[p.position]}, var(--accent))`,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-manrope)",
            fontWeight: 800,
            fontSize: 36,
            color: "#fff",
            border: "3px solid var(--bg)",
          }}
        >
          {p.jerseyNumber ?? "?"}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              className="t-mono"
              style={{
                fontSize: 11,
                padding: "2px 8px",
                borderRadius: 4,
                background: `color-mix(in oklab, ${POS_TINT[p.position]} 28%, transparent)`,
                color: POS_TINT[p.position],
                fontWeight: 700,
              }}
            >
              {p.role}
            </span>
            {p.secondaryRoles.length > 0 && (
              <span style={{ fontSize: 11, color: "var(--muted)" }}>
                {p.secondaryRoles.join(" / ")} de oynar
              </span>
            )}
            <span
              style={{
                fontSize: 11,
                padding: "2px 8px",
                borderRadius: 4,
                background: `color-mix(in oklab, ${status.tint} 22%, transparent)`,
                color: status.tint,
                fontWeight: 600,
              }}
            >
              {status.label}
            </span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 700 }}>{p.name}</div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>
            {p.nationality} · {p.age} yaş · {p.contractYears} yıl sözleşme
            {p.clubName && (
              <>
                {" · "}
                <span style={{ color: p.clubColor ?? "var(--text)" }}>{p.clubName}</span>
              </>
            )}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 6,
          }}
        >
          <div
            className="t-mono"
            style={{
              padding: "8px 18px",
              borderRadius: 10,
              background: "color-mix(in oklab, var(--accent) 22%, transparent)",
              color: "var(--accent)",
              fontWeight: 800,
              fontSize: 28,
            }}
          >
            {p.overall}
          </div>
          <span style={{ fontSize: 11, color: "var(--muted)" }}>
            Pot. {p.potential}
          </span>
        </div>
      </div>

      {p.loanOwnerName && p.loanReturnsAt && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            background: "color-mix(in oklab, var(--cyan) 12%, transparent)",
            border: "1px solid color-mix(in oklab, var(--cyan) 30%, var(--border))",
            color: "var(--cyan)",
            fontSize: 13,
            marginBottom: 18,
          }}
        >
          Bu oyuncu kiralık —{" "}
          <strong>{p.loanOwnerName}</strong>{" "}
          kulübünden;{" "}
          {Math.max(0, Math.ceil((p.loanReturnsAt - Date.now()) / (24 * 3600 * 1000)))}{" "}
          gün sonra döner.
        </div>
      )}

      {/* Stat grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          marginBottom: 18,
        }}
      >
        <Stat label="Sezon Gol" value={p.goalsSeason} tint="var(--emerald)" />
        <Stat label="Sezon Asist" value={p.assistsSeason} tint="var(--cyan)" />
        <Stat label="Sarı / Kırmızı" value={`${p.yellowCardsSeason} / ${p.redCardsSeason}`} tint="var(--warn)" />
        <Stat label="Form Ort." value={ratingAvg} tint="var(--accent)" />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 18,
        }}
      >
        <Bar label="Form" value={p.fitness} max={100} tint="var(--emerald)" />
        <Bar label="Moral" value={p.morale} max={5} tint="var(--accent)" />
      </div>

      {/* Position attributes */}
      <div
        style={{
          padding: "16px 18px",
          background: "var(--panel)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          marginBottom: 18,
        }}
      >
        <span className="t-label">ATRİBÜLER</span>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
            marginTop: 12,
          }}
        >
          <AttrBar label="Hız" value={p.pace} />
          <AttrBar label="Şut" value={p.shooting} />
          <AttrBar label="Pas" value={p.passing} />
          <AttrBar label="Savunma" value={p.defending} />
          <AttrBar label="Fizik" value={p.physical} />
          <AttrBar
            label={p.position === "GK" ? "Kaleci" : "Refleks"}
            value={p.goalkeeping}
          />
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 18,
        }}
      >
        <KV label="Piyasa değeri" value={fmtEUR(p.marketValueEur)} />
        <KV label="Haftalık ücret" value={fmtEUR(p.wageEur)} />
      </div>

      {/* Recent ratings */}
      <div
        style={{
          padding: "16px 18px",
          background: "var(--panel)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          marginBottom: 18,
        }}
      >
        <span className="t-label">SON 5 MAÇ REYTİNG</span>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          {p.recentForm.length === 0 ? (
            <span style={{ color: "var(--muted)", fontSize: 13 }}>
              Henüz maç oynamadı.
            </span>
          ) : (
            p.recentForm.map((r, i) => {
              const tint =
                r >= 8 ? "var(--emerald)" : r >= 7 ? "var(--cyan)" : r >= 6 ? "var(--text)" : "var(--danger)";
              return (
                <div
                  key={i}
                  className="t-mono"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 8,
                    background: `color-mix(in oklab, ${tint} 18%, transparent)`,
                    color: tint,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 16,
                  }}
                >
                  {r.toFixed(1)}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Transfer history */}
      <div
        style={{
          padding: "16px 18px",
          background: "var(--panel)",
          border: "1px solid var(--border)",
          borderRadius: 12,
        }}
      >
        <span className="t-label">TRANSFER GEÇMİŞİ</span>
        {p.history.length === 0 ? (
          <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 12 }}>
            Henüz transfer olmadı.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
            {p.history.map((h, i) => (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 24px 1fr 100px",
                  gap: 10,
                  alignItems: "center",
                  padding: "8px 10px",
                  borderRadius: 8,
                  background: "color-mix(in oklab, var(--panel-2) 60%, transparent)",
                  fontSize: 13,
                }}
              >
                <span style={{ color: "var(--muted)" }}>{h.fromClubName ?? "Bot pazar"}</span>
                <ChevronRight size={14} strokeWidth={1.6} style={{ color: "var(--muted)" }} />
                <span>{h.toClubName}</span>
                <span className="t-mono" style={{ textAlign: "right", color: "var(--emerald)" }}>
                  {fmtEUR(h.priceEur)}
                </span>
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
  tint,
}: {
  label: string;
  value: number | string;
  tint: string;
}) {
  return (
    <div
      style={{
        padding: "12px 14px",
        background: "var(--panel)",
        border: "1px solid var(--border)",
        borderRadius: 10,
      }}
    >
      <div className="t-caption" style={{ fontSize: 10 }}>
        {label}
      </div>
      <div
        className="t-mono"
        style={{ fontSize: 22, fontWeight: 700, color: tint, marginTop: 4 }}
      >
        {value}
      </div>
    </div>
  );
}

function Bar({
  label,
  value,
  max,
  tint,
}: {
  label: string;
  value: number;
  max: number;
  tint: string;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div
      style={{
        padding: "12px 14px",
        background: "var(--panel)",
        border: "1px solid var(--border)",
        borderRadius: 10,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span className="t-caption" style={{ fontSize: 10 }}>
          {label}
        </span>
        <span className="t-mono" style={{ fontSize: 11, color: tint }}>
          {value}/{max}
        </span>
      </div>
      <div
        style={{
          height: 6,
          marginTop: 8,
          borderRadius: 3,
          background: "var(--panel-2)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: tint,
            transition: "width .3s",
          }}
        />
      </div>
    </div>
  );
}

function AttrBar({ label, value }: { label: string; value: number }) {
  const tint =
    value >= 85
      ? "var(--emerald)"
      : value >= 75
        ? "var(--cyan)"
        : value >= 60
          ? "var(--accent)"
          : "var(--muted)";
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span className="t-caption" style={{ fontSize: 10 }}>
          {label}
        </span>
        <span className="t-mono" style={{ fontSize: 11, color: tint, fontWeight: 700 }}>
          {value}
        </span>
      </div>
      <div
        style={{
          height: 4,
          borderRadius: 2,
          background: "var(--panel-2)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: tint,
          }}
        />
      </div>
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
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
      <span className="t-mono" style={{ fontWeight: 600 }}>
        {value}
      </span>
    </div>
  );
}
