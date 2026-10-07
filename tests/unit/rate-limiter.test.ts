import { describe, expect, it } from "vitest";
import { RateLimiter } from "@/lib/deadlock-api/rate-limiter";

/** A manual clock: sleep() advances time instantly so tests run without waiting. */
function manualClock() {
  let t = 0;
  return {
    now: () => t,
    sleep: async (ms: number) => {
      t += ms;
    },
  };
}

describe("RateLimiter", () => {
  it("lets requests through immediately while under the limit", async () => {
    const clock = manualClock();
    const limiter = new RateLimiter({ maxRequests: 3, perMs: 60_000, ...clock });
    for (let i = 0; i < 3; i++) await limiter.schedule(async () => i);
    expect(clock.now()).toBe(0);
  });

  it("waits for the window to slide once the limit is reached", async () => {
    const clock = manualClock();
    const limiter = new RateLimiter({ maxRequests: 2, perMs: 60_000, ...clock });
    const startedAt: number[] = [];
    for (let i = 0; i < 5; i++) await limiter.schedule(async () => startedAt.push(clock.now()));
    expect(startedAt).toEqual([0, 0, 60_000, 60_000, 120_000]);
  });

  it("runs concurrent callers one slot at a time and returns their results", async () => {
    const clock = manualClock();
    const limiter = new RateLimiter({ maxRequests: 1, perMs: 1_000, ...clock });
    const results = await Promise.all([1, 2, 3].map((n) => limiter.schedule(async () => n * 10)));
    expect(results).toEqual([10, 20, 30]);
    expect(clock.now()).toBe(2_000);
  });

  it("frees the slot accounting even when the task throws", async () => {
    const clock = manualClock();
    const limiter = new RateLimiter({ maxRequests: 1, perMs: 1_000, ...clock });
    await expect(limiter.schedule(async () => Promise.reject(new Error("boom")))).rejects.toThrow(
      "boom",
    );
    await expect(limiter.schedule(async () => "ok")).resolves.toBe("ok");
  });
});
