// Live Match screen — scoreboard, AI commentary feed, stats, crowd viz

function LiveMatch({ goto }) {
  const [minute, setMinute] = React.useState(LIVE_MATCH.minute);
  const [score, setScore] = React.useState({ h: LIVE_MATCH.scoreH, a: LIVE_MATCH.scoreA });
  const [feed, setFeed] = React.useState(COMMENTARY);
  const [crowd, setCrowd] = React.useState(LIVE_MATCH.crowdEnergy);
  const [tab, setTab] = React.useState('feed');
  const [ballPos, setBallPos] = React.useState({x:55, y:48});
  const toast = useToast();

  // Tick minute + shift ball position
  React.useEffect(() => {
    const iv = setInterval(() => {
      setMinute(m => Math.min(90, m + 1));
      setBallPos(() => ({x: 20 + Math.random()*60, y: 25 + Math.random()*50}));
      setCrowd(c => Math.max(45, Math.min(98, c + (Math.random()-0.5)*8)));
    }, 4200);
    return () => clearInterval(iv);
  }, []);

  const home = clubById(LIVE_MATCH.home), away = clubById(LIVE_MATCH.away);

  return (
    <div style={{maxWidth:1400, margin:'0 auto', padding:'16px 24px'}}>
      {/* Scoreboard */}
      <GlassCard pad={0} hover={false} style={{overflow:'hidden', position:'relative', marginBottom:16}}>
        <div style={{position:'absolute', top:0, left:0, right:0, height:40, overflow:'hidden', opacity:0.5}}>
          <CrowdWaveform energy={crowd}/>
        </div>
        <div style={{padding:'22px 28px', display:'grid', gridTemplateColumns:'1fr 280px 1fr', alignItems:'center', gap:20, position:'relative'}}>
          <div style={{display:'flex', alignItems:'center', gap:16}}>
            <Crest clubId={LIVE_MATCH.home} size={56}/>
            <div><div className="t-h2" style={{fontSize:18}}>{home.name}</div><div className="t-caption">Ev sahibi · %{LIVE_MATCH.possessionH}</div></div>
          </div>
          <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:4}}>
            <div style={{display:'flex', alignItems:'center', gap:14}}>
              <span className="t-mono" style={{fontSize:54, fontWeight:700, color:'var(--text)', letterSpacing:'-0.02em'}}>{score.h}</span>
              <span style={{fontSize:24, color:'var(--muted)'}}>−</span>
              <span className="t-mono" style={{fontSize:54, fontWeight:700, color:'var(--text)', letterSpacing:'-0.02em'}}>{score.a}</span>
            </div>
            <div style={{display:'flex', alignItems:'center', gap:8, marginTop:2}}>
              <span style={{width:8, height:8, borderRadius:'50%', background:'var(--emerald)', animation:'pulse-accent 1.5s ease-in-out infinite'}}/>
              <span className="t-mono" style={{fontSize:14, color:'var(--emerald)', letterSpacing:'0.1em'}}>{minute}' CANLI</span>
            </div>
            <PitchMini pos={ballPos}/>
          </div>
          <div style={{display:'flex', alignItems:'center', gap:16, justifyContent:'flex-end'}}>
            <div style={{textAlign:'right'}}><div className="t-h2" style={{fontSize:18}}>{away.name}</div><div className="t-caption">Deplasman · %{LIVE_MATCH.possessionA}</div></div>
            <Crest clubId={LIVE_MATCH.away} size={56}/>
          </div>
        </div>
      </GlassCard>

      <div style={{display:'grid', gridTemplateColumns:'1fr 360px', gap:16}}>
        {/* Commentary */}
        <GlassCard pad={0} hover={false} style={{overflow:'hidden', maxHeight: 'calc(100vh - 260px)', display:'flex', flexDirection:'column'}}>
          <div style={{padding:'14px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
            <div style={{display:'flex', alignItems:'center', gap:10}}>
              <div style={{width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg, var(--indigo), var(--emerald))', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'#fff', fontWeight:700}}>AI</div>
              <span className="t-h3" style={{fontSize:14}}>Canlı Anlatım</span>
            </div>
            <button className="btn btn-ghost btn-sm">Neden? <Icon name="chev-right" size={12}/></button>
          </div>
          <div style={{flex:1, overflowY:'auto', padding:'14px 20px', display:'flex', flexDirection:'column', gap:12}}>
            {feed.map((c, i) => <CommentaryItem key={i} c={c} idx={i}/>)}
          </div>
          {/* Quick actions */}
          <div style={{padding:'12px 20px', borderTop:'1px solid var(--border)', display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8}}>
            <button className="btn btn-sm" style={{justifyContent:'center'}}>Değişiklik</button>
            <button className="btn btn-sm" style={{justifyContent:'center'}}>Dizilişi Değiştir</button>
            <button className="btn btn-sm" style={{justifyContent:'center'}} onClick={()=>{setCrowd(95); toast({icon:'📣', title:'Taraftar coştu!', body:'Crowd energy +20', accent:'var(--gold)'});}}>📣 Taraftarı Coştur</button>
            <button className="btn btn-sm" style={{justifyContent:'center'}}>Taktik Notu</button>
          </div>
        </GlassCard>

        {/* Stats drawer */}
        <GlassCard pad={0} hover={false} style={{overflow:'hidden', alignSelf:'start'}}>
          <div style={{padding:'12px 16px', borderBottom:'1px solid var(--border)', display:'flex', gap:4}}>
            {[['feed','Canlı'],['stats','İstatistik'],['rtng','Rating']].map(([k,l]) => <button key={k} className={`chip ${tab===k?'active':''}`} onClick={()=>setTab(k)} style={{cursor:'pointer'}}>{l}</button>)}
          </div>
          <div style={{padding:16}}>
            {tab === 'stats' && <StatsPanel/>}
            {tab === 'rtng' && <RatingsPanel/>}
            {tab === 'feed' && (
              <div>
                <span className="t-label">TARAFTAR ENERJİSİ</span>
                <div className="t-mono" style={{fontSize:32, color:'var(--gold)', marginTop:10, marginBottom:4}}>{Math.round(crowd)}</div>
                <Bar value={crowd} color="var(--gold)" height={6}/>
                <div style={{marginTop:16}}>
                  <span className="t-label">SON OLAYLAR</span>
                  <div style={{display:'flex', flexDirection:'column', gap:6, marginTop:10}}>
                    {COMMENTARY.filter(c=>c.type==='goal' || c.type==='card').slice(0,4).map((c, i) => (
                      <div key={i} style={{display:'flex', alignItems:'center', gap:8, fontSize:12}}>
                        <span className="t-mono" style={{fontSize:11, color:'var(--muted)', minWidth:24}}>{c.m}'</span>
                        <span>{c.icon}</span>
                        <span className="t-caption" style={{flex:1}}>{c.type === 'goal' ? 'Gol' : 'Sarı kart'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function CommentaryItem({ c, idx }) {
  const color = c.type === 'goal' ? 'var(--emerald)' : c.type === 'card' ? 'var(--warn)' : c.type === 'shot' ? 'var(--cyan)' : 'var(--muted)';
  const label = c.type === 'goal' ? 'GOL' : c.type === 'card' ? 'KART' : c.type === 'shot' ? 'ŞUT' : c.type === 'sub' ? 'DEĞİŞİKLİK' : c.type === 'half' ? 'DEVRE' : c.type === 'start' ? 'BAŞLANGIÇ' : 'ANALİZ';
  return (
    <div className="anim-slide-up" style={{display:'flex', gap:12, alignItems:'flex-start'}}>
      <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:4, minWidth:48}}>
        <span className="t-mono" style={{fontSize:12, color:'var(--muted)'}}>{c.m}'</span>
        <span style={{fontSize:18}}>{c.icon}</span>
      </div>
      <div style={{flex:1, background: c.type === 'goal' ? `color-mix(in oklab, ${color} 8%, var(--panel))` : 'var(--panel-2)', padding:'10px 14px', borderRadius:12, border:`1px solid ${c.type === 'goal' ? `color-mix(in oklab, ${color} 30%, var(--border))` : 'var(--border)'}`}}>
        <span className="t-label" style={{color, fontSize:10}}>{label}</span>
        <div style={{fontSize:14, lineHeight:1.55, color:'var(--text)', marginTop:4}}>{c.text}</div>
      </div>
    </div>
  );
}

function PitchMini({ pos }) {
  return (
    <svg width="160" height="64" viewBox="0 0 200 80" style={{marginTop:10}}>
      <rect x="1" y="1" width="198" height="78" fill="none" stroke="var(--border-strong)" strokeWidth="1" rx="4"/>
      <line x1="100" y1="1" x2="100" y2="79" stroke="var(--border)" strokeWidth="0.8"/>
      <circle cx="100" cy="40" r="10" fill="none" stroke="var(--border)" strokeWidth="0.8"/>
      <rect x="1" y="22" width="20" height="36" fill="none" stroke="var(--border)" strokeWidth="0.8"/>
      <rect x="179" y="22" width="20" height="36" fill="none" stroke="var(--border)" strokeWidth="0.8"/>
      <circle cx={pos.x * 2} cy={pos.y * 0.8} r="3" fill="var(--gold)" style={{transition:'all 400ms var(--ease-out)', filter:'drop-shadow(0 0 4px var(--gold))'}}/>
    </svg>
  );
}

function CrowdWaveform({ energy }) {
  const bars = 60;
  return (
    <div style={{display:'flex', gap:2, height:40, padding:'0 20px', alignItems:'center'}}>
      {Array.from({length: bars}).map((_, i) => {
        const h = 8 + Math.sin(i * 0.4 + Date.now() / 500) * 6 + (energy / 100) * 16;
        return <div key={i} style={{flex:1, height: `${Math.abs(h)}px`, background:'color-mix(in oklab, var(--gold) 30%, transparent)', borderRadius:1}}/>;
      })}
    </div>
  );
}

function StatsPanel() {
  const stats = [
    ['Topla oynama', LIVE_MATCH.possessionH, LIVE_MATCH.possessionA, true],
    ['Şut', LIVE_MATCH.shotsH, LIVE_MATCH.shotsA],
    ['İsabetli şut', LIVE_MATCH.shotsOnH, LIVE_MATCH.shotsOnA],
    ['Korner', LIVE_MATCH.cornersH, LIVE_MATCH.cornersA],
    ['Kart', LIVE_MATCH.cardsH, LIVE_MATCH.cardsA],
  ];
  return (
    <div style={{display:'flex', flexDirection:'column', gap:14}}>
      {stats.map(([l, h, a, pct], i) => (
        <div key={i}>
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:4}}>
            <span className="t-mono" style={{fontSize:13, color: h > a ? 'var(--emerald)':'var(--text)'}}>{h}{pct?'%':''}</span>
            <span className="t-caption" style={{fontSize:11}}>{l}</span>
            <span className="t-mono" style={{fontSize:13, color: a > h ? 'var(--emerald)':'var(--text)'}}>{a}{pct?'%':''}</span>
          </div>
          <div style={{display:'flex', height:4, borderRadius:2, overflow:'hidden', background:'var(--border)'}}>
            <div style={{flex: h, background:'var(--indigo)'}}/>
            <div style={{width:1, background:'var(--bg)'}}/>
            <div style={{flex: a, background:'var(--emerald)'}}/>
          </div>
        </div>
      ))}
    </div>
  );
}

function RatingsPanel() {
  return (
    <div style={{display:'flex', flexDirection:'column', gap:8}}>
      {SQUAD.slice(0, 7).map((p, i) => (
        <div key={i} style={{display:'flex', alignItems:'center', gap:10, fontSize:12}}>
          <span className="t-mono" style={{width:18, color:'var(--muted)'}}>{p.num}</span>
          <span style={{flex:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{p.n}</span>
          <RatingDot rating={p.form[4]} size={24}/>
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { LiveMatch });
