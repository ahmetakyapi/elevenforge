-- Economy rebalance (see lib/economy.ts for the measurements behind it).
--
-- Clubs held ~€45M against squads worth ~€1.3B while losing about €6M every
-- week, so every club was bankrupt inside one season and no club could ever
-- afford a transfer. Lift existing balances onto the new scale rather than
-- leaving live leagues stranded on the old one.
ALTER TABLE "clubs" ALTER COLUMN "balance_cents" SET DEFAULT 25000000000;
--> statement-breakpoint

UPDATE "clubs" SET "balance_cents" = "balance_cents" * 5
WHERE "balance_cents" < 10000000000;
