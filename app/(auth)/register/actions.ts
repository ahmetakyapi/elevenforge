"use server";

import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";
import { signIn } from "@/auth";
import { db } from "@/lib/db";
import { clientIpFrom, rateLimit } from "@/lib/rate-limit";
import { users } from "@/lib/schema";
import { createStarterLeague } from "@/lib/actions/create-league";
import { joinLeagueByInviteCode } from "@/lib/actions/join-league";
import {
  displayNameSchema,
  emailSchema,
  inviteCodeSchema,
  passwordSchema,
  validate,
} from "@/lib/validation";

const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  teamName: displayNameSchema,
  inviteCode: z
    .union([inviteCodeSchema, z.literal("")])
    .optional()
    .transform((v) => (v ? v : undefined)),
});

type RegisterResult =
  | {
      ok: true;
      userId: string;
      inviteCode?: string;
      joinedExisting: boolean;
    }
  | { ok: false; error: string };

export async function register(input: {
  email: string;
  password: string;
  teamName: string;
  inviteCode?: string;
}): Promise<RegisterResult> {
  // Registration is unauthenticated and each success writes ~400 rows (16
  // clubs, 361 players, 120 fixtures). Left open it is the cheapest way to
  // fill the database, so it is throttled per IP before any work happens.
  const ip = clientIpFrom(await headers());
  const limited = rateLimit(`register:${ip}`, 5, 60 * 60_000);
  if (!limited.ok) {
    return {
      ok: false,
      error: "Çok fazla kayıt denemesi. Bir süre sonra tekrar dene.",
    };
  }

  const parsed = validate(registerSchema, input);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  const { email, password, teamName } = parsed.data;
  const inviteCode = parsed.data.inviteCode ?? "";

  const passwordHash = await hash(password, 12);
  let inserted: typeof users.$inferSelect | undefined;
  try {
    // Let the unique index on users.email decide the race. A check-then-insert
    // lets two simultaneous signups for the same address both pass the check.
    [inserted] = await db
      .insert(users)
      .values({ email, passwordHash, name: teamName })
      .returning();
  } catch {
    return { ok: false, error: "Bu e-posta zaten kayıtlı." };
  }
  if (!inserted) return { ok: false, error: "Kayıt oluşturulamadı." };

  let resultInviteCode: string | undefined;
  let joinedExisting = false;

  if (inviteCode.length > 0) {
    // Friend's league: claim a bot slot. If the code is bad, fall back to
    // creating a fresh starter league so the user is never stuck.
    const join = await joinLeagueByInviteCode({
      userId: inserted.id,
      inviteCode,
      teamName,
    });
    if (join.ok) {
      resultInviteCode = inviteCode;
      joinedExisting = true;
    } else {
      // Do NOT silently fall back to a fresh private league. Someone who
      // typed a code is trying to join their friends; dropping them into a
      // league of their own — same UI, their own invite code — looks like it
      // worked, and they only discover otherwise when nobody else appears.
      //
      // Roll the account back so the retry is clean: leaving the user row
      // behind would make the second attempt fail with "e-posta zaten
      // kayıtlı" and strand them entirely.
      await db.delete(users).where(eq(users.id, inserted.id));
      return {
        ok: false,
        error:
          join.error ??
          "Davet kodu geçersiz ya da lig dolu. Kodu kontrol edip tekrar dene.",
      };
    }
  } else {
    const fresh = await createStarterLeague({
      userId: inserted.id,
      teamName,
    });
    resultInviteCode = fresh.inviteCode;
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
  } catch {
    // Registration succeeded; if auto-sign-in fails the user can log in.
  }

  return { ok: true, userId: inserted.id, inviteCode: resultInviteCode, joinedExisting };
}
