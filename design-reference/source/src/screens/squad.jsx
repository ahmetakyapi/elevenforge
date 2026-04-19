// Squad — cinematic premium redesign
// Animated hero header with depth-chart pitch, animated stat strip,
// hover-grow player cards in both grid + list view, reveal-on-mount,
// full player sheet with radar + attribute bars + contract timeline.

function useRevealSquad(threshold = 0.1) {
  const ref = React.useRef(null);
  const [on, setOn] = React.useState(false);
  React.useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setOn(true); }, { threshold });
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return [ref, on];
}

function Squad({ goto }) {
  const [filter, setFilter] = React.useState('ALL');
  const [q, setQ] = React.useState('');
  const [sort, setSort] = React.useState('ovr');
  const [view, setView] = React.useState('grid');
  const [selected, setSelected] = React.useState(null);
  const [hoveredId, setHoveredId] = React.useState(null);

  const filtered = SQUAD
    .filter(p => filter === 'ALL' || p.pos === filter)
    .filter(p => !q || p.n.toLowerCase().includes(q.toLowerCase()))
    .sort((a,b) => sort === 'ovr' ? b.ovr - a.ovr : sort === 'pot' ? b.pot - a.pot : sort === 'age' ? a.age - b.age : b.val - a.val);

  const totalVal = SQUAD.reduce((s, p) => s + p.val, 0);
  const avgOvr = (SQUAD.reduce((s, p) => s + p.ovr, 0) / SQUAD.length).toFixed(1);
  const avgAge = (SQUAD.reduce((s, p) => s + p.age, 0) / SQUAD.length).toFixed(1);
  const injured = SQUAD.filter(p => p.status === 'injured').length;

  return (
    <div style={{maxWidth:1400, margin:'0 auto', padding:'20px 28px 60px'}}>
      <SquadHero totalVal={totalVal} avgOvr={avgOvr} avgAge={avgAge} injured={injured}/>

      {/* Toolbar */}
      <div className="anim-slide-up" style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap', marginTop:32, marginBottom:20, animationDelay:'200ms'}}>
        <div style={{display:'flex', gap:6, alignItems:'center', flexWrap:'wrap'}}>
          {[['ALL','Tümü', SQUAD.length],['GK','Kaleci', SQUAD.filter(p=>p.pos==='GK').length],['DEF','Defans', SQUAD.filter(p=>p.pos==='DEF').length],['MID','Orta', SQUAD.filter(p=>p.pos==='MID').length],['FWD','Forvet', SQUAD.filter(p=>p.pos==='FWD').length]].map(([f,l,n]) => (
            <button key={f} className={`chip ${filter===f?'active':''}`} onClick={()=>setFilter(f)} style={{cursor:'pointer', display:'inline-flex', alignItems:'center', gap:8}}>
              <span>{l}</span>
              <span className="t-mono" style={{fontSize:10, color: filter===f ? 'var(--accent)' : 'var(--muted)', padding:'1px 6px', borderRadius:4, background: filter===f ? 'color-mix(in oklab, var(--accent) 15%, transparent)' : 'var(--panel-2)'}}>{n}</span>
            </button>
          ))}
        </div>
        <div style={{display:'flex', gap:8, alignItems:'center'}}>
          <div className="glass" style={{padding:0, display:'flex', alignItems:'center', gap:8, padding:'8px 14px', borderRadius:10}}>
            <Icon name="search" size={14}/>
            <input placeholder="İsim ara…" value={q} onChange={e=>setQ(e.target.value)} style={{background:'transparent', border:'none', outline:'none', color:'var(--text)', fontSize:13, width:140, fontFamily:'var(--font-body)'}}/>
          </div>
          <select value={sort} onChange={e=>setSort(e.target.value)} className="input" style={{padding:'8px 12px', fontSize:13, width:'auto'}}>
            <option value="ovr">Overall ↓</option>
            <option value="pot">Potansiyel ↓</option>
            <option value="age">Yaş ↑</option>
            <option value="val">Değer ↓</option>
          </select>
          <div style={{display:'flex', gap:2, padding:3, borderRadius:8, background:'var(--panel-2)', border:'1px solid var(--border)'}}>
            {[['grid','grid'],['list','list']].map(([v, ic]) => (
              <button key={v} onClick={()=>setView(v)} className="btn btn-ghost btn-sm" style={{padding:'6px 10px', background: view===v ? 'var(--panel)' : 'transparent', color: view===v ? 'var(--text)' : 'var(--muted)'}}>
                <Icon name={ic} size={14}/>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      {view === 'grid' ? (
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:14}}>
          {filtered.map((p, i) => (
            <PlayerCardGrid key={p.num} p={p} i={i} onClick={()=>setSelected(p)} hovered={hoveredId === p.num} onHover={setHoveredId}/>
          ))}
        </div>
      ) : (
        <PlayerTable list={filtered} onSelect={setSelected}/>
      )}

      {filtered.length === 0 && (
        <div className="glass" style={{padding:48, textAlign:'center', color:'var(--muted)'}}>
          <Icon name="search" size={24}/>
          <div style={{marginTop:10, fontSize:14}}>Bu filtrelerle oyuncu bulunamadı.</div>
        </div>
      )}

      {selected && <PlayerSheet player={selected} onClose={()=>setSelected(null)}/>}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// HERO — animated depth chart + stat strip
// ──────────────────────────────────────────────────────────
function SquadHero({ totalVal, avgOvr, avgAge, injured }) {
  return (
    <div style={{
      position:'relative', borderRadius:20, overflow:'hidden',
      background:`
        radial-gradient(800px 400px at 15% 20%, color-mix(in oklab, var(--indigo) 18%, transparent), transparent 60%),
        radial-gradient(600px 400px at 90% 100%, color-mix(in oklab, var(--emerald) 14%, transparent), transparent 60%),
        linear-gradient(135deg, color-mix(in oklab, var(--panel) 120%, transparent) 0%, color-mix(in oklab, var(--bg-2) 120%, transparent) 100%)`,
      border:'1px solid var(--border-strong)',
      boxShadow:'var(--shadow-lg)',
    }}>
      {/* Pitch lines backdrop */}
      <svg viewBox="0 0 1600 420" preserveAspectRatio="xMidYMid slice" style={{position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.22, pointerEvents:'none'}}>
        <defs>
          <linearGradient id="pitchHero" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.5"/>
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.5"/>
          </linearGradient>
        </defs>
        <g stroke="url(#pitchHero)" strokeWidth="1.2" fill="none">
          <rect x="40" y="40" width="1520" height="340"/>
          <line x1="800" y1="40" x2="800" y2="380"/>
          <circle cx="800" cy="210" r="85"/>
          <rect x="40" y="130" width="170" height="160"/>
          <rect x="1390" y="130" width="170" height="160"/>
        </g>
        {/* Formation dots animated pulse */}
        {[[8,50],[18,30],[18,50],[18,70],[28,50],[40,30],[40,50],[40,70],[56,30],[56,50],[56,70]].map(([x,y], i) => (
          <circle key={i} cx={x * 16 + 40} cy={y * 3.4 + 40} r="4" fill="var(--accent)" opacity="0.5">
            <animate attributeName="r" values="4;7;4" dur="3s" begin={`${i * 0.2}s`} repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.2;0.6;0.2" dur="3s" begin={`${i * 0.2}s`} repeatCount="indefinite"/>
          </circle>
        ))}
      </svg>

      <div style={{position:'relative', padding:'28px 32px', display:'grid', gridTemplateColumns:'1fr auto', gap:24, alignItems:'center'}}>
        <div className="anim-slide-up">
          <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:10}}>
            <Crest clubId={USER_CLUB_ID} size={32}/>
            <span className="t-label" style={{color:'var(--muted)'}}>KADRO YÖNETİMİ</span>
          </div>
          <h1 className="t-display" style={{
            fontSize:'clamp(38px, 5vw, 64px)', letterSpacing:'-0.035em', lineHeight:0.95, margin:0,
            background:'linear-gradient(180deg, var(--text) 0%, color-mix(in oklab, var(--text) 55%, transparent) 120%)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
            textWrap:'balance',
          }}>
            {USER_CLUB.name}
          </h1>
          <p style={{color:'var(--text-2)', fontSize:15, marginTop:8, letterSpacing:'-0.005em'}}>
            <span className="t-mono" style={{color:'var(--text)'}}>{SQUAD.length}</span> oyuncu ·
            <span className="t-mono" style={{color:'var(--text)'}}> {SQUAD.filter(p=>p.status!=='injured'&&p.status!=='suspended').length}</span> aktif ·
            <span style={{color:'var(--muted)'}}> Sezon 3, Hafta 8</span>
          </p>
        </div>
        <div className="anim-slide-up" style={{animationDelay:'100ms'}}>
          <button className="btn btn-primary btn-lg" style={{padding:'12px 22px'}}>
            <Icon name="plus" size={14}/> Oyuncu Kirala
          </button>
        </div>
      </div>

      {/* Animated stat strip */}
      <div style={{
        position:'relative', display:'grid', gridTemplateColumns:'repeat(4, 1fr)',
        borderTop:'1px solid var(--border)',
      }}>
        {[
          { label:'TOPLAM DEĞER', value: fmtEUR(totalVal), sub:'Piyasa', color:'var(--emerald)', icon:'coin', delay:0 },
          { label:'ORT. OVERALL',  value: avgOvr, sub: `${avgOvr >= 80 ? 'Elit' : avgOvr >= 75 ? 'Güçlü' : 'Gelişiyor'} kadro`, color:'var(--accent)', icon:'star', delay:80 },
          { label:'ORT. YAŞ',      value: avgAge, sub: avgAge < 25 ? 'Genç' : avgAge < 28 ? 'Dengeli' : 'Tecrübeli', color:'var(--cyan)', icon:'calendar', delay:160 },
          { label:'SAKAT / CEZALI', value: `${injured + SQUAD.filter(p=>p.status==='suspended').length}`, sub:'Bu hafta', color:'var(--warn)', icon:'alert', delay:240 },
        ].map((s, i) => (
          <div key={i} className="anim-slide-up" style={{
            padding:'18px 24px',
            borderLeft: i === 0 ? 'none' : '1px solid var(--border)',
            animationDelay: `${s.delay + 300}ms`,
            position:'relative', overflow:'hidden',
          }}>
            <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:6}}>
              <div style={{
                width:26, height:26, borderRadius:7,
                background: `color-mix(in oklab, ${s.color} 18%, transparent)`,
                color: s.color, display:'inline-flex', alignItems:'center', justifyContent:'center',
              }}><Icon name={s.icon} size={13}/></div>
              <span className="t-label" style={{fontSize:10}}>{s.label}</span>
            </div>
            <div className="t-mono" style={{fontSize:26, fontWeight:700, color:'var(--text)', letterSpacing:'-0.02em'}}>{s.value}</div>
            <div className="t-caption" style={{fontSize:11, marginTop:2}}>{s.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// GRID CARD — bold, animated
// ──────────────────────────────────────────────────────────
function PlayerCardGrid({ p, i, onClick, hovered, onHover }) {
  const [localHover, setLocalHover] = React.useState(false);
  const potBuff = p.pot - p.ovr;
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => { setLocalHover(true); onHover(p.num); }}
      onMouseLeave={() => { setLocalHover(false); onHover(null); }}
      className="anim-slide-up"
      style={{
        animationDelay:`${Math.min(i * 35, 420)}ms`,
        position:'relative', borderRadius:14, overflow:'hidden',
        background:`linear-gradient(170deg, color-mix(in oklab, ${posColor(p.pos)} 12%, var(--panel)) 0%, var(--panel) 50%, var(--panel-2) 100%)`,
        border: `1px solid ${localHover ? `color-mix(in oklab, ${posColor(p.pos)} 45%, var(--border))` : 'var(--border)'}`,
        cursor:'pointer',
        transform: localHover ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: localHover ? `0 20px 40px -16px color-mix(in oklab, ${posColor(p.pos)} 30%, black), 0 0 0 1px color-mix(in oklab, ${posColor(p.pos)} 20%, transparent)` : 'var(--shadow-sm)',
        transition: 'all 300ms var(--ease)',
      }}
    >
      {/* Big jersey number watermark */}
      <div style={{
        position:'absolute', top:-20, right:-10,
        fontFamily:'var(--font-display)', fontWeight:900, fontSize:140,
        color: `color-mix(in oklab, ${posColor(p.pos)} 22%, transparent)`,
        lineHeight:1, letterSpacing:'-0.05em', pointerEvents:'none',
        transform: localHover ? 'translateX(-8px) scale(1.05)' : 'translateX(0) scale(1)',
        transition:'transform 500ms var(--ease)',
      }}>{p.num}</div>

      {/* Status ribbon */}
      {p.status && (
        <div style={{
          position:'absolute', top:10, left:10, padding:'4px 8px', borderRadius:6,
          fontSize:10, fontFamily:'var(--font-mono)', fontWeight:600, letterSpacing:'0.05em',
          background: p.status === 'injured' ? 'color-mix(in oklab, var(--danger) 20%, transparent)' :
                      p.status === 'suspended' ? 'color-mix(in oklab, var(--warn) 20%, transparent)' :
                      p.status === 'listed' ? 'color-mix(in oklab, var(--emerald) 20%, transparent)' :
                      'color-mix(in oklab, var(--cyan) 20%, transparent)',
          color: p.status === 'injured' ? 'var(--danger)' :
                 p.status === 'suspended' ? 'var(--warn)' :
                 p.status === 'listed' ? 'var(--emerald)' : 'var(--cyan)',
          border: `1px solid currentColor`,
          zIndex:2,
        }}>
          {p.status === 'injured' ? '🩹 SAKAT' : p.status === 'suspended' ? '🟥 CEZALI' : p.status === 'listed' ? '💰 SATIŞTA' : '💪 EĞİTİM'}
        </div>
      )}

      <div style={{position:'relative', padding:'18px 18px 14px', zIndex:1}}>
        {/* Header */}
        <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14}}>
          <div style={{display:'flex', flexDirection:'column', gap:8, alignItems:'flex-start'}}>
            <PosBadge pos={p.pos} showLabel/>
            <div className="t-mono" style={{fontSize:10, color:'var(--muted)', letterSpacing:'0.08em'}}>{p.role} · {p.nat}</div>
          </div>
          <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end', gap:3}}>
            <OvrChip ovr={p.ovr} size="lg"/>
            {potBuff > 0 && (
              <span className="t-mono" style={{fontSize:10, color:'var(--gold)', fontWeight:600}}>
                →{p.pot} <span style={{opacity:0.7}}>(+{potBuff})</span>
              </span>
            )}
          </div>
        </div>

        {/* Name */}
        <div style={{
          fontFamily:'var(--font-display)', fontWeight:700, fontSize:20,
          letterSpacing:'-0.02em', lineHeight:1.1, minHeight:44,
          color:'var(--text)',
          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
        }} title={p.n}>{p.n}</div>

        {/* Meta strip */}
        <div style={{display:'flex', gap:8, alignItems:'center', marginTop:12, flexWrap:'wrap'}}>
          <AgePill age={p.age} size="sm"/>
          <span className="t-mono" style={{fontSize:12, fontWeight:600, color:'var(--emerald)'}}>{fmtEUR(p.val)}</span>
          <span style={{opacity:0.4, fontSize:11}}>·</span>
          <span className="t-mono" style={{fontSize:11, color:'var(--muted)'}}>{p.ctr}y söz.</span>
        </div>

        {/* Form bars */}
        <div style={{marginTop:14, paddingTop:12, borderTop:'1px solid var(--border)'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6}}>
            <span className="t-label" style={{fontSize:10}}>SON 5 MAÇ</span>
            <span className="t-mono" style={{fontSize:11, color: avgForm(p) >= 7.3 ? 'var(--emerald)' : avgForm(p) >= 6.8 ? 'var(--cyan)' : 'var(--muted)', fontWeight:600}}>
              {avgForm(p).toFixed(2)}
            </span>
          </div>
          <div style={{display:'flex', gap:3, height:24}}>
            {p.form.map((r, j) => {
              const pct = ((r - 5) / 4) * 100;
              return (
                <div key={j} style={{flex:1, display:'flex', alignItems:'flex-end', background:'var(--panel-2)', borderRadius:3, overflow:'hidden'}}>
                  <div style={{
                    width:'100%', height: `${Math.max(10, pct)}%`,
                    background: r >= 8 ? 'var(--gold)' : r >= 7.3 ? 'var(--emerald)' : r >= 6.5 ? 'var(--cyan)' : 'var(--muted-2)',
                    transition: `height 500ms ${400 + j * 60}ms var(--ease)`,
                    transform: localHover ? 'scaleY(1.08)' : 'scaleY(1)',
                    transformOrigin:'bottom',
                  }}/>
                </div>
              );
            })}
          </div>
        </div>

        {/* Fit + morale bars */}
        <div style={{marginTop:12, display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
          <div>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:4}}>
              <span className="t-label" style={{fontSize:9}}>FIT</span>
              <span className="t-mono" style={{fontSize:10, color: p.fit>=90?'var(--emerald)':p.fit>=75?'var(--cyan)':'var(--warn)', fontWeight:600}}>{p.fit}</span>
            </div>
            <Bar value={p.fit} height={3} color={p.fit>=90?'var(--emerald)':p.fit>=75?'var(--cyan)':'var(--warn)'}/>
          </div>
          <div>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:4}}>
              <span className="t-label" style={{fontSize:9}}>MORAL</span>
              <span style={{fontSize:10, letterSpacing:'-0.04em'}}>
                {'●'.repeat(p.mor)}<span style={{color:'var(--muted-2)'}}>{'●'.repeat(5-p.mor)}</span>
              </span>
            </div>
            <Bar value={p.mor * 20} height={3} color={p.mor>=4?'var(--emerald)':p.mor>=3?'var(--cyan)':'var(--warn)'}/>
          </div>
        </div>
      </div>
    </div>
  );
}

function avgForm(p) { return p.form.reduce((a,b)=>a+b,0) / p.form.length; }

// ──────────────────────────────────────────────────────────
// LIST VIEW
// ──────────────────────────────────────────────────────────
function PlayerTable({ list, onSelect }) {
  return (
    <div className="glass" style={{padding:0, overflow:'hidden'}}>
      <div style={{display:'grid', gridTemplateColumns:'40px 1fr 100px 70px 90px 100px 100px 70px 90px 60px', gap:12, padding:'12px 18px', borderBottom:'1px solid var(--border)', background:'var(--panel-2)'}}>
        {['#','OYUNCU','POS','OVR','POT','YAŞ','FORM','FIT','DEĞER','DURUM'].map((h,i)=><span key={i} className="t-label" style={{fontSize:10}}>{h}</span>)}
      </div>
      {list.map((p, i) => (
        <div key={p.num} onClick={()=>onSelect(p)} className="anim-slide-up" style={{
          display:'grid', gridTemplateColumns:'40px 1fr 100px 70px 90px 100px 100px 70px 90px 60px', gap:12, padding:'12px 18px', alignItems:'center',
          borderBottom: i < list.length - 1 ? '1px solid var(--border)' : 'none',
          cursor:'pointer', transition:'background 200ms var(--ease), transform 200ms var(--ease)',
          animationDelay: `${Math.min(i * 20, 300)}ms`,
        }} onMouseEnter={e=>{e.currentTarget.style.background='color-mix(in oklab, var(--accent) 5%, transparent)'; e.currentTarget.style.transform='translateX(3px)';}} onMouseLeave={e=>{e.currentTarget.style.background='transparent'; e.currentTarget.style.transform='translateX(0)';}}>
          <span className="t-mono" style={{color:'var(--muted)', fontSize:13}}>{p.num}</span>
          <div style={{display:'flex', alignItems:'center', gap:12}}>
            <div style={{
              width:32, height:32, borderRadius:8,
              background:`linear-gradient(135deg, ${posColor(p.pos)}, color-mix(in oklab, ${posColor(p.pos)} 30%, var(--bg-2)))`,
              color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:12, fontFamily:'var(--font-mono)',
            }}>{p.n.split(' ').map(s=>s[0]).join('').slice(0,2)}</div>
            <div style={{minWidth:0, overflow:'hidden'}}>
              <div style={{fontSize:14, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}} title={p.n}>{p.n}</div>
              <div className="t-caption" style={{fontSize:11}}>{p.role} · {p.nat}</div>
            </div>
          </div>
          <PosBadge pos={p.pos} showLabel/>
          <OvrChip ovr={p.ovr} size="sm"/>
          <div><Bar value={p.pot} color="var(--gold)" height={4}/><span className="t-mono" style={{fontSize:10, color:'var(--muted)'}}>{p.ovr}→{p.pot}</span></div>
          <AgePill age={p.age} size="sm"/>
          <div style={{display:'flex', gap:2}}>{p.form.map((f,j) => <span key={j} style={{flex:1, height:14, borderRadius:2, background:f>=8?'var(--gold)':f>=7?'var(--emerald)':f>=6?'var(--cyan)':'var(--muted-2)'}}/>)}</div>
          <Bar value={p.fit} height={4} color={p.fit>=90?'var(--emerald)':p.fit>=75?'var(--cyan)':'var(--warn)'}/>
          <Currency value={p.val} size={13}/>
          <div style={{fontSize:14}}>
            {p.status === 'injured' && '🩹'}
            {p.status === 'suspended' && '🟥'}
            {p.status === 'training' && '💪'}
            {p.status === 'listed' && '💰'}
          </div>
        </div>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// PLAYER SHEET
// ──────────────────────────────────────────────────────────
function PlayerSheet({ player: p, onClose }) {
  const [tab, setTab] = React.useState('attr');
  const attrs = {
    fiziksel: [['Hız', 82],['Güç',78],['Dayanıklılık',84],['Sıçrama',71]],
    teknik:   [['Şut', p.pos==='FWD'?86:72],['Pas', p.pos==='MID'?85:74],['Driplink',81],['Top kontrol',82]],
    mental:   [['Karar',79],['Agresyon',73],['Vizyon',81],['Liderlik',70]],
  };
  return (
    <div onClick={onClose} style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', backdropFilter:'blur(6px)', WebkitBackdropFilter:'blur(6px)', zIndex:200, display:'flex', justifyContent:'center', alignItems:'flex-end', animation:'fade 200ms var(--ease)'}}>
      <style>{`@keyframes fade { from { opacity: 0 } to { opacity: 1 } } @keyframes sup { from { transform: translateY(100%); opacity:0 } to { transform: translateY(0); opacity:1 } }`}</style>
      <div onClick={e=>e.stopPropagation()} style={{
        maxWidth: 920, width:'100%', maxHeight:'92vh', overflowY:'auto',
        borderRadius:'24px 24px 0 0', border:'1px solid var(--border-strong)',
        animation:'sup 400ms var(--ease)',
        background:`
          radial-gradient(600px 300px at 10% 0%, color-mix(in oklab, ${posColor(p.pos)} 16%, transparent), transparent 60%),
          var(--bg-2)`,
        boxShadow:'0 -40px 80px -20px rgba(0,0,0,0.5)',
      }}>
        {/* Hero */}
        <div style={{padding:'32px 32px 24px', borderBottom:'1px solid var(--border)', display:'grid', gridTemplateColumns:'auto 1fr auto', gap:24, alignItems:'center', position:'relative'}}>
          <button className="btn btn-ghost btn-sm" style={{position:'absolute', top:16, right:16}} onClick={onClose}><Icon name="close" size={16}/></button>

          <div style={{
            width:120, height:120, borderRadius:20, position:'relative', overflow:'hidden',
            background:`linear-gradient(135deg, ${posColor(p.pos)} 0%, color-mix(in oklab, ${posColor(p.pos)} 30%, var(--bg-2)) 120%)`,
            boxShadow:`0 12px 32px -8px color-mix(in oklab, ${posColor(p.pos)} 50%, transparent)`,
            border:'1px solid rgba(255,255,255,0.12)',
          }}>
            <span className="t-mono" style={{
              position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:64, fontWeight:800, color:'rgba(255,255,255,0.95)', letterSpacing:'-0.04em',
              textShadow:'0 4px 16px rgba(0,0,0,0.4)',
            }}>{p.num}</span>
            <div style={{position:'absolute', top:8, left:8, fontSize:10, fontFamily:'var(--font-mono)', fontWeight:700, color:'rgba(255,255,255,0.7)'}}>{p.pos}</div>
          </div>

          <div>
            <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:8}}>
              <Crest clubId={USER_CLUB_ID} size={20}/>
              <span className="t-small">{USER_CLUB.name} · {p.nat} · {p.role}</span>
            </div>
            <div style={{
              fontFamily:'var(--font-display)', fontWeight:800, fontSize:'clamp(28px, 4vw, 42px)',
              letterSpacing:'-0.03em', lineHeight:1, textWrap:'balance',
              background:'linear-gradient(180deg, var(--text) 0%, color-mix(in oklab, var(--text) 65%, transparent) 120%)',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
            }}>{p.n}</div>
            <div style={{display:'flex', alignItems:'center', gap:12, marginTop:14, flexWrap:'wrap'}}>
              <OvrChip ovr={p.ovr} size="lg"/>
              <PosBadge pos={p.pos} showLabel/>
              <AgePill age={p.age}/>
              <div style={{display:'flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:8, background:'color-mix(in oklab, var(--gold) 12%, transparent)', border:'1px solid color-mix(in oklab, var(--gold) 30%, transparent)'}}>
                <span className="t-label" style={{fontSize:9, color:'var(--gold)'}}>POT</span>
                <span className="t-mono" style={{fontSize:13, color:'var(--gold)', fontWeight:700}}>{p.pot}</span>
              </div>
              <Currency value={p.val} size={16} color="var(--emerald)"/>
            </div>
          </div>

          <div style={{display:'flex', flexDirection:'column', gap:8, alignItems:'flex-end'}}>
            <div style={{textAlign:'right'}}>
              <span className="t-label" style={{fontSize:9}}>SON 5 ORT.</span>
              <div className="t-mono" style={{fontSize:28, fontWeight:700, color: avgForm(p)>=7.3?'var(--emerald)':'var(--text)', letterSpacing:'-0.02em'}}>{avgForm(p).toFixed(2)}</div>
            </div>
            <div style={{display:'flex', gap:3}}>
              {p.form.map((r, i) => <RatingDot key={i} rating={r} size={26}/>)}
            </div>
          </div>
        </div>

        {/* Content grid */}
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, padding:'20px 32px'}}>
          <div className="glass" style={{padding:18}}>
            <span className="t-label">PROFİL RADARI</span>
            <RadarChart p={p}/>
          </div>
          <div className="glass" style={{padding:18, display:'flex', flexDirection:'column', gap:14}}>
            <span className="t-label">SÖZLEŞME</span>
            <div>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6}}>
                <span className="t-caption">Kalan yıl</span>
                <span className="t-mono" style={{fontSize:16, fontWeight:700, color: p.ctr <= 1 ? 'var(--warn)' : 'var(--text)'}}>{p.ctr} yıl</span>
              </div>
              <div style={{display:'flex', gap:3, height:8}}>
                {Array.from({length:5}).map((_,i) => (
                  <div key={i} style={{flex:1, borderRadius:3, background: i < p.ctr ? (p.ctr <= 1 ? 'var(--warn)' : 'var(--accent)') : 'var(--panel-2)', transition:`all 500ms ${i*80}ms var(--ease)`}}/>
                ))}
              </div>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, paddingTop:10, borderTop:'1px solid var(--border)'}}>
              <div>
                <span className="t-caption" style={{display:'block', marginBottom:4}}>Haftalık</span>
                <span className="t-mono" style={{fontSize:15, fontWeight:600}}>{fmtWage(p.wage)}</span>
              </div>
              <div>
                <span className="t-caption" style={{display:'block', marginBottom:4}}>Bırakma</span>
                <span className="t-mono" style={{fontSize:15, fontWeight:600, color:'var(--text-2)'}}>{fmtEUR(p.val * 1.8)}</span>
              </div>
              <div>
                <span className="t-caption" style={{display:'block', marginBottom:4}}>Kondisyon</span>
                <div style={{display:'flex', alignItems:'center', gap:6}}>
                  <Bar value={p.fit} height={4} color={p.fit>=90?'var(--emerald)':'var(--cyan)'}/>
                  <span className="t-mono" style={{fontSize:11}}>{p.fit}</span>
                </div>
              </div>
              <div>
                <span className="t-caption" style={{display:'block', marginBottom:4}}>Moral</span>
                <span style={{fontSize:14, letterSpacing:'-0.03em'}}>{'❤'.repeat(p.mor)}<span style={{color:'var(--muted-2)'}}>{'❤'.repeat(5-p.mor)}</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{padding:'0 32px 24px'}}>
          <div style={{display:'flex', gap:4, marginBottom:16, borderBottom:'1px solid var(--border)'}}>
            {[['attr','Nitelikler'],['form','Form Geçmişi'],['hist','Kariyer']].map(([k,l])=>(
              <button key={k} onClick={()=>setTab(k)} style={{
                padding:'10px 14px', background:'transparent', border:'none', cursor:'pointer',
                color: tab === k ? 'var(--text)' : 'var(--muted)', fontSize:13, fontWeight: tab === k ? 600 : 500,
                borderBottom: tab === k ? '2px solid var(--accent)' : '2px solid transparent',
                marginBottom:-1, transition:'all 200ms var(--ease)',
              }}>{l}</button>
            ))}
          </div>
          {tab === 'attr' && (
            <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:14}}>
              {Object.entries(attrs).map(([grp, rows], gi) => (
                <div key={grp} className="glass anim-slide-up" style={{padding:16, animationDelay:`${gi * 60}ms`}}>
                  <span className="t-label" style={{textTransform:'uppercase'}}>{grp}</span>
                  <div style={{marginTop:12, display:'flex', flexDirection:'column', gap:10}}>
                    {rows.map(([name, val], ri) => (
                      <div key={name} style={{display:'grid', gridTemplateColumns:'1fr auto 80px', gap:8, alignItems:'center'}}>
                        <span style={{fontSize:12.5, color:'var(--text-2)'}}>{name}</span>
                        <span className="t-mono" style={{fontSize:12, color:tierColor(val), fontWeight:700, minWidth:22, textAlign:'right'}}>{val}</span>
                        <div style={{height:4, borderRadius:2, background:'var(--panel-2)', overflow:'hidden'}}>
                          <div style={{
                            height:'100%', background: tierColor(val),
                            width: `${val}%`, transition: `width 700ms ${200 + gi*100 + ri*50}ms var(--ease)`,
                          }}/>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {tab === 'form' && (
            <div style={{display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:12}}>
              {p.form.map((r, i) => (
                <div key={i} className="glass anim-slide-up" style={{padding:14, textAlign:'center', animationDelay:`${i * 80}ms`}}>
                  <span className="t-label" style={{fontSize:10}}>M-{5-i}</span>
                  <div style={{marginTop:10}}><RatingDot rating={r} size={48}/></div>
                  <div className="t-caption" style={{marginTop:8, fontSize:11}}>
                    {r >= 8 ? 'Maç Adamı' : r >= 7.3 ? 'Güçlü' : r >= 6.5 ? 'Ortalama' : 'Zayıf'}
                  </div>
                </div>
              ))}
            </div>
          )}
          {tab === 'hist' && (
            <div className="glass" style={{padding:20}}>
              <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:14}}>
                <Crest clubId={USER_CLUB_ID} size={32}/>
                <div>
                  <div style={{fontSize:14, fontWeight:600}}>{USER_CLUB.name}</div>
                  <span className="t-caption">Altyapı · Sezon 1'den beri</span>
                </div>
              </div>
              <div style={{fontSize:13, color:'var(--text-2)', lineHeight:1.6}}>
                Bu oyuncu kulübünde yetişti. Transfer geçmişi bulunmuyor. Kulüp efsanesi yolunda.
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{padding:'16px 32px', borderTop:'1px solid var(--border)', display:'flex', gap:10, position:'sticky', bottom:0, background:'color-mix(in oklab, var(--bg-2) 96%, transparent)', backdropFilter:'blur(10px)'}}>
          <button className="btn btn-primary" style={{flex:1, justifyContent:'center'}}>
            <Icon name="coin" size={14}/> Transfer Listesine
          </button>
          <button className="btn" style={{flex:1, justifyContent:'center'}}>
            <Icon name="target" size={14}/> Antrenmana
          </button>
          <button className="btn btn-ghost">Dostluk Maçına</button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// RADAR
// ──────────────────────────────────────────────────────────
function RadarChart({ p }) {
  const stats = [
    ['PAC', p.pos==='FWD'?84:p.pos==='MID'?78:72],
    ['SHO', p.pos==='FWD'?82:p.pos==='MID'?72:p.pos==='GK'?40:55],
    ['PAS', p.pos==='MID'?85:p.pos==='DEF'?74:72],
    ['DRI', p.pos==='FWD'?82:p.pos==='MID'?84:68],
    ['DEF', p.pos==='DEF'?85:p.pos==='MID'?72:p.pos==='GK'?78:55],
    ['PHY', p.pos==='DEF'?82:p.pos==='FWD'?78:p.pos==='GK'?80:74],
  ];
  const cx = 110, cy = 110, r = 80;
  const pts = stats.map(([_, v], i) => {
    const a = (i * 60 - 90) * Math.PI / 180;
    const rr = (v / 99) * r;
    return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)];
  });
  return (
    <svg width="100%" viewBox="0 0 220 220" style={{marginTop:10}}>
      <defs>
        <radialGradient id="radarFill">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.45"/>
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.1"/>
        </radialGradient>
      </defs>
      {[0.33, 0.66, 1].map((s, i) => {
        const pp = Array.from({length:6}).map((_,k) => {
          const a = (k * 60 - 90) * Math.PI / 180;
          return `${cx + s*r*Math.cos(a)},${cy + s*r*Math.sin(a)}`;
        }).join(' ');
        return <polygon key={i} points={pp} fill={i === 2 ? 'var(--panel-2)' : 'none'} stroke="var(--border)" strokeWidth="1" opacity={i === 2 ? 0.5 : 1}/>;
      })}
      {stats.map((_, i) => {
        const a = (i * 60 - 90) * Math.PI / 180;
        return <line key={i} x1={cx} y1={cy} x2={cx + r*Math.cos(a)} y2={cy + r*Math.sin(a)} stroke="var(--border)" strokeWidth="1"/>;
      })}
      <polygon points={pts.map(p=>p.join(',')).join(' ')} fill="url(#radarFill)" stroke="var(--accent)" strokeWidth="2.5" style={{
        transformOrigin: `${cx}px ${cy}px`,
        animation: 'radar-grow 800ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
      }}/>
      <style>{`@keyframes radar-grow { from { transform: scale(0); opacity:0 } to { transform: scale(1); opacity:1 } }`}</style>
      {pts.map((pt, i) => (
        <circle key={i} cx={pt[0]} cy={pt[1]} r="4" fill="var(--accent)" style={{
          opacity:0, animation:`fade-in-radar 400ms ${600 + i*60}ms forwards`,
        }}/>
      ))}
      <style>{`@keyframes fade-in-radar { to { opacity: 1 } }`}</style>
      {stats.map(([l, v], i) => {
        const a = (i * 60 - 90) * Math.PI / 180;
        const tx = cx + (r + 18) * Math.cos(a);
        const ty = cy + (r + 18) * Math.sin(a);
        return (
          <g key={i}>
            <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" fontFamily="var(--font-mono)" fontSize="11" fill="var(--muted)" fontWeight="700">{l}</text>
            <text x={tx} y={ty + 12} textAnchor="middle" dominantBaseline="middle" fontFamily="var(--font-mono)" fontSize="10" fill={tierColor(v)} fontWeight="700">{v}</text>
          </g>
        );
      })}
    </svg>
  );
}

Object.assign(window, { Squad, PlayerSheet, RadarChart });
