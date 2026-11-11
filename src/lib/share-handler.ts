import { createHash } from "node:crypto";
import { z } from "zod";
import type { Db } from "@/db";
import * as repo from "@/db/repository";
import type { DeadlockApi } from "@/lib/deadlock-api/client";
import type { StoryData } from "@/story/types";
import { clientIp, type IpRateLimiter } from "./ip-rate-limit";
import { buildStoryEvent } from "./lookup";
import { buildSlug, randomSlugPart } from "./share/slug";
import type { SharedSnapshot } from "./share/types";

const body = z.object({
  accountId: z.number().int().positive(),
  window: z.enum(["all", "patch"]),
});

export interface ShareDeps {
  db: Db;
  now?: () => Date;
}

export interface ShareLimits {
  /** Per-IP limiter, separate from the lookup one; no limiting when absent. */
  limiter?: IpRateLimiter;
  /** Requests this accepts skip the limiter. */
  exempt?: (request: Request) => boolean;
}

const MAX_SLUG_TRIES = 5;
const noStore = { "cache-control": "no-store" };

/** The share API never syncs: this stands in for deadlock-api so only cached data is used. */
const offlineApi = new Proxy({} as DeadlockApi, {
  get: () => () => Promise.reject(new Error("offline")),
});

/** Stable JSON: object keys sorted, so the same story always hashes the same. */
function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([k, v]) => `${JSON.stringify(k)}:${stableJson(v)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

/**
 * Builds the POST handler for /api/share (ADR 0079). The story is rebuilt from our own cached
 * data, never taken from the client, so nobody can forge numbers under a real name.
 */
export function createShareHandler(deps: () => ShareDeps, limits: ShareLimits = {}) {
  return async function POST(request: Request): Promise<Response> {
    // Before any database work (ADR 0076).
    if (limits.limiter && !limits.exempt?.(request)) {
      const decision = limits.limiter.check(clientIp(request));
      if (!decision.allowed) {
        const retryAfter = decision.retryAfterSeconds;
        return Response.json(
          { error: "rate_limited", retryAfter },
          { status: 429, headers: { "retry-after": String(retryAfter), ...noStore } },
        );
      }
    }

    const parsed = body.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return Response.json({ error: "bad_request" }, { status: 400 });
    const { accountId, window } = parsed.data;

    try {
      const { db, now: clock = () => new Date() } = deps();
      const now = clock();
      const event = await buildStoryEvent({ db, api: offlineApi, now: clock }, accountId, window);
      if (event.story.matchCount === 0) {
        return Response.json({ error: "not_found" }, { status: 404, headers: noStore });
      }

      // Dates travel as ISO strings, as in the stored snapshot.
      const story = JSON.parse(JSON.stringify(event.story)) as StoryData;
      const snapshot: SharedSnapshot = {
        version: 1,
        sharedAt: now.toISOString(),
        player: event.player,
        meta: {
          window: event.window,
          patchStart: event.patchStart?.toISOString() ?? null,
          patchUnavailable: event.patchUnavailable,
        },
        story,
      };
      const contentHash = createHash("sha256")
        .update(stableJson({ accountId, window, player: event.player, story }))
        .digest("hex");

      let row = await repo.findLiveSharedStoryByHash(db, accountId, contentHash, now);
      for (let i = 0; !row; i++) {
        try {
          row = await repo.createSharedStory(db, {
            slug: buildSlug(event.player.personaName, randomSlugPart()),
            accountId,
            contentHash,
            snapshot,
            now,
          });
        } catch (err) {
          if (i + 1 >= MAX_SLUG_TRIES) throw err;
        }
      }
      return Response.json(
        { slug: row.slug, path: `/w/${row.slug}`, expiresAt: row.expiresAt.toISOString() },
        { headers: noStore },
      );
    } catch (err) {
      console.error("share failed", err);
      return Response.json({ error: "unavailable" }, { status: 503, headers: noStore });
    }
  };
}
