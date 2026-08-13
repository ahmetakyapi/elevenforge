"use server";

import { signOut } from "@/auth";

/**
 * Sign out.
 *
 * The app shipped with no way to log out at all: `signOut` was exported from
 * auth.ts and never called from any component. On a shared machine there was
 * no way to hand the game to someone else, and no way to switch accounts
 * without clearing cookies by hand.
 */
export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}
