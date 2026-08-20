"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { clubs, leagues } from "@/lib/schema";
import { loadJoinableClubs } from "@/lib/queries/joinable";
import { joinLeagueByInviteCode } from "@/lib/actions/join-league";
import { createStarterLeague } from "@/lib/actions/create-league";
import { getSessionUserId } from "@/lib/session";

/**
 * Look up a league by its invite code and list the clubs still available.
 *
 * Separate from joining so the picker can be shown BEFORE anything is
 * claimed — the code is validated once, the manager chooses, and only then
 * does a club change hands.
 */
export async function previewInvite(input: { inviteCode: string }) {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false as const, error: "Oturum yok." };
  const code = input.inviteCode.trim().toUpperCase();
  const [league] = await db
    .select()
    .from(leagues)
    .where(eq(leagues.inviteCode, code))
    .limit(1);
  if (!league) return { ok: false as const, error: "Davet kodu bulunamadı." };
  if (league.status === "finished") {
    return { ok: false as const, error: "Bu lig sona ermiş." };
  }
  const mine = await db
    .select({ id: clubs.id })
    .from(clubs)
    .where(and(eq(clubs.leagueId, league.id), eq(clubs.ownerUserId, userId)))
    .limit(1);
  if (mine.length > 0) {
    return { ok: false as const, error: "Zaten bu ligdesin." };
  }
  const available = await loadJoinableClubs(league.id);
  if (available.length === 0) {
    return { ok: false as const, error: "Lig dolu, boş kulüp kalmadı." };
  }
  return {
    ok: true as const,
    league: {
      name: league.name,
      seasonNumber: league.seasonNumber,
      weekNumber: league.weekNumber,
      seasonLength: league.seasonLength,
      matchTime: league.matchTime,
    },
    clubs: available,
  };
}

export async function joinByInvite(input: {
  inviteCode: string;
  clubId?: string;
  teamName?: string;
}) {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false as const, error: "Oturum yok." };
  const result = await joinLeagueByInviteCode({
    userId,
    inviteCode: input.inviteCode,
    clubId: input.clubId,
    teamName: input.teamName,
  });
  if (!result.ok) return result;
  revalidatePath("/dashboard");
  revalidatePath("/lobby");
  return result;
}

export async function createNewLeague(input: {
  teamName: string;
  matchTime?: string;
  visibility?: "private" | "public";
  accentColor?: string;
  manualAdvanceEnabled?: boolean;
}) {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false as const, error: "Oturum yok." };
  const teamName = input.teamName.trim();
  if (teamName.length < 2) {
    return { ok: false as const, error: "Takım adı çok kısa." };
  }
  const matchTime = input.matchTime ?? "21:00";
  if (!/^\d{1,2}:\d{2}$/.test(matchTime)) {
    return { ok: false as const, error: "Geçersiz maç saati (HH:MM)." };
  }
  const fresh = await createStarterLeague({
    userId,
    teamName,
    matchTime,
    visibility: input.visibility,
    accentColor: input.accentColor,
    manualAdvanceEnabled: input.manualAdvanceEnabled,
  });
  revalidatePath("/dashboard");
  revalidatePath("/lobby");
  return { ok: true as const, ...fresh };
}
