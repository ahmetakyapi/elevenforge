/**
 * Turning a squad pack into a league, in one place.
 *
 * `lib/actions/create-league.ts` owned all of this, which was fine while it
 * was the only thing that ever built a league. It is not any more: a live
 * league sometimes has to be rebuilt on the current rules without being
 * deleted (scripts/restart-leagues.ts), and a second copy of "how a pack
 * becomes players" is exactly the kind of duplication that drifts — the
 * attribute roll, the value curve and the hand-maintained secondary roles
 * would all have had to be kept in step by hand, in two files, forever.
 *
 * create-league.ts is a "use server" module, so it cannot export plain values
 * for a script to import. Hence a module of its own rather than an export.
 */
import { rollAttr, ROLE_ATTR_OFFSETS } from "@/lib/attributes";
import { marketValueCents } from "@/lib/economy";
import type { SquadPack } from "@/lib/squad-packs";
import type { players } from "@/lib/schema";

/**
 * Secondary roles for players the packs do not describe well enough.
 *
 * The pack data carries one role per player because that is what the source
 * lists. These are the ones whose real game is wider than a single slot, and
 * getting them right is what lets the line-up resolver put a full-back at
 * centre-half without the out-of-position penalty.
 */
const HAND_SECONDARY: Record<string, string[]> = {
  "Milan Škriniar": ["LB"],
  "Nélson Semedo": ["CB"],
  "Mert Müldür": ["CB"],
  "Jayden Oosterwolde": ["CB", "LW"],
  "Archie Brown": ["LW"],
  "N'Golo Kanté": ["CM"],
  "Mateo Guendouzi": ["CDM", "AM"],
  "İsmail Yüksek": ["CDM", "AM"],
  Fred: ["CDM"],
  "Marco Asensio": ["RW", "LW"],
  "Oğuz Aydın": ["LW", "AM"],
  "Kerem Aktürkoğlu": ["RW", "ST"],
  Talisca: ["AM", "CF"],
  "Dorgeles Nene": ["CF"],
  "Sidiki Cherif": ["CF"],
};

/** What a club is worth on the day the league is created, by pack order. */
export type TierMeta = { prestige: number };

const TIER_TEMPLATE: TierMeta[] = [
  { prestige: 82 }, //  0 Fenerbahçe (user)
  { prestige: 85 }, //  1 Galatasaray
  { prestige: 78 }, //  2 Beşiktaş
  { prestige: 76 }, //  3 Trabzonspor
  { prestige: 66 }, //  4 Başakşehir
  { prestige: 60 }, //  5 Samsunspor
  { prestige: 56 }, //  6 Göztepe
  { prestige: 48 }, //  7 Çaykur Rizespor
  { prestige: 46 }, //  8 Alanyaspor
  { prestige: 46 }, //  9 Konyaspor
  { prestige: 44 }, // 10 Kasımpaşa
  { prestige: 40 }, // 11 Gaziantep FK
  { prestige: 38 }, // 12 Kocaelispor
  { prestige: 38 }, // 13 Eyüpspor
  { prestige: 34 }, // 14 Gençlerbirliği
  { prestige: 30 }, // 15 Çorum FK (promoted)
  { prestige: 30 }, // 16 Amed SK (promoted)
  { prestige: 28 }, // 17 Erzurumspor (promoted)
];

/**
 * Prestige for pack `i`.
 *
 * Second-division clubs are flat 24 — poorer and less regarded across the
 * board, which is what makes promotion worth something. The fallback exists
 * because the league grew from 16 clubs to 18 once and a fixed-length table
 * silently handed `undefined` to the last two.
 */
export function tierFor(i: number, division: 1 | 2): TierMeta {
  if (division === 2) return { prestige: 24 };
  return TIER_TEMPLATE[i] ?? { prestige: 30 };
}

/**
 * The rows for one club's squad, built from its pack.
 *
 * Ratings, ages and shirt numbers come from the pack (they are transcribed
 * from a real roster); the ATTRIBUTES are rolled here from the role, and the
 * value comes from the economy curve. That split is deliberate: the pack is
 * data about who plays for whom, and everything derived from game balance has
 * to come from the current balance rather than from whenever the pack was
 * generated.
 */
export function packPlayerRows(
  leagueId: string,
  clubId: string,
  pack: SquadPack,
  r: () => number,
): Array<typeof players.$inferInsert> {
  return pack.players.map((p) => {
    const offsets = ROLE_ATTR_OFFSETS[p.role] ?? ROLE_ATTR_OFFSETS.CM;
    return {
      leagueId,
      clubId,
      name: p.n,
      position: p.pos,
      role: p.role,
      secondaryRoles: JSON.stringify(HAND_SECONDARY[p.n] ?? []),
      jerseyNumber: p.num ?? null,
      age: p.age,
      nationality: p.nat,
      overall: p.ovr,
      potential: p.pot,
      pace: rollAttr(p.ovr, offsets.pace, r),
      shooting: rollAttr(p.ovr, offsets.shooting, r),
      passing: rollAttr(p.ovr, offsets.passing, r),
      defending: rollAttr(p.ovr, offsets.defending, r),
      physical: rollAttr(p.ovr, offsets.physical, r),
      goalkeeping: rollAttr(p.ovr, offsets.goalkeeping, r),
      fitness: p.fit ?? 90,
      morale: p.mor ?? 4,
      // Derived, never a constant fallback. When this once read
      // `?? 1_000_000`, a missing field gave every player in the game the same
      // €1M price — silently, because a constant is a perfectly valid number.
      // Falling back to the curve costs accuracy, not the entire economy.
      marketValueCents:
        p.val != null ? p.val * 100 : marketValueCents(p.ovr, p.pot, p.age),
      status:
        p.status && p.status !== "listed"
          ? (p.status as "active" | "injured" | "suspended" | "training")
          : "active",
      lastRatings: JSON.stringify(p.form ?? []),
    };
  });
}
