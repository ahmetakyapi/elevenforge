/**
 * Where the club's money came from and went.
 *
 * The economy carries real decisions — match income scales with prestige, the
 * wage bill is charged every match day, interest is capped so hoarding cannot
 * out-earn running a team — and none of it was visible anywhere. The club had
 * a balance and no account of how it reached it, so a manager sliding towards
 * the overdraft floor had no way to see which line was doing it.
 *
 * Everything here reads `club_ledger`, which lib/money.ts writes on every
 * balance change. Nothing is recomputed or estimated: if a figure appears on
 * this page, it is a row that moved money.
 */
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { clubLedger, type LedgerKind } from "@/lib/schema";
import type { LeagueContext } from "@/lib/session";

export type FinanceLine = {
  kind: LedgerKind;
  label: string;
  amountEur: number;
  count: number;
};

export type FinanceEntry = {
  id: string;
  kind: LedgerKind;
  label: string;
  note: string | null;
  amountEur: number;
  balanceAfterEur: number;
  at: string;
};

export type FinancesData = {
  balanceEur: number;
  incomeEur: number;
  expenseEur: number;
  netEur: number;
  income: FinanceLine[];
  expense: FinanceLine[];
  recent: FinanceEntry[];
  /** True when the club has never recorded a money move (a brand-new league). */
  empty: boolean;
};

/** Turkish labels, in one place so the summary and the feed agree. */
export const KIND_LABEL: Record<LedgerKind, string> = {
  match_income: "Maç Hasılatı",
  sponsor: "Sponsor",
  prize: "Ödül",
  interest: "Banka Faizi",
  wages: "Oyuncu Maaşları",
  staff: "Teknik Ekip",
  facility: "Tesis Yatırımı",
  scout: "Kaşif",
  transfer_in: "Transfer Gideri",
  transfer_out: "Transfer Geliri",
  transfer_refund: "Transfer İadesi",
  free_agent_fee: "Serbest Oyuncu",
  contract_renewal: "Sözleşme Yenileme",
  other: "Diğer",
};

/** How many entries the activity feed shows. */
const RECENT_LIMIT = 40;

export async function loadFinances(
  ctx: LeagueContext,
  /** Only count moves from the last N days; null means the whole history. */
  windowDays: number | null = 30,
): Promise<FinancesData> {
  const since =
    windowDays === null
      ? null
      : new Date(Date.now() - windowDays * 24 * 3600 * 1000);

  const scope = since
    ? and(eq(clubLedger.clubId, ctx.club.id), gte(clubLedger.createdAt, since))
    : eq(clubLedger.clubId, ctx.club.id);

  // Grouped in SQL rather than in JS: a club that has played several seasons
  // accumulates thousands of rows and there is no reason to ship them all just
  // to add them up.
  const grouped = await db
    .select({
      kind: clubLedger.kind,
      total: sql<string>`sum(${clubLedger.amountCents})`,
      count: sql<number>`count(*)::int`,
    })
    .from(clubLedger)
    .where(scope)
    .groupBy(clubLedger.kind);

  const income: FinanceLine[] = [];
  const expense: FinanceLine[] = [];
  for (const g of grouped) {
    const amountEur = Math.round(Number(g.total) / 100);
    const line: FinanceLine = {
      kind: g.kind,
      label: KIND_LABEL[g.kind] ?? g.kind,
      amountEur,
      count: g.count,
    };
    // Split on the sign of the total, not on the kind. A kind can legitimately
    // fall either way — `transfer_refund` is money coming back, and a club that
    // sold more than it bought shows `transfer_in` as a net positive.
    if (amountEur >= 0) income.push(line);
    else expense.push(line);
  }
  income.sort((a, b) => b.amountEur - a.amountEur);
  expense.sort((a, b) => a.amountEur - b.amountEur);

  const incomeEur = income.reduce((s, l) => s + l.amountEur, 0);
  const expenseEur = expense.reduce((s, l) => s + l.amountEur, 0);

  const rows = await db
    .select()
    .from(clubLedger)
    .where(scope)
    .orderBy(desc(clubLedger.createdAt))
    .limit(RECENT_LIMIT);

  const recent: FinanceEntry[] = rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    label: KIND_LABEL[r.kind] ?? r.kind,
    note: r.note,
    amountEur: Math.round(Number(r.amountCents) / 100),
    balanceAfterEur: Math.round(Number(r.balanceAfterCents) / 100),
    at: r.createdAt.toISOString(),
  }));

  return {
    balanceEur: Math.round(Number(ctx.club.balanceCents) / 100),
    incomeEur,
    expenseEur,
    netEur: incomeEur + expenseEur,
    income,
    expense,
    recent,
    empty: grouped.length === 0,
  };
}
