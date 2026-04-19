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

  // No Postgres URL — use pglite. In Vercel build (production without
  // DATABASE_URL) the WASM file path is read-only, so emit a clearer error
  // than a generic mkdir EROFS.
  const isProdRuntime =
    process.env.VERCEL === "1" ||
    (process.env.NODE_ENV as string) === "production";
  if (isProdRuntime) {
    throw new Error(
      "DATABASE_URL is not set. In production set a Postgres URL " +
        "(e.g. Neon connection string) on Vercel project env vars.",
    );
  }

  if (!existsSync(LOCAL_PG_DIR)) mkdirSync(LOCAL_PG_DIR, { recursive: true });
  const client =
    globalForDb.__pglite ??
    new PGlite(LOCAL_PG_DIR);
  if (process.env.NODE_ENV !== "production") {
    globalForDb.__pglite = client;
  }
  return drizzlePglite(client, { schema });
}

// Lazy proxy: createDb() runs on FIRST use, not on module load. This stops
// Vercel build from blowing up while it bundles routes — the build process
// imports lib/db transitively but never executes a DB query.
function makeLazyDb(): DB {
  let real: DB | null = null;
  const get = (): DB => {
    if (real) return real;
    real = createDb();
    if (process.env.NODE_ENV !== "production") globalForDb.__db = real;
    return real;
  };
  return new Proxy({} as DB, {
    get(_t, prop) {
      const target = get() as unknown as Record<string | symbol, unknown>;
      const value = target[prop];
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}

export const db: DB = globalForDb.__db ?? makeLazyDb();

export { schema };
export const isLocalDb = !DATABASE_URL;
