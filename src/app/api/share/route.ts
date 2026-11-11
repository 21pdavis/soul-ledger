import { getDb } from "@/db";
import { createIpRateLimiter } from "@/lib/ip-rate-limit";
import { createShareHandler } from "@/lib/share-handler";
import { hasValidStagingToken } from "@/lib/staging-gate";

// Its own limiter, so sharing and looking up don't eat each other's allowance (ADR 0076).
const limiter = createIpRateLimiter();

/**
 * POST /api/share { accountId, window } makes (or reuses) a share link for a player's cached
 * story (ADR 0079). Limited per client IP; staging-token holders are exempt, as for lookups.
 */
export const POST = createShareHandler(() => ({ db: getDb() }), {
  limiter,
  exempt: (request) => hasValidStagingToken(request, process.env),
});
