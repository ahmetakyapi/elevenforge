"use server";

import { revalidatePath } from "next/cache";
import { claimScoutPlayer } from "@/lib/jobs/scout";
import { requireLeagueContext } from "@/lib/session";
import { uuidSchema, validate } from "@/lib/validation";

export async function claimScout(scoutId: string, candidateIndex: number) {
  const ctx = await requireLeagueContext();
  const parsed = validate(uuidSchema, scoutId);
  if (!parsed.ok) return parsed;
  if (!Number.isInteger(candidateIndex) || candidateIndex < 0) {
    return { ok: false as const, error: "Geçersiz aday." };
  }
  // The caller's club comes from the session, never from the client — the
  // scout row's own clubId is what an attacker would otherwise pivot through.
  const result = await claimScoutPlayer(ctx.club.id, parsed.data, candidateIndex);
  if (result.ok) {
    revalidatePath("/transfer");
    revalidatePath("/squad");
    revalidatePath("/dashboard");
  }
  return result;
}
