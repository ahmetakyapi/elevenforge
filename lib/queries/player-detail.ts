import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  clubs,
  players,
  transferHistory,
} from "@/lib/schema";
import type { LeagueContext } from "@/lib/session";

export type PlayerDetail = {
  id: string;
  name: string;
  position: "GK" | "DEF" | "MID" | "FWD";
  role: string;
  secondaryRoles: string[];
  jerseyNumber: number | null;
  age: number;
  nationality: string;
  overall: number;
  potential: number;
  pace: number;
  shooting: number;
  passing: number;
  defending: number;
  physical: number;
  goalkeeping: number;
  fitness: number;
  morale: number;
  status: string;
  contractYears: number;
  marketValueEur: number;
  wageEur: number;
  goalsSeason: number;
  assistsSeason: number;
  yellowCardsSeason: number;
  redCardsSeason: number;
  recentForm: number[];
  clubId: string | null;
  clubName: string | null;
  clubColor: string | null;
  history: Array<{
    fromClubName: string | null;
    toClubName: string;
    priceEur: number;
    completedAtMs: number;
  }>;
};

export async function loadPlayerDetail(
  ctx: LeagueContext,
  playerId: string,
): Promise<PlayerDetail | null> {
  const [p] = await db
    .select()
    .from(players)
    .where(and(eq(players.id, playerId), eq(players.leagueId, ctx.league.id)))
    .limit(1);
  if (!p) return null;

  const [club] = p.clubId
    ? await db.select().from(clubs).where(eq(clubs.id, p.clubId)).limit(1)
    : [null as null];

  const transferRows = await db
    .select()
    .from(transferHistory)
    .where(eq(transferHistory.playerId, playerId))
    .orderBy(desc(transferHistory.completedAt))
    .limit(10);
  const fromIds = Array.from(
    new Set(transferRows.map((t) => t.fromClubId).filter((x): x is string => !!x)),
  );
  const toIds = transferRows.map((t) => t.toClubId);
  const allClubIds = Array.from(new Set([...fromIds, ...toIds]));
  const clubRows = allClubIds.length
    ? await Promise.all(
        allClubIds.map((id) =>
          db.select({ id: clubs.id, name: clubs.name }).from(clubs).where(eq(clubs.id, id)).limit(1),
        ),
      )
    : [];
  const clubNameMap = new Map<string, string>();
  for (const r of clubRows.flat()) clubNameMap.set(r.id, r.name);

  let recentForm: number[] = [];
  try {
    const parsed = JSON.parse(p.lastRatings);
    if (Array.isArray(parsed)) recentForm = parsed.slice(-5);
  } catch {}
  let secondaryRoles: string[] = [];
  try {
    const parsed = JSON.parse(p.secondaryRoles);
    if (Array.isArray(parsed)) secondaryRoles = parsed;
  } catch {}

  return {
    id: p.id,
    name: p.name,
    position: p.position,
    role: p.role,
    secondaryRoles,
    jerseyNumber: p.jerseyNumber,
    age: p.age,
    nationality: p.nationality,
    overall: p.overall,
    potential: p.potential,
    pace: p.pace,
    shooting: p.shooting,
    passing: p.passing,
    defending: p.defending,
    physical: p.physical,
    goalkeeping: p.goalkeeping,
    fitness: p.fitness,
    morale: p.morale,
    status: p.status,
    contractYears: p.contractYears,
    marketValueEur: Math.round(Number(p.marketValueCents) / 100),
    wageEur: Math.round(Number(p.wageCents) / 100),
    goalsSeason: p.goalsSeason,
    assistsSeason: p.assistsSeason,
    yellowCardsSeason: p.yellowCardsSeason,
    redCardsSeason: p.redCardsSeason,
    recentForm,
    clubId: club?.id ?? null,
    clubName: club?.name ?? null,
    clubColor: club?.color ?? null,
    history: transferRows.map((t) => ({
      fromClubName: t.fromClubId ? clubNameMap.get(t.fromClubId) ?? null : null,
      toClubName: clubNameMap.get(t.toClubId) ?? "?",
      priceEur: Math.round(Number(t.priceCents) / 100),
      completedAtMs: new Date(t.completedAt).getTime(),
    })),
  };
}
