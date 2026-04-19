/**
 * Every 6 hours, price of each active listing drops by 8%,
 * bounded at 20% of original. Below floor → status=expired.
 */
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { transferListings } from "@/lib/schema";

export async function runPriceDecay(opts: { leagueId?: string } = {}) {
  const listings = await db
    .select()
    .from(transferListings)
    .where(
      opts.leagueId
        ? and(
            eq(transferListings.leagueId, opts.leagueId),
            eq(transferListings.status, "active"),
          )
        : eq(transferListings.status, "active"),
    );

  let decayed = 0;
  let expired = 0;
  const now = new Date();

  for (const l of listings) {
    const floor = Math.round(l.originalPriceCents * 0.2);
    const nextPrice = Math.round(l.priceCents * 0.92);
    if (nextPrice <= floor) {
      await db
        .update(transferListings)
        .set({ status: "expired" })
        .where(eq(transferListings.id, l.id));
      expired++;
    } else {
      await db
        .update(transferListings)
        .set({ priceCents: nextPrice, lastDecayAt: now })
        .where(eq(transferListings.id, l.id));
      decayed++;
    }
  }

  return { decayed, expired };
}
