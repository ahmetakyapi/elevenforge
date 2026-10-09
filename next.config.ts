import type { NextConfig } from "next";

/**
 * Security headers.
 *
 * The app had none. These are the low-cost ones that do not risk breaking a
 * working page: they stop the site being framed (clickjacking), stop MIME
 * sniffing, and keep the full URL — which contains league and player ids —
 * out of the Referer header sent to third parties.
 *
 * A full Content-Security-Policy is deliberately NOT set here: Next injects
 * inline bootstrap scripts, so a CSP needs per-request nonces wired through
 * the middleware to avoid breaking hydration. Worth doing, but it needs
 * testing rather than a blind header.
 */
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  /**
   * Pin the workspace root.
   *
   * There is a stray `package-lock.json` in the home directory, so Next
   * inferred `/Users/ahmet` as the project root and printed a warning nobody
   * read. It is not cosmetic: the inferred root is what the dev server
   * watches, and watching a directory several levels above the project makes
   * file change detection unreliable. It is the best explanation for the
   * thing that cost four debugging cycles in this project — edits to
   * app/globals.css not taking effect until `.next` was deleted by hand,
   * repeatedly, while the file on disk was already correct.
   */
  turbopack: {
    root: __dirname,
  },

  /**
   * Leave PGlite to Node.
   *
   * PGlite is the local-development database (lib/db.ts picks it whenever
   * DATABASE_URL is not a Postgres URL). It loads its Postgres WASM build by
   * resolving a file next to its own module with `new URL(..., import.meta.url)`
   * and handing that to `fs`. Bundled by Turbopack, that URL is constructed in
   * a different module realm from the one Node's `fs` checks against, and
   * Node 24 rejects it:
   *
   *   TypeError: The "path" argument must be of type string or an instance of
   *   Buffer or URL. Received an instance of URL
   *
   * The message reads like a contradiction because it is a realm mismatch, not
   * a type error. Every server-side query then failed — including the one that
   * looks up a user to log in, so `npm run dev` could not get past the login
   * screen. The same package works perfectly under `tsx` (which is why the
   * whole test suite passes), and the only difference is that tsx does not
   * bundle it.
   *
   * Marking it external makes the dev server load it the way tsx does. It has
   * no effect on production, where DATABASE_URL is a Neon URL and PGlite is
   * never constructed.
   */
  serverExternalPackages: ["@electric-sql/pglite"],

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
