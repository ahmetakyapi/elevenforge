/**
 * Static pool of sponsor offers. The user can sign one at a time; each
 * contract pays per match plus a bonus on wins, and a lump sum at season
 * end. Higher-tier sponsors require higher prestige.
 *
 * `weeksLeft` is decremented by the weekly economy job and the sponsor
 * disappears when it hits 0.
 */
export type Sponsor = {
  id: string;
  name: string;
  tier: 1 | 2 | 3;
  minPrestige: number;
  payPerMatchCents: number;
  bonusPerWinCents: number;
  seasonBonusCents: number;
  weeks: number;
};

export const SPONSORS: Sponsor[] = [
  {
    id: "spr-bronze-anatolia",
    name: "Anadolu Tahıl",
    tier: 1,
    minPrestige: 0,
    payPerMatchCents: 30_000_000, // €300K / match
    bonusPerWinCents: 50_000_000,
    seasonBonusCents: 200_000_000,
    weeks: 15,
  },
  {
    id: "spr-bronze-bgm",
    name: "Boğaziçi Gıda",
    tier: 1,
    minPrestige: 0,
    payPerMatchCents: 25_000_000,
    bonusPerWinCents: 75_000_000,
    seasonBonusCents: 150_000_000,
    weeks: 15,
  },
  {
    id: "spr-silver-egetech",
    name: "EgeTech Telekom",
    tier: 2,
    minPrestige: 50,
    payPerMatchCents: 60_000_000, // €600K / match
    bonusPerWinCents: 120_000_000,
    seasonBonusCents: 500_000_000,
    weeks: 15,
  },
  {
    id: "spr-silver-kara",
    name: "Karadeniz Bankası",
    tier: 2,
    minPrestige: 50,
    payPerMatchCents: 50_000_000,
    bonusPerWinCents: 150_000_000,
    seasonBonusCents: 600_000_000,
    weeks: 15,
  },
  {
    id: "spr-gold-istanbulx",
    name: "İstanbul X Holding",
    tier: 3,
    minPrestige: 75,
    payPerMatchCents: 120_000_000, // €1.2M / match
    bonusPerWinCents: 250_000_000,
    seasonBonusCents: 1_500_000_000,
    weeks: 15,
  },
  {
    id: "spr-gold-bosphor",
    name: "Bosphor Energy",
    tier: 3,
    minPrestige: 75,
    payPerMatchCents: 100_000_000,
    bonusPerWinCents: 300_000_000,
    seasonBonusCents: 2_000_000_000,
    weeks: 15,
  },
];

export function sponsorById(id: string): Sponsor | undefined {
  return SPONSORS.find((s) => s.id === id);
}
