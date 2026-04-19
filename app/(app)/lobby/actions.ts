"use server";

import { revalidatePath } from "next/cache";
import { joinLeagueByInviteCode } from "@/lib/actions/join-league";
import { createStarterLeague } from "@/lib/actions/create-league";
import { getSessionUserId } from "@/lib/session";

export async function joinByInvite(input: { inviteCode: string }) {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false as const, error: "Oturum yok." };
  const result = await joinLeagueByInviteCode({
    userId,
    inviteCode: input.inviteCode,
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
  });
  revalidatePath("/dashboard");
  revalidatePath("/lobby");
  return { ok: true as const, ...fresh };
}
