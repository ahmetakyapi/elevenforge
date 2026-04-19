"use server";

import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { signIn } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { createStarterLeague } from "@/lib/actions/create-league";
import { joinLeagueByInviteCode } from "@/lib/actions/join-league";

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
  const email = input.email.trim().toLowerCase();
  const teamName = input.teamName.trim();
  const inviteCode = input.inviteCode?.trim().toUpperCase() ?? "";
  if (!/.+@.+\..+/.test(email)) {
    return { ok: false, error: "Geçersiz e-posta adresi." };
  }
  if (input.password.length < 6) {
    return { ok: false, error: "Şifre en az 6 karakter olmalı." };
  }
  if (teamName.length < 2) {
    return { ok: false, error: "Takım adı çok kısa." };
  }

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing.length > 0) {
    return { ok: false, error: "Bu e-posta zaten kayıtlı." };
  }

  const passwordHash = await hash(input.password, 10);
  const [inserted] = await db
    .insert(users)
    .values({ email, passwordHash, name: teamName })
    .returning();

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
      const fresh = await createStarterLeague({
        userId: inserted.id,
        teamName,
      });
      resultInviteCode = fresh.inviteCode;
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
      password: input.password,
      redirect: false,
    });
  } catch {
    // Registration succeeded; if auto-sign-in fails the user can log in.
  }

  return { ok: true, userId: inserted.id, inviteCode: resultInviteCode, joinedExisting };
}
