import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { clubs, leagues } from "@/lib/schema";
import { getSessionUserId } from "@/lib/session";
import { LobbyClient, type LobbyLeagueRow } from "./lobby-client";

export const dynamic = "force-dynamic";

export default async function LobbyPage() {
  const userId = await getSessionUserId();
  let rows: LobbyLeagueRow[] = [];
  if (userId) {
    const owned = await db
      .select({
        clubId: clubs.id,
        clubName: clubs.name,
        clubShort: clubs.shortName,
        clubColor: clubs.color,
        clubColor2: clubs.color2,
        leagueId: leagues.id,
        leagueName: leagues.name,
        seasonNumber: leagues.seasonNumber,
        weekNumber: leagues.weekNumber,
        seasonLength: leagues.seasonLength,
        matchTime: leagues.matchTime,
        inviteCode: leagues.inviteCode,
      })
      .from(clubs)
      .innerJoin(leagues, eq(leagues.id, clubs.leagueId))
      .where(eq(clubs.ownerUserId, userId))
      .orderBy(desc(clubs.createdAt));

    rows = await Promise.all(
      owned.map(async (o) => {
        const members = await db
          .select({ id: clubs.id, isBot: clubs.isBot })
          .from(clubs)
          .where(eq(clubs.leagueId, o.leagueId));
        return {
          clubId: o.clubId,
          clubName: o.clubName,
          clubShort: o.clubShort,
          clubColor: o.clubColor,
          clubColor2: o.clubColor2,
          leagueId: o.leagueId,
          leagueName: o.leagueName,
          seasonNumber: o.seasonNumber,
          weekNumber: o.weekNumber,
          seasonLength: o.seasonLength,
          matchTime: o.matchTime,
          inviteCode: o.inviteCode,
          humanCount: members.filter((m) => !m.isBot).length,
          botCount: members.filter((m) => m.isBot).length,
        };
      }),
    );
  }
  return <LobbyClient leagues={rows} />;
}
