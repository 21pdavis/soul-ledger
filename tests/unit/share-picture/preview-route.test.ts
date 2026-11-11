import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OpenedShare } from "@/lib/share/open";
import { fixtureStory } from "../../fixtures/story";

const opened = vi.hoisted(() => ({ value: { kind: "notFound" } as OpenedShare }));
vi.mock("@/lib/share/open", () => ({ openSharedStory: async () => opened.value }));

const drawn = vi.hoisted(() => vi.fn());
vi.mock("@/share-picture/render", async (original) => {
  const real = await original<typeof import("@/share-picture/render")>();
  return {
    ...real,
    renderLinkPreview: (...args: Parameters<typeof real.renderLinkPreview>) => {
      drawn(...args);
      return real.renderLinkPreview(...args);
    },
  };
});

import { GET } from "@/app/w/[slug]/preview/route";

const DAY = 86_400;
const live = (expiresAt: Date): OpenedShare => ({
  kind: "live",
  expiresAt,
  snapshot: {
    version: 1,
    sharedAt: "2026-11-11T12:00:00.000Z",
    player: { accountId: 77, personaName: "Haze Main", avatarUrl: null },
    meta: { window: "all", patchStart: null, patchUnavailable: false },
    story: fixtureStory(),
  },
});
const ctx = { params: Promise.resolve({ slug: "hazemain" }) };
const req = new Request("http://localhost/w/hazemain/preview");

beforeEach(() => {
  opened.value = { kind: "notFound" };
});

describe("GET /w/[slug]/preview", () => {
  it("serves a PNG for a live link", async () => {
    opened.value = {
      kind: "live",
      expiresAt: new Date(Date.now() + 90 * DAY * 1000),
      snapshot: {
        version: 1,
        sharedAt: "2026-11-11T12:00:00.000Z",
        player: { accountId: 77, personaName: "Haze Main", avatarUrl: null },
        meta: { window: "all", patchStart: null, patchUnavailable: false },
        story: fixtureStory(),
      },
    };
    const res = await GET(req, ctx);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/png");
    expect(res.headers.get("cache-control")).toBe(`public, max-age=${DAY}, s-maxage=${DAY}`);
    expect((await res.arrayBuffer()).byteLength).toBeGreaterThan(10_000);
  }, 30_000);

  it("never lets a cache keep the picture past the link's remaining life", async () => {
    opened.value = live(new Date(Date.now() + 3600 * 1000));
    const res = await GET(req, ctx);
    const header = res.headers.get("cache-control")!;
    const [maxAge, sMaxAge] = [/max-age=(\d+)/, /s-maxage=(\d+)/].map((re) =>
      Number(re.exec(header)![1]),
    );
    expect(maxAge).toBeLessThanOrEqual(3600);
    expect(sMaxAge).toBeLessThanOrEqual(3600);
    expect(header).not.toContain("immutable");
  }, 30_000);

  it("draws a link once and serves the memo after, but never past expiry", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      vi.setSystemTime(new Date("2026-11-11T12:00:00Z"));
      opened.value = live(new Date("2026-11-11T12:10:00Z"));
      const fresh = { params: Promise.resolve({ slug: "memo-test" }) };
      drawn.mockClear();
      await GET(req, fresh);
      await GET(req, fresh);
      expect(drawn).toHaveBeenCalledTimes(1);
      vi.setSystemTime(new Date("2026-11-11T12:10:01Z"));
      opened.value = { kind: "expired", accountId: 77 };
      expect((await GET(req, fresh)).status).toBe(404);
      expect(drawn).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  }, 30_000);

  it.each([{ kind: "expired", accountId: 77 } as const, { kind: "notFound" } as const])(
    "is a 404 for a $kind link, with no player data",
    async (value) => {
      opened.value = value;
      const res = await GET(req, ctx);
      expect(res.status).toBe(404);
      expect(res.headers.get("content-type")).not.toBe("image/png");
    },
  );
});
