/**
 * Template-based AI-style Turkish commentary generator.
 *
 * Template choice is driven by the caller's seeded RNG, not Math.random.
 * The match engine persists its seed so a fixture always reproduces the same
 * match; drawing the commentary from an unseeded source broke that — the
 * scoreline replayed identically but the report describing it was different
 * every time, which is exactly the kind of inconsistency that makes a stored
 * match feel untrustworthy.
 */

type GoalCtx = {
  scorer: string;
  assister?: string;
  minute: number;
  homeClubName: string;
  awayClubName: string;
  scoringClubName: string;
  runningHome: number;
  runningAway: number;
  derby: boolean;
};

type CardCtx = {
  player: string;
  minute: number;
  kind: "yellow" | "red";
};

/** Draw from `arr` using the caller-supplied RNG. */
const pick = <T>(arr: readonly T[], rng: () => number) =>
  arr[Math.floor(rng() * arr.length)];

const GOAL_SOLO = [
  "GOOL! {scorer} sol ayağıyla ağlara gönderdi. {scoringClubName} önde.",
  "{scorer}! Tek başına götürdü, kaleciyi geçti ve bitirdi! İnanılmaz bir gol!",
  "{scorer} ceza sahasının dışından çekti — filelere kadar gitti! {scoringClubName} buldu.",
  "FİLE! {scorer} ile {scoringClubName} sevinci yakaladı. Skor: {runningHome} - {runningAway}.",
  "{minute}. dakika: {scorer} ne yaptığını biliyor — kaleci hiçbir şey yapamadı.",
];

const GOAL_ASSIST = [
  "{assister}'den harika bir pas, {scorer} bitirdi! {scoringClubName} önde.",
  "⚽ {scorer}! {assister} ile bu takımın kimyası konuşuluyor — gol {minute}. dakikada geldi.",
  "Muhteşem bir kombinasyon: {assister} görmüş, {scorer} bitirmiş. {runningHome} - {runningAway}.",
  "{assister} sağ kanattan içeri ortaladı, {scorer} tek dokunuşla filelere yolladı.",
  "Hızlı pas, daha hızlı gol. {assister}→{scorer}, kaleci donmuş vaziyette.",
];

const GOAL_DERBY = [
  "DERBİ GOLÜ! {scorer}, bu maçın ağırlığının farkında olarak vurdu. Stat inledi.",
  "{scorer}! Bu gol derbiye damga vuran türden — {scoringClubName} taraftarı çılgına döndü.",
  "Derbilerde tarih yazılır, bu gol de öyle oldu: {scorer}, {minute}. dakika.",
];

const CARD_YELLOW = [
  "🟨 {player} sert girdi, hakem sarı kartı gösterdi.",
  "Hakem {minute}. dakikada {player}'i uyardı — sarı kart geldi.",
  "{player} protestosunu duyurdu ama sarı kartı yedi. Dikkat etmesi gerekiyor.",
  "Yanlış zamanda müdahale: {player} sarı görüyor.",
];

const CARD_RED = [
  "🟥 KIRMIZI KART! {player} iki sarı gördü, oyun dışı. {minute}. dakika.",
  "Ağır müdahale: {player} direkt kırmızı kart gördü — on kişi kaldılar.",
  "Hakem tereddüt etmeden kırmızı gösterdi. {player} soyunma odasına doğru yürüyor.",
];

const format = (tpl: string, ctx: Record<string, unknown>) =>
  tpl.replace(/\{(\w+)\}/g, (_, k) => String(ctx[k] ?? ""));

export const buildCommentary = {
  goal(ctx: GoalCtx, rng: () => number): string {
    if (ctx.derby && rng() < 0.4) return format(pick(GOAL_DERBY, rng), ctx);
    if (ctx.assister) return format(pick(GOAL_ASSIST, rng), ctx);
    return format(pick(GOAL_SOLO, rng), ctx);
  },
  card(ctx: CardCtx, rng: () => number): string {
    const tpl =
      ctx.kind === "red" ? pick(CARD_RED, rng) : pick(CARD_YELLOW, rng);
    return format(tpl, ctx);
  },
};
