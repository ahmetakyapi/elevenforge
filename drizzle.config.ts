import type { Config } from "drizzle-kit";

const url =
  process.env.DATABASE_URL ??
  // placeholder URL for drizzle-kit generate (doesn't actually connect)
  "postgres://local:local@localhost:5432/elevenforge";

export default {
  schema: "./lib/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
} satisfies Config;
