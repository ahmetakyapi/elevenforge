import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { players } from "@/lib/schema";
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
  return rows
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
