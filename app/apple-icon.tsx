import { ImageResponse } from "next/og";

/**
 * Apple touch icon — 180×180. Used when a user adds the site to their
 * iOS home screen. iOS doesn't round the corners itself, so we render
 * a solid dark-indigo square with a little emerald halo + "11" wordmark
 * underneath so the launcher tile reads at a glance.
 */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          background:
            "linear-gradient(145deg, #0b1028 0%, #0a0d1c 60%, #041b10 100%)",
        }}
      >
        {/* Radial glow behind the mark */}
        <div
          style={{
            position: "absolute",
            top: 20,
            left: 20,
            right: 20,
            bottom: 20,
            display: "flex",
            borderRadius: 999,
            background:
              "radial-gradient(closest-side, rgba(99,102,241,0.5), transparent 70%)",
          }}
        />
        {/* "11" monogram */}
        <div
          style={{
            display: "flex",
            gap: 14,
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <div
            style={{
              width: 22,
              height: 84,
              background:
                "linear-gradient(180deg, #a5b4fc 0%, #6366f1 60%, #10b981 100%)",
              borderRadius: 4,
            }}
          />
          <div
            style={{
              width: 22,
              height: 84,
              background:
                "linear-gradient(180deg, #a5b4fc 0%, #6366f1 60%, #10b981 100%)",
              borderRadius: 4,
            }}
          />
        </div>
        {/* Wordmark */}
        <div
          style={{
            fontFamily: "sans-serif",
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: "-0.04em",
            color: "#f4f5f7",
            display: "flex",
            gap: 0,
          }}
        >
          <span>Eleven</span>
          <span
            style={{
              background: "linear-gradient(90deg, #818cf8, #10b981)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Forge
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
