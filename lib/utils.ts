import { clsx, type ClassValue } from "clsx";
import type { Position } from "@/types";

export const cn = (...inputs: ClassValue[]) => clsx(inputs);

export const fmtEUR = (n: number): string => {
  if (n >= 1_000_000_000) return `€${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) {
    const v = n / 1_000_000;
    return `€${v >= 10 ? Math.round(v) : v.toFixed(1)}M`;
  }
  if (n >= 1_000) return `€${Math.round(n / 1_000)}K`;
  return `€${n}`;
};

export const fmtWage = (n: number) => `€${Math.round(n / 1000)}K/hf`;

export const tierColor = (ovr: number): string => {
  if (ovr >= 85) return "var(--gold)";
  if (ovr >= 80) return "var(--indigo)";
  if (ovr >= 75) return "var(--cyan)";
  if (ovr >= 70) return "var(--emerald)";
  return "var(--muted)";
};

export const tierLabel = (ovr: number): string => {
  if (ovr >= 85) return "ELİT";
  if (ovr >= 80) return "A+";
  if (ovr >= 75) return "A";
  if (ovr >= 70) return "B";
  return "C";
};

const POS_COLOR_MAP: Record<Position, string> = {
  GK: "#facc15",
  DEF: "#3b82f6",
  MID: "#10b981",
  FWD: "#ef4444",
};

export const posColor = (pos: Position): string => POS_COLOR_MAP[pos] ?? "var(--muted)";

export const NAT_FLAGS: Record<string, string> = {
  NG: "🇳🇬", HU: "🇭🇺", HR: "🇭🇷", FR: "🇫🇷", BR: "🇧🇷",
  AR: "🇦🇷", DE: "🇩🇪", GR: "🇬🇷", ES: "🇪🇸", CZ: "🇨🇿",
  DK: "🇩🇰", TR: "🇹🇷", IT: "🇮🇹", PT: "🇵🇹", NL: "🇳🇱",
};

export const NAT_NAMES: Record<string, string> = {
  NG: "Nijerya", HU: "Macaristan", HR: "Hırvatistan", FR: "Fransa", BR: "Brezilya",
  AR: "Arjantin", DE: "Almanya", GR: "Yunanistan", ES: "İspanya", CZ: "Çekya",
  DK: "Danimarka", TR: "Türkiye", IT: "İtalya", PT: "Portekiz", NL: "Hollanda",
};

export const POS_FULL: Record<Position, string> = {
  GK: "Kaleci",
  DEF: "Defans",
  MID: "Orta Saha",
  FWD: "Forvet",
};

/**
 * A club's badge abbreviation, derived from its name.
 *
 * Both sign-up paths built this the same way — first letter of each word,
 * capped at three — which is right for "Kartel Crew FK" and wrong for every
 * single-word name in Turkish football. "Fenerbahçe" came out as a lone "F",
 * so the crest on the dashboard, the fixture card and the league table read as
 * a broken placeholder rather than a badge. Real abbreviations are two or
 * three characters: FB, GS, BJK.
 *
 * Turkish note: `toLocaleUpperCase("tr")` is required. The default mapping
 * turns "i" into "I", not "İ", so "İstanbulspor" would abbreviate to "IST".
 */
export function deriveShortName(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "FC";
  const initials =
    words.length > 1
      ? words
          .map((w) => w[0])
          .slice(0, 3)
          .join("")
      : words[0].slice(0, 3);
  return initials.toLocaleUpperCase("tr");
}
