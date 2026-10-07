import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "@/db";
import * as repo from "@/db/repository";
import { syncPlayer, type SyncEvent } from "@/lib/ingest/sync-player";
import { createTestDb } from "../helpers/db";
import { fakeApi } from "../helpers/fake-api";
import { TEST_ACCOUNT_ID } from "../helpers/fixtures";

let db: Db;
let close: () => Promise<void>;

beforeEach(async () => {
  ({ db, close } = await createTestDb());
});
afterEach(() => close());

/** A controllable clock so "five minutes later" needs no waiting. */
function clock(start = "2026-10-07T00:00:00Z") {
  let t = new Date(start).getTime();
  return {
    now: () => new Date(t),
    advance: (ms: number) => {
      t += ms;
    },
  };
}

describe("syncPlayer", () => {
  it("fetches and stores a new player's whole history, reporting each stage", async () => {
    const { api, state } = fakeApi();
    const events: SyncEvent[] = [];

    const result = await syncPlayer(TEST_ACCOUNT_ID, { db, api, onEvent: (e) => events.push(e) });

    expect(result).toBe("synced");
    expect(await repo.getKnownMatchIds(db, TEST_ACCOUNT_ID)).toHaveProperty("size", 352);
    expect(await repo.getPlayer(db, TEST_ACCOUNT_ID)).toMatchObject({
      personaName: "Pol",
      rankHistory: expect.arrayContaining([expect.objectContaining({ rank: expect.any(Number) })]),
      lastSyncedAt: expect.any(Date),
    });
    expect(state.calls.bulk.flat()).toHaveLength(352);

    const types = events.map((e) => e.type);
    expect(types[0]).toBe("profile");
    expect(types[1]).toBe("history");
    expect(types.at(-1)).toBe("done");
    expect(types.filter((t) => t === "details").length).toBeGreaterThan(1);

    expect(events[0]).toMatchObject({ personaName: "Pol" });
    expect(events[1]).toMatchObject({ totalMatches: 352, newMatches: 352 });
    const lastDetails = events.filter((e) => e.type === "details").at(-1);
    expect(lastDetails).toMatchObject({ fetched: 352, total: 352 });
    expect(lastDetails && "kills" in lastDetails && lastDetails.kills).toBeGreaterThan(0);
    expect(await repo.getJob(db, TEST_ACCOUNT_ID)).toMatchObject({ status: "done" });
  });

  it("skips the API entirely when the player was synced moments ago", async () => {
    const { api, state } = fakeApi();
    const c = clock();
    await syncPlayer(TEST_ACCOUNT_ID, { db, api, now: c.now });
    c.advance(60_000);

    const result = await syncPlayer(TEST_ACCOUNT_ID, { db, api, now: c.now });

    expect(result).toBe("fresh");
    expect(state.calls.history).toBe(1);
  });

  it("fetches only matches it does not have yet", async () => {
    const { api, state } = fakeApi();
    const c = clock();
    const newest = state.history[0];
    state.history = state.history.slice(1);
    await syncPlayer(TEST_ACCOUNT_ID, { db, api, now: c.now });

    state.history = [newest, ...state.history];
    state.calls.bulk = [];
    c.advance(10 * 60_000);
    await syncPlayer(TEST_ACCOUNT_ID, { db, api, now: c.now });

    expect(state.calls.bulk).toEqual([[newest.match_id]]);
    expect(await repo.getKnownMatchIds(db, TEST_ACCOUNT_ID)).toHaveProperty("size", 352);
  });

  it("makes no bulk request when nothing is new", async () => {
    const { api, state } = fakeApi();
    const c = clock();
    await syncPlayer(TEST_ACCOUNT_ID, { db, api, now: c.now });
    state.calls.bulk = [];
    c.advance(10 * 60_000);
    await syncPlayer(TEST_ACCOUNT_ID, { db, api, now: c.now });
    expect(state.calls.bulk).toEqual([]);
  });

  it("ignores bot, private-lobby and other non-matchmaking games in the history", async () => {
    const { api, state } = fakeApi();
    state.history = [{ ...state.history[0], match_id: 1, match_mode: 3 }, ...state.history];
    await syncPlayer(TEST_ACCOUNT_ID, { db, api });
    expect(state.calls.bulk.flat()).not.toContain(1);
  });

  it("refetches everything when forced, even if recently synced", async () => {
    const { api, state } = fakeApi();
    await syncPlayer(TEST_ACCOUNT_ID, { db, api });
    const result = await syncPlayer(TEST_ACCOUNT_ID, { db, api, force: true });
    expect(result).toBe("synced");
    expect(state.calls.history).toBe(2);
  });

  it("shares one fetch between simultaneous lookups of the same player", async () => {
    const { api, state } = fakeApi();
    const events: SyncEvent[] = [];
    const results = await Promise.all([
      syncPlayer(TEST_ACCOUNT_ID, { db, api, pollMs: 5 }),
      syncPlayer(TEST_ACCOUNT_ID, { db, api, pollMs: 5, onEvent: (e) => events.push(e) }),
    ]);
    expect(results.sort()).toEqual(["joined", "synced"]);
    expect(state.calls.history).toBe(1);
    expect(state.calls.bulk.flat()).toHaveLength(352);
  });

  it("tells a waiting caller it is waiting", async () => {
    const { api } = fakeApi();
    const c = clock();
    await repo.tryAcquireJob(db, TEST_ACCOUNT_ID, c.now(), 120_000);
    const events: SyncEvent[] = [];

    const pending = syncPlayer(TEST_ACCOUNT_ID, {
      db,
      api,
      now: c.now,
      pollMs: 5,
      onEvent: (e) => events.push(e),
    });
    await new Promise((r) => setTimeout(r, 30));
    await repo.finishJob(db, TEST_ACCOUNT_ID, "done", c.now());

    await expect(pending).resolves.toBe("joined");
    expect(events[0]).toEqual({ type: "waiting" });
  });

  it("marks the job failed and rethrows when the API fails, then allows a retry", async () => {
    const { api, state } = fakeApi();
    state.failWith = new Error("deadlock-api is down");

    await expect(syncPlayer(TEST_ACCOUNT_ID, { db, api })).rejects.toThrow("deadlock-api is down");
    expect(await repo.getJob(db, TEST_ACCOUNT_ID)).toMatchObject({
      status: "failed",
      error: "deadlock-api is down",
    });

    state.failWith = null;
    await expect(syncPlayer(TEST_ACCOUNT_ID, { db, api })).resolves.toBe("synced");
  });

  it("keeps the matches when only the rank history fails", async () => {
    const { api } = fakeApi();
    api.getMmrHistory = async () => {
      throw new Error("mmr down");
    };
    await expect(syncPlayer(TEST_ACCOUNT_ID, { db, api })).resolves.toBe("synced");
    expect(await repo.getKnownMatchIds(db, TEST_ACCOUNT_ID)).toHaveProperty("size", 352);
  });

  it("reports a failure seen while waiting on another caller's fetch", async () => {
    const { api } = fakeApi();
    const c = clock();
    await repo.tryAcquireJob(db, TEST_ACCOUNT_ID, c.now(), 120_000);
    const pending = syncPlayer(TEST_ACCOUNT_ID, { db, api, now: c.now, pollMs: 5 });
    await new Promise((r) => setTimeout(r, 20));
    await repo.finishJob(db, TEST_ACCOUNT_ID, "failed", c.now(), "boom");
    await expect(pending).rejects.toThrow(/boom/);
  });
});
