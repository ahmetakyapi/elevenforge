"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { clubs } from "@/lib/schema";
import { requireLeagueContext } from "@/lib/session";
import type { Formation } from "@/types";

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
  const presets = parsePresets(ctx.club.tacticPresets);
  presets[input.slot] = {
    formation: input.formation,
    mentality: input.mentality,
    pressing: input.pressing,
    tempo: input.tempo,
  };
  const clamp = (n: number) => Math.max(0, Math.min(4, Math.round(n)));
  await db
    .update(clubs)
    .set({
      tacticPresets: JSON.stringify(presets),
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
