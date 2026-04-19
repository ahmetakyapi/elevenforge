# ElevenForge — Design Brief for Claude Design

## PROJECT
ElevenForge is a multiplayer online football manager web app (Turkish + international audience). Think "Online Soccer Manager meets Linear/Vercel premium aesthetic." Users form private leagues of up to 16 friends, manage clubs, play 1 match/day at a fixed hour, handle transfers on a shared market, train players, upgrade facilities, and read post-match AI-generated newspapers.

Standout differentiators:
- AI live commentary during matches (club-history-aware narration)
- AI post-match press room (interviews affect player morale)
- Derby auto-detection (same-city friend clubs get 2× stakes)
- Shared-universe transfer feed (your friends' transfers appear in your feed)
- Transparent match simulation ("why did I lose?" button explains engine decisions)

## PRIMARY DEVICES (design priority order)
1. **Mobile landscape** 896×414 (iPhone) / 1024×600 (tablet) — primary during matches
2. **Mobile portrait** 414×896 — browsing, transfer list, chat
3. **Desktop** 1440×900 — tactic board, stadium management

Design all key screens for **landscape-mobile FIRST**; ensure portrait works; desktop is spacious version. Responsive, never a separate "mobile app" look — one design language scales.

## VISUAL DNA (non-negotiable)
- **Dark-first** `#04070d` base, with sophisticated light-mode variant (not just inverted)
- **Glass morphism**: `backdrop-filter: blur(16–24px)`, 1px borders at 6–10% white opacity
- **Corner radial gradients**: indigo `#6366f1` + emerald `#10b981` at low opacity (5–12%), very subtle parallax on scroll
- **Typography pairing**: Manrope (display + body) + JetBrains Mono (stats, numbers, transfer fees)
- **Micro-motion**: hover lifts `translateY(-1px)` + shadow grow, easing `cubic-bezier(0.22, 1, 0.36, 1)` everywhere
- **Zero generic AI look**: no stock gradient blobs, no centered hero-with-3-feature-row, no "Get Started →". Think Arc Browser, Raycast, Linear + FIFA 25 sports energy
- **Real data feel**: actual Turkish + European player names, Turkish club names, realistic stats (overall 70–90), realistic transfer fees (€5M–€80M), realistic scores

## COLOR PALETTE
```
--bg-dark: #04070d        --bg-light: #fafafa
--panel-dark: rgba(255,255,255,0.02)    --panel-light: rgba(0,0,0,0.02)
--border-dark: rgba(255,255,255,0.08)   --border-light: rgba(0,0,0,0.08)
--text-dark: #f4f5f7      --text-light: #0a0e1a
--muted-dark: #8b92a5     --muted-light: #6b7280

--accent-indigo: #6366f1
--accent-emerald: #10b981
--accent-cyan: #22d3ee

--warn: #f59e0b   (sarı kart, uyarı)
--danger: #ef4444 (kırmızı kart, sakatlık)
--gold: #facc15   (TOTW, motm, kupa)
```

## TYPOGRAPHY
- **Display**: Manrope 800, tracking -0.02em, 48–72px (landing hero, score displays)
- **H1**: Manrope 700, 32–40px
- **H2**: Manrope 600, 20–24px
- **Body**: Manrope 500, 14–16px
- **Stats/Numbers**: JetBrains Mono 500, `font-variant-numeric: tabular-nums`, 14–18px
- **Label/Caption**: Manrope 500, uppercase, letter-spacing 0.08em, 11–12px

## COMPONENT PATTERNS
- **Glass Card**: `bg: rgba(255,255,255,0.02)`, `border: 1px rgba(255,255,255,0.08)`, `backdrop-filter: blur(16px)`, `border-radius: 16px`, inner border glow on hover
- **Stat Chip**: pill with icon + value (mono) + label (caption)
- **Player Row**: 32px avatar + name + position badge + overall rating (tier-colored) + market value (mono)
- **Position Badge**: 24px colored circle with 2-letter code — GK (`#facc15`), DEF (`#3b82f6`), MID (`#10b981`), FWD (`#ef4444`)
- **Overall Rating Tier Colors**: 85+ gold, 80–84 indigo, 75–79 cyan, 70–74 emerald, <70 muted
- **Live Match Ticker**: horizontal scrolling strip with minute + event icon + text
- **Formation Pitch**: SVG pitch with grid lines, 11 draggable nodes, home/away color tints
- **Currency Display**: € symbol + mono font + compact notation (€8.5M, €250K, €1.2B)
- **Countdown Timer**: segmented digits, mono, pulsing accent color when <1 hour
- **Toast/Notification**: slides in from bottom-right (desktop) or top (mobile), glass panel, auto-dismiss 4s

## SCREENS TO DESIGN — 12 CORE

### 1. Landing (Marketing Page)
- Giant "ELEVENFORGE" wordmark (extra-wide tracking) above the fold
- Subtitle: **"16 arkadaş. 1 lig. 1 efsane."**
- Behind the hero: animated formation pitch graphic (subtle, parallax, glass overlay)
- CTAs: primary "Hesap Aç" (indigo accent), secondary "Giriş Yap" (ghost button)
- 5 scroll sections:
  1. Feature showcase — 6 glass cards (Lig, Transfer, Taktik, Kaşif, Gazete, Crew)
  2. Live match preview screenshot with AI commentary speech bubbles
  3. Transfer market ticker animation (rotating listings)
  4. Newspaper section — rotating cover pages (3D tilt on hover)
  5. FAQ accordion + footer
- Sticky top nav: logo (left), "Özellikler / Fiyatlar / Blog" (center), "Giriş Yap" (right)
- Footer: minimal, 4 columns, copyright, no social noise

### 2. Login + Register
- Split 50/50 landscape: left = form, right = animated ball-on-pitch SVG pattern
- Form fields: email, password (register: + confirm password, + team name preview)
- Inline validation: emerald border on valid, red on error, no alert modals
- "Beni hatırla" checkbox (custom, not native)
- "Şifremi unuttum" link (ghost)
- Register → redirects to league lobby; login → redirects to dashboard
- No social logins (scope decision)

### 3. League Lobby (Create/Join)
- Two big entry cards: "Yeni Lig Kur" (sparkle icon) / "Davet Kodu ile Katıl" (link icon)
- Create flow wizard (3 steps): name & crest color → season length (4/5/6 haftalık) + match time → visibility (davet-only / herkese-açık) → invite link generated with copy button
- Slot grid: 4×4 matrix, 16 spots, occupied = user avatar + team name, empty = "+ Davet Et" ghost card, bot slots = robot icon with "Bot Takım" label
- Start league button activates at ≥2 humans; fills rest with bots

### 4. Team Dashboard (Home)
- **Top bar**: club crest + name + budget `€45.8M` (mono) + bell icon (badge count)
- **Hero card**: next match countdown (huge mono `00:14:23:07`) + opponent crest + home/away tag + venue
- **Mini-widgets row** (4 cards):
  - Upcoming fixtures (next 3 matches)
  - Last newspaper cover (tappable → gazete ekranı)
  - Squad status (⚕️ 2 injured, 🟥 1 suspended, 💪 4 training)
  - Finance snapshot (bu hafta geliri, banka faizi, toplam bakiye)
- **Bottom nav (mobile)**: Home / Kadro / Transfer / Taktik / Maç / Daha
- **Activity feed** (scroll down): recent crew events, global transfers, scout returns

### 5. Squad List (Kadro)
- Header: filter pills (All / Kaleci / Def / Mid / Forward), search input, sort dropdown
- Table (dense, breathable): #, avatar, name, position badge, overall (tier-colored chip), potential (gold bar showing current→max), age, morale ❤️ (1-5), fitness bar (0-100%), status icons (🩹 sakat, 🟥 cezalı, 💪 antrenmanda, 💰 listede)
- Empty row state: "Kadronda 20 oyuncu var. Transfer pazarına bak →"
- Tap player → slides up player detail sheet

### 6. Player Detail Sheet
- Top: club crest + nationality flag + hero silhouette (position-specific)
- Big name + position + jersey number (mono)
- **Radar chart**: PAC / SHO / PAS / DRI / DEF / PHY (6 axes)
- Tabs: Attributes / Form / Contract / Transfer Geçmişi
- Attributes: grouped (fiziksel, teknik, mental), each row label + mono value + mini bar
- Form: last 5 match ratings (colored dots 0-10)
- Contract: remaining years, weekly wage (mono €), buyout clause
- Actions (bottom sticky): "Transfer Listesine Ekle" (primary) / "Antrenmana Koy" (secondary) / "Dostluk Maçına Çıkar" (ghost)

### 7. Transfer Market
- **Top strip**: global ticker — live feed of transfers across all ElevenForge leagues (wow feature #8: "Ahmet → €75M Mbappe transferi tamam" with club crests, animated in)
- **Filters bar**: position, age range slider, max budget input, nationality dropdown, league dropdown
- **Main list**: each row = player card (glass panel) with price, time-on-list indicator (`⏱ 4 sa`), price decay arrow `↓6sa`, seller type (bot robot icon / user avatar)
- **Right side panel (or bottom drawer mobile)**: "Senin Listelerin" — 5-slot grid (max 5). Each slot = player card or empty "+ Listele" state. Shows min/max price ranges based on overall rating.
- **Floating button**: "Kaşif Gönder" → opens scout modal

### 8. Scout Modal
- Wizard: target league (dropdown with league badges) → target nationality → age range (18-35 slider) → position preference → cost shown → "Kaşifi Yolla"
- Active scout cards on main transfer screen: countdown (`⏱ 6:42:11`), progress ring, cancel option
- Returned scout: modal with 3-5 player cards, "Satın Al" button per player within 24h before they expire

### 9. Tactic Board
- **Main area (70%)**: full pitch SVG with grid, 11 draggable player nodes (circular chips with jersey number + name + overall)
- **Left panel**: Formation dropdown (4-3-3 / 4-4-2 / 3-5-2 / 5-3-2 / etc), mentality slider (Defansif ←→ Saldırgan), pressing intensity (0-5), tempo (Yavaş / Normal / Hızlı)
- **Right panel**: Bench (7 substitute slots), each as player mini-card
- **Bottom**: 7 preset slots (A-G) — save/load tactics, current preset highlighted
- Instructions banner: "Sürükle → oyuncu mevkisi değişir. Çift tıkla → rol değişir"

### 10. Live Match
- **Top**: scoreboard — huge mono score `2 - 1`, minute `74'`, both club crests + names, pitch mini-map with live ball position
- **Middle (main)**: AI commentary feed — speech bubbles with spiker avatar. Example: "⚽ Osimhen! Galatasaray forveti 2013'teki derbiyi hatırlatan bir vuruşla skoru yeniliyor!" (club-history reference)
- **Bottom**: quick actions row — Değişiklik / Formasyon / Taraftarı Coşur (hype) / Taktik Değiştir
- **Side drawer (swipe)**: live stats — possession bar, shots on/off, corners, cards, player ratings updating live
- **Crowd visualizer**: faint waveform on top indicating crowd energy

### 11. Post-Match Newspaper (Gazete)
- Full-bleed cover — newspaper-style layout, club colors, massive headline: **"GALATASARAY UÇURDU: 4-1"**, date line "Sezon 3 · Hafta 7 · ElevenForge Spor"
- Below fold:
  - **Team of the Week** — 11 players laid out on pitch graphic, each with their owner-user tag
  - **Gol Krallığı** leaderboard (top 5)
  - **Asist Krallığı** leaderboard (top 5)
  - **Basın Odası** — interview prompts: "Bu farklı skorun sırrı?" with 3 multiple-choice answers, each showing potential morale impact (+2 morale emerald / 0 / -1 red)
  - **Gazete Köşesi** — AI-generated fun fact, "Transfer Söylentileri" column
- Paginated scroll or tabbed sections

### 12. Crew Chat + Global Feed
- **Split (landscape)**: left 60% = crew chat, right 40% = global feed
- **Chat**: message bubbles with user avatars + club crest next to name. Limited emoji picker (⚽🔥💎🏆🟨🟥😂💀). Reply, react inline. Typing indicator.
- **Global feed (wow feature #4)**: activity stream — "Ahmet sold Vinicius Jr. for €75M to Baran's club" / "Elif won the derby 3-1 vs Kaan" / "Scout returned 3 players for Mehmet". Each item: animated entry, clickable to view.
- **Crew roster**: sticky top showing 16 members + online dot indicators

## BRAND ASSETS — critical

### Logo
- **Concept**: Stylized "11" shape integrated with an anvil/forge motif (dövücü metaforu) OR a football embedded in a forge hammer silhouette. Sharp angles + sports energy.
- **Wordmark**: "ElevenForge" in Manrope 800, tight tracking (-0.03em). "Forge" slightly bolder or with indigo-emerald gradient stroke accent.
- **Variants**:
  - Primary mark (icon only)
  - Horizontal lockup (icon + wordmark, icon height = wordmark cap height)
  - Stacked lockup (icon above wordmark)
  - Monochrome: pure white on dark / pure black on light
  - Colored: icon uses indigo→emerald gradient accent

### Favicon (32×32 + 16×16)
Simplified mark. Must read clearly at 16×16 — likely just the "11" or core anvil shape. Dark background optional (Safari renders as-is).

### Apple Touch Icon (180×180)
Full-bleed, safe margins 15%. Dark background (`#04070d`), luminous indigo-emerald gradient icon centered. No text. Rounded-square-safe (iOS masks it).

### Maskable PWA Icon (512×512)
Safe zone in middle 80%. Background fills fully with dark gradient. Icon centered in safe zone.

### Open Graph Image (1200×630)
Hero card: logo lockup + tagline "16 arkadaş. 1 lig. 1 efsane." + subtle pitch pattern background + corner radial gradients. No screenshot noise — clean brand-first.

## ANTI-PATTERNS (don't do)
- Gradient-blob-behind-hero cliché
- "Get Started Now →" button style — use Turkish CTAs, unique wording
- Centered hero with 3-feature-row layout
- Rounded-everything — mix sharp angles (pitch lines, forge geometry) with rounded glass cards
- Stock football vector illustrations (flat green pitch with 3 white stripes)
- Purple-pink AI-SaaS-generic gradients
- Glassy drop shadows (heavy blur + heavy shadow feels cheap)
- Sans-serif italic for stats (ALWAYS mono for numbers)
- Emoji overuse in UI (reserve for chat + status icons only)
- Pop-up modals with "Are you sure?" — use inline confirm

## REFERENCE INSPIRATIONS
- **Linear.app** — restraint, spacing, subtle glass
- **Arc Browser** — playful premium, color blocks
- **Raycast** — dense info but breathing room
- **Vercel dashboard** — mono stats, subtle gradients
- **FIFA 25 UI** — sports energy, bold numerics, live animation
- **Apple Sports app** — minimal score layouts, beautiful team badges
- **SofaScore / OneFootball** — data density done right

## DELIVERABLES REQUESTED
For each of the 12 screens:
- Rendered interactive HTML/CSS prototype (tabs, hovers, transitions working)
- Mobile landscape 896×414 primary view + portrait 414×896 + desktop 1440×900
- Annotations on key interactions / states (loading, empty, error)

For brand assets:
- SVG source for logo marks (all variants)
- SVG for favicon, PNG export 32×32 + 16×16
- Apple-touch-icon PNG 180×180
- Maskable PWA icon PNG 512×512
- OG image PNG 1200×630

Use the color palette strictly. Use real Turkish + European player/team names (Mbappe, Osimhen, Güler, İcardi, Bellingham, Szoboszlai, Oyarzabal, Saka — and Turkish stars: Barış Alper Yılmaz, Kerem Aktürkoğlu, Yunus Akgün, Kenan Yıldız, Hakan Çalhanoğlu). Make it feel like a shipped product, not a wireframe. Craft over speed.
