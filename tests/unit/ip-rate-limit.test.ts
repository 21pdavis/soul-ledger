import { describe, expect, it } from "vitest";
import { clientIp, createIpRateLimiter } from "@/lib/ip-rate-limit";

function setup(over: { limit?: number; windowMs?: number; maxBuckets?: number } = {}) {
  let now = 1_000_000;
  const limiter = createIpRateLimiter({
    limit: 3,
    windowMs: 60_000,
    now: () => now,
    ...over,
  });
  return { limiter, advance: (ms: number) => (now += ms) };
}

describe("createIpRateLimiter", () => {
  it("allows up to the limit, then refuses with the seconds until the window ends", () => {
    const { limiter, advance } = setup();
    for (let i = 0; i < 3; i++) expect(limiter.check("1.1.1.1")).toEqual({ allowed: true });
    advance(10_500);
    expect(limiter.check("1.1.1.1")).toEqual({ allowed: false, retryAfterSeconds: 50 });
  });

  it("counts each IP separately", () => {
    const { limiter } = setup({ limit: 1 });
    expect(limiter.check("1.1.1.1").allowed).toBe(true);
    expect(limiter.check("1.1.1.1").allowed).toBe(false);
    expect(limiter.check("2.2.2.2").allowed).toBe(true);
  });

  it("starts a fresh window once the old one has passed", () => {
    const { limiter, advance } = setup({ limit: 1 });
    limiter.check("1.1.1.1");
    expect(limiter.check("1.1.1.1").allowed).toBe(false);
    advance(60_000);
    expect(limiter.check("1.1.1.1").allowed).toBe(true);
  });

  it("does not extend the window when refused requests keep coming", () => {
    const { limiter, advance } = setup({ limit: 1 });
    limiter.check("1.1.1.1");
    advance(30_000);
    limiter.check("1.1.1.1");
    advance(30_000);
    expect(limiter.check("1.1.1.1").allowed).toBe(true);
  });

  it("forgets expired buckets so memory cannot grow without bound", () => {
    const { limiter, advance } = setup();
    for (let i = 0; i < 100; i++) limiter.check(`10.0.0.${i}`);
    expect(limiter.size()).toBe(100);
    advance(61_000);
    limiter.check("9.9.9.9");
    expect(limiter.size()).toBe(1);
  });

  it("caps the number of live buckets, dropping the oldest, even inside one window", () => {
    const { limiter } = setup({ maxBuckets: 10 });
    for (let i = 0; i < 50; i++) limiter.check(`10.0.0.${i}`);
    expect(limiter.size()).toBeLessThanOrEqual(10);
  });
});

describe("clientIp", () => {
  const req = (headers: Record<string, string>) => new Request("http://x/", { headers });

  it("takes the first entry of x-forwarded-for, trimmed", () => {
    expect(clientIp(req({ "x-forwarded-for": " 203.0.113.9 , 10.0.0.1" }))).toBe("203.0.113.9");
  });

  it("puts requests with no usable address in one shared bucket", () => {
    expect(clientIp(req({}))).toBe("unknown");
    expect(clientIp(req({ "x-forwarded-for": " " }))).toBe("unknown");
  });
});
