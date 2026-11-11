import { describe, expect, it } from "vitest";
import { PICTURE_HEIGHT, PICTURE_WIDTH } from "@/share-picture/build";
import { renderSlidePicture } from "@/share-picture/render";
import { SLIDES } from "@/story/copy";
import { fixtureStory } from "../../fixtures/story";

const input = {
  story: fixtureStory(),
  meta: { window: "all", patchStart: null, stale: false } as const,
  playerName: "Gaben",
  sharedAt: "2026-11-11T09:30:00.000Z",
};

/** Width and height from a PNG's header. */
function pngSize(bytes: Uint8Array) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const signature = Array.from(bytes.slice(0, 8));
  return { signature, width: view.getUint32(16), height: view.getUint32(20) };
}

describe("renderSlidePicture", () => {
  it("returns a 1080x1920 PNG", async () => {
    const png = new Uint8Array(await renderSlidePicture({ ...input, index: 1 }));
    const { signature, width, height } = pngSize(png);
    expect(signature).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect([width, height]).toEqual([PICTURE_WIDTH, PICTURE_HEIGHT]);
  }, 30_000);

  it("draws every slide, with and without hero art", async () => {
    for (let i = 0; i < SLIDES.length; i++) {
      const png = await renderSlidePicture({ ...input, index: i });
      expect(png.byteLength).toBeGreaterThan(10_000);
    }
    // Hero 99 has no card art, so this one goes through the monogram path.
    const unknown = fixtureStory();
    unknown.main = { ...unknown.main!, heroId: 99 };
    const png = await renderSlidePicture({ ...input, story: unknown, index: 1 });
    expect(png.byteLength).toBeGreaterThan(10_000);
  }, 60_000);

  it("draws Cyrillic, Greek and CJK names, and the roast map, without throwing", async () => {
    const names = ["Игорь", "Ελένη", "山田 ★"];
    for (const playerName of names) {
      const png = await renderSlidePicture({ ...input, playerName, index: 7 });
      expect(png.byteLength).toBeGreaterThan(10_000);
    }
  }, 60_000);

  it("draws Cyrillic letters, so two different names give different pictures", async () => {
    const draw = async (playerName: string) =>
      Buffer.from(await renderSlidePicture({ ...input, playerName, index: 0 }));
    const a = await draw("Игорь");
    const b = await draw("Васяя");
    expect(a.equals(b)).toBe(false);
  }, 60_000);
});
