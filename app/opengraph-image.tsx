import { ImageResponse } from "next/og";

/**
 * Open Graph card — 1200×630, used by Twitter, WhatsApp, Slack, etc.
 * when the site URL is shared. Shows the ElevenForge lockup plus the
 * tagline + a subtle pitch-line motif so the preview reads as a
 * football-menajer product, not a generic SaaS card.
 */
export const alt = "ElevenForge — 16 arkadaş. 1 lig. 1 efsane.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background:
            "radial-gradient(900px 500px at 20% 10%, rgba(99,102,241,0.22), transparent 60%), radial-gradient(700px 500px at 100% 100%, rgba(16,185,129,0.18), transparent 60%), #04070d",
        }}
      >
        {/* Pitch line top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            display: "flex",
            background:
              "linear-gradient(90deg, #6366f1 0%, #10b981 50%, #22d3ee 100%)",
          }}
        />

        {/* Top row: brand mark */}
        <div
          style={{ display: "flex", alignItems: "center", gap: 22 }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background:
                "linear-gradient(135deg, #6366f1 0%, #10b981 100%)",
              borderRadius: 18,
            }}
          >
            <div style={{ display: "flex", gap: 8 }}>
              <div
                style={{
                  width: 10,
                  height: 42,
                  background: "#ffffff",
                  borderRadius: 2,
                }}
              />
              <div
                style={{
                  width: 10,
                  height: 42,
                  background: "#ffffff",
                  borderRadius: 2,
                }}
              />
            </div>
          </div>
          <div
            style={{
              fontFamily: "sans-serif",
              fontSize: 44,
              fontWeight: 800,
              letterSpacing: "-0.035em",
              color: "#f4f5f7",
              display: "flex",
              gap: 2,
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

        {/* Middle: headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 22,
          }}
        >
          <div
            style={{
              fontFamily: "sans-serif",
              fontSize: 108,
              fontWeight: 800,
              letterSpacing: "-0.045em",
              color: "#f4f5f7",
              lineHeight: 1.02,
              display: "flex",
            }}
          >
            16 arkadaş.
          </div>
          <div
            style={{
              fontFamily: "sans-serif",
              fontSize: 108,
              fontWeight: 800,
              letterSpacing: "-0.045em",
              lineHeight: 1.02,
              display: "flex",
              background: "linear-gradient(90deg, #818cf8, #10b981, #22d3ee)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            1 lig. 1 efsane.
          </div>
        </div>

        {/* Bottom row: tagline + features */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: 40,
          }}
        >
          <div
            style={{
              fontFamily: "sans-serif",
              fontSize: 26,
              color: "#8b92a5",
              maxWidth: 720,
              lineHeight: 1.4,
              display: "flex",
            }}
          >
            Davet kodu ile kur · her gece 21:00 maç · canlı Türkçe anlatım ·
            transfer pazarı
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 8,
            }}
          >
            <div
              style={{
                fontFamily: "sans-serif",
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: "0.18em",
                color: "#10b981",
                display: "flex",
              }}
            >
              SÜPER LİG · 2025-26
            </div>
            <div
              style={{
                fontFamily: "sans-serif",
                fontSize: 18,
                color: "#c7ccd8",
                display: "flex",
              }}
            >
              elevenforge.com
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
