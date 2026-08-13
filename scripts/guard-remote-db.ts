/**
 * Refuse to run a destructive script against a remote database.
 *
 * `.env.local` now carries the production Neon URL so migrations can be
 * driven from here. That convenience makes every other db script dangerous
 * by default: `npm run db:seed` would insert a second demo league into the
 * live database, and `test-full-season.ts` would simulate two full seasons
 * over real users' leagues.
 *
 * So anything that writes game data calls this first. Migrations deliberately
 * do NOT — applying them to production is the whole point.
 *
 * Override with ALLOW_REMOTE_WRITES=1 when you genuinely mean it.
 */
const LOCAL_HOST_PATTERN = /^(localhost|127\.0\.0\.1|::1|0\.0\.0\.0)$/;

export function assertLocalDatabase(action: string): void {
  const url = process.env.DATABASE_URL;
  // No URL at all → pglite file in ./data. Always safe.
  if (!url || !/^postgres(ql)?:\/\//.test(url)) return;

  if (process.env.ALLOW_REMOTE_WRITES === "1") {
    console.warn(
      `⚠️  ${action} is running against a REMOTE database because ` +
        `ALLOW_REMOTE_WRITES=1 is set.`,
    );
    return;
  }

  let host = "(unparseable)";
  try {
    host = new URL(url).hostname;
  } catch {
    /* keep the placeholder */
  }
  if (LOCAL_HOST_PATTERN.test(host)) return;

  console.error(
    `\n✖ Refusing to run "${action}" against remote host ${host}.\n\n` +
      `  DATABASE_URL in your environment points at a real database — very ` +
      `likely production.\n  This script writes game data and would corrupt ` +
      `live leagues.\n\n` +
      `  To target the local pglite database instead:\n` +
      `    DATABASE_URL= npm run <script>\n\n` +
      `  If you really do mean to write to ${host}:\n` +
      `    ALLOW_REMOTE_WRITES=1 npm run <script>\n`,
  );
  process.exit(1);
}
