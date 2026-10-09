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
  it("compares the percentages as printed: 51% vs 53% is flat even if the raw gap rounds to 3", () => {
    // 0.5051 prints 51%, 0.5349 prints 53%: the raw gap is 2.98 points but the card shows 2.
    expect(recentTrend(0.5051, { matches: 300, winRate: 0.5349 })?.direction).toBe("flat");
  });
  it("shows the arrow at exactly 3 printed points, either way", () => {
    expect(recentTrend(0.5, { matches: 300, winRate: 0.53 })?.direction).toBe("up");
    expect(recentTrend(0.5, { matches: 300, winRate: 0.47 })?.direction).toBe("down");
  });
  it("names the arrow in words for screen readers", () => {
    expect(recentTrend(0.5, { matches: 300, winRate: 0.6 })?.arrowLabel).toBe("trending up");
    expect(recentTrend(0.6, { matches: 300, winRate: 0.5 })?.arrowLabel).toBe("trending down");
    expect(recentTrend(0.5, { matches: 300, winRate: 0.5 })?.arrowLabel).toBe("");
  });
});
