import type { DeadlockApi } from "@/lib/deadlock-api/client";
import {
  bulkMatch,
  matchHistoryEntry,
  mmrHistoryEntry,
  patchEntry,
  statMetrics,
  steamProfile,
  type BulkMatch,
  type MatchHistoryEntry,
} from "@/lib/deadlock-api/schemas";
import { fixtureJson } from "./fixtures";

export const fixtureMatches = (): BulkMatch[] =>
  bulkMatch.array().parse(fixtureJson("api/bulk-metadata.json"));
export const fixtureHistory = (): MatchHistoryEntry[] =>
  matchHistoryEntry.array().parse(fixtureJson("api/match-history.json"));

/**
 * An in-memory deadlock-api backed by the recorded fixtures. `history` and `matches` can be
 * edited between calls to simulate new games; `calls` records what was asked for.
 */
export function fakeApi() {
  const state = {
    history: fixtureHistory(),
    matches: new Map(fixtureMatches().map((m) => [m.match_id, m])),
    failWith: null as Error | null,
    calls: {
      history: 0,
      bulk: [] as number[][],
      profile: 0,
      mmr: 0,
      metrics: [] as unknown[],
      patches: 0,
    },
    metricsFailWith: null as Error | null,
  };

  const guard = () => {
    if (state.failWith) throw state.failWith;
  };

  const api: DeadlockApi = {
    async getMatchHistory() {
      guard();
      state.calls.history++;
      return state.history;
    },
    async getBulkMetadata(_accountId, matchIds) {
      guard();
      state.calls.bulk.push(matchIds);
      return matchIds.flatMap((id) => state.matches.get(id) ?? []);
    },
    async getSteamProfile() {
      guard();
      state.calls.profile++;
      return steamProfile.array().parse(fixtureJson("api/steam-profile.json"))[0];
    },
    async getMmrHistory() {
      guard();
      state.calls.mmr++;
      return mmrHistoryEntry.array().parse(fixtureJson("api/mmr-history.json"));
    },
    async getPlayerStatsMetrics(options) {
      guard();
      if (state.metricsFailWith) throw state.metricsFailWith;
      state.calls.metrics.push(options);
      return statMetrics.parse(fixtureJson("api/metrics-global.json"));
    },
    async getPatches() {
      guard();
      state.calls.patches++;
      return patchEntry.array().parse(fixtureJson("api/patches.json"));
    },
  };

  return { api, state };
}
