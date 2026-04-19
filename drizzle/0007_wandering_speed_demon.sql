CREATE TABLE "achievements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"league_id" uuid NOT NULL,
	"club_id" uuid NOT NULL,
	"code" text NOT NULL,
	"payload_json" text DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clubs" ADD COLUMN "sub_plan_json" text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE "transfer_listings" ADD COLUMN "auto_bids_json" text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "achievements_club_idx" ON "achievements" USING btree ("club_id");--> statement-breakpoint
CREATE INDEX "achievements_league_idx" ON "achievements" USING btree ("league_id");