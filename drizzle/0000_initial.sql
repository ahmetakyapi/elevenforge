CREATE TYPE "public"."feed_event_type" AS ENUM('transfer', 'match', 'scout', 'paper', 'morale');--> statement-breakpoint
CREATE TYPE "public"."fixture_status" AS ENUM('scheduled', 'live', 'finished');--> statement-breakpoint
CREATE TYPE "public"."league_status" AS ENUM('lobby', 'active', 'finished');--> statement-breakpoint
CREATE TYPE "public"."league_visibility" AS ENUM('private', 'public');--> statement-breakpoint
CREATE TYPE "public"."listing_status" AS ENUM('active', 'sold', 'expired', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."player_position" AS ENUM('GK', 'DEF', 'MID', 'FWD');--> statement-breakpoint
CREATE TYPE "public"."player_status" AS ENUM('active', 'injured', 'suspended', 'training', 'listed');--> statement-breakpoint
CREATE TYPE "public"."scout_status" AS ENUM('active', 'returned', 'claimed', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."scout_target_pos" AS ENUM('GK', 'DEF', 'MID', 'FWD', 'ANY');--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"league_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"body" text NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clubs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"league_id" uuid NOT NULL,
	"owner_user_id" uuid,
	"is_bot" boolean DEFAULT false NOT NULL,
	"name" text NOT NULL,
	"short_name" text NOT NULL,
	"city" text NOT NULL,
	"color" text NOT NULL,
	"color2" text NOT NULL,
	"balance_cents" bigint DEFAULT 4500000000 NOT NULL,
	"stadium_level" integer DEFAULT 1 NOT NULL,
	"training_level" integer DEFAULT 1 NOT NULL,
	"pitch_level" integer DEFAULT 1 NOT NULL,
	"morale" integer DEFAULT 4 NOT NULL,
	"prestige" integer DEFAULT 50 NOT NULL,
	"season_points" integer DEFAULT 0 NOT NULL,
	"season_wins" integer DEFAULT 0 NOT NULL,
	"season_draws" integer DEFAULT 0 NOT NULL,
	"season_losses" integer DEFAULT 0 NOT NULL,
	"season_goals_for" integer DEFAULT 0 NOT NULL,
	"season_goals_against" integer DEFAULT 0 NOT NULL,
	"formation" text DEFAULT '4-3-3' NOT NULL,
	"mentality" integer DEFAULT 3 NOT NULL,
	"pressing" integer DEFAULT 3 NOT NULL,
	"tempo" integer DEFAULT 2 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feed_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"league_id" uuid NOT NULL,
	"club_id" uuid,
	"event_type" "feed_event_type" NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fixtures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"league_id" uuid NOT NULL,
	"season_number" integer NOT NULL,
	"week_number" integer NOT NULL,
	"home_club_id" uuid NOT NULL,
	"away_club_id" uuid NOT NULL,
	"venue" text DEFAULT '' NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"status" "fixture_status" DEFAULT 'scheduled' NOT NULL,
	"home_score" integer,
	"away_score" integer,
	"commentary_json" text,
	"stats_json" text,
	"played_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "friendlies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"league_id" uuid NOT NULL,
	"club_id" uuid NOT NULL,
	"played_at" timestamp with time zone DEFAULT now() NOT NULL,
	"boost_applied" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leagues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"invite_code" text NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"season_number" integer DEFAULT 1 NOT NULL,
	"week_number" integer DEFAULT 0 NOT NULL,
	"season_length" integer DEFAULT 5 NOT NULL,
	"match_time" text DEFAULT '21:00' NOT NULL,
	"visibility" "league_visibility" DEFAULT 'private' NOT NULL,
	"accent_color" text DEFAULT '#dc2626' NOT NULL,
	"status" "league_status" DEFAULT 'lobby' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "leagues_invite_code_unique" UNIQUE("invite_code")
);
--> statement-breakpoint
CREATE TABLE "newspapers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"league_id" uuid NOT NULL,
	"season_number" integer NOT NULL,
	"week_number" integer NOT NULL,
	"cover_json" text NOT NULL,
	"totw_json" text NOT NULL,
	"scorers_json" text NOT NULL,
	"assists_json" text NOT NULL,
	"fun_fact" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "newspapers_unique_week" UNIQUE("league_id","season_number","week_number")
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"league_id" uuid NOT NULL,
	"club_id" uuid,
	"name" text NOT NULL,
	"position" "player_position" NOT NULL,
	"role" text NOT NULL,
	"jersey_number" integer,
	"age" integer NOT NULL,
	"nationality" text NOT NULL,
	"overall" integer NOT NULL,
	"potential" integer NOT NULL,
	"fitness" integer DEFAULT 90 NOT NULL,
	"morale" integer DEFAULT 4 NOT NULL,
	"wage_cents" bigint DEFAULT 10000000 NOT NULL,
	"market_value_cents" bigint DEFAULT 500000000 NOT NULL,
	"contract_years" integer DEFAULT 3 NOT NULL,
	"status" "player_status" DEFAULT 'active' NOT NULL,
	"injury_until" timestamp with time zone,
	"suspension_matches_left" integer DEFAULT 0 NOT NULL,
	"yellow_cards_season" integer DEFAULT 0 NOT NULL,
	"red_cards_season" integer DEFAULT 0 NOT NULL,
	"goals_season" integer DEFAULT 0 NOT NULL,
	"assists_season" integer DEFAULT 0 NOT NULL,
	"last_ratings" text DEFAULT '[]' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
CREATE TABLE "scouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"league_id" uuid NOT NULL,
	"club_id" uuid NOT NULL,
	"target_nationality" text NOT NULL,
	"target_position" "scout_target_pos" DEFAULT 'ANY' NOT NULL,
	"age_min" integer DEFAULT 17 NOT NULL,
	"age_max" integer DEFAULT 24 NOT NULL,
	"cost_cents" bigint DEFAULT 50000000 NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"returns_at" timestamp with time zone NOT NULL,
	"status" "scout_status" DEFAULT 'active' NOT NULL,
	"results_json" text,
	"claimed_player_id" uuid
);
--> statement-breakpoint
CREATE TABLE "transfer_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"league_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"from_club_id" uuid,
	"to_club_id" uuid NOT NULL,
	"price_cents" bigint NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transfer_listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"league_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"seller_club_id" uuid,
	"is_bot_market" boolean DEFAULT true NOT NULL,
	"price_cents" bigint NOT NULL,
	"original_price_cents" bigint NOT NULL,
	"listed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_decay_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"status" "listing_status" DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feed_events" ADD CONSTRAINT "feed_events_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feed_events" ADD CONSTRAINT "feed_events_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fixtures" ADD CONSTRAINT "fixtures_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fixtures" ADD CONSTRAINT "fixtures_home_club_id_clubs_id_fk" FOREIGN KEY ("home_club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fixtures" ADD CONSTRAINT "fixtures_away_club_id_clubs_id_fk" FOREIGN KEY ("away_club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendlies" ADD CONSTRAINT "friendlies_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendlies" ADD CONSTRAINT "friendlies_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leagues" ADD CONSTRAINT "leagues_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newspapers" ADD CONSTRAINT "newspapers_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scouts" ADD CONSTRAINT "scouts_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scouts" ADD CONSTRAINT "scouts_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scouts" ADD CONSTRAINT "scouts_claimed_player_id_players_id_fk" FOREIGN KEY ("claimed_player_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_history" ADD CONSTRAINT "transfer_history_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_history" ADD CONSTRAINT "transfer_history_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_history" ADD CONSTRAINT "transfer_history_from_club_id_clubs_id_fk" FOREIGN KEY ("from_club_id") REFERENCES "public"."clubs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_history" ADD CONSTRAINT "transfer_history_to_club_id_clubs_id_fk" FOREIGN KEY ("to_club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_listings" ADD CONSTRAINT "transfer_listings_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_listings" ADD CONSTRAINT "transfer_listings_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_listings" ADD CONSTRAINT "transfer_listings_seller_club_id_clubs_id_fk" FOREIGN KEY ("seller_club_id") REFERENCES "public"."clubs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chat_league_idx" ON "chat_messages" USING btree ("league_id","sent_at");--> statement-breakpoint
CREATE INDEX "clubs_league_idx" ON "clubs" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "clubs_owner_idx" ON "clubs" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "feed_league_idx" ON "feed_events" USING btree ("league_id","created_at");--> statement-breakpoint
CREATE INDEX "fixtures_league_idx" ON "fixtures" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "fixtures_week_idx" ON "fixtures" USING btree ("season_number","week_number");--> statement-breakpoint
CREATE INDEX "friendlies_club_day_idx" ON "friendlies" USING btree ("club_id","played_at");--> statement-breakpoint
CREATE INDEX "players_league_idx" ON "players" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "players_club_idx" ON "players" USING btree ("club_id");--> statement-breakpoint
CREATE INDEX "push_user_idx" ON "push_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "scouts_league_idx" ON "scouts" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "scouts_club_idx" ON "scouts" USING btree ("club_id");--> statement-breakpoint
CREATE INDEX "scouts_status_idx" ON "scouts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "history_league_idx" ON "transfer_history" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "listings_league_idx" ON "transfer_listings" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "listings_player_idx" ON "transfer_listings" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "listings_status_idx" ON "transfer_listings" USING btree ("status");