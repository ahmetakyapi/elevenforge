/**
 * Guard for cron webhook endpoints.
 *
 * Accepts a request if ANY of these pass:
 *  1. CRON_SECRET env is set and the request has `Authorization: Bearer <secret>`.
 *  2. QStash signing keys are set and the `Upstash-Signature` header verifies
 *     (future-proof; not implemented yet to avoid extra deps — QStash also
 *     works with the bearer token pattern via forward headers).
 *  3. Local dev (NODE_ENV !== "production") — always allowed.
 *
 * Returns a Response if the request is rejected, or null to continue.
 */
import { NextResponse } from "next/server";

export async function verifyCron(req: Request): Promise<Response | null> {
  if (process.env.NODE_ENV !== "production") return null;

  const secret = process.env.CRON_SECRET;
  if (secret) {
    const header = req.headers.get("authorization") ?? "";
    if (header === `Bearer ${secret}`) return null;
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
