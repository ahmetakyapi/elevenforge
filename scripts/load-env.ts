/**
 * Load .env.local / .env for standalone scripts.
 *
 * Next.js loads these automatically for `next dev` and `next build`, but the
 * scripts in this folder run under plain tsx, which does not. Without this,
 * `npm run db:migrate` silently ignored the DATABASE_URL in .env.local and
 * migrated the local pglite file instead of production — the failure mode
 * being that everything reports success while nothing reached the real
 * database.
 *
 * Import this FIRST in any script entry point, before modules that read
 * process.env at load time.
 *
 * Precedence: a variable already set in the environment always wins, so
 * `DATABASE_URL= npm run db:seed` still forces the local database.
 */
import { existsSync, readFileSync } from "node:fs";

/** Files are read in order; earlier files win. */
const ENV_FILES = [".env.local", ".env"] as const;

function parse(contents: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const rawLine of contents.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    if (!key) continue;
    let value = line.slice(eq + 1).trim();
    // Strip one layer of matching quotes.
    if (
      (value.startsWith('"') && value.endsWith('"') && value.length > 1) ||
      (value.startsWith("'") && value.endsWith("'") && value.length > 1)
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

for (const file of ENV_FILES) {
  if (!existsSync(file)) continue;
  const vars = parse(readFileSync(file, "utf8"));
  for (const [key, value] of Object.entries(vars)) {
    // An explicitly-set variable (including an explicit empty string) wins.
    if (key in process.env) continue;
    process.env[key] = value;
  }
}
