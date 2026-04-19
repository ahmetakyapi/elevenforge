import { Settings, ShieldAlert } from "lucide-react";
import { requireLeagueContext } from "@/lib/session";
import { LeagueSettingsForm } from "./form";

export const dynamic = "force-dynamic";

export default async function LeagueSettingsPage() {
  const ctx = await requireLeagueContext();
  const isCommissioner = ctx.league.createdByUserId === ctx.user.id;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "20px 28px 60px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "color-mix(in oklab, var(--indigo) 22%, transparent)",
            color: "var(--indigo)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Settings size={22} strokeWidth={1.6} />
        </div>
        <div>
          <span className="t-label" style={{ color: "var(--indigo)" }}>
            LİG AYARLARI
          </span>
          <div className="t-h1" style={{ marginTop: 4 }}>
            {ctx.league.name}
          </div>
          <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>
            Davet kodu <span className="t-mono">{ctx.league.inviteCode}</span> ·{" "}
            Sezon {ctx.league.seasonNumber} · Hafta {ctx.league.weekNumber}
          </div>
        </div>
      </div>

      {!isCommissioner ? (
        <div
          style={{
            padding: 20,
            borderRadius: 12,
            background: "color-mix(in oklab, var(--danger) 8%, var(--panel))",
            border: "1px solid color-mix(in oklab, var(--danger) 24%, var(--border))",
            display: "flex",
            gap: 12,
            alignItems: "center",
          }}
        >
          <ShieldAlert size={20} strokeWidth={1.6} style={{ color: "var(--danger)" }} />
          <div>
            <div style={{ fontWeight: 600 }}>Yetkin yok</div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
              Lig ayarlarını sadece kurucusu değiştirebilir.
            </div>
          </div>
        </div>
      ) : (
        <LeagueSettingsForm
          initial={{
            matchTime: ctx.league.matchTime,
            visibility: ctx.league.visibility,
            commissionerOnlyAdvance: ctx.league.commissionerOnlyAdvance,
          }}
        />
      )}
    </div>
  );
}
