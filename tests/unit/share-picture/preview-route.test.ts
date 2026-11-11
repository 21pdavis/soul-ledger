import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OpenedShare } from "@/lib/share/open";
import { fixtureStory } from "../../fixtures/story";

const opened = vi.hoisted(() => ({ value: { kind: "notFound" } as OpenedShare }));
vi.mock("@/lib/share/open", () => ({ openSharedStory: async () => opened.value }));

import { GET } from "@/app/w/[slug]/preview/route";

const ctx = { params: Promise.resolve({ slug: "hazemain" }) };
const req = new Request("http://localhost/w/hazemain/preview");

beforeEach(() => {
  opened.value = { kind: "notFound" };
});

describe("GET /w/[slug]/preview", () => {
  it("serves a PNG for a live link", async () => {
    opened.value = {
      kind: "live",
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
    expect((await res.arrayBuffer()).byteLength).toBeGreaterThan(10_000);
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
