import type { Db } from "@/db";
import * as repo from "@/db/repository";
import type { DeadlockApi } from "@/lib/deadlock-api/client";
import type { PatchEntry, StatMetrics } from "@/lib/deadlock-api/schemas";
import { syncPlayer, type SyncEvent } from "@/lib/ingest/sync-player";
import { currentPatchStart } from "@/lib/patches";
import { computeStory, countedMatches, rankHeroes, type Story } from "@/lib/stats/story";
import { resolveSteamInput } from "@/lib/steam/resolve";

/** deadlock-api caches these for 6 h itself, so refetching sooner gains nothing. */
const SHARED_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

export type StoryWindow = "all" | "patch";

export type LookupEvent =
  | { type: "resolved"; accountId: number }
  | SyncEvent
  | {
      type: "story";
      player: { accountId: number; personaName: string | null; avatarUrl: string | null };
      window: StoryWindow;
      patchStart: Date | null;
      /** True when a refresh failed and this story comes from older cached matches. */
      stale: boolean;
      story: Story;
    }
  | { type: "error"; reason: "invalid" | "not_found" | "unavailable" | "fetch_failed" };

export interface LookupRequest {
  input: string;
  window: StoryWindow;
  /** The refresh button: fetch even if the player was synced moments ago. */
  refresh: boolean;
}

export interface LookupDeps {
  db: Db;
  api: DeadlockApi;
  /** Used for resolving Steam vanity URLs. */
  fetch?: typeof fetch;
  now?: () => Date;
  pollMs?: number;
}

/**
 * The whole lookup: resolve the pasted identifier, bring the cache up to date, then build the
 * story. Every step is reported through `emit` so the loading screen can show it.
 */
export async function runLookup(
  request: LookupRequest,
  deps: LookupDeps,
  emit: (event: LookupEvent) => void,
): Promise<void> {
  const { db, api, now = () => new Date() } = deps;

  const resolved = await resolveSteamInput(request.input, { fetch: deps.fetch });
  if (!resolved.ok) return emit({ type: "error", reason: resolved.reason });
  const { accountId } = resolved;
  emit({ type: "resolved", accountId });

  let stale = false;
  try {
    await syncPlayer(accountId, {
      db,
      api,
      now,
      force: request.refresh,
      pollMs: deps.pollMs,
      onEvent: emit,
    });
  } catch {
    // Fall back to whatever we cached on an earlier visit, if anything.
    if ((await repo.getKnownMatchIds(db, accountId)).size === 0) {
      return emit({ type: "error", reason: "fetch_failed" });
    }
    stale = true;
  }

  const patchStart = request.window === "patch" ? await getPatchStart(deps, now) : null;
  const matches = await repo.getPlayerMatches(db, accountId, {
    since: patchStart ?? undefined,
  });
  const mainHeroId = rankHeroes(countedMatches(matches))[0]?.heroId;

  const [globalMetrics, mainHeroMetrics] = await Promise.all([
    getMetrics(deps, now),
    mainHeroId === undefined ? Promise.resolve({}) : getMetrics(deps, now, mainHeroId),
  ]);
  const player = await repo.getPlayer(db, accountId);

  emit({
    type: "story",
    player: {
      accountId,
      personaName: player?.personaName ?? null,
      avatarUrl: player?.avatarUrl ?? null,
    },
    window: request.window,
    patchStart,
    stale,
    story: computeStory({
      matches,
      rankHistory: player?.rankHistory ?? [],
      globalMetrics,
      mainHeroMetrics,
    }),
  });
}

/**
 * Reads a shared (not per-player) API response through the Postgres cache. When the API fails,
 * an expired copy beats nothing; with no copy at all, `fallback` is returned.
 */
async function cachedShared<T>(
  { db }: LookupDeps,
  now: () => Date,
  key: string,
  load: () => Promise<T>,
  fallback: T,
): Promise<T> {
  const fresh = await repo.getCached<T>(db, key, SHARED_CACHE_TTL_MS, now());
  if (fresh !== null) return fresh;
  try {
    const data = await load();
    await repo.setCached(db, key, data, now());
    return data;
  } catch {
    return (await repo.getCached<T>(db, key, Number.POSITIVE_INFINITY, now())) ?? fallback;
  }
}

function getMetrics(deps: LookupDeps, now: () => Date, heroId?: number): Promise<StatMetrics> {
  return cachedShared(
    deps,
    now,
    heroId === undefined ? "metrics:global" : `metrics:hero:${heroId}`,
    () => deps.api.getPlayerStatsMetrics(heroId === undefined ? {} : { heroIds: [heroId] }),
    {},
  );
}

async function getPatchStart(deps: LookupDeps, now: () => Date): Promise<Date | null> {
  const patches = await cachedShared<PatchEntry[]>(
    deps,
    now,
    "patches",
    () => deps.api.getPatches(),
    [],
  );
  return currentPatchStart(patches);
}
