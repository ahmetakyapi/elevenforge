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
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
