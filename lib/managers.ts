/**
 * Who is in charge of each club, by name.
 *
 * The game already knows: a club either has an `ownerUserId` or it is run by
 * one of the AI personalities in lib/ai/profile.ts. Nothing surfaced it,
 * though, so every screen talked about CLUBS — "Beşiktaş kazandı" — and a
 * league of twelve friends read like a league of twelve logos.
 *
 * A newspaper is the place this matters most. Football writing is about
 * people: it names the manager, it blames the manager, it asks whether the
 * manager will still be there next month. So the paper needs a name for
 * whoever is running each side, and bot clubs need one as much as human ones
 * — a report that can only be rude about half the division is not much of a
 * report.
 *
 * Bot managers therefore get a STABLE invented name, derived from the club id
 * the same way its AI personality is. Same club, same manager, every season,
 * across restarts — which is what makes "yine aynı adam" land as a joke
 * rather than reading as a bug.
 */
import { traitForClub } from "@/lib/ai/profile";

/** Deterministic 32-bit hash — same shape as lib/ai/profile.ts uses. */
function hashId(id: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

// Two disjoint pools so a bot manager never accidentally shares a name with a
// player from the squad packs or the scout pool.
const FIRST = [
  "Şenol", "Fatih", "Abdullah", "Okan", "Erol", "Hikmet", "Bülent", "Rıza",
  "Tayfun", "Uğur", "Sergen", "Nuri", "Metin", "Yılmaz", "Cengiz", "Aykut",
  "Servet", "Osman", "Recep", "Hamza", "Kemal", "Selçuk", "Tolunay", "Vedat",
];
const LAST = [
  "Yalçınkaya", "Erdoğmuş", "Sarıkaya", "Tunçel", "Bozdağ", "Akkuş",
  "Demirtaş", "Özkan", "Ergün", "Kırmızıgül", "Balaban", "Şentürk",
  "Ayhan", "Coşkun", "Karataş", "Yavuz", "Uysal", "Bilgin", "Doğrul",
  "Kavuk", "Tokgöz", "Sancar", "Arpacı", "Güleç",
];

export type ManagerRef = {
  clubId: string;
  /** Display name. Human managers use the name on their account. */
  name: string;
  /** True when a real person is at the wheel. */
  human: boolean;
  /**
   * The AI personality label ("Kumarbaz", "Kâhya", …). Present for bots, and
   * for human clubs that have gone inactive and been taken over — the paper
   * uses it as a characterisation, which is exactly what it is.
   */
  style: string | null;
};

/** The manager of one club. */
export function managerFor(club: {
  id: string;
  aiManaged: boolean;
  ownerUserId: string | null;
  ownerName?: string | null;
}): ManagerRef {
  const trait = traitForClub(club.id);
  // A human who has gone inactive is still the person whose name is on the
  // door; the paper says the club is being run by its assistant instead.
  if (club.ownerUserId && club.ownerName) {
    return {
      clubId: club.id,
      name: club.ownerName,
      human: true,
      style: club.aiManaged ? trait.label : null,
    };
  }
  const h = hashId(club.id);
  const name = `${FIRST[h % FIRST.length]} ${LAST[(h >>> 8) % LAST.length]}`;
  return { clubId: club.id, name, human: false, style: trait.label };
}

/**
 * Build a lookup for a whole league in one call.
 *
 * `owners` maps userId → display name; the caller does the join, because it
 * usually already has the users table open for something else.
 */
export function managersByClub(
  clubRows: Array<{ id: string; aiManaged: boolean; ownerUserId: string | null }>,
  owners: Map<string, string>,
): Map<string, ManagerRef> {
  return new Map(
    clubRows.map((c) => [
      c.id,
      managerFor({ ...c, ownerName: c.ownerUserId ? owners.get(c.ownerUserId) : null }),
    ]),
  );
}
