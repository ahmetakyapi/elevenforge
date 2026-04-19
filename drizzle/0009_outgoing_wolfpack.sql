CREATE TABLE "press_conferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"league_id" uuid NOT NULL,
	"club_id" uuid NOT NULL,
	"week" integer NOT NULL,
	"season" integer NOT NULL,
	"prompt_code" text NOT NULL,
	"answer_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"answered_at" timestamp with time zone,
	CONSTRAINT "press_unique_per_week" UNIQUE("club_id","season","week")
);
--> statement-breakpoint
ALTER TABLE "press_conferences" ADD CONSTRAINT "press_conferences_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "press_conferences" ADD CONSTRAINT "press_conferences_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "press_club_idx" ON "press_conferences" USING btree ("club_id");