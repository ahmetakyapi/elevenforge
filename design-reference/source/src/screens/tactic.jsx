// Tactic Board — drag-drop formation

function TacticBoard({ goto }) {
  const [formation, setFormation] = React.useState('4-3-3');
  const [mentality, setMentality] = React.useState(3);
  const [pressing, setPressing] = React.useState(3);
  const [tempo, setTempo] = React.useState(2);
  const [preset, setPreset] = React.useState(0);
  const [dragging, setDragging] = React.useState(null);
  const [positions, setPositions] = React.useState(FORMATIONS['4-3-3']);
  const toast = useToast();

  React.useEffect(() => { setPositions(FORMATIONS[formation]); }, [formation]);

  const starters = SQUAD.filter(p => !['injured','suspended'].includes(p.status)).slice(0, 11);
  const bench = SQUAD.filter(p => !['injured','suspended'].includes(p.status)).slice(11, 18);

  const onDragStart = (i) => setDragging(i);
  const onPitchClick = (e) => {
    if (dragging === null) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPositions(prev => prev.map((p, i) => i === dragging ? { x, y } : p));
    setDragging(null);
  };

  return (
    <div style={{maxWidth:1400, margin:'0 auto', padding:'20px 28px'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:20, flexWrap:'wrap', gap:12}}>
        <div><span className="t-label">TAKTİK</span><div className="t-h1" style={{marginTop:6}}>İlk 11</div></div>
        <div style={{display:'flex', gap:8, alignItems:'center'}}>
          <span className="t-caption">Preset:</span>
          {['A','B','C','D','E','F','G'].map((l, i) => <button key={l} className={`chip ${preset===i?'active':''}`} onClick={()=>setPreset(i)} style={{cursor:'pointer', minWidth:28, padding:'4px 0', justifyContent:'center'}}>{l}</button>)}
          <button className="btn btn-primary" onClick={()=>{toast({icon:'✓', title:'Taktik kaydedildi', body:`Preset ${['A','B','C','D','E','F','G'][preset]} güncellendi.`, accent:'var(--emerald)'});}}>Kaydet</button>
        </div>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'260px 1fr 260px', gap:16, minHeight:600}}>
        {/* Left — formation + sliders */}
        <GlassCard pad={18} hover={false} style={{display:'flex', flexDirection:'column', gap:16}}>
          <div>
            <span className="t-label">DİZİLİŞ</span>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginTop:10}}>
              {Object.keys(FORMATIONS).map(f => (
                <button key={f} className={`chip ${formation===f?'active':''}`} onClick={()=>setFormation(f)} style={{cursor:'pointer', padding:'8px 12px', justifyContent:'center'}}>{f}</button>
              ))}
            </div>
          </div>
          <SliderControl label="MENTALİTE" labels={['Defansif','','Denge','','Saldırgan']} value={mentality} onChange={setMentality}/>
          <SliderControl label="PRESSING" labels={['Düşük','','Orta','','Yüksek']} value={pressing} onChange={setPressing}/>
          <SliderControl label="TEMPO"    labels={['Yavaş','','Normal','','Hızlı']} value={tempo} onChange={setTempo}/>
          <div style={{marginTop:'auto', padding:'10px 12px', borderRadius:10, background:'var(--panel-2)', border:'1px solid var(--border)'}}>
            <span className="t-caption" style={{fontSize:11}}>💡 Sürükle → pozisyon değişir. Çift tıkla → rol değişir.</span>
          </div>
        </GlassCard>

        {/* Pitch */}
        <GlassCard pad={0} hover={false} style={{overflow:'hidden', position:'relative', minHeight:600}}>
          <div onClick={onPitchClick} style={{
            position:'absolute', inset:0,
            background:'linear-gradient(180deg, color-mix(in oklab, #0a1e14 80%, var(--bg)) 0%, color-mix(in oklab, #051a10 80%, var(--bg)) 100%)',
            cursor: dragging !== null ? 'crosshair' : 'default',
          }}>
            <svg width="100%" height="100%" viewBox="0 0 600 800" preserveAspectRatio="none" style={{position:'absolute', inset:0, opacity:0.5}}>
              <g stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" fill="none">
                <rect x="20" y="20" width="560" height="760"/>
                <line x1="20" y1="400" x2="580" y2="400" strokeDasharray="4,4"/>
                <circle cx="300" cy="400" r="70"/>
                <rect x="140" y="20" width="320" height="150"/>
                <rect x="220" y="20" width="160" height="60"/>
                <rect x="140" y="630" width="320" height="150"/>
                <rect x="220" y="720" width="160" height="60"/>
              </g>
            </svg>
            {/* Player nodes */}
            {positions.map((p, i) => {
              const player = starters[i];
              if (!player) return null;
              return (
                <div key={i}
                  onMouseDown={(e) => { e.stopPropagation(); onDragStart(i); }}
                  style={{
                    position:'absolute', left:`${p.x}%`, top:`${p.y}%`,
                    transform:'translate(-50%, -50%)',
                    cursor: dragging === i ? 'grabbing' : 'grab',
                    userSelect:'none', transition: dragging === i ? 'none' : 'all var(--t) var(--ease)',
                    zIndex: dragging === i ? 10 : 1,
                  }}>
                  <PlayerNode player={player} highlighted={dragging === i}/>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Right — bench */}
        <GlassCard pad={18} hover={false} style={{display:'flex', flexDirection:'column', gap:10}}>
          <span className="t-label">YEDEKLER</span>
          {bench.map((p, i) => (
            <div key={i} className="glass" style={{padding:8, display:'flex', alignItems:'center', gap:8, border:'1px solid var(--border)'}}>
              <span className="t-mono" style={{fontSize:11, color:'var(--muted)', width:18}}>{p.num}</span>
              <PosBadge pos={p.pos} size={18}/>
              <span style={{fontSize:12, flex:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{p.n}</span>
              <OvrChip ovr={p.ovr} size="sm"/>
            </div>
          ))}
        </GlassCard>
      </div>
    </div>
  );
}

function PlayerNode({ player, highlighted }) {
  return (
    <div style={{
      display:'flex', flexDirection:'column', alignItems:'center', gap:4,
      filter: highlighted ? 'drop-shadow(0 0 12px var(--accent))' : 'none',
    }}>
      <div style={{
        width:44, height:44, borderRadius:'50%',
        background: `linear-gradient(135deg, ${posColor(player.pos)}, color-mix(in oklab, ${posColor(player.pos)} 40%, #0a0e1a))`,
        border: `2px solid ${highlighted ? 'var(--accent)' : 'rgba(255,255,255,0.3)'}`,
        display:'inline-flex', alignItems:'center', justifyContent:'center',
        fontFamily:'var(--font-mono)', fontWeight:700, fontSize:15, color:'#fff',
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
      }}>{player.num}</div>
      <div style={{
        background:'rgba(0,0,0,0.6)', padding:'2px 7px', borderRadius:6,
        fontSize:10, fontWeight:600, whiteSpace:'nowrap',
        color:'#fff',
      }}>{player.n}</div>
    </div>
  );
}

function SliderControl({ label, labels, value, onChange }) {
  return (
    <div>
      <span className="t-label">{label}</span>
      <div style={{display:'flex', gap:4, marginTop:10}}>
        {[0,1,2,3,4].map(i => (
          <button key={i} onClick={() => onChange(i)} style={{
            flex:1, height:30, borderRadius:6, cursor:'pointer', border:'1px solid var(--border)',
            background: i === value ? 'color-mix(in oklab, var(--accent) 30%, transparent)' : 'var(--panel)',
            color: i === value ? 'var(--accent)' : 'var(--muted)',
            fontFamily:'var(--font-mono)', fontWeight:600, fontSize:12, transition:'all var(--t) var(--ease)',
          }}>{i+1}</button>
        ))}
      </div>
      <div style={{display:'flex', justifyContent:'space-between', marginTop:6, fontSize:10, color:'var(--muted)'}}>
        <span>{labels[0]}</span><span>{labels[4]}</span>
      </div>
    </div>
  );
}

// Formation coordinates (x%, y%) — pitch is vertical, own goal at bottom
const FORMATIONS = {
  '4-3-3': [
    {x:50,y:88}, // GK
    {x:18,y:70},{x:38,y:74},{x:62,y:74},{x:82,y:70}, // back 4
    {x:30,y:50},{x:50,y:55},{x:70,y:50}, // mid 3
    {x:22,y:28},{x:50,y:20},{x:78,y:28}, // front 3
  ],
  '4-4-2': [
    {x:50,y:88},
    {x:18,y:70},{x:38,y:74},{x:62,y:74},{x:82,y:70},
    {x:18,y:50},{x:38,y:54},{x:62,y:54},{x:82,y:50},
    {x:38,y:22},{x:62,y:22},
  ],
  '3-5-2': [
    {x:50,y:88},
    {x:28,y:72},{x:50,y:76},{x:72,y:72},
    {x:14,y:54},{x:34,y:56},{x:50,y:60},{x:66,y:56},{x:86,y:54},
    {x:38,y:22},{x:62,y:22},
  ],
  '5-3-2': [
    {x:50,y:88},
    {x:12,y:66},{x:30,y:74},{x:50,y:78},{x:70,y:74},{x:88,y:66},
    {x:30,y:50},{x:50,y:54},{x:70,y:50},
    {x:38,y:22},{x:62,y:22},
  ],
  '4-2-3-1': [
    {x:50,y:88},
    {x:18,y:70},{x:38,y:74},{x:62,y:74},{x:82,y:70},
    {x:36,y:58},{x:64,y:58},
    {x:22,y:38},{x:50,y:40},{x:78,y:38},
    {x:50,y:18},
  ],
  '4-1-4-1': [
    {x:50,y:88},
    {x:18,y:70},{x:38,y:74},{x:62,y:74},{x:82,y:70},
    {x:50,y:58},
    {x:16,y:42},{x:38,y:44},{x:62,y:44},{x:84,y:42},
    {x:50,y:20},
  ],
};

Object.assign(window, { TacticBoard });
