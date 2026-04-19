// Post-Match Newspaper — 90s football magazine aesthetic

function Newspaper({ goto }) {
  const [tab, setTab] = React.useState('cover');
  return (
    <div style={{maxWidth: 1100, margin:'0 auto', padding:'20px 24px'}}>
      {/* Tabs */}
      <div style={{display:'flex', gap:6, marginBottom:16, flexWrap:'wrap'}}>
        {[['cover','Kapak'],['totw','Haftanın 11\'i'],['stats','Gol & Asist'],['press','Basın Odası'],['fun','Köşe']].map(([k,l])=>(
          <button key={k} className={`chip ${tab===k?'active':''}`} onClick={()=>setTab(k)} style={{cursor:'pointer', padding:'8px 14px', fontSize:13}}>{l}</button>
        ))}
      </div>

      {tab === 'cover' && <NewspaperCoverPage/>}
      {tab === 'totw' && <TOTWPage/>}
      {tab === 'stats' && <ScorersPage/>}
      {tab === 'press' && <PressRoom goto={goto}/>}
      {tab === 'fun' && <FunPage/>}
    </div>
  );
}

function NewspaperCoverPage() {
  return (
    <div style={{
      background:'#e8e0cf', color:'#1a0f08', borderRadius:14, overflow:'hidden',
      boxShadow:'0 30px 60px -20px rgba(0,0,0,0.6)', border:'1px solid rgba(0,0,0,0.2)',
      fontFamily:'Georgia, serif',
    }}>
      {/* Masthead */}
      <div style={{padding:'20px 28px', borderBottom:'3px double #1a0f08', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <span style={{fontSize:11, letterSpacing:'0.2em', textTransform:'uppercase'}}>Sezon 3 · Hafta 7</span>
        <div style={{fontFamily:'var(--font-display)', fontWeight:900, fontSize:32, letterSpacing:'-0.02em'}}>ElevenForge <span style={{color:'#b91c1c'}}>SPOR</span></div>
        <span style={{fontSize:11, letterSpacing:'0.2em', textTransform:'uppercase'}}>₺5 · 19 Nisan 2026</span>
      </div>
      {/* Hero */}
      <div style={{padding:'32px 28px 20px', background:'linear-gradient(180deg, #dc2626 0%, #7f1d1d 120%)', color:'#fff', borderBottom:'2px solid #1a0f08'}}>
        <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:12}}>
          <Crest clubId="ist" size={28}/>
          <span style={{fontSize:12, letterSpacing:'0.15em', textTransform:'uppercase', opacity:0.9}}>İŞF 4 – 1 ANK · Derbi Rövanşı</span>
        </div>
        <div style={{fontFamily:'var(--font-display)', fontWeight:900, fontSize:'clamp(48px, 8vw, 88px)', lineHeight:0.9, letterSpacing:'-0.03em', textWrap:'balance', marginBottom:10}}>
          ARDA UÇURDU
        </div>
        <div style={{fontSize:20, fontStyle:'italic', opacity:0.92, fontWeight:400}}>21 yaşındaki 10 numara, derbide hat-trick yaptı.</div>
      </div>
      {/* Body columns */}
      <div style={{padding:'24px 28px', display:'grid', gridTemplateColumns:'2fr 1fr', gap:24, borderBottom:'1px solid rgba(0,0,0,0.15)'}}>
        <div style={{fontSize:14, lineHeight:1.7}}>
          <div style={{fontSize:16, fontWeight:700, marginBottom:6}}>Şehir Arena'da 42.000 kişi ayaktaydı.</div>
          <p style={{marginTop:0}}>
            Sezonun 7. haftasında oynanan kritik derbi öncesi kimse bu farkı beklemiyordu. İlk yarı 2-0 önde kapatan İstanbul Şehir FK, Arda Güler'in iki golüyle rahat bir farka gitti.
            Kaleci Uğurcan çağlayan, Ankara Kale'nin 7 şutundan 5'ini çevirerek maçın sessiz kahramanı oldu.
          </p>
          <p>
            <b>Hakan Çalhanoğlu</b>, orta sahada tam 89 pas denedi, başarı yüzdesi %94. Teknik direktör Baran'ın 4-3-3'ü bu hafta rakip takımın adeta içinden geçti.
          </p>
          <p>
            Ankara Kale cephesinde ise moral değerlerinin dibe vurduğu, özellikle Orkun'un maçtan sonra odada gözyaşı döktüğü kulise sızan bilgiler arasında.
          </p>
        </div>
        <aside style={{borderLeft:'1px solid rgba(0,0,0,0.15)', paddingLeft:16, fontSize:13}}>
          <div style={{fontWeight:700, fontSize:12, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:10, color:'#b91c1c'}}>Sayılarla maç</div>
          {[['Topla oynama','%58 – 42'],['İsabetli şut','8 – 3'],['Korner','9 – 2'],['Favori (canlı)','1.48 – 5.20'],['Saha değeri','€412M – €298M']].map(([l,v]) => (
            <div key={l} style={{display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px dotted rgba(0,0,0,0.2)'}}>
              <span>{l}</span><span style={{fontFamily:'var(--font-mono)', fontWeight:600}}>{v}</span>
            </div>
          ))}
          <div style={{fontWeight:700, fontSize:12, letterSpacing:'0.1em', textTransform:'uppercase', marginTop:18, marginBottom:10, color:'#b91c1c'}}>Goller</div>
          {[['12\'','Arda G.'],['38\'','Arda G.'],['52\'','Orkun K. (ANK)'],['68\'','Arda G.'],['84\'','Kerem A.']].map(([m,s]) => (
            <div key={m+s} style={{display:'flex', gap:10, padding:'4px 0', fontSize:13}}>
              <span style={{fontFamily:'var(--font-mono)', fontWeight:600, minWidth:30}}>{m}</span><span>⚽ {s}</span>
            </div>
          ))}
        </aside>
      </div>
      {/* Footer */}
      <div style={{padding:'14px 28px', fontSize:11, display:'flex', justifyContent:'space-between', color:'#4a3420', fontStyle:'italic'}}>
        <span>Devam sayfalarında: Haftanın 11'i · Gol Krallığı · Basın Odası · Köşemiz</span>
        <span>Sayı 7</span>
      </div>
    </div>
  );
}

function TOTWPage() {
  const rows = [
    [TOTW[0]],
    [TOTW[1], TOTW[2], TOTW[3], TOTW[4]],
    [TOTW[5], TOTW[6]],
    [TOTW[7], TOTW[8], TOTW[9], TOTW[10]],
  ];
  return (
    <GlassCard pad={28} hover={false} style={{background:'linear-gradient(180deg, #0a1e14 0%, #051a10 100%)', border:'1px solid color-mix(in oklab, var(--emerald) 30%, var(--border))'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:24}}>
        <div>
          <span className="t-label" style={{color:'var(--gold)'}}>HAFTANIN 11'İ</span>
          <div className="t-h1" style={{marginTop:8, color:'#fff'}}>Team of the Week</div>
        </div>
        <span className="t-mono" style={{fontSize:13, color:'var(--gold)'}}>Hafta 7 · Sezon 3</span>
      </div>
      <div style={{background:'rgba(255,255,255,0.05)', padding:'40px 30px', borderRadius:16, display:'flex', flexDirection:'column', gap:32, border:'1px solid rgba(255,255,255,0.1)'}}>
        {rows.map((row, i) => (
          <div key={i} style={{display:'flex', justifyContent:'space-around', gap:20}}>
            {row.map((p, j) => (
              <div key={j} style={{display:'flex', flexDirection:'column', alignItems:'center', gap:6}}>
                <div style={{width:56, height:56, borderRadius:'50%', background:`linear-gradient(135deg, var(--gold), #ca8a04)`, display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid var(--gold)', boxShadow:'0 0 20px color-mix(in oklab, var(--gold) 40%, transparent)'}}>
                  <span className="t-mono" style={{fontSize:18, fontWeight:700, color:'#1a0f08'}}>{p.rating}</span>
                </div>
                <span style={{fontSize:12, fontWeight:600, color:'#fff', whiteSpace:'nowrap'}}>{p.n}</span>
                <div style={{display:'flex', alignItems:'center', gap:4}}>
                  <Crest clubId={p.clubId} size={14}/>
                  <span className="t-caption" style={{fontSize:10, color:'rgba(255,255,255,0.6)'}}>{p.pos}</span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

function ScorersPage() {
  return (
    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
      <GlassCard pad={24} hover={false}>
        <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:16}}>
          <div style={{fontSize:24}}>⚽</div>
          <div><span className="t-label" style={{color:'var(--gold)'}}>GOL KRALLIĞI</span><div className="t-h2" style={{fontSize:18}}>Top scorers</div></div>
        </div>
        {TOP_SCORERS.map((s, i) => (
          <div key={i} style={{display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom: i < TOP_SCORERS.length-1 ? '1px solid var(--border)' : 'none'}}>
            <span className="t-mono" style={{color: i<3?'var(--gold)':'var(--muted)', fontSize:14, width:20}}>{i+1}</span>
            <Crest clubId={s.clubId} size={22}/>
            <span style={{flex:1, fontSize:14}}>{s.n}</span>
            <span className="t-mono" style={{fontSize:16, fontWeight:600, color:'var(--gold)'}}>{s.g}</span>
          </div>
        ))}
      </GlassCard>
      <GlassCard pad={24} hover={false}>
        <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:16}}>
          <div style={{fontSize:24}}>🎯</div>
          <div><span className="t-label" style={{color:'var(--cyan)'}}>ASİST KRALLIĞI</span><div className="t-h2" style={{fontSize:18}}>Top assists</div></div>
        </div>
        {TOP_ASSISTS.map((s, i) => (
          <div key={i} style={{display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom: i < TOP_ASSISTS.length-1 ? '1px solid var(--border)' : 'none'}}>
            <span className="t-mono" style={{color: i<3?'var(--cyan)':'var(--muted)', fontSize:14, width:20}}>{i+1}</span>
            <Crest clubId={s.clubId} size={22}/>
            <span style={{flex:1, fontSize:14}}>{s.n}</span>
            <span className="t-mono" style={{fontSize:16, fontWeight:600, color:'var(--cyan)'}}>{s.a}</span>
          </div>
        ))}
      </GlassCard>
    </div>
  );
}

function PressRoom({ goto }) {
  const [answer, setAnswer] = React.useState(null);
  const toast = useToast();
  const answers = [
    { text: 'Arda\'nın performansı fenomenaldi. Bu takımın nereye gidebileceğini gösterdi.', morale: +2, emoji:'💎', color:'var(--emerald)' },
    { text: 'Taktik planımız işledi, oyuncularım disiplinli oynadı.', morale: 0, emoji:'🎯', color:'var(--cyan)' },
    { text: 'Rakip çok kötü oynadı, bu fark normal bir fark değil aslında.', morale: -1, emoji:'🧊', color:'var(--danger)' },
  ];
  return (
    <GlassCard pad={28} hover={false}>
      <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:20}}>
        <div style={{width:44, height:44, borderRadius:10, background:'color-mix(in oklab, var(--indigo) 18%, transparent)', border:'1px solid color-mix(in oklab, var(--indigo) 40%, transparent)', color:'var(--indigo)', display:'flex', alignItems:'center', justifyContent:'center'}}><Icon name="chat" size={20}/></div>
        <div>
          <span className="t-label">BASIN ODASI</span>
          <div className="t-h2" style={{fontSize:20, marginTop:4}}>"Bu farklı skorun sırrı?"</div>
        </div>
      </div>
      <div style={{display:'flex', flexDirection:'column', gap:10}}>
        {answers.map((a, i) => (
          <button key={i} onClick={()=>{setAnswer(i); toast({icon:a.emoji, title:'Cevabın gönderildi', body:a.morale > 0 ? `Moral +${a.morale}`: a.morale < 0 ? `Moral ${a.morale}` : 'Moral nötr', accent:a.color});}}
            className="glass" style={{
              padding:16, textAlign:'left', cursor:'pointer', border:`1px solid ${answer===i ? a.color : 'var(--border)'}`,
              background: answer === i ? `color-mix(in oklab, ${a.color} 10%, var(--panel))` : 'var(--panel)',
              fontFamily:'var(--font-body)', color:'var(--text)', display:'flex', gap:12, alignItems:'center',
            }}>
            <span style={{fontSize:20}}>{a.emoji}</span>
            <span style={{flex:1, fontSize:14}}>{a.text}</span>
            <span className="t-mono" style={{fontSize:12, fontWeight:600, color:a.color}}>{a.morale > 0 ? `+${a.morale}` : a.morale} moral</span>
          </button>
        ))}
      </div>
      <div className="t-caption" style={{marginTop:16, fontSize:12}}>Cevapların oyuncu moralini etkiler. Moral, bir sonraki maçta performansa yansır.</div>
    </GlassCard>
  );
}

function FunPage() {
  return (
    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
      <GlassCard pad={24} hover={false}>
        <span className="t-label" style={{color:'var(--warn)'}}>AI KÖŞE · EĞLENCELİK</span>
        <div className="t-h2" style={{fontSize:18, marginTop:8, marginBottom:12}}>Forge Fun Fact</div>
        <p style={{fontSize:14, color:'var(--text-2)', lineHeight:1.7}}>
          Arda Güler'in bu haftaki 3 golü, 2013'teki ünlü "Şehir Derbi"si gecesinden bu yana bir oyuncunun derbiye attığı en yüksek gol. O gece de stat tam da bu kadar sessizdi — ta ki üçüncü gole kadar.
        </p>
      </GlassCard>
      <GlassCard pad={24} hover={false}>
        <span className="t-label" style={{color:'var(--danger)'}}>TRANSFER SÖYLENTİLERİ</span>
        <div className="t-h2" style={{fontSize:18, marginTop:8, marginBottom:12}}>Rumor mill</div>
        <ul style={{margin:0, padding:0, listStyle:'none', fontSize:13, color:'var(--text-2)', display:'flex', flexDirection:'column', gap:8}}>
          <li>🔥 Elif Ö.'nin Nkemba için €80M'lik teklifi reddedildiği konuşuluyor.</li>
          <li>📰 Ahmet D.'nin Laszlo'ya 1 yıl sonra serbest bırakma şartı eklediği söyleniyor.</li>
          <li>🔍 Kaşifler Brezilya'dan 3 yıldız döndürdü — haftalık sürpriz favori.</li>
        </ul>
      </GlassCard>
    </div>
  );
}

Object.assign(window, { Newspaper });
