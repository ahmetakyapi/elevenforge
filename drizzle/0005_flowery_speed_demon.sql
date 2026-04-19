CREATE TABLE "cup_fixtures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"league_id" uuid NOT NULL,
	"season_number" integer NOT NULL,
	"round" integer NOT NULL,
	"slot" integer NOT NULL,
	"home_club_id" uuid,
	"away_club_id" uuid,
	"home_score" integer,
	"away_score" integer,
	"winner_club_id" uuid,
	"scheduled_at" timestamp with time zone NOT NULL,
	"played_at" timestamp with time zone,
	"status" "fixture_status" DEFAULT 'scheduled' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clubs" ADD COLUMN "board_season_goal" text DEFAULT 'midtable' NOT NULL;--> statement-breakpoint
ALTER TABLE "clubs" ADD COLUMN "board_confidence" integer DEFAULT 60 NOT NULL;--> statement-breakpoint
ALTER TABLE "clubs" ADD COLUMN "active_sponsor_json" text;--> statement-breakpoint
ALTER TABLE "cup_fixtures" ADD CONSTRAINT "cup_fixtures_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cup_fixtures" ADD CONSTRAINT "cup_fixtures_home_club_id_clubs_id_fk" FOREIGN KEY ("home_club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cup_fixtures" ADD CONSTRAINT "cup_fixtures_away_club_id_clubs_id_fk" FOREIGN KEY ("away_club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cup_fixtures" ADD CONSTRAINT "cup_fixtures_winner_club_id_clubs_id_fk" FOREIGN KEY ("winner_club_id") REFERENCES "public"."clubs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cup_league_idx" ON "cup_fixtures" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "cup_season_round_idx" ON "cup_fixtures" USING btree ("season_number","round");