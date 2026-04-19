import { requireLeagueContext } from "@/lib/session";
import { loadSquad } from "@/lib/queries/squad";
import TacticUi from "./tactic-ui";
import type { TacticPreset } from "./actions";
import type { Formation } from "@/types";

const ALLOWED_FORMATIONS: Formation[] = [
  "4-3-3",
  "4-4-2",
  "4-2-3-1",
  "3-5-2",
  "5-3-2",
  "4-1-4-1",
];

export const dynamic = "force-dynamic";

export default async function TacticPage() {
  const ctx = await requireLeagueContext();
  const squad = await loadSquad(ctx);
  const formation = (
    ALLOWED_FORMATIONS.includes(ctx.club.formation as Formation)
      ? (ctx.club.formation as Formation)
      : "4-3-3"
  );
  let presets: Array<TacticPreset | null> = Array(7).fill(null);
  try {
    const parsed = JSON.parse(ctx.club.tacticPresets);
    if (Array.isArray(parsed)) {
      presets = [...parsed];
      while (presets.length < 7) presets.push(null);
      presets = presets.slice(0, 7);
    }
  } catch {}

  let subPlan: Array<{ minute: number; outId: string; inId: string }> = [];
  try {
    const parsed = JSON.parse(ctx.club.subPlanJson);
    if (Array.isArray(parsed)) subPlan = parsed.slice(0, 3);
  } catch {}

  return (
    <TacticUi
      squad={squad}
      initial={{
        formation,
        mentality: ctx.club.mentality,
        pressing: ctx.club.pressing,
        tempo: ctx.club.tempo,
      }}
      presets={presets}
      subPlan={subPlan}
    />
  );
}
