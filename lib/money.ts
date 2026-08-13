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
import { clubs } from "@/lib/schema";

/**
 * Minimal structural type satisfied by both `db` and a drizzle transaction
 * handle, so callers can opt into running inside a transaction.
 */
export type Executor = Pick<typeof db, "update">;

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
): Promise<boolean> {
  const amt = normalizeAmount(amountCents);
  if (amt === 0) return true;
  const rows = await exec
    .update(clubs)
    .set({ balanceCents: sql`${clubs.balanceCents} - ${amt}` })
    .where(and(eq(clubs.id, clubId), gte(clubs.balanceCents, amt)))
    .returning();
  return rows.length > 0;
}

/** Pay a club. Always succeeds; credits never need an affordability guard. */
export async function creditClub(
  clubId: string,
  amountCents: number,
  exec: Executor = db,
): Promise<void> {
  const amt = normalizeAmount(amountCents);
  if (amt === 0) return;
  await exec
    .update(clubs)
    .set({ balanceCents: sql`${clubs.balanceCents} + ${amt}` })
    .where(eq(clubs.id, clubId));
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
  return rows.length > 0;
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
): Promise<void> {
  if (!Number.isFinite(deltaCents)) throw new Error("Geçersiz tutar.");
  const delta = Math.round(deltaCents);
  if (delta === 0) return;
  await exec
    .update(clubs)
    .set({ balanceCents: sql`${clubs.balanceCents} + ${delta}` })
    .where(eq(clubs.id, clubId));
}
