import { describe, expect, it } from "vitest";
import { AMBIENT, ambientPose } from "@/components/world/city/ambient";
import { MAP_RADIUS } from "@/components/world/city/layout";

// The landing page's camera: with no story to follow, it circles the city slowly from above.

const dist = (a: number[], b: number[]) => Math.hypot(...a.map((v, i) => v - b[i]));

describe("ambientPose", () => {
  it("circles the city from outside the map, at a steady height, looking at its middle", () => {
    for (const t of [0, 13, 50, 200]) {
      const { pos, look } = ambientPose(t);
      expect(Math.hypot(pos[0], pos[2])).toBeCloseTo(AMBIENT.radius);
      expect(pos[1]).toBe(AMBIENT.height);
      expect(look).toEqual([0, 0, 0]);
    }
    expect(AMBIENT.radius).toBeGreaterThan(MAP_RADIUS);
  });

  it("comes back round to where it started after one lap", () => {
    expect(dist(ambientPose(AMBIENT.lap).pos, ambientPose(0).pos)).toBeCloseTo(0);
  });

  it("drifts slowly: never more than a few units a second", () => {
    expect(dist(ambientPose(1).pos, ambientPose(0).pos)).toBeLessThan(5);
    expect(dist(ambientPose(1).pos, ambientPose(0).pos)).toBeGreaterThan(0);
  });
});
