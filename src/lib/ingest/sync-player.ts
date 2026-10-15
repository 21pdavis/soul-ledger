import type { Db } from "@/db";
import * as repo from "@/db/repository";
import type { DeadlockApi } from "@/lib/deadlock-api/client";
import { normalizePlayerMatch, tagKillers } from "@/lib/stats/normalize";

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
/** Matches per lineup request: one bulk-limiter use each (the client's chunk size). */
const LINEUP_CHUNK = 500;

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
    const batchStatus = {
      type: "status",
      step: "batch",
      fetched: i,
      total: missing.length,
    } as const;
    onEvent(batchStatus);
    let waited = false;
    const rows = (
      await api.getBulkMetadata(accountId, batch, {
        onWait: (waitMs) => {
          waited = true;
          onEvent({ type: "status", step: "rate_limited", waitMs });
        },
        // The wait is over and the request is going out: drop the "waiting" note.
        onStart: () => {
          if (waited) onEvent(batchStatus);
          waited = false;
        },
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
  await tagKillersInStoredMatches(accountId, db, api, onEvent, now);

  // Rank history only feeds one slide, so its failure should not sink the whole lookup.
  try {
    await repo.setRankHistory(db, accountId, await api.getMmrHistory(accountId));
  } catch {
    // Keep whatever rank history we had.
  }

  onEvent({ type: "done", matchCount: known.size + saved });
}

/**
 * Records which enemy hero killed the player in each stored death (the nemesis, ADR 0068).
 * It covers the matches just saved and any stored earlier without killers, one lineup request
 * per 500 matches inside the bulk rate limit, writing and heartbeating after each chunk so a later
 * chunk's failure keeps the earlier work. It is garnish, so a failure logs a warning and
 * leaves those rows as they were: the next sync tries again. It never fails the sync.
 */
async function tagKillersInStoredMatches(
  accountId: number,
  db: Db,
  api: DeadlockApi,
  onEvent: (event: SyncEvent) => void,
  now: () => Date,
): Promise<void> {
  const untagged = await repo.getMatchesMissingKillers(db, accountId);
  for (let i = 0; i < untagged.length; i += LINEUP_CHUNK) {
    const chunk = untagged.slice(i, i + LINEUP_CHUNK);
    try {
      const lineups = await api.getLineups(
        accountId,
        chunk.map((m) => m.matchId),
        {
          onWait: (waitMs) => onEvent({ type: "status", step: "rate_limited", waitMs }),
          onStart: () => onEvent({ type: "status", step: "finishing" }),
        },
      );
      const byMatch = new Map(lineups.map((l) => [l.match_id, l]));
      const updates = chunk.flatMap((m) => {
        const lineup = byMatch.get(m.matchId);
        const deathPositions = lineup && tagKillers(m.deathPositions, accountId, lineup);
        return deathPositions ? [{ matchId: m.matchId, deathPositions }] : [];
      });
      await repo.updateDeathPositions(db, accountId, updates);
      await repo.heartbeatJob(db, accountId, now());
    } catch (err) {
      console.warn(`Could not record killers for player ${accountId}: ${errorMessage(err)}`);
    }
  }
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
