"use server";

import { revalidatePath } from "next/cache";
import { claimScoutPlayer } from "@/lib/jobs/scout";
import { requireLeagueContext } from "@/lib/session";

export async function claimScout(scoutId: string, candidateIndex: number) {
  await requireLeagueContext();
  const result = await claimScoutPlayer(scoutId, candidateIndex);
  if (result.ok) {
    revalidatePath("/transfer");
    revalidatePath("/squad");
  }
  return result;
}
