ALTER TABLE "players" ADD COLUMN "loan_owner_club_id" uuid;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "loan_returns_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_loan_owner_club_id_clubs_id_fk" FOREIGN KEY ("loan_owner_club_id") REFERENCES "public"."clubs"("id") ON DELETE set null ON UPDATE no action;