// League Lobby — create/join, 3-step wizard, 4x4 slot grid

function Lobby({ goto }) {
  const [mode, setMode] = React.useState(null); // null | 'create' | 'join' | 'wait'
  if (!mode) return <LobbyEntry setMode={setMode}/>;
  if (mode === 'create') return <CreateWizard onDone={() => setMode('wait')} onBack={() => setMode(null)}/>;
  if (mode === 'join') return <JoinFlow onBack={() => setMode(null)} goto={goto}/>;
  if (mode === 'wait') return <SlotGrid goto={goto}/>;
}

function LobbyEntry({ setMode }) {
  return (
    <div style={{maxWidth:1100, margin:'0 auto', padding:'48px 24px'}}>
      <span className="t-label" style={{color:'var(--indigo)'}}>LİG</span>
      <div className="t-h1" style={{marginTop:8}}>Ligine başla.</div>
      <div style={{color:'var(--muted)', fontSize:15, marginTop:8, maxWidth:560}}>Yeni bir lig kur ve arkadaşlarını davet et, ya da bir davet kodu kullanarak hazır bir lige katıl.</div>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginTop:36}}>
        <GlassCard pad={28} onClick={()=>setMode('create')} style={{minHeight: 220, position:'relative', overflow:'hidden'}}>
          <BigIconBadge icon="spark" color="var(--indigo)"/>
          <div className="t-h2" style={{marginTop:18}}>Yeni Lig Kur</div>
          <div style={{color:'var(--muted)', marginTop:6}}>16 slotlu özel lig. Sezon uzunluğu, maç saati ve görünürlüğü sen belirle.</div>
          <div style={{position:'absolute', top:20, right:20, display:'flex', gap:6}}>
            <span className="chip" style={{fontSize:11}}>3 dk</span>
          </div>
        </GlassCard>
        <GlassCard pad={28} onClick={()=>setMode('join')} style={{minHeight: 220, position:'relative', overflow:'hidden'}}>
          <BigIconBadge icon="link" color="var(--emerald)"/>
          <div className="t-h2" style={{marginTop:18}}>Davet Kodu ile Katıl</div>
          <div style={{color:'var(--muted)', marginTop:6}}>Arkadaşının gönderdiği 6 haneli kodu gir, hemen oynamaya başla.</div>
        </GlassCard>
      </div>
      <div style={{marginTop:32, display:'flex', flexDirection:'column', gap:12}}>
        <span className="t-label">DEVAM EDEN LİGLER</span>
        <GlassCard pad={16} hover={false}>
          <div style={{display:'flex', alignItems:'center', gap:16}}>
            <Crest clubId="ist" size={40}/>
            <div style={{flex:1}}>
              <div className="t-h3">Kartel Crew · Sezon 3</div>
              <div className="t-small">Hafta 7 / 10 · Sonraki maç yarın 21:00</div>
            </div>
            <span className="chip active">1. sırada</span>
            <span className="t-mono" style={{color:'var(--muted)'}}>16 kişi</span>
            <button className="btn btn-primary btn-sm" onClick={()=>setMode('wait')}>Devam Et</button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function BigIconBadge({ icon, color }) {
  return (
    <div style={{
      width:54, height:54, borderRadius:14,
      background:`color-mix(in oklab, ${color} 18%, transparent)`,
      border:`1px solid color-mix(in oklab, ${color} 38%, transparent)`,
      color, display:'inline-flex', alignItems:'center', justifyContent:'center',
    }}><Icon name={icon} size={24}/></div>
  );
}

function CreateWizard({ onDone, onBack }) {
  const [step, setStep] = React.useState(0);
  const [name, setName] = React.useState('Kartel Crew');
  const [color, setColor] = React.useState('#dc2626');
  const [len, setLen] = React.useState(5);
  const [time, setTime] = React.useState('21:00');
  const [vis, setVis] = React.useState('private');
  const steps = ['İsim + Renk', 'Sezon + Saat', 'Görünürlük'];
  const done = step === 3;
  return (
    <div style={{maxWidth:780, margin:'0 auto', padding:'40px 24px'}}>
      <button className="btn btn-ghost btn-sm" onClick={onBack}><Icon name="chev-left" size={14}/> Geri</button>
      <div style={{display:'flex', gap:10, marginTop:20, marginBottom:28}}>
        {steps.map((s, i) => (
          <div key={i} style={{flex:1, display:'flex', flexDirection:'column', gap:6}}>
            <div style={{height:3, borderRadius:3, background: i <= step ? 'var(--accent)' : 'var(--border)'}}/>
            <span className={i === step ? 't-h3' : 't-caption'} style={{fontSize:12}}>{i+1}. {s}</span>
          </div>
        ))}
      </div>
      <GlassCard pad={32} hover={false}>
        {step === 0 && (
          <div style={{display:'flex', flexDirection:'column', gap:20}}>
            <Field label="Lig adı"><input className="input" value={name} onChange={e=>setName(e.target.value)}/></Field>
            <div>
              <span className="t-label">Lig rengi</span>
              <div style={{display:'flex', gap:10, marginTop:10, flexWrap:'wrap'}}>
                {['#dc2626','#ea580c','#facc15','#10b981','#22d3ee','#6366f1','#a855f7','#ec4899'].map(c => (
                  <button key={c} onClick={()=>setColor(c)} style={{
                    width:36, height:36, borderRadius:'50%',
                    background: c, border: color === c ? '3px solid var(--text)' : '1px solid var(--border)',
                    cursor:'pointer', outline:'none',
                  }}/>
                ))}
              </div>
            </div>
          </div>
        )}
        {step === 1 && (
          <div style={{display:'flex', flexDirection:'column', gap:20}}>
            <div>
              <span className="t-label">Sezon uzunluğu</span>
              <div style={{display:'flex', gap:10, marginTop:10}}>
                {[4,5,6].map(v => (
                  <button key={v} className={`chip ${len === v ? 'active' : ''}`} onClick={()=>setLen(v)} style={{padding:'10px 20px', fontSize:14, cursor:'pointer'}}>{v} hafta</button>
                ))}
              </div>
            </div>
            <Field label="Maç saati (her gün)"><input className="input" value={time} onChange={e=>setTime(e.target.value)}/></Field>
          </div>
        )}
        {step === 2 && (
          <div style={{display:'flex', flexDirection:'column', gap:16}}>
            <VisOption id="private" label="Davet-only" desc="Sadece link ile katılanlar görür." active={vis==='private'} onClick={()=>setVis('private')} icon="link"/>
            <VisOption id="public"  label="Herkese açık" desc="Keşfet ekranında listelenir." active={vis==='public'}  onClick={()=>setVis('public')}  icon="compass"/>
          </div>
        )}
        {step === 3 && (
          <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:20, padding:'20px 0'}}>
            <div style={{width:56, height:56, borderRadius:'50%', background:'color-mix(in oklab, var(--emerald) 20%, transparent)', border:'1px solid color-mix(in oklab, var(--emerald) 40%, transparent)', color:'var(--emerald)', display:'inline-flex', alignItems:'center', justifyContent:'center'}}><Icon name="check" size={28}/></div>
            <div className="t-h2">Lig kuruldu</div>
            <GlassCard pad={14} hover={false} style={{display:'flex', alignItems:'center', gap:10, minWidth:360}}>
              <Icon name="link" size={16}/>
              <span className="t-mono" style={{flex:1}}>elevenforge.app/j/K4R73L</span>
              <button className="btn btn-sm btn-primary">Kopyala</button>
            </GlassCard>
          </div>
        )}
        <div style={{display:'flex', justifyContent:'space-between', marginTop:28}}>
          <button className="btn btn-ghost" onClick={() => step > 0 ? setStep(step-1) : onBack()}><Icon name="chev-left" size={14}/> Geri</button>
          {step < 3 ? (
            <button className="btn btn-primary" onClick={() => setStep(step+1)}>İleri <Icon name="chev-right" size={14}/></button>
          ) : (
            <button className="btn btn-primary" onClick={onDone}>Lobi'ye Git <Icon name="arrow-right" size={14}/></button>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

function VisOption({ label, desc, active, onClick, icon }) {
  return (
    <GlassCard pad={18} onClick={onClick} style={{
      display:'flex', gap:14, alignItems:'center',
      borderColor: active ? 'color-mix(in oklab, var(--accent) 40%, var(--border))' : 'var(--border)',
      background: active ? 'color-mix(in oklab, var(--accent) 8%, var(--panel))' : 'var(--panel)',
    }}>
      <Icon name={icon} size={20}/>
      <div style={{flex:1}}>
        <div className="t-h3">{label}</div>
        <div className="t-small">{desc}</div>
      </div>
      {active && <Icon name="check" size={16}/>}
    </GlassCard>
  );
}

function JoinFlow({ onBack, goto }) {
  const [code, setCode] = React.useState('K4R73L');
  return (
    <div style={{maxWidth:480, margin:'0 auto', padding:'80px 24px'}}>
      <button className="btn btn-ghost btn-sm" onClick={onBack}><Icon name="chev-left" size={14}/> Geri</button>
      <div className="t-h1" style={{marginTop:20}}>Davet kodu</div>
      <div style={{color:'var(--muted)', fontSize:14, marginTop:6}}>Arkadaşın sana 6 haneli bir kod yolladı.</div>
      <input className="input valid" style={{marginTop:28, fontFamily:'var(--font-mono)', fontSize:24, textAlign:'center', letterSpacing:'0.4em', padding:'20px 16px'}} value={code} onChange={e=>setCode(e.target.value.toUpperCase())}/>
      <button className="btn btn-primary btn-lg" style={{marginTop:16, width:'100%', justifyContent:'center'}} onClick={()=>goto('dashboard')}>Katıl</button>
    </div>
  );
}

function SlotGrid({ goto }) {
  const slots = [...CREW];
  return (
    <div style={{maxWidth:1100, margin:'0 auto', padding:'40px 24px'}}>
      <div style={{display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:20, gap:12}}>
        <div>
          <span className="t-label">LİG LOBİSİ</span>
          <div className="t-h1" style={{marginTop:8}}>Kartel Crew</div>
          <div className="t-small" style={{marginTop:4}}>{CREW.filter(c=>!c.bot).length} insan · {CREW.filter(c=>c.bot).length} bot · 16 / 16 dolu</div>
        </div>
        <div style={{display:'flex', gap:10, alignItems:'center'}}>
          <GlassCard pad={12} hover={false} style={{display:'flex', alignItems:'center', gap:8}}>
            <Icon name="link" size={14}/>
            <span className="t-mono" style={{fontSize:13}}>elevenforge.app/j/K4R73L</span>
          </GlassCard>
          <button className="btn btn-primary btn-lg" onClick={()=>goto('dashboard')}>Lige Başla <Icon name="arrow-right" size={14}/></button>
        </div>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12}}>
        {slots.map((m, i) => {
          const c = clubById(m.clubId);
          return (
            <GlassCard key={i} pad={14} style={{display:'flex', alignItems:'center', gap:12, minHeight: 72}}>
              <Crest clubId={m.clubId} size={36}/>
              <div style={{display:'flex', flexDirection:'column', gap:2, flex:1, minWidth:0}}>
                <div style={{display:'flex', alignItems:'center', gap:6}}>
                  <span className="t-h3" style={{fontSize:14, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{m.name}</span>
                  {m.isUser && <span className="chip active" style={{fontSize:10, padding:'2px 6px'}}>SEN</span>}
                  {m.bot && <span className="chip" style={{fontSize:10, padding:'2px 6px', color:'var(--muted)'}}>BOT</span>}
                </div>
                <span className="t-small" style={{fontSize:12, color:'var(--muted)'}}>{c.name}</span>
              </div>
              {!m.bot && <span style={{width:8, height:8, borderRadius:'50%', background: m.online ? 'var(--emerald)' : 'var(--muted-2)', flexShrink:0}}/>}
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { Lobby });
