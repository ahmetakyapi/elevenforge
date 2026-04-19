// Auth — Login + Register, split layout with animated ball-on-pitch SVG

function PitchPatternSide() {
  return (
    <div style={{
      position:'relative', height:'100%', minHeight: 420,
      background:`
        radial-gradient(700px 500px at 80% 30%, color-mix(in oklab, var(--indigo) 22%, transparent), transparent 60%),
        radial-gradient(600px 400px at 20% 80%, color-mix(in oklab, var(--emerald) 18%, transparent), transparent 60%),
        var(--bg-2)`,
      overflow:'hidden', borderRadius: 18, border:'1px solid var(--border)',
    }}>
      <svg width="100%" height="100%" viewBox="0 0 600 600" preserveAspectRatio="xMidYMid slice" style={{position:'absolute', inset:0, opacity:0.35}}>
        <g stroke="rgba(255,255,255,0.28)" strokeWidth="1" fill="none">
          <rect x="40" y="60" width="520" height="480"/>
          <line x1="300" y1="60" x2="300" y2="540"/>
          <circle cx="300" cy="300" r="74"/>
          <rect x="40" y="200" width="120" height="200"/>
          <rect x="440" y="200" width="120" height="200"/>
        </g>
        <circle cx="300" cy="300" r="6" fill="#fff" style={{animation:'floatBall 6s var(--ease) infinite'}}/>
      </svg>
      <style>{`@keyframes floatBall { 0%,100% { transform: translate(0,0); } 50% { transform: translate(80px, -40px); } }`}</style>
      <div style={{position:'absolute', top:28, left:28}}><LogoLockup size={22}/></div>
      <div style={{position:'absolute', bottom:28, left:28, right:28, color:'var(--text-2)'}}>
        <div className="t-h2" style={{textWrap:'balance'}}>Futbol yönetimine yeni bir başlangıç.</div>
        <div className="t-small" style={{marginTop:8, color:'var(--muted)'}}>16 kişilik özel ligini kur, her akşam 21:00'de maç oyna.</div>
      </div>
    </div>
  );
}

function Login({ goto }) {
  const [email, setEmail] = React.useState('baran@elevenforge.app');
  const [pass, setPass] = React.useState('•••••••••');
  const [remember, setRemember] = React.useState(true);
  const toast = useToast();
  return (
    <div style={{maxWidth: 1100, margin:'0 auto', padding:'40px 24px', minHeight:'100vh', display:'flex', alignItems:'center'}}>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:28, width:'100%', minHeight: 560}}>
        <PitchPatternSide/>
        <GlassCard pad={36} hover={false} style={{display:'flex', flexDirection:'column', justifyContent:'center'}}>
          <div style={{maxWidth: 360, marginLeft:'auto', marginRight:0, width:'100%'}}>
            <span className="t-label" style={{color:'var(--indigo)'}}>GİRİŞ</span>
            <div className="t-h1" style={{marginTop:8, marginBottom:8}}>Tekrar hoş geldin.</div>
            <div style={{color:'var(--muted)', fontSize:14, marginBottom:24}}>Kaldığın yerden devam et.</div>
            <div style={{display:'flex', flexDirection:'column', gap:14}}>
              <Field label="E-posta">
                <input className="input valid" value={email} onChange={e=>setEmail(e.target.value)}/>
              </Field>
              <Field label="Şifre" right={<a style={{fontSize:12, color:'var(--muted)', cursor:'pointer'}}>Şifremi unuttum</a>}>
                <input className="input" type="password" value={pass} onChange={e=>setPass(e.target.value)}/>
              </Field>
              <label style={{display:'flex', alignItems:'center', gap:8, cursor:'pointer', marginTop:4}}>
                <Checkbox checked={remember} onChange={() => setRemember(!remember)}/>
                <span style={{fontSize:13, color:'var(--text-2)'}}>Beni hatırla</span>
              </label>
              <button className="btn btn-primary btn-lg" style={{marginTop:8, justifyContent:'center'}} onClick={()=>{toast({icon:'✓', title:'Hoş geldin Baran', body:'İstanbul Şehir FK seni bekliyor.', accent:'var(--emerald)'}); goto('dashboard');}}>Giriş Yap</button>
              <button className="btn btn-ghost btn-sm" style={{justifyContent:'center'}} onClick={()=>goto('register')}>Hesabın yok mu? <span style={{color:'var(--indigo)'}}>Hesap aç</span></button>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function Register({ goto }) {
  const [email, setEmail] = React.useState('');
  const [p1, setP1] = React.useState('');
  const [p2, setP2] = React.useState('');
  const [team, setTeam] = React.useState('');
  const emailValid = /.+@.+\..+/.test(email);
  const passValid = p1.length >= 6;
  const passMatch = p1 && p1 === p2;
  const toast = useToast();
  return (
    <div style={{maxWidth: 1100, margin:'0 auto', padding:'40px 24px', minHeight:'100vh', display:'flex', alignItems:'center'}}>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:28, width:'100%', minHeight: 600}}>
        <PitchPatternSide/>
        <GlassCard pad={36} hover={false} style={{display:'flex', flexDirection:'column', justifyContent:'center'}}>
          <div style={{maxWidth: 360, marginLeft:'auto', marginRight:0, width:'100%'}}>
            <span className="t-label" style={{color:'var(--emerald)'}}>KAYIT</span>
            <div className="t-h1" style={{marginTop:8, marginBottom:8}}>Takımını kur.</div>
            <div style={{color:'var(--muted)', fontSize:14, marginBottom:24}}>5 dakikada ligini kur, arkadaşlarını davet et.</div>
            <div style={{display:'flex', flexDirection:'column', gap:12}}>
              <Field label="E-posta">
                <input className={`input ${email ? (emailValid ? 'valid' : 'invalid') : ''}`} placeholder="sen@ornek.com" value={email} onChange={e=>setEmail(e.target.value)}/>
              </Field>
              <Field label="Takım adı">
                <input className="input" placeholder="İstanbul Şehir FK" value={team} onChange={e=>setTeam(e.target.value)}/>
                {team && <PreviewCrest name={team}/>}
              </Field>
              <Field label="Şifre">
                <input className={`input ${p1 ? (passValid ? 'valid' : 'invalid') : ''}`} type="password" placeholder="En az 6 karakter" value={p1} onChange={e=>setP1(e.target.value)}/>
              </Field>
              <Field label="Şifre tekrar">
                <input className={`input ${p2 ? (passMatch ? 'valid' : 'invalid') : ''}`} type="password" value={p2} onChange={e=>setP2(e.target.value)}/>
              </Field>
              <button
                className="btn btn-primary btn-lg" style={{marginTop:12, justifyContent:'center'}}
                disabled={!(emailValid && passValid && passMatch && team)}
                onClick={()=>{toast({icon:'⚽', title:'Takımın kuruldu', body:`${team || 'Kulübün'} — ilk lige davetini bekliyor.`, accent:'var(--indigo)'}); goto('lobby');}}>
                Takımımı Kur
              </button>
              <button className="btn btn-ghost btn-sm" style={{justifyContent:'center'}} onClick={()=>goto('login')}>Zaten hesabın var mı? <span style={{color:'var(--indigo)'}}>Giriş yap</span></button>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function PreviewCrest({ name }) {
  const letters = name.split(/\s+/).map(s=>s[0]).slice(0,2).join('').toUpperCase();
  return (
    <div style={{marginTop:10, display:'flex', alignItems:'center', gap:10}}>
      <div style={{
        width:32, height:32, borderRadius:'50%',
        background:'linear-gradient(135deg, var(--indigo), var(--emerald))',
        display:'inline-flex', alignItems:'center', justifyContent:'center',
        fontFamily:'var(--font-display)', fontWeight:700, color:'#fff', fontSize:13,
      }}>{letters}</div>
      <span className="t-small">Arma önizlemesi · daha sonra değiştir</span>
    </div>
  );
}

function Field({ label, right, children }) {
  return (
    <div style={{display:'flex', flexDirection:'column', gap:6}}>
      <div style={{display:'flex', justifyContent:'space-between'}}>
        <span className="t-label">{label}</span>
        {right}
      </div>
      {children}
    </div>
  );
}

function Checkbox({ checked, onChange }) {
  return (
    <div onClick={onChange} style={{
      width:16, height:16, borderRadius:4,
      background: checked ? 'var(--accent)' : 'var(--panel)',
      border:`1px solid ${checked ? 'var(--accent)' : 'var(--border-strong)'}`,
      display:'inline-flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
      transition:'all var(--t) var(--ease)'
    }}>
      {checked && <Icon name="check" size={11} stroke={2.5}/>}
    </div>
  );
}

Object.assign(window, { Login, Register, Field, Checkbox, PreviewCrest });
