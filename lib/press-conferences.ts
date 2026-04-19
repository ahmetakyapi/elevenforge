/**
 * Static prompt + answer pool. Each prompt has 3 answers; each answer
 * deltas team morale, prestige (and optionally opponent morale). Engine
 * picks a prompt deterministically per-week so two clubs never get the
 * same one in the same week.
 */
export type PressAnswer = {
  code: string;
  text: string;
  squadMoraleDelta: number; // -1 .. +1 average shift across squad
  prestigeDelta: number;
  description: string;
};

export type PressPrompt = {
  code: string;
  question: string;
  answers: PressAnswer[];
};

export const PROMPTS: PressPrompt[] = [
  {
    code: "rival-derby",
    question: "Bu hafta derbi var. Rakip basında pek konuşmuyor. Ne diyorsun?",
    answers: [
      {
        code: "humble",
        text: "Saygılıyız ve hazırız.",
        squadMoraleDelta: 0,
        prestigeDelta: 1,
        description: "Mütevazı + saygılı — moral nötr, prestij + 1.",
      },
      {
        code: "fire",
        text: "Bu derbi bizim, kimse durduramaz.",
        squadMoraleDelta: 1,
        prestigeDelta: 0,
        description: "Kibirli ama oyuncuların kanını ısıtır — moral +1.",
      },
      {
        code: "deflect",
        text: "Yorum yok, sahada cevap vereceğiz.",
        squadMoraleDelta: 0,
        prestigeDelta: 0,
        description: "Güvenli oynama — etkisiz.",
      },
    ],
  },
  {
    code: "young-talent",
    question: "Genç oyuncunun büyük bir alıcı geldiği konuşuluyor. Tepkin?",
    answers: [
      {
        code: "support",
        text: "Burada büyüyecek, satılık değil.",
        squadMoraleDelta: 1,
        prestigeDelta: 0,
        description: "Kadro güveni artar — moral +1.",
      },
      {
        code: "open",
        text: "Doğru teklif gelirse her oyuncu satılır.",
        squadMoraleDelta: -1,
        prestigeDelta: 0,
        description: "Pragmatik ama moral düşürür — moral -1.",
      },
      {
        code: "spotlight",
        text: "Bizden fiyat istesinler — pahalıya mal olur.",
        squadMoraleDelta: 0,
        prestigeDelta: 1,
        description: "Sertçe ama saygın — prestij +1.",
      },
    ],
  },
  {
    code: "bad-form",
    question: "Son 3 maçta puan kayıpları var. Sebep ne?",
    answers: [
      {
        code: "blame-self",
        text: "Sorumluluk benim, taktiği değiştireceğim.",
        squadMoraleDelta: 1,
        prestigeDelta: -1,
        description: "Kadro arkanda toplanır — moral +1, prestij -1.",
      },
      {
        code: "blame-luck",
        text: "Şansın bizden yana dönmesi an meselesi.",
        squadMoraleDelta: 0,
        prestigeDelta: 0,
        description: "Diplomatik — etkisiz.",
      },
      {
        code: "blame-players",
        text: "Bazı oyuncuların performansı yetersiz.",
        squadMoraleDelta: -1,
        prestigeDelta: 0,
        description: "Kadroyu kızdırır — moral -1.",
      },
    ],
  },
  {
    code: "title-talk",
    question: "Şampiyonluk yarışındasın — hedefini açıkça söyler misin?",
    answers: [
      {
        code: "promise",
        text: "Şampiyon olacağız.",
        squadMoraleDelta: 1,
        prestigeDelta: 1,
        description: "Cesur duruş — hem moral hem prestij +1.",
      },
      {
        code: "step",
        text: "Maç maç bakıyoruz, panik yok.",
        squadMoraleDelta: 0,
        prestigeDelta: 0,
        description: "Klasik — etkisiz.",
      },
      {
        code: "hide",
        text: "Hedefimiz ilk dörde girmek.",
        squadMoraleDelta: -1,
        prestigeDelta: 0,
        description: "Kadronun beklentisini düşürür — moral -1.",
      },
    ],
  },
];

export function promptByCode(code: string): PressPrompt | undefined {
  return PROMPTS.find((p) => p.code === code);
}

/** Deterministic per (clubId + week + season) prompt pick. */
export function pickPromptFor(clubId: string, week: number, season: number): PressPrompt {
  let h = 2166136261 >>> 0;
  const key = `${clubId}-${week}-${season}`;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return PROMPTS[h % PROMPTS.length];
}
