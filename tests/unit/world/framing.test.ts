import { describe, expect, it } from "vitest";
import { sceneShift } from "@/components/world/city/framing";

/** The card's inner edge in pixels, mirroring the card CSS (gutter clamp(72px, 12vw, 192px), card min(480px, 42vw)). */
function cardEdge(width: number, side: "left" | "right") {
  const gutter = Math.min(192, Math.max(72, width * 0.12));
  const card = Math.min(480, width * 0.42, width - 2 * gutter);
  return side === "left" ? gutter + card : width - gutter - card;
}
const focusPx = (width: number, side: "left" | "right", nudge?: number) =>
  width / 2 + sceneShift(width, side, nudge) * width;

/** Where the camera points on desktop (ADR 0068): beside the story card, never behind it. */
describe("sceneShift", () => {
  it("puts the focal point in the open space beside the card", () => {
    expect(focusPx(1280, "left")).toBeGreaterThan(cardEdge(1280, "left"));
    expect(focusPx(1280, "right")).toBeLessThan(cardEdge(1280, "right"));
  });

  it("adds a shot's nudge on a wide screen where there is room", () => {
    expect(sceneShift(1600, "left", 0.07) - sceneShift(1600, "left")).toBeCloseTo(0.07);
  });

  it("never lets a nudge push the focal point up against the card at narrower widths", () => {
    for (const width of [700, 850, 1000, 1280, 1600, 1920]) {
      for (const nudge of [0.07, 0.08, 0.12]) {
        expect(cardEdge(width, "right") - focusPx(width, "right", nudge)).toBeGreaterThanOrEqual(
          40,
        );
        expect(focusPx(width, "left", -nudge) - cardEdge(width, "left")).toBeGreaterThanOrEqual(40);
      }
    }
  });
});
