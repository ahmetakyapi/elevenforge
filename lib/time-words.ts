/**
 * Durations and "how long ago", written out in Turkish words.
 *
 * The app printed these four different ways — "4g önce", "71sa 28dk",
 * "⏱ 71s 28dk" (where "s" read as seconds, not hours) and "12dk" — each from
 * its own inline helper. Abbreviations like these are fine in a table column
 * but not in a sentence, and "71 saat" is a number nobody counts in: past a
 * day it is days and hours. One module, so every countdown and every feed
 * line says it the same way.
 *
 * Pure functions, no `Date.now()` inside: callers pass the clock so a server
 * render and the hydrating client cannot disagree.
 */

/** "az önce", "5 dakika önce", "3 saat önce", "4 gün önce". */
export function timeAgoTr(fromMs: number, nowMs: number): string {
  const s = Math.max(0, Math.floor((nowMs - fromMs) / 1000));
  if (s < 60) return "az önce";
  if (s < 3600) return `${Math.floor(s / 60)} dakika önce`;
  if (s < 86400) return `${Math.floor(s / 3600)} saat önce`;
  return `${Math.floor(s / 86400)} gün önce`;
}

/**
 * A remaining duration: "2 gün 23 saat", "5 saat 12 dakika", "12 dakika",
 * "1 dakikadan az". Two units at most — a countdown that also lists seconds
 * reads as urgency it does not have.
 */
export function durationTr(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  if (days > 0) return hours > 0 ? `${days} gün ${hours} saat` : `${days} gün`;
  if (hours > 0) return minutes > 0 ? `${hours} saat ${minutes} dakika` : `${hours} saat`;
  if (minutes > 0) return `${minutes} dakika`;
  return "1 dakikadan az";
}
