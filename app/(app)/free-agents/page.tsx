import { UserPlus } from "lucide-react";
import { requireLeagueContext } from "@/lib/session";
import { loadFreeAgents } from "@/lib/queries/free-agents";
import { FreeAgentsList } from "./free-agents-list";

export const dynamic = "force-dynamic";

export default async function FreeAgentsPage() {
  const ctx = await requireLeagueContext();
  const agents = await loadFreeAgents(ctx);
  const balanceEur = Math.round(Number(ctx.club.balanceCents) / 100);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 28px 60px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "color-mix(in oklab, var(--emerald) 22%, transparent)",
            color: "var(--emerald)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <UserPlus size={22} strokeWidth={1.6} />
        </div>
        <div>
          <span className="t-label" style={{ color: "var(--emerald)" }}>
            SERBEST OYUNCULAR
          </span>
          <div className="t-h1" style={{ marginTop: 4 }}>
            Bonservisle imzala
          </div>
          <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>
            Sözleşmesi biten oyuncular havuzda — transfer ücreti yok, sadece
            piyasa değerinin 1/5'i imzalama bonusu. Bütçen: €{(balanceEur / 1_000_000).toFixed(1)}M
          </div>
        </div>
      </div>

      {agents.length === 0 ? (
        <div
          style={{
            padding: 32,
            borderRadius: 12,
            background: "var(--panel)",
            border: "1px solid var(--border)",
            textAlign: "center",
            color: "var(--muted)",
          }}
        >
          Şu an serbest oyuncu yok. Sezon-sonu sözleşme bitişlerinden sonra
          burada havuz oluşur.
        </div>
      ) : (
        <FreeAgentsList agents={agents} />
      )}
    </div>
  );
}
