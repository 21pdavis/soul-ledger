import { describe, expect, it } from "vitest";
import { basedOnMatches, windowLabel } from "@/story/window-label";

describe("windowLabel", () => {
  it("labels the all-time window", () => {
    expect(windowLabel({ window: "all", patchStart: null })).toBe("All time");
  });

  it("labels a patch window with the date from the server, formatted in UTC", () => {
    expect(windowLabel({ window: "patch", patchStart: "2026-09-30T00:00:00.000Z" })).toBe(
      "Since patch Sep 30, 2026",
    );
  });

  it("never shows the day before for viewers west of UTC", () => {
    const original = process.env.TZ;
    process.env.TZ = "America/Los_Angeles";
    try {
      // Sanity check that the zone really is negative-offset here.
      expect(new Date("2026-09-30T00:00:00.000Z").getDate()).toBe(29);
      expect(windowLabel({ window: "patch", patchStart: "2026-09-30T00:00:00.000Z" })).toContain(
        "Sep 30, 2026",
      );
    } finally {
      if (original === undefined) delete process.env.TZ;
      else process.env.TZ = original;
    }
  });

  it("falls back to All time, and says why, when the patch date could not be found (#25)", () => {
    const label = windowLabel({ window: "patch", patchStart: null });
    expect(label).toMatch(/^All time/);
    expect(label).toMatch(/couldn't find the patch date/);
    expect(label).not.toMatch(/this patch/i);
  });
});

describe("basedOnMatches", () => {
  it("states how many matches the story is based on", () => {
    expect(basedOnMatches(120)).toBe("Based on 120 matches");
    expect(basedOnMatches(1)).toBe("Based on 1 match");
    expect(basedOnMatches(1234)).toBe("Based on 1,234 matches");
  });
});
