import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
    await vi.waitFor(() => expect(events).toEqual([{ type: "status", step: "contacting" }]));
    release();
    await run;
  });

  it("asks for the profile and the history at the same time", async () => {
    const { api, state, release } = slowProfile();

    const run = syncPlayer(TEST_ACCOUNT_ID, { db, api });
    // Started while the profile is still pending.
    await vi.waitFor(() => expect(state.calls.history).toBe(1));
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
        opts?: { onWait?: (ms: number) => void; onStart?: () => void },
      ) => {
        opts?.onWait?.(12_000);
        opts?.onStart?.();
        return api.getBulkMetadata(id, ids);
      },
    };

    await syncPlayer(TEST_ACCOUNT_ID, { db, api: limited, onEvent: (e) => events.push(e) });

    const waitAt = events.findIndex((e) => e.type === "status" && e.step === "rate_limited");
    expect(events[waitAt]).toEqual({ type: "status", step: "rate_limited", waitMs: 12_000 });
    // Once the wait ends the "waiting" note is replaced by the batch note again.
    expect(events[waitAt + 1]).toEqual({ type: "status", step: "batch", fetched: 0, total: 352 });
  });

  it("raises the history error when the history call fails", async () => {
    const { api, release } = slowProfile();
    const failing = {
      ...api,
      getMatchHistory: async (): Promise<never> => {
        throw new Error("history down");
      },
    };
    const run = syncPlayer(TEST_ACCOUNT_ID, { db, api: failing });
    const assertion = expect(run).rejects.toThrow("history down");
    release();
    await assertion;
  });

  it("raises the profile error with no unhandled rejection when history also fails", async () => {
    const { api } = fakeApi();
    const unhandled = vi.fn();
    process.on("unhandledRejection", unhandled);
    try {
      const failing = {
        ...api,
        getSteamProfile: async (): Promise<never> => {
          throw new Error("profile down");
        },
        getMatchHistory: async (): Promise<never> => {
          throw new Error("history down");
        },
      };
      await expect(syncPlayer(TEST_ACCOUNT_ID, { db, api: failing })).rejects.toThrow(
        "profile down",
      );
      await new Promise((r) => setTimeout(r, 20));
      expect(unhandled).not.toHaveBeenCalled();
    } finally {
      process.off("unhandledRejection", unhandled);
    }
  });
});
