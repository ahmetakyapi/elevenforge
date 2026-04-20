import { relations } from "drizzle-orm";
import {
  bigint,
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

const money = (name: string) => bigint(name, { mode: "number" });

const id = () =>
  uuid("id")
    .primaryKey()
    .defaultRandom();

const createdAt = () =>
  timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow();

// ─── Enums ────────────────────────────────────────────────────
export const leagueVisibility = pgEnum("league_visibility", [
  "private",
  "public",
]);
export const leagueStatus = pgEnum("league_status", [
  "lobby",
  "active",
  "finished",
]);
export const playerPosition = pgEnum("player_position", [
  "GK",
  "DEF",
  "MID",
  "FWD",
]);
export const playerStatus = pgEnum("player_status", [
  "active",
  "injured",
  "suspended",
  "training",
  "listed",
]);
export const fixtureStatus = pgEnum("fixture_status", [
  "scheduled",
  "live",
  "finished",
]);
export const listingStatus = pgEnum("listing_status", [
  "active",
  "sold",
  "expired",
  "withdrawn",
]);
export const scoutTargetPos = pgEnum("scout_target_pos", [
  "GK",
  "DEF",
  "MID",
  "FWD",
  "ANY",
]);
export const scoutStatus = pgEnum("scout_status", [
  "active",
  "returned",
  "claimed",
  "expired",
  "cancelled",
]);
export const feedEventType = pgEnum("feed_event_type", [
  "transfer",
  "match",
  "scout",
  "paper",
  "morale",
]);

// ─── Users ────────────────────────────────────────────────────
export const users = pgTable(
  "users",
  {
    id: id(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    name: text("name").notNull(),
    loginStreak: integer("login_streak").notNull().default(0),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    lastStreakRewardDay: integer("last_streak_reward_day").notNull().default(0),
    // Which league the user is currently viewing. Null = use first owned club.
    // Populated after join/switch; cleared if that league is deleted.
    currentLeagueId: uuid("current_league_id"),
    createdAt: createdAt(),
  },
  (t) => [index("users_current_league_idx").on(t.currentLeagueId)],
);

// ─── Leagues ──────────────────────────────────────────────────
export const leagues = pgTable("leagues", {
  id: id(),
  name: text("name").notNull(),
  inviteCode: text("invite_code").notNull().unique(),
  createdByUserId: uuid("created_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  seasonNumber: integer("season_number").notNull().default(1),
  weekNumber: integer("week_number").notNull().default(0),
  seasonLength: integer("season_length").notNull().default(5),
  matchTime: text("match_time").notNull().default("21:00"),
  visibility: leagueVisibility("visibility").notNull().default("private"),
  accentColor: text("accent_color").notNull().default("#dc2626"),
  status: leagueStatus("status").notNull().default("lobby"),
  // When true, only the league commissioner (createdByUserId) can fast-forward
  // weeks. When false, any human owner can. Default true protects multiplayer
  // pacing.
  commissionerOnlyAdvance: boolean("commissioner_only_advance")
    .notNull()
    .default(true),
  // When true, dashboard shows a "Sıradaki Haftayı Oyna" button (still gated by
  // commissionerOnlyAdvance). When false (default), matches ONLY play via the
  // daily cron at the league's matchTime — no manual override at all.
  manualAdvanceEnabled: boolean("manual_advance_enabled")
    .notNull()
    .default(false),
  createdAt: createdAt(),
});

// ─── Clubs ────────────────────────────────────────────────────
export const clubs = pgTable(
  "clubs",
  {
    id: id(),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id, { onDelete: "cascade" }),
    ownerUserId: uuid("owner_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    isBot: boolean("is_bot").notNull().default(false),
    name: text("name").notNull(),
    shortName: text("short_name").notNull(),
    city: text("city").notNull(),
    color: text("color").notNull(),
    color2: text("color2").notNull(),
    balanceCents: money("balance_cents").notNull().default(4_500_000_000),
    stadiumLevel: integer("stadium_level").notNull().default(1),
    trainingLevel: integer("training_level").notNull().default(1),
    pitchLevel: integer("pitch_level").notNull().default(1),
    morale: integer("morale").notNull().default(4),
    prestige: integer("prestige").notNull().default(50),
    seasonPoints: integer("season_points").notNull().default(0),
    seasonWins: integer("season_wins").notNull().default(0),
    seasonDraws: integer("season_draws").notNull().default(0),
    seasonLosses: integer("season_losses").notNull().default(0),
    seasonGoalsFor: integer("season_goals_for").notNull().default(0),
    seasonGoalsAgainst: integer("season_goals_against").notNull().default(0),
    formation: text("formation").notNull().default("4-3-3"),
    mentality: integer("mentality").notNull().default(3),
    pressing: integer("pressing").notNull().default(3),
    tempo: integer("tempo").notNull().default(2),
    // JSON array of 7 slots [{ label:'A', formation, mentality, pressing, tempo }]
    tacticPresets: text("tactic_presets").notNull().default("[]"),
    // 3 conditional in-match substitutions: [{ outId, inId, minute }]
    // Engine swaps players when match clock crosses the minute. Empty = no subs.
    subPlanJson: text("sub_plan_json").notNull().default("[]"),
    // Board season goal — auto-assigned by prestige at season start.
    // Possible values: "champion" | "top4" | "midtable" | "survive".
    boardSeasonGoal: text("board_season_goal").notNull().default("midtable"),
    // 0-100 — drops if season target missed, owner is "fired" at 0.
    boardConfidence: integer("board_confidence").notNull().default(60),
    // Active sponsor contract: { name, payPerMatch, bonusPerWin, seasonBonus, weeksLeft } | null
    activeSponsorJson: text("active_sponsor_json"),
    // Staff slots: { headCoach: {id,name,tier}|null, physio: {...}|null, scout: {...}|null }
    // Each role boosts a specific subsystem (see lib/staff.ts):
    //   headCoach → match-day morale & tactic edge
    //   physio    → injury rate × (1 - tier*0.15), faster recovery
    //   scout     → bonus candidates per scout return
    staffJson: text("staff_json"),
    createdAt: createdAt(),
  },
  (t) => [
    index("clubs_league_idx").on(t.leagueId),
    index("clubs_owner_idx").on(t.ownerUserId),
  ],
);

// ─── Players ──────────────────────────────────────────────────
export const players = pgTable(
  "players",
  {
    id: id(),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id, { onDelete: "cascade" }),
    clubId: uuid("club_id").references(() => clubs.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    position: playerPosition("position").notNull(),
    role: text("role").notNull(),
    jerseyNumber: integer("jersey_number"),
    age: integer("age").notNull(),
    nationality: text("nationality").notNull(),
    overall: integer("overall").notNull(),
    potential: integer("potential").notNull(),
    // Position-aware attributes (0-99). `overall` stays the single aggregate
    // number shown in UI; these power the match engine so a striker's
    // finishing genuinely outranks a defender's, even at equal `overall`.
    pace: integer("pace").notNull().default(60),
    shooting: integer("shooting").notNull().default(60),
    passing: integer("passing").notNull().default(60),
    defending: integer("defending").notNull().default(60),
    physical: integer("physical").notNull().default(60),
    goalkeeping: integer("goalkeeping").notNull().default(30),
    fitness: integer("fitness").notNull().default(90),
    morale: integer("morale").notNull().default(4),
    wageCents: money("wage_cents").notNull().default(10_000_000),
    marketValueCents: money("market_value_cents")
      .notNull()
      .default(500_000_000),
    contractYears: integer("contract_years").notNull().default(3),
    status: playerStatus("status").notNull().default("active"),
    injuryUntil: timestamp("injury_until", { withTimezone: true }),
    suspensionMatchesLeft: integer("suspension_matches_left")
      .notNull()
      .default(0),
    yellowCardsSeason: integer("yellow_cards_season").notNull().default(0),
    redCardsSeason: integer("red_cards_season").notNull().default(0),
    goalsSeason: integer("goals_season").notNull().default(0),
    assistsSeason: integer("assists_season").notNull().default(0),
    lastRatings: text("last_ratings").notNull().default("[]"),
    // JSON array of extra role codes (e.g. ["LW","RW"]) the player can play.
    // The `role` column is the primary one; these are secondary.
    secondaryRoles: text("secondary_roles").notNull().default("[]"),
    // Loan tracking: when set, player belongs to clubId temporarily and
    // returns to ownerClubId at loanReturnsAt. season-roll snaps them back.
    loanOwnerClubId: uuid("loan_owner_club_id").references(() => clubs.id, {
      onDelete: "set null",
    }),
    loanReturnsAt: timestamp("loan_returns_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    index("players_league_idx").on(t.leagueId),
    index("players_club_idx").on(t.clubId),
  ],
);

// ─── Fixtures ─────────────────────────────────────────────────
export const fixtures = pgTable(
  "fixtures",
  {
    id: id(),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id, { onDelete: "cascade" }),
    seasonNumber: integer("season_number").notNull(),
    weekNumber: integer("week_number").notNull(),
    homeClubId: uuid("home_club_id")
      .notNull()
      .references(() => clubs.id, { onDelete: "cascade" }),
    awayClubId: uuid("away_club_id")
      .notNull()
      .references(() => clubs.id, { onDelete: "cascade" }),
    venue: text("venue").notNull().default(""),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
    status: fixtureStatus("status").notNull().default("scheduled"),
    homeScore: integer("home_score"),
    awayScore: integer("away_score"),
    commentaryJson: text("commentary_json"),
    statsJson: text("stats_json"),
    playedAt: timestamp("played_at", { withTimezone: true }),
    // Deterministic seed used when this fixture was simulated. Same fixture →
    // same scoreline on replay; never re-rolls just because the page reloaded.
    rngSeed: bigint("rng_seed", { mode: "number" }),
    createdAt: createdAt(),
  },
  (t) => [
    index("fixtures_league_idx").on(t.leagueId),
    index("fixtures_week_idx").on(t.seasonNumber, t.weekNumber),
  ],
);

// ─── Transfer listings ────────────────────────────────────────
export const transferListings = pgTable(
  "transfer_listings",
  {
    id: id(),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id, { onDelete: "cascade" }),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    sellerClubId: uuid("seller_club_id").references(() => clubs.id, {
      onDelete: "set null",
    }),
    isBotMarket: boolean("is_bot_market").notNull().default(true),
    priceCents: money("price_cents").notNull(),
    originalPriceCents: money("original_price_cents").notNull(),
    // Auto-bid: when set, any club whose maxBidCents >= priceCents will
    // automatically buy this listing on the next transfer-bots tick.
    // Persisted on the listing row (one per club) — see autoBids JSON.
    autoBidsJson: text("auto_bids_json").notNull().default("[]"),
    listedAt: timestamp("listed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastDecayAt: timestamp("last_decay_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    status: listingStatus("status").notNull().default("active"),
  },
  (t) => [
    index("listings_league_idx").on(t.leagueId),
    index("listings_player_idx").on(t.playerId),
    index("listings_status_idx").on(t.status),
  ],
);

// ─── Transfer history ─────────────────────────────────────────
export const transferHistory = pgTable(
  "transfer_history",
  {
    id: id(),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id, { onDelete: "cascade" }),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    fromClubId: uuid("from_club_id").references(() => clubs.id, {
      onDelete: "set null",
    }),
    toClubId: uuid("to_club_id")
      .notNull()
      .references(() => clubs.id, { onDelete: "cascade" }),
    priceCents: money("price_cents").notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("history_league_idx").on(t.leagueId)],
);

// ─── Scouts ───────────────────────────────────────────────────
export const scouts = pgTable(
  "scouts",
  {
    id: id(),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id, { onDelete: "cascade" }),
    clubId: uuid("club_id")
      .notNull()
      .references(() => clubs.id, { onDelete: "cascade" }),
    targetNationality: text("target_nationality").notNull(),
    targetPosition: scoutTargetPos("target_position").notNull().default("ANY"),
    ageMin: integer("age_min").notNull().default(17),
    ageMax: integer("age_max").notNull().default(24),
    costCents: money("cost_cents").notNull().default(50_000_000),
    sentAt: timestamp("sent_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    returnsAt: timestamp("returns_at", { withTimezone: true }).notNull(),
    status: scoutStatus("status").notNull().default("active"),
    resultsJson: text("results_json"),
    claimedPlayerId: uuid("claimed_player_id").references(() => players.id, {
      onDelete: "set null",
    }),
  },
  (t) => [
    index("scouts_league_idx").on(t.leagueId),
    index("scouts_club_idx").on(t.clubId),
    index("scouts_status_idx").on(t.status),
  ],
);

// ─── Chat ─────────────────────────────────────────────────────
export const chatMessages = pgTable(
  "chat_messages",
  {
    id: id(),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("chat_league_idx").on(t.leagueId, t.sentAt)],
);

// ─── Feed events (shared universe) ────────────────────────────
export const feedEvents = pgTable(
  "feed_events",
  {
    id: id(),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id, { onDelete: "cascade" }),
    clubId: uuid("club_id").references(() => clubs.id, {
      onDelete: "set null",
    }),
    eventType: feedEventType("event_type").notNull(),
    text: text("text").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("feed_league_idx").on(t.leagueId, t.createdAt)],
);

// ─── Newspapers ───────────────────────────────────────────────
export const newspapers = pgTable(
  "newspapers",
  {
    id: id(),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id, { onDelete: "cascade" }),
    seasonNumber: integer("season_number").notNull(),
    weekNumber: integer("week_number").notNull(),
    coverJson: text("cover_json").notNull(),
    totwJson: text("totw_json").notNull(),
    scorersJson: text("scorers_json").notNull(),
    assistsJson: text("assists_json").notNull(),
    funFact: text("fun_fact").notNull().default(""),
    publishedAt: createdAt(),
  },
  (t) => [
    unique("newspapers_unique_week").on(
      t.leagueId,
      t.seasonNumber,
      t.weekNumber,
    ),
  ],
);

// ─── Push subscriptions ───────────────────────────────────────
export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: id(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull().unique(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("push_user_idx").on(t.userId)],
);

// ─── Achievements ─────────────────────────────────────────────
// Permanent badges awarded to a club. The same `code` can be awarded
// multiple times (e.g. multi-season champion); UI groups by code.
export const achievements = pgTable(
  "achievements",
  {
    id: id(),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id, { onDelete: "cascade" }),
    clubId: uuid("club_id")
      .notNull()
      .references(() => clubs.id, { onDelete: "cascade" }),
    // Code drives the icon + label; payloadJson carries season etc.
    code: text("code").notNull(),
    payloadJson: text("payload_json").notNull().default("{}"),
    awardedAt: createdAt(),
  },
  (t) => [
    index("achievements_club_idx").on(t.clubId),
    index("achievements_league_idx").on(t.leagueId),
  ],
);

// ─── Cup fixtures ─────────────────────────────────────────────
// Single-elimination 16-team knockout that runs alongside the league
// season. Round 1 = 8 ties, R2 = 4, R3 (semis) = 2, R4 (final) = 1.
// `slot` is the bracket position (0-7 in R1, 0-3 in R2, etc) so the
// winner of slot N in round R feeds slot N/2 in round R+1.
export const cupFixtures = pgTable(
  "cup_fixtures",
  {
    id: id(),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id, { onDelete: "cascade" }),
    seasonNumber: integer("season_number").notNull(),
    round: integer("round").notNull(), // 1=R16, 2=QF, 3=SF, 4=F
    slot: integer("slot").notNull(),
    homeClubId: uuid("home_club_id").references(() => clubs.id, {
      onDelete: "cascade",
    }),
    awayClubId: uuid("away_club_id").references(() => clubs.id, {
      onDelete: "cascade",
    }),
    homeScore: integer("home_score"),
    awayScore: integer("away_score"),
    winnerClubId: uuid("winner_club_id").references(() => clubs.id, {
      onDelete: "set null",
    }),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
    playedAt: timestamp("played_at", { withTimezone: true }),
    status: fixtureStatus("status").notNull().default("scheduled"),
  },
  (t) => [
    index("cup_league_idx").on(t.leagueId),
    index("cup_season_round_idx").on(t.seasonNumber, t.round),
  ],
);

// ─── Tactic Spies ─────────────────────────────────────────────
// One row per (fromClub → targetClub → fixture). Records the opponent's
// formation, tactic dials, and projected starting XI so the buyer can plan
// a counter. Costs €1M when sent (charged in the action). Replayable for
// the same fixture without re-charging — the row is the receipt.
export const tacticSpies = pgTable(
  "tactic_spies",
  {
    id: id(),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id, { onDelete: "cascade" }),
    fromClubId: uuid("from_club_id")
      .notNull()
      .references(() => clubs.id, { onDelete: "cascade" }),
    targetClubId: uuid("target_club_id")
      .notNull()
      .references(() => clubs.id, { onDelete: "cascade" }),
    fixtureId: uuid("fixture_id")
      .notNull()
      .references(() => fixtures.id, { onDelete: "cascade" }),
    // JSON payload: { formation, mentality, pressing, tempo, lineup: [{name, role, ovr}] }
    resultJson: text("result_json").notNull(),
    sentAt: createdAt(),
  },
  (t) => [
    unique("spies_unique_per_fixture").on(t.fromClubId, t.fixtureId),
    index("spies_league_idx").on(t.leagueId),
  ],
);

// ─── Friendlies ───────────────────────────────────────────────
export const friendlies = pgTable(
  "friendlies",
  {
    id: id(),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id, { onDelete: "cascade" }),
    clubId: uuid("club_id")
      .notNull()
      .references(() => clubs.id, { onDelete: "cascade" }),
    playedAt: timestamp("played_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    boostApplied: boolean("boost_applied").notNull().default(true),
  },
  (t) => [index("friendlies_club_day_idx").on(t.clubId, t.playedAt)],
);

// ─── Relations ────────────────────────────────────────────────
export const leaguesRelations = relations(leagues, ({ many }) => ({
  clubs: many(clubs),
  fixtures: many(fixtures),
  players: many(players),
}));

export const clubsRelations = relations(clubs, ({ one, many }) => ({
  league: one(leagues, { fields: [clubs.leagueId], references: [leagues.id] }),
  owner: one(users, { fields: [clubs.ownerUserId], references: [users.id] }),
  players: many(players),
}));

export const playersRelations = relations(players, ({ one }) => ({
  club: one(clubs, { fields: [players.clubId], references: [clubs.id] }),
  league: one(leagues, {
    fields: [players.leagueId],
    references: [leagues.id],
  }),
}));

// ─── Types ────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type League = typeof leagues.$inferSelect;
export type Club = typeof clubs.$inferSelect;
export type DBPlayer = typeof players.$inferSelect;
export type Fixture = typeof fixtures.$inferSelect;
export type TransferListingRow = typeof transferListings.$inferSelect;
export type Scout = typeof scouts.$inferSelect;
export type ChatMessageRow = typeof chatMessages.$inferSelect;
export type FeedEvent = typeof feedEvents.$inferSelect;
export type NewspaperRow = typeof newspapers.$inferSelect;
export type PushSubscriptionRow = typeof pushSubscriptions.$inferSelect;
export type TacticSpyRow = typeof tacticSpies.$inferSelect;
export type CupFixture = typeof cupFixtures.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;

// ─── Press conferences ────────────────────────────────────────
// Weekly question fired at the user before match-day. They pick one of N
// answer chips; each maps to a (squadMoraleDelta, opponentMoraleDelta,
// fanPrestigeDelta) triple. Resolves a turn later.
export const pressConferences = pgTable(
  "press_conferences",
  {
    id: id(),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id, { onDelete: "cascade" }),
    clubId: uuid("club_id")
      .notNull()
      .references(() => clubs.id, { onDelete: "cascade" }),
    week: integer("week").notNull(),
    season: integer("season").notNull(),
    promptCode: text("prompt_code").notNull(),
    answerCode: text("answer_code"),
    askedAt: createdAt(),
    answeredAt: timestamp("answered_at", { withTimezone: true }),
  },
  (t) => [
    unique("press_unique_per_week").on(t.clubId, t.season, t.week),
    index("press_club_idx").on(t.clubId),
  ],
);

export type PressConference = typeof pressConferences.$inferSelect;

// ─── Transfer wishlist ─────────────────────────────────────────
// Per-club bookmark of player ids the user is watching. Used to filter
// the transfer market down to favorites + show a watching badge on
// listings.
export const transferWishlist = pgTable(
  "transfer_wishlist",
  {
    clubId: uuid("club_id")
      .notNull()
      .references(() => clubs.id, { onDelete: "cascade" }),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    addedAt: createdAt(),
  },
  (t) => [
    unique("wishlist_unique").on(t.clubId, t.playerId),
    index("wishlist_club_idx").on(t.clubId),
  ],
);

export type WishlistRow = typeof transferWishlist.$inferSelect;
