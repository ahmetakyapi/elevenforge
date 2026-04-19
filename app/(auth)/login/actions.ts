"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

type LoginResult =
  | { ok: true; userName: string }
  | { ok: false; error: string };

export async function login(input: {
  email: string;
  password: string;
}): Promise<LoginResult> {
  const email = input.email.trim().toLowerCase();
  if (!/.+@.+\..+/.test(email)) {
    return { ok: false, error: "Geçersiz e-posta adresi." };
  }
  if (input.password.length < 6) {
    return { ok: false, error: "Şifre en az 6 karakter olmalı." };
  }
  try {
    await signIn("credentials", {
      email,
      password: input.password,
      redirect: false,
    });
    return { ok: true, userName: email.split("@")[0] };
  } catch (err) {
    if (err instanceof AuthError) {
      return {
        ok: false,
        error:
          err.type === "CredentialsSignin"
            ? "E-posta veya şifre hatalı."
            : "Giriş başarısız.",
      };
    }
    throw err;
  }
}
