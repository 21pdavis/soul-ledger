// Deletes expired share links from DATABASE_URL. Run weekly by a Render Cron Job
// (`pnpm cleanup:shares`, wiki/recommendations/m4-plan.md, ADR 0079). Exits non-zero on failure.
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../src/db/schema";
import { cleanupSharedStories } from "../src/lib/share/cleanup";

config({ path: [".env.local", ".env"] });

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  const pool = new Pool({ connectionString });
  try {
    const { message } = await cleanupSharedStories(drizzle(pool, { schema }), new Date());
    console.log(message);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
