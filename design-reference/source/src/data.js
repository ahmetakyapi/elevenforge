// ElevenForge — mock data (Turkish-flavored, no copyrighted crests/names)
// 16 club league, realistic overall 70-90, realistic prices.

const CLUBS = [
  { id: 'ist',  name: 'İstanbul Şehir FK',   short: 'İŞF', city: 'İstanbul', color: '#dc2626', color2: '#fbbf24' },
  { id: 'ank',  name: 'Ankara Kale',         short: 'ANK', city: 'Ankara',   color: '#1e40af', color2: '#f4f5f7' },
  { id: 'izm',  name: 'İzmir Körfez SK',     short: 'İZM', city: 'İzmir',    color: '#059669', color2: '#facc15' },
  { id: 'brs',  name: 'Bursa Yeşil',         short: 'BYŞ', city: 'Bursa',    color: '#15803d', color2: '#f4f5f7' },
  { id: 'tra',  name: 'Trabzon Karadeniz',   short: 'TRK', city: 'Trabzon',  color: '#7c2d12', color2: '#fbbf24' },
  { id: 'ada',  name: 'Adana Demir',         short: 'ADM', city: 'Adana',    color: '#1e3a8a', color2: '#ef4444' },
  { id: 'kay',  name: 'Kayseri Erciyes',     short: 'KAY', city: 'Kayseri',  color: '#be123c', color2: '#facc15' },
  { id: 'kon',  name: 'Konya Ova',           short: 'KON', city: 'Konya',    color: '#0f766e', color2: '#f4f5f7' },
  { id: 'ant',  name: 'Antalya Akdeniz',     short: 'ANT', city: 'Antalya',  color: '#ea580c', color2: '#f4f5f7' },
  { id: 'sam',  name: 'Samsun Çakır',        short: 'SAM', city: 'Samsun',   color: '#b91c1c', color2: '#f4f5f7' },
  { id: 'gaz',  name: 'Gaziantep Kale',      short: 'GAZ', city: 'Gaziantep',color: '#881337', color2: '#fbbf24' },
  { id: 'esk',  name: 'Eskişehir Porsuk',    short: 'ESK', city: 'Eskişehir',color: '#ca8a04', color2: '#111827' },
  { id: 'mal',  name: 'Malatya Kayısı',      short: 'MAL', city: 'Malatya',  color: '#9d174d', color2: '#fbbf24' },
  { id: 'riz',  name: 'Rize Çay',            short: 'RİZ', city: 'Rize',     color: '#065f46', color2: '#f4f5f7' },
  { id: 'diy',  name: 'Diyarbakır Surlar',   short: 'DYB', city: 'Diyarbakır',color: '#1f2937',color2: '#ef4444' },
  { id: 'sak',  name: 'Sakarya Nehir',       short: 'SAK', city: 'Sakarya',  color: '#475569', color2: '#22d3ee' },
];

const USER_CLUB_ID = 'ist'; // "Sen" İstanbul Şehir FK yönetiyorsun
const USER_CLUB = CLUBS.find(c => c.id === USER_CLUB_ID);

// Crew members — 16 kişi, bazıları bot
const CREW = [
  { id: 'u1', name: 'Baran Y.',      clubId: 'ist', isUser: true,  online: true  },
  { id: 'u2', name: 'Ahmet D.',      clubId: 'ank', isUser: false, online: true  },
  { id: 'u3', name: 'Elif Ö.',       clubId: 'izm', isUser: false, online: true  },
  { id: 'u4', name: 'Kaan T.',       clubId: 'brs', isUser: false, online: false },
  { id: 'u5', name: 'Mehmet S.',     clubId: 'tra', isUser: false, online: true  },
  { id: 'u6', name: 'Zeynep K.',     clubId: 'ada', isUser: false, online: false },
  { id: 'u7', name: 'Deniz A.',      clubId: 'kay', isUser: false, online: true  },
  { id: 'u8', name: 'Emre B.',       clubId: 'kon', isUser: false, online: false },
  { id: 'u9', name: 'Selin H.',      clubId: 'ant', isUser: false, online: true  },
  { id: 'u10', name: 'Yusuf V.',     clubId: 'sam', isUser: false, online: false },
  { id: 'u11', name: 'Ceren P.',     clubId: 'gaz', isUser: false, online: true  },
  { id: 'u12', name: 'Onur M.',      clubId: 'esk', isUser: false, bot: true     },
  { id: 'u13', name: 'Bot · Malatya',clubId: 'mal', isUser: false, bot: true     },
  { id: 'u14', name: 'Bot · Rize',   clubId: 'riz', isUser: false, bot: true     },
  { id: 'u15', name: 'Bot · Diyar.', clubId: 'diy', isUser: false, bot: true     },
  { id: 'u16', name: 'Bot · Sakarya',clubId: 'sak', isUser: false, bot: true     },
];

// Players — user's squad (20) + samples from other clubs for transfer feed
// Mix of realistic Turkish + international names
const POSITIONS = ['GK', 'DEF', 'MID', 'FWD'];

const SQUAD = [
  // GK
  { n: 'Uğurcan Çakır',   pos: 'GK',  role: 'GK',  num: 1,  age: 27, ovr: 82, pot: 85, nat: 'TR', fit: 94, mor: 5, wage: 180000, val: 32000000, form: [7.2,6.8,7.5,8.1,6.9], ctr: 3 },
  { n: 'Altay B.',     pos: 'GK',  role: 'GK',  num: 12, age: 31, ovr: 75, pot: 75, nat: 'TR', fit: 88, mor: 3, wage: 90000,  val: 6500000,  form: [6.3,6.8,6.5,6.0,6.4], ctr: 1 },
  // DEF
  { n: 'Merih D.',     pos: 'DEF', role: 'CB',  num: 4,  age: 29, ovr: 83, pot: 84, nat: 'TR', fit: 92, mor: 4, wage: 210000, val: 28000000, form: [7.4,7.1,7.8,7.2,7.5], ctr: 4 },
  { n: 'Çağlar S.',    pos: 'DEF', role: 'CB',  num: 14, age: 30, ovr: 80, pot: 80, nat: 'TR', fit: 84, mor: 4, wage: 165000, val: 16000000, form: [7.0,6.9,7.2,7.1,6.8], ctr: 2, status: 'injured' },
  { n: 'Ferdi K.',     pos: 'DEF', role: 'LB',  num: 3,  age: 26, ovr: 79, pot: 82, nat: 'TR', fit: 96, mor: 5, wage: 140000, val: 18000000, form: [7.3,7.0,7.1,7.4,7.2], ctr: 3 },
  { n: 'Zeki Ç.',      pos: 'DEF', role: 'RB',  num: 2,  age: 24, ovr: 78, pot: 84, nat: 'TR', fit: 90, mor: 4, wage: 130000, val: 19000000, form: [6.9,7.1,7.0,6.8,7.3], ctr: 4 },
  { n: 'Samet A.',     pos: 'DEF', role: 'CB',  num: 15, age: 22, ovr: 74, pot: 84, nat: 'TR', fit: 92, mor: 4, wage: 65000,  val: 7200000,  form: [6.7,6.9,6.8,7.0,6.6], ctr: 3, status: 'training' },
  // MID
  { n: 'Hakan Ç.',     pos: 'MID', role: 'CM',  num: 10, age: 31, ovr: 86, pot: 86, nat: 'TR', fit: 89, mor: 5, wage: 320000, val: 34000000, form: [7.8,7.5,8.2,7.6,8.0], ctr: 2 },
  { n: 'Orkun K.',     pos: 'MID', role: 'CDM', num: 6,  age: 26, ovr: 81, pot: 84, nat: 'TR', fit: 91, mor: 4, wage: 170000, val: 22000000, form: [7.2,7.4,7.1,7.0,7.3], ctr: 3 },
  { n: 'İsmail Y.',    pos: 'MID', role: 'CM',  num: 8,  age: 24, ovr: 78, pot: 85, nat: 'TR', fit: 88, mor: 4, wage: 110000, val: 14000000, form: [6.8,7.0,7.2,6.9,7.1], ctr: 4 },
  { n: 'Kerem A.',     pos: 'MID', role: 'LW',  num: 7,  age: 26, ovr: 83, pot: 85, nat: 'TR', fit: 93, mor: 5, wage: 240000, val: 30000000, form: [7.6,7.8,7.4,7.9,7.5], ctr: 3 },
  { n: 'Barış Alper Y.',pos: 'MID',role: 'RW',  num: 17, age: 25, ovr: 82, pot: 86, nat: 'TR', fit: 95, mor: 5, wage: 210000, val: 28000000, form: [7.5,7.7,7.3,8.0,7.2], ctr: 4 },
  { n: 'Kenan Y.',     pos: 'MID', role: 'AM',  num: 21, age: 20, ovr: 80, pot: 90, nat: 'TR', fit: 92, mor: 5, wage: 180000, val: 38000000, form: [7.4,7.6,7.1,7.8,7.5], ctr: 5 },
  { n: 'Yunus A.',     pos: 'MID', role: 'RW',  num: 22, age: 25, ovr: 77, pot: 82, nat: 'TR', fit: 86, mor: 4, wage: 95000,  val: 11000000, form: [6.9,7.1,6.8,7.2,6.7], ctr: 2 },
  // FWD
  { n: 'Arda G.',      pos: 'FWD', role: 'AM',  num: 19, age: 21, ovr: 84, pot: 90, nat: 'TR', fit: 94, mor: 5, wage: 280000, val: 48000000, form: [8.0,7.8,8.4,7.9,8.1], ctr: 5 },
  { n: 'Semih K.',     pos: 'FWD', role: 'ST',  num: 9,  age: 32, ovr: 82, pot: 82, nat: 'TR', fit: 78, mor: 3, wage: 230000, val: 16000000, form: [7.4,7.0,7.2,7.5,6.8], ctr: 1 },
  { n: 'Enes Ü.',      pos: 'FWD', role: 'ST',  num: 11, age: 24, ovr: 79, pot: 85, nat: 'TR', fit: 91, mor: 4, wage: 150000, val: 18500000, form: [7.2,7.4,6.9,7.6,7.1], ctr: 3 },
  { n: 'Halil D.',     pos: 'FWD', role: 'LW',  num: 20, age: 22, ovr: 77, pot: 86, nat: 'TR', fit: 90, mor: 4, wage: 105000, val: 15000000, form: [7.0,6.8,7.1,6.9,7.2], ctr: 4, status: 'suspended' },
  { n: 'Efe A.',       pos: 'FWD', role: 'ST',  num: 23, age: 19, ovr: 72, pot: 87, nat: 'TR', fit: 95, mor: 5, wage: 40000,  val: 4800000,  form: [6.5,6.7,6.4,6.8,6.6], ctr: 5, status: 'training' },
  { n: 'Mert K.',      pos: 'FWD', role: 'ST',  num: 18, age: 28, ovr: 76, pot: 76, nat: 'TR', fit: 82, mor: 3, wage: 85000,  val: 8400000,  form: [6.8,6.5,6.9,6.7,6.6], ctr: 2, status: 'listed' },
];

// Transfer market — external players you can buy (realistic names but NOT real-world players; fictionalized)
const TRANSFER_LIST = [
  { n: 'O. Nkemba',    pos: 'FWD', role: 'ST',  age: 24, ovr: 86, pot: 89, nat: 'NG', price: 68000000, hoursOn: 4,  decay: '↓6sa', seller: 'bot',  clubId: 'izm' },
  { n: 'J. Okafor',    pos: 'FWD', role: 'LW',  age: 22, ovr: 82, pot: 88, nat: 'NG', price: 38000000, hoursOn: 12, decay: '↓12sa', seller: 'bot', clubId: 'ada' },
  { n: 'V. Laszlo',    pos: 'MID', role: 'CM',  age: 26, ovr: 84, pot: 85, nat: 'HU', price: 42000000, hoursOn: 2,  decay: '↑2sa',  seller: 'user', sellerName: 'Ahmet D.', clubId: 'ank' },
  { n: 'M. Kovač',     pos: 'DEF', role: 'CB',  age: 28, ovr: 83, pot: 83, nat: 'HR', price: 28000000, hoursOn: 8,  decay: '↓8sa',  seller: 'bot', clubId: 'kay' },
  { n: 'A. Diakité',   pos: 'MID', role: 'CDM', age: 23, ovr: 80, pot: 87, nat: 'FR', price: 26000000, hoursOn: 6,  decay: '↓6sa',  seller: 'user', sellerName: 'Elif Ö.', clubId: 'brs' },
  { n: 'L. Pereira',   pos: 'FWD', role: 'RW',  age: 21, ovr: 79, pot: 88, nat: 'BR', price: 24000000, hoursOn: 3,  decay: '↑3sa',  seller: 'bot', clubId: 'ant' },
  { n: 'N. Álvarez',   pos: 'DEF', role: 'RB',  age: 25, ovr: 81, pot: 83, nat: 'AR', price: 18000000, hoursOn: 14, decay: '↓14sa', seller: 'user', sellerName: 'Kaan T.', clubId: 'ada' },
  { n: 'F. Schulze',   pos: 'GK',  role: 'GK',  age: 29, ovr: 82, pot: 82, nat: 'DE', price: 16000000, hoursOn: 22, decay: '↓22sa', seller: 'bot', clubId: 'tra' },
  { n: 'R. Papadakis',  pos: 'MID', role: 'LW',  age: 27, ovr: 78, pot: 80, nat: 'GR', price: 11000000, hoursOn: 5,  decay: '↓5sa',  seller: 'bot', clubId: 'esk' },
  { n: 'I. Moreno',    pos: 'FWD', role: 'ST',  age: 30, ovr: 77, pot: 77, nat: 'ES', price: 7500000,  hoursOn: 18, decay: '↓18sa', seller: 'bot', clubId: 'gaz' },
  { n: 'T. Novák',     pos: 'MID', role: 'AM',  age: 20, ovr: 74, pot: 86, nat: 'CZ', price: 9200000,  hoursOn: 1,  decay: '↑1sa',  seller: 'bot', clubId: 'kon' },
  { n: 'H. Sørensen',  pos: 'DEF', role: 'LB',  age: 26, ovr: 76, pot: 78, nat: 'DK', price: 5800000,  hoursOn: 10, decay: '↓10sa', seller: 'bot', clubId: 'sam' },
];

// Global transfer ticker — "shared universe" feed, other leagues' transfers too
const GLOBAL_TRANSFERS = [
  { buyer: 'Ahmet D.',   buyerClub: 'ank', player: 'V. Laszlo',   price: 42000000, seller: 'bot' },
  { buyer: 'Elif Ö.',    buyerClub: 'izm', player: 'O. Nkemba',   price: 75000000, seller: 'bot' },
  { buyer: 'Kaan T.',    buyerClub: 'brs', player: 'A. Diakité',  price: 26000000, seller: 'user', sellerName: 'Mehmet S.' },
  { buyer: 'Deniz A.',   buyerClub: 'kay', player: 'L. Pereira',  price: 24000000, seller: 'bot' },
  { buyer: 'Zeynep K.',  buyerClub: 'ada', player: 'N. Álvarez',  price: 18000000, seller: 'bot' },
  { buyer: 'Ceren P.',   buyerClub: 'gaz', player: 'F. Schulze',  price: 16000000, seller: 'bot' },
];

// Fixtures — next 3 matches for user
const FIXTURES = [
  { date: 'Yarın · 21:00', home: 'ist', away: 'ank', derby: false, venue: 'Şehir Arena' },
  { date: 'Pzr · 21:00',   home: 'izm', away: 'ist', derby: false, venue: 'Körfez Stadı' },
  { date: 'Çrş · 21:00',   home: 'ist', away: 'brs', derby: false, venue: 'Şehir Arena' },
];

// Previous results (for table)
const LEAGUE_TABLE = [
  { clubId: 'ist', p: 7, w: 5, d: 1, l: 1, gf: 14, ga: 6, pts: 16, form: ['W','W','D','W','W'] },
  { clubId: 'izm', p: 7, w: 5, d: 1, l: 1, gf: 12, ga: 5, pts: 16, form: ['W','L','W','W','W'] },
  { clubId: 'ank', p: 7, w: 4, d: 2, l: 1, gf: 11, ga: 7, pts: 14, form: ['D','W','W','W','D'] },
  { clubId: 'tra', p: 7, w: 4, d: 1, l: 2, gf: 10, ga: 8, pts: 13, form: ['W','L','W','D','W'] },
  { clubId: 'brs', p: 7, w: 3, d: 3, l: 1, gf: 9,  ga: 6, pts: 12, form: ['D','W','D','D','W'] },
  { clubId: 'kay', p: 7, w: 3, d: 2, l: 2, gf: 8,  ga: 7, pts: 11, form: ['W','W','L','D','L'] },
  { clubId: 'ada', p: 7, w: 3, d: 1, l: 3, gf: 9,  ga: 9, pts: 10, form: ['L','W','W','L','D'] },
  { clubId: 'kon', p: 7, w: 2, d: 3, l: 2, gf: 7,  ga: 8, pts: 9,  form: ['D','D','W','L','D'] },
  { clubId: 'ant', p: 7, w: 2, d: 2, l: 3, gf: 7,  ga: 10,pts: 8,  form: ['L','W','D','D','L'] },
  { clubId: 'sam', p: 7, w: 2, d: 2, l: 3, gf: 6,  ga: 9, pts: 8,  form: ['L','D','W','L','W'] },
  { clubId: 'gaz', p: 7, w: 2, d: 1, l: 4, gf: 7,  ga: 11,pts: 7,  form: ['W','L','L','D','L'] },
  { clubId: 'esk', p: 7, w: 2, d: 1, l: 4, gf: 6,  ga: 10,pts: 7,  form: ['L','W','D','L','L'] },
  { clubId: 'mal', p: 7, w: 1, d: 3, l: 3, gf: 5,  ga: 8, pts: 6,  form: ['D','D','L','W','D'] },
  { clubId: 'riz', p: 7, w: 1, d: 2, l: 4, gf: 5,  ga: 10,pts: 5,  form: ['L','L','D','W','D'] },
  { clubId: 'diy', p: 7, w: 1, d: 1, l: 5, gf: 4,  ga: 11,pts: 4,  form: ['L','L','W','L','L'] },
  { clubId: 'sak', p: 7, w: 0, d: 2, l: 5, gf: 3,  ga: 12,pts: 2,  form: ['L','D','L','L','D'] },
];

// Crew chat messages
const CHAT = [
  { from: 'u2', text: 'bu hafta kupa çekilişi yapalım mı?', t: '14:02' },
  { from: 'u3', text: 'ben hazırım 🔥 ama önce senin defans göçüyor Ahmet', t: '14:03' },
  { from: 'u2', text: 'lafı mı olur, Vinicius Jr tarzımda çocuk aldım görürsün', t: '14:05' },
  { from: 'u5', text: 'tribüne bişey yazdırıp derbi kazanmaca 💀', t: '14:08' },
  { from: 'u1', text: 'derbi yarın, ben çoktan kadroyu kurdum Baran Alper ilk 11', t: '14:12' },
  { from: 'u2', text: 'iyi bekliyorum 😤', t: '14:12' },
  { from: 'u7', text: 'scout 3 forvet döndü, biri 18 yaşında 86 pot 💎', t: '14:21' },
  { from: 'u9', text: 'scout raporu at buraya', t: '14:22' },
];

// Global feed — shared universe events
const GLOBAL_FEED = [
  { t: '2dk', type: 'transfer', text: 'Ahmet D. → V. Laszlo\'yu €42M karşılığında aldı', clubId: 'ank' },
  { t: '14dk', type: 'match',   text: 'Elif Ö. derbisini 3-1 kazandı (vs Kaan T.)', clubId: 'izm' },
  { t: '1sa', type: 'scout',    text: 'Mehmet S. kaşif gönderdi (Brezilya · FWD)', clubId: 'tra' },
  { t: '2sa', type: 'transfer', text: 'Deniz A. → L. Pereira\'yı €24M karşılığında aldı', clubId: 'kay' },
  { t: '3sa', type: 'paper',    text: 'Haftalık gazete yayınlandı — "KAYSERİ UÇURDU"', clubId: 'kay' },
  { t: '4sa', type: 'transfer', text: 'Zeynep K. → N. Álvarez\'i €18M karşılığında aldı', clubId: 'ada' },
  { t: '6sa', type: 'morale',   text: 'Ceren P. takımı moralini 5\'e çıkardı', clubId: 'gaz' },
  { t: '8sa', type: 'match',    text: 'Yusuf V. hat-trick yapan oyuncusuna 9.4 rating verdi', clubId: 'sam' },
];

// Live match state — current moment snapshot
const LIVE_MATCH = {
  home: 'ist', away: 'ank',
  scoreH: 2, scoreA: 1,
  minute: 74,
  possessionH: 56, possessionA: 44,
  shotsH: 12, shotsA: 7,
  shotsOnH: 5, shotsOnA: 3,
  cornersH: 6, cornersA: 3,
  cardsH: 1, cardsA: 3,
  crowdEnergy: 82, // 0-100
};

// AI commentary feed (most recent first when rendered bottom-up, or chronological)
const COMMENTARY = [
  { m: 74, icon: '⚽', type: 'goal', text: 'ARDA! 21 yaşındaki 10 numara, sol ayağıyla köşeye bıraktı. İŞF 2-1 öne geçti! Stat\'a göre derbilerde ilk golün geldiği takım %71 kazanıyor.' },
  { m: 72, icon: '🎯', type: 'shot', text: 'Kerem Aktürkoğlu sol kanattan içeri döndü, vuruşu direğin dibinden auta gitti. Şehir Arena inledi.' },
  { m: 68, icon: '🟨', type: 'card', text: 'Ankara Kale 10 numarası sert girdi — sarı kart. Hakan Ç. tepesi atmış halde hakemle konuşuyor.' },
  { m: 64, icon: '🔄', type: 'sub', text: 'Baran Alper Yılmaz yerine Halil D. — taze bacaklar, kanat baskısı.' },
  { m: 58, icon: '📣', type: 'analysis', text: 'Son 6 dakikada Ankara Kale topa daha çok sahip — ev sahibi geri çekildi, tehlike sinyalleri.' },
  { m: 52, icon: '⚽', type: 'goal', text: 'ANKARA EŞİTLEDİ! Orta sahadan gelen topu klasik bir vuruşla filelerle buluşturdu. 1-1!' },
  { m: 45, icon: '⏱', type: 'half', text: 'İlk yarı sonu. İŞF 1, Ankara Kale 0. Hakan\'ın direkten dönen vuruşu hâlâ aklımda.' },
  { m: 38, icon: '⚽', type: 'goal', text: 'ARDA GÜLER! 2013\'teki derbi hissiyatını yaşatan bir vuruş — sol çaprazdan köşeye. İŞF öne geçti!' },
  { m: 24, icon: '🎯', type: 'shot', text: 'Hakan\'ın frikiği direkten döndü. Milim farkla gol değil.' },
  { m: 12, icon: '⚽', type: 'start', text: 'Düdük çaldı. Derbi Şehir Arena\'da başladı. 42.000 kişi ayakta.' },
];

// Team of the Week (for newspaper)
const TOTW = [
  { n: 'Uğurcan Çakır',   pos: 'GK',  clubId: 'ist', rating: 8.4 },
  { n: 'Ferdi Kadıoğlu',     pos: 'LB',  clubId: 'ist', rating: 8.1 },
  { n: 'Merih Demiral',     pos: 'CB',  clubId: 'ist', rating: 8.3 },
  { n: 'M. Kovač',     pos: 'CB',  clubId: 'kay', rating: 8.0 },
  { n: 'N. Álvarez',   pos: 'RB',  clubId: 'ada', rating: 7.9 },
  { n: 'Hakan Çalhanoğlu',     pos: 'CM',  clubId: 'ist', rating: 8.6 },
  { n: 'V. Laszlo',    pos: 'CM',  clubId: 'ank', rating: 8.2 },
  { n: 'Kerem Aktürkoğlu',     pos: 'LW',  clubId: 'ist', rating: 8.5 },
  { n: 'Arda Güler',      pos: 'AM',  clubId: 'ist', rating: 9.1 },
  { n: 'Barış Alper Yılmaz',     pos: 'RW',  clubId: 'ist', rating: 8.0 },
  { n: 'O. Nkemba',    pos: 'ST',  clubId: 'izm', rating: 8.8 },
];

// Top scorers / assists
const TOP_SCORERS = [
  { n: 'O. Nkemba',  clubId: 'izm', g: 9 },
  { n: 'Arda Güler',    clubId: 'ist', g: 7 },
  { n: 'Kerem Aktürkoğlu',   clubId: 'ist', g: 6 },
  { n: 'Semih Kılıçsoy',   clubId: 'ist', g: 5 },
  { n: 'V. Laszlo',  clubId: 'ank', g: 5 },
];
const TOP_ASSISTS = [
  { n: 'Hakan Çalhanoğlu',      clubId: 'ist', a: 8 },
  { n: 'Arda Güler',       clubId: 'ist', a: 6 },
  { n: 'Kenan Yıldız',      clubId: 'ist', a: 5 },
  { n: 'Barış Alper Yılmaz',clubId: 'ist', a: 4 },
  { n: 'V. Laszlo',     clubId: 'ank', a: 4 },
];

Object.assign(window, {
  CLUBS, CREW, SQUAD, TRANSFER_LIST, GLOBAL_TRANSFERS,
  FIXTURES, LEAGUE_TABLE, CHAT, GLOBAL_FEED, LIVE_MATCH, COMMENTARY,
  TOTW, TOP_SCORERS, TOP_ASSISTS, POSITIONS,
  USER_CLUB_ID, USER_CLUB,
  clubById: (id) => CLUBS.find(c => c.id === id),
  playerByName: (n) => SQUAD.find(p => p.n === n),
});
