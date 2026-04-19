/**
 * Apply drizzle migrations.
 *
 * - If DATABASE_URL is a Postgres URL → runs against that DB (Neon etc).
 * - Otherwise → runs against local pglite file at ./data/pgdata.
 *
 * Usage: `npm run db:migrate`
 */
import { existsSync, mkdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { migrate as migrateNeon } from "drizzle-orm/neon-serverless/migrator";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import ws from "ws";

const DATABASE_URL = process.env.DATABASE_URL;
const MIGRATIONS_FOLDER = "./drizzle";
const LOCAL_PG_DIR = process.env.PGLITE_DIR ?? "./data/pgdata";

async function run() {
  if (DATABASE_URL && /^postgres(ql)?:\/\//.test(DATABASE_URL)) {
    console.log("→ Running migrations against Neon/Postgres…");
    neonConfig.webSocketConstructor = ws as unknown as typeof WebSocket;
    const pool = new Pool({ connectionString: DATABASE_URL });
    const db = drizzleNeon(pool);
    await migrateNeon(db, { migrationsFolder: MIGRATIONS_FOLDER });
    await pool.end();
    console.log("✓ Neon migrations applied.");
    return;
  }

  console.log(`→ Running migrations against local pglite (${LOCAL_PG_DIR})…`);
  if (!existsSync(LOCAL_PG_DIR)) mkdirSync(LOCAL_PG_DIR, { recursive: true });
  const client = new PGlite(LOCAL_PG_DIR);
  const db = drizzlePglite(client);
  await migratePglite(db, { migrationsFolder: MIGRATIONS_FOLDER });
  await client.close();
  console.log("✓ Local pglite migrations applied.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
