"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { clubs, feedEvents } from "@/lib/schema";
import { requireLeagueContext } from "@/lib/session";
import { parseStaffJson, staffById, type StaffRole } from "@/lib/staff";

/**
 * Hire a staff member into the given role. Replaces any existing hire in
 * that slot. Charges hireCostCents up-front; weeklyWageCents is deducted
 * by the weekly economy job.
 */
export async function hireStaff(input: { staffId: string }) {
  const ctx = await requireLeagueContext();
  const member = staffById(input.staffId);
  if (!member) return { ok: false as const, error: "Personel bulunamadı." };
  if (ctx.club.balanceCents < member.hireCostCents) {
    return {
      ok: false as const,
      error: `Bütçe yetersiz (€${(member.hireCostCents / 100 / 1_000_000).toFixed(1)}M gerek).`,
    };
  }
  const current = parseStaffJson(ctx.club.staffJson);
  const next = {
    headCoach: current.headCoach
      ? { id: current.headCoach.id }
      : null,
    physio: current.physio ? { id: current.physio.id } : null,
    scout: current.scout ? { id: current.scout.id } : null,
  };
  next[member.role] = { id: member.id };

  await db
    .update(clubs)
    .set({
      staffJson: JSON.stringify(next),
      balanceCents: sql`${clubs.balanceCents} - ${member.hireCostCents}`,
    })
    .where(eq(clubs.id, ctx.club.id));

  await db.insert(feedEvents).values({
    leagueId: ctx.league.id,
    clubId: ctx.club.id,
    eventType: "morale",
    text: `${ctx.club.name} ${member.name}'i ${ROLE_LABEL[member.role]} olarak işe aldı.`,
  });

  revalidatePath("/dashboard");
  return { ok: true as const };
}

export async function fireStaff(input: { role: StaffRole }) {
  const ctx = await requireLeagueContext();
  const current = parseStaffJson(ctx.club.staffJson);
  if (!current[input.role]) {
    return { ok: false as const, error: "Bu slotta personel yok." };
  }
  const next = {
    headCoach: input.role === "headCoach" ? null : current.headCoach ? { id: current.headCoach.id } : null,
    physio: input.role === "physio" ? null : current.physio ? { id: current.physio.id } : null,
    scout: input.role === "scout" ? null : current.scout ? { id: current.scout.id } : null,
  };
  await db
    .update(clubs)
    .set({ staffJson: JSON.stringify(next) })
    .where(eq(clubs.id, ctx.club.id));
  revalidatePath("/dashboard");
  return { ok: true as const };
}

const ROLE_LABEL: Record<StaffRole, string> = {
  headCoach: "Başantrenör",
  physio: "Fizyoterapist",
  scout: "Baş Kaşif",
};
