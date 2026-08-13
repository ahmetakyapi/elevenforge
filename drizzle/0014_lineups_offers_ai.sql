-- Wave 2-4 schema: persisted line-ups, transfer negotiation, AI managers and
-- season history.

-- ── Persisted starting XI ────────────────────────────────────────────
-- Until now the engine re-picked the eleven by `overall` on every match, so
-- arranging a squad in the UI changed nothing. This column is the manager's
-- actual team sheet: { "xi": [playerId × 11], "bench": [playerId × N] }.
ALTER TABLE "clubs" ADD COLUMN IF NOT EXISTS "lineup_json" text DEFAULT '{"xi":[],"bench":[]}' NOT NULL;
--> statement-breakpoint

-- Snapshot of the eleven each side actually fielded, written at kick-off.
-- Makes a finished match replayable and reportable without re-deriving it
-- from squad rows that have since changed.
ALTER TABLE "fixtures" ADD COLUMN IF NOT EXISTS "lineups_json" text;
--> statement-breakpoint

-- ── AI manager state ─────────────────────────────────────────────────
-- Per-club personality + bookkeeping so bot clubs behave consistently
-- (an aggressive spender stays an aggressive spender) and so the AI tick is
-- idempotent within a day.
ALTER TABLE "clubs" ADD COLUMN IF NOT EXISTS "ai_profile_json" text;
--> statement-breakpoint
ALTER TABLE "clubs" ADD COLUMN IF NOT EXISTS "ai_last_run_at" timestamp with time zone;
--> statement-breakpoint

-- A human club whose manager stopped logging in gets played by the AI.
ALTER TABLE "clubs" ADD COLUMN IF NOT EXISTS "ai_managed" boolean DEFAULT false NOT NULL;
--> statement-breakpoint

-- ── Transfer offers ──────────────────────────────────────────────────
-- Direct bids for players who are NOT on the transfer list, in both
-- directions: human → bot, bot → human, human → human.
CREATE TYPE "offer_status" AS ENUM ('pending', 'accepted', 'rejected', 'countered', 'withdrawn', 'expired');
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "transfer_offers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "league_id" uuid NOT NULL REFERENCES "leagues"("id") ON DELETE CASCADE,
  "player_id" uuid NOT NULL REFERENCES "players"("id") ON DELETE CASCADE,
  "from_club_id" uuid NOT NULL REFERENCES "clubs"("id") ON DELETE CASCADE,
  "to_club_id" uuid NOT NULL REFERENCES "clubs"("id") ON DELETE CASCADE,
  "amount_cents" bigint NOT NULL,
  -- Set when the receiving club counters: the price they would accept.
  "counter_cents" bigint,
  "status" "offer_status" DEFAULT 'pending' NOT NULL,
  "message" text,
  "responded_at" timestamp with time zone,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "offers_to_club_idx" ON "transfer_offers" ("to_club_id", "status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "offers_from_club_idx" ON "transfer_offers" ("from_club_id", "status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "offers_league_idx" ON "transfer_offers" ("league_id", "status");
--> statement-breakpoint
-- One live offer per (bidder, player) so a club cannot spam the same target.
CREATE UNIQUE INDEX IF NOT EXISTS "offers_one_pending_per_target"
  ON "transfer_offers" ("from_club_id", "player_id") WHERE "status" = 'pending';
--> statement-breakpoint

-- ── Season history ───────────────────────────────────────────────────
-- The season roll used to reset every per-club tally in place, destroying the
-- record of what happened. This is the archive the standings/profile pages
-- read for past seasons.
CREATE TABLE IF NOT EXISTS "season_history" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "league_id" uuid NOT NULL REFERENCES "leagues"("id") ON DELETE CASCADE,
  "season_number" integer NOT NULL,
  "club_id" uuid NOT NULL REFERENCES "clubs"("id") ON DELETE CASCADE,
  "position" integer NOT NULL,
  "points" integer NOT NULL,
  "wins" integer NOT NULL,
  "draws" integer NOT NULL,
  "losses" integer NOT NULL,
  "goals_for" integer NOT NULL,
  "goals_against" integer NOT NULL,
  "won_cup" boolean DEFAULT false NOT NULL,
  -- { name, goals } of the club's leading scorer that season.
  "top_scorer_json" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "season_history_unique"
  ON "season_history" ("league_id", "season_number", "club_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "season_history_league_idx" ON "season_history" ("league_id", "season_number");
--> statement-breakpoint

-- ── Player career totals ─────────────────────────────────────────────
-- goalsSeason/assistsSeason are zeroed at every roll; these accumulate.
ALTER TABLE "players" ADD COLUMN IF NOT EXISTS "career_goals" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN IF NOT EXISTS "career_assists" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN IF NOT EXISTS "career_apps" integer DEFAULT 0 NOT NULL;
