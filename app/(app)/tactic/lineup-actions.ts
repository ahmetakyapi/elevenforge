"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { autoLineup, isAvailable, parseLineup } from "@/lib/lineup";
import { parseFormation } from "@/lib/engine/formation";
import { clubs, players } from "@/lib/schema";
import { requireLeagueContext } from "@/lib/session";
import { uuidSchema, validate } from "@/lib/validation";

const lineupSchema = z.object({
  xi: z.array(uuidSchema).max(11),
  bench: z.array(uuidSchema).max(12),
});

/**
 * Save the manager's team sheet.
 *
 * Everything is re-checked against the club's actual squad: the client
 * supplies ids, and an id that is not on this club's books (or is
 * duplicated) must never reach the engine.
 */
export async function saveLineup(input: { xi: string[]; bench: string[] }) {
  const ctx = await requireLeagueContext();
  const parsed = validate(lineupSchema, input);
  if (!parsed.ok) return parsed;

  const squad = await db
    .select()
    .from(players)
    .where(eq(players.clubId, ctx.club.id));
  const owned = new Set(squad.map((p) => p.id));

  const seen = new Set<string>();
  const clean = (ids: string[]) =>
    ids.filter((playerId) => {
      if (!owned.has(playerId) || seen.has(playerId)) return false;
      seen.add(playerId);
      return true;
    });

  const xi = clean(parsed.data.xi);
  const bench = clean(parsed.data.bench);

  if (xi.length > 11) {
    return { ok: false as const, error: "İlk 11'de en fazla 11 oyuncu olabilir." };
  }

  // Warn — but do not refuse — when the sheet is incomplete or has players
  // who cannot play. resolveLineup fills those gaps at kick-off, so a
  // half-finished sheet is still better than none.
  const byId = new Map(squad.map((p) => [p.id, p]));
  const unavailable = xi.filter((playerId) => {
    const p = byId.get(playerId);
    return p ? !isAvailable(p) : false;
  }).length;

  const { def, mid, fwd } = parseFormation(ctx.club.formation);
  const counts = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
  for (const playerId of xi) {
    const p = byId.get(playerId);
    if (p) counts[p.position]++;
  }
  const matchesFormation =
    counts.GK === 1 && counts.DEF === def && counts.MID === mid && counts.FWD === fwd;

  await db
    .update(clubs)
    .set({ lineupJson: JSON.stringify({ xi, bench }) })
    .where(eq(clubs.id, ctx.club.id));

  revalidatePath("/tactic");
  revalidatePath("/squad");
  revalidatePath("/dashboard");
  return {
    ok: true as const,
    saved: xi.length,
    unavailable,
    matchesFormation,
  };
}

/** Fill the sheet with the best available eleven for the current formation. */
export async function autoPickLineup() {
  const ctx = await requireLeagueContext();
  const squad = await db
    .select()
    .from(players)
    .where(eq(players.clubId, ctx.club.id));
  const picked = autoLineup(squad, ctx.club.formation);
  await db
    .update(clubs)
    .set({ lineupJson: JSON.stringify(picked) })
    .where(eq(clubs.id, ctx.club.id));
  revalidatePath("/tactic");
  revalidatePath("/squad");
  return { ok: true as const, lineup: picked };
}

/** Read the club's saved sheet, dropping ids that are no longer in the squad. */
export async function getLineup() {
  const ctx = await requireLeagueContext();
  const squad = await db
    .select()
    .from(players)
    .where(eq(players.clubId, ctx.club.id));
  const owned = new Set(squad.map((p) => p.id));
  const saved = parseLineup(ctx.club.lineupJson);
  return {
    xi: saved.xi.filter((playerId) => owned.has(playerId)),
    bench: saved.bench.filter((playerId) => owned.has(playerId)),
  };
}
