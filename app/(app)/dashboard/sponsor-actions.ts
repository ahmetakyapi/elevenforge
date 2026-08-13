"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { clubs, feedEvents } from "@/lib/schema";
import { requireLeagueContext } from "@/lib/session";
import { SPONSORS, sponsorById } from "@/lib/sponsors";

/**
 * Sign a sponsor contract. Replaces any existing active sponsor (a club
 * holds at most one). Prestige gate enforced server-side.
 */
export async function signSponsor(input: { sponsorId: string }) {
  const ctx = await requireLeagueContext();
  const sp = sponsorById(input.sponsorId);
  if (!sp) return { ok: false as const, error: "Sponsor bulunamadı." };
  if (ctx.club.prestige < sp.minPrestige) {
    return {
      ok: false as const,
      error: `${sp.name} için en az ${sp.minPrestige} prestij gerek (sende ${ctx.club.prestige}).`,
    };
  }

  await db
    .update(clubs)
    .set({
      activeSponsorJson: JSON.stringify({
        id: sp.id,
        name: sp.name,
        payPerMatchCents: sp.payPerMatchCents,
        bonusPerWinCents: sp.bonusPerWinCents,
        seasonBonusCents: sp.seasonBonusCents,
        weeksLeft: sp.weeks,
      }),
    })
    .where(eq(clubs.id, ctx.club.id));

  await db.insert(feedEvents).values({
    leagueId: ctx.league.id,
    clubId: ctx.club.id,
    eventType: "morale",
    text: `${ctx.club.name} ${sp.name} ile sponsor anlaşması imzaladı.`,
  });

  revalidatePath("/dashboard");
  return { ok: true as const };
}

export async function listAvailableSponsors() {
  return SPONSORS;
}
