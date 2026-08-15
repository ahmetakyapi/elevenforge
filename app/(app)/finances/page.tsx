import { ArrowDownRight, ArrowUpRight, Wallet } from "lucide-react";
import { LiveRefresh } from "@/components/dashboard-auto-refresh";
import { requireLeagueContext } from "@/lib/session";
import { loadFinances, type FinanceLine } from "@/lib/queries/finances";
import { fmtEUR } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** Colour per ledger kind, so a line is recognisable before it is read. */
const KIND_TINT: Record<string, string> = {
  match_income: "var(--emerald)",
  sponsor: "var(--cyan, #22d3ee)",
  prize: "var(--gold)",
  interest: "var(--muted)",
  wages: "var(--danger)",
  staff: "var(--warn, #f59e0b)",
  facility: "var(--indigo)",
  scout: "var(--accent)",
  transfer_in: "var(--danger)",
  transfer_out: "var(--emerald)",
  transfer_refund: "var(--muted)",
  free_agent_fee: "var(--warn, #f59e0b)",
  contract_renewal: "var(--warn, #f59e0b)",
  other: "var(--muted)",
};

export default async function FinancesPage() {
  const ctx = await requireLeagueContext();
  const d = await loadFinances(ctx, 30);

  // Bars are drawn against the larger side, so income and expense share one
  // scale and can be compared by eye rather than by reading both numbers.
  const scale = Math.max(d.incomeEur, Math.abs(d.expenseEur), 1);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 28px 60px" }}>
      <LiveRefresh intervalMs={60_000} />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 22,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "color-mix(in oklab, var(--emerald) 20%, transparent)",
            color: "var(--emerald)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Wallet size={22} strokeWidth={1.6} />
        </div>
        <div>
          <span className="t-label" style={{ color: "var(--emerald)" }}>
            FİNANS · SON 30 GÜN
          </span>
          <div className="t-h1" style={{ marginTop: 4 }}>
            {ctx.club.name}
          </div>
        </div>
      </div>

      {/* Headline: balance, and what the last 30 days did to it. */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          gap: 12,
          marginBottom: 22,
        }}
      >
        {(
          [
            ["KASA", fmtEUR(d.balanceEur), "var(--text)", "Güncel bakiye"],
            ["GELİR", fmtEUR(d.incomeEur), "var(--emerald)", "Son 30 gün"],
            [
              "GİDER",
              fmtEUR(Math.abs(d.expenseEur)),
              "var(--danger)",
              "Son 30 gün",
            ],
            [
              "NET",
              `${d.netEur >= 0 ? "+" : "−"}${fmtEUR(Math.abs(d.netEur))}`,
              d.netEur >= 0 ? "var(--emerald)" : "var(--danger)",
              d.netEur >= 0 ? "Kâr ediyorsun" : "Zarar ediyorsun",
            ],
          ] as Array<[string, string, string, string]>
        ).map(([label, value, tint, hint]) => (
          <div
            key={label}
            style={{
              borderRadius: 16,
              border: "1px solid var(--border)",
              background: "var(--panel)",
              padding: "16px 18px",
            }}
          >
            <span className="t-label" style={{ fontSize: 10 }}>
              {label}
            </span>
            <div
              className="t-mono"
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: tint,
                marginTop: 6,
                letterSpacing: "-0.03em",
              }}
            >
              {value}
            </div>
            <span className="t-caption" style={{ fontSize: 11 }}>
              {hint}
            </span>
          </div>
        ))}
      </section>

      {d.empty ? (
        <div
          style={{
            borderRadius: 16,
            border: "1px solid var(--border)",
            background: "var(--panel)",
            padding: 32,
            textAlign: "center",
            color: "var(--muted)",
          }}
        >
          Henüz para hareketi yok. İlk maçından sonra gişe hasılatı, maaşlar ve
          sponsor ödemeleri burada görünecek.
        </div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginBottom: 22,
            }}
            data-finance-cols
          >
            <Column
              title="GELİR KALEMLERİ"
              icon={<ArrowUpRight size={14} strokeWidth={2} />}
              tint="var(--emerald)"
              lines={d.income}
              scale={scale}
            />
            <Column
              title="GİDER KALEMLERİ"
              icon={<ArrowDownRight size={14} strokeWidth={2} />}
              tint="var(--danger)"
              lines={d.expense}
              scale={scale}
            />
          </div>

          <section
            style={{
              borderRadius: 16,
              border: "1px solid var(--border)",
              background: "var(--panel)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "14px 18px",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <span className="t-label" style={{ fontSize: 11 }}>
                SON HAREKETLER
              </span>
            </div>
            {d.recent.map((e, i) => (
              <div
                key={e.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "8px minmax(0, 1fr) 110px 110px",
                  gap: 12,
                  alignItems: "center",
                  padding: "10px 18px",
                  borderBottom:
                    i === d.recent.length - 1
                      ? "none"
                      : "1px solid var(--border)",
                  background:
                    i % 2 === 0
                      ? "color-mix(in oklab, var(--panel-2) 40%, transparent)"
                      : "transparent",
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    background: KIND_TINT[e.kind] ?? "var(--muted)",
                  }}
                />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>
                    {e.label}
                  </div>
                  {e.note && (
                    <span
                      className="t-caption"
                      style={{
                        fontSize: 11,
                        display: "block",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {e.note}
                    </span>
                  )}
                </div>
                <span
                  className="t-mono"
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    textAlign: "right",
                    color:
                      e.amountEur >= 0 ? "var(--emerald)" : "var(--danger)",
                  }}
                >
                  {e.amountEur >= 0 ? "+" : "−"}
                  {fmtEUR(Math.abs(e.amountEur))}
                </span>
                <span
                  className="t-mono"
                  style={{
                    fontSize: 12,
                    textAlign: "right",
                    color: "var(--muted)",
                  }}
                  title="Bu hareketten sonraki kasa"
                >
                  {fmtEUR(e.balanceAfterEur)}
                </span>
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
}

/**
 * One side of the breakdown.
 *
 * Bars are drawn against the LARGER of income and expense so the two columns
 * share a scale — otherwise each column normalises to its own maximum and a
 * €2M expense looks the same size as €40M of income, which is precisely the
 * comparison the page exists to make.
 */
function Column({
  title,
  icon,
  tint,
  lines,
  scale,
}: {
  title: string;
  icon: React.ReactNode;
  tint: string;
  lines: FinanceLine[];
  scale: number;
}) {
  return (
    <section
      style={{
        borderRadius: 16,
        border: "1px solid var(--border)",
        background: "var(--panel)",
        padding: 18,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 14,
          color: tint,
        }}
      >
        {icon}
        <span className="t-label" style={{ fontSize: 10.5, color: tint }}>
          {title}
        </span>
      </div>
      {lines.length === 0 ? (
        <p className="t-caption" style={{ fontSize: 12 }}>
          Bu dönemde kalem yok.
        </p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {lines.map((l) => {
            const pct = Math.min(
              100,
              Math.max(2, (Math.abs(l.amountEur) / scale) * 100),
            );
            return (
              <div key={l.kind}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginBottom: 5,
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 13, minWidth: 0 }}>
                    {l.label}
                    <span
                      className="t-mono"
                      style={{
                        fontSize: 10,
                        color: "var(--muted)",
                        marginLeft: 6,
                      }}
                    >
                      ×{l.count}
                    </span>
                  </span>
                  <span
                    className="t-mono"
                    style={{ fontSize: 13, fontWeight: 700, color: tint }}
                  >
                    {fmtEUR(Math.abs(l.amountEur))}
                  </span>
                </div>
                <div
                  style={{
                    height: 5,
                    borderRadius: 999,
                    background: "var(--panel-2)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      height: "100%",
                      borderRadius: 999,
                      background: KIND_TINT[l.kind] ?? tint,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
