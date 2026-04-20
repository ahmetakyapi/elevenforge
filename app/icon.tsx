import { ImageResponse } from "next/og";

/**
 * App-wide favicon — 32×32 PNG generated at build-time by ImageResponse.
 * Shares the brand's indigo→emerald gradient and the LogoMonogram
 * "11" mark from components/brand/logo.tsx so the tab icon, Apple
 * touch icon, and in-app logo all read as one system.
 *
 * Next.js picks this file up automatically as the root favicon; no
 * manifest or <link> wiring needed.
 */
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #6366f1 0%, #10b981 100%)",
          borderRadius: 6,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 3,
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: 5,
              height: 20,
              background: "#ffffff",
              borderRadius: 1,
            }}
          />
          <div
            style={{
              width: 5,
              height: 20,
              background: "#ffffff",
              borderRadius: 1,
            }}
          />
        </div>
      </div>
    ),
    { ...size },
  );
}
