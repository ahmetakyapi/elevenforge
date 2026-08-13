/**
 * Helpers for scheduling fixtures at the league's chosen match time.
 *
 * `league.matchTime` is "HH:MM" and `league.timeZone` is an IANA zone
 * ("Europe/Istanbul"). Both are needed: the previous implementation called
 * `date.setHours(...)`, which resolves against the *server's* timezone. On
 * Vercel that is UTC, so a Turkish league that picked 21:00 had its fixtures
 * written for 21:00 UTC — kick-off at midnight local, on the wrong calendar
 * day. Everyone's "matches at nine" quietly became "matches at twelve".
 *
 * There is no date library here, so the conversion is done with Intl: format
 * an instant in the target zone, read back what wall-clock time it lands on,
 * and use the difference as the offset. That handles DST correctly, including
 * the day the clocks change.
 */

export const DEFAULT_TIME_ZONE = "Europe/Istanbul";

export function parseMatchTime(matchTime: string): { hour: number; minute: number } {
  const [hPart, mPart] = matchTime.split(":");
  const hour = Number.isFinite(Number(hPart)) ? Math.max(0, Math.min(23, Number(hPart))) : 21;
  const minute = Number.isFinite(Number(mPart)) ? Math.max(0, Math.min(59, Number(mPart))) : 0;
  return { hour, minute };
}

/** Is this a timezone the runtime actually knows about? */
export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

function safeZone(timeZone: string | null | undefined): string {
  if (!timeZone || !isValidTimeZone(timeZone)) return DEFAULT_TIME_ZONE;
  return timeZone;
}

/**
 * How far ahead of UTC `timeZone` is at this instant, in milliseconds.
 * Europe/Istanbul in summer → +3h → 10_800_000.
 */
function zoneOffsetMs(instant: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(instant);
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? "0");
  // `hour` can format as 24 for midnight under hour12:false.
  const asIfUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") % 24,
    get("minute"),
    get("second"),
  );
  return asIfUtc - instant.getTime();
}

/**
 * The UTC instant at which the given wall-clock date/time occurs in
 * `timeZone`.
 *
 * Two passes: the first guesses using the offset at the naive instant, the
 * second corrects it if that guess landed on the other side of a DST switch.
 */
export function zonedTimeToUtc(
  year: number,
  monthIndex: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  const zone = safeZone(timeZone);
  const naive = Date.UTC(year, monthIndex, day, hour, minute, 0, 0);
  const firstGuess = naive - zoneOffsetMs(new Date(naive), zone);
  const refinedOffset = zoneOffsetMs(new Date(firstGuess), zone);
  return new Date(naive - refinedOffset);
}

/** The calendar date, in `timeZone`, that this instant falls on. */
export function zonedCalendarDate(
  instant: Date,
  timeZone: string,
): { year: number; monthIndex: number; day: number } {
  const zone = safeZone(timeZone);
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = dtf.formatToParts(instant);
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? "0");
  return { year: get("year"), monthIndex: get("month") - 1, day: get("day") };
}

/**
 * Kick-off instant for a fixture `dayOffset` days after `from`, at the
 * league's local match time.
 *
 * Days are added on the *calendar*, not by adding 86,400,000ms, so a league
 * still kicks off at 21:00 local on the week the clocks change rather than
 * drifting to 20:00 or 22:00.
 */
export function matchKickoff(
  from: Date,
  dayOffset: number,
  matchTime: string,
  timeZone: string,
): Date {
  const zone = safeZone(timeZone);
  const { year, monthIndex, day } = zonedCalendarDate(from, zone);
  const { hour, minute } = parseMatchTime(matchTime);
  return zonedTimeToUtc(year, monthIndex, day + dayOffset, hour, minute, zone);
}

/**
 * Back-compat shim for the old in-place API.
 *
 * @deprecated Use `matchKickoff`, which is timezone-correct. This mutates the
 * Date using the server's local timezone and is only kept so any missed call
 * site keeps compiling.
 */
export function applyMatchTime(date: Date, matchTime: string): Date {
  const { hour, minute } = parseMatchTime(matchTime);
  date.setHours(hour, minute, 0, 0);
  return date;
}

/**
 * Format an instant for display in a league's timezone.
 *
 * Every `toLocaleDateString`/`toLocaleString` call without an explicit
 * `timeZone` resolves against whatever zone the process happens to be in.
 * In a client component that means the initial server-rendered HTML (Vercel
 * runs at UTC) and the browser's hydration pass produce different strings —
 * a guaranteed hydration mismatch, and a kick-off time shown three hours
 * wrong to Turkish players. Formatting through here, with the league's own
 * zone, makes both sides agree and shows the time the match actually starts.
 */
export function formatInZone(
  instant: Date | number,
  timeZone: string,
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  },
  locale = "tr-TR",
): string {
  return new Intl.DateTimeFormat(locale, {
    ...options,
    timeZone: isValidTimeZone(timeZone) ? timeZone : DEFAULT_TIME_ZONE,
  }).format(instant);
}
