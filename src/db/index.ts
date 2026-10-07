import { drizzle } from "drizzle-orm/node-postgres";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { Pool } from "pg";
import * as schema from "./schema";

/** Any Drizzle Postgres database with our schema: node-postgres in the app, PGlite in tests. */
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

let db: Db | undefined;

/** The app's shared connection pool to Neon, created on first use from DATABASE_URL. */
export function getDb(): Db {
  if (!db) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL is not set");
    db = drizzle(new Pool({ connectionString, max: 5 }), { schema });
  }
  return db;
}
