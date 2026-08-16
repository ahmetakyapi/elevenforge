-- Four new tactic dials. Default 2 = neutral, so every existing club keeps
-- playing exactly as it did until its manager touches the screen.
ALTER TABLE "clubs" ADD COLUMN IF NOT EXISTS "def_line" integer NOT NULL DEFAULT 2;
--> statement-breakpoint
ALTER TABLE "clubs" ADD COLUMN IF NOT EXISTS "passing_style" integer NOT NULL DEFAULT 2;
--> statement-breakpoint
ALTER TABLE "clubs" ADD COLUMN IF NOT EXISTS "width" integer NOT NULL DEFAULT 2;
--> statement-breakpoint
ALTER TABLE "clubs" ADD COLUMN IF NOT EXISTS "aggression" integer NOT NULL DEFAULT 2;
--> statement-breakpoint
-- The dials are read straight into the engine, so anything outside 0-4 would
-- be a silent multiplier on team strength rather than a rejected write.
ALTER TABLE "clubs" DROP CONSTRAINT IF EXISTS "clubs_tactic_dials_range";
--> statement-breakpoint
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_tactic_dials_range" CHECK (
  "def_line" BETWEEN 0 AND 4
  AND "passing_style" BETWEEN 0 AND 4
  AND "width" BETWEEN 0 AND 4
  AND "aggression" BETWEEN 0 AND 4
);
--> statement-breakpoint
-- Everything the newspaper carries below the fold.
ALTER TABLE "newspapers" ADD COLUMN IF NOT EXISTS "sections_json" text NOT NULL DEFAULT '{}';
