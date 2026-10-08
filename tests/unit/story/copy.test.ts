import { describe, expect, it } from "vitest";
import { SLIDE_COUNT, SLIDES } from "@/story/copy";

describe("slide copy", () => {
  it("has exactly 11 slides, in ADR 0015 order, each with a fixed headline", () => {
    expect(SLIDE_COUNT).toBe(11);
    expect(SLIDES.map((s) => s.id)).toEqual([
      "intro",
      "main",
      "roster",
      "scavenger",
      "kills",
      "precision",
      "midBoss",
      "roast",
      "rank",
      "mvp",
      "summary",
    ]);
    for (const s of SLIDES) expect(s.headline.trim().length).toBeGreaterThan(0);
  });
});
