import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { chatMessages, clubs, feedEvents, users } from "@/lib/schema";
import type { LeagueContext } from "@/lib/session";
import type { CrestLookup } from "@/lib/queries/transfer";

export type CrewMemberView = {
  userId: string;
  userName: string;
  clubId: string;
  clubName: string;
  clubShort: string;
  isBot: boolean;
  isMe: boolean;
};

export type ChatMessageView = {
  id: string;
  userId: string;
  userName: string;
  clubId: string;
  body: string;
  timeLabel: string;
  isMe: boolean;
};

export type FeedItemView = {
  id: string;
  type: "transfer" | "match" | "scout" | "paper" | "morale";
  text: string;
  clubId: string | null;
  relativeTime: string;
};

export type CrewPageData = {
  roster: CrewMemberView[];
  messages: ChatMessageView[];
  feed: FeedItemView[];
  crestLookup: CrestLookup;
  userId: string;
};

function relativeTime(from: Date, now: number): string {
  const diff = Math.max(1, Math.floor((now - from.getTime()) / 1000));
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}dk`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}sa`;
  return `${Math.floor(diff / 86400)}g`;
}

export async function loadCrewData(ctx: LeagueContext): Promise<CrewPageData> {
  const { league, user } = ctx;

  // Roster: all clubs in league + owner info (if any)
  const clubRows = await db
    .select()
    .from(clubs)
    .where(eq(clubs.leagueId, league.id));

  const ownerIds = clubRows
    .map((c) => c.ownerUserId)
    .filter((id): id is string => !!id);
  const ownerRows = ownerIds.length
    ? await Promise.all(
        ownerIds.map((id) =>
          db.select().from(users).where(eq(users.id, id)).limit(1),
        ),
      )
    : [];
  const ownerMap = new Map(ownerRows.flat().map((u) => [u.id, u]));

  const roster: CrewMemberView[] = clubRows.map((c) => {
    const owner = c.ownerUserId ? ownerMap.get(c.ownerUserId) : undefined;
    return {
      userId: c.ownerUserId ?? "",
      userName: owner?.name ?? `Bot · ${c.shortName}`,
      clubId: c.id,
      clubName: c.name,
      clubShort: c.shortName,
      isBot: c.isBot,
      isMe: c.id === ctx.club.id,
    };
  });

  // Chat messages (last 50)
  const msgRows = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.leagueId, league.id))
    .orderBy(desc(chatMessages.sentAt))
    .limit(50);
  msgRows.reverse();
  const userClubMap = new Map(clubRows.map((c) => [c.ownerUserId ?? "", c]));
  const userNameMap = new Map<string, string>();
  userNameMap.set(user.id, user.name);
  for (const u of ownerRows.flat()) userNameMap.set(u.id, u.name);
  const messages: ChatMessageView[] = msgRows.map((m) => {
    const sentAt = new Date(m.sentAt);
    const memberClub = userClubMap.get(m.userId);
    return {
      id: m.id,
      userId: m.userId,
      userName: userNameMap.get(m.userId) ?? "Bilinmeyen",
      clubId: memberClub?.id ?? "",
      body: m.body,
      timeLabel: `${String(sentAt.getHours()).padStart(2, "0")}:${String(
        sentAt.getMinutes(),
      ).padStart(2, "0")}`,
      isMe: m.userId === user.id,
    };
  });

  // Feed events (last 30)
  const feedRows = await db
    .select()
    .from(feedEvents)
    .where(eq(feedEvents.leagueId, league.id))
    .orderBy(desc(feedEvents.createdAt))
    .limit(30);
  const now = Date.now();
  const feed: FeedItemView[] = feedRows.map((f) => ({
    id: f.id,
    type: f.eventType,
    text: f.text,
    clubId: f.clubId,
    relativeTime: relativeTime(new Date(f.createdAt), now),
  }));

  const crestLookup: CrestLookup = {};
  for (const c of clubRows) {
    crestLookup[c.id] = {
      color: c.color,
      color2: c.color2,
      short: c.shortName,
    };
  }

  return { roster, messages, feed, crestLookup, userId: user.id };
}
