import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "@/db";
import * as repo from "@/db/repository";
import { bulkMatch } from "@/lib/deadlock-api/schemas";
import { normalizePlayerMatch } from "@/lib/stats/normalize";
import { createTestDb } from "../helpers/db";
import { fixtureJson, TEST_ACCOUNT_ID } from "../helpers/fixtures";

const rows = bulkMatch
  .array()
  .parse(fixtureJson("api/bulk-metadata.json"))
  .map((m) => normalizePlayerMatch(m, TEST_ACCOUNT_ID));

let db: Db;
let close: () => Promise<void>;

beforeEach(async () => {
  ({ db, close } = await createTestDb());
});
afterEach(() => close());

describe("player matches", () => {
  it("round-trips normalized rows unchanged", async () => {
    await repo.savePlayerMatches(db, rows.slice(0, 5));
    const stored = await repo.getPlayerMatches(db, TEST_ACCOUNT_ID);
    expect(stored).toHaveLength(5);
    const byId = new Map(stored.map((r) => [r.matchId, r]));
    for (const row of rows.slice(0, 5)) expect(byId.get(row.matchId)).toEqual(row);
  });

  it("ignores matches it already has", async () => {
    await repo.savePlayerMatches(db, rows.slice(0, 3));
    await repo.savePlayerMatches(db, rows.slice(0, 4));
    expect(await repo.getPlayerMatches(db, TEST_ACCOUNT_ID)).toHaveLength(4);
  });

  it("saves the whole recorded history in one go", async () => {
    await repo.savePlayerMatches(db, rows);
    expect(await repo.getKnownMatchIds(db, TEST_ACCOUNT_ID)).toEqual(
      new Set(rows.map((r) => r.matchId)),
    );
  });

  it("accepts no rows", async () => {
    await expect(repo.savePlayerMatches(db, [])).resolves.toBeUndefined();
  });

  it("filters by start time", async () => {
    await repo.savePlayerMatches(db, rows);
    const since = new Date("2026-09-29T00:00:00Z");
    const recent = await repo.getPlayerMatches(db, TEST_ACCOUNT_ID, { since });
    expect(recent.length).toBeGreaterThan(0);
    expect(recent.length).toBeLessThan(rows.length);
    expect(recent.every((r) => r.startTime >= since)).toBe(true);
  });

  it("keeps account ids above 2^31", async () => {
    const big = 4_000_000_000;
    await repo.savePlayerMatches(db, [{ ...rows[0], accountId: big }]);
    expect(await repo.getKnownMatchIds(db, big)).toEqual(new Set([rows[0].matchId]));
  });
});

describe("players", () => {
  it("upserts the profile and keeps rank history", async () => {
    await repo.upsertPlayer(db, { accountId: TEST_ACCOUNT_ID, personaName: "Old" });
    await repo.upsertPlayer(db, {
      accountId: TEST_ACCOUNT_ID,
      personaName: "Pol",
      avatarUrl: "https://example.com/a.jpg",
    });
    await repo.setRankHistory(db, TEST_ACCOUNT_ID, [
      { match_id: 1, start_time: 2, rank: 81, division: 8, division_tier: 1 },
    ]);
    const player = await repo.getPlayer(db, TEST_ACCOUNT_ID);
    expect(player).toMatchObject({
      personaName: "Pol",
      avatarUrl: "https://example.com/a.jpg",
      rankHistory: [{ rank: 81 }],
      lastSyncedAt: null,
    });
  });

  it("records when a player was last synced", async () => {
    await repo.upsertPlayer(db, { accountId: TEST_ACCOUNT_ID, personaName: "Pol" });
    const at = new Date("2026-10-06T12:00:00Z");
    await repo.markSynced(db, TEST_ACCOUNT_ID, at);
    expect((await repo.getPlayer(db, TEST_ACCOUNT_ID))?.lastSyncedAt).toEqual(at);
  });

  it("returns null for an unknown player", async () => {
    await expect(repo.getPlayer(db, 42)).resolves.toBeNull();
  });
});

describe("fetch job lock", () => {
  const t0 = new Date("2026-10-06T12:00:00Z");
  const later = (ms: number) => new Date(t0.getTime() + ms);
  const STALE = 120_000;

  it("lets one fetch in and holds off a second", async () => {
    expect(await repo.tryAcquireJob(db, TEST_ACCOUNT_ID, t0, STALE)).toBe(true);
    expect(await repo.tryAcquireJob(db, TEST_ACCOUNT_ID, later(1000), STALE)).toBe(false);
    expect(await repo.getJob(db, TEST_ACCOUNT_ID)).toMatchObject({ status: "running" });
  });

  it("only one of many simultaneous callers wins", async () => {
    const results = await Promise.all(
      Array.from({ length: 5 }, () => repo.tryAcquireJob(db, TEST_ACCOUNT_ID, t0, STALE)),
    );
    expect(results.filter(Boolean)).toHaveLength(1);
  });

  it("can be taken again once finished", async () => {
    await repo.tryAcquireJob(db, TEST_ACCOUNT_ID, t0, STALE);
    await repo.finishJob(db, TEST_ACCOUNT_ID, "done", later(10));
    expect(await repo.getJob(db, TEST_ACCOUNT_ID)).toMatchObject({ status: "done" });
    expect(await repo.tryAcquireJob(db, TEST_ACCOUNT_ID, later(20), STALE)).toBe(true);
  });

  it("records a failure message", async () => {
    await repo.tryAcquireJob(db, TEST_ACCOUNT_ID, t0, STALE);
    await repo.finishJob(db, TEST_ACCOUNT_ID, "failed", later(10), "API down");
    expect(await repo.getJob(db, TEST_ACCOUNT_ID)).toMatchObject({
      status: "failed",
      error: "API down",
    });
  });

  it("takes over a job whose heartbeat went stale", async () => {
    await repo.tryAcquireJob(db, TEST_ACCOUNT_ID, t0, STALE);
    expect(await repo.tryAcquireJob(db, TEST_ACCOUNT_ID, later(STALE - 1), STALE)).toBe(false);
    expect(await repo.tryAcquireJob(db, TEST_ACCOUNT_ID, later(STALE + 1), STALE)).toBe(true);
  });

  it("a heartbeat keeps the job alive", async () => {
    await repo.tryAcquireJob(db, TEST_ACCOUNT_ID, t0, STALE);
    await repo.heartbeatJob(db, TEST_ACCOUNT_ID, later(STALE - 1));
    expect(await repo.tryAcquireJob(db, TEST_ACCOUNT_ID, later(STALE + 1), STALE)).toBe(false);
  });
});

describe("api cache", () => {
  const t0 = new Date("2026-10-06T12:00:00Z");

  it("returns fresh entries and drops stale ones", async () => {
    await repo.setCached(db, "metrics:global", { a: 1 }, t0);
    expect(await repo.getCached(db, "metrics:global", 1000, new Date(t0.getTime() + 999))).toEqual({
      a: 1,
    });
    expect(
      await repo.getCached(db, "metrics:global", 1000, new Date(t0.getTime() + 1001)),
    ).toBeNull();
  });

  it("overwrites an existing key", async () => {
    await repo.setCached(db, "k", { v: 1 }, t0);
    await repo.setCached(db, "k", { v: 2 }, t0);
    expect(await repo.getCached(db, "k", 1000, t0)).toEqual({ v: 2 });
  });

  it("returns an entry of any age when asked for Infinity", async () => {
    await repo.setCached(db, "k", { v: 1 }, t0);
    const muchLater = new Date(t0.getTime() + 365 * 24 * 60 * 60 * 1000);
    expect(await repo.getCached(db, "k", Number.POSITIVE_INFINITY, muchLater)).toEqual({ v: 1 });
  });

  it("misses unknown keys", async () => {
    expect(await repo.getCached(db, "nope", 1000, t0)).toBeNull();
  });
});
