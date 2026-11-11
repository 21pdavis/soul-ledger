import { describe, expect, it, vi } from "vitest";
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

function setup(opened: OpenedShare) {
  const open = vi.fn(async () => opened);
  const render = vi.fn(async () => PNG);
  const GET = createPictureHandler({ open, render });
  const call = (slug: string, n: string) =>
    GET(new Request("http://x"), { params: Promise.resolve({ slug, n }) });
  return { open, render, call };
}

describe("GET /w/[slug]/picture/[n]", () => {
  it("serves the PNG for that slide of a live link, cached for a long time", async () => {
    const { call, render } = setup({ kind: "live", snapshot });
    const res = await call("gaben-abc", "3");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/png");
    expect(res.headers.get("cache-control")).toContain("immutable");
    expect(new Uint8Array(await res.arrayBuffer())[1]).toBe(0x50);
    expect(render).toHaveBeenCalledWith(
      expect.objectContaining({ index: 3, playerName: "Gaben", sharedAt: snapshot.sharedAt }),
    );
  });

  it.each(["notFound", "expired"] as const)("404s for a %s link", async (kind) => {
    const opened = kind === "expired" ? { kind, accountId: 1 } : { kind };
    const { call, render } = setup(opened as OpenedShare);
    expect((await call("x", "0")).status).toBe(404);
    expect(render).not.toHaveBeenCalled();
  });

  it.each(["-1", "11", "1.5", "abc", ""])("404s for a bad slide number %j", async (n) => {
    const { call, open } = setup({ kind: "live", snapshot });
    expect((await call("x", n)).status).toBe(404);
    expect(open).not.toHaveBeenCalled();
  });
});
