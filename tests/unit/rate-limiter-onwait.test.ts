import { describe, expect, it } from "vitest";
import { createDeadlockApi } from "@/lib/deadlock-api/client";
import { RateLimiter } from "@/lib/deadlock-api/rate-limiter";

function manualClock() {
  let t = 0;
  return {
    now: () => t,
    sleep: async (ms: number) => {
      t += ms;
    },
  };
}

describe("RateLimiter onWait", () => {
  it("tells the caller how long it has to wait before it can start", async () => {
    const limiter = new RateLimiter({ maxRequests: 1, perMs: 5_000, ...manualClock() });
    const waits: number[] = [];
    await limiter.schedule(async () => 1);
    await limiter.schedule(async () => 2, { onWait: (ms) => waits.push(ms) });
    expect(waits).toEqual([5_000]);
  });

  it("stays silent when there is no wait", async () => {
    const limiter = new RateLimiter({ maxRequests: 5, perMs: 5_000, ...manualClock() });
    const waits: number[] = [];
    await limiter.schedule(async () => 1, { onWait: (ms) => waits.push(ms) });
    expect(waits).toEqual([]);
  });
});

describe("getBulkMetadata onWait", () => {
  it("passes the limiter's wait through to the caller", async () => {
    const unlimited = () => new RateLimiter({ maxRequests: 1_000_000, perMs: 1 });
    const bulk = new RateLimiter({ maxRequests: 1, perMs: 7_000, ...manualClock() });
    const api = createDeadlockApi({
      fetch: async () => new Response("[]"),
      limiters: { bulk, analytics: unlimited(), general: unlimited() },
    });
    const waits: number[] = [];
    await api.getBulkMetadata(1, [1]);
    await api.getBulkMetadata(1, [2], { onWait: (ms) => waits.push(ms) });
    expect(waits).toEqual([7_000]);
  });
});
