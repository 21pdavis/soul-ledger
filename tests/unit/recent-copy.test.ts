import { describe, expect, it } from "vitest";
import { recentTrend } from "@/story/copy";

describe("recentTrend", () => {
  it("is null without a recent figure", () => {
    expect(recentTrend(0.5, null)).toBeNull();
  });
  it("points up when recent is 3+ points better", () => {
    expect(recentTrend(0.52, { matches: 300, winRate: 0.61 })).toMatchObject({
      direction: "up",
      allTime: "52%",
      recent: "61%",
    });
  });
  it("points down when 3+ points worse", () => {
    expect(recentTrend(0.6, { matches: 50, winRate: 0.5 })?.direction).toBe("down");
  });
  it("is flat within 3 points", () => {
    expect(recentTrend(0.5, { matches: 50, winRate: 0.52 })?.direction).toBe("flat");
  });
});
