CREATE TYPE "ledger_kind" AS ENUM (
	'match_income', 'sponsor', 'prize', 'interest', 'wages', 'staff',
	'facility', 'scout', 'transfer_in', 'transfer_out', 'transfer_refund',
	'free_agent_fee', 'contract_renewal', 'other'
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "club_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"league_id" uuid NOT NULL REFERENCES "leagues"("id") ON DELETE cascade,
	"club_id" uuid NOT NULL REFERENCES "clubs"("id") ON DELETE cascade,
	"kind" "ledger_kind" NOT NULL,
	"amount_cents" bigint NOT NULL,
	"balance_after_cents" bigint NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ledger_club_idx" ON "club_ledger" ("club_id","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ledger_league_idx" ON "club_ledger" ("league_id","created_at");
