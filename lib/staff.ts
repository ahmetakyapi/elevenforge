/**
 * Static catalogue of available staff. The user picks one per slot
 * (headCoach / physio / scout). Each tier costs more upfront and pays
 * dividends in a different subsystem.
 *
 * Effects (applied wherever the relevant subsystem reads the staff):
 *   - headCoach: morale +tier on weekly economy, +tier*0.2 mentality nudge
 *   - physio:    injury chance × (1 - tier*0.18), recovery × (1 + tier*0.25)
 *   - scout:     +tier extra candidates per scout return
 */
export type StaffRole = "headCoach" | "physio" | "scout";

export type StaffMember = {
  id: string;
  role: StaffRole;
  name: string;
  tier: 1 | 2 | 3;
  hireCostCents: number;
  weeklyWageCents: number;
  bio: string;
};

export const STAFF: StaffMember[] = [
  // Head Coach
  {
    id: "hc-bronze-tekin",
    role: "headCoach",
    name: "Sertaç Tekin",
    tier: 1,
    hireCostCents: 200_000_000,
    weeklyWageCents: 5_000_000,
    bio: "Genç antrenör — moral + temel taktik desteği.",
  },
  {
    id: "hc-silver-aksoy",
    role: "headCoach",
    name: "Hasan Aksoy",
    tier: 2,
    hireCostCents: 600_000_000,
    weeklyWageCents: 12_000_000,
    bio: "Süper Lig deneyimi var, basın aralarında işe yarar.",
  },
  {
    id: "hc-gold-yıldırım",
    role: "headCoach",
    name: "Murat Yıldırım",
    tier: 3,
    hireCostCents: 1_500_000_000,
    weeklyWageCents: 28_000_000,
    bio: "Şampiyonluk getirmiş veteran. Bütçeye ağır ama etkisi büyük.",
  },
  // Physio
  {
    id: "ph-bronze-demir",
    role: "physio",
    name: "Dr. Eda Demir",
    tier: 1,
    hireCostCents: 100_000_000,
    weeklyWageCents: 3_000_000,
    bio: "Sakatlıkları %18 azaltır, küçük yardım.",
  },
  {
    id: "ph-silver-koç",
    role: "physio",
    name: "Dr. Mert Koç",
    tier: 2,
    hireCostCents: 300_000_000,
    weeklyWageCents: 7_500_000,
    bio: "Sakatlık riski %36 ↓, iyileşme %50 ↑.",
  },
  {
    id: "ph-gold-erdem",
    role: "physio",
    name: "Prof. Tuna Erdem",
    tier: 3,
    hireCostCents: 800_000_000,
    weeklyWageCents: 18_000_000,
    bio: "Sakatlık %54 ↓, hızlı dönüş garantisi.",
  },
  // Scout
  {
    id: "sc-bronze-ünlü",
    role: "scout",
    name: "Cem Ünlü",
    tier: 1,
    hireCostCents: 80_000_000,
    weeklyWageCents: 2_500_000,
    bio: "Her kaşif görevine +1 aday.",
  },
  {
    id: "sc-silver-bayram",
    role: "scout",
    name: "Volkan Bayram",
    tier: 2,
    hireCostCents: 240_000_000,
    weeklyWageCents: 6_000_000,
    bio: "+2 aday, daha geniş ağ.",
  },
  {
    id: "sc-gold-aydın",
    role: "scout",
    name: "Sertaç Aydın",
    tier: 3,
    hireCostCents: 700_000_000,
    weeklyWageCents: 14_000_000,
    bio: "+3 aday, gizli yetenekleri ortaya çıkarır.",
  },
];

export function staffById(id: string): StaffMember | undefined {
  return STAFF.find((s) => s.id === id);
}

export function staffByRole(role: StaffRole): StaffMember[] {
  return STAFF.filter((s) => s.role === role);
}

export type ClubStaff = {
  headCoach: StaffMember | null;
  physio: StaffMember | null;
  scout: StaffMember | null;
};

export function parseStaffJson(json: string | null): ClubStaff {
  if (!json) return { headCoach: null, physio: null, scout: null };
  try {
    const raw = JSON.parse(json) as Partial<{
      headCoach: { id: string };
      physio: { id: string };
      scout: { id: string };
    }>;
    return {
      headCoach: raw.headCoach ? staffById(raw.headCoach.id) ?? null : null,
      physio: raw.physio ? staffById(raw.physio.id) ?? null : null,
      scout: raw.scout ? staffById(raw.scout.id) ?? null : null,
    };
  } catch {
    return { headCoach: null, physio: null, scout: null };
  }
}
