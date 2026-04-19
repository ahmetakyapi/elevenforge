"use server";

import { revalidatePath } from "next/cache";
import { claimLoginReward } from "@/lib/actions/login-streak";
import { getSessionUserId } from "@/lib/session";

export async function claimDailyReward() {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false as const, error: "Oturum yok." };
  const result = await claimLoginReward(userId);
  if (result.ok) revalidatePath("/dashboard");
  return result.ok
    ? { ok: true as const, granted: result.granted ?? 0 }
    : { ok: false as const, error: result.error ?? "Hata." };
}
