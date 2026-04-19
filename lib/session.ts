/**
 * Server-side helper: resolve the current user's league + club context.
 * Used by Server Components to load page-scoped data.
 *
 * A user can own clubs in multiple leagues (joined a friend after creating
 * their own starter). `users.currentLeagueId` is the active selection,
 * updated on join/switch. Falls back to the most-recently-created owned
 * club's league.
 */
import { and, desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  clubs,
  leagues,
  users,
  type Club,
  type League,
  type User,
} from "@/lib/schema";

export type LeagueContext = {
  user: User;
  league: League;
  club: Club;
  ownedLeagues: Array<{ leagueId: string; clubId: string; leagueName: string; clubName: string }>;
  isCommissioner: boolean;
};

export async function requireLeagueContext(): Promise<LeagueContext> {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/login");

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) redirect("/login");

  // Find every club this user owns, joined to its league.
  const owned = await db
    .select({
      clubId: clubs.id,
      clubName: clubs.name,
      leagueId: leagues.id,
      leagueName: leagues.name,
    })
    .from(clubs)
    .innerJoin(leagues, eq(leagues.id, clubs.leagueId))
    .where(eq(clubs.ownerUserId, user.id))
    .orderBy(desc(clubs.createdAt));
  if (owned.length === 0) redirect("/lobby");

  const preferred =
    (user.currentLeagueId &&
      owned.find((o) => o.leagueId === user.currentLeagueId)) ||
    owned[0];

  // Self-heal: if currentLeagueId pointed at a deleted league, snap it to the
  // first owned league so future loads avoid the lookup miss.
  if (user.currentLeagueId !== preferred.leagueId) {
    await db
      .update(users)
      .set({ currentLeagueId: preferred.leagueId })
      .where(eq(users.id, user.id));
    user.currentLeagueId = preferred.leagueId;
  }

  const [league] = await db
    .select()
    .from(leagues)
    .where(eq(leagues.id, preferred.leagueId))
    .limit(1);
  const [userClub] = await db
    .select()
    .from(clubs)
    .where(
      and(eq(clubs.leagueId, preferred.leagueId), eq(clubs.ownerUserId, user.id)),
    )
    .limit(1);
  if (!league || !userClub) redirect("/lobby");

  return {
    user,
    league,
    club: userClub,
    ownedLeagues: owned.map((o) => ({
      leagueId: o.leagueId,
      clubId: o.clubId,
      leagueName: o.leagueName,
      clubName: o.clubName,
    })),
    isCommissioner: league.createdByUserId === user.id,
  };
}

/**
 * Soft variant of requireLeagueContext used by global UI (top nav). Returns
 * null instead of redirecting when the user has no club yet, so the layout
 * can render around lobby pages without bouncing the user.
 */
export async function tryLeagueContext(): Promise<LeagueContext | null> {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return null;
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return null;
  const owned = await db
    .select({
      clubId: clubs.id,
      clubName: clubs.name,
      leagueId: leagues.id,
      leagueName: leagues.name,
    })
    .from(clubs)
    .innerJoin(leagues, eq(leagues.id, clubs.leagueId))
    .where(eq(clubs.ownerUserId, user.id))
    .orderBy(desc(clubs.createdAt));
  if (owned.length === 0) return null;
  const preferred =
    (user.currentLeagueId &&
      owned.find((o) => o.leagueId === user.currentLeagueId)) ||
    owned[0];
  const [league] = await db
    .select()
    .from(leagues)
    .where(eq(leagues.id, preferred.leagueId))
    .limit(1);
  const [userClub] = await db
    .select()
    .from(clubs)
    .where(
      and(eq(clubs.leagueId, preferred.leagueId), eq(clubs.ownerUserId, user.id)),
    )
    .limit(1);
  if (!league || !userClub) return null;
  return {
    user,
    league,
    club: userClub,
    ownedLeagues: owned.map((o) => ({
      leagueId: o.leagueId,
      clubId: o.clubId,
      leagueName: o.leagueName,
      clubName: o.clubName,
    })),
    isCommissioner: league.createdByUserId === user.id,
  };
}

export async function getSessionUserId(): Promise<string | null> {
  const session = await auth();
  return (session?.user as { id?: string } | undefined)?.id ?? null;
}

/**
 * Switch the user's active league. The new id must be one the user owns a
 * club in (validated against the join). Used by the league switcher in the
 * navbar.
 */
export async function switchLeague(leagueId: string): Promise<{
  ok: boolean;
  error?: string;
}> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: "Oturum yok." };
  const owned = await db
    .select({ id: clubs.id })
    .from(clubs)
    .where(and(eq(clubs.ownerUserId, userId), eq(clubs.leagueId, leagueId)))
    .limit(1);
  if (owned.length === 0) {
    return { ok: false, error: "Bu ligin üyesi değilsin." };
  }
  await db
    .update(users)
    .set({ currentLeagueId: leagueId })
    .where(eq(users.id, userId));
  return { ok: true };
}
