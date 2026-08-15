CREATE TYPE "bid_status" AS ENUM ('active', 'won', 'lost', 'withdrawn', 'expired', 'failed');
--> statement-breakpoint
ALTER TABLE "transfer_listings" ADD COLUMN IF NOT EXISTS "bids_close_at" timestamp with time zone;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transfer_bids" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"league_id" uuid NOT NULL REFERENCES "leagues"("id") ON DELETE cascade,
	"listing_id" uuid NOT NULL REFERENCES "transfer_listings"("id") ON DELETE cascade,
	"bidder_club_id" uuid NOT NULL REFERENCES "clubs"("id") ON DELETE cascade,
	"amount_cents" bigint NOT NULL,
	"status" "bid_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- One LIVE bid per club per listing: raising a bid updates the row instead of
-- stacking a second one, so "highest bid" is never ambiguous. Partial, so a
-- club may bid again on a listing where its previous bid already lost.
CREATE UNIQUE INDEX IF NOT EXISTS "bids_one_active_per_club_per_listing"
	ON "transfer_bids" ("listing_id", "bidder_club_id") WHERE "status" = 'active';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bids_listing_idx" ON "transfer_bids" ("listing_id","status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bids_bidder_idx" ON "transfer_bids" ("bidder_club_id","status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bids_league_idx" ON "transfer_bids" ("league_id","status");
