/**
 * Team Of The Week calculator.
 * Picks 1 GK + 4 DEF + 4 MID + 2 FWD with highest ratings this week,
 * breaking ties by goals+assists then by overall.
 */
import type { DBPlayer } from "@/lib/schema";

export type TotwEntry = {
  playerId: string;
  name: string;
  clubId: string;
  position: string;
  rating: number;
};

export type WeekPerformance = {
  player: DBPlayer;
  rating: number;
  goals: number;
  assists: number;
  clubId: string;
};

export function buildTOTW(performances: WeekPerformance[]): TotwEntry[] {
  const byPos = (pos: DBPlayer["position"]) =>
    performances.filter((p) => p.player.position === pos);
  const sortByImpact = (arr: WeekPerformance[]) =>
    [...arr].sort(
      (a, b) =>
        b.rating - a.rating ||
        b.goals + b.assists - (a.goals + a.assists) ||
        b.player.overall - a.player.overall,
    );

  const gk = sortByImpact(byPos("GK")).slice(0, 1);
  const def = sortByImpact(byPos("DEF")).slice(0, 4);
  const mid = sortByImpact(byPos("MID")).slice(0, 4);
  const fwd = sortByImpact(byPos("FWD")).slice(0, 2);

  const roleLabel = (p: DBPlayer): string => p.role;

  return [...gk, ...def, ...mid, ...fwd].map((wp) => ({
    playerId: wp.player.id,
    name: wp.player.name,
    clubId: wp.clubId,
    position: roleLabel(wp.player),
    rating: Number(wp.rating.toFixed(1)),
  }));
}
