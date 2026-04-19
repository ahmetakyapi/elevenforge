"use server";

import { revalidatePath } from "next/cache";
import { switchLeague } from "@/lib/session";

/**
 * Server-action wrapper around lib/session#switchLeague so the league
 * switcher (a client component) can invoke it. Revalidates every app
 * route since the entire context (club, fixtures, standings) changes.
 */
export async function switchLeagueAction(input: { leagueId: string }) {
  const result = await switchLeague(input.leagueId);
  if (result.ok) {
    revalidatePath("/dashboard");
    revalidatePath("/squad");
    revalidatePath("/transfer");
    revalidatePath("/tactic");
    revalidatePath("/match");
    revalidatePath("/cup");
    revalidatePath("/newspaper");
    revalidatePath("/crew");
  }
  return result;
}
