# ElevenForge

**16 arkadaş. 1 lig. 1 efsane.**

Sosyal online futbol menajerlik oyunu. Arkadaşlarınla kapalı lig kurar, her gün 21:00'de maçları simüle edip sonuçları canlı anlatım ile izlersin, transfer pazarında AI botlar ve insan rakiplerinle yarışır, haftalık gazete okuyup oyuncu moralini şekillendirirsin.

## Stack

| Katman | Tercih |
|--------|--------|
| Framework | Next.js 16 (App Router) + React 19 + Turbopack |
| Stil | Tailwind v4 + CSS tokens |
| Tipleme | TypeScript strict |
| Veritabanı | Postgres (pglite lokal, Neon prod) + Drizzle ORM |
| Auth | next-auth v5 (credentials + JWT session + bcrypt) |
| Cron | QStash prod + node setInterval dev |
| Push | Native Web Push (VAPID) |
| Animasyon | Framer Motion |
| İkon | lucide-react |

Lokal geliştirmede hiçbir credential ya da harici servis gerektirmez — tek komutla kurulur, çalışır.

## Hızlı Başlangıç

```bash
# 1. Bağımlılıklar
npm install

# 2. AUTH_SECRET üret, DB migrasyonları uygula, demo lig seed'le
cp .env.example .env.local
openssl rand -base64 32  # bu değeri .env.local > AUTH_SECRET içine koy
npm run db:migrate
npm run db:seed

# 3. Uygulama + arka plan cron
npm run dev        # http://localhost:3000
npm run cron:dev   # (ayrı terminal) oyun döngüsünü ilerletir
```

Demo giriş: `baran@elevenforge.app` / `eleven123`

## Komutlar

| Komut | İşlev |
|-------|------|
| `npm run dev` | Next dev server (Turbopack) |
| `npm run build` | Prod build |
| `npm run lint` | ESLint |
| `npm run db:generate` | Drizzle migration dosyası üretir (şema değişince) |
| `npm run db:migrate` | Mevcut migration'ları uygular |
| `npm run db:seed` | Demo lig + 16 kulüp + 320 oyuncu + fikstür seed'ler |
| `npm run db:reset` | DB'yi komple silip sıfırdan migrate + seed yapar |
| `npm run cron:dev` | Dev modunda tüm cron job'larını setInterval ile çalıştırır |

## Veritabanı Stratejisi

Tek şema (`lib/schema.ts`), iki driver:

- **Lokal**: `@electric-sql/pglite` (in-process WASM Postgres, `./data/pgdata/` altında dosya-tabanlı). Network yok, credential yok, Docker yok.
- **Production**: `@neondatabase/serverless` (Vercel + Neon). `DATABASE_URL` env'i setlenince otomatik bu driver aktif olur.

Şema değişikliği:

```bash
# lib/schema.ts'i düzenle, sonra:
npm run db:generate          # → drizzle/ altına yeni SQL dosyası
npm run db:migrate           # uygular
```

### Neon'a geçiş

1. [Neon](https://neon.tech)'da yeni proje aç
2. Connection string'i al: `postgres://...@...neon.tech/...?sslmode=require`
3. Vercel'e deploy ediyorsan Vercel'in Neon integration'ı ile otomatik set olur, yoksa `.env.local` veya Vercel dashboard'a ekle:
   ```
   DATABASE_URL="postgres://..."
   ```
4. `npm run db:migrate` (artık Neon'a koşar)
5. `npm run db:seed` (opsiyonel — demo veriyi Neon'a seed'ler)

## Cron Job'ları

Oyun döngüsü şu tetiklerle ilerler:

| Job | Dev (cron-dev) | Production (önerilen) |
|-----|---------------|----------------------|
| `match-day` | 5 dk | günde 1 kere, lig maç saatinde |
| `transfer-bots` | 10 dk | saatte bir |
| `price-decay` | 30 dk | 6 saatte bir |
| `scout-returns` | 2 dk | 15 dk'da bir |
| `training` | 12 saat | günde 1 kere |
| `newspaper` | 10 dk | `match-day`'den hemen sonra |
| `economy` | 6 saat | haftada 1 kere |

Her biri `POST /api/cron/<job>` endpoint'ine map'lenir. `CRON_SECRET` setlendiğinde `Authorization: Bearer <secret>` zorunlu olur.

### Upstash QStash ile kurulum (production)

1. [Upstash QStash](https://upstash.com/qstash) free tier (10 schedule) yeterli
2. `.env.local`:
   ```
   QSTASH_TOKEN="..."
   CRON_SECRET="$(openssl rand -base64 32)"
   ```
3. QStash dashboard'da 7 schedule kaydet (her biri `POST https://<app>/api/cron/<job>`, header `Authorization: Bearer <CRON_SECRET>`)

### Dev modda manuel tetikleme

```bash
curl -X POST http://localhost:3000/api/cron/match-day
curl -X POST http://localhost:3000/api/cron/transfer-bots
```

Veya Dashboard'daki **"Sıradaki Haftayı Oyna"** butonu: hemen bir haftayı simüle eder + gazete üretir.

## Web Push (opsiyonel)

```bash
npx web-push generate-vapid-keys
# public + private anahtarı .env.local'a ekle:
#   NEXT_PUBLIC_VAPID_PUBLIC_KEY="..."
#   VAPID_PRIVATE_KEY="..."
#   VAPID_SUBJECT="mailto:ahmet@elevenforge.app"
```

Sonra client tarafında `navigator.serviceWorker.register('/sw.js')` + `POST /api/push/subscribe`. iOS 16.4+ için PWA'yı Ana Ekran'a eklemek gerekir.

## Proje Yapısı

```
app/
├── (app)/                  giriş yapmış kullanıcılara açık (TopNav + bottom nav)
│   ├── dashboard/          canlı DB: standings, feed, next fixture, play-button
│   ├── squad/              kadro
│   ├── transfer/           AL/SAT + buy/sell/scout server actions
│   ├── tactic/             taktik board (drag-drop)
│   ├── match/              canlı maç + AI anlatım
│   ├── newspaper/          kapak + TOTW + basın odası
│   ├── crew/               chat + global feed
│   └── lobby/              lig kurulum wizard
├── (auth)/                 login/register
├── api/
│   ├── auth/[...nextauth]/ next-auth handlers
│   ├── cron/<job>/         7 cron webhook endpoint
│   └── push/subscribe/     web push abonelik
└── page.tsx                landing
components/
├── ui/                     primitives (Crest, OvrChip, GlassCard, ...)
├── brand/                  logo variants
├── layout/                 TopNav + MobileBottomNav
└── auth/                   pitch pattern side
lib/
├── schema.ts               drizzle pg-core (13 tablo)
├── db.ts                   pglite/neon driver auto-select
├── session.ts              auth + league context helper
├── queries/                server-side data loaders (dashboard, transfer, ...)
├── engine/                 maç simülasyon motoru + commentary + TOTW
├── jobs/                   match-day, transfer-bots, price-decay, scout, training, newspaper
├── cron/                   webhook verify
├── push.ts                 web push helper
└── utils.ts                fmtEUR, tierColor, NAT_FLAGS, ...
scripts/
├── migrate.ts              drizzle migrator (pglite veya neon)
├── seed.ts                 demo lig + kulüpler + oyuncular + fikstür
├── cron-dev.ts             local cron runner
├── simulate-matchday.ts    hemen bir hafta oyna (test)
└── inspect.ts              DB durumunu konsola bas (debug)
auth.ts                     next-auth v5 config
proxy.ts                    route protection (Next 16 convention)
drizzle.config.ts
```

## Oyun Döngüsü

1. **Kayıt ol** → Takım adı seç, kasa €45M ile başla
2. **Davet linkiyle katıl** veya **yeni lig kur**
3. **Dashboard** — sıradaki maçın ne zaman olduğunu gör, lig tablosunda yerini takip et
4. **Taktik** → diziliş + mentality + pressing + tempo ayarı
5. **Transfer pazarı** → listelenen oyuncuları satın al, kendi oyuncunu listele, kaşif gönder
6. **Maç saati geldi** — otomatik simüle olur (QStash) veya **"Sıradaki Haftayı Oyna"** butonuyla manual tetikle
7. **Sonuçları canlı anlatımla izle**
8. **Gazete** yayınlanır — haftanın 11'i, gol krallığı, basın odası
9. **Crew chat'te** arkadaşlarınla derbi konuş, global feed'te evrendeki tüm transferleri gör

## V1 Durumu

**Tam çalışan (server + UI + DB)**:
- ✅ Email/şifre kayıt + login (next-auth v5 + bcrypt + JWT session)
- ✅ Route koruma (proxy.ts)
- ✅ Landing, Login, Register, Lobby UI
- ✅ **Dashboard** — gerçek DB: standings, next fixture, feed, club state, "Play Next Round"
- ✅ 13 tablolu Postgres şeması
- ✅ Maç simülasyon motoru — formation + OVR + home advantage + derby bonus
- ✅ AI commentary generator (template-based Turkish)
- ✅ TOTW + gazete generator (DB'ye yazıyor)
- ✅ Transfer bot AI (hourly purchases + listing replenishment)
- ✅ Price decay (6 saatte bir %8, taban %20)
- ✅ Scout mechanic (8 saat sonra geri döner)
- ✅ Training + fitness regen + injury recovery
- ✅ Ekonomi loop (hafta gelir + banka faizi + maaş)
- ✅ 7 cron endpoint + dev runner + manual trigger
- ✅ Transfer server actions — `buyListing`, `listPlayer`, `removeListing`, `sendScoutAction` gerçek DB'ye yazıyor
- ✅ Web push scaffold (VAPID + service worker + subscribe route)

**V1.1 backlog (kozmetik UI ↔ DB bağlantıları)**:
- Squad ekranı — görsel olarak hazır ama henüz `lib/mock-data`'dan okuyor; `lib/queries/squad.ts` ekle + Server Component'e çevir
- Transfer ekranı — UI mock, server actions gerçek DB'ye yazıyor; visual'ı da `lib/queries/transfer.ts`'e bağla
- Match canlı ekranı — son oynanmış maçın `commentaryJson`'u ekrana akıtılmalı
- Newspaper — DB'deki en son `newspapers` satırı cover'a map'lenmeli
- Crew chat — mesajlar DB'ye yazılmalı + SSE ile real-time
- Tactic — kaydettiğin dizilişi `clubs.formation/mentality/pressing/tempo`'ya yaz
- Tweaks paneli (theme/accent toggle)
- Proper landing hero (şu an basit)

Dashboard + play-next-round akışı + tüm server actions + cron + match engine + newspapers tam çalışıyor; diğer ekranlar görseli koruyor ama bazı veri kısımları mock'ta. V1.1'de yukarıdaki bullet'lar ekrana akar.

## Kaynak & Referans

- `design-brief.md` — Claude Design için orijinal görsel spec
- `design-reference/` — prototipin HTML/React kaynak kodu (read-only)
- `node_modules/next/dist/docs/` — version-matched Next.js 16 docs (AGENTS.md konvansiyonu)

## Lisans

Kişisel proje. Tüm haklar saklı.
