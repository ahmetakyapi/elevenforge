/**
 * How many friendlies a club has left today.
 *
 * The cap existed only as a refusal: you pressed the button, the server said
 * "24 saatlik limit doldu", and that was the first you heard of it. A limit
 * you can only discover by hitting it is a trap rather than a rule — you have
 * to be able to plan around it, which means seeing it before you spend.
 *
 * Counted in SQL over the rolling window rather than by loading the club's
 * entire friendly history, and it reads the same constant the action enforces
 * so the two can never disagree about what the cap is.
 */
import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { friendlies } from "@/lib/schema";
import { FRIENDLY_DAILY_CAP } from "@/lib/progression";

export type FriendlyAllowance = {
  used: number;
  cap: number;
  remaining: number;
  /** When the oldest one in the window falls out, ms since epoch. Null if none. */
  resetsAtMs: number | null;
};

export async function loadFriendlyAllowance(
  clubId: string,
): Promise<FriendlyAllowance> {
  const dayAgo = new Date(Date.now() - 24 * 3600 * 1000);
  const rows = await db
    .select({ playedAt: friendlies.playedAt })
    .from(friendlies)
    .where(and(eq(friendlies.clubId, clubId), gte(friendlies.playedAt, dayAgo)))
    .orderBy(sql`${friendlies.playedAt} asc`);
  const used = rows.length;
  return {
    used,
    cap: FRIENDLY_DAILY_CAP,
    remaining: Math.max(0, FRIENDLY_DAILY_CAP - used),
    resetsAtMs:
      used >= FRIENDLY_DAILY_CAP && rows[0]
        ? new Date(rows[0].playedAt).getTime() + 24 * 3600 * 1000
        : null,
  };
}
