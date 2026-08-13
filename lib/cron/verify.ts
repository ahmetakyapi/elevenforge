/**
 * Guard for cron webhook endpoints.
 *
 * These endpoints simulate matches, pay out the weekly economy and run the
 * transfer market across EVERY league in the database, so they are the most
 * damaging thing an outsider could reach. The guard is therefore fail-closed:
 * in production a missing or mismatched CRON_SECRET is a 401, never an
 * implicit "auth disabled". Forgetting an env var must break the cron, not
 * silently open the game to the internet.
 *
 * Local development (NODE_ENV !== "production") stays open so `npm run
 * cron:dev` needs no configuration.
 *
 * Returns a Response if the request is rejected, or null to continue.
 */
import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

/**
 * Compare via fixed-length SHA-256 digests so the comparison is constant-time
 * *and* immune to the length leak of a raw timingSafeEqual (which throws on
 * mismatched buffer lengths).
 */
function secretsMatch(a: string, b: string): boolean {
  const da = createHash("sha256").update(a).digest();
  const db = createHash("sha256").update(b).digest();
  return timingSafeEqual(da, db);
}

export async function verifyCron(req: Request): Promise<Response | null> {
  if (process.env.NODE_ENV !== "production") return null;

  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error(
      "[cron] CRON_SECRET is not set — refusing to run a scheduled job in production.",
    );
    return NextResponse.json(
      { error: "Cron is not configured." },
      { status: 503 },
    );
  }

  // Accept either the bearer header (QStash forward header, cron-job.org) or
  // Vercel Cron's own x-vercel-cron-signature style bearer.
  const header = req.headers.get("authorization") ?? "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (bearer && secretsMatch(bearer, secret)) return null;

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
