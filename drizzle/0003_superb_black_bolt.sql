ALTER TABLE "fixtures" ADD COLUMN "rng_seed" bigint;--> statement-breakpoint
ALTER TABLE "leagues" ADD COLUMN "commissioner_only_advance" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "current_league_id" uuid;--> statement-breakpoint
CREATE INDEX "users_current_league_idx" ON "users" USING btree ("current_league_id");