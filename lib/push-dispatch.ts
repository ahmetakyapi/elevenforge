/**
 * Higher-level push dispatchers tied to game events. Each fan-out reads
 * the relevant club owners from the DB so the engine code stays oblivious
 * to push subscriptions.
 *
 * All functions are best-effort: if no VAPID keys are set, sendPush logs
 * to stdout (dev) and returns silently.
 */
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { clubs, scouts } from "@/lib/schema";
import { sendPush } from "@/lib/push";

export async function dispatchMatchPush(input: {
  leagueId: string;
  homeClubId: string;
  awayClubId: string;
  homeClubName: string;
  awayClubName: string;
  homeScore: number;
  awayScore: number;
}): Promise<void> {
  const [home] = await db
    .select({ ownerUserId: clubs.ownerUserId })
    .from(clubs)
    .where(eq(clubs.id, input.homeClubId));
  const [away] = await db
    .select({ ownerUserId: clubs.ownerUserId })
    .from(clubs)
    .where(eq(clubs.id, input.awayClubId));
  const summary = `${input.homeClubName} ${input.homeScore} - ${input.awayScore} ${input.awayClubName}`;
  if (home?.ownerUserId) {
    const result =
      input.homeScore > input.awayScore
        ? "Galibiyet 🏆"
        : input.homeScore < input.awayScore
          ? "Mağlubiyet 😔"
          : "Beraberlik";
    await sendPush(home.ownerUserId, {
      title: result,
      body: summary,
      url: "/match",
    });
  }
  if (away?.ownerUserId && away.ownerUserId !== home?.ownerUserId) {
    const result =
      input.awayScore > input.homeScore
        ? "Galibiyet 🏆"
        : input.awayScore < input.homeScore
          ? "Mağlubiyet 😔"
          : "Beraberlik";
    await sendPush(away.ownerUserId, {
      title: result,
      body: summary,
      url: "/match",
    });
  }
}

export async function dispatchScoutPush(input: {
  scoutId: string;
}): Promise<void> {
  const [s] = await db
    .select()
    .from(scouts)
    .where(eq(scouts.id, input.scoutId));
  if (!s) return;
  const [c] = await db
    .select({ ownerUserId: clubs.ownerUserId, name: clubs.name })
    .from(clubs)
    .where(eq(clubs.id, s.clubId));
  if (!c?.ownerUserId) return;
  await sendPush(c.ownerUserId, {
    title: "Kaşif geri döndü",
    body: `${c.name} kaşifin raporu hazır — transfer ekranına bak.`,
    url: "/transfer",
  });
}

export async function dispatchTransferPush(input: {
  toUserId: string;
  playerName: string;
  fromClubName: string;
  priceEur: number;
}): Promise<void> {
  await sendPush(input.toUserId, {
    title: "Oyuncun satıldı",
    body: `${input.fromClubName} ${input.playerName}'i €${(input.priceEur / 1_000_000).toFixed(1)}M karşılığında aldı.`,
    url: "/transfer",
  });
}
