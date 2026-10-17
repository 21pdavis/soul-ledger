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
    const limitOne = setup({ limit: 1, maxBuckets: 10 }).limiter;
    for (let i = 0; i < 50; i++) limiter.check(`10.0.0.${i}`);
    expect(limiter.size()).toBeLessThanOrEqual(10);

    // The oldest bucket (10.0.0.0) is the one dropped; newer ones keep their count.
    for (let i = 0; i < 10; i++) limitOne.check(`10.0.0.${i}`);
    limitOne.check("10.0.0.10");
    expect(limitOne.check("10.0.0.1").allowed).toBe(false);
    expect(limitOne.check("10.0.0.0").allowed).toBe(true);
  });
});

describe("clientIp", () => {
  const req = (headers: Record<string, string>) => new Request("http://x/", { headers });

  it("takes true-client-ip, trimmed, and falls back to cf-connecting-ip", () => {
    expect(clientIp(req({ "true-client-ip": " 203.0.113.9 " }))).toBe("203.0.113.9");
    expect(clientIp(req({ "cf-connecting-ip": "203.0.113.7" }))).toBe("203.0.113.7");
    expect(
      clientIp(req({ "true-client-ip": "203.0.113.9", "cf-connecting-ip": "203.0.113.7" })),
    ).toBe("203.0.113.9");
  });

  it("never trusts x-forwarded-for, whose first entry the client controls", () => {
    expect(clientIp(req({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" }))).toBe("unknown");
    expect(clientIp(req({ "true-client-ip": "203.0.113.9", "x-forwarded-for": "1.2.3.4" }))).toBe(
      "203.0.113.9",
    );
  });

  it("clamps the key to 45 characters so a forged header cannot bloat memory", () => {
    expect(clientIp(req({ "true-client-ip": "9".repeat(5000) }))).toHaveLength(45);
  });

  it("buckets IPv6 visitors by their /64", () => {
    const a = clientIp(req({ "true-client-ip": "2001:db8:1:2:aaaa::1" }));
    const b = clientIp(req({ "true-client-ip": "2001:0DB8:1:2:bbbb:cccc:dddd:2" }));
    const other = clientIp(req({ "true-client-ip": "2001:db8:1:3::1" }));
    expect(a).toBe(b);
    expect(a).not.toBe(other);
    expect(clientIp(req({ "true-client-ip": "::1" }))).toBe(
      clientIp(req({ "true-client-ip": "0:0:0:0:5::9" })),
    );
  });

  it("puts requests with no usable address in one shared bucket", () => {
    expect(clientIp(req({}))).toBe("unknown");
    expect(clientIp(req({ "true-client-ip": " " }))).toBe("unknown");
  });

  it("still limits a client that rotates a forged x-forwarded-for", () => {
    const { limiter } = setup({ limit: 2 });
    const results = Array.from({ length: 4 }, (_, i) =>
      limiter.check(
        clientIp(req({ "true-client-ip": "203.0.113.9", "x-forwarded-for": `1.2.3.${i}` })),
      ),
    );
    expect(results.map((r) => r.allowed)).toEqual([true, true, false, false]);
  });
});
