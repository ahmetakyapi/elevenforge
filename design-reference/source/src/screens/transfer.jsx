// Transfer Market + Scout Modal

const NAT_FLAGS = {
  NG: '🇳🇬', HU: '🇭🇺', HR: '🇭🇷', FR: '🇫🇷', BR: '🇧🇷',
  AR: '🇦🇷', DE: '🇩🇪', GR: '🇬🇷', ES: '🇪🇸', CZ: '🇨🇿',
  DK: '🇩🇰', TR: '🇹🇷', IT: '🇮🇹', PT: '🇵🇹', NL: '🇳🇱',
};
const NAT_NAMES = {
  NG: 'Nijerya', HU: 'Macaristan', HR: 'Hırvatistan', FR: 'Fransa', BR: 'Brezilya',
  AR: 'Arjantin', DE: 'Almanya', GR: 'Yunanistan', ES: 'İspanya', CZ: 'Çekya',
  DK: 'Danimarka', TR: 'Türkiye', IT: 'İtalya', PT: 'Portekiz', NL: 'Hollanda',
};
const POS_FULL = { GK: 'Kaleci', DEF: 'Defans', MID: 'Orta Saha', FWD: 'Forvet' };

function TransferMarket({ goto }) {
  const [showScout, setShowScout] = React.useState(false);
  const [pos, setPos] = React.useState('ALL');
  const [maxPrice, setMaxPrice] = React.useState(80);
  const [minOvr, setMinOvr] = React.useState(70);
  const [maxAge, setMaxAge] = React.useState(35);
  const [sort, setSort] = React.useState('trend'); // trend | price-asc | price-desc | ovr | age
  const [mode, setMode] = React.useState('buy'); // buy | sell

  const filtered = TRANSFER_LIST
    .filter(p => pos === 'ALL' || p.pos === pos)
    .filter(p => p.price <= maxPrice * 1_000_000)
    .filter(p => p.ovr >= minOvr)
    .filter(p => p.age <= maxAge);

  const sorted = React.useMemo(() => {
    const arr = [...filtered];
    if (sort === 'price-asc') arr.sort((a,b) => a.price - b.price);
    else if (sort === 'price-desc') arr.sort((a,b) => b.price - a.price);
    else if (sort === 'ovr') arr.sort((a,b) => b.ovr - a.ovr);
    else if (sort === 'age') arr.sort((a,b) => a.age - b.age);
    else arr.sort((a,b) => (b.decay?.startsWith('↑')?1:0) - (a.decay?.startsWith('↑')?1:0));
    return arr;
  }, [filtered, sort]);

  return (
    <div style={{maxWidth:1400, margin:'0 auto', padding:'20px 28px'}}>
      {/* Global ticker */}
      <div className="glass" style={{padding:0, overflow:'hidden', marginBottom:20}}>
        <div style={{padding:'10px 16px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10}}>
          <span style={{width:8, height:8, borderRadius:'50%', background:'var(--emerald)', animation:'pulse-accent 2s ease-in-out infinite'}}/>
          <span className="t-label" style={{color:'var(--emerald)'}}>CANLI · TÜM LİGLER</span>
          <span className="t-small" style={{color:'var(--muted)', marginLeft:'auto'}}>Son 24 saat</span>
        </div>
        <div style={{display:'flex', alignItems:'center', overflow:'hidden'}}>
          <div style={{display:'flex', gap:32, padding:'12px 0', animation:'marquee 64s linear infinite', width:'max-content', whiteSpace:'nowrap'}}>
            {[...GLOBAL_TRANSFERS, ...GLOBAL_TRANSFERS].map((t, i) => (
              <span key={i} style={{display:'flex', alignItems:'center', gap:10, padding:'0 16px', fontSize:13}}>
                <Crest clubId={t.buyerClub} size={20}/>
                <span style={{fontWeight:600}}>{t.buyer}</span>
                <span style={{color:'var(--muted)'}}>→</span>
                <span style={{fontWeight:600}}>{t.player}</span>
                <span className="t-mono" style={{color:'var(--emerald)'}}>{fmtEUR(t.price)}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 320px', gap:20}}>
        <div>
          {/* Mode tabs */}
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:12}}>
            <div style={{display:'flex', gap:4, background:'var(--bg-2)', padding:4, borderRadius:999, border:'1px solid var(--border)'}}>
              <button
                onClick={()=>setMode('buy')}
                className="t-label"
                style={{padding:'8px 18px', borderRadius:999, border:'none', background: mode==='buy'?'var(--accent)':'transparent', color: mode==='buy'?'#fff':'var(--muted)', cursor:'pointer', fontWeight:700, fontSize:11, letterSpacing:'0.1em', transition:'all 200ms'}}
              >AL</button>
              <button
                onClick={()=>setMode('sell')}
                className="t-label"
                style={{padding:'8px 18px', borderRadius:999, border:'none', background: mode==='sell'?'var(--warn)':'transparent', color: mode==='sell'?'#111':'var(--muted)', cursor:'pointer', fontWeight:700, fontSize:11, letterSpacing:'0.1em', transition:'all 200ms'}}
              >SAT</button>
            </div>
            <button className="btn btn-primary" onClick={()=>setShowScout(true)}><Icon name="compass" size={14}/> Kaşif Gönder</button>
          </div>

          {mode === 'buy' ? (
            <>
              {/* Header row */}
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:14}}>
                <div>
                  <span className="t-label">TRANSFER PAZARI</span>
                  <div className="t-h1" style={{marginTop:6, fontSize:28}}>{sorted.length} oyuncu</div>
                </div>
                <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
                  {[['trend','Trend'],['price-asc','€↑'],['price-desc','€↓'],['ovr','OVR'],['age','Yaş']].map(([k,l]) => (
                    <button key={k} className={`chip ${sort===k?'active':''}`} onClick={()=>setSort(k)} style={{cursor:'pointer', fontSize:11}}>{l}</button>
                  ))}
                </div>
              </div>

              {/* Filters */}
              <GlassCard pad={14} hover={false} style={{marginBottom:14}}>
                <div style={{display:'grid', gridTemplateColumns:'auto 1fr 1fr 1fr', gap:16, alignItems:'center'}}>
                  <div style={{display:'flex', gap:4, flexWrap:'wrap'}}>
                    {['ALL','GK','DEF','MID','FWD'].map(p => (
                      <button key={p} className={`chip ${pos===p?'active':''}`} onClick={()=>setPos(p)} style={{cursor:'pointer', fontSize:11}}>{p==='ALL'?'Tüm Mevki':p}</button>
                    ))}
                  </div>
                  <SliderField label="Max fiyat" value={`€${maxPrice}M`} min={5} max={80} cur={maxPrice} onChange={setMaxPrice} color="var(--emerald)"/>
                  <SliderField label="Min OVR" value={minOvr} min={60} max={90} cur={minOvr} onChange={setMinOvr} color="var(--indigo)"/>
                  <SliderField label="Max yaş" value={`${maxAge}y`} min={17} max={38} cur={maxAge} onChange={setMaxAge} color="var(--warn)"/>
                </div>
              </GlassCard>

              {/* List */}
              <div style={{display:'flex', flexDirection:'column', gap:8}}>
                {sorted.map((p, i) => <TransferRow key={p.n} p={p} idx={i}/>)}
                {sorted.length === 0 && (
                  <GlassCard pad={40} hover={false} style={{textAlign:'center'}}>
                    <Icon name="search" size={24}/>
                    <div className="t-h3" style={{marginTop:12}}>Filtreye uyan oyuncu yok</div>
                    <div className="t-caption" style={{marginTop:4}}>Filtreleri gevşetmeyi veya Kaşif göndermeyi dene.</div>
                  </GlassCard>
                )}
              </div>
            </>
          ) : (
            <SellTab/>
          )}
        </div>

        {/* Right panel */}
        <div style={{display:'flex', flexDirection:'column', gap:16}}>
          <MarketStats/>
          <GlassCard pad={16} hover={false}>
            <SectionHead label="SENİN LİSTELERİN" title={<span style={{fontSize:16}}>Satışta</span>}/>
            <div style={{display:'flex', flexDirection:'column', gap:8}}>
              {SQUAD.filter(p => p.status === 'listed').map((p, i) => <MyListRow key={i} p={p}/>)}
              <button className="glass" style={{padding:12, display:'flex', alignItems:'center', justifyContent:'center', gap:8, border:'1px dashed var(--border)', cursor:'pointer', color:'var(--muted)', fontSize:12, fontWeight:500}} onClick={()=>setMode('sell')}>
                <Icon name="plus" size={14}/> Oyuncu Listele
              </button>
            </div>
          </GlassCard>
          <GlassCard pad={16} hover={false}>
            <SectionHead label="AKTİF KAŞİF" title={<span style={{fontSize:16}}>1 görevde</span>}/>
            <ScoutActiveCard/>
          </GlassCard>
        </div>
      </div>
      {showScout && <ScoutModal onClose={()=>setShowScout(false)}/>}
    </div>
  );
}

// ─── Market summary stats ────────────────────────────────
function MarketStats() {
  const stats = [
    { l: 'Hareketli piyasa', v: '↑ +12%', c: 'var(--emerald)' },
    { l: 'Ortalama fiyat', v: '€24.8M', c: 'var(--text)' },
    { l: 'En pahalı', v: '€68M', c: 'var(--warn)' },
    { l: 'Bugün satılan', v: '47', c: 'var(--indigo)' },
  ];
  return (
    <GlassCard pad={16} hover={false}>
      <SectionHead label="PİYASA" title={<span style={{fontSize:16}}>Özet</span>}/>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
        {stats.map((s, i) => (
          <div key={i} style={{display:'flex', flexDirection:'column', gap:4}}>
            <span className="t-caption" style={{fontSize:10}}>{s.l}</span>
            <span className="t-mono" style={{fontSize:16, fontWeight:700, color:s.c}}>{s.v}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

function SliderField({ label, value, min, max, cur, onChange, color }) {
  return (
    <div style={{display:'flex', flexDirection:'column', gap:4, minWidth:0}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', gap:6}}>
        <span className="t-caption" style={{fontSize:10, whiteSpace:'nowrap'}}>{label}</span>
        <span className="t-mono" style={{fontSize:12, fontWeight:700, color}}>{value}</span>
      </div>
      <input type="range" min={min} max={max} value={cur} onChange={e=>onChange(+e.target.value)} style={{accentColor:color, width:'100%'}}/>
    </div>
  );
}

function TransferRow({ p, idx }) {
  const [open, setOpen] = React.useState(false);
  const club = clubById(p.clubId);
  const trending = p.decay?.startsWith('↑');
  const priceColor = p.price > 40_000_000 ? 'var(--warn)' : p.price > 20_000_000 ? 'var(--text)' : 'var(--emerald)';
  return (
    <div
      className="glass"
      style={{
        padding:0,
        overflow:'hidden',
        transition:'all 200ms var(--ease)',
        borderColor: open ? 'color-mix(in oklab, var(--accent) 40%, var(--border))' : undefined,
        animation:`slide-up 300ms ${idx*40}ms both var(--ease)`,
      }}
    >
      {/* Main row */}
      <div
        onClick={()=>setOpen(!open)}
        style={{
          display:'grid',
          gridTemplateColumns:'44px 1.8fr 1.2fr 70px 70px 90px 150px',
          gap:14,
          alignItems:'center',
          padding:'12px 16px',
          cursor:'pointer',
        }}
      >
        {/* Avatar w/ PosBadge */}
        <div style={{position:'relative', width:44, height:44}}>
          <UserAvatar name={p.n} size={44}/>
          <div style={{position:'absolute', bottom:-2, right:-2, border:'2px solid var(--bg)', borderRadius:'50%'}}>
            <PosBadge pos={p.pos} size={18}/>
          </div>
        </div>

        {/* Name + club */}
        <div style={{minWidth:0, display:'flex', flexDirection:'column', gap:3}}>
          <div style={{display:'flex', alignItems:'center', gap:8}}>
            <span style={{fontSize:15, fontWeight:600}}>{p.n}</span>
            {trending && (
              <span className="t-mono" title="Trend yukarı" style={{fontSize:10, fontWeight:700, color:'var(--emerald)', background:'color-mix(in oklab, var(--emerald) 14%, transparent)', padding:'2px 6px', borderRadius:4, letterSpacing:'0.05em'}}>TREND</span>
            )}
          </div>
          <div style={{display:'flex', alignItems:'center', gap:6, minWidth:0}}>
            <Crest clubId={p.clubId} size={14}/>
            <span className="t-caption" style={{fontSize:11.5, color:'var(--muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{club?.name}</span>
          </div>
        </div>

        {/* Role + Nat */}
        <div style={{display:'flex', flexDirection:'column', gap:3, minWidth:0}}>
          <span style={{fontSize:13, fontWeight:600, color:'var(--text)'}}>{p.role}</span>
          <span className="t-caption" style={{fontSize:11.5, display:'flex', alignItems:'center', gap:5}}>
            <span style={{fontSize:14}}>{NAT_FLAGS[p.nat] || '🌍'}</span>
            <span style={{color:'var(--muted)'}}>{NAT_NAMES[p.nat] || p.nat}</span>
          </span>
        </div>

        {/* OVR */}
        <div style={{display:'flex', justifyContent:'center'}}>
          <OvrChip ovr={p.ovr} size="sm"/>
        </div>

        {/* Age */}
        <div style={{textAlign:'center'}}>
          <div className="t-mono" style={{fontSize:15, fontWeight:700}}>{p.age}</div>
          <div className="t-caption" style={{fontSize:10}}>yaş</div>
        </div>

        {/* Timer */}
        <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:2}}>
          <span className="t-mono" style={{fontSize:12, color: trending?'var(--emerald)':'var(--muted)', fontWeight:600}}>
            {p.decay}
          </span>
          <span className="t-caption" style={{fontSize:10}}>{p.hoursOn} saat önce</span>
        </div>

        {/* Price + buy */}
        <div style={{display:'flex', alignItems:'center', gap:10, justifyContent:'flex-end'}}>
          <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end'}}>
            <span className="t-mono" style={{fontSize:16, fontWeight:700, color: priceColor, letterSpacing:'-0.01em'}}>{fmtEUR(p.price)}</span>
            <span className="t-caption" style={{fontSize:10}}>
              {p.seller === 'bot' ? 'Bot' : `@${p.sellerName}`}
            </span>
          </div>
          <button
            className="btn btn-sm btn-primary"
            onClick={(e)=>{e.stopPropagation();}}
            style={{minWidth:56}}
          >Al</button>
        </div>
      </div>

      {/* Expanded detail */}
      {open && (
        <div style={{
          padding:'14px 16px',
          background:'color-mix(in oklab, var(--accent) 5%, transparent)',
          borderTop:'1px solid var(--border)',
          display:'grid',
          gridTemplateColumns:'1fr 1fr 1fr 1fr',
          gap:16,
          animation:'slide-up 200ms var(--ease)',
        }}>
          <Stat l="Potansiyel" v={`${p.pot}`} c={p.pot > p.ovr + 2 ? 'var(--emerald)' : 'var(--text)'}/>
          <Stat l="Kalan" v={p.hoursOn < 6 ? 'Kısa süre' : `${24 - p.hoursOn}sa`} c="var(--warn)"/>
          <Stat l="Tipik pazar" v={fmtEUR(p.price * 0.9) + ' - ' + fmtEUR(p.price * 1.15)} c="var(--muted)"/>
          <Stat l="Satıcı" v={p.seller === 'bot' ? '🤖 Bot' : p.sellerName} c="var(--text)"/>
        </div>
      )}
    </div>
  );
}

function Stat({ l, v, c }) {
  return (
    <div style={{display:'flex', flexDirection:'column', gap:2}}>
      <span className="t-caption" style={{fontSize:10}}>{l}</span>
      <span className="t-mono" style={{fontSize:13, fontWeight:600, color:c || 'var(--text)'}}>{v}</span>
    </div>
  );
}

// ─── Sell tab ────────────────────────────────────────────
function SellTab() {
  return (
    <>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:14}}>
        <div>
          <span className="t-label">KENDİ OYUNCULARIN</span>
          <div className="t-h1" style={{marginTop:6, fontSize:28}}>Listele & Sat</div>
        </div>
      </div>
      <div style={{display:'flex', flexDirection:'column', gap:8}}>
        {SQUAD.slice(0, 10).map((p, i) => <SellRow key={i} p={p} idx={i}/>)}
      </div>
    </>
  );
}

function SellRow({ p, idx }) {
  const listed = p.status === 'listed';
  return (
    <GlassCard pad={14} style={{
      display:'grid',
      gridTemplateColumns:'44px 1.6fr 100px 70px 100px 1fr 120px',
      gap:14,
      alignItems:'center',
      animation:`slide-up 300ms ${idx*30}ms both var(--ease)`,
      borderColor: listed ? 'color-mix(in oklab, var(--warn) 35%, var(--border))' : undefined,
    }}>
      <div style={{position:'relative', width:44, height:44}}>
        <UserAvatar name={p.n} size={44}/>
        <div style={{position:'absolute', bottom:-2, right:-2, border:'2px solid var(--bg)', borderRadius:'50%'}}>
          <PosBadge pos={p.pos} size={18}/>
        </div>
      </div>
      <div style={{minWidth:0}}>
        <div style={{fontSize:14.5, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{p.n}</div>
        <div className="t-caption" style={{fontSize:11, marginTop:2}}>{p.role} · {p.age}y</div>
      </div>
      <OvrChip ovr={p.ovr} size="sm"/>
      <div style={{textAlign:'center'}}>
        <div className="t-mono" style={{fontSize:13, fontWeight:700}}>{p.form || '—'}</div>
        <div className="t-caption" style={{fontSize:10}}>form</div>
      </div>
      <Currency value={p.val} size={14} color="var(--emerald)"/>
      <div style={{display:'flex', alignItems:'center', gap:6}}>
        <span className="t-caption" style={{fontSize:10, whiteSpace:'nowrap'}}>Asking</span>
        <input type="number" className="input" defaultValue={Math.round(p.val/1_000_000)} style={{width:70, padding:'6px 8px', fontSize:12, fontFamily:'var(--f-mono)'}}/>
        <span className="t-caption" style={{fontSize:10}}>M€</span>
      </div>
      <div style={{display:'flex', justifyContent:'flex-end'}}>
        {listed ? (
          <button className="btn btn-sm btn-ghost" style={{color:'var(--danger)'}}>Kaldır</button>
        ) : (
          <button className="btn btn-sm btn-primary">Listele</button>
        )}
      </div>
    </GlassCard>
  );
}

function MyListRow({ p }) {
  if (!p) return null;
  return (
    <div className="glass" style={{padding:10, display:'grid', gridTemplateColumns:'auto 1fr auto', gap:10, alignItems:'center', border:'1px solid color-mix(in oklab, var(--warn) 30%, var(--border))'}}>
      <PosBadge pos={p.pos} size={22}/>
      <div style={{minWidth:0}}>
        <div style={{fontSize:12, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{p.n}</div>
        <div className="t-caption" style={{fontSize:10}}>OVR {p.ovr} · {p.age}y</div>
      </div>
      <Currency value={p.val} size={12} color="var(--warn)"/>
    </div>
  );
}

function ScoutActiveCard() {
  const [s, setS] = React.useState(6*3600 + 42*60 + 11);
  React.useEffect(() => { const i = setInterval(()=>setS(x => Math.max(0, x-1)), 1000); return () => clearInterval(i); }, []);
  const pct = 100 - (s / (12*3600)) * 100;
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sc = s%60;
  return (
    <div style={{display:'flex', alignItems:'center', gap:14, marginTop:8}}>
      <ProgressRing pct={pct} size={64}/>
      <div style={{flex:1}}>
        <div className="t-h3" style={{fontSize:13}}>🇧🇷 Brezilya · FWD · 18-24y</div>
        <div className="t-mono" style={{fontSize:14, color:'var(--warn)', marginTop:4}}>{String(h).padStart(2,'0')}:{String(m).padStart(2,'0')}:{String(sc).padStart(2,'0')}</div>
        <div className="t-caption" style={{fontSize:11, marginTop:2}}>kalan süre</div>
      </div>
      <button className="btn btn-ghost btn-sm">İptal</button>
    </div>
  );
}

function ProgressRing({ pct, size = 56, stroke = 4 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--accent)" strokeWidth={stroke} strokeDasharray={c} strokeDashoffset={c - (pct/100)*c} transform={`rotate(-90 ${size/2} ${size/2})`} strokeLinecap="round"/>
    </svg>
  );
}

function ScoutModal({ onClose }) {
  const toast = useToast();
  return (
    <div onClick={onClose} style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)', zIndex:200, display:'flex', justifyContent:'center', alignItems:'center'}}>
      <div onClick={e=>e.stopPropagation()} className="glass" style={{maxWidth:480, width:'100%', background:'var(--bg-2)', borderRadius:16, padding:24, animation:'slide-up 260ms var(--ease)'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16}}>
          <div><span className="t-label" style={{color:'var(--indigo)'}}>KAŞİF</span><div className="t-h2" style={{marginTop:6}}>Yeni Görev</div></div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><Icon name="close" size={16}/></button>
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:14}}>
          <Field label="Hedef ülke">
            <select className="input" defaultValue="BR"><option value="BR">🇧🇷 Brezilya</option><option value="AR">🇦🇷 Arjantin</option><option value="DE">🇩🇪 Almanya</option><option value="FR">🇫🇷 Fransa</option><option value="TR">🇹🇷 Türkiye</option></select>
          </Field>
          <Field label="Mevki">
            <select className="input" defaultValue="FWD"><option>GK</option><option>DEF</option><option>MID</option><option value="FWD">FWD</option></select>
          </Field>
          <Field label="Yaş aralığı · 18-24">
            <input type="range" min="17" max="35" defaultValue="24" style={{accentColor:'var(--accent)'}}/>
          </Field>
          <div style={{display:'flex', justifyContent:'space-between', padding:'8px 0'}}>
            <span className="text-muted">Maliyet</span>
            <Currency value={500000} size={14} color="var(--warn)"/>
          </div>
          <button className="btn btn-primary" style={{justifyContent:'center'}} onClick={()=>{toast({icon:'🛰', title:'Kaşif yollandı', body:'Brezilya görevi · ~8 saat sürer.', accent:'var(--indigo)'}); onClose();}}>
            Kaşifi Yolla (12 saat)
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { TransferMarket, ScoutModal });
