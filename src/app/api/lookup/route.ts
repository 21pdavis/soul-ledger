import { getDb } from "@/db";
import { createDeadlockApi } from "@/lib/deadlock-api/client";
import { createIpRateLimiter } from "@/lib/ip-rate-limit";
import { createLookupHandler } from "@/lib/lookup-handler";
import { hasValidStagingToken } from "@/lib/staging-gate";

const api = createDeadlockApi();
const limiter = createIpRateLimiter();

/**
 * GET /api/lookup?q=<steam url or id>&window=all|patch&refresh=1 streams NDJSON events. Limited
 * per client IP (ADR 0075); callers holding the staging access key are exempt, so the staging
 * e2e suites can run many lookups. That key only exists on the gated staging site.
 */
export const GET = createLookupHandler(
  () => ({
    db: getDb(),
    api,
    steamApiKey: process.env.STEAM_API_KEY,
  }),
  { limiter, exempt: (request) => hasValidStagingToken(request, process.env) },
);
