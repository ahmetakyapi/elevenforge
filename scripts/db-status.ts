// Must be first: populates process.env from .env.local before anything
// reads it at module load time.
import "./load-env";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

/**
 * Read-only health check for whichever database DATABASE_URL points at.
 *
 * Safe to run against production — it only SELECTs. Use it before and after
 * `npm run db:migrate` to confirm what actually landed.
 *
 *   npm run db:status                 # .env.local target (production)
 *   DATABASE_URL= npm run db:status   # local pglite
 */
async function main() {
  const url = process.env.DATABASE_URL;
  if (!url || !/^postgres(ql)?:\/\//.test(url)) {
    console.log("DATABASE_URL not set → local pglite at ./data/pgdata");
    console.log("Run with the production URL to inspect Neon.");
    return;
  }
  neonConfig.webSocketConstructor = ws as unknown as typeof WebSocket;
  const pool = new Pool({ connectionString: url });
  const q = async (sql: string) => (await pool.query(sql)).rows;

  console.log(`host: ${new URL(url).hostname}\n`);

  const applied = await q(
    `select count(*)::int as c from drizzle.__drizzle_migrations`,
  );
  console.log(`migrations applied: ${applied[0].c}`);

  for (const t of [
    "users", "leagues", "clubs", "players", "fixtures",
    "transfer_listings", "transfer_offers", "season_history",
  ]) {
    const exists = await q(
      `select 1 from information_schema.tables where table_schema='public' and table_name='${t}'`,
    );
    if (exists.length === 0) {
      console.log(`  ${t.padEnd(20)} — table missing`);
      continue;
    }
    const [{ c }] = await q(`select count(*)::int as c from "${t}"`);
    console.log(`  ${t.padEnd(20)} ${c}`);
  }

  const [bal] = await q(
    `select min(balance_cents)::bigint as lo, max(balance_cents)::bigint as hi,
            count(*) filter (where ai_managed)::int as ai, count(*)::int as total
     from clubs`,
  );
  const m = (v: string) => `€${(Number(v) / 100 / 1e6).toFixed(1)}M`;
  console.log(`\nclub balances: ${m(bal.lo)} .. ${m(bal.hi)}`);
  console.log(`AI-managed clubs: ${bal.ai}/${bal.total}`);

  await pool.end();
}

main().catch((e) => {
  console.error("ERR:", e.message);
  process.exit(1);
});
