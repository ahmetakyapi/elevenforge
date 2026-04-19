/**
 * Database client with automatic driver selection.
 *
 * - If DATABASE_URL is a valid Postgres URL → uses @neondatabase/serverless
 *   (suitable for Vercel serverless; free Neon tier works fine).
 * - Otherwise → uses @electric-sql/pglite (in-process Postgres via WASM,
 *   file-backed at ./data/pgdata) for local development without credentials.
 *
 * Schema is identical (pg-core) for both drivers — zero drift dev ↔ prod.
 */
import { existsSync, mkdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import ws from "ws";
import * as schema from "./schema";

const DATABASE_URL = process.env.DATABASE_URL;
const LOCAL_PG_DIR = process.env.PGLITE_DIR ?? "./data/pgdata";

type DB =
  | ReturnType<typeof drizzlePglite<typeof schema>>
  | ReturnType<typeof drizzleNeon<typeof schema>>;

const globalForDb = globalThis as unknown as {
  __db?: DB;
  __pglite?: PGlite;
};

function createDb(): DB {
  if (DATABASE_URL && /^postgres(ql)?:\/\//.test(DATABASE_URL)) {
    // Neon serverless (or any Postgres). WebSocket shim needed in Node.
    neonConfig.webSocketConstructor = ws as unknown as typeof WebSocket;
    const pool = new Pool({ connectionString: DATABASE_URL });
    return drizzleNeon(pool, { schema });
  }

  // Local pglite fallback.
  if (!existsSync(LOCAL_PG_DIR)) mkdirSync(LOCAL_PG_DIR, { recursive: true });
  const client =
    globalForDb.__pglite ??
    new PGlite(LOCAL_PG_DIR);
  if (process.env.NODE_ENV !== "production") {
    globalForDb.__pglite = client;
  }
  return drizzlePglite(client, { schema });
}

export const db: DB = globalForDb.__db ?? createDb();
if (process.env.NODE_ENV !== "production") globalForDb.__db = db;

export { schema };
export const isLocalDb = !DATABASE_URL;
