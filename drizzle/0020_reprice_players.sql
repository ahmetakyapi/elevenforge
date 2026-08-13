-- Re-price players that carry the flat fallback values.
--
-- lib/squad-packs.ts is generated, and the generator did not emit `val` or
-- `wage`. create-league.ts and seed.ts read those with fallbacks of €1M and
-- €100K/week, so every player in every existing league was worth exactly €1M
-- on identical wages. That flattens the entire economy: the transfer market,
-- the AI's valuations, free-agent fees, listing bands and the squad-value
-- readout all price off market value.
--
-- The generator now emits both. This repairs leagues created before that.
--
-- Only rows carrying BOTH fallbacks are touched — that pairing is the
-- signature of the bug. Youth intake and scouted players price themselves and
-- are left alone.
UPDATE "players" SET
  "market_value_cents" = GREATEST(
    300000,
    ROUND(
      POWER(GREATEST(0, "overall" - 55)::numeric, 2.6) * 22000
        * (1 + GREATEST(0, "potential" - "overall") * 0.08)
        * (CASE WHEN "age" <= 24 THEN 1.2 WHEN "age" >= 31 THEN 0.7 ELSE 1.0 END)
    )
  )::bigint * 100
WHERE "market_value_cents" = 100000000
  AND "wage_cents" = 10000000;
--> statement-breakpoint

-- Wages follow value on the same curve the generator uses (value ÷ 200/week).
UPDATE "players" SET
  "wage_cents" = GREATEST(12000, ROUND("market_value_cents" / 100.0 / 200))::bigint * 100
WHERE "wage_cents" = 10000000
  AND "market_value_cents" <> 100000000;
