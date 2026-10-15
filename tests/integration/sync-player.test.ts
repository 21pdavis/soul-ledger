import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Db } from "@/db";
import * as repo from "@/db/repository";
import { syncPlayer, type SyncEvent } from "@/lib/ingest/sync-player";
import { computeStory } from "@/lib/stats/story";
import { createTestDb } from "../helpers/db";
import { fakeApi, fixtureLineups } from "../helpers/fake-api";
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

    // Status events (sync-status.test.ts) are asides; this test follows the stages.
    const result = await syncPlayer(TEST_ACCOUNT_ID, {
      db,
      api,
      onEvent: (e) => e.type !== "status" && events.push(e),
    });

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

describe("syncPlayer nemesis data (ADR 0068)", () => {
  const storyOf = async () =>
    computeStory({
      matches: await repo.getPlayerMatches(db, TEST_ACCOUNT_ID),
      rankHistory: [],
      globalMetrics: {},
      mainHeroMetrics: {},
    });
  const tagged = async () =>
    (await repo.getPlayerMatches(db, TEST_ACCOUNT_ID))
      .flatMap((r) => r.deathPositions)
      .filter((d) => d.length === 3).length;
  /** Only the six matches with recorded lineups, so every death can be tagged. */
  const onlyLineupMatches = (state: ReturnType<typeof fakeApi>["state"]) => {
    const ids = new Set(fixtureLineups().map((l) => l.match_id));
    state.history = state.history.filter((m) => ids.has(m.match_id));
  };

  it("stores who killed the player, so the story can name a nemesis", async () => {
    const { api, state } = fakeApi();
    onlyLineupMatches(state);
    await syncPlayer(TEST_ACCOUNT_ID, { db, api });
    // Heroes 4, 20, 64 and 67 tie on 3 kills; the lowest id wins.
    expect((await storyOf()).nemesis).toEqual({ heroId: 4, kills: 3 });
  });

  it("still saves every match when the killer lookup fails", async () => {
    const { api, state } = fakeApi();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    state.lineupsFailWith = new Error("lineups down");

    await expect(syncPlayer(TEST_ACCOUNT_ID, { db, api })).resolves.toBe("synced");

    const rows = await repo.getPlayerMatches(db, TEST_ACCOUNT_ID);
    expect(rows).toHaveLength(352);
    expect(await tagged()).toBe(0);
  });

  it("logs a warning when the killer lookup fails, so an outage shows in the logs", async () => {
    const { api, state } = fakeApi();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    state.lineupsFailWith = new Error("lineups down");
    await syncPlayer(TEST_ACCOUNT_ID, { db, api });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("lineups down"));
  });

  it("backfills matches stored without killers on a later refresh (the reviewer's probe)", async () => {
    const { api, state } = fakeApi();
    onlyLineupMatches(state);
    vi.spyOn(console, "warn").mockImplementation(() => {});
    state.lineupsFailWith = new Error("lineups down");
    await syncPlayer(TEST_ACCOUNT_ID, { db, api });
    expect((await storyOf()).nemesis).toBeNull();

    state.lineupsFailWith = null;
    await syncPlayer(TEST_ACCOUNT_ID, { db, api, force: true });

    expect(state.calls.bulk).toHaveLength(1); // the six matches were not read again
    expect((await storyOf()).nemesis).toEqual({ heroId: 4, kills: 3 });
  });

  it("fetches lineups per 500 matches, not per 100, and tells the loader when it waits", async () => {
    const { api, state } = fakeApi();
    const events: SyncEvent[] = [];
    const getLineups = api.getLineups;
    api.getLineups = async (id, ids, hooks) => {
      hooks?.onWait?.(1500);
      hooks?.onStart?.();
      return getLineups(id, ids, hooks);
    };
    await syncPlayer(TEST_ACCOUNT_ID, { db, api, onEvent: (e) => events.push(e) });

    expect(state.calls.lineups).toHaveLength(1);
    expect(state.calls.lineups[0].length).toBeGreaterThan(300);
    expect(events).toContainEqual({ type: "status", step: "rate_limited", waitMs: 1500 });
  });

  it("asks again only about matches that still lack killers", async () => {
    const { api, state } = fakeApi();
    await syncPlayer(TEST_ACCOUNT_ID, { db, api });
    const first = state.calls.lineups[0];
    await syncPlayer(TEST_ACCOUNT_ID, { db, api, force: true });
    const again = state.calls.lineups[1];
    expect(again.length).toBeLessThan(first.length);
    expect(again).not.toContain(110497230); // already tagged
  });

  it("does not ask again about a match whose killers were read but none was an enemy", async () => {
    const { api, state } = fakeApi();
    onlyLineupMatches(state);
    const getLineups = api.getLineups;
    api.getLineups = async (id, ids, hooks) =>
      (await getLineups(id, ids, hooks)).map((l) => ({
        ...l,
        players: l.players.map((p) => ({
          ...p,
          death_details: p.death_details.map(() => ({ killer_player_slot: null })),
        })),
      }));
    await syncPlayer(TEST_ACCOUNT_ID, { db, api });
    await syncPlayer(TEST_ACCOUNT_ID, { db, api, force: true });
    await syncPlayer(TEST_ACCOUNT_ID, { db, api, force: true });
    expect(state.calls.lineups).toHaveLength(1);
  });

  it("keeps earlier chunks' killers and heartbeats per chunk when a later chunk fails", async () => {
    const { api, state } = fakeApi();
    onlyLineupMatches(state);
    vi.spyOn(console, "warn").mockImplementation(() => {});
    // 600 filler matches, older than the six real ones, so the real ones are in chunk one.
    const template = state.history[0];
    for (let i = 0; i < 600; i++) {
      const id = 900_000_000 + i;
      state.history.push({ ...template, match_id: id, start_time: 1_000_000 + i });
      state.matches.set(id, {
        ...state.matches.get(template.match_id)!,
        match_id: id,
        start_time: "2000-01-01 00:00:00",
      });
    }
    let calls = 0;
    let beatsAtSecondChunk = 0;
    const beat = vi.spyOn(repo, "heartbeatJob");
    const getLineups = api.getLineups;
    api.getLineups = async (id, ids, hooks) => {
      if (++calls === 1) return getLineups(id, ids, hooks);
      beatsAtSecondChunk = beat.mock.calls.length;
      throw new Error("second chunk down");
    };
    const beatsBeforeTagging = () => beat.mock.calls.length;
    await syncPlayer(TEST_ACCOUNT_ID, { db, api });

    expect(calls).toBe(2);
    expect(await tagged()).toBeGreaterThan(0);
    // 7 detail batches for 606 matches, then one beat after chunk one, before chunk two.
    expect(beatsAtSecondChunk).toBe(7 + 1);
    expect(beatsBeforeTagging()).toBeGreaterThanOrEqual(beatsAtSecondChunk);
  });
});
