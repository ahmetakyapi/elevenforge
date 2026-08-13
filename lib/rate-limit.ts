/**
 * Best-effort in-process rate limiting.
 *
 * On Vercel each serverless instance gets its own map, so this is a throttle
 * rather than a hard guarantee — it stops the obvious "hold down the button"
 * and script-in-a-loop cases without adding a Redis dependency. Anything that
 * must be exactly-once (claiming a reward, buying a player) is guarded at the
 * database level instead; see lib/money.ts and the conditional UPDATEs in the
 * action files.
 */
type Hit = { count: number; resetAt: number };

const buckets = new Map<string, Hit>();

/** Drop expired buckets so a long-lived instance doesn't grow unbounded. */
function sweep(now: number): void {
  if (buckets.size < 5_000) return;
  for (const [key, hit] of buckets) {
    if (hit.resetAt <= now) buckets.delete(key);
  }
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; retryAfterMs: number } {
  const now = Date.now();
  sweep(now);
  const hit = buckets.get(key);
  if (!hit || hit.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterMs: 0 };
  }
  if (hit.count >= limit) {
    return { ok: false, retryAfterMs: hit.resetAt - now };
  }
  hit.count++;
  return { ok: true, retryAfterMs: 0 };
}

/** Client IP from the proxy headers Vercel sets, for unauthenticated routes. */
export function clientIpFrom(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}
