CREATE TABLE "tactic_spies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"league_id" uuid NOT NULL,
	"from_club_id" uuid NOT NULL,
	"target_club_id" uuid NOT NULL,
	"fixture_id" uuid NOT NULL,
	"result_json" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "spies_unique_per_fixture" UNIQUE("from_club_id","fixture_id")
);
--> statement-breakpoint
ALTER TABLE "tactic_spies" ADD CONSTRAINT "tactic_spies_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tactic_spies" ADD CONSTRAINT "tactic_spies_from_club_id_clubs_id_fk" FOREIGN KEY ("from_club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tactic_spies" ADD CONSTRAINT "tactic_spies_target_club_id_clubs_id_fk" FOREIGN KEY ("target_club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tactic_spies" ADD CONSTRAINT "tactic_spies_fixture_id_fixtures_id_fk" FOREIGN KEY ("fixture_id") REFERENCES "public"."fixtures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "spies_league_idx" ON "tactic_spies" USING btree ("league_id");