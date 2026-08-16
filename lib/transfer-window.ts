/**
 * When the transfer market is open.
 *
 * Transfers ran every day of the year, which flattens the season: there is no
 * moment where a squad is settled, no deadline that forces a decision, and no
 * reason to plan further ahead than tomorrow. Windows give the calendar a
 * shape — build in the summer, patch in the winter, live with what you have
 * in between.
 *
 * DERIVED, NOT STORED. The window is a pure function of the league's own
 * `weekNumber` and `seasonLength`, so there is no column to keep in step and
 * no way for the stored flag to disagree with the fixture list. There are
 * exactly three writers of `leagues.weekNumber` in the codebase —
 * create-league.ts (0 at creation), match-day.ts (the highest finished week)
 * and the season-roll CAS in season.ts (back to 0) — and all three already
 * maintain it correctly for the fixture list. A boolean would add a fourth
 * thing to remember at each of them.
 *
 * The boundaries are FRACTIONS of the season, not fixed week numbers: a league
 * is 34 rounds in the top flight but 15 in the older 16-club leagues, and a
 * window pinned to "weeks 1-5" would be a third of a short season and a
 * seventh of a long one.
 */
export type TransferWindowPhase = "preseason" | "midseason" | "closed";

export type TransferWindowState = {
  open: boolean;
  phase: TransferWindowPhase;
  /** Turkish label for the UI, e.g. "Yaz transfer dönemi". */
  label: string;
  /** Week the current window shuts, when one is open. */
  closesAtWeek: number | null;
  /** Week the next window opens, when the market is shut. */
  opensAtWeek: number | null;
};

/** Summer window: the opening stretch of the season, plus the pre-season. */
const PRESEASON_SHARE = 0.15;
/** Winter window, centred on the halfway point. */
const MIDSEASON_START_SHARE = 0.45;
const MIDSEASON_END_SHARE = 0.55;

export function transferWindow(league: {
  weekNumber: number;
  seasonLength: number;
}): TransferWindowState {
  const length = Math.max(1, league.seasonLength);
  const week = Math.max(0, league.weekNumber);

  // At least two rounds each, so a very short league still has a usable
  // window rather than a single instant.
  const preseasonEnd = Math.max(2, Math.round(length * PRESEASON_SHARE));
  const midStart = Math.max(
    preseasonEnd + 1,
    Math.round(length * MIDSEASON_START_SHARE),
  );
  const midEnd = Math.max(midStart + 1, Math.round(length * MIDSEASON_END_SHARE));

  if (week <= preseasonEnd) {
    return {
      open: true,
      phase: "preseason",
      label: "Yaz transfer dönemi",
      closesAtWeek: preseasonEnd,
      opensAtWeek: null,
    };
  }
  if (week >= midStart && week <= midEnd) {
    return {
      open: true,
      phase: "midseason",
      label: "Devre arası transfer dönemi",
      closesAtWeek: midEnd,
      opensAtWeek: null,
    };
  }
  return {
    open: false,
    phase: "closed",
    label: "Transfer dönemi kapalı",
    closesAtWeek: null,
    // After the winter window there is nothing left this season; the next
    // chance is the pre-season, which the roll reaches by resetting week to 0.
    opensAtWeek: week < midStart ? midStart : null,
  };
}

/**
 * The refusal every guarded action returns, so the wording is identical
 * wherever a manager meets it.
 */
export function windowClosedError(state: TransferWindowState): {
  ok: false;
  error: string;
} {
  const when =
    state.opensAtWeek !== null
      ? ` ${state.opensAtWeek}. haftada yeniden açılıyor.`
      : " Sezon sonunda yeniden açılıyor.";
  return {
    ok: false,
    error: `Transfer dönemi kapalı.${when}`,
  };
}
