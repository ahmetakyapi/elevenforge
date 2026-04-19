/**
 * Web Push helper.
 *
 * In dev, if VAPID keys aren't set, push calls are no-ops that log instead.
 * In prod, set these env vars:
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY="..."
 *   VAPID_PRIVATE_KEY="..."
 *   VAPID_SUBJECT="mailto:ahmetakyapii@gmail.com"
 * Generate a pair with: `npx web-push generate-vapid-keys`
 */
import { eq } from "drizzle-orm";
import webpush from "web-push";
import { db } from "@/lib/db";
import { pushSubscriptions } from "@/lib/schema";

const PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const PRIVATE = process.env.VAPID_PRIVATE_KEY;
const SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:ahmet@elevenforge.app";

const enabled = Boolean(PUBLIC && PRIVATE);
if (enabled && PUBLIC && PRIVATE) {
  webpush.setVapidDetails(SUBJECT, PUBLIC, PRIVATE);
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  icon?: string;
};

export async function sendPush(userId: string, payload: PushPayload) {
  if (!enabled) {
    console.log(`[push:dev] to=${userId}:`, payload);
    return { sent: 0, skipped: "vapid-not-configured" };
  }
  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));
  const results = await Promise.allSettled(
    subs.map((s) =>
      webpush.sendNotification(
        {
          endpoint: s.endpoint,
          keys: { p256dh: s.p256dh, auth: s.auth },
        },
        JSON.stringify(payload),
      ),
    ),
  );

  // Prune dead subscriptions (410/404)
  for (const [i, r] of results.entries()) {
    if (
      r.status === "rejected" &&
      ((r.reason as { statusCode?: number })?.statusCode === 410 ||
        (r.reason as { statusCode?: number })?.statusCode === 404)
    ) {
      await db
        .delete(pushSubscriptions)
        .where(eq(pushSubscriptions.endpoint, subs[i].endpoint));
    }
  }

  return { sent: results.filter((r) => r.status === "fulfilled").length };
}
