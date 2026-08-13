import { NextResponse } from "next/server";
import { auth } from "@/auth";

/**
 * Routes reachable without a session. Everything else requires one.
 *
 * This used to be the other way round — an allowlist of protected paths —
 * which left /cup, /standings, /stats, /profile, /free-agents,
 * /league-settings and /player/[id] off the list entirely. Those pages call
 * requireLeagueContext() and so still redirect, but only after the server
 * component has run and queried the database. Defaulting to "protected"
 * means a route added tomorrow is covered without anyone remembering to
 * update this file.
 */
const PUBLIC_PATHS = ["/", "/login", "/register"];

const PUBLIC_PREFIXES = ["/api/auth", "/_next", "/icon", "/apple-icon", "/opengraph-image"];

export default auth((req) => {
  const path = req.nextUrl.pathname;
  const isAuthed = !!req.auth;

  const isPublic =
    PUBLIC_PATHS.includes(path) ||
    PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));

  if (!isPublic && !isAuthed) {
    const url = new URL("/login", req.url);
    url.searchParams.set("from", path);
    return NextResponse.redirect(url);
  }
  // Redirect authed users away from the auth pages.
  if ((path === "/login" || path === "/register") && isAuthed) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next|favicon.ico|.*\\..*).*)"],
};
