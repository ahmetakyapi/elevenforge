"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { clubs, players } from "@/lib/schema";
import { requireLeagueContext } from "@/lib/session";
import { uuidSchema, validate } from "@/lib/validation";
import type { Formation } from "@/types";

const subPlanSchema = z.object({
  subs: z
    .array(
      z.object({
        minute: z.number().int().min(1).max(90),
        outId: uuidSchema,
        inId: uuidSchema,
      }),
    )
    .max(3, "En fazla 3 değişiklik planlayabilirsin."),
});

const ALLOWED_FORMATIONS: Formation[] = [
  "4-3-3",
  "4-4-2",
  "4-2-3-1",
  "3-5-2",
  "5-3-2",
  "4-1-4-1",
];

export type TacticPreset = {
  formation: Formation;
  mentality: number;
  pressing: number;
  tempo: number;
};

function parsePresets(raw: string): Array<TacticPreset | null> {
  try {
    const arr = JSON.parse(raw) as Array<TacticPreset | null>;
    if (!Array.isArray(arr)) return Array(7).fill(null);
    const padded = [...arr];
    while (padded.length < 7) padded.push(null);
    return padded.slice(0, 7);
  } catch {
    return Array(7).fill(null);
  }
}

export async function saveTactics(input: {
  formation: Formation;
  mentality: number;
  pressing: number;
  tempo: number;
}) {
  const ctx = await requireLeagueContext();
  if (!ALLOWED_FORMATIONS.includes(input.formation)) {
    return { ok: false as const, error: "Geçersiz diziliş." };
  }
  const clamp = (n: number) => Math.max(0, Math.min(4, Math.round(n)));

  await db
    .update(clubs)
    .set({
      formation: input.formation,
      mentality: clamp(input.mentality),
      pressing: clamp(input.pressing),
      tempo: clamp(input.tempo),
    })
    .where(eq(clubs.id, ctx.club.id));

  revalidatePath("/tactic");
  return { ok: true as const };
}

/**
 * Save the currently-active tactic into preset slot (0..6).
 * Also makes it the club's active tactic so the next match uses it.
 */
export async function saveTacticPreset(input: {
  slot: number;
  formation: Formation;
  mentality: number;
  pressing: number;
  tempo: number;
}) {
  const ctx = await requireLeagueContext();
  if (input.slot < 0 || input.slot > 6) {
    return { ok: false as const, error: "Geçersiz preset slot." };
  }
  if (!ALLOWED_FORMATIONS.includes(input.formation)) {
    return { ok: false as const, error: "Geçersiz diziliş." };
  }
  // Clamp before storing, not just before writing the active tactic. The
  // preset used to keep the raw client value, so loadTacticPreset later
  // copied an out-of-range dial straight onto the club.
  const clamp = (n: number) => Math.max(0, Math.min(4, Math.round(n)));
  const mentality = clamp(input.mentality);
  const pressing = clamp(input.pressing);
  const tempo = clamp(input.tempo);

  const presets = parsePresets(ctx.club.tacticPresets);
  presets[input.slot] = {
    formation: input.formation,
    mentality,
    pressing,
    tempo,
  };
  await db
    .update(clubs)
    .set({
      tacticPresets: JSON.stringify(presets),
      formation: input.formation,
      mentality,
      pressing,
      tempo,
    })
    .where(eq(clubs.id, ctx.club.id));

  revalidatePath("/tactic");
  return { ok: true as const };
}

/**
 * Save the in-match substitution plan (3 subs max, each a {minute, outId,
 * inId}). Engine reads this on match-day and swaps players in chronological
 * order. Server validates slot count + player ownership.
 */
export async function saveSubPlan(input: {
  subs: Array<{ minute: number; outId: string; inId: string }>;
}) {
  const ctx = await requireLeagueContext();
  const parsed = validate(subPlanSchema, input);
  if (!parsed.ok) return parsed;
  const subs = parsed.data.subs;

  for (const s of subs) {
    if (s.outId === s.inId) {
      return { ok: false as const, error: "Aynı oyuncu giremez ve çıkamaz." };
    }
  }

  // The old comment claimed ownership was validated; it was not. Without
  // this check a crafted request could name another club's players, and the
  // engine would try to bring them on.
  const squad = await db
    .select({ id: players.id })
    .from(players)
    .where(eq(players.clubId, ctx.club.id));
  const owned = new Set(squad.map((p) => p.id));
  for (const s of subs) {
    if (!owned.has(s.outId) || !owned.has(s.inId)) {
      return { ok: false as const, error: "Bu oyuncu senin kadronda değil." };
    }
  }

  // A player may not be involved in two swaps in the same plan.
  const involved = new Set<string>();
  for (const s of subs) {
    if (involved.has(s.outId) || involved.has(s.inId)) {
      return { ok: false as const, error: "Bir oyuncu tek değişiklikte yer alabilir." };
    }
    involved.add(s.outId);
    involved.add(s.inId);
  }

  await db
    .update(clubs)
    .set({ subPlanJson: JSON.stringify(subs) })
    .where(eq(clubs.id, ctx.club.id));
  revalidatePath("/tactic");
  return { ok: true as const };
}

/**
 * Load preset slot N into the active tactic.
 */
export async function loadTacticPreset(slot: number) {
  const ctx = await requireLeagueContext();
  const presets = parsePresets(ctx.club.tacticPresets);
  const preset = presets[slot];
  if (!preset) {
    return { ok: false as const, error: "Bu slot boş." };
  }
  await db
    .update(clubs)
    .set({
      formation: preset.formation,
      mentality: preset.mentality,
      pressing: preset.pressing,
      tempo: preset.tempo,
    })
    .where(eq(clubs.id, ctx.club.id));

  revalidatePath("/tactic");
  return { ok: true as const, preset };
}
