import { and, asc, desc, eq, gte, lt, ne, or } from "drizzle-orm";
import type { MmrHistoryEntry } from "@/lib/deadlock-api/schemas";
import type { DeathPoint, PlayerMatch } from "@/lib/stats/types";
import type { Db } from "./index";
import { apiCache, fetchJobs, playerMatches, players } from "./schema";

// Compile-time check that the table and the domain type stay in sync.
type Row = typeof playerMatches.$inferSelect;
const _rowIsPlayerMatch: (r: Row) => PlayerMatch = (r) => r;
const _playerMatchIsRow: (r: PlayerMatch) => Row = (r) => r;
void _rowIsPlayerMatch;
void _playerMatchIsRow;

const INSERT_CHUNK = 500;

// ---- player matches ----

/** Stores matches. Matches never change once played, so existing rows are left alone. */
export async function savePlayerMatches(db: Db, rows: PlayerMatch[]): Promise<void> {
  for (let i = 0; i < rows.length; i += INSERT_CHUNK) {
    await db
      .insert(playerMatches)
      .values(rows.slice(i, i + INSERT_CHUNK))
      .onConflictDoNothing();
  }
}

/**
 * Stored matches that have deaths but no killer on any of them (the nemesis, ADR 0068): rows
 * saved before killers were recorded, or whose lineup lookup failed. Newest first.
 */
export async function getMatchesMissingKillers(
  db: Db,
  accountId: number,
): Promise<{ matchId: number; deathPositions: DeathPoint[] }[]> {
  const rows = await db
    .select({
      matchId: playerMatches.matchId,
      deathPositions: playerMatches.deathPositions,
    })
    .from(playerMatches)
    .where(eq(playerMatches.accountId, accountId))
    .orderBy(desc(playerMatches.startTime));
  return rows.filter(
    (r) => r.deathPositions.length > 0 && r.deathPositions.every((d) => d.length === 2),
  );
}

/** Rewrites only the death list of stored matches (saves otherwise never change a row). */
export async function updateDeathPositions(
  db: Db,
  accountId: number,
  updates: { matchId: number; deathPositions: DeathPoint[] }[],
): Promise<void> {
  for (const u of updates) {
    await db
      .update(playerMatches)
      .set({ deathPositions: u.deathPositions })
      .where(and(eq(playerMatches.accountId, accountId), eq(playerMatches.matchId, u.matchId)));
  }
}

export async function getKnownMatchIds(db: Db, accountId: number): Promise<Set<number>> {
  const rows = await db
    .select({ matchId: playerMatches.matchId })
    .from(playerMatches)
    .where(eq(playerMatches.accountId, accountId));
  return new Set(rows.map((r) => r.matchId));
}

/** A player's matches, oldest first, optionally only those starting at or after `since`. */
export async function getPlayerMatches(
  db: Db,
  accountId: number,
  { since }: { since?: Date } = {},
): Promise<PlayerMatch[]> {
  return db
    .select()
    .from(playerMatches)
    .where(
      and(
        eq(playerMatches.accountId, accountId),
        since ? gte(playerMatches.startTime, since) : undefined,
      ),
    )
    .orderBy(asc(playerMatches.startTime));
}

// ---- players ----

export interface PlayerProfile {
  accountId: number;
  personaName?: string | null;
  avatarUrl?: string | null;
  profileUrl?: string | null;
}

export async function upsertPlayer(db: Db, profile: PlayerProfile): Promise<void> {
  const { accountId, ...fields } = profile;
  await db
    .insert(players)
    .values(profile)
    .onConflictDoUpdate({ target: players.accountId, set: { ...fields, accountId } });
}

export async function setRankHistory(
  db: Db,
  accountId: number,
  history: MmrHistoryEntry[],
): Promise<void> {
  await db.update(players).set({ rankHistory: history }).where(eq(players.accountId, accountId));
}

export async function markSynced(db: Db, accountId: number, at: Date): Promise<void> {
  await db.update(players).set({ lastSyncedAt: at }).where(eq(players.accountId, accountId));
}

export async function getPlayer(db: Db, accountId: number) {
  const [player] = await db.select().from(players).where(eq(players.accountId, accountId));
  return player ?? null;
}

// ---- fetch job lock (ADR 0026) ----

/**
 * Atomically claims the fetch for a player. Succeeds when no job exists, the last one
 * finished, or the running one has not sent a heartbeat for `staleAfterMs`.
 */
export async function tryAcquireJob(
  db: Db,
  accountId: number,
  now: Date,
  staleAfterMs: number,
): Promise<boolean> {
  const staleBefore = new Date(now.getTime() - staleAfterMs);
  const claimed = await db
    .insert(fetchJobs)
    .values({ accountId, status: "running", startedAt: now, heartbeatAt: now })
    .onConflictDoUpdate({
      target: fetchJobs.accountId,
      set: { status: "running", startedAt: now, heartbeatAt: now, finishedAt: null, error: null },
      setWhere: or(ne(fetchJobs.status, "running"), lt(fetchJobs.heartbeatAt, staleBefore)),
    })
    .returning({ accountId: fetchJobs.accountId });
  return claimed.length === 1;
}

export async function heartbeatJob(db: Db, accountId: number, now: Date): Promise<void> {
  await db
    .update(fetchJobs)
    .set({ heartbeatAt: now })
    .where(and(eq(fetchJobs.accountId, accountId), eq(fetchJobs.status, "running")));
}

export async function finishJob(
  db: Db,
  accountId: number,
  status: "done" | "failed",
  now: Date,
  error?: string,
): Promise<void> {
  await db
    .update(fetchJobs)
    .set({ status, finishedAt: now, heartbeatAt: now, error: error ?? null })
    .where(eq(fetchJobs.accountId, accountId));
}

export async function getJob(db: Db, accountId: number) {
  const [job] = await db.select().from(fetchJobs).where(eq(fetchJobs.accountId, accountId));
  return job ?? null;
}

// ---- API response cache ----

/** A cached value no older than `maxAgeMs` (pass Infinity to accept any age), or null. */
export async function getCached<T>(
  db: Db,
  key: string,
  maxAgeMs: number,
  now: Date,
): Promise<T | null> {
  const [row] = await db
    .select({ data: apiCache.data })
    .from(apiCache)
    .where(
      and(
        eq(apiCache.key, key),
        Number.isFinite(maxAgeMs)
          ? gte(apiCache.fetchedAt, new Date(now.getTime() - maxAgeMs))
          : undefined,
      ),
    );
  return row ? (row.data as T) : null;
}

export async function setCached(db: Db, key: string, data: unknown, now: Date): Promise<void> {
  await db
    .insert(apiCache)
    .values({ key, data, fetchedAt: now })
    .onConflictDoUpdate({ target: apiCache.key, set: { data, fetchedAt: now } });
}
