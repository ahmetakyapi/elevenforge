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
 *
 * ─── The club is now CHOSEN, not assigned ───────────────────────────────
 *
 * This used to order the bots by `id` and take the first one a conditional
 * UPDATE would claim. `id` is a random UUID, so it was a coin toss across the
 * entire league — including the second division, which the joiner was never
 * told existed. Three friends joining the same league got the title
 * favourite, a mid-table side and a 1. Lig club, in whatever order they
 * happened to type the code. (The comment here claimed it preferred a
 * mid-strength bot. It did not.)
 *
 * `clubId` is optional so the register flow, which has no picker, still
 * works — but when it is omitted the fallback is now DELIBERATE rather than
 * arbitrary: the mid-table club of the top division, which is the least
 * surprising thing to hand someone who did not choose.
 */
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { clubs, feedEvents, leagues, users } from "@/lib/schema";
import { deriveShortName } from "@/lib/utils";

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
  /** The club the manager picked. Omitted → a mid-table top-flight club. */
  clubId?: string;
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

  const allBots = await db
    .select()
    .from(clubs)
    .where(and(eq(clubs.leagueId, league.id), eq(clubs.isBot, true)));
  if (allBots.length === 0) {
    return { ok: false, error: "Lig dolu, bot kalmadı." };
  }

  /*
    Candidate order.

    If the manager picked a club, that club is the only candidate — silently
    handing them a different one because theirs was taken a second earlier
    would be worse than telling them to pick again.

    Otherwise: top flight, sorted by prestige, and start from the middle.
    Somebody who did not choose should not be handed the title favourite or a
    relegation candidate.
  */
  let botClubs = allBots;
  if (input.clubId) {
    const picked = allBots.find((c) => c.id === input.clubId);
    if (!picked) {
      return { ok: false, error: "Bu kulüp artık müsait değil, başka seç." };
    }
    botClubs = [picked];
  } else {
    const topFlight = allBots
      .filter((c) => c.division === 1)
      .sort((a, b) => b.prestige - a.prestige);
    const pool = topFlight.length > 0 ? topFlight : allBots;
    const mid = Math.floor(pool.length / 2);
    // Walk outwards from the middle, so a contested join still lands near
    // mid-table rather than falling through to whichever end of the table.
    botClubs = [...pool].sort(
      (a, b) =>
        Math.abs(pool.indexOf(a) - mid) - Math.abs(pool.indexOf(b) - mid),
    );
  }

  // Try claims in id-order until one sticks. Optimistic UPDATE: if another
  // request stole the row in between (rowCount=0), move to the next bot.
  let claimedClubId: string | null = null;
  for (const candidate of botClubs) {
    const teamName = (input.teamName ?? "").trim();
    const newName = teamName.length >= 2 ? teamName : candidate.name;
    const newShort =
      teamName.length >= 2 ? deriveShortName(teamName) : candidate.shortName;
    const updated = await db
      .update(clubs)
      .set({
        ownerUserId: input.userId,
        isBot: false,
        // A human is at the wheel now — stand the AI manager down.
        aiManaged: false,
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

  const [claimed] = await db
    .select({ name: clubs.name })
    .from(clubs)
    .where(eq(clubs.id, claimedClubId));
  await db.insert(feedEvents).values({
    leagueId: league.id,
    clubId: claimedClubId,
    eventType: "morale",
    text: `${claimed?.name ?? "Bir kulüp"} yeni bir teknik direktöre emanet edildi.`,
  });

  return { ok: true, leagueId: league.id, clubId: claimedClubId };
}
