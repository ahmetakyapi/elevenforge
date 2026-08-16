/**
 * Turkish match commentary.
 *
 * ─── What this is for ───────────────────────────────────────────────────
 *
 * The old version wrote five lines a match: a kick-off, one line per goal,
 * one per card, half time, full time. A 1-0 read as four sentences, and three
 * of those were furniture. There was nothing to WATCH — the replay screen was
 * a results table with a timestamp column.
 *
 * A match is mostly the football between the goals. So the engine now emits
 * chances, saves, misses, corners, counters, injuries and tactical beats, and
 * this file gives each of them language. A goal is built in two parts —
 * how the move started, then how it was finished — so the same scorer reads
 * differently on a counter-attack and on a corner, and the feed reads like
 * passages of play rather than a list of names.
 *
 * TONE. Measured, not shouty. The old templates ran at maximum volume for
 * every event ("İNANILMAZ BİR GOL!"), which flattens everything: if a tap-in
 * and a 30-yard winner are announced the same way, neither lands. Ordinary
 * moments are narrated calmly here; the volume is saved for the goals, and
 * within goals for the late ones and the ones that change the scoreline.
 *
 * DETERMINISM. Every template choice is drawn from the caller's seeded RNG,
 * never Math.random. The engine persists its seed so a fixture always
 * reproduces the same match; drawing commentary from an unseeded source broke
 * that — the scoreline replayed identically but the report describing it was
 * different every time.
 */

type GoalCtx = {
  scorer: string;
  assister?: string;
  minute: number;
  scoringClubName: string;
  concedingClubName: string;
  runningHome: number;
  runningAway: number;
  derby: boolean;
  /** How the move arrived: shapes the build-up sentence. */
  origin: "open" | "counter" | "corner" | "cross" | "solo" | "long";
  /** Scoreline state after this goal, from the scorer's side. */
  state: "opened" | "equalised" | "ahead" | "extended" | "consolation";
};

type CardCtx = { player: string; minute: number; kind: "yellow" | "red" };
type ChanceCtx = { player: string; assister?: string; clubName: string };
type SaveCtx = { player: string; keeper: string };
type PlainCtx = { player: string; clubName: string };

/** Draw from `arr` using the caller-supplied RNG. */
const pick = <T>(arr: readonly T[], rng: () => number) =>
  arr[Math.floor(rng() * arr.length)];

const format = (tpl: string, ctx: Record<string, unknown>) =>
  tpl.replace(/\{(\w+)\}/g, (_, k) => String(ctx[k] ?? ""));

// ─── Goals: build-up, then finish ───────────────────────────────────────
// Split in two so the same twelve finishes serve six different origins.
// Twelve templates would otherwise have to be written six times over, and
// they would drift apart the moment one was edited.

const BUILDUP: Record<GoalCtx["origin"], readonly string[]> = {
  open: [
    "Sabırlı bir kurulum, top sağdan sola dolaştı.",
    "Orta alanda üstünlük kuruldu, savunma geriye gömüldü.",
    "Pas trafiği ceza sahasının önünde yoğunlaştı.",
    "Oyun rakip yarı sahaya taşındı, alan daraldı.",
  ],
  counter: [
    "Top orta sahada kapıldı, kontra başladı.",
    "Rakip hücumda kalmıştı — dört kişilik hızlı çıkış.",
    "Tek pasla savunmanın arkası bulundu.",
    "Kaptığı gibi ileri: savunma dönemedi bile.",
  ],
  corner: [
    "Korner kullanıldı, ceza sahasında kalabalık var.",
    "Duran topta savunma adam adama geçmişti.",
    "İkinci top ceza sahası içinde kaldı.",
  ],
  cross: [
    "Kanattan bindirme geldi, savunma ortaya kaydı.",
    "Dip çizgiye inildi, geriye çevrildi.",
    "Uzun bir orta arka direğe düştü.",
  ],
  solo: [
    "Topu aldığı yerden taşımaya başladı.",
    "İlk adamı geçti, ikincisi de yetişemedi.",
    "Alanı buldu ve kimse önüne çıkamadı.",
  ],
  long: [
    "Kaleciden uzun bir top, savunmanın arkasına.",
    "Tek dokunuşla ikili mücadeleyi kazandı.",
    "Uzun top savunmanın arasından sekti.",
  ],
};

const FINISH_ASSISTED: readonly string[] = [
  "{assister} son pası verdi, {scorer} tek dokunuşla bitirdi.",
  "{assister} gördü, {scorer} boş bıraktığı köşeye gönderdi.",
  "Pas {assister}, gol {scorer}. Kaleci hamle bile yapamadı.",
  "{assister} çevirdi, {scorer} önüne geleni ağlara yolladı.",
  "{scorer}, {assister} sayesinde kolay olanı yaptı — ağlar havalandı.",
];

const FINISH_SOLO: readonly string[] = [
  "{scorer} vurdu — direğin dibine.",
  "{scorer} sağ ayağının içiyle köşeye bıraktı.",
  "{scorer} kaleciyle karşı karşıya kaldı ve soğukkanlı bitirdi.",
  "{scorer} ceza sahası dışından denedi, top üst köşeye gitti.",
  "{scorer} hiç düşünmeden vurdu ve top ağlarda.",
];

/** The line that follows the goal, sized to what it did to the match. */
const AFTERMATH: Record<GoalCtx["state"], readonly string[]> = {
  opened: [
    "Skoru açan taraf oldular: {runningHome}-{runningAway}.",
    "İlk gol geldi. {runningHome}-{runningAway}.",
  ],
  equalised: [
    "Beraberlik golü. Maç yeniden başlıyor: {runningHome}-{runningAway}.",
    "Skor eşitlendi — {runningHome}-{runningAway}. Şimdi her şey yeniden mümkün.",
  ],
  ahead: [
    "{scoringClubName} öne geçti: {runningHome}-{runningAway}.",
    "Üstünlük el değiştirdi. {runningHome}-{runningAway}.",
  ],
  extended: [
    "Farkı açtılar: {runningHome}-{runningAway}.",
    "{concedingClubName} için işler zorlaşıyor. {runningHome}-{runningAway}.",
  ],
  consolation: [
    "Farkı bire indiremeseler de bir umut: {runningHome}-{runningAway}.",
    "En azından skoru yumuşattılar. {runningHome}-{runningAway}.",
  ],
};

const LATE_GOAL: readonly string[] = [
  "Ve bunu telafi edecek zaman kalmadı.",
  "Son dakikalarda gelen gol her şeyi değiştirir.",
  "Saat 85'i geçmişti — ağır bir darbe.",
];

const DERBY_NOTE: readonly string[] = [
  "Derbide bu golün ağırlığı başka.",
  "Tribün ayakta — derbi golü.",
  "Bu skor bu şehirde uzun süre konuşulur.",
];

// ─── Everything between the goals ───────────────────────────────────────

const CHANCE: readonly string[] = [
  "{player} iyi bir pozisyona girdi ama son vuruşta acele etti.",
  "{clubName} ceza sahasına girdi, {player} vurdu — savunmadan döndü.",
  "{player} boşluğu buldu; müdahale son anda geldi.",
  "{clubName} sağ kanattan geldi, ortada {player} yetişemedi.",
  "{player} kafayı vurdu, top savunmaya çarpıp kornere gitti.",
];

const SAVE: readonly string[] = [
  "{player} vurdu, {keeper} çeldi. İyi refleks.",
  "{keeper} tam köşeye giden topu son anda kurtardı — {player} başını tuttu.",
  "{player} çok iyi vurdu ama {keeper} oradaydı.",
  "Ceza sahası dışından {player}; {keeper} yumrukladı.",
  "{keeper} bu maçta ekmeğini yiyor: {player} yine geçemedi.",
];

const MISS: readonly string[] = [
  "{player} vurdu, top az farkla dışarı.",
  "{player} kaleyi bulamadı — üstten auta.",
  "Pozisyon {player} için biçilmiş kaftandı ama top direğin yanından geçti.",
  "{player} denedi, isabet yok.",
];

const CORNER: readonly string[] = [
  "{clubName} korner kazandı, herkes ceza sahasına yürüyor.",
  "Köşe vuruşu {clubName} lehine — savunma yerini alıyor.",
  "Yeni bir korner. {clubName} baskıyı sürdürüyor.",
];

const DUEL: readonly string[] = [
  "Orta alanda sert bir mücadele, hakem devam dedi.",
  "{player} topu kazandı ve oyunu yeniden kurdu.",
  "Oyun bir süredir orta sahada düğümlendi.",
  "{player} ikili mücadeleden galip çıktı.",
];

const INJURY: readonly string[] = [
  "{player} yerde kaldı. Sağlık ekibi içeri girdi.",
  "{player} bacağını tutuyor — bu iyi görünmüyor.",
  "Oyun durdu: {player} devam edemeyecek gibi.",
];

const CARD_YELLOW: readonly string[] = [
  "{player} geç müdahale etti, hakem sarı kartı gösterdi.",
  "Hakem {player} ile konuştu ve sarıyı çıkardı.",
  "İtiraz {player} için sarı kartla sonuçlandı.",
  "Taktik faul — {player} kartını gördü.",
];

const CARD_RED: readonly string[] = [
  "İkinci sarıdan kırmızı. {player} oyundan atıldı.",
  "Ağır bir müdahaleydi, {player} direkt kırmızı gördü. Bir eksikle devam.",
  "Hakem tereddüt etmedi: {player} için oyun bitti.",
];

// ─── Tactical beats ─────────────────────────────────────────────────────
// Emitted when one side is genuinely dominating a phase, so the line says
// something true about the match instead of filling air.

const ANALYSIS_DOMINANT: readonly string[] = [
  "{clubName} oyunu tamamen eline aldı; rakip yarı sahadan çıkamıyor.",
  "Top {clubName} ayağında dolaşıyor, rakip bloğunu geriye çekti.",
  "{clubName} baskısı meyvesini vermek üzere — pozisyonlar üst üste geliyor.",
];

const ANALYSIS_TIGHT: readonly string[] = [
  "İki takım da riske girmiyor; oyun orta sahada kilitlendi.",
  "Temkinli bir bölüm. Hata bekleyen iki takım var sahada.",
  "Pozisyon üretmek zorlaşıyor, alanlar iyice kapandı.",
];

const ANALYSIS_OPEN: readonly string[] = [
  "Maç açıldı — iki takım da karşılıklı atağa çıkıyor.",
  "Savunmalar yorgun, oyun bir uçtan bir uca akıyor.",
];

export const buildCommentary = {
  kickoff(
    ctx: {
      homeClubName: string;
      awayClubName: string;
      referee: string;
      strictness: number;
      derby: boolean;
      crowd: number;
    },
  ): string {
    const refNote =
      ctx.strictness >= 4
        ? "Kartını erken çıkaran bir hakem."
        : ctx.strictness <= 2
          ? "Oyunu akıcı tutmayı seven bir hakem."
          : "Dengeli bir yönetim bekleniyor.";
    const atmosphere = ctx.derby
      ? "Derbi. Stat çoktan doldu ve ses hiç kesilmiyor."
      : ctx.crowd >= 75
        ? "Tribünler dolu, zemin iyi durumda."
        : "Sakin bir başlangıç atmosferi.";
    return `Maç başladı. ${ctx.homeClubName} sahasında ${ctx.awayClubName} ile karşı karşıya. Hakem ${ctx.referee} — ${refNote} ${atmosphere}`;
  },

  goal(ctx: GoalCtx, rng: () => number): string {
    const buildUp = pick(BUILDUP[ctx.origin], rng);
    const finish = format(
      ctx.assister ? pick(FINISH_ASSISTED, rng) : pick(FINISH_SOLO, rng),
      ctx,
    );
    const aftermath = format(pick(AFTERMATH[ctx.state], rng), ctx);
    const extras: string[] = [];
    if (ctx.minute >= 85 && (ctx.state === "ahead" || ctx.state === "equalised")) {
      extras.push(pick(LATE_GOAL, rng));
    }
    if (ctx.derby && rng() < 0.45) extras.push(pick(DERBY_NOTE, rng));
    return [buildUp, finish, aftermath, ...extras].join(" ");
  },

  chance: (ctx: ChanceCtx, rng: () => number) => format(pick(CHANCE, rng), ctx),
  save: (ctx: SaveCtx, rng: () => number) => format(pick(SAVE, rng), ctx),
  miss: (ctx: ChanceCtx, rng: () => number) => format(pick(MISS, rng), ctx),
  corner: (ctx: { clubName: string }, rng: () => number) =>
    format(pick(CORNER, rng), ctx),
  duel: (ctx: PlainCtx, rng: () => number) => format(pick(DUEL, rng), ctx),
  injury: (ctx: { player: string }, rng: () => number) =>
    format(pick(INJURY, rng), ctx),

  card(ctx: CardCtx, rng: () => number): string {
    const tpl = ctx.kind === "red" ? pick(CARD_RED, rng) : pick(CARD_YELLOW, rng);
    return format(tpl, ctx);
  },

  analysis(
    ctx: { mood: "dominant" | "tight" | "open"; clubName: string },
    rng: () => number,
  ): string {
    const pool =
      ctx.mood === "dominant"
        ? ANALYSIS_DOMINANT
        : ctx.mood === "tight"
          ? ANALYSIS_TIGHT
          : ANALYSIS_OPEN;
    return format(pick(pool, rng), ctx);
  },

  halfTime(ctx: {
    homeClubName: string;
    awayClubName: string;
    home: number;
    away: number;
  }): string {
    const state =
      ctx.home === ctx.away
        ? ctx.home === 0
          ? "Golsüz bir ilk yarı geride kaldı."
          : "İlk yarı beraberlikle kapandı."
        : "İlk yarının kazananı belli.";
    return `Devre arası. ${state} ${ctx.homeClubName} ${ctx.home} — ${ctx.away} ${ctx.awayClubName}.`;
  },

  fullTime(ctx: {
    homeClubName: string;
    awayClubName: string;
    home: number;
    away: number;
  }): string {
    const verdict =
      ctx.home === ctx.away
        ? "Puanlar paylaşıldı."
        : Math.abs(ctx.home - ctx.away) >= 3
          ? "Tek taraflı bir maçtı."
          : "Kazanan farkı korumayı bildi.";
    return `Maç bitti. ${ctx.homeClubName} ${ctx.home} — ${ctx.away} ${ctx.awayClubName}. ${verdict}`;
  },
};
