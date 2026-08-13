-- Every bot club is AI-managed from now on. Existing leagues are backfilled
-- so their bots start behaving on the next tick instead of only new leagues.
UPDATE "clubs" SET "ai_managed" = true WHERE "is_bot" = true;
--> statement-breakpoint

-- A human club that has lost its owner (owner_user_id went null) also needs
-- somebody to run it.
UPDATE "clubs" SET "ai_managed" = true WHERE "owner_user_id" IS NULL;
