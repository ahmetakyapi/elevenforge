-- Two-tier league: Süper Lig (division 1) and 1. Lig (division 2).
--
-- Until now every club sat in one flat table and the board goal "Küme
-- düşmemek" (avoid relegation) was unenforceable — there was nowhere to be
-- relegated TO, so the bottom clubs were told to survive a drop that could
-- never happen. Division 2 gives that goal teeth, and gives a knocked-down
-- club a way back.
--
-- Existing clubs are all top flight.
ALTER TABLE "clubs" ADD COLUMN IF NOT EXISTS "division" integer DEFAULT 1 NOT NULL;
--> statement-breakpoint

-- Fixtures belong to a division: the two tiers play separate calendars on the
-- same match days.
ALTER TABLE "fixtures" ADD COLUMN IF NOT EXISTS "division" integer DEFAULT 1 NOT NULL;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "clubs_division_idx" ON "clubs" ("league_id", "division");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fixtures_division_idx" ON "fixtures" ("league_id", "season_number", "division");
--> statement-breakpoint

-- Season history records which division the finish was in, so a 1st place in
-- the second tier is not confused with winning the league.
ALTER TABLE "season_history" ADD COLUMN IF NOT EXISTS "division" integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
ALTER TABLE "season_history" ADD COLUMN IF NOT EXISTS "promoted" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "season_history" ADD COLUMN IF NOT EXISTS "relegated" boolean DEFAULT false NOT NULL;
