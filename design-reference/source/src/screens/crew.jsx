// Crew Chat + Global Feed (split landscape) + roster

function Crew({ goto }) {
  const [msgs, setMsgs] = React.useState(CHAT);
  const [input, setInput] = React.useState('');
  const send = () => {
    if (!input.trim()) return;
    const now = new Date();
    setMsgs([...msgs, { from: 'u1', text: input, t: `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}` }]);
    setInput('');
  };
  return (
    <div style={{maxWidth:1400, margin:'0 auto', padding:'20px 28px'}}>
      {/* Roster */}
      <GlassCard pad={12} hover={false} style={{marginBottom:16, display:'flex', gap:10, overflowX:'auto', alignItems:'center'}}>
        <span className="t-label" style={{marginRight:10, whiteSpace:'nowrap'}}>KARTEL CREW</span>
        {CREW.map(m => (
          <div key={m.id} style={{display:'flex', alignItems:'center', gap:6, padding:'4px 8px', borderRadius:999, background:'var(--panel-2)', border:'1px solid var(--border)', whiteSpace:'nowrap'}}>
            <Crest clubId={m.clubId} size={18}/>
            <span style={{fontSize:12, fontWeight:500}}>{m.name.split(' ')[0]}</span>
            {!m.bot && <span style={{width:6, height:6, borderRadius:'50%', background: m.online ? 'var(--emerald)' : 'var(--muted-2)'}}/>}
          </div>
        ))}
      </GlassCard>
      <div style={{display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:16, minHeight: 640}}>
        {/* Chat */}
        <GlassCard pad={0} hover={false} style={{overflow:'hidden', display:'flex', flexDirection:'column'}}>
          <div style={{padding:'14px 18px', borderBottom:'1px solid var(--border)'}}>
            <span className="t-label">#genel</span>
            <div className="t-h3" style={{marginTop:2}}>Crew sohbeti</div>
          </div>
          <div style={{flex:1, overflowY:'auto', padding:'16px 18px', display:'flex', flexDirection:'column', gap:12}}>
            {msgs.map((m, i) => {
              const user = CREW.find(c => c.id === m.from);
              const isMe = user?.isUser;
              return (
                <div key={i} style={{display:'flex', gap:10, flexDirection: isMe ? 'row-reverse' : 'row'}}>
                  <Crest clubId={user.clubId} size={28}/>
                  <div style={{maxWidth:'70%'}}>
                    <div style={{display:'flex', gap:6, alignItems:'center', marginBottom:4, justifyContent: isMe ? 'flex-end' : 'flex-start'}}>
                      <span style={{fontSize:12, fontWeight:600}}>{user.name}</span>
                      <span className="t-caption" style={{fontSize:10}}>{m.t}</span>
                    </div>
                    <div style={{
                      padding:'10px 14px', borderRadius:12, fontSize:14, lineHeight:1.5,
                      background: isMe ? 'color-mix(in oklab, var(--accent) 16%, var(--panel))' : 'var(--panel-2)',
                      border:`1px solid ${isMe ? 'color-mix(in oklab, var(--accent) 30%, var(--border))' : 'var(--border)'}`,
                    }}>{m.text}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{padding:'12px 18px', borderTop:'1px solid var(--border)', display:'flex', gap:8, alignItems:'center'}}>
            <div style={{display:'flex', gap:2}}>
              {['⚽','🔥','💎','🏆','🟨','🟥','😂','💀'].map(e => <button key={e} className="btn btn-ghost btn-sm" style={{padding:'4px 8px', fontSize:15}} onClick={()=>setInput(input + e)}>{e}</button>)}
            </div>
            <input className="input" placeholder="Mesajını yaz…" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter' && send()}/>
            <button className="btn btn-primary" onClick={send}>Gönder</button>
          </div>
        </GlassCard>

        {/* Global Feed */}
        <GlassCard pad={0} hover={false} style={{overflow:'hidden', display:'flex', flexDirection:'column'}}>
          <div style={{padding:'14px 18px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:8}}>
            <span className="t-label">PAYLAŞILAN EVREN</span>
            <span style={{width:6, height:6, borderRadius:'50%', background:'var(--emerald)', animation:'pulse-accent 2s ease-in-out infinite', marginLeft:4}}/>
          </div>
          <div style={{flex:1, overflowY:'auto'}}>
            {GLOBAL_FEED.map((f, i) => (
              <div key={i} style={{
                padding:'14px 18px', borderBottom: i < GLOBAL_FEED.length-1 ? '1px solid var(--border)' : 'none',
                display:'flex', gap:12, cursor:'pointer', transition:'background var(--t) var(--ease)',
              }} onMouseEnter={e=>e.currentTarget.style.background='var(--panel-2)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <div style={{width:28, height:28, borderRadius:8, background: FEED_ICON[f.type].bg, color: FEED_ICON[f.type].c, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
                  <Icon name={FEED_ICON[f.type].icon} size={14}/>
                </div>
                <div style={{flex:1, minWidth:0}}>
                  <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:3}}>
                    <Crest clubId={f.clubId} size={16}/>
                    <span className="t-caption" style={{fontSize:11}}>{f.t} önce</span>
                  </div>
                  <span style={{fontSize:13.5, color:'var(--text-2)', lineHeight:1.5}}>{f.text}</span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

const FEED_ICON = {
  transfer: { icon:'swap',    bg:'color-mix(in oklab, var(--indigo) 18%, transparent)',  c:'var(--indigo)' },
  match:    { icon:'trophy',  bg:'color-mix(in oklab, var(--gold) 18%, transparent)',    c:'var(--gold)' },
  scout:    { icon:'compass', bg:'color-mix(in oklab, var(--cyan) 18%, transparent)',    c:'var(--cyan)' },
  paper:    { icon:'paper',   bg:'color-mix(in oklab, var(--emerald) 18%, transparent)', c:'var(--emerald)' },
  morale:   { icon:'spark',   bg:'color-mix(in oklab, var(--warn) 18%, transparent)',    c:'var(--warn)' },
};

Object.assign(window, { Crew });
