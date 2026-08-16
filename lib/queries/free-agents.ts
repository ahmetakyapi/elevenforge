import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { players, transferListings } from "@/lib/schema";
import type { LeagueContext } from "@/lib/session";
import { FREE_AGENT_FEE_RATE } from "@/lib/economy";

export type FreeAgentView = {
  id: string;
  name: string;
  position: "GK" | "DEF" | "MID" | "FWD";
  role: string;
  age: number;
  nationality: string;
  overall: number;
  potential: number;
  marketValueEur: number;
  signingFeeEur: number;
};

// The rate lives in lib/economy.ts. A local divisor here said 1/5 while
// app/(app)/free-agents/actions.ts charged FREE_AGENT_FEE_RATE (0.4), so the
// list quoted every free agent at HALF his real price and the signing failed
// or emptied the club by twice what the screen promised.

export async function loadFreeAgents(
  ctx: LeagueContext,
): Promise<FreeAgentView[]> {
  const rows = await db
    .select()
    .from(players)
    .where(
      and(eq(players.leagueId, ctx.league.id), isNull(players.clubId)),
    );

  /*
    A player who is ON THE MARKET is not a free agent.

    Both screens read "unowned", but they charge completely different prices:
    the market asks 95-130% of market value, this screen asks
    FREE_AGENT_FEE_RATE — 40%. So every listing created from the unowned pool
    was simultaneously purchasable here at well under half the asking price,
    and could be relisted immediately at up to 180%. That is a money printer,
    and it got far more valuable when the market started stocking genuinely
    good players rather than only leftovers.

    Filtering here keeps the screen honest; the refusal that actually matters
    is in signFreeAgent, because a stale page can still submit.
  */
  const listed = new Set(
    (
      await db
        .select({ playerId: transferListings.playerId })
        .from(transferListings)
        .where(
          and(
            eq(transferListings.leagueId, ctx.league.id),
            eq(transferListings.status, "active"),
          ),
        )
    ).map((r) => r.playerId),
  );

  return rows
    .filter((p) => !listed.has(p.id))
    .map((p) => {
      const valEur = Math.round(Number(p.marketValueCents) / 100);
      return {
        id: p.id,
        name: p.name,
        position: p.position,
        role: p.role,
        age: p.age,
        nationality: p.nationality,
        overall: p.overall,
        potential: p.potential,
        marketValueEur: valEur,
        signingFeeEur: Math.round(valEur * FREE_AGENT_FEE_RATE),
      };
    })
    .sort((a, b) => b.overall - a.overall);
}
