import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { players } from "@/lib/schema";
import type { LeagueContext } from "@/lib/session";

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

const SIGNING_FEE_DIVISOR = 5; // signing-on bonus = 1/5 of market value

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
        signingFeeEur: Math.round(valEur / SIGNING_FEE_DIVISOR),
      };
    })
    .sort((a, b) => b.overall - a.overall);
}
