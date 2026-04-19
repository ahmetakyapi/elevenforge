// App shell — navigation, top bar, routing, tweaks

const ROUTES = {
  landing:   { label: 'Landing',  icon: 'home',    comp: 'Landing',    chrome: false },
  login:     { label: 'Login',    icon: 'users',   comp: 'Login',      chrome: false },
  register:  { label: 'Register', icon: 'users',   comp: 'Register',   chrome: false },
  lobby:     { label: 'Lig',      icon: 'users',   comp: 'Lobby',      chrome: true },
  dashboard: { label: 'Ana',      icon: 'home',    comp: 'Dashboard',  chrome: true },
  squad:     { label: 'Kadro',    icon: 'users',   comp: 'Squad',      chrome: true },
  transfer:  { label: 'Transfer', icon: 'swap',    comp: 'TransferMarket', chrome: true },
  tactic:    { label: 'Taktik',   icon: 'target',  comp: 'TacticBoard', chrome: true },
  match:     { label: 'Maç',      icon: 'play',    comp: 'LiveMatch',   chrome: true },
  newspaper: { label: 'Gazete',   icon: 'paper',   comp: 'Newspaper',   chrome: true },
  crew:      { label: 'Crew',     icon: 'chat',    comp: 'Crew',        chrome: true },
};

const NAV_MAIN = ['dashboard','squad','transfer','tactic','match','newspaper','crew'];
const PRODUCT_PAGES = ['lobby', 'dashboard', 'squad', 'transfer', 'tactic', 'match', 'newspaper', 'crew'];

// Tweakable defaults
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "indigo",
  "theme": "dark",
  "showMascot": true
}/*EDITMODE-END*/;

const ACCENT_MAP = {
  indigo:  { main: '#6366f1', alt: '#10b981' },
  emerald: { main: '#10b981', alt: '#6366f1' },
  cyan:    { main: '#22d3ee', alt: '#6366f1' },
  gold:    { main: '#facc15', alt: '#6366f1' },
  rose:    { main: '#f43f5e', alt: '#6366f1' },
};

function App() {
  const [route, setRoute] = React.useState(() => {
    try { return localStorage.getItem('ef.route') || 'landing'; } catch (e) { return 'landing'; }
  });
  const [tweaks, setTweaks] = React.useState(TWEAK_DEFAULTS);
  const [tweaksOpen, setTweaksOpen] = React.useState(false);

  React.useEffect(() => { try { localStorage.setItem('ef.route', route); } catch (e) {} }, [route]);

  // Apply theme + accent to :root
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', tweaks.theme || 'dark');
    const a = ACCENT_MAP[tweaks.accent] || ACCENT_MAP.indigo;
    document.documentElement.style.setProperty('--accent', a.main);
    document.documentElement.style.setProperty('--accent-2', a.alt);
  }, [tweaks]);

  // Tweaks protocol
  React.useEffect(() => {
    const handler = (e) => {
      if (!e.data) return;
      if (e.data.type === '__activate_edit_mode') setTweaksOpen(true);
      if (e.data.type === '__deactivate_edit_mode') setTweaksOpen(false);
    };
    window.addEventListener('message', handler);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  const setTweak = (k, v) => {
    const next = { ...tweaks, [k]: v };
    setTweaks(next);
    try { window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [k]: v } }, '*'); } catch (e) {}
  };

  const goto = (r) => {
    setRoute(r);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const info = ROUTES[route] || ROUTES.landing;
  const Screen = window[info.comp];

  return (
    <ToastProvider>
      <div className="app-bg"/>
      <div style={{position:'relative', zIndex:1, minHeight:'100vh'}}>
        {info.chrome && <TopNav route={route} goto={goto}/>}
        {Screen ? <Screen goto={goto}/> : <div style={{padding:40}}>Loading {info.comp}…</div>}
        {info.chrome && <MobileBottomNav route={route} goto={goto}/>}
        {tweaksOpen && <TweaksPanel tweaks={tweaks} setTweak={setTweak} onClose={()=>setTweaksOpen(false)}/>}
      </div>
    </ToastProvider>
  );
}

function TopNav({ route, goto }) {
  return (
    <header style={{
      position:'sticky', top:0, zIndex:40,
      borderBottom:'1px solid var(--border)',
      backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
      background:'color-mix(in oklab, var(--bg) 82%, transparent)',
    }}>
      <div style={{maxWidth: 1600, margin:'0 auto', padding:'12px 24px', display:'flex', alignItems:'center', gap:16}}>
        <div style={{cursor:'pointer', display:'flex', alignItems:'center'}} onClick={()=>goto('landing')}>
          <LogoLockup size={18} icon="anvil"/>
        </div>
        <nav style={{gap:2, flex:1, marginLeft:20, overflowX:'auto'}} className="desktop-only">
          {NAV_MAIN.map(k => {
            const r = ROUTES[k];
            const active = route === k;
            return (
              <button key={k} onClick={() => goto(k)} style={{
                display:'inline-flex', alignItems:'center', gap:8, padding:'8px 14px', borderRadius:8, cursor:'pointer',
                fontFamily:'var(--font-display)', fontWeight:600, fontSize:13.5,
                background: active ? 'color-mix(in oklab, var(--accent) 12%, var(--panel))' : 'transparent',
                color: active ? 'var(--text)' : 'var(--muted)',
                border:`1px solid ${active ? 'color-mix(in oklab, var(--accent) 30%, var(--border))' : 'transparent'}`,
                transition:'all var(--t) var(--ease)', whiteSpace:'nowrap',
              }}>
                <Icon name={r.icon} size={14}/>
                {r.label}
              </button>
            );
          })}
        </nav>
        <div style={{display:'flex', gap:10, alignItems:'center'}}>
          <button className="btn btn-ghost btn-sm" onClick={()=>goto('crew')}><Icon name="bell" size={14}/> <span style={{
            background:'var(--danger)', color:'#fff', fontSize:10, fontWeight:700, minWidth:16, height:16, borderRadius:999, display:'inline-flex', alignItems:'center', justifyContent:'center', padding:'0 5px'
          }}>3</span></button>
          <div className="v-divider" style={{height:22}}/>
          <Crest clubId={USER_CLUB_ID} size={28}/>
          <span className="t-mono" style={{fontSize:13, color:'var(--emerald)'}}>€45.8M</span>
        </div>
      </div>
    </header>
  );
}

function MobileBottomNav({ route, goto }) {
  const items = ['dashboard','squad','transfer','tactic','match'];
  return (
    <nav className="mobile-only" style={{
      position:'fixed', bottom:0, left:0, right:0, zIndex:50,
      background:'color-mix(in oklab, var(--bg) 90%, transparent)',
      backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
      borderTop:'1px solid var(--border)',
      gridTemplateColumns:'repeat(5, 1fr)', padding:'8px 4px 10px',
    }}>
      {items.map(k => {
        const r = ROUTES[k];
        const active = route === k;
        return (
          <button key={k} onClick={()=>goto(k)} style={{
            display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'6px 0', cursor:'pointer',
            background:'transparent', border:'none',
            color: active ? 'var(--accent)' : 'var(--muted)',
            fontFamily:'var(--font-display)', fontWeight:600, fontSize:10,
            transition:'color var(--t) var(--ease)',
          }}>
            <Icon name={r.icon} size={18}/>
            <span>{r.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function TweaksPanel({ tweaks, setTweak, onClose }) {
  return (
    <div className="glass" style={{
      position:'fixed', bottom:20, right:20, zIndex:9000, width:300,
      padding:16, borderRadius:14, background:'var(--bg-2)',
      boxShadow:'var(--shadow-lg)', border:'1px solid var(--border-strong)',
    }}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14}}>
        <div>
          <span className="t-label" style={{color:'var(--accent)'}}>TWEAKS</span>
          <div className="t-h3" style={{marginTop:2}}>Düzenle</div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onClose}><Icon name="close" size={14}/></button>
      </div>
      <div style={{display:'flex', flexDirection:'column', gap:14}}>
        <div>
          <span className="t-label">AKSAN RENGİ</span>
          <div style={{display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:6, marginTop:8}}>
            {Object.entries(ACCENT_MAP).map(([k, v]) => (
              <button key={k} onClick={()=>setTweak('accent', k)} style={{
                height:36, borderRadius:8, cursor:'pointer',
                background: `linear-gradient(135deg, ${v.main}, ${v.alt})`,
                border: tweaks.accent === k ? '2px solid var(--text)' : '2px solid transparent',
                transition:'border-color var(--t) var(--ease)',
              }}/>
            ))}
          </div>
        </div>
        <div>
          <span className="t-label">TEMA</span>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginTop:8}}>
            <button className={`chip ${tweaks.theme === 'dark' ? 'active' : ''}`} onClick={()=>setTweak('theme','dark')} style={{cursor:'pointer', justifyContent:'center', padding:'8px'}}>
              <Icon name="moon" size={13}/> Karanlık
            </button>
            <button className={`chip ${tweaks.theme === 'light' ? 'active' : ''}`} onClick={()=>setTweak('theme','light')} style={{cursor:'pointer', justifyContent:'center', padding:'8px'}}>
              <Icon name="sun" size={13}/> Aydınlık
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { App, ROUTES });
