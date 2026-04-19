// Team Dashboard — HERO screen. Hero countdown card, stat ribbon, widgets, activity feed.

function Dashboard({ goto }) {
  const me = USER_CLUB;
  const next = FIXTURES[0];
  const derby = next.home === USER_CLUB_ID && CLUBS.find(c => c.id === next.away)?.city === me.city;

  return (
    <div style={{display:'flex', flexDirection:'column', gap:20, padding:'20px 28px', maxWidth: 1400, margin:'0 auto'}}>
      {/* Top ribbon */}
      <div style={{display:'flex', alignItems:'center', gap:16, flexWrap:'wrap'}}>
        <div style={{display:'flex', alignItems:'center', gap:12}}>
          <Crest clubId={USER_CLUB_ID} size={44}/>
          <div>
            <div className="t-h2" style={{fontSize:19}}>{me.name}</div>
            <div className="t-small" style={{color:'var(--muted)'}}>Teknik Direktör · Baran Y.</div>
          </div>
        </div>
        <div style={{flex:1}}/>
        <StatChip label="KASA"    value={<span className="t-mono">€45.8M</span>} icon={<span style={{color:'var(--emerald)'}}>◉</span>}/>
        <StatChip label="MORAL"   value="4.3" icon="❤"/>
        <StatChip label="SIRALAMA" value="1."  icon={<span style={{color:'var(--gold)'}}>★</span>}/>
        <button className="btn" style={{position:'relative'}}>
          <Icon name="bell" size={16}/>
          <span style={{position:'absolute', top:-4, right:-4, width:16, height:16, borderRadius:'50%', background:'var(--danger)', color:'#fff', fontSize:10, fontWeight:700, display:'inline-flex', alignItems:'center', justifyContent:'center'}}>3</span>
        </button>
      </div>

      {/* Hero countdown card */}
      <GlassCard pad={0} hover={false} style={{overflow:'hidden', position:'relative'}}>
        <div style={{
          position:'absolute', inset:0, pointerEvents:'none',
          background:'radial-gradient(600px 300px at 20% 0%, color-mix(in oklab, var(--accent) 18%, transparent), transparent 60%), radial-gradient(600px 300px at 100% 100%, color-mix(in oklab, var(--accent-2) 14%, transparent), transparent 60%)'
        }}/>
        <div style={{position:'relative', padding:28, display:'grid', gridTemplateColumns:'1.2fr 1fr', gap:28, alignItems:'center'}}>
          <div style={{display:'flex', flexDirection:'column', gap:14}}>
            <div style={{display:'flex', alignItems:'center', gap:10}}>
              <span className="chip" style={{color:'var(--emerald)'}}>
                <span style={{width:6, height:6, borderRadius:'50%', background:'var(--emerald)'}}/>
                SONRAKİ MAÇ · {next.date}
              </span>
              {derby && <span className="chip" style={{color:'var(--gold)', borderColor:'color-mix(in oklab, var(--gold) 40%, var(--border))', background:'color-mix(in oklab, var(--gold) 10%, var(--panel))'}}>🔥 ŞEHİR DERBİSİ · 2× bahis</span>}
            </div>
            <div style={{display:'flex', alignItems:'center', gap:18, marginTop:4}}>
              <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:6}}>
                <Crest clubId={next.home} size={56}/>
                <span className="t-h3" style={{fontSize:14}}>{clubById(next.home).short}</span>
              </div>
              <div className="t-mono" style={{fontSize:28, color:'var(--muted)'}}>vs</div>
              <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:6}}>
                <Crest clubId={next.away} size={56}/>
                <span className="t-h3" style={{fontSize:14}}>{clubById(next.away).short}</span>
              </div>
              <div style={{flex:1}}/>
            </div>
            <div className="t-small" style={{color:'var(--muted)'}}>{next.venue} · 42.000 kapasite</div>
            <div style={{display:'flex', gap:10, marginTop:4}}>
              <button className="btn btn-primary" onClick={() => goto('tactic')}>Taktik Hazırla <Icon name="chev-right" size={14}/></button>
              <button className="btn" onClick={() => goto('match')}>Canlı Simülasyon</button>
            </div>
          </div>
          <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:10}}>
            <span className="t-label">KALAN SÜRE</span>
            <Countdown seconds={14*3600 + 23*60 + 7} size={52}/>
            <div className="t-small" style={{marginTop:4, color:'var(--muted)'}}>Simülasyon otomatik · saat 21:00'de canlı</div>
          </div>
        </div>
      </GlassCard>

      {/* Widgets row */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:16}}>
        <WidgetFixtures goto={goto}/>
        <WidgetPaper    goto={goto}/>
        <WidgetSquad    goto={goto}/>
        <WidgetFinance/>
      </div>

      {/* League table + activity split */}
      <div style={{display:'grid', gridTemplateColumns:'1.3fr 1fr', gap:16}}>
        <GlassCard pad={20} hover={false}>
          <SectionHead label="LİG TABLOSU" title="Kartel Crew · Sezon 3"
            right={<button className="btn btn-ghost btn-sm">Hafta 7 / 10</button>}/>
          <LeagueTable/>
        </GlassCard>
        <GlassCard pad={20} hover={false}>
          <SectionHead label="AKTİVİTE" title="Crew feed'i"
            right={<button className="btn btn-ghost btn-sm" onClick={()=>goto('chat')}>Tümünü gör</button>}/>
          <div style={{display:'flex', flexDirection:'column', gap:10, maxHeight: 400, overflowY:'auto', paddingRight:4}}>
            {GLOBAL_FEED.map((f, i) => (
              <div key={i} style={{display:'flex', gap:10, padding:'8px 2px'}}>
                <Crest clubId={f.clubId} size={22}/>
                <div style={{flex:1, minWidth:0}}>
                  <span style={{fontSize:13, color:'var(--text-2)', lineHeight:1.5}}>{f.text}</span>
                  <div className="t-caption" style={{marginTop:2}}>{f.t} önce</div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function WidgetFixtures({ goto }) {
  return (
    <GlassCard pad={18} onClick={()=>goto('tactic')}>
      <span className="t-label">SONRAKİ 3 MAÇ</span>
      <div style={{display:'flex', flexDirection:'column', gap:12, marginTop:12}}>
        {FIXTURES.map((f, i) => (
          <div key={i} style={{display:'flex', alignItems:'center', gap:10}}>
            <Crest clubId={f.home === USER_CLUB_ID ? f.away : f.home} size={22}/>
            <div style={{flex:1, minWidth:0}}>
              <div style={{fontSize:12, fontWeight:500, color:'var(--text)'}}>{f.home === USER_CLUB_ID ? 'vs' : '@'} {clubById(f.home === USER_CLUB_ID ? f.away : f.home).short}</div>
              <div className="t-caption" style={{fontSize:11}}>{f.date}</div>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

function WidgetPaper({ goto }) {
  return (
    <GlassCard pad={0} onClick={()=>goto('newspaper')} style={{overflow:'hidden', position:'relative'}}>
      <div style={{aspectRatio:'1.2', background:'linear-gradient(180deg, #dc2626 0%, #7f1d1d 120%)', padding:18, display:'flex', flexDirection:'column', justifyContent:'space-between'}}>
        <span className="t-label" style={{color:'rgba(255,255,255,0.75)', fontSize:10}}>Geçen hafta · Sezon 3 Hafta 6</span>
        <div>
          <div style={{fontFamily:'var(--font-display)', fontWeight:800, fontSize:22, lineHeight:0.95, color:'#fff', letterSpacing:'-0.02em'}}>DERBİDE TARİH</div>
          <div style={{fontSize:12, color:'rgba(255,255,255,0.85)', marginTop:4}}>İŞF 4-1 · Arda hat-trick</div>
        </div>
      </div>
      <div style={{padding:'10px 14px', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
        <span className="t-label" style={{fontSize:10}}>SON GAZETE</span>
        <Icon name="chev-right" size={14}/>
      </div>
    </GlassCard>
  );
}

function WidgetSquad({ goto }) {
  const inj = SQUAD.filter(p => p.status === 'injured').length;
  const sus = SQUAD.filter(p => p.status === 'suspended').length;
  const trn = SQUAD.filter(p => p.status === 'training').length;
  return (
    <GlassCard pad={18} onClick={()=>goto('squad')}>
      <span className="t-label">KADRO DURUMU</span>
      <div className="t-mono" style={{fontSize:26, fontWeight:600, marginTop:10}}>{SQUAD.length} / 25</div>
      <div className="t-small" style={{color:'var(--muted)', marginBottom:14}}>Aktif oyuncu</div>
      <div style={{display:'flex', flexDirection:'column', gap:6}}>
        <StatusRow icon="🩹" text="Sakat" count={inj} color="var(--danger)"/>
        <StatusRow icon="🟥" text="Cezalı" count={sus} color="var(--warn)"/>
        <StatusRow icon="💪" text="Antrenmanda" count={trn} color="var(--emerald)"/>
      </div>
    </GlassCard>
  );
}

function StatusRow({ icon, text, count, color }) {
  return (
    <div style={{display:'flex', alignItems:'center', gap:8, fontSize:12}}>
      <span>{icon}</span>
      <span style={{color:'var(--text-2)', flex:1}}>{text}</span>
      <span className="t-mono" style={{color, fontWeight:600}}>{count}</span>
    </div>
  );
}

function WidgetFinance() {
  return (
    <GlassCard pad={18} hover={false}>
      <span className="t-label">FİNANS</span>
      <div className="t-mono" style={{fontSize:26, fontWeight:600, marginTop:10, color:'var(--emerald)'}}>€45.8M</div>
      <div className="t-small" style={{color:'var(--muted)', marginBottom:14}}>Toplam bakiye</div>
      <div style={{display:'flex', flexDirection:'column', gap:6, fontSize:12}}>
        <div style={{display:'flex', justifyContent:'space-between'}}><span className="text-muted">Hafta geliri</span><span className="t-mono" style={{color:'var(--emerald)'}}>+€3.2M</span></div>
        <div style={{display:'flex', justifyContent:'space-between'}}><span className="text-muted">Maaşlar</span><span className="t-mono" style={{color:'var(--danger)'}}>-€1.8M</span></div>
        <div style={{display:'flex', justifyContent:'space-between'}}><span className="text-muted">Banka faizi</span><span className="t-mono" style={{color:'var(--emerald)'}}>+€42K</span></div>
      </div>
    </GlassCard>
  );
}

function LeagueTable() {
  const data = LEAGUE_TABLE;
  return (
    <div style={{borderRadius:12, overflow:'hidden'}}>
      <div style={{display:'grid', gridTemplateColumns:'32px 1fr 36px 36px 36px 36px 50px 120px', gap:10, padding:'8px 4px', alignItems:'center'}}>
        {['#','Kulüp','O','G','B','M','P','Form'].map((h, i) => (
          <span key={i} className="t-label" style={{fontSize:10, textAlign: i > 1 && i < 7 ? 'center' : 'left'}}>{h}</span>
        ))}
      </div>
      {data.map((row, i) => {
        const c = clubById(row.clubId);
        const isMe = row.clubId === USER_CLUB_ID;
        return (
          <div key={i} style={{
            display:'grid', gridTemplateColumns:'32px 1fr 36px 36px 36px 36px 50px 120px', gap:10, padding:'8px 4px', alignItems:'center',
            background: isMe ? 'color-mix(in oklab, var(--accent) 8%, transparent)' : 'transparent',
            borderRadius: 8,
            transition:'background var(--t) var(--ease)',
          }}>
            <span className="t-mono" style={{color: i < 3 ? 'var(--gold)' : 'var(--muted)', fontSize:13}}>{i+1}</span>
            <div style={{display:'flex', alignItems:'center', gap:8, minWidth:0}}>
              <Crest clubId={row.clubId} size={22}/>
              <span style={{fontSize:13, fontWeight: isMe ? 600 : 500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{c.name}</span>
            </div>
            {[row.p, row.w, row.d, row.l].map((v,j) => <span key={j} className="t-mono" style={{textAlign:'center', fontSize:13, color:'var(--text-2)'}}>{v}</span>)}
            <span className="t-mono" style={{textAlign:'center', fontSize:13, fontWeight:600, color: i < 4 ? 'var(--emerald)' : 'var(--text)'}}>{row.pts}</span>
            <div style={{display:'flex', gap:3}}>
              {row.form.map((r,j) => <FormDot key={j} result={r}/>)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

Object.assign(window, { Dashboard });
