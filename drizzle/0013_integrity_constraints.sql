-- Integrity constraints that make the multiplayer races impossible at the
-- database level rather than only in application code.
--
-- Note: no CHECK on clubs.balance_cents. A club going into the red is a
-- legitimate game state (the weekly wage bill can outrun income); it is only
-- *voluntary spending* that must be refused, and that is enforced by the
-- `WHERE balance_cents >= amount` guard in lib/money.ts.

-- Clean up any pre-existing duplicate active listings before the unique index
-- goes on, keeping the earliest listing for each player.
UPDATE transfer_listings SET status = 'withdrawn'
WHERE status = 'active'
  AND id NOT IN (
    SELECT DISTINCT ON (player_id) id
    FROM transfer_listings
    WHERE status = 'active'
    ORDER BY player_id, listed_at ASC
  );
--> statement-breakpoint

-- A player may appear in at most one active listing. This is what stops the
-- "list the same player five times and get paid five times" exploit.
CREATE UNIQUE INDEX IF NOT EXISTS "listings_one_active_per_player"
  ON "transfer_listings" ("player_id") WHERE "status" = 'active';
--> statement-breakpoint

-- One club per user per league. Bot clubs have owner_user_id NULL and are
-- excluded, so any number of them can coexist.
CREATE UNIQUE INDEX IF NOT EXISTS "clubs_one_per_owner_per_league"
  ON "clubs" ("league_id", "owner_user_id") WHERE "owner_user_id" IS NOT NULL;
--> statement-breakpoint

-- The match-day cron scans for scheduled fixtures that are due; without this
-- it is a sequential scan of every fixture ever played.
CREATE INDEX IF NOT EXISTS "fixtures_due_idx"
  ON "fixtures" ("status", "scheduled_at");
--> statement-breakpoint

-- Standings, dashboards and the newspaper all filter by season then week.
CREATE INDEX IF NOT EXISTS "fixtures_league_season_week_idx"
  ON "fixtures" ("league_id", "season_number", "week_number");
--> statement-breakpoint

-- Transfer history is read per league, newest first.
CREATE INDEX IF NOT EXISTS "history_league_completed_idx"
  ON "transfer_history" ("league_id", "completed_at");
--> statement-breakpoint

-- Free-agent listing and the AI manager both scan for unattached players.
CREATE INDEX IF NOT EXISTS "players_free_agents_idx"
  ON "players" ("league_id") WHERE "club_id" IS NULL;
--> statement-breakpoint

-- Scout returns are polled every 15 minutes by status + due time.
CREATE INDEX IF NOT EXISTS "scouts_due_idx"
  ON "scouts" ("status", "returns_at");
--> statement-breakpoint

-- users.current_league_id had no foreign key, so deleting a league left every
-- member pointing at a row that no longer exists.
ALTER TABLE "users"
  ADD CONSTRAINT "users_current_league_id_fk"
  FOREIGN KEY ("current_league_id") REFERENCES "leagues"("id") ON DELETE SET NULL;
