import { describe, expect, it } from "vitest";
import { renderLinkPreview } from "@/share-picture/render";
import { fixtureStory } from "../../fixtures/story";

describe("renderLinkPreview", () => {
  it("returns a 1200x630 PNG", async () => {
    const png = new Uint8Array(
      await renderLinkPreview({ story: fixtureStory(), playerName: "Gaben" }),
    );
    const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
    expect(Array.from(png.slice(0, 8))).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect([view.getUint32(16), view.getUint32(20)]).toEqual([1200, 630]);
    expect(png.byteLength).toBeGreaterThan(10_000);
  }, 30_000);

  it("draws a hero with no card art and a Cyrillic name", async () => {
    const story = fixtureStory();
    story.main = { ...story.main!, heroId: 99 };
    const png = await renderLinkPreview({ story, playerName: "Игорь" });
    expect(png.byteLength).toBeGreaterThan(10_000);
  }, 30_000);
});
