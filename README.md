<div align="center">

# ⚽ ElevenForge

**16 arkadaş. 1 lig. 1 efsane.**

Türkçe, çoklu-oyunculu online futbol menajerlik oyunu — OSM'in oyun derinliği +
modern menajerlik oyunlarının kalitesinde animasyon ve UX.

[Canlı Demo](https://elevenforge.vercel.app) · [Hata bildir](https://github.com/ahmetakyapi/elevenforge/issues)

</div>

---

## Neler var?

### 🏟 Lig & Maç
- **16-takımlı arkadaş ligleri** — davet kodu ile katıl, bot kalan slotu doldur
- **Günlük cron-tetiklemeli maç simülasyonu** — lig kuran kişinin seçtiği saatte
- **Deterministik motor** — fixture id → seed; replay aynı skoru üretir
- **Hakem kişiliği** (8 isim × strictness 1-5) — kart sıklığı + agresif oyun davranışı
- **Stadyum boost'u** (L1→L5) — ev avantajı 2.5'tan 4.5'a kadar tırmanır
- **Maç-içi 3 değişiklik planı** — dakika + giren/çıkan; engine 75'te subbed-off bir golcüyü skor atan listesinden çıkarır
- **Tek-eleme 16-takım kupa** — lig sezonuna paralel; final + prestij + €15M ödül
- **5 sarı kart kuralı** + **kırmızı kart 2 maç ceza** + **sezon-sonu emeklilik** (yaş ≥40)

### 🛒 Transfer & Ekonomi
- **Pazar** — listing, fiyat decay, bot AI alış/satış
- **Optimistic locking** — eşzamanlı 10 alıcı, sadece 1 kazanır (race-safe)
- **Auto-bid** — max fiyat ayarla, fiyat o seviyeye düşünce otomatik alınır
- **Loan transfers** — 30 gün, %20 fee; sezon-roll önce snap-back
- **Free agent havuzu** — sözleşmesi biten oyunculara imza bonusu (1/5 değer) ile imzalama
- **Sponsor sözleşmeleri** (3 tier × 6 marka) — maç başı + galibiyet bonusu + sezon bonusu
- **Sezon prize money** (top 4: €30M/€20M/€10M/€5M) + prestij artışı

### 👥 Kadro & Personel
- **Taktik board** — 6 formasyon × 7 saved preset
- **Pozisyon-bazlı 4 antrenman slotu** (1 GK + 1 DEF + 1 MID + 1 FWD)
- **Genç gelişim** (≤19 yaş %52/gün +1 OVR şansı, kapsamlı age tier'ları)
- **Personel** (3 slot × 3 tier): Başantrenör + Fizyoterapist + Baş Kaşif. Physio sakatlık riskini × (1 - tier·0.18) ölçekler, scout her görevde +tier ek aday getirir
- **Tesis upgrade** — Stadyum + Antrenman L1→L5 (€5M / €10M / €20M / €40M)
- **Casus** — rakibe €1M ile casus gönder; formasyon + 11 + tactic dial'leri rapor edilir; fixture başına idempotent

### 🏆 Sosyal & UX
- **Multi-league switcher** — bir kullanıcı birden fazla ligde olabiliyor
- **Board objectives** — prestij'e göre auto-hedef + güven barı; 0'a düşerse kovulma
- **Achievements** — şampiyon, kupa kazanan, perfect-season, top-scorer-team rozetleri
- **Real-time chat** (5sn polling, tab-visible aware)
- **Dashboard auto-refresh** — diğer oyuncuların aksiyonları yenilemeden gözükür
- **Push notifications** — VAPID + service worker (match-day, scout-return, transfer)
- **Login streak** rewards (gün × €200K + 7. gün €500K bonus)
- **Mobile-landscape-first responsive** — TopNav + bottom-nav

### 🛡 Çoklu-oyuncu sağlamlığı
- **Davet kodu ile katılma** — bot-club claim race-safe (optimistic UPDATE)
- **Commissioner-only week advance** — bir oyuncu tüm ligi tek başına ileri saramıyor
- **Per-fixture deterministic seed** — refresh exploit yok
- **Atomic balance updates** — `UPDATE balance = balance - X` SQL düzeyinde
- **Invite-code collision retry** (10 deneme)

### 🎨 Görsel
- Premium glass aesthetic — `backdrop-filter: blur(16px)` + radial gradient indigo/emerald
- Custom Manrope + JetBrains Mono font pairing
- Easing `[0.22, 1, 0.36, 1]` her animasyonda
- Dark-by-default, `data-theme="dark"`

---

## Stack

| Katman | Tercih |
|--------|--------|
| Framework | **Next.js 16** (App Router) + React 19 + Turbopack |
| Stil | Tailwind v4 + CSS tokens |
| Tipleme | TypeScript strict |
| Veritabanı | Postgres — **pglite** lokal (WASM, zero-config) / **Neon** prod |
| ORM | **Drizzle** (pg-core, single schema, dual driver) |
| Auth | **next-auth v5** (Credentials + JWT + bcrypt) |
| Cron | **Upstash QStash** prod / `setInterval` dev |
| Push | Native Web Push (**VAPID**) + custom service worker |
| Animasyon | Framer Motion |
| İkon | lucide-react |
| Deploy | **Vercel** + Neon |

---

## Hızlı Başlangıç

Lokal geliştirme **hiçbir credential** ya da harici servis gerektirmez. Tek komutla kurulup çalışır.

```bash
# 1. Klonla
git clone https://github.com/ahmetakyapi/elevenforge
cd elevenforge

# 2. Bağımlılıklar
npm install

# 3. Env (sadece AUTH_SECRET; DB pglite ile lokal çalışır)
cp .env.example .env.local
# .env.local içindeki AUTH_SECRET'a değer üret:
echo "AUTH_SECRET=\"$(openssl rand -base64 32)\"" >> .env.local

# 4. DB migrate + demo lig seed
npm run db:migrate
npm run db:seed

# 5. Çalıştır
npm run dev
# → http://localhost:3000
```

**Demo giriş:** `ahmet@elevenforge.app` / `eleven123` · davet kodu `AKYAPI`

---

## Production Deploy (Vercel + Neon)

1. **Neon'da yeni proje aç** → connection string'i kopyala
2. **Vercel'e import et** — GitHub repo'yu bağla
3. **Vercel project settings → Environment Variables**:
   ```
   DATABASE_URL  = <Neon connection string, sslmode=require>
   AUTH_SECRET   = <openssl rand -base64 32>
   ```
4. **Migration uygula** — terminal'de:
   ```bash
   DATABASE_URL="<...>" npm run db:migrate
   DATABASE_URL="<...>" npm run db:seed   # opsiyonel demo veri
   ```
5. **Deploy** — push ettiğin her commit otomatik build alır.

### Cron schedule (production)

[Upstash QStash](https://upstash.com/qstash) free tier yeterli (10 schedule). Aşağıdaki endpoint'leri ekle:

| Endpoint | Periyot |
|----------|---------|
| `POST /api/cron/match-day` | her gün, lig matchTime saatinde |
| `POST /api/cron/transfer-bots` | saatte bir |
| `POST /api/cron/price-decay` | 6 saatte bir |
| `POST /api/cron/scout-returns` | 15 dk'da bir |
| `POST /api/cron/training` | günde bir |
| `POST /api/cron/newspaper` | match-day'den hemen sonra |
| `POST /api/cron/economy` | haftada bir |

Her birine `Authorization: Bearer <CRON_SECRET>` header ekle (env'e `CRON_SECRET` koy).

### Web Push (opsiyonel)

```bash
npx web-push generate-vapid-keys
# .env / Vercel env:
NEXT_PUBLIC_VAPID_PUBLIC_KEY="..."
VAPID_PRIVATE_KEY="..."
VAPID_SUBJECT="mailto:you@yourdomain.com"
```

iOS 16.4+ için kullanıcının PWA'yı Ana Ekran'a eklemesi gerekir.

---

## Komutlar

| Komut | İşlev |
|-------|-------|
| `npm run dev` | Next dev server (Turbopack) |
| `npm run build` | Prod build |
| `npm run lint` | ESLint |
| `npm run db:generate` | Drizzle migration üret (şema değişince) |
| `npm run db:migrate` | Mevcut migration'ları uygula |
| `npm run db:seed` | Demo lig + 16 kulüp + 320 oyuncu + fikstür |
| `npm run db:reset` | DB'yi komple sıfırla |
| `npm run cron:dev` | Dev cron runner (setInterval) |
| `npx tsx scripts/test-full-season.ts` | E2E sezon testi (invariants + determinism) |
| `npx tsx scripts/test-multiplayer.ts` | 10-kullanıcı concurrent multiplayer testi |

---

## Proje Yapısı

```
app/
├── (app)/                  giriş yapmış kullanıcılar
│   ├── dashboard/          board + sponsor + staff + upgrade widgets
│   ├── squad/              kadro + compare + 4-slot training
│   ├── transfer/           buy/sell/loan/auto-bid + scout
│   ├── tactic/             6 formasyon + 7 preset + sub plan
│   ├── match/              canlı maç + AI Türkçe anlatım
│   ├── newspaper/          haftalık kapak + TOTW
│   ├── crew/               chat (5sn polling) + global feed
│   ├── lobby/              create / join wizard
│   ├── cup/                tek-eleme bracket görünümü
│   ├── free-agents/        sözleşmesi biten oyuncular
│   └── league-settings/    commissioner edits
├── (auth)/                 login + register (invite code support)
├── api/
│   ├── auth/[...nextauth]/
│   ├── cron/<job>/         7 cron webhook endpoint
│   └── push/subscribe/     web push abonelik
└── page.tsx                landing
components/
├── ui/                     primitives (Crest, OvrChip, GlassCard, Toast)
├── brand/                  logo
├── layout/                 TopNav + MobileBottomNav + FooterCredit
├── auth/                   pitch pattern side
└── push-subscribe.tsx      one-tap notification opt-in
lib/
├── schema.ts               drizzle pg-core (16 tablo)
├── db.ts                   lazy proxy pglite/neon driver auto-select
├── session.ts              auth + multi-league context
├── match-time.ts           "HH:MM" parser
├── sponsors.ts             sponsor catalogue
├── staff.ts                staff catalogue + tier effects
├── push.ts / push-dispatch.ts
├── queries/                server data loaders (dashboard, transfer, cup, ...)
├── engine/                 maç simülasyon + commentary + TOTW
├── jobs/                   match-day, season, cup, training, board, achievements, ...
└── cron/                   webhook signature verify
scripts/
├── migrate.ts / seed.ts / cron-dev.ts
├── test-full-season.ts     E2E + determinism check
└── test-multiplayer.ts     10-user concurrency check
auth.ts · proxy.ts · drizzle.config.ts
```

---

## Test stratejisi

İki uçtan-uca test betiği koşar:

```bash
npx tsx scripts/test-full-season.ts
# → 2 sezon simüle eder, doğrular:
#   - cached W/D/L/GF/GA == finished fixtures'tan türetilen
#   - puan = W*3 + D her takım için
#   - ΣW = ΣL ve ΣGF = ΣGA (zero-sum lig)
#   - aynı seed ile fixture replay → aynı skor (determinism)
#   - genç oyuncu antrenmanda gerçekten gelişiyor

npx tsx scripts/test-multiplayer.ts
# → 10 kullanıcı, 1 lig, eşzamanlı join + race scenarios:
#   - 9 paralel join → tüm kulüpler benzersiz claim
#   - 10 aynı listing'e race → 1 kazanır (optimistic lock)
#   - duplicate-join blocked
#   - 8 farklı bot tactic personality
```

---

## Veritabanı stratejisi

Tek `lib/schema.ts`, iki driver:

- **Lokal**: `@electric-sql/pglite` — in-process WASM Postgres, `./data/pgdata/` altında dosya. Network/credential/Docker yok.
- **Production**: `@neondatabase/serverless` — Vercel-ready, autoscale-to-zero. `DATABASE_URL` set olunca otomatik aktif.

`lib/db.ts` lazy proxy kullanır — DB ilk query'de oluşturulur, build sırasında değil. Vercel build, `DATABASE_URL` olmadan da derlenir.

Şema değiştirdiğinde:

```bash
# lib/schema.ts'i düzenle
npm run db:generate    # → drizzle/ altına yeni SQL
npm run db:migrate     # uygular
```

---

## Mimari notlar

- **Server actions everywhere** — neredeyse tüm mutation'lar Next 16 server actions; client tarafında sadece UI state.
- **Race condition guards** — transfer purchase, free-agent sign, bot-club claim hepsinde optimistic UPDATE...WHERE pattern.
- **Atomic balance updates** — sql template tag ile `balance = balance - X`, read-then-write yarış yok.
- **Deterministic match seeding** — `fixtures.rngSeed` persist; FNV-1a hash from fixture UUID; replay tutarlı.
- **Auto-refresh sustainability** — sadece `visibilitychange === "visible"` iken polling; backgrounded'de duruyor.
- **Lazy DB init** — `lib/db.ts` Proxy ile gerçek connection ilk kullanımda oluşturulur; build crash yok.
- **Idempotent operations** — invite code retry, achievements (clubId+code+season unique), spy (fromClubId+fixtureId unique), cup bracket generate.

---

## Yol haritası (V7+)

- [ ] In-match sub UI (engine hazır, sadece tactic sayfasında set ekranı eksik)
- [ ] Auto-bid UI (action var, transfer kartına buton eklenecek)
- [ ] Loan UI (buton eklenecek)
- [ ] AI Türkçe TTS commentary
- [ ] Manager mood engine (basın açıklaması, takım moralini etkiler)
- [ ] Replay share card (PNG export)
- [ ] Dynamic club history wiki
- [ ] Rival watch (rakibinin transferleri için bildirim)

---

## Lisans

Kişisel proje. Tüm haklar saklı.

---

<div align="center">

**Made by [Ahmet Akyapı](https://github.com/ahmetakyapi)**

⚡ Built with Claude Code (Sonnet/Opus 4.7)

</div>
