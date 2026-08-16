/**
 * The tactic dials, in one place.
 *
 * There were three — mentality, pressing, tempo — and all three pointed the
 * same way: turn them up, get better; turn them down, get worse. A dial with
 * a right answer is not a decision, it is a chore, and a manager who has
 * worked that out sets all three to 4 and never opens the screen again.
 *
 * The four added here are the ones that make the set genuinely two-sided,
 * because each is answered by something the OPPONENT does:
 *
 *   defLine       a high line wins the midfield and loses the ball over the top
 *                 — to fast forwards specifically, so it is a bet on who you
 *                 are facing, not a strictly-better setting.
 *   passingStyle  short passing routes the ball through midfield; direct
 *                 bypasses it. If your midfield is weak, bypassing it is
 *                 correct — which is the first time a bad squad has a plan.
 *   width         wide play pays your wingers and full-backs, narrow pays
 *                 your CM/AM/ST. Whichever you own more of.
 *   aggression    buys defensive solidity with cards and injuries.
 *
 * The engine, the AI managers and the tactic screen all read from here, so
 * a dial cannot mean one thing in the simulation and another in the UI.
 */

export const TACTIC_KEYS = [
  "mentality",
  "pressing",
  "tempo",
  "defLine",
  "passingStyle",
  "width",
  "aggression",
] as const;

export type TacticKey = (typeof TACTIC_KEYS)[number];

/** Every dial is 0-4, 2 being the neutral middle. */
export type Tactics = Record<TacticKey, number> & { formation: string };

export type TacticDial = {
  key: TacticKey;
  label: string;
  /** One line, in the manager's language, on what the dial is for. */
  hint: string;
  /** Labels for steps 0-4. */
  steps: readonly [string, string, string, string, string];
  /** What you are buying at the top of the range, and what it costs. */
  gain: string;
  cost: string;
  /** Icon name from lucide-react, resolved by the UI. */
  icon: string;
};

export const TACTIC_DIALS: readonly TacticDial[] = [
  {
    key: "mentality",
    label: "Mentalite",
    hint: "Takım ne kadar ileride oynasın?",
    steps: ["Çok Defansif", "Defansif", "Dengeli", "Hücumcu", "Çok Hücumcu"],
    gain: "Daha fazla pozisyon, daha fazla gol",
    cost: "Arkada daha çok boşluk",
    icon: "Swords",
  },
  {
    key: "pressing",
    label: "Pres",
    hint: "Topu rakip yarı sahada mı kovalayalım?",
    steps: ["Alçak Blok", "Beklemeli", "Dengeli", "Yoğun", "Agresif Pres"],
    gain: "Orta sahada üstünlük, top kazanma",
    cost: "Kondisyon yanar, uzun toplara açık",
    icon: "Flame",
  },
  {
    key: "tempo",
    label: "Tempo",
    hint: "Oyunu hızlandıralım mı, sabırlı mı olalım?",
    steps: ["Çok Sakin", "Sabırlı", "Dengeli", "Hızlı", "Çok Hızlı"],
    gain: "Daha çok şut, daha çok tempo",
    cost: "Hata payı ve yorgunluk artar",
    icon: "Gauge",
  },
  {
    key: "defLine",
    label: "Savunma Hattı",
    hint: "Defans nerede dursun? Yüksek hat, hızlı forvetlere davetiye.",
    steps: ["Çok Derin", "Derin", "Normal", "Yüksek", "Çok Yüksek"],
    gain: "Takım kompakt, orta saha rakip yarı sahada",
    cost: "Arkanda hızlı forvet varsa cezalandırılırsın",
    icon: "MoveVertical",
  },
  {
    key: "passingStyle",
    label: "Pas Tarzı",
    hint: "Topu orta sahadan mı çıkaralım, üstünden mi aşıralım?",
    steps: ["Tamamen Kısa", "Kısa Pas", "Karışık", "Direkt", "Uzun Top"],
    gain: "Zayıf orta sahayı devre dışı bırakır, hızlı forveti besler",
    cost: "Topa sahip olma düşer, pas ustaların boşa gider",
    icon: "Share2",
  },
  {
    key: "width",
    label: "Genişlik",
    hint: "Kanatları mı kullanalım, içeriden mi gidelim?",
    steps: ["Çok Dar", "Dar", "Dengeli", "Geniş", "Kanat Oyunu"],
    gain: "Kanat ve bek kalitesi doğrudan hücuma yansır",
    cost: "İçeride 10 numaran ve santrforun etkisiz kalır",
    icon: "MoveHorizontal",
  },
  {
    key: "aggression",
    label: "Sertlik",
    hint: "İkili mücadelelerde ne kadar sert girelim?",
    steps: ["Çok Temiz", "Temiz", "Normal", "Sert", "Çok Sert"],
    gain: "İkili mücadele ve savunma sağlamlığı",
    cost: "Kart ve sakatlık riski ciddi şekilde artar",
    icon: "ShieldAlert",
  },
] as const;

/** Neutral setup — what a club plays before anyone touches the screen. */
export const DEFAULT_TACTICS: Tactics = {
  formation: "4-3-3",
  mentality: 2,
  pressing: 2,
  tempo: 2,
  defLine: 2,
  passingStyle: 2,
  width: 2,
  aggression: 2,
};

/** Clamp to the 0-4 range every dial promises the engine. */
export function clampDial(n: number | null | undefined): number {
  if (typeof n !== "number" || !Number.isFinite(n)) return 2;
  return Math.max(0, Math.min(4, Math.round(n)));
}

/**
 * Read a full tactic set off a club row.
 *
 * The four new columns arrived with a default of 2, but the three original
 * dials did not — `mentality` and `pressing` default to 3 in the schema and
 * live rows hold whatever managers set months ago. Nothing here invents a
 * value; it only guarantees the engine gets seven numbers in range.
 */
export function tacticsFrom(row: {
  formation?: string | null;
  mentality?: number | null;
  pressing?: number | null;
  tempo?: number | null;
  defLine?: number | null;
  passingStyle?: number | null;
  width?: number | null;
  aggression?: number | null;
}): Tactics {
  return {
    formation: row.formation || DEFAULT_TACTICS.formation,
    mentality: clampDial(row.mentality),
    pressing: clampDial(row.pressing),
    tempo: clampDial(row.tempo),
    defLine: clampDial(row.defLine),
    passingStyle: clampDial(row.passingStyle),
    width: clampDial(row.width),
    aggression: clampDial(row.aggression),
  };
}

/**
 * Named setups the manager can apply in one tap.
 *
 * Seven sliders is depth for the manager who wants it and a wall for the one
 * who does not. A preset is the on-ramp: pick "Otobüs" and you have a
 * coherent defensive plan without knowing what a defensive line is, then
 * discover the sliders by seeing where the preset moved them.
 */
export type TacticStyle = {
  id: string;
  label: string;
  blurb: string;
  formation: string;
  dials: Record<TacticKey, number>;
};

export const TACTIC_STYLES: readonly TacticStyle[] = [
  {
    id: "tiki-taka",
    label: "Tiki-Taka",
    blurb: "Topu biz tutarız. Kısa pas, yüksek hat, dar alanda boğ.",
    formation: "4-3-3",
    dials: {
      mentality: 3,
      pressing: 4,
      tempo: 2,
      defLine: 4,
      passingStyle: 0,
      width: 1,
      aggression: 1,
    },
  },
  {
    id: "gegenpress",
    label: "Gegenpress",
    blurb: "Topu kaybettiğin an geri al. Nefes kesici, kondisyon yakıcı.",
    formation: "4-2-3-1",
    dials: {
      mentality: 3,
      pressing: 4,
      tempo: 4,
      defLine: 4,
      passingStyle: 2,
      width: 2,
      aggression: 3,
    },
  },
  {
    id: "kanat",
    label: "Kanat Bindirmesi",
    blurb: "Genişle, bekleri ileri sür, ortalarla boğ.",
    formation: "4-4-2",
    dials: {
      mentality: 3,
      pressing: 2,
      tempo: 3,
      defLine: 2,
      passingStyle: 3,
      width: 4,
      aggression: 2,
    },
  },
  {
    id: "kontra",
    label: "Kontra Atak",
    blurb: "Derinde bekle, topu kap, uzun topla hızlı forveti çalıştır.",
    formation: "4-1-4-1",
    dials: {
      mentality: 1,
      pressing: 1,
      tempo: 4,
      defLine: 0,
      passingStyle: 4,
      width: 3,
      aggression: 2,
    },
  },
  {
    id: "otobus",
    label: "Otobüs",
    blurb: "Kaleyi kapat. Bir puan da puandır.",
    formation: "5-3-2",
    dials: {
      mentality: 0,
      pressing: 1,
      tempo: 1,
      defLine: 0,
      passingStyle: 3,
      width: 1,
      aggression: 3,
    },
  },
  {
    id: "dengeli",
    label: "Dengeli",
    blurb: "Ne uçtan ne kaçtan. Her rakibe karşı çalışan güvenli kurulum.",
    formation: "4-3-3",
    dials: {
      mentality: 2,
      pressing: 2,
      tempo: 2,
      defLine: 2,
      passingStyle: 2,
      width: 2,
      aggression: 2,
    },
  },
] as const;
