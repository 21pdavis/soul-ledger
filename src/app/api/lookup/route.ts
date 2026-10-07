import { getDb } from "@/db";
import { createDeadlockApi } from "@/lib/deadlock-api/client";
import { createLookupHandler } from "@/lib/lookup-handler";

const api = createDeadlockApi();

/** GET /api/lookup?q=<steam url or id>&window=all|patch&refresh=1 streams NDJSON events. */
export const GET = createLookupHandler(() => ({
  db: getDb(),
  api,
  steamApiKey: process.env.STEAM_API_KEY,
}));
