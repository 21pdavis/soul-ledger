import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "@/db";
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

/** A fake API whose profile call hangs until `release()`. */
function slowProfile() {
  const { api, state } = fakeApi();
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  const slow = {
    ...api,
    getSteamProfile: async (id: number) => {
      await gate;
      return api.getSteamProfile(id);
    },
  };
  return { api: slow, state, release };
}

describe("syncPlayer status events (a sign of life from the first second)", () => {
  it("says it is contacting the API before the profile call returns", async () => {
    const { api, release } = slowProfile();
    const events: SyncEvent[] = [];

    const run = syncPlayer(TEST_ACCOUNT_ID, { db, api, onEvent: (e) => events.push(e) });
    await new Promise((r) => setTimeout(r, 30));

    expect(events).toEqual([{ type: "status", step: "contacting" }]);
    release();
    await run;
  });

  it("asks for the profile and the history at the same time", async () => {
    const { api, state, release } = slowProfile();

    const run = syncPlayer(TEST_ACCOUNT_ID, { db, api });
    await new Promise((r) => setTimeout(r, 30));

    expect(state.calls.history).toBe(1); // started while the profile is still pending
    release();
    await run;
  });

  it("announces each batch before fetching it, and a finishing step before the end", async () => {
    const { api } = fakeApi();
    const events: SyncEvent[] = [];
    await syncPlayer(TEST_ACCOUNT_ID, { db, api, onEvent: (e) => events.push(e) });

    const isStatus = (step: string) => (e: SyncEvent) => e.type === "status" && e.step === step;
    const firstBatch = events.findIndex(isStatus("batch"));
    expect(events[firstBatch]).toEqual({ type: "status", step: "batch", fetched: 0, total: 352 });
    expect(firstBatch).toBeLessThan(events.findIndex((e) => e.type === "details"));
    const finishing = events.findIndex(isStatus("finishing"));
    expect(finishing).toBeGreaterThan(events.findLastIndex((e) => e.type === "details"));
    expect(finishing).toBeLessThan(events.findIndex((e) => e.type === "done"));
  });

  it("reports when the rate limiter makes a bulk request wait", async () => {
    const { api } = fakeApi();
    const events: SyncEvent[] = [];
    const limited = {
      ...api,
      getBulkMetadata: async (
        id: number,
        ids: number[],
        opts?: { onWait?: (ms: number) => void },
      ) => {
        opts?.onWait?.(12_000);
        return api.getBulkMetadata(id, ids);
      },
    };

    await syncPlayer(TEST_ACCOUNT_ID, { db, api: limited, onEvent: (e) => events.push(e) });

    expect(events).toContainEqual({ type: "status", step: "rate_limited", waitMs: 12_000 });
  });
});
