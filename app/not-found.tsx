import Link from "next/link";

/*
 * 404 as a missed shot: the ball arcs toward the goal mouth and sails over
 * the bar, the scoreboard reads 4 · 0 · 4. CSS-only so it renders even when
 * the client bundle for the route never loads.
 */
export default function NotFound() {
  return (
    <main className="nf" data-cursor-zone>
      <div className="app-bg" aria-hidden />
      <div className="nf-inner">
        <p className="nf-kicker">Hata · Ofsayt</p>
        <h1 className="t-stadium nf-score" aria-label="404">
          <span>4</span>
          <span className="nf-zero">
            0
            <span className="nf-ball" aria-hidden />
          </span>
          <span>4</span>
        </h1>
        <h2 className="nf-title">
          Top auta çıktı. <span className="t-serif">Bu sayfa yok.</span>
        </h2>
        <p className="nf-copy">Aradığın sayfa taşınmış ya da hiç var olmamış olabilir.</p>
        <div className="nf-ctas">
          <Link href="/dashboard" className="btn btn-primary btn-lg" style={{ textDecoration: "none" }}>
            Kulübüne Dön
          </Link>
          <Link href="/" className="btn btn-lg" style={{ textDecoration: "none" }}>
            Ana sayfa
          </Link>
        </div>
      </div>
      <style>{`
        .nf { position: relative; min-height: 100vh; display: grid; place-items: center; padding: 40px 24px; text-align: center; overflow: hidden; }
        .nf-inner { position: relative; z-index: 1; }
        .nf-kicker { font: 600 12px/1 var(--font-jetbrains), monospace; letter-spacing: .2em; text-transform: uppercase; color: var(--danger); margin: 0 0 12px; animation: block-rise 800ms var(--ease-expo) backwards; }
        .nf-score { margin: 0; display: flex; justify-content: center; gap: .04em; font-size: clamp(140px, 30vw, 380px); line-height: .8; font-weight: 900; }
        .nf-score > span { display: inline-block; animation: nf-drop 1100ms var(--ease-expo) backwards; }
        .nf-score > span:nth-child(2) { animation-delay: 90ms; }
        .nf-score > span:nth-child(3) { animation-delay: 180ms; }
        .nf-zero { position: relative; background: linear-gradient(135deg, var(--accent), var(--accent-2)); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .nf-ball { position: absolute; left: 50%; top: 50%; width: .16em; height: .16em; margin: -.08em; border-radius: 50%;
          background: radial-gradient(circle at 35% 30%, #fff, #cbd5e1 60%, #64748b); box-shadow: 0 0 24px rgba(255,255,255,.4);
          animation: nf-shot 2.8s cubic-bezier(.3,.1,.3,1) 1s infinite; }
        @keyframes nf-drop { from { transform: translateY(-40%) rotate(-8deg); opacity: 0; filter: blur(10px); } to { transform: none; opacity: 1; filter: none; } }
        @keyframes nf-shot {
          0% { transform: translate(0,0) scale(1); opacity: 0; }
          10% { opacity: 1; }
          55% { transform: translate(1.2em, -1.1em) scale(.7) rotate(360deg); opacity: 1; }
          70% { transform: translate(1.6em, -1.2em) scale(.6) rotate(500deg); opacity: 0; }
          100% { opacity: 0; }
        }
        .nf-title { font-size: clamp(22px, 3vw, 32px); font-weight: 700; letter-spacing: -.02em; margin: 26px 0 8px; animation: block-rise 900ms var(--ease-expo) 300ms backwards; }
        .nf-title .t-serif { color: var(--accent); font-size: 1.1em; }
        .nf-copy { color: var(--muted); margin: 0 0 26px; animation: block-rise 900ms var(--ease-expo) 380ms backwards; }
        .nf-ctas { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; animation: block-rise 900ms var(--ease-expo) 460ms backwards; }
        @media (prefers-reduced-motion: reduce) { .nf-ball { display: none; } }
      `}</style>
    </main>
  );
}
