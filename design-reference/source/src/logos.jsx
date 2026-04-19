// Logo marks for ElevenForge — 4 directions exposed as React components.
// Each uses indigo→emerald gradient accent. No real football imagery.

const LogoDefs = ({ id = 'ef' }) => (
  <defs>
    <linearGradient id={`${id}-grad`} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#6366f1"/>
      <stop offset="100%" stopColor="#10b981"/>
    </linearGradient>
    <linearGradient id={`${id}-grad-v`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#818cf8"/>
      <stop offset="100%" stopColor="#10b981"/>
    </linearGradient>
  </defs>
);

// Direction A — Anvil + "11" integrated. Two vertical bars rise from an anvil.
function LogoAnvil({ size = 64, mono, color = '#fff' }) {
  const fill = mono ? color : `url(#efa-grad)`;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <LogoDefs id="efa"/>
      {/* Anvil base */}
      <path d="M8 44 L56 44 L50 52 L14 52 Z" fill={fill}/>
      <rect x="24" y="52" width="16" height="4" fill={fill} opacity="0.7"/>
      {/* Anvil body */}
      <path d="M10 36 L54 36 L50 44 L14 44 Z" fill={fill} opacity="0.85"/>
      {/* Horn */}
      <path d="M54 36 L62 36 L62 40 L56 44 Z" fill={fill} opacity="0.85"/>
      {/* "11" vertical bars rising from anvil */}
      <rect x="22" y="8" width="6" height="28" rx="1" fill={fill}/>
      <rect x="36" y="8" width="6" height="28" rx="1" fill={fill}/>
      {/* Spark / forge notches */}
      <circle cx="18" cy="14" r="1.6" fill={fill} opacity="0.6"/>
      <circle cx="48" cy="18" r="1.2" fill={fill} opacity="0.5"/>
      <circle cx="52" cy="10" r="0.9" fill={fill} opacity="0.4"/>
    </svg>
  );
}

// Direction B — Hammer + ball. Diagonal hammer with circle embedded in head.
function LogoHammer({ size = 64, mono, color = '#fff' }) {
  const fill = mono ? color : `url(#efh-grad)`;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <LogoDefs id="efh"/>
      {/* Handle */}
      <rect x="14" y="44" width="32" height="6" rx="1.5" transform="rotate(-40 30 47)" fill={fill} opacity="0.8"/>
      {/* Hammer head */}
      <path d="M30 8 L58 8 L58 26 L30 26 Z" fill={fill} transform="rotate(-40 44 17)"/>
      {/* Ball hole (pentagon-ish) cut in head */}
      <circle cx="41" cy="19" r="6" fill="#04070d"/>
      <polygon points="41,14 45,17 44,22 38,22 37,17" fill={fill}/>
    </svg>
  );
}

// Direction C — Abstract "11" monogram with spark accent (cleanest, type-led)
function LogoMonogram({ size = 64, mono, color = '#fff' }) {
  const fill = mono ? color : `url(#efm-grad-v)`;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <LogoDefs id="efm"/>
      {/* Two angled bars that echo pitch / goal-post */}
      <path d="M18 10 L26 10 L26 54 L18 54 Z" fill={fill}/>
      <path d="M38 10 L46 10 L46 54 L38 54 Z" fill={fill}/>
      {/* Top connecting bar (the "F" notch hinting forge) */}
      <rect x="18" y="10" width="28" height="6" fill={fill} opacity="0.55"/>
      {/* Forge spark dot */}
      <circle cx="54" cy="14" r="3" fill="#10b981"/>
      <circle cx="54" cy="14" r="1.2" fill="#fff"/>
    </svg>
  );
}

// Direction D — Geometric diamond/chevron (sharpest, pitch-inspired)
function LogoDiamond({ size = 64, mono, color = '#fff' }) {
  const fill = mono ? color : `url(#efd-grad)`;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <LogoDefs id="efd"/>
      <path d="M32 4 L60 32 L32 60 L4 32 Z" fill={fill}/>
      <path d="M32 4 L60 32 L32 60 L4 32 Z" fill="#04070d" transform="scale(0.55) translate(26 26)" opacity="0"/>
      {/* inner ring */}
      <path d="M32 14 L50 32 L32 50 L14 32 Z" fill="#04070d"/>
      <path d="M32 14 L50 32 L32 50 L14 32 Z" fill={fill} opacity="0.6"/>
      {/* central 11 */}
      <rect x="27" y="24" width="3.5" height="16" rx="0.5" fill="#04070d"/>
      <rect x="33.5" y="24" width="3.5" height="16" rx="0.5" fill="#04070d"/>
    </svg>
  );
}

// Wordmark — "ElevenForge" in display type, optional icon
function LogoLockup({ size = 24, icon = 'anvil', mono, color, tight = true }) {
  const Icon = { anvil: LogoAnvil, hammer: LogoHammer, mono: LogoMonogram, diamond: LogoDiamond }[icon] || LogoAnvil;
  const txt = color || (mono ? '#fff' : 'var(--text)');
  return (
    <div style={{display:'inline-flex', alignItems:'center', gap: size * 0.35}}>
      <Icon size={size * 1.05} mono={mono} color={color}/>
      <span style={{
        fontFamily:'var(--font-display)', fontWeight: 800,
        fontSize: size * 0.85, letterSpacing: tight ? '-0.035em' : '-0.02em',
        color: txt, lineHeight: 1, whiteSpace: 'nowrap'
      }}>
        Eleven<span style={{
          backgroundImage: mono ? 'none' : 'linear-gradient(90deg, #818cf8, #10b981)',
          WebkitBackgroundClip: mono ? 'unset' : 'text',
          WebkitTextFillColor: mono ? txt : 'transparent',
          backgroundClip: mono ? 'unset' : 'text',
        }}>Forge</span>
      </span>
    </div>
  );
}

Object.assign(window, { LogoAnvil, LogoHammer, LogoMonogram, LogoDiamond, LogoLockup });
