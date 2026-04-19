import Link from "next/link";
import { eq } from "drizzle-orm";
import { AlertTriangle } from "lucide-react";
import { db } from "@/lib/db";
import { players } from "@/lib/schema";

/**
 * Server component — flags squad players whose contract is on the last
 * year. Two seasons of inaction → released as free agent (season-roll).
 * Hidden when no warnings exist so the dashboard stays uncluttered.
 */
export async function ExpiringContractsCard({ clubId }: { clubId: string }) {
  const squad = await db
    .select({
      id: players.id,
      name: players.name,
      role: players.role,
      contractYears: players.contractYears,
    })
    .from(players)
    .where(eq(players.clubId, clubId));
  const expiring = squad.filter((s) => s.contractYears <= 1);
  if (expiring.length === 0) return null;

  return (
    <div
      style={{
        padding: "12px 16px",
        borderRadius: 12,
        background: "color-mix(in oklab, var(--warn) 12%, var(--panel))",
        border: "1px solid color-mix(in oklab, var(--warn) 30%, var(--border))",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <AlertTriangle size={16} strokeWidth={1.6} style={{ color: "var(--warn)" }} />
        <span className="t-label" style={{ color: "var(--warn)" }}>
          SÖZLEŞMESİ BİTEN OYUNCULAR
        </span>
        <span
          className="t-mono"
          style={{
            fontSize: 11,
            color: "var(--muted)",
            marginLeft: "auto",
          }}
        >
          {expiring.length} oyuncu
        </span>
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          marginTop: 8,
        }}
      >
        {expiring.slice(0, 8).map((p) => (
          <Link
            key={p.id}
            href={`/player/${p.id}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              borderRadius: 999,
              background: "color-mix(in oklab, var(--panel-2) 60%, transparent)",
              border: "1px solid var(--border)",
              fontSize: 12,
              textDecoration: "none",
              color: "var(--text)",
            }}
          >
            <span
              className="t-mono"
              style={{ fontSize: 9, color: "var(--muted)" }}
            >
              {p.role}
            </span>
            <span style={{ fontWeight: 600 }}>{p.name}</span>
            <span
              style={{
                fontSize: 10,
                color: p.contractYears === 0 ? "var(--danger)" : "var(--warn)",
              }}
            >
              {p.contractYears === 0 ? "0 yıl" : `${p.contractYears} yıl`}
            </span>
          </Link>
        ))}
        {expiring.length > 8 && (
          <span style={{ fontSize: 11, color: "var(--muted)", alignSelf: "center" }}>
            +{expiring.length - 8} daha
          </span>
        )}
      </div>
      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>
        Sözleşmesi 1 yıla düşen oyuncular sezon sonunda serbest kalır. Squad
        sayfasından <strong>Sözleşme +2y</strong> ile uzat.
      </div>
    </div>
  );
}
