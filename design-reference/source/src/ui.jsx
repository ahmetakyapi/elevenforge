// ElevenForge shared UI primitives (React, global scope)

// ─── Utility formatting ─────────────────────────────────────
const fmtEUR = (n) => {
  if (n >= 1_000_000_000) return `€${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) {
    const v = n / 1_000_000;
    return `€${v >= 10 ? Math.round(v) : v.toFixed(1)}M`;
  }
  if (n >= 1_000) return `€${Math.round(n / 1_000)}K`;
  return `€${n}`;
};
const fmtWage = (n) => `€${Math.round(n/1000)}K/hf`;
const tierColor = (ovr) => {
  if (ovr >= 85) return 'var(--gold)';
  if (ovr >= 80) return 'var(--indigo)';
  if (ovr >= 75) return 'var(--cyan)';
  if (ovr >= 70) return 'var(--emerald)';
  return 'var(--muted)';
};
const posColor = (pos) => ({ GK: '#facc15', DEF: '#3b82f6', MID: '#10b981', FWD: '#ef4444' }[pos] || 'var(--muted)');

// ─── Club Crest (monogram) ──────────────────────────────────
function Crest({ clubId, size = 28, ring = false }) {
  const c = clubById(clubId);
  if (!c) return null;
  const s = size;
  return (
    <div style={{
      width: s, height: s, flexShrink: 0,
      borderRadius: '50%',
      background: `linear-gradient(135deg, ${c.color} 0%, ${c.color2} 120%)`,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-display)', fontWeight: 800,
      fontSize: s * 0.38,
      color: '#fff', letterSpacing: '-0.03em',
      boxShadow: ring ? '0 0 0 2px var(--bg), 0 0 0 3px var(--border-strong)' : `0 2px 6px ${c.color}44`,
      textShadow: '0 1px 2px rgba(0,0,0,0.3)',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{position:'absolute',inset:0,background:'linear-gradient(180deg,rgba(255,255,255,0.2),transparent 50%)'}} />
      <span style={{position:'relative', zIndex:1}}>{c.short.slice(0,2)}</span>
    </div>
  );
}

// ─── Position Badge ─────────────────────────────────────────
function PosBadge({ pos, size = 28, showLabel = false }) {
  const label = pos === 'DEF' ? 'DEF' : pos === 'MID' ? 'MID' : pos === 'FWD' ? 'FWD' : 'GK';
  const color = posColor(pos);
  if (showLabel) {
    return (
      <span style={{
        display:'inline-flex', alignItems:'center', gap:6, padding:'4px 10px 4px 4px', borderRadius: 999,
        background: `linear-gradient(135deg, color-mix(in oklab, ${color} 30%, transparent), color-mix(in oklab, ${color} 10%, transparent))`,
        border: `1px solid color-mix(in oklab, ${color} 45%, var(--border))`,
      }}>
        <span style={{
          width: 22, height: 22, borderRadius: '50%',
          background: color, color: '#fff',
          fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 10,
          display:'inline-flex', alignItems:'center', justifyContent:'center',
          boxShadow: `0 0 0 2px color-mix(in oklab, ${color} 25%, transparent)`,
        }}>{label[0]}</span>
        <span style={{fontFamily:'var(--font-mono)', fontWeight:700, fontSize:11, color, letterSpacing:'0.08em'}}>{label}</span>
      </span>
    );
  }
  return (
    <span style={{
      width: size, height: size, borderRadius: 8,
      background: `linear-gradient(135deg, ${color} 0%, color-mix(in oklab, ${color} 40%, var(--bg-2)) 100%)`,
      border: `1px solid color-mix(in oklab, ${color} 60%, transparent)`,
      color: '#fff',
      fontFamily: 'var(--font-mono)', fontWeight: 800,
      fontSize: size * 0.38, letterSpacing: '0.02em',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: `0 2px 8px -2px color-mix(in oklab, ${color} 60%, transparent), inset 0 1px 0 rgba(255,255,255,0.2)`,
      textShadow: '0 1px 2px rgba(0,0,0,0.3)',
    }}>{label}</span>
  );
}

// ─── AgePill — yaş + evre rozeti ─────────────────────────────
function AgePill({ age, size = 'md' }) {
  const stage = age <= 21 ? { l: 'GENÇ',    c: 'var(--emerald)' }
              : age <= 25 ? { l: 'YÜKSELİŞ', c: 'var(--cyan)' }
              : age <= 29 ? { l: 'ZİRVE',   c: 'var(--accent)' }
              : age <= 32 ? { l: 'TECRÜBE', c: 'var(--gold)' }
                          : { l: 'VETERAN', c: 'var(--warn)' };
  const fs = size === 'sm' ? 11 : 13;
  const lfs = size === 'sm' ? 8 : 9;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:6, padding:'3px 9px 3px 6px', borderRadius: 7,
      background: `color-mix(in oklab, ${stage.c} 10%, var(--panel-2))`,
      border: `1px solid color-mix(in oklab, ${stage.c} 32%, var(--border))`,
    }}>
      <span style={{fontFamily:'var(--font-mono)', fontSize: fs, fontWeight:700, color:'var(--text)', letterSpacing:'-0.02em', lineHeight:1}}>{age}</span>
      <span style={{width:1, height:10, background:'var(--border-strong)'}}/>
      <span style={{fontFamily:'var(--font-mono)', fontSize: lfs, fontWeight:700, color: stage.c, letterSpacing:'0.08em', lineHeight:1}}>{stage.l}</span>
    </span>
  );
}

// ─── OvrChip — belirgin, iki satırlı rozet ──────────────────
function OvrChip({ ovr, size = 'md' }) {
  const color = tierColor(ovr);
  const tier = ovr >= 85 ? 'ELİT' : ovr >= 80 ? 'A+' : ovr >= 75 ? 'A' : ovr >= 70 ? 'B' : 'C';
  const dims = size === 'sm'
    ? { w: 38, h: 38, fs: 18, lfs: 8, r: 8, gap: 0 }
    : size === 'lg'
    ? { w: 64, h: 64, fs: 32, lfs: 10, r: 12, gap: 1 }
    : { w: 48, h: 48, fs: 22, lfs: 9, r: 10, gap: 1 };
  return (
    <div style={{
      width: dims.w, height: dims.h, borderRadius: dims.r,
      background: `linear-gradient(145deg, color-mix(in oklab, ${color} 28%, var(--panel)) 0%, color-mix(in oklab, ${color} 12%, var(--bg-2)) 100%)`,
      border: `1.5px solid color-mix(in oklab, ${color} 55%, var(--border))`,
      boxShadow: `0 4px 14px -4px color-mix(in oklab, ${color} 40%, transparent), inset 0 1px 0 color-mix(in oklab, ${color} 30%, transparent)`,
      display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: dims.gap,
      flexShrink: 0, position: 'relative', overflow: 'hidden',
    }}>
      <span style={{
        fontFamily: 'var(--font-display)', fontWeight: 800,
        fontSize: dims.fs, color, letterSpacing: '-0.04em', lineHeight: 1,
        textShadow: `0 1px 8px color-mix(in oklab, ${color} 30%, transparent)`,
      }}>{ovr}</span>
      {size !== 'sm' && (
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: dims.lfs, fontWeight: 700,
          color: `color-mix(in oklab, ${color} 75%, var(--muted))`,
          letterSpacing: '0.1em', lineHeight: 1,
        }}>{tier}</span>
      )}
    </div>
  );
}

// ─── User Avatar (initials) ─────────────────────────────────
function UserAvatar({ name, size = 24 }) {
  const initials = (name || '?').split(/\s+/).map(s => s[0]).slice(0,2).join('').toUpperCase();
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `oklch(0.5 0.08 ${hue})`,
      color: '#fff', fontWeight: 600, fontSize: size * 0.4,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
      fontFamily: 'var(--font-display)',
    }}>{initials}</div>
  );
}

// ─── GlassCard (wrapper) ────────────────────────────────────
function GlassCard({ children, style, className = '', onClick, hover = true, pad = 16 }) {
  return (
    <div
      className={`glass ${hover ? 'glass-hover' : ''} ${className}`}
      onClick={onClick}
      style={{ padding: pad, cursor: onClick ? 'pointer' : 'default', ...style }}
    >{children}</div>
  );
}

// ─── StatChip (icon + value + label) ────────────────────────
function StatChip({ label, value, icon, accent }) {
  return (
    <div className="glass" style={{padding:'10px 14px', display:'flex', alignItems:'center', gap:10}}>
      {icon && <span style={{fontSize:16, opacity:0.9}}>{icon}</span>}
      <div style={{display:'flex', flexDirection:'column', gap:1}}>
        <span className="t-mono" style={{fontSize:15, fontWeight:600, color: accent || 'var(--text)', lineHeight:1}}>{value}</span>
        <span className="t-label" style={{fontSize:10, lineHeight:1}}>{label}</span>
      </div>
    </div>
  );
}

// ─── Countdown Timer ────────────────────────────────────────
function useCountdown(targetSeconds) {
  const [s, setS] = React.useState(targetSeconds);
  React.useEffect(() => {
    const i = setInterval(() => setS(p => Math.max(0, p - 1)), 1000);
    return () => clearInterval(i);
  }, []);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad = (x) => String(x).padStart(2, '0');
  return { d, h, m, s: ss, str: `${pad(d)}:${pad(h)}:${pad(m)}:${pad(ss)}`, total: s };
}
function Countdown({ seconds = 14 * 3600 + 23 * 60 + 7, size = 48, labels = true }) {
  const { d, h, m, s, total } = useCountdown(seconds);
  const pad = (x) => String(x).padStart(2, '0');
  const urgent = total < 3600;
  const fs = size;
  const color = urgent ? 'var(--warn)' : 'var(--text)';
  const parts = [
    { v: pad(d), l: 'GÜN' },
    { v: pad(h), l: 'SAAT' },
    { v: pad(m), l: 'DK' },
    { v: pad(s), l: 'SN' },
  ];
  return (
    <div style={{display:'flex', alignItems:'flex-end', gap:10, animation: urgent ? 'pulse-accent 1.5s ease-in-out infinite' : 'none'}}>
      {parts.map((p,i) => (
        <React.Fragment key={i}>
          <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:4}}>
            <span className="t-mono" style={{fontSize:fs, fontWeight:600, color, lineHeight:0.9, letterSpacing:'-0.02em'}}>{p.v}</span>
            {labels && <span className="t-label" style={{fontSize:10}}>{p.l}</span>}
          </div>
          {i < parts.length - 1 && <span className="t-mono" style={{fontSize:fs*0.7, color:'var(--muted-2)', lineHeight:0.9, paddingBottom: labels ? 14 : 0}}>:</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Currency ────────────────────────────────────────────────
function Currency({ value, size = 14, color }) {
  return (
    <span className="t-mono" style={{fontSize: size, fontWeight: 600, color: color || 'var(--text)', letterSpacing: 0}}>
      {fmtEUR(value)}
    </span>
  );
}

// ─── Bar (progress) ──────────────────────────────────────────
function Bar({ value, max = 100, color, height = 4, showValue = false }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div style={{display:'flex', alignItems:'center', gap:8, flex: 1}}>
      <div style={{flex:1, height, borderRadius:999, background:'var(--border)', overflow:'hidden'}}>
        <div style={{width:`${pct}%`, height:'100%', background: color || 'var(--accent)', borderRadius:999, transition:'width 400ms var(--ease)'}} />
      </div>
      {showValue && <span className="t-mono" style={{fontSize:11, color:'var(--muted)', minWidth: 24, textAlign:'right'}}>{Math.round(pct)}</span>}
    </div>
  );
}

// ─── Form dot ────────────────────────────────────────────────
function FormDot({ result }) {
  const map = { W: { bg: 'var(--emerald)', t: 'G' }, D: { bg: 'var(--warn)', t: 'B' }, L: { bg: 'var(--danger)', t: 'M' } };
  const m = map[result] || { bg: 'var(--muted)', t: '-' };
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', justifyContent:'center',
      width:18, height:18, borderRadius:4,
      background: `color-mix(in oklab, ${m.bg} 18%, transparent)`,
      color: m.bg, border: `1px solid color-mix(in oklab, ${m.bg} 40%, transparent)`,
      fontFamily:'var(--font-mono)', fontWeight:600, fontSize:10, letterSpacing:0
    }}>{m.t}</span>
  );
}

// ─── Rating dot (0-10) ──────────────────────────────────────
function RatingDot({ rating, size = 28 }) {
  const color = rating >= 8 ? 'var(--gold)' : rating >= 7 ? 'var(--emerald)' : rating >= 6 ? 'var(--cyan)' : 'var(--muted)';
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', justifyContent:'center',
      width:size, height:size, borderRadius:'50%',
      background: `color-mix(in oklab, ${color} 15%, transparent)`,
      border: `1px solid color-mix(in oklab, ${color} 40%, transparent)`,
      color,
      fontFamily:'var(--font-mono)', fontWeight:600, fontSize: size * 0.38,
    }}>{rating.toFixed(1)}</span>
  );
}

// ─── Section heading ─────────────────────────────────────────
function SectionHead({ label, title, right }) {
  return (
    <div style={{display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom: 16, gap: 12}}>
      <div style={{display:'flex', flexDirection:'column', gap:4}}>
        {label && <span className="t-label">{label}</span>}
        {title && <span className="t-h2">{title}</span>}
      </div>
      {right}
    </div>
  );
}

// ─── Toast system ────────────────────────────────────────────
const ToastCtx = React.createContext(null);
function ToastProvider({ children }) {
  const [toasts, setToasts] = React.useState([]);
  const push = React.useCallback((t) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(p => [...p, { id, ...t }]);
    setTimeout(() => setToasts(p => p.filter(x => x.id !== id)), t.duration || 4000);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div style={{
        position:'fixed', bottom:20, right:20, zIndex:9999,
        display:'flex', flexDirection:'column-reverse', gap:10, pointerEvents:'none',
        maxWidth: 360,
      }}>
        {toasts.map(t => (
          <div key={t.id} className="glass anim-slide-in-right" style={{
            padding: '12px 16px', borderRadius: 12, pointerEvents:'auto',
            display:'flex', gap:10, alignItems:'flex-start', minWidth: 280,
            background: 'color-mix(in oklab, var(--bg) 90%, var(--panel) 10%)',
            borderColor: t.accent ? `color-mix(in oklab, ${t.accent} 40%, var(--border))` : 'var(--border)',
            boxShadow: 'var(--shadow-lg)',
          }}>
            {t.icon && <span style={{fontSize:18, lineHeight:1.2}}>{t.icon}</span>}
            <div style={{display:'flex', flexDirection:'column', gap:2, flex:1}}>
              {t.title && <span className="t-h3" style={{fontSize:14}}>{t.title}</span>}
              {t.body && <span className="t-small">{t.body}</span>}
            </div>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
const useToast = () => React.useContext(ToastCtx);

// ─── Icons (inline svg, crisp) ──────────────────────────────
const Icon = ({ name, size = 16, stroke = 1.6 }) => {
  const s = size;
  const common = { width: s, height: s, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'bell': return <svg {...common}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>;
    case 'search': return <svg {...common}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>;
    case 'home': return <svg {...common}><path d="M3 10 12 3l9 7"/><path d="M5 9v11h14V9"/></svg>;
    case 'users': return <svg {...common}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
    case 'swap': return <svg {...common}><path d="M7 7h13l-3-3"/><path d="M17 17H4l3 3"/></svg>;
    case 'compass': return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="m15 9-4 2-2 4 4-2 2-4z"/></svg>;
    case 'play': return <svg {...common}><path d="M6 4v16l14-8L6 4z"/></svg>;
    case 'more': return <svg {...common}><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>;
    case 'plus': return <svg {...common}><path d="M12 5v14M5 12h14"/></svg>;
    case 'close': return <svg {...common}><path d="M18 6 6 18M6 6l12 12"/></svg>;
    case 'chev-right': return <svg {...common}><path d="m9 6 6 6-6 6"/></svg>;
    case 'chev-left': return <svg {...common}><path d="m15 6-6 6 6 6"/></svg>;
    case 'chev-down': return <svg {...common}><path d="m6 9 6 6 6-6"/></svg>;
    case 'arrow-right': return <svg {...common}><path d="M5 12h14M13 5l7 7-7 7"/></svg>;
    case 'spark': return <svg {...common}><path d="M12 3v5M12 16v5M3 12h5M16 12h5M5.6 5.6l3.5 3.5M14.9 14.9l3.5 3.5M5.6 18.4l3.5-3.5M14.9 9.1l3.5-3.5"/></svg>;
    case 'link': return <svg {...common}><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>;
    case 'check': return <svg {...common}><path d="M20 6 9 17l-5-5"/></svg>;
    case 'sun': return <svg {...common}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>;
    case 'moon': return <svg {...common}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>;
    case 'settings': return <svg {...common}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>;
    case 'paper': return <svg {...common}><path d="M4 4h12l4 4v12H4V4z"/><path d="M14 4v6h6"/><path d="M8 14h8M8 17h5"/></svg>;
    case 'trophy': return <svg {...common}><path d="M6 4h12v3a6 6 0 0 1-12 0V4z"/><path d="M6 4H3v3a3 3 0 0 0 3 3"/><path d="M18 4h3v3a3 3 0 0 1-3 3"/><path d="M10 17h4v4h-4z"/></svg>;
    case 'flag': return <svg {...common}><path d="M4 21V4"/><path d="M4 4h12l-2 3 2 3H4"/></svg>;
    case 'chat': return <svg {...common}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
    case 'dot': return <svg {...common}><circle cx="12" cy="12" r="4" fill="currentColor"/></svg>;
    case 'coin': return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M9 9h4a2 2 0 0 1 0 4H9M9 12h5a2 2 0 0 1 0 4H9M9 9v7"/></svg>;
    case 'target': return <svg {...common}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>;
    case 'clock': return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
    case 'anvil': return <svg {...common}><path d="M4 10h14a2 2 0 0 1 2 2v1h-6l-2 2H5v-3a2 2 0 0 1-1-2z"/><path d="M9 15v3h6v-3"/><path d="M7 18h10v2H7z"/></svg>;
    case 'grid': return <svg {...common}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>;
    case 'list': return <svg {...common}><path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="0.8" fill="currentColor"/><circle cx="3.5" cy="12" r="0.8" fill="currentColor"/><circle cx="3.5" cy="18" r="0.8" fill="currentColor"/></svg>;
    case 'calendar': return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>;
    case 'alert': return <svg {...common}><path d="M12 3 2 20h20L12 3z"/><path d="M12 10v4M12 17v.5"/></svg>;
    case 'star': return <svg {...common}><path d="m12 3 2.8 6.3 6.9.6-5.2 4.6 1.6 6.8L12 17.8 5.9 21.3l1.6-6.8L2.3 9.9l6.9-.6L12 3z"/></svg>;
    default: return <svg {...common}><circle cx="12" cy="12" r="4"/></svg>;
  }
};

// ─── Field (label + input wrapper) ───────────────────────────
function Field({ label, children, hint }) {
  return (
    <label style={{display:'flex', flexDirection:'column', gap:6}}>
      <span className="t-label">{label}</span>
      {children}
      {hint && <span className="t-caption" style={{fontSize:11}}>{hint}</span>}
    </label>
  );
}

Object.assign(window, {
  fmtEUR, fmtWage, tierColor, posColor,
  Crest, PosBadge, AgePill, OvrChip, UserAvatar, GlassCard, StatChip,
  Countdown, useCountdown, Currency, Bar, FormDot, RatingDot,
  SectionHead, ToastProvider, useToast, Icon, Field,
});
