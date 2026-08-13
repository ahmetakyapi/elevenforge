/**
 * Transfer-offer inbox and outbox for the current club.
 */
import { and, desc, eq, inArray, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { clubs, players, transferOffers } from "@/lib/schema";
import type { LeagueContext } from "@/lib/session";

export type OfferView = {
  id: string;
  direction: "in" | "out";
  status: string;
  playerId: string;
  playerName: string;
  playerPos: string;
  playerOvr: number;
  playerValueEur: number;
  otherClubName: string;
  amountEur: number;
  counterEur: number | null;
  message: string | null;
  expiresAt: string;
};

export async function loadOffers(ctx: LeagueContext): Promise<OfferView[]> {
  const rows = await db
    .select()
    .from(transferOffers)
    .where(
      and(
        eq(transferOffers.leagueId, ctx.league.id),
        or(
          eq(transferOffers.fromClubId, ctx.club.id),
          eq(transferOffers.toClubId, ctx.club.id),
        ),
      ),
    )
    .orderBy(desc(transferOffers.createdAt))
    .limit(50);
  if (rows.length === 0) return [];

  // Two batched lookups rather than one query per offer.
  const playerIds = Array.from(new Set(rows.map((r) => r.playerId)));
  const clubIds = Array.from(
    new Set(rows.flatMap((r) => [r.fromClubId, r.toClubId])),
  );
  const [playerRows, clubRows] = await Promise.all([
    db.select().from(players).where(inArray(players.id, playerIds)),
    db
      .select({ id: clubs.id, name: clubs.name })
      .from(clubs)
      .where(inArray(clubs.id, clubIds)),
  ]);
  const playerById = new Map(playerRows.map((p) => [p.id, p]));
  const clubById = new Map(clubRows.map((c) => [c.id, c.name]));

  return rows.map((r) => {
    const p = playerById.get(r.playerId);
    const isIncoming = r.toClubId === ctx.club.id;
    return {
      id: r.id,
      direction: isIncoming ? ("in" as const) : ("out" as const),
      status: r.status,
      playerId: r.playerId,
      playerName: p?.name ?? "Bilinmeyen oyuncu",
      playerPos: p?.position ?? "MID",
      playerOvr: p?.overall ?? 0,
      playerValueEur: Math.round(Number(p?.marketValueCents ?? 0) / 100),
      otherClubName:
        clubById.get(isIncoming ? r.fromClubId : r.toClubId) ?? "Bilinmeyen kulüp",
      amountEur: Math.round(Number(r.amountCents) / 100),
      counterEur:
        r.counterCents === null ? null : Math.round(Number(r.counterCents) / 100),
      message: r.message,
      expiresAt: r.expiresAt.toISOString(),
    };
  });
}
