import { describe, expect, it, vi } from "vitest";
import { createIpRateLimiter } from "@/lib/ip-rate-limit";
import { createPictureHandler } from "@/lib/share/picture-handler";
import type { OpenedShare } from "@/lib/share/open";
import { fixtureStory } from "../fixtures/story";

const snapshot = {
  version: 1 as const,
  sharedAt: "2026-11-11T09:30:00.000Z",
  player: { accountId: 1, personaName: "Gaben", avatarUrl: null },
  meta: { window: "all" as const, patchStart: null, patchUnavailable: false },
  story: fixtureStory(),
};
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47]).buffer;

const NOW = new Date("2026-11-12T00:00:00.000Z");
const DAY = 86_400;
const liveFor = (seconds: number): OpenedShare => ({
  kind: "live",
  snapshot,
  expiresAt: new Date(NOW.getTime() + seconds * 1000),
});
const LIVE = liveFor(60 * DAY);

function setup(
  opened: OpenedShare,
  extra: Partial<Parameters<typeof createPictureHandler>[0]> = {},
) {
  const clock = { now: NOW };
  const open = vi.fn(async () => opened);
  const render = vi.fn(async () => PNG);
  const GET = createPictureHandler({ open, render, now: () => clock.now, ...extra });
  const call = (slug: string, n: string, headers: Record<string, string> = {}) =>
    GET(new Request("http://x", { headers }), { params: Promise.resolve({ slug, n }) });
  return { open, render, call, clock };
}

describe("GET /w/[slug]/picture/[n]", () => {
  it("serves the PNG for that slide of a live link", async () => {
    const { call, render } = setup(LIVE);
    const res = await call("gaben-abc", "3");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/png");
    expect(new Uint8Array(await res.arrayBuffer())[1]).toBe(0x50);
    expect(render).toHaveBeenCalledWith(
      expect.objectContaining({ index: 3, playerName: "Gaben", sharedAt: snapshot.sharedAt }),
    );
  });

  it("caches for a day at most, never immutable", async () => {
    const { call } = setup(LIVE);
    const cc = (await call("a", "0")).headers.get("cache-control");
    expect(cc).toBe(`public, max-age=${DAY}, s-maxage=${DAY}`);
    expect(cc).not.toContain("immutable");
  });

  it("stops caching when the link expires sooner than a day", async () => {
    const { call } = setup(liveFor(600));
    expect((await call("a", "0")).headers.get("cache-control")).toBe(
      "public, max-age=600, s-maxage=600",
    );
  });

  it("404s a link that expired a moment ago, without rendering", async () => {
    const { call, render } = setup(liveFor(0));
    expect((await call("a", "0")).status).toBe(404);
    expect(render).not.toHaveBeenCalled();
  });

  it.each(["notFound", "expired"] as const)("404s for a %s link", async (kind) => {
    const opened = kind === "expired" ? { kind, accountId: 1 } : { kind };
    const { call, render } = setup(opened as OpenedShare);
    expect((await call("x", "0")).status).toBe(404);
    expect(render).not.toHaveBeenCalled();
  });

  it.each(["-1", "11", "1.5", "abc", "", "05", "00", "005"])(
    "404s for a bad or non-canonical slide number %j",
    async (n) => {
      const { call, open } = setup(LIVE);
      expect((await call("x", n)).status).toBe(404);
      expect(open).not.toHaveBeenCalled();
    },
  );

  describe("server cache", () => {
    it("renders once for repeat requests of the same slug and slide", async () => {
      const { call, render, open } = setup(LIVE);
      await call("a", "1");
      const second = await call("a", "1");
      expect(second.status).toBe(200);
      expect(new Uint8Array(await second.arrayBuffer())[1]).toBe(0x50);
      expect(render).toHaveBeenCalledOnce();
      expect(open).toHaveBeenCalledOnce();
      await call("a", "2");
      await call("b", "1");
      expect(render).toHaveBeenCalledTimes(3);
    });

    it("never serves a cached picture past the link's expiry", async () => {
      const { call, render, clock } = setup(liveFor(100));
      await call("a", "1");
      clock.now = new Date(NOW.getTime() + 101_000);
      expect((await call("a", "1")).status).toBe(404);
      expect(render).toHaveBeenCalledOnce();
    });

    it("keeps a bounded number of pictures, dropping the least recently used", async () => {
      const { call, render } = setup(LIVE, { maxEntries: 2 });
      await call("a", "0");
      await call("b", "0");
      await call("a", "0"); // a is now the most recent
      await call("c", "0"); // evicts b
      expect(render).toHaveBeenCalledTimes(3);
      await call("a", "0");
      expect(render).toHaveBeenCalledTimes(3);
      await call("b", "0");
      expect(render).toHaveBeenCalledTimes(4);
    });
  });

  describe("per-IP limit on renders", () => {
    const limited = () => ({ limiter: createIpRateLimiter({ limit: 2 }) });
    const ip = { "cf-connecting-ip": "1.2.3.4" };

    it("429s with Retry-After once an IP has used its renders, before any database work", async () => {
      const { call, render, open } = setup(LIVE, limited());
      await call("a", "0", ip);
      await call("a", "1", ip);
      const res = await call("a", "2", ip);
      expect(res.status).toBe(429);
      expect(Number(res.headers.get("retry-after"))).toBeGreaterThan(0);
      expect(res.headers.get("cache-control")).toBe("no-store");
      expect(render).toHaveBeenCalledTimes(2);
      expect(open).toHaveBeenCalledTimes(2);
    });

    it("lets cached pictures through without spending the allowance", async () => {
      const { call, render } = setup(LIVE, limited());
      for (let i = 0; i < 6; i++) expect((await call("a", "0", ip)).status).toBe(200);
      expect(render).toHaveBeenCalledOnce();
    });

    it("limits each IP separately, and exempts requests the exempt hook accepts", async () => {
      const { call } = setup(LIVE, {
        ...limited(),
        exempt: (r: Request) => r.headers.has("x-staging-token"),
      });
      await call("a", "0", ip);
      await call("a", "1", ip);
      expect((await call("a", "2", ip)).status).toBe(429);
      expect((await call("a", "2", { "cf-connecting-ip": "5.6.7.8" })).status).toBe(200);
      for (const n of ["3", "4", "5", "6"]) {
        expect((await call("a", n, { ...ip, "x-staging-token": "t" })).status).toBe(200);
      }
    });
  });
});
