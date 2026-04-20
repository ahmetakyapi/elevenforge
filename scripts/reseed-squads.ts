/**
 * Reseed every league's squads from the current SQUAD_PACKS definition.
 *
 * Use this when the pack roster changes and you want existing leagues
 * (including multi-user ones) to pick up the new player list without
 * wiping the league itself (fixtures, standings, user ownership, invite
 * code, chat history all survive).
 *
 * Mapping: within each league, clubs are sorted by createdAt (the same
 * order create-league.ts inserts them), then matched to SQUAD_PACKS[i].
 * Bot clubs adopt the pack's real club name, short name, city, and
 * colours. User-owned clubs keep their custom name and shortName — the
 * user shouldn't have their "Kartel Crew" suddenly renamed to
 * "Fenerbahçe" — but their roster is still replaced by the FB pack.
 *
 * Run: npx tsx scripts/reseed-squads.ts
 */
import { and, asc, eq, ne } from "drizzle-orm";
import { db } from "../lib/db";
import {
  clubs,
  feedEvents,
  leagues,
  players,
  transferListings,
} from "../lib/schema";
import { SQUAD_PACKS } from "../lib/squad-packs";

// Per-role attribute offsets from overall (match seed.ts). Keeping a
// local copy here avoids pulling the seed module, whose bottom-level
// `main()` would otherwise re-run on import and duplicate-seed the DB.
type AttrOffsets = {
  pace: number;
  shooting: number;
  passing: number;
  defending: number;
  physical: number;
  goalkeeping: number;
};
const ROLE_ATTR_OFFSETS: Record<string, AttrOffsets> = {
  GK:  { pace: -12, shooting: -45, passing:  -5, defending: -15, physical:   0, goalkeeping: +18 },
  CB:  { pace:  -5, shooting: -22, passing:  -6, defending: +12, physical:  +8, goalkeeping: -40 },
  LB:  { pace:  +6, shooting: -16, passing:  +1, defending:  +4, physical:   0, goalkeeping: -40 },
  RB:  { pace:  +6, shooting: -16, passing:  +1, defending:  +4, physical:   0, goalkeeping: -40 },
  CDM: { pace:  -3, shooting: -10, passing:  +5, defending:  +6, physical:  +5, goalkeeping: -40 },
  CM:  { pace:   0, shooting:  -4, passing: +10, defending:  -3, physical:  +1, goalkeeping: -40 },
  AM:  { pace:  +3, shooting:  +4, passing: +10, defending: -12, physical:  -3, goalkeeping: -40 },
  LW:  { pace: +11, shooting:  +3, passing:  +2, defending: -11, physical:  -4, goalkeeping: -40 },
  RW:  { pace: +11, shooting:  +3, passing:  +2, defending: -11, physical:  -4, goalkeeping: -40 },
  ST:  { pace:  +6, shooting: +13, passing:  -6, defending: -18, physical:  +6, goalkeeping: -40 },
  CF:  { pace:  +4, shooting: +10, passing:  -1, defending: -15, physical:  +5, goalkeeping: -40 },
};
function rollAttr(base: number, offset: number, r: () => number): number {
  const noise = (r() - 0.5) * 8;
  return Math.max(30, Math.min(99, Math.round(base + offset + noise)));
}
function computeAttrsFromOvr(ovr: number, role: string, r: () => number) {
  const o = ROLE_ATTR_OFFSETS[role] ?? ROLE_ATTR_OFFSETS.CM;
  return {
    pace: rollAttr(ovr, o.pace, r),
    shooting: rollAttr(ovr, o.shooting, r),
    passing: rollAttr(ovr, o.passing, r),
    defending: rollAttr(ovr, o.defending, r),
    physical: rollAttr(ovr, o.physical, r),
    goalkeeping: rollAttr(ovr, o.goalkeeping, r),
  };
}

async function main() {
  console.log("Reseeding squads from SQUAD_PACKS…");

  const allLeagues = await db
    .select({ id: leagues.id, name: leagues.name })
    .from(leagues);

  if (allLeagues.length === 0) {
    console.log("  → no leagues to reseed (empty DB).");
    return;
  }

  let totalLeagues = 0;
  let totalPlayersReplaced = 0;
  let totalClubsRenamed = 0;

  for (const lg of allLeagues) {
    const leagueClubs = await db
      .select()
      .from(clubs)
      .where(eq(clubs.leagueId, lg.id))
      .orderBy(asc(clubs.createdAt));

    if (leagueClubs.length === 0) continue;

    let clubsRenamed = 0;
    let playersReplaced = 0;

    // Pack assignment strategy:
    //   1. Bot clubs whose current name / shortName matches a pack keep
    //      that identity (Galatasaray stays Galatasaray).
    //   2. User-owned clubs and unnamed bots claim the remaining packs in
    //      createdAt order — so "Friend 3 FC" ends up with whichever
    //      pack hasn't been claimed yet (usually FB since it's at index 0).
    const claimed = new Set<number>();
    const assignPackIndex = (club: typeof leagueClubs[number]): number | null => {
      const isBot = club.ownerUserId === null || club.isBot;
      if (isBot) {
        const nameMatch = SQUAD_PACKS.findIndex(
          (p, idx) => !claimed.has(idx) && (p.club.name === club.name || p.club.short === club.shortName),
        );
        if (nameMatch !== -1) return nameMatch;
      }
      // Fall through: first unclaimed pack (deterministic by createdAt order).
      const firstFree = SQUAD_PACKS.findIndex((_, idx) => !claimed.has(idx));
      return firstFree === -1 ? null : firstFree;
    };

    for (let i = 0; i < leagueClubs.length; i++) {
      const club = leagueClubs[i];
      const packIdx = assignPackIndex(club);
      if (packIdx === null) continue;
      claimed.add(packIdx);
      const pack = SQUAD_PACKS[packIdx];

      // Clear outgoing transfer listings that reference this club's players
      // — stale listings pointing at deleted players crash the transfer UI.
      await db
        .delete(transferListings)
        .where(eq(transferListings.sellerClubId, club.id));

      // Wipe existing roster + load pack roster. Listings for bot-market
      // players (sellerClubId=null) survive because they're not tied to a
      // specific club, but the players they referenced are gone — the
      // bots-job next tick will re-spawn fresh listings.
      await db.delete(players).where(eq(players.clubId, club.id));

      // Club meta: bot clubs pick up the real club identity; human-owned
      // keep their custom name/short but still get refreshed colours +
      // city so the palette matches the roster they just inherited.
      const isBot = club.ownerUserId === null || club.isBot;
      const updates: Partial<typeof clubs.$inferInsert> = {
        city: pack.club.city,
        color: pack.club.color,
        color2: pack.club.color2,
      };
      if (isBot) {
        updates.name = pack.club.name;
        updates.shortName = pack.club.short;
        clubsRenamed++;
      }
      await db.update(clubs).set(updates).where(eq(clubs.id, club.id));

      // Insert pack roster
      const r = (() => {
        let s = (club.id.charCodeAt(0) * 997 + i * 31) >>> 0;
        return () => {
          s = (s * 1664525 + 1013904223) >>> 0;
          return s / 0xffffffff;
        };
      })();
      const rows = pack.players.map((p) => ({
        leagueId: lg.id,
        clubId: club.id,
        name: p.n,
        position: p.pos,
        role: p.role,
        secondaryRoles: JSON.stringify([]),
        jerseyNumber: p.num ?? null,
        age: p.age,
        nationality: p.nat,
        overall: p.ovr,
        potential: p.pot,
        ...computeAttrsFromOvr(p.ovr, p.role, r),
        fitness: p.fit ?? 90,
        morale: p.mor ?? 4,
        wageCents: (p.wage ?? 100_000) * 100,
        marketValueCents: (p.val ?? 1_000_000) * 100,
        contractYears: p.ctr ?? 3,
        status:
          p.status && p.status !== "listed"
            ? (p.status as "active" | "injured" | "suspended" | "training")
            : "active",
        lastRatings: JSON.stringify(p.form ?? []),
      }));
      await db.insert(players).values(rows);
      playersReplaced += rows.length;
    }

    // Clear any remaining stale listings in this league (bot-market
    // listings referencing now-deleted players).
    await db
      .delete(transferListings)
      .where(
        and(
          eq(transferListings.leagueId, lg.id),
          ne(transferListings.status, "sold"),
        ),
      );

    // Welcome event so the activity feed reflects the reseed.
    const [firstClub] = leagueClubs;
    if (firstClub) {
      await db.insert(feedEvents).values({
        leagueId: lg.id,
        clubId: firstClub.id,
        eventType: "morale",
        text: `2025-26 kadroları güncellendi — ${leagueClubs.length} takım yenilendi.`,
      });
    }

    totalLeagues++;
    totalPlayersReplaced += playersReplaced;
    totalClubsRenamed += clubsRenamed;
    console.log(
      `  ✓ "${lg.name}": ${leagueClubs.length} clubs, ${playersReplaced} players rewritten, ${clubsRenamed} bots renamed`,
    );
  }

  console.log(
    `\n✅ Reseeded ${totalLeagues} leagues · ${totalPlayersReplaced} players · ${totalClubsRenamed} bot clubs renamed.`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
