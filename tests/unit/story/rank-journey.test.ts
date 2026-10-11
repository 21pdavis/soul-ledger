import { describe, expect, it } from "vitest";
import { ladderHeight, journeyMilestones, type JourneyPoint } from "@/story/rank-journey";

const pt = (i: number, badge: number): JourneyPoint => ({
  at: new Date(Date.UTC(2026, 0, 1 + i)).toISOString(),
  matchId: 1000 + i,
  badge,
  tier: Math.floor(badge / 10),
  subrank: badge % 10,
});
const series = (badges: number[]) => badges.map((b, i) => pt(i, b));

describe("journeyMilestones", () => {
  it("returns nothing for an empty journey", () => {
    expect(journeyMilestones([])).toEqual([]);
  });

  it("keeps a single point as it is", () => {
    const one = series([41]);
    expect(journeyMilestones(one)).toEqual(one);
  });

  it("keeps the first match of each run of the same badge", () => {
    const j = series([41, 41, 41, 42, 42, 51, 51]);
    expect(journeyMilestones(j).map((p) => p.badge)).toEqual([41, 42, 51]);
    expect(journeyMilestones(j)[0]).toBe(j[0]);
  });

  it("keeps a badge that comes back after a drop", () => {
    expect(journeyMilestones(series([41, 51, 41, 51])).map((p) => p.badge)).toEqual([
      41, 51, 41, 51,
    ]);
  });

  it("thins a long journey to the cap, keeping first, last and the peak, in order", () => {
    const badges = Array.from({ length: 40 }, (_, i) => (i === 17 ? 96 : 11 + (i % 9)));
    const j = series(badges.map((b, i) => (i % 2 === 0 ? b : b + 1)));
    const out = journeyMilestones(j, 6);
    expect(out.length).toBeLessThanOrEqual(6);
    expect(out[0]).toBe(j[0]);
    expect(out.at(-1)).toBe(j.at(-1));
    expect(out.map((p) => p.badge)).toContain(Math.max(...j.map((p) => p.badge)));
    const ids = out.map((p) => p.matchId);
    expect(ids).toEqual([...ids].sort((a, b) => a - b));
  });
});

describe("journeyMilestones cap", () => {
  const j = series([11, 12, 13, 14, 95, 16, 17, 18, 19, 21]);

  it.each([1, 2, 0, -5])("clamps a cap of %i to three, keeping first, last and the peak", (max) => {
    const out = journeyMilestones(j, max);
    expect(out).toHaveLength(3);
    expect(out[0]).toBe(j[0]);
    expect(out.at(-1)).toBe(j.at(-1));
    expect(out.map((p) => p.badge)).toContain(95);
  });
});

describe("ladderHeight", () => {
  it("rises with the badge number across tiers and subranks", () => {
    expect(ladderHeight(pt(0, 12))).toBeGreaterThan(ladderHeight(pt(0, 11)));
    expect(ladderHeight(pt(0, 21))).toBeGreaterThan(ladderHeight(pt(0, 16)));
    expect(ladderHeight(pt(0, 81))).toBeGreaterThan(ladderHeight(pt(0, 76)));
  });
});
