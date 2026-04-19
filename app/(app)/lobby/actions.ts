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

export async function createNewLeague(input: { teamName: string }) {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false as const, error: "Oturum yok." };
  const teamName = input.teamName.trim();
  if (teamName.length < 2) {
    return { ok: false as const, error: "Takım adı çok kısa." };
  }
  const fresh = await createStarterLeague({ userId, teamName });
  revalidatePath("/dashboard");
  revalidatePath("/lobby");
  return { ok: true as const, ...fresh };
}
