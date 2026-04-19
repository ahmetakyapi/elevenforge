import { NextResponse } from "next/server";
import { auth } from "@/auth";

const PROTECTED = [
  "/dashboard",
  "/squad",
  "/transfer",
  "/tactic",
  "/match",
  "/newspaper",
  "/crew",
  "/lobby",
];

export default auth((req) => {
  const path = req.nextUrl.pathname;
  const isProtected = PROTECTED.some(
    (p) => path === p || path.startsWith(`${p}/`),
  );
  const isAuthed = !!req.auth;

  if (isProtected && !isAuthed) {
    const url = new URL("/login", req.url);
    url.searchParams.set("from", path);
    return NextResponse.redirect(url);
  }
  // Redirect authed users away from auth pages
  if ((path === "/login" || path === "/register") && isAuthed) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next|favicon.ico|.*\\..*).*)"],
};
