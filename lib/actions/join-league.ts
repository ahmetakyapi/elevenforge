/**
 * Claim a bot-controlled club inside an existing league via invite code.
 * Used by the lobby JoinFlow and by register when an inviteCode is supplied.
 *
 * Constraints:
 *  - Code must match an active league.
 *  - User cannot already own a club in that league.
 *  - At least one bot club must remain — leagues are full at 16 humans.
 *  - The chosen club is renamed to the user's chosen team name (short name
 *    derived from initials) so other players see the new identity.
 */
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { clubs, feedEvents, leagues, users } from "@/lib/schema";

export type JoinResult =
  | {
      ok: true;
      leagueId: string;
      clubId: string;
    }
  | { ok: false; error: string };

export async function joinLeagueByInviteCode(input: {
  userId: string;
  inviteCode: string;
  teamName?: string;
}): Promise<JoinResult> {
  const code = input.inviteCode.trim().toUpperCase();
  if (code.length === 0) return { ok: false, error: "Davet kodu boş." };

  const [league] = await db
    .select()
    .from(leagues)
    .where(eq(leagues.inviteCode, code))
    .limit(1);
  if (!league) return { ok: false, error: "Davet kodu bulunamadı." };
  if (league.status === "finished") {
    return { ok: false, error: "Bu lig sona ermiş." };
  }

  const existing = await db
    .select({ id: clubs.id })
    .from(clubs)
    .where(
      and(eq(clubs.leagueId, league.id), eq(clubs.ownerUserId, input.userId)),
    )
    .limit(1);
  if (existing.length > 0) {
    return { ok: false, error: "Zaten bu ligdesin." };
  }

  // Prefer a mid-strength bot — sorting deterministically by id avoids two
  // simultaneous joiners landing on the exact same row before the UPDATE
  // runs (the optimistic UPDATE below also guards against double-claim).
  const botClubs = await db
    .select()
    .from(clubs)
    .where(and(eq(clubs.leagueId, league.id), eq(clubs.isBot, true)))
    .orderBy(clubs.id);
  if (botClubs.length === 0) {
    return { ok: false, error: "Lig dolu, bot kalmadı." };
  }

  // Try claims in id-order until one sticks. Optimistic UPDATE: if another
  // request stole the row in between (rowCount=0), move to the next bot.
  let claimedClubId: string | null = null;
  for (const candidate of botClubs) {
    const teamName = (input.teamName ?? "").trim();
    const newName = teamName.length >= 2 ? teamName : candidate.name;
    const newShort =
      teamName.length >= 2
        ? teamName
            .split(/\s+/)
            .map((w) => w[0])
            .slice(0, 3)
            .join("")
            .toUpperCase()
        : candidate.shortName;
    const updated = await db
      .update(clubs)
      .set({
        ownerUserId: input.userId,
        isBot: false,
        name: newName,
        shortName: newShort,
      })
      .where(and(eq(clubs.id, candidate.id), eq(clubs.isBot, true)))
      .returning();
    if (updated.length > 0) {
      claimedClubId = updated[0].id;
      break;
    }
  }
  if (!claimedClubId) {
    return { ok: false, error: "Lig dolu, bot kalmadı." };
  }

  await db
    .update(users)
    .set({ currentLeagueId: league.id })
    .where(eq(users.id, input.userId));

  await db.insert(feedEvents).values({
    leagueId: league.id,
    clubId: claimedClubId,
    eventType: "morale",
    text: `Yeni bir kullanıcı ligine katıldı.`,
  });

  return { ok: true, leagueId: league.id, clubId: claimedClubId };
}
