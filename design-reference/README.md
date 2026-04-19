# ElevenForge — Design Handoff

> **Türkçe arkadaşlık ligi / sosyal futbol menajerlik platformu.** 16 arkadaş bir araya gelir, ligi kurar, her gece 21:00'de maçlar simüle olur, canlı maç anlatımı gelişmeleri saniye saniye yayınlar.

---

## 1. Bu pakette ne var?

Bu klasördeki dosyalar **HTML + React (inline JSX + Babel) ile yapılmış bir tasarım referansıdır** — üretim kodu değildir. Amaç, ürünün nasıl **görünmesi, hissedilmesi ve etkileşmesi** gerektiğini pixel-perfect göstermek. Sen kendi stack'ini seçeceksin (Next.js + Tailwind, SvelteKit, React Native vs.) ve buradaki tasarımı o stack'in kendi pattern'leriyle **yeniden üreteceksin**.

**Ne yap:**
- Ekranların layout, tipografi, renk, aralık, animasyon davranışlarını birebir taklit et
- Bölüm 5'teki tasarım token'larını seçtiğin stack'in token sistemine aktarılmış halde kullan
- Bölüm 7'deki ekranların davranış sözleşmelerini uygula
- Bölüm 8'deki veri modelini temel al

**Ne yapma:**
- HTML dosyalarını olduğu gibi prod'a atma — onlar mock
- İç `<script type="text/babel">` pattern'ini koruma — o sadece prototip için
- İnline stil yığınlarını olduğu gibi kopyalama — kendi stilin (Tailwind / CSS-modules / styled) ile yaz

---

## 2. Fidelity

**Yüksek fidelity (pixel-perfect).** Renk, tipografi, aralık, shadow, animasyon süreleri, hover state'leri — hepsi kesindir. Mock'lar son tasarımın davranışını doğru şekilde sergiliyor.

Küçük istisna: Oyuncu fotoğrafları, kulüp logoları, gazete fotoğrafları → **placeholder** (initials avatar / monogram crest / CSS pattern). Üretimde bunları gerçek asset'lerle değiştireceksin.

---

## 3. Ürünün genel hikayesi

ElevenForge, 16 arkadaşın kurduğu kapalı bir ligdir. Her oyuncu bir Türk şehrinin (kurgusal) kulübünü yönetir: İstanbul Şehir FK, Ankara Kale, İzmir Körfez, Trabzon Karadeniz vs.

### Oyun döngüsü
1. **Lig kurulumu** — Davet linki ile 16 kişi lobiye toplanır, boş slotları bot takımlar doldurur
2. **Sezon başlar** — Her akşam 21:00'de tüm maçlar eşzamanlı simüle edilir
3. **Canlı anlatım** — `<LiveMatch>` ekranında saniye saniye anlatıcı yorumu akar (gol, pas, taktik yorumu)
4. **Transfer** — Kullanıcılar birbirinden veya bot kulüplerden oyuncu alır; kaşif (scout) göndererek yeni oyuncu bulunur
5. **Gazete** — Her maç sonrası fiktif gazete manşeti üretilir; sararmış kağıt dokusu, serif tipografi
6. **Crew (→ Akış)** — Arkadaş feed'i: transferler, iddialaşmalar, skor tahminleri, "beraber izleyelim" partileri

### Kritik tasarım değerleri
- **Türkçe öncelikli** — tüm copy Türkçedir, menü adları Türkçedir ("Kadro", "Taktik", "Gazete"). İngilizce terimler sadece mevki rozetlerinde (ST, CM, GK vs.).
- **Sinematik** — hero scroll parallax'ı, reveal-on-scroll animasyonları, canlı stadyum arka planı
- **Bilgi yoğun ama havasız** — FM/Football Manager'dan ilham alıyor ama tablo-spam'i yok. Liste satırları 60-72px, glass panel, ferah spacing
- **Durağan veri yok** — her yerde canlı hissi: pulse nokta, tickerlar, sayaçlar, kademeli reveal'lar

---

## 4. Teknoloji mantığı (prototipte ne kullanıldı)

| Katman | Prototip | Üretimde ne kullan |
|---|---|---|
| Görüntüleme | React 18 UMD + Babel Standalone | Next.js / Vite + React TS |
| State | `useState` + localStorage | Zustand / Jotai / server state (TanStack Query) |
| Stil | CSS custom properties + inline style | Tailwind (tercih) veya CSS modules |
| İkon | Inline SVG (kendi `<Icon>` kütüphanem) | Lucide React (veya eldeki set) |
| Font | Manrope + JetBrains Mono (Google Fonts) | Aynısı |
| Rota | `useState`-based routing | Next App Router / TanStack Router |
| Canlı güncellemeler | `setInterval` mock | Server-Sent Events / WebSocket |

---

## 5. Design Tokens

Tokenların tam listesi `tokens.css` dosyasındadır. Özet:

### Renkler — Karanlık tema (varsayılan)

```
--bg:           #04070d
--bg-2:         #070b14
--panel:        rgba(255,255,255,0.02)
--panel-2:      rgba(255,255,255,0.035)
--panel-hover:  rgba(255,255,255,0.05)
--border:       rgba(255,255,255,0.08)
--border-strong:rgba(255,255,255,0.14)
--text:         #f4f5f7
--text-2:       #c7ccd8
--muted:        #8b92a5
--muted-2:      #5a6172
```

### Renkler — Aydınlık tema (`[data-theme="light"]`)

```
--bg:           #fafafa
--bg-2:         #f2f3f6
--panel:        rgba(0,0,0,0.02)
--panel-2:      rgba(0,0,0,0.035)
--border:       rgba(0,0,0,0.08)
--text:         #0a0e1a
--text-2:       #2b3143
--muted:        #6b7280
```

### Aksan renkleri (kullanıcı seçilebilir)

```
indigo:  #6366f1 (default, --accent)
emerald: #10b981 (--accent-2)
cyan:    #22d3ee
warn:    #f59e0b   (uyarı, sarı)
danger:  #ef4444   (tehlike, kırmızı)
gold:    #facc15
rose:    #f43f5e
```

Aksan değiştirilince `--accent` ve `--accent-2` CSS değişkenleri yeniden atanır. Tüm primary buton, focus ring, chip active state, glow efektleri aksana bağlıdır.

### Mevki renk kodları (her ekranda tutarlı)

```
GK  → #f59e0b  (sarı — warn)
DEF → #3b82f6  (mavi)
MID → #10b981  (yeşil — emerald)
FWD → #ef4444  (kırmızı — danger)
```

### Tipografi

```
Display: Manrope 800, letter-spacing -0.02em, line-height 1
H1:      Manrope 700, 34px, -0.02em, 1.08
H2:      Manrope 600, 22px, -0.015em, 1.15
H3:      Manrope 600, 17px
Body:    Manrope 500, 14px
Small:   Manrope 500, 13px
Mono:    JetBrains Mono 500, tabular-nums
Label:   Manrope 500, 11px, UPPERCASE, 0.12em tracking
Caption: Manrope 500, 12px, --muted
```

Hero display tipografisi: `clamp(64px, 12vw, 184px)`, letter-spacing -0.05em, line-height 0.86. Metin içinde **gradient tarzı** uygulanıyor: "ELEVEN" beyazdan 50% transparan beyaza, "FORGE" indigo→emerald→cyan gradient + shimmer animasyonu.

### Radii

```
--r-xs: 6px   --r-sm: 10px   --r-md: 14px
--r-lg: 16px  --r-xl: 22px   --r-2xl: 28px
```

### Shadow

```
--shadow-sm: 0 1px 2px rgba(0,0,0,0.3)
--shadow-md: 0 6px 24px -8px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.35)
--shadow-lg: 0 20px 40px -16px rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.4)
--glow-indigo: 0 0 0 1px rgba(99,102,241,0.3), 0 8px 32px -12px rgba(99,102,241,0.4)
--glow-emerald: 0 0 0 1px rgba(16,185,129,0.3), 0 8px 32px -12px rgba(16,185,129,0.4)
```

### Motion

```
--ease:     cubic-bezier(0.22, 1, 0.36, 1)    # primary easing
--ease-out: cubic-bezier(0.16, 1, 0.3, 1)
--t-fast: 140ms   --t: 260ms   --t-slow: 480ms
```

Sayfa içi animasyonların neredeyse hepsi `260ms cubic-bezier(0.22, 1, 0.36, 1)` ile çalışır.

### Layout

Max sayfa genişliği: **1440px** (bazı sayfalarda 1600px). Main padding: `20px 28px` (mobile), `24px` (desktop top nav). Section padding: `120px 32px` (landing scroll bölümleri).

### Spacing mantığı

4/8/12/16/20/24/32 → `.gap-1 … .gap-8` utility sınıfları vardır ama code'da çoğunlukla inline `gap` kullanılır.

---

## 6. Temel UI bileşenleri

Prototip kendi mini kütüphanesini kuruyor (`src/ui.jsx`). Üretimde her birini stack'inin bileşen sistemine aktarmanı istiyorum.

### `<Crest clubId={} size={28} ring={false}>`
Kulüp logosu — iki renkli gradient daire + monogram (2-3 harf, örn "İŞF"). Boyut parametrik.

### `<PosBadge pos={} size={28} showLabel>`
Mevki rozeti (GK/DEF/MID/FWD). Renk kodlu yuvarlak, içinde kalın mono yazı.

### `<OvrChip ovr={} size="sm"|"md">`
İki satırlı rozet: üstte OVR sayısı, altında tier etiketi ("ELİT", "A+", "A", "B", "C"). Renk tier'a göre.
  - 85+ → ELİT, warn
  - 80+ → A+, emerald
  - 75+ → A, cyan
  - 70+ → B, muted
  - <70 → C, muted-2

### `<UserAvatar name={} size={24}>`
Initials + rengi isme göre hash'lenmiş HSL tonu.

### `<Currency value={} size={14} color={}>`
€ simgesi + mono font + tabular-nums. Büyük değerlerde M/K kısaltması. Örn. €68M, €500K.

### `<Icon name={} size={14}>`
`src/ui.jsx` içinde custom SVG kütüphanesi. İsimler: `home, users, swap, target, play, paper, chat, search, compass, plus, close, clock, arrow-right, moon, sun, trophy, flag, dot, …` Üretime geçerken **Lucide React**'e map'le — neredeyse hepsi bire bir aynı ad var.

### `<GlassCard pad={16} hover={true}>`
```css
background: var(--panel);
border: 1px solid var(--border);
backdrop-filter: blur(16px);
border-radius: 16px;
```
Hover'da `background: var(--panel-2)`, `border-color: var(--border-strong)`, opsiyonel `transform: translateY(-1px) + shadow-md`.

### `<SectionHead label="PİYASA" title={...}>`
Üstte küçük label (11px, 0.12em letter-spacing, `--muted`), altında H2 veya H3 başlık. Her kart bölümünün standart başlık formatıdır.

### `<Field label="...">` + `<input className="input">`
Form field wrapper + input stili. Focus'ta border `--accent`'e dönüyor. `.input.valid` → emerald, `.input.invalid` → danger border.

### `.btn`, `.btn-primary`, `.btn-sm`, `.btn-lg`, `.btn-ghost`
tokens.css'te detayları var. **Primary** her zaman aksan renginde gradient; ghost transparan.

### `.chip`, `.chip.active`
Pill filter. Active'de aksan rengi %15 karışım, border %35 karışım.

### `<ProgressRing pct={} size={} stroke={}>`
Dairesel progress (SVG). Aksan rengi. Background `--border`.

### `.glass` + `@keyframes pulse-accent` + `shimmer` + `marquee`
Tokens.css'te hazır animasyonlar.

---

## 7. Ekranlar / Rotalar

### Harita

| Route | Component | Chrome | Amaç |
|---|---|---|---|
| `landing` | `Landing` | Yok | Pazarlama sayfası, scroll parallax |
| `login` | `Login` | Yok | Saha görseli solda, form sağda |
| `register` | `Register` | Yok | Aynı layout |
| `lobby` | `Lobby` | Var | Lig kurma ekranı, 16 slot, davet linki |
| `dashboard` | `Dashboard` | Var | Ana sayfa — yaklaşan maç, kadro özeti, haberler |
| `squad` | `Squad` | Var | Oyuncu kadrosu — grid/liste görünümü |
| `transfer` | `TransferMarket` | Var | Al/Sat sekmeleri, filtre slider'ları, piyasa istatistikleri |
| `tactic` | `TacticBoard` | Var | Sürükle-bırak diziliş, mentalite slider'ları |
| `match` | `LiveMatch` | Var | Canlı maç anlatımı — text feed + skor |
| `newspaper` | `Newspaper` | Var | Gazete manşetleri — sararmış kağıt dokusu |
| `crew` (→ "Akış") | `Crew` | Var | Sosyal feed — arkadaş aktivitesi |

Chrome = üstte `<TopNav>` + mobilde alt `<MobileBottomNav>`.

### Ekran detayları

#### Landing (`src/screens/landing.jsx`)
Scroll-reactive pazarlama sayfası. Bölümler:

1. **Hero** — "ELEVENFORGE" display başlığı + alt başlık "16 arkadaş. 1 lig. 1 efsane." + iki CTA. Arka planda perspektifli stadyum SVG, mouse parallax, scroll fade-out. Altta canlı skor kartı (`<HeroLiveCard>`) — 2 saniyede bir anlatım satırı değişiyor.
2. **Marquee** — Dünyanın büyük liglerini kaydıran marquee (Süper Lig, Premier League, La Liga… 90 saniyelik döngü).
3. **Crew section** — yörünge gezen kulüp crest'leri, orta merkezde feed özeti.
4. **Stadium section** — hero'daki canlı maç kartı yeniden, yanında son 4 anlatım satırı.
5. **Market section** — transfer ticker'lar — 2 yönlü akış.
6. **Tactic section** — 4 formasyonu (4-3-3, 4-2-3-1, 3-5-2, 5-3-2) otomatik döndüren saha. Soldan saha, sağdan başlık "Sürükle, bırak, ligi yönet." Sahada animasyonlu drag cursor + topu kapalı alana bırakıp halka patlatıyor.
7. **Newspaper stack** — 3D perspektifte sıralanan 4-5 gazete kapağı, otomatik rotasyon (3.4sn).
8. **Testimonial wall** — kullanıcı yorumları.
9. **FAQ** — accordion.
10. **Closing CTA + footer**.

Her section `useReveal` (IntersectionObserver + 2sn failsafe + görünür alan kontrolü) ile scroll'da açılıyor.

#### Login / Register (`src/screens/auth.jsx`)
- **Sol** (desktop ≥900px): Canlı saha görseli — pitch lines, oyuncular, anlatım ticker
- **Sağ**: Form card (glass, maxWidth ~440px)
- Mobilde saha gizlenir, form tam genişlik
- Submit'te loading spinner → dashboard'a yönlendirme

#### TransferMarket (`src/screens/transfer.jsx`)
Referans ekran — en detaylı liste tasarımı burada.

**Global ticker** (üstte): son 24 saatlik transferler, 64 saniyelik marquee, canlı pulse.

**Al sekmesi**:
- Header: "TRANSFER PAZARI" + oyuncu sayısı + sıralama chip'leri (Trend, €↑, €↓, OVR, Yaş)
- Filtre kartı (glass): mevki chip'leri + 3 slider (max fiyat, min OVR, max yaş), her slider renk kodlu
- Liste: her satır expandable. Grid: `44px | 1.8fr | 1.2fr | 70px | 70px | 90px | 150px`
  - Col 1: Avatar + overlay PosBadge
  - Col 2: Oyuncu adı + TREND etiketi (trend ↑ ise) + kulüp crest + kulüp adı
  - Col 3: Role (ST/CM vs.) + bayrak + uyruk tam adı
  - Col 4: OvrChip
  - Col 5: Yaş (big mono) + "yaş" etiketi
  - Col 6: Decay (↑2sa / ↓12sa) + "X saat önce"
  - Col 7: Fiyat (renk: >40M warn, >20M text, <=20M emerald) + satıcı + Al butonu
- Satır tıklanınca altında 4 sütunlu detay açılır: Potansiyel / Kalan / Tipik pazar / Satıcı
- Satırlar `slide-up 300ms` + `i*40ms` stagger ile giriyor

**Sat sekmesi**:
- SQUAD'tan kendi oyuncuların — form, güncel değer, "asking price" input'u, Listele/Kaldır butonu
- Listelenen oyuncunun border'ı warn renginde

**Sağ panel** (320px sabit):
- Market Stats (2x2 grid): Hareketli piyasa / Ortalama fiyat / En pahalı / Bugün satılan
- Senin Listelerin — satışta olan oyuncuların kompakt kartları
- Aktif Kaşif — progress ring + geri sayım

**Kaşif Modal** — ülke, mevki, yaş aralığı seçimi + €500K maliyet. Submit → toast "Kaşif yollandı".

#### Dashboard, Squad, Tactic, Match, Newspaper, Lobby, Crew
Aynı pattern: `TopNav` + `maxWidth: 1400px, padding: 20px 28px` container + glass card'lar + SectionHead başlıkları. Her dosya `src/screens/<name>.jsx`'te — component'ler ilgili dosyada `Object.assign(window, {...})` ile expose ediliyor.

---

## 8. Veri modeli

Prototipte tüm data `src/data.js`'te static array'ler. Üretimde Prisma/DB şemasına dönüştürürken şu ilişkiler kritik:

```ts
type Club = {
  id: string;             // 3-harf kod: 'ist', 'ank', 'izm'...
  name: string;           // Tam ad: "İstanbul Şehir FK"
  short: string;          // 3-harf: "İŞF"
  city: string;
  color: string;          // Primary hex
  color2: string;         // Secondary hex
}

type CrewMember = {
  id: string;             // 'u1', 'u2', ...
  name: string;
  clubId: string;         // → Club.id
  isUser: boolean;        // true = "sen"
  online?: boolean;
  bot?: boolean;          // bot ise online/isUser false
}

type Player = {
  n: string;              // "Uğurcan Çakır" — TAM AD
  pos: 'GK'|'DEF'|'MID'|'FWD';
  role: string;           // "ST" / "CM" / "CB" vs. — mevkinin alt rolü
  age: number;
  ovr: number;            // 1-99 overall
  pot: number;            // potansiyel
  nat: string;            // 2-harf: 'TR', 'BR', 'NG'...
  form?: number;          // 1-10
  val?: number;           // Euro cinsinden değer (kendi oyuncuların)
  status?: 'listed';      // satışa çıkmış
}

type TransferListing = Player & {
  price: number;          // Liste fiyatı
  hoursOn: number;        // Listede kaç saattir
  decay: string;          // "↑2sa" / "↓12sa" — trend + saat
  seller: 'bot'|'user';
  sellerName?: string;    // seller='user' ise
  clubId: string;         // Hangi kulüpten satışta
}

type GlobalTransfer = {   // Ticker için
  buyer: string;
  buyerClub: string;      // Club.id
  player: string;
  price: number;
}

type Commentary = {
  m: number;              // dakika
  text: string;
  type: 'goal'|'shot'|'analysis'|'card'|'sub';
}

type Formation = '4-3-3'|'4-2-3-1'|'3-5-2'|'5-3-2';
type PitchSlot = { x: number; y: number; r: string; n: number };
// x,y 0-100 oran; r role; n forma numarası
```

### Tam ad kuralı (önemli)
Kadro oyuncu isimleri **Türk isimleri ve gerçekçi ama kurgusal** — "Uğurcan Çakır, Arda Güler, Barış Alper Yılmaz" gibi. Grid kartlarında ve liste satırlarında **tam ad görünür, sığmazsa `text-overflow: ellipsis` + `title` attr ile tooltip**. Kadro/Squad ekranında hem grid hem liste view bunu uyguluyor.

### Pozisyon haritası (sahada)
`TacticSection` ve `TacticBoard`'da kullanılıyor. `positions[formation]` → 11 slot. Koordinat sistemi: x=0-100 (0 sol, 100 sağ), y=0-100 (0 üst/rakip kale, 100 alt/kendi kalemiz). GK y=88 civarı, ST y=22 civarı.

---

## 9. Etkileşim sözleşmeleri

### Theme toggle
`<html data-theme="light">` veya `"dark"`. Kullanıcı seçimi localStorage'da (`ef.tweaks`). Tüm renkler `[data-theme]` altında override.

### Accent toggle
Kullanıcı Tweaks panelinden aksan rengi seçer (indigo / emerald / cyan / gold / rose). JS, `:root`'a `--accent` ve `--accent-2` set eder.

### Route persist
`localStorage['ef.route']`'a kaydedilir. Refresh'te devam edilir.

### `useReveal` pattern
Scroll'da beliren her section için:
```js
const [ref, on] = useReveal(threshold = 0.15);
// on state'e göre opacity/transform transition 800ms
```
İçeriği initial olarak görünür alandaysa anında açar; IntersectionObserver kaçırırsa 2 saniye sonra failsafe olarak açar. **Bu pattern'i mutlaka koru** — aksi halde scroll hızlıysa section'lar kararık kalıyor.

### Marquee
`animation: marquee Xs linear infinite`. Diziyi `[...arr, ...arr]` şeklinde 2x render edip `-50%` translate → sonsuz döngü. Yaklaşık hız: büyük lig isimleri 90sn, transfer ticker 64sn.

### Oyun döngüsü mock
Tüm "canlı" efektler `setInterval` ile simüle:
- Skor kartı: 2.6sn'de bir anlatım satırı değişir
- Tactic section formasyon döngüsü: 3.8sn
- Gazete stack rotasyonu: 3.4sn
- Scout countdown: 1sn interval

Üretimde bunları **SSE** (yayın) veya **WebSocket** (maç dakikaları) ile değiştir.

### Toast
`useToast()` hook → `{icon, title, body, accent}`. Sağ üstte 4sn belirir, slide-in-right animasyonu.

---

## 10. Copy / Metin kuralları

- **Dil**: Türkçe
- **Tonlama**: samimi, futbolcu jargonu kullanılabilir ("derbi", "form düştü", "takas")
- **Terim kararları**:
  - "Feed" → "Akış" (hiçbir yerde feed yok)
  - "Crew" → "Akış" (menüde "Crew" yerine "Akış" yazar, component adı koruma amaçlı Crew kaldı)
  - "Derbi" → her zaman "derbi" (derby değil)
  - "AI" → "Canlı maç anlatımı" (AI ibaresi yok)
  - Para birimi: € simgesi, `€24.8M`, `€500K`, `€68.000.000` formatı
- **Boş alanlar**: "—" (em-dash). "N/A" yok.

---

## 11. Responsive

Breakpoint mantığı (Tailwind-benzeri):
- Mobile: < 640px — tek kolon, bottom nav
- Tablet: 640-900px — çoğunlukla tek kolon, yan panel altına düşer
- Desktop: ≥ 900px — top nav + grid layout
- Large: ≥ 1280px — landing tam spread

`.desktop-only` class'ı var → mobilde `display: none`. Aynı şekilde `.mobile-only`.

---

## 12. Dosyalar

Bu handoff paketinde:
```
design_handoff_elevenforge/
├── README.md                          (← bu dosya)
├── source/
│   ├── ElevenForge.html               (ana HTML — giriş noktası)
│   ├── tokens.css                     (tüm CSS token'ları)
│   ├── design-canvas.jsx              (design canvas wrapper — ignore)
│   └── src/
│       ├── app.jsx                    (App shell, routing, TopNav, tweaks)
│       ├── ui.jsx                     (Crest, PosBadge, OvrChip, buttons, Icon lib...)
│       ├── logos.jsx                  (LogoLockup component)
│       ├── data.js                    (tüm mock data — Club, Crew, Squad, Transfer...)
│       └── screens/
│           ├── landing.jsx            (scroll-heavy marketing page)
│           ├── auth.jsx               (Login + Register, split layout)
│           ├── lobby.jsx
│           ├── dashboard.jsx
│           ├── squad.jsx
│           ├── transfer.jsx           ★ referans ekran
│           ├── tactic.jsx
│           ├── match.jsx
│           ├── newspaper.jsx
│           └── crew.jsx
```

### Çalıştırma (prototipi incelemek için)
`ElevenForge.html`'i bir HTTP sunucu üzerinden aç (dosya://' te Babel loader CORS hatası verir):
```bash
cd source && python -m http.server 8000
# veya
npx serve source
```
Tarayıcıda `http://localhost:8000/ElevenForge.html` aç.

---

## 13. Önerilen üretim yaklaşımı

1. **Next.js 14 App Router + TypeScript + Tailwind + shadcn/ui** kur
2. `tokens.css`'teki değişkenleri `tailwind.config.ts`'te `theme.extend` altına taşı (colors, borderRadius, boxShadow, transitionTimingFunction)
3. `data.js`'teki tipleri `types.ts` olarak çıkar, Prisma şeması ile eşle
4. Her ekranı bir route olarak kur (`app/(app)/transfer/page.tsx`)
5. `src/ui.jsx`'teki primitive'leri (Crest, PosBadge, OvrChip, UserAvatar, OvrChip) birer component olarak `components/`'a taşı
6. **Transfer ekranı ile başla** — en detaylı ve referans olarak en iyi test
7. Landing'i **en son** bırak — animasyonlar Framer Motion ile yeniden yazılmalı

---

Herhangi bir noktada prototipe referans vermek için `source/` klasörüne bak — her ekran detaylı inline stil ile yazılmış, değerleri direkt ora okuyup kopyalayabilirsin.
