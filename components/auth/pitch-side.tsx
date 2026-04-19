import { LogoLockup } from "@/components/brand/logo";

export function PitchPatternSide() {
  return (
    <div
      style={{
        position: "relative",
        height: "100%",
        minHeight: 420,
        background: `
          radial-gradient(700px 500px at 80% 30%, color-mix(in oklab, var(--indigo) 22%, transparent), transparent 60%),
          radial-gradient(600px 400px at 20% 80%, color-mix(in oklab, var(--emerald) 18%, transparent), transparent 60%),
          var(--bg-2)`,
        overflow: "hidden",
        borderRadius: 18,
        border: "1px solid var(--border)",
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 600 600"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: "absolute", inset: 0, opacity: 0.35 }}
      >
        <g stroke="rgba(255,255,255,0.28)" strokeWidth="1" fill="none">
          <rect x="40" y="60" width="520" height="480" />
          <line x1="300" y1="60" x2="300" y2="540" />
          <circle cx="300" cy="300" r="74" />
          <rect x="40" y="200" width="120" height="200" />
          <rect x="440" y="200" width="120" height="200" />
        </g>
        <circle
          cx="300"
          cy="300"
          r="6"
          fill="#fff"
          style={{ animation: "floatBall 6s var(--ease) infinite" }}
        />
      </svg>
      <style>{`@keyframes floatBall { 0%,100% { transform: translate(0,0); } 50% { transform: translate(80px, -40px); } }`}</style>
      <div style={{ position: "absolute", top: 28, left: 28 }}>
        <LogoLockup size={22} />
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 28,
          left: 28,
          right: 28,
          color: "var(--text-2)",
        }}
      >
        <div className="t-h2">Futbol yönetimine yeni bir başlangıç.</div>
        <div
          className="t-small"
          style={{ marginTop: 8, color: "var(--muted)" }}
        >
          16 kişilik özel ligini kur, her akşam 21:00&apos;de maç oyna.
        </div>
      </div>
    </div>
  );
}
