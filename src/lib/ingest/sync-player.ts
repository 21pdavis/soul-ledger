import type { Db } from "@/db";
import * as repo from "@/db/repository";
import type { DeadlockApi } from "@/lib/deadlock-api/client";
import { normalizePlayerMatch } from "@/lib/stats/normalize";

/** Progress events that drive the staged loading screen (ADR 0014). */
export type SyncEvent =
  | { type: "waiting" }
  /** What the server is doing right now, so the loader never sits silent. */
  | {
      type: "status";
      step: "contacting" | "batch" | "rate_limited" | "finishing";
      /** batch: matches read so far. */
      fetched?: number;
      /** batch: matches to read in all. */
      total?: number;
      /** rate_limited: how long the request waits for a free slot. */
      waitMs?: number;
    }
  | {
      type: "profile";
      accountId: number;
      personaName: string | null;
      avatarUrl: string | null;
    }
  | { type: "history"; totalMatches: number; newMatches: number; heroIds: number[] }
  | {
      type: "details";
      fetched: number;
      total: number;
      kills: number;
      breakables: number;
      sinnerJackpots: number;
    }
  | { type: "done"; matchCount: number };

/** "synced": this call fetched; "joined": another call fetched; "fresh": cache was recent. */
export type SyncResult = "synced" | "joined" | "fresh";

export interface SyncOptions {
  db: Db;
  api: DeadlockApi;
  onEvent?: (event: SyncEvent) => void;
  now?: () => Date;
  /** Skip the API when the last sync is younger than this. */
  minResyncMs?: number;
  /** Ignore the freshness check (the refresh button). */
  force?: boolean;
  /** A running job with no heartbeat for this long is presumed dead. */
  staleAfterMs?: number;
  pollMs?: number;
}

/** match_mode values in match-history that count as real games: 1 Unranked, 4 Ranked. */
const MATCHMAKING_MODES = new Set([1, 4]);

/** Matches per bulk request: small enough that the loading counters tick visibly. */
const DETAILS_BATCH = 100;

/**
 * Brings our cached copy of a player's matches up to date (ADR 0001), fetching only matches we
 * do not have. A job row in Postgres makes concurrent lookups of one player share a single
 * fetch (ADR 0026).
 */
export async function syncPlayer(accountId: number, options: SyncOptions): Promise<SyncResult> {
  const {
    db,
    onEvent = () => {},
    now = () => new Date(),
    minResyncMs = 5 * 60_000,
    force = false,
    staleAfterMs = 2 * 60_000,
    pollMs = 500,
  } = options;

  if (!force) {
    const player = await repo.getPlayer(db, accountId);
    if (player?.lastSyncedAt && now().getTime() - player.lastSyncedAt.getTime() < minResyncMs) {
      return "fresh";
    }
  }

  if (!(await repo.tryAcquireJob(db, accountId, now(), staleAfterMs))) {
    onEvent({ type: "waiting" });
    for (;;) {
      await new Promise((resolve) => setTimeout(resolve, pollMs));
      const job = await repo.getJob(db, accountId);
      if (job?.status === "done") return "joined";
      if (job?.status === "failed") throw new Error(`Fetch failed: ${job.error ?? "unknown"}`);
      // The other fetch died without finishing: take over.
      if (await repo.tryAcquireJob(db, accountId, now(), staleAfterMs)) break;
    }
  }

  try {
    await fetchAndStore(accountId, { ...options, onEvent, now });
    await repo.markSynced(db, accountId, now());
    await repo.finishJob(db, accountId, "done", now());
    return "synced";
  } catch (err) {
    await repo.finishJob(db, accountId, "failed", now(), errorMessage(err));
    throw err;
  }
}

async function fetchAndStore(
  accountId: number,
  { db, api, onEvent, now }: SyncOptions & Required<Pick<SyncOptions, "onEvent" | "now">>,
): Promise<void> {
  onEvent({ type: "status", step: "contacting" });
  // The two calls do not depend on each other, so they run side by side.
  const historyRequest = api.getMatchHistory(accountId);
  historyRequest.catch(() => {}); // a failure is raised where it is awaited below
  const profile = await api.getSteamProfile(accountId);
  await repo.upsertPlayer(db, {
    accountId,
    personaName: profile?.personaname ?? null,
    avatarUrl: profile?.avatarfull ?? null,
    profileUrl: profile?.profileurl ?? null,
  });
  onEvent({
    type: "profile",
    accountId,
    personaName: profile?.personaname ?? null,
    avatarUrl: profile?.avatarfull ?? null,
  });

  const history = (await historyRequest).filter((m) => MATCHMAKING_MODES.has(m.match_mode));
  const known = await repo.getKnownMatchIds(db, accountId);
  const missing = history.filter((m) => !known.has(m.match_id)).map((m) => m.match_id);
  onEvent({
    type: "history",
    totalMatches: history.length,
    newMatches: missing.length,
    heroIds: [...new Set(history.map((m) => m.hero_id))],
  });

  const counters = { kills: 0, breakables: 0, sinnerJackpots: 0 };
  let saved = 0;
  for (let i = 0; i < missing.length; i += DETAILS_BATCH) {
    const batch = missing.slice(i, i + DETAILS_BATCH);
    onEvent({ type: "status", step: "batch", fetched: i, total: missing.length });
    const rows = (
      await api.getBulkMetadata(accountId, batch, {
        onWait: (waitMs) => onEvent({ type: "status", step: "rate_limited", waitMs }),
      })
    ).map((m) => normalizePlayerMatch(m, accountId));
    await repo.savePlayerMatches(db, rows);
    saved += rows.length;
    await repo.heartbeatJob(db, accountId, now());
    for (const r of rows) {
      counters.kills += r.kills;
      counters.breakables += r.breakables;
      counters.sinnerJackpots += r.sinnerJackpots;
    }
    onEvent({
      type: "details",
      fetched: Math.min(i + DETAILS_BATCH, missing.length),
      total: missing.length,
      ...counters,
    });
  }

  onEvent({ type: "status", step: "finishing" });

  // Rank history only feeds one slide, so its failure should not sink the whole lookup.
  try {
    await repo.setRankHistory(db, accountId, await api.getMmrHistory(accountId));
  } catch {
    // Keep whatever rank history we had.
  }

  onEvent({ type: "done", matchCount: known.size + saved });
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
