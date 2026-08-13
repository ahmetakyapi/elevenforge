/**
 * Sponsor match income.
 *
 * This deliberately does NOT live in a "use server" file. Every exported
 * async function in such a file is compiled into a callable server action
 * with a public action id, so a money-crediting helper that takes a raw
 * clubId would be an unauthenticated "give club X money" endpoint. It is
 * only ever called from the match engine, which already knows the fixture is
 * legitimate.
 */
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { creditClub, type Executor } from "@/lib/money";
import { clubs } from "@/lib/schema";

/**
 * `exec` lets the match engine pass its transaction handle. Writing through
 * the global `db` while an outer transaction holds locks on the same club row
 * would deadlock — on pglite, which has a single connection, permanently.
 */
export async function creditSponsorForMatch(
  clubId: string,
  isWin: boolean,
  exec: Executor & Pick<typeof db, "select"> = db,
): Promise<void> {
  const [c] = await exec.select().from(clubs).where(eq(clubs.id, clubId));
  if (!c?.activeSponsorJson) return;
  let sponsor: {
    payPerMatchCents?: number;
    bonusPerWinCents?: number;
  };
  try {
    sponsor = JSON.parse(c.activeSponsorJson);
  } catch {
    return;
  }
  const perMatch = Number(sponsor.payPerMatchCents);
  const perWin = Number(sponsor.bonusPerWinCents);
  const credit =
    (Number.isFinite(perMatch) ? perMatch : 0) +
    (isWin && Number.isFinite(perWin) ? perWin : 0);
  if (credit <= 0) return;
  await creditClub(clubId, credit, exec);
}
