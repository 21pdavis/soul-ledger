import { z } from "zod";
import { RateLimiter, type ScheduleOptions } from "./rate-limiter";
import {
  bulkMatch,
  matchLineup,
  type MatchLineup,
  matchHistoryEntry,
  mmrHistoryEntry,
  patchEntry,
  statMetrics,
  steamProfile,
  type BulkMatch,
  type MatchHistoryEntry,
  type MmrHistoryEntry,
  type PatchEntry,
  type StatMetrics,
  type SteamProfile,
} from "./schemas";

export class DeadlockApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "DeadlockApiError";
  }
}

export interface Limiters {
  /** /v1/matches/metadata: 30 req/min per IP. */
  bulk: RateLimiter;
  /** /v1/analytics/*: 200 req/min per IP, shared. */
  analytics: RateLimiter;
  /** Everything else (player, steam, assets endpoints): 100 req/s per IP. */
  general: RateLimiter;
}

/**
 * Process-wide limiters, set below the published per-IP limits
 * (wiki/research/deadlock-api.md) to leave headroom.
 */
export const defaultLimiters: Limiters = {
  bulk: new RateLimiter({ maxRequests: 25, perMs: 60_000 }),
  analytics: new RateLimiter({ maxRequests: 150, perMs: 60_000 }),
  general: new RateLimiter({ maxRequests: 50, perMs: 1_000 }),
};

const BULK_CHUNK = 500;

interface ClientOptions {
  fetch?: typeof fetch;
  limiters?: Limiters;
  baseUrl?: string;
  timeoutMs?: number;
}

type Params = Record<string, string | number | boolean | undefined>;

export type DeadlockApi = ReturnType<typeof createDeadlockApi>;

export function createDeadlockApi({
  fetch: fetchImpl = fetch,
  limiters = defaultLimiters,
  baseUrl = "https://api.deadlock-api.com",
  timeoutMs = 60_000,
}: ClientOptions = {}) {
  async function get<T>(
    limiter: RateLimiter,
    path: string,
    params: Params,
    schema: z.ZodType<T>,
    hooks: ScheduleOptions = {},
  ): Promise<T> {
    const url = new URL(path, baseUrl);
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }

    const res = await limiter
      .schedule(() => fetchImpl(url, { signal: AbortSignal.timeout(timeoutMs) }), hooks)
      .catch((cause: unknown) => {
        throw new DeadlockApiError(`Request to ${path} failed`, undefined, { cause });
      });
    if (!res.ok) throw new DeadlockApiError(`${path} returned ${res.status}`, res.status);

    const parsed = schema.safeParse(await res.json());
    if (!parsed.success) {
      throw new DeadlockApiError(`${path} returned an unexpected shape`, res.status, {
        cause: parsed.error,
      });
    }
    return parsed.data;
  }

  return {
    getMatchHistory(accountId: number): Promise<MatchHistoryEntry[]> {
      return get(
        limiters.general,
        `/v1/players/${accountId}/match-history`,
        {},
        z.array(matchHistoryEntry),
      );
    },

    /** One player's full data in the given matches, chunked to keep URLs short. */
    async getBulkMetadata(
      accountId: number,
      matchIds: number[],
      hooks: ScheduleOptions = {},
    ): Promise<BulkMatch[]> {
      const out: BulkMatch[] = [];
      for (let i = 0; i < matchIds.length; i += BULK_CHUNK) {
        const chunk = matchIds.slice(i, i + BULK_CHUNK);
        const matches = await get(
          limiters.bulk,
          "/v1/matches/metadata",
          {
            match_ids: chunk.join(","),
            account_ids: accountId,
            only_filtered_players: true,
            include_player_info: true,
            include_player_final_stats: true,
            include_player_death_details: true,
            include_mid_boss: true,
            limit: chunk.length,
          },
          z.array(bulkMatch),
          hooks,
        );
        out.push(...matches);
      }
      return out;
    },

    /**
     * Every player's slot, hero and team in the given matches. A killer's `killer_player_slot`
     * needs this to become a hero (the nemesis, ADR 0068). `include_player_info=false` with the
     * death-details flag returns just those slim player records for all twelve players.
     */
    async getLineups(
      accountId: number,
      matchIds: number[],
      hooks: ScheduleOptions = {},
    ): Promise<MatchLineup[]> {
      const out: MatchLineup[] = [];
      for (let i = 0; i < matchIds.length; i += BULK_CHUNK) {
        const chunk = matchIds.slice(i, i + BULK_CHUNK);
        const matches = await get(
          limiters.bulk,
          "/v1/matches/metadata",
          {
            match_ids: chunk.join(","),
            account_ids: accountId,
            only_filtered_players: false,
            include_player_info: false,
            include_player_death_details: true,
            limit: chunk.length,
          },
          z.array(matchLineup),
          hooks,
        );
        out.push(...matches);
      }
      return out;
    },

    getPlayerStatsMetrics(
      options: { heroIds?: number[]; minUnixTimestamp?: number } = {},
    ): Promise<StatMetrics> {
      return get(
        limiters.analytics,
        "/v1/analytics/player-stats/metrics",
        { hero_ids: options.heroIds?.join(","), min_unix_timestamp: options.minUnixTimestamp },
        statMetrics,
      );
    },

    async getSteamProfile(accountId: number): Promise<SteamProfile | null> {
      const profiles = await get(
        limiters.general,
        "/v1/players/steam",
        { account_ids: accountId },
        z.array(steamProfile),
      );
      return profiles.find((p) => p.account_id === accountId) ?? null;
    },

    getMmrHistory(accountId: number): Promise<MmrHistoryEntry[]> {
      return get(
        limiters.general,
        `/v1/players/${accountId}/mmr-history`,
        {},
        z.array(mmrHistoryEntry),
      );
    },

    getPatches(): Promise<PatchEntry[]> {
      return get(limiters.general, "/v1/patches", {}, z.array(patchEntry));
    },
  };
}
