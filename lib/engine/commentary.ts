/**
 * Template-based AI-style Turkish commentary generator.
 * Picks a random template per event and fills it with context.
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

const pick = <T>(arr: readonly T[]) =>
  arr[Math.floor(Math.random() * arr.length)];

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
  goal(ctx: GoalCtx): string {
    if (ctx.derby && Math.random() < 0.4) return format(pick(GOAL_DERBY), ctx);
    if (ctx.assister) return format(pick(GOAL_ASSIST), ctx);
    return format(pick(GOAL_SOLO), ctx);
  },
  card(ctx: CardCtx): string {
    const tpl = ctx.kind === "red" ? pick(CARD_RED) : pick(CARD_YELLOW);
    return format(tpl, ctx);
  },
};
