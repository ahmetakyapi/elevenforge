/**
 * Atomic club money operations.
 *
 * Every balance change in the game must go through here. The rule that makes
 * this safe under 10-12 concurrent managers is that the guard and the write
 * live in the *same* statement:
 *
 *     UPDATE clubs SET balance_cents = balance_cents - $amt
 *      WHERE id = $club AND balance_cents >= $amt
 *
 * A read-then-write (`balanceCents: club.balanceCents - cost`) is never
 * acceptable: two actions that both read €10M and both write €10M-€8M leave
 * the club at €2M having spent €16M, and any credit landing between the read
 * and the write is erased entirely (lost update).
 */
import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { clubLedger, clubs, type LedgerKind } from "@/lib/schema";

/**
 * Minimal structural type satisfied by both `db` and a drizzle transaction
 * handle, so callers can opt into running inside a transaction. `insert` is
 * part of it because the ledger row must land in the SAME transaction as the
 * balance change it describes — a ledger that can be committed without its
 * money move, or vice versa, is worse than no ledger.
 */
export type Executor = Pick<typeof db, "update" | "insert">;

/**
 * What a money move was for.
 *
 * Every balance change already flows through this file, so this is the one
 * place that can answer "where did the money go" without instrumenting a
 * dozen call sites and hoping none is ever forgotten. The kind is required,
 * not optional: an unlabelled entry would show up on the Finans page as an
 * unexplained number, which is exactly the state the page exists to fix.
 *
 * THE ENTRY IS WRITTEN ONLY WHEN THE MONEY ACTUALLY MOVED. A refused debit
 * (insufficient funds) returns false and writes nothing — a ledger row for a
 * transaction that never happened would break the invariant the page and the
 * tests both rest on: for any club, the sum of its ledger equals the change in
 * its balance.
 */
export type MoneyReason = {
  kind: LedgerKind;
  /** Short Turkish description shown on the Finans page, e.g. a player name. */
  note?: string;
  /**
   * Optional breakdown for a single balance statement that represents several
   * distinct things at once — the weekly economy moves one net delta made of
   * wages, staff salaries, interest and a sponsor payment. Writing four
   * separate UPDATEs instead would be four round trips per club, and the
   * header of lib/jobs/training.ts exists precisely because per-row writes
   * timed out against Neon.
   *
   * MUST sum to the amount actually moved, or the reconciliation invariant
   * (SUM(ledger) == change in balance) silently breaks. Enforced below.
   */
  split?: Array<{ kind: LedgerKind; amountCents: number; note?: string }>;
};

/**
 * Record a completed money move.
 *
 * `row` is the club as it exists AFTER the write, straight from the same
 * statement's RETURNING clause — so the resulting balance is exact and costs
 * no extra query, and `leagueId` comes along for free rather than being
 * threaded through every caller.
 */
async function writeLedger(
  exec: Executor,
  row: { id: string; leagueId: string; balanceCents: number },
  amountCents: number,
  reason: MoneyReason | undefined,
): Promise<void> {
  if (!reason) return;
  const balanceAfterCents = Number(row.balanceCents);

  if (reason.split && reason.split.length > 0) {
    const total = reason.split.reduce((sum, part) => sum + part.amountCents, 0);
    if (Math.round(total) !== Math.round(amountCents)) {
      throw new Error(
        `Defter dökümü tutmuyor: ${total} != ${amountCents} (${reason.kind}).`,
      );
    }
    const rows = reason.split
      .filter((part) => Math.round(part.amountCents) !== 0)
      .map((part) => ({
        leagueId: row.leagueId,
        clubId: row.id,
        kind: part.kind,
        amountCents: Math.round(part.amountCents),
        balanceAfterCents,
        note: part.note ?? null,
      }));
    if (rows.length > 0) await exec.insert(clubLedger).values(rows);
    return;
  }

  await exec.insert(clubLedger).values({
    leagueId: row.leagueId,
    clubId: row.id,
    kind: reason.kind,
    amountCents,
    balanceAfterCents,
    note: reason.note ?? null,
  });
}

/** Reject NaN/Infinity/negative/fractional money before it reaches bigint. */
export function normalizeAmount(amountCents: number): number {
  if (typeof amountCents !== "number" || !Number.isFinite(amountCents)) {
    throw new Error("Geçersiz tutar.");
  }
  const rounded = Math.round(amountCents);
  if (rounded < 0) throw new Error("Tutar negatif olamaz.");
  if (rounded > Number.MAX_SAFE_INTEGER) throw new Error("Tutar çok büyük.");
  return rounded;
}

/**
 * Charge a club. Returns false (without touching the balance) when the club
 * cannot afford it — callers must treat false as "transaction refused" and
 * abort whatever they were about to hand over.
 */
export async function debitClub(
  clubId: string,
  amountCents: number,
  exec: Executor = db,
  reason?: MoneyReason,
): Promise<boolean> {
  const amt = normalizeAmount(amountCents);
  if (amt === 0) return true;
  const rows = await exec
    .update(clubs)
    .set({ balanceCents: sql`${clubs.balanceCents} - ${amt}` })
    .where(and(eq(clubs.id, clubId), gte(clubs.balanceCents, amt)))
    .returning();
  if (rows.length === 0) return false; // refused: no money moved, no entry
  await writeLedger(exec, rows[0], -amt, reason);
  return true;
}

/** Pay a club. Always succeeds; credits never need an affordability guard. */
export async function creditClub(
  clubId: string,
  amountCents: number,
  exec: Executor = db,
  reason?: MoneyReason,
): Promise<void> {
  const amt = normalizeAmount(amountCents);
  if (amt === 0) return;
  const rows = await exec
    .update(clubs)
    .set({ balanceCents: sql`${clubs.balanceCents} + ${amt}` })
    .where(eq(clubs.id, clubId))
    .returning();
  if (rows.length === 0) return; // club vanished mid-flight
  await writeLedger(exec, rows[0], amt, reason);
}

/**
 * Buy one level of a facility: charge and increment in a single statement.
 *
 * The level guard is what makes it safe against a double submit — the second
 * request no longer matches `level = expected` and so buys nothing — and the
 * balance guard does the same for affordability. Both must be in the SAME
 * statement as the write, which is why this cannot go through debitClub.
 *
 * Shared by the human upgrade action and the AI manager so there is one
 * implementation rather than two subtly different ones.
 */
export async function purchaseFacilityLevel(
  clubId: string,
  facility: "stadiumLevel" | "trainingLevel",
  currentLevel: number,
  costCents: number,
  exec: Executor = db,
  reason?: MoneyReason,
): Promise<boolean> {
  const cost = normalizeAmount(costCents);
  const column =
    facility === "stadiumLevel" ? clubs.stadiumLevel : clubs.trainingLevel;
  const rows = await exec
    .update(clubs)
    .set({
      [facility]: currentLevel + 1,
      balanceCents: sql`${clubs.balanceCents} - ${cost}`,
    })
    .where(
      and(
        eq(clubs.id, clubId),
        eq(column, currentLevel),
        gte(clubs.balanceCents, cost),
      ),
    )
    .returning();
  if (rows.length === 0) return false;
  await writeLedger(exec, rows[0], -cost, reason);
  return true;
}

/**
 * Apply a signed delta that is allowed to push the balance negative — used by
 * the weekly economy, where wages must still be charged to a club that cannot
 * pay them (going into the red is a game state, not an error).
 */
export async function adjustClubBalance(
  clubId: string,
  deltaCents: number,
  exec: Executor = db,
  reason?: MoneyReason,
): Promise<void> {
  if (!Number.isFinite(deltaCents)) throw new Error("Geçersiz tutar.");
  const delta = Math.round(deltaCents);
  if (delta === 0) return;
  const rows = await exec
    .update(clubs)
    .set({ balanceCents: sql`${clubs.balanceCents} + ${delta}` })
    .where(eq(clubs.id, clubId))
    .returning();
  if (rows.length === 0) return;
  await writeLedger(exec, rows[0], delta, reason);
}
