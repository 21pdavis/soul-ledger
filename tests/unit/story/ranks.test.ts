import { describe, expect, it } from "vitest";
import { rankLabel } from "@/story/ranks";

describe("rankLabel", () => {
  it("names a tier and subrank (badge 81 = Oracle 1)", () => {
    expect(rankLabel({ tier: 8, subrank: 1 })).toBe("Oracle 1");
    expect(rankLabel({ tier: 11, subrank: 6 })).toBe("Eternus 6");
  });

  it("leaves out a zero subrank", () => {
    expect(rankLabel({ tier: 0, subrank: 0 })).toBe("Obscurus");
  });

  it("falls back to the plain tier format for an unknown tier", () => {
    expect(rankLabel({ tier: 99, subrank: 2 })).toBe("Tier 99 · 2");
  });
});
