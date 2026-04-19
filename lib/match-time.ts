/**
 * Helpers for scheduling fixtures at the league's chosen match time.
 *
 * `league.matchTime` is stored as "HH:MM" (e.g. "21:00"). All fixture
 * scheduling — initial league create, season roll, cup bracket — should
 * route through these helpers so the user's pick is actually honored.
 */

export function parseMatchTime(matchTime: string): { hour: number; minute: number } {
  const [hPart, mPart] = matchTime.split(":");
  const hour = Number.isFinite(Number(hPart)) ? Math.max(0, Math.min(23, Number(hPart))) : 21;
  const minute = Number.isFinite(Number(mPart)) ? Math.max(0, Math.min(59, Number(mPart))) : 0;
  return { hour, minute };
}

/** Apply HH:MM to a Date in-place. Returns the same Date for chaining. */
export function applyMatchTime(date: Date, matchTime: string): Date {
  const { hour, minute } = parseMatchTime(matchTime);
  date.setHours(hour, minute, 0, 0);
  return date;
}
