-- Leagues need a timezone, not just an "HH:MM" match time.
--
-- Fixture scheduling used Date.setHours(), which resolves against the SERVER's
-- timezone — UTC on Vercel. A Turkish league that chose 21:00 had its fixtures
-- written for 21:00 UTC, i.e. midnight local, on the following calendar day.
-- Existing leagues are all Turkish, so Europe/Istanbul is the right backfill.
ALTER TABLE "leagues" ADD COLUMN IF NOT EXISTS "time_zone" text DEFAULT 'Europe/Istanbul' NOT NULL;
