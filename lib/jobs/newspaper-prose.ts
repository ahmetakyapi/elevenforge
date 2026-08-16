/**
 * The writing in the newspaper.
 *
 * Kept apart from newspaper-sections.ts, which is about QUERIES: what
 * happened this week, in what order, to whom. This file is about the VOICE —
 * the verdicts, the column, the manager report cards, the rumour desk, the
 * reader letters. Two very different kinds of change, and mixing them means
 * every joke edit risks a database query.
 *
 * ─── The rule the humour follows ────────────────────────────────────────
 *
 * Every line is derived from something that actually happened. A joke that
 * could have been printed in any week of any season is not a joke, it is
 * filler, and the reader spots it on the second paper. So the templates take
 * arguments — this manager, that scoreline, this position in the table — and
 * the selection is driven by the result, not by a dice roll over a generic
 * pool. "Kalesinde 5 gol gördü" is funny about the specific person it names.
 *
 * The other rule: it is rude about RESULTS, never about people. This is a
 * league of friends, and a paper that reads as genuinely insulting stops
 * being fun on the first bad week. The register is Turkish sports-press
 * melodrama — koltuk sallanıyor, taraftar isyanda, yönetimden ses yok —
 * which is affectionate precisely because everybody knows it is a pose.
 *
 * DETERMINISM. Everything draws from a seeded RNG so a given league-week
 * always produces the same paper. It is generated once and stored, so this is
 * belt and braces — but regenerating a week must not silently rewrite what
 * people already read and quoted at each other.
 */

/** Small deterministic RNG, seeded per league-week. */
export function seededRng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

const pick = <T>(arr: readonly T[], r: () => number): T =>
  arr[Math.floor(r() * arr.length)];

const fill = (tpl: string, ctx: Record<string, unknown>) =>
  tpl.replace(/\{(\w+)\}/g, (_, k) => String(ctx[k] ?? ""));

// ─── Match verdicts ─────────────────────────────────────────────────────

export type VerdictCtx = {
  winner: string;
  loser: string;
  winnerManager: string;
  loserManager: string;
  home: string;
  away: string;
  diff: number;
  goalless: boolean;
  drawn: boolean;
  derby: boolean;
};

const V_ROUT = [
  "{winner} sahaya çıktı, {loser} ise anlaşılan otobüste kaldı. {loserManager} maç boyunca teknik alanda kollarını iki kez kavuşturdu; üçüncüsüne gerek görmedi.",
  "{winner} bu skoru alırken zorlanmadı. {loserManager} için tek teselli: hafta yedi gün ve maç sadece bir gün sürdü.",
  "Bu bir maç değil, {winner} adına bir antrenmandı. {loserManager} soyunma odasında konuşacak çok şey bulacak — hepsi kötü.",
  "{winner} işini erken bitirdi. {loser} taraftarı 60. dakikada çıkışa yöneldi, {loserManager} da onlara katılmayı düşünmüş olmalı.",
];

const V_COMFORTABLE = [
  "{winner} kontrolü hiç bırakmadı. {winnerManager} planını kurdu, oyuncuları uyguladı; {loserManager} ise planını hâlâ arıyor.",
  "{winner} net kazandı. {loserManager}'in maç sonu açıklaması merakla bekleniyor — özellikle savunma bölümü.",
  "{winnerManager} istediğini aldı. {loser} cephesinde ise sessizlik hâkim; yönetimden de ses yok.",
];

const V_NARROW = [
  "Tek gol yetti. {winnerManager} kazandığı için mutlu, {loserManager} ise 'oyun olarak iyiydik' cümlesini kurmaya hazırlanıyor.",
  "{winner} farkı korumayı bildi. {loser} son on dakikada her şeyi denedi, top hariç.",
  "Maçın kaderini tek pozisyon belirledi. {loserManager} o pozisyonu bu gece tekrar tekrar izleyecek.",
];

const V_GOALLESS = [
  "{home} ile {away} birbirini fazlasıyla tanıdı. Kale önünde ise kimse kimseyi tanımadı.",
  "Golsüz. İki takım da hücumu bir sonraki haftaya erteledi. {homeManager} ve {awayManager} bu kararda hemfikir görünüyor.",
  "Doksan dakika, sıfır gol, çok sayıda geri pas. Kaleciler bu maçtan yorulmadan çıktı.",
];

const V_DRAW = [
  "Puanlar paylaşıldı. İki manajer de 'kazanabilirdik' diyecek; ikisi de haksız değil.",
  "Beraberlik. {homeManager} bir puana razı görünüyor, {awayManager} ise deplasmandan puanla dönmenin hesabını yapıyor.",
  "Ne kazanan var ne kaybeden — sadece iki takım ve bir tabelada duran eşit sayı.",
];

const V_DERBY = [
  "Derbi, {winner} tarafına yazıldı. Bu şehirde bir hafta boyunca tek konu bu olacak.",
  "Derbide {winnerManager} güldü. {loserManager} önümüzdeki hafta sokağa çıkarken iki kez düşünecek.",
];

export function matchVerdict(ctx: VerdictCtx, r: () => number): string {
  const extra = {
    ...ctx,
    homeManager: ctx.winner === ctx.home ? ctx.winnerManager : ctx.loserManager,
    awayManager: ctx.winner === ctx.away ? ctx.winnerManager : ctx.loserManager,
  };
  if (ctx.derby && !ctx.drawn && r() < 0.6) return fill(pick(V_DERBY, r), extra);
  if (ctx.goalless) return fill(pick(V_GOALLESS, r), extra);
  if (ctx.drawn) return fill(pick(V_DRAW, r), extra);
  if (ctx.diff >= 3) return fill(pick(V_ROUT, r), extra);
  if (ctx.diff === 2) return fill(pick(V_COMFORTABLE, r), extra);
  return fill(pick(V_NARROW, r), extra);
}

// ─── The lead article ───────────────────────────────────────────────────

export type LeadCtx = VerdictCtx & {
  homeScore: number;
  awayScore: number;
  scorers: string[];
  crowd: number;
  referee: string;
};

/**
 * Three paragraphs, because a lead story that is one sentence long is a
 * caption. Built from the actual scorers and the actual scoreline, so it
 * reads as a report of this match rather than of a match.
 */
export function leadArticle(ctx: LeadCtx, r: () => number): string[] {
  const opener = ctx.drawn
    ? fill(
        pick(
          [
            "{home} ile {away} arasındaki maç, kazananını bulamadan tamamlandı.",
            "Haftanın en çok konuşulan karşılaşmasından eşitlik çıktı: {home} {homeScore} - {awayScore} {away}.",
          ],
          r,
        ),
        ctx,
      )
    : fill(
        pick(
          [
            "{winner}, {loser} karşısında sahadan galip ayrıldı ve haftanın manşetini tek başına yazdırdı.",
            "Bu hafta konuşulacak maç buydu: {winner}, {loser} deplasmanını bir formaliteye çevirdi.",
            "{winnerManager} yönetimindeki {winner}, {loser} karşısında istediğini aldı.",
          ],
          r,
        ),
        ctx,
      );

  const middle =
    ctx.scorers.length > 0
      ? `Skoru getiren isimler sırasıyla ${ctx.scorers.join(", ")} oldu. ${
          ctx.scorers.length >= 3
            ? "Bu kadar farklı ayaktan gol gelmesi, rakip savunma için ayrı bir tartışma konusu."
            : "İki takım da pozisyonu bulmakta zorlanmadı; farkı bitiricilik yaptı."
        }`
      : "Doksan dakika boyunca ağlar havalanmadı; iki savunma da kendi adına iyi bir akşam geçirdi.";

  const closer = fill(
    pick(
      [
        "Maçı {referee} yönetti. Tribünlerde atmosfer yüksekti; {winnerManager} maç sonunda taraftara doğru yürüyüp alkışladı.",
        "Karşılaşmanın hakemi {referee} idi. {loserManager}'in maç sonu ilk işi, hakemden çok kendi yarı sahasına bakmak oldu.",
        "Düdüğün sahibi {referee}'ydi. İki manajer de sahayı terk ederken uzun uzun konuştu — muhtemelen aynı konuyu değil.",
      ],
      r,
    ),
    ctx,
  );

  return [opener, middle, closer];
}

// ─── The columnist ──────────────────────────────────────────────────────

/**
 * A recurring by-line, chosen from the week so the same league keeps meeting
 * the same writers. A column signed by nobody is a paragraph; signed by
 * "Cüneyt Sarıot" every third week, it becomes a character the league
 * complains about.
 */
export const COLUMNISTS = [
  { name: "Cüneyt Sarıot", beat: "Her şeyi bilir, hiçbir şeyi beğenmez." },
  { name: "Nermin Özpolat", beat: "Rakamlarla konuşur, kimseyi dinlemez." },
  { name: "Rasim Kahveci", beat: "Eski kaleci. Her şeyi savunmaya bağlar." },
  { name: "Yeliz Turgut", beat: "Genç oyunculardan başka konusu yok." },
] as const;

export type ColumnCtx = {
  topClub: string;
  topManager: string;
  bottomClub: string;
  bottomManager: string;
  upsetClub: string | null;
  upsetManager: string | null;
  biggestScore: string | null;
  totalGoals: number;
  matchCount: number;
};

export function column(
  ctx: ColumnCtx,
  r: () => number,
): { author: string; title: string; body: string[] } {
  const author = pick(COLUMNISTS, r);
  const title = pick(
    [
      "Bu Ligde Kimse Masum Değil",
      "Tabelaya Bakın, Bahaneye Değil",
      "Herkes Hücum İstiyor, Kimse Savunma Çalıştırmıyor",
      "Şampiyonluk Konuşmak İçin Erken, Ama Konuşacağız",
      "Haftanın Dersi: Plan Yapan Kazanır",
    ],
    r,
  );

  const p1 = fill(
    pick(
      [
        "{topClub} zirvede oturuyor ve kimse bunu tesadüf sanmasın. {topManager} kadrosunu tanıyor, dizilişini rakibe göre kuruyor ve en önemlisi: kaybettiği haftalarda da aynı oyunu oynuyor.",
        "Zirvede {topClub} var. {topManager} için söylenecek çok şey yok — işini yapıyor. Asıl mesele arkasındakilerin ne zaman uyanacağı.",
      ],
      r,
    ),
    ctx,
  );

  const p2 = ctx.upsetClub
    ? fill(
        pick(
          [
            "Bu haftanın sürprizi {upsetClub}. {upsetManager} kâğıt üzerinde kaybetmesi gereken maçı aldı ve bunu şansla değil, doğru dizilişle yaptı. Ligdeki bazı meslektaşlarının not alması gerekiyor.",
            "{upsetManager} bu hafta herkesin hesabını bozdu. {upsetClub} sahada daha çok koştu, daha az hata yaptı. Formül bu kadar basit.",
          ],
          r,
        ),
        ctx,
      )
    : `Bu hafta ${ctx.matchCount} maçta ${ctx.totalGoals} gol gördük. Sürpriz yok, düzen var; bazen lig böyle de olur.`;

  const p3 = fill(
    pick(
      [
        "Ve dipte {bottomClub}. {bottomManager}'in koltuğu için 'sallanıyor' demek haksızlık olur — koltuk yerinde, oturan kişi rahatsız. Önümüzdeki üç hafta çok şeyi belirleyecek.",
        "Alt sıraya bakalım: {bottomClub}. {bottomManager} her hafta 'toparlanacağız' diyor. Takvim ise 'ne zaman' diye soruyor.",
        "{bottomClub} cephesinde durum ciddi. {bottomManager}'in elinde kadro var, zaman ise gitgide azalıyor.",
      ],
      r,
    ),
    ctx,
  );

  return { author: author.name, title, body: [p1, p2, p3] };
}

// ─── Manager report cards ───────────────────────────────────────────────

export type ManagerCardInput = {
  manager: string;
  club: string;
  /** "W" | "D" | "L" this week, or null if they did not play. */
  result: "W" | "D" | "L" | null;
  goalsFor: number;
  goalsAgainst: number;
  /** Positive when they beat a stronger side, negative when they lost to a weaker one. */
  prestigeEdge: number;
  /** Table position, 1-based. */
  rank: number;
  totalClubs: number;
  human: boolean;
};

export type ManagerCard = {
  manager: string;
  club: string;
  grade: string;
  note: string;
  human: boolean;
};

/**
 * A grade for the week, on what the result was WORTH rather than what it was.
 *
 * Beating a much stronger side is an A whatever the scoreline; losing to a
 * much weaker one is an F even by a goal. Grading raw results would just hand
 * the top club an A every week and tell nobody anything.
 */
function gradeFor(c: ManagerCardInput): string {
  if (c.result === null) return "—";
  const base = c.result === "W" ? 3 : c.result === "D" ? 1.5 : 0;
  const edge = Math.max(-1.5, Math.min(1.5, c.prestigeEdge / 20));
  const margin = Math.max(-1, Math.min(1, (c.goalsFor - c.goalsAgainst) / 4));
  const score = base + edge + margin;
  if (score >= 4) return "A+";
  if (score >= 3.2) return "A";
  if (score >= 2.4) return "B";
  if (score >= 1.6) return "C";
  if (score >= 0.8) return "D";
  return "F";
}

const NOTE_WIN_UPSET = [
  "Kimse beklemiyordu. {manager} bekledi.",
  "Kâğıdı buruşturup çöpe attı. Sahada olan buydu.",
  "Bu galibiyeti çerçeveletebilir.",
];
const NOTE_WIN = [
  "İşini yaptı, fazlasını da yaptı.",
  "Kadro doğru, plan doğru, sonuç doğru.",
  "Rahat bir hafta geçirecek.",
];
const NOTE_DRAW = [
  "Bir puan da puandır — diye başlayan cümleyi kurdu.",
  "Ne kazandı ne kaybetti; ligde bu da bir strateji.",
  "Kazanabilirdi. Kaybedebilirdi de.",
];
const NOTE_LOSS_HEAVY = [
  "Savunma çalışması takvime eklendi.",
  "Bu skordan sonra söylenecek her söz fazla.",
  "Kalecisine geçmiş olsun.",
];
const NOTE_LOSS = [
  "Yakındı. Yakın olmak puan getirmiyor.",
  "Oyun tamam, sonuç yok. Bu cümle tanıdık geliyor.",
  "Haftaya bakacak.",
];
const NOTE_BOTTOM = [
  "Dipte olmak alışılacak bir şey değil; {manager} da alışmış görünmüyor.",
  "Tablo aşağıdan okunduğunda ilk isim bu.",
];
const NOTE_TOP = [
  "Zirvedeki adam. Şimdilik.",
  "Herkesin hesabında bu isim var.",
];

export function managerCard(c: ManagerCardInput, r: () => number): ManagerCard {
  const grade = gradeFor(c);
  let pool: readonly string[];
  if (c.rank === 1 && c.result !== "L") pool = NOTE_TOP;
  else if (c.rank >= c.totalClubs - 1 && c.result !== "W") pool = NOTE_BOTTOM;
  else if (c.result === "W" && c.prestigeEdge > 8) pool = NOTE_WIN_UPSET;
  else if (c.result === "W") pool = NOTE_WIN;
  else if (c.result === "D") pool = NOTE_DRAW;
  else if (c.goalsAgainst - c.goalsFor >= 3) pool = NOTE_LOSS_HEAVY;
  else pool = NOTE_LOSS;
  return {
    manager: c.manager,
    club: c.club,
    grade,
    note: fill(pick(pool, r), c),
    human: c.human,
  };
}

// ─── The rumour desk ────────────────────────────────────────────────────

const RUMOURS = [
  "{manager}, kadrosuna bir stoper aradığını 'kimseye söylemeyin' diyerek üç ayrı kişiye söyledi.",
  "{club} kulisinde konuşulan tek şey: {manager} orta saha transferi için bütçeyi zorluyor.",
  "{manager} bu hafta antrenmanı bir saat uzattı. Sebebi soruldu, 'hava güzeldi' dedi.",
  "{club} yönetiminin {manager} ile sezon sonuna kadar devam kararı aldığı, kararın altına imza atılmadığı öğrenildi.",
  "Bir kulüp yetkilisi, {manager}'in listesinde forvet olduğunu doğruladı. Hangi forvet olduğunu doğrulamadı.",
  "{manager}'in maç sonu soyunma odasında yaptığı konuşmanın metni sızdırıldı: tek kelimeydi, yazamıyoruz.",
];

export function rumours(
  managers: Array<{ manager: string; club: string }>,
  r: () => number,
  count = 3,
): string[] {
  if (managers.length === 0) return [];
  const out: string[] = [];
  const usedTpl = new Set<number>();
  for (let i = 0; i < count && usedTpl.size < RUMOURS.length; i++) {
    let idx = Math.floor(r() * RUMOURS.length);
    let guard = 0;
    while (usedTpl.has(idx) && guard++ < RUMOURS.length) {
      idx = (idx + 1) % RUMOURS.length;
    }
    usedTpl.add(idx);
    out.push(fill(RUMOURS[idx], pick(managers, r)));
  }
  return out;
}

// ─── Reader letters ─────────────────────────────────────────────────────

const LETTERS = [
  {
    from: "{club} taraftarı",
    text: "Sayın gazete, {manager} hocamızın dizilişini anlamadığımı yazın. Kendisi de anlamadıysa üzülmesin, yalnız değil.",
  },
  {
    from: "İsmi bizde saklı bir menajer",
    text: "Herkes {topClub}'ı konuşuyor. Biz de maç kazanıyoruz ama kimse yazmıyor. Bu gazete taraflı.",
  },
  {
    from: "{club} taraftarı",
    text: "Geçen hafta 'toparlanırız' dedik, toparlandık. Bu hafta ne diyeceğimizi bilmiyoruz. Öneriniz var mı?",
  },
  {
    from: "Bir kombine sahibi",
    text: "Stada gitmek için üç saat yol yaptım. Golü görmek için bir sonraki haftayı bekleyeceğim.",
  },
  {
    from: "{club} taraftarı",
    text: "{manager} hocaya sesleniyorum: kanatları kullanın. Orada iki oyuncu var ve çok yalnızlar.",
  },
];

export function letters(
  ctx: {
    managers: Array<{ manager: string; club: string }>;
    topClub: string;
  },
  r: () => number,
  count = 3,
): Array<{ from: string; text: string }> {
  if (ctx.managers.length === 0) return [];
  const used = new Set<number>();
  const out: Array<{ from: string; text: string }> = [];
  for (let i = 0; i < count && used.size < LETTERS.length; i++) {
    let idx = Math.floor(r() * LETTERS.length);
    let guard = 0;
    while (used.has(idx) && guard++ < LETTERS.length) {
      idx = (idx + 1) % LETTERS.length;
    }
    used.add(idx);
    const who = pick(ctx.managers, r);
    out.push({
      from: fill(LETTERS[idx].from, { ...who, ...ctx }),
      text: fill(LETTERS[idx].text, { ...who, topClub: ctx.topClub }),
    });
  }
  return out;
}

// ─── Next week, foretold ────────────────────────────────────────────────

const PREDICTIONS = [
  "{home} kazanır. Gerekçe yok, hissiyat var.",
  "{away} deplasmanda bir puana razı olur; alamaz.",
  "Bu maçta gol olmaz. Olursa da bu tahmini kimse hatırlamaz.",
  "{home} önde kapatır, {away} son çeyrekte döner. Skor: kaos.",
  "{home} taraftarı bu maçtan sonra hocasını konuşacak. İyi ya da kötü, konuşacak.",
];

export function predictions(
  fixturesNext: Array<{ homeName: string; awayName: string }>,
  r: () => number,
): Array<{ fixture: string; call: string }> {
  return fixturesNext.slice(0, 4).map((f) => ({
    fixture: `${f.homeName} — ${f.awayName}`,
    call: fill(pick(PREDICTIONS, r), { home: f.homeName, away: f.awayName }),
  }));
}
