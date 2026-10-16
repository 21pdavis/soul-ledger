import { describe, expect, it } from "vitest";
import { LANE_CHANGES, type Shot } from "@/components/world/city/tour";
import {
  WEAVE,
  ease,
  flightProgress,
  planHop,
  routeS,
  weaveOffset,
} from "@/components/world/city/flight";

// The story-following camera (m3-plan, "eased transitions"): how a hop between two slide shots is
// chosen and eased. The slide to shot map itself is covered in tour-shots.test.ts.

const route = (s: number): Shot => ({ kind: "route", s, look: [0, 0, 0] });
const free: Shot = { kind: "free", pos: [0, 50, 0], look: [0, 0, 0] };
const [laneA, laneB] = [...LANE_CHANGES].sort((a, b) => a - b);
const hop = (fromS: number | null, shot: Shot, freeDistance = 100) =>
  planHop({ fromS, shot, laneChanges: LANE_CHANGES, freeDistance: () => freeDistance });

describe("ease", () => {
  it("starts at 0 and lands exactly on 1", () => {
    expect(ease(0)).toBe(0);
    expect(ease(1)).toBe(1);
  });

  it("is monotonic and symmetric about the middle", () => {
    let prev = -1;
    for (let i = 0; i <= 100; i++) {
      const v = ease(i / 100);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
    expect(ease(0.5)).toBeCloseTo(0.5, 10);
    expect(ease(0.25) + ease(0.75)).toBeCloseTo(1, 10);
  });
});

describe("flightProgress", () => {
  it("is 0 at the start, eased in between, and clamped to 1 afterwards", () => {
    expect(flightProgress(10, 10, 2)).toBe(0);
    expect(flightProgress(11, 10, 2)).toBeCloseTo(0.5, 10);
    expect(flightProgress(12, 10, 2)).toBe(1);
    expect(flightProgress(99, 10, 2)).toBe(1);
  });

  it("treats a flight that began at -Infinity as already landed", () => {
    expect(flightProgress(0, -Infinity, 1)).toBe(1);
  });
});

describe("planHop: route versus free flight", () => {
  it("travels the route between two route shots on the same lane", () => {
    const h = hop(laneA - 30, route(laneA - 10));
    expect(h.route).toEqual({ from: laneA - 30, to: laneA - 10 });
    expect(h.lift).toBe(0);
  });

  it("flies free, with a lift, when the hop crosses a lane change", () => {
    const h = hop(laneA - 30, route(laneA + 30));
    expect(h.route).toBeNull();
    expect(h.lift).toBeGreaterThanOrEqual(22);
    expect(h.lift).toBeLessThanOrEqual(45);
  });

  it("crosses a lane change in either direction", () => {
    expect(hop(laneB + 10, route(laneB - 10)).route).toBeNull();
  });

  it("flies free without lift to a shot off the route", () => {
    const h = hop(laneA - 30, free);
    expect(h.route).toBeNull();
    expect(h.lift).toBe(0);
  });

  it("flies free from a camera that is off the route", () => {
    const h = hop(null, route(laneA - 10));
    expect(h.route).toBeNull();
    expect(h.lift).toBe(0);
  });
});

describe("planHop: duration and lift", () => {
  it("route hops take distance / 24 s, clamped to 1.4..6", () => {
    expect(hop(0, route(48)).duration).toBeCloseTo(2, 10);
    expect(hop(0, route(1)).duration).toBe(1.4);
    expect(hop(laneA - 400, route(laneA - 1)).duration).toBe(6);
  });

  it("free hops take 1.2 + distance / 70 s, clamped to 1.6..3.6", () => {
    expect(hop(null, free, 70).duration).toBeCloseTo(2.2, 10);
    expect(hop(null, free, 0).duration).toBe(1.6);
    expect(hop(null, free, 10_000).duration).toBe(3.6);
  });

  it("sizes the lane-change lift from the distance, within 22..45", () => {
    expect(hop(laneA - 1, route(laneA + 1), 10).lift).toBe(22);
    expect(hop(laneA - 1, route(laneA + 1), 100).lift).toBeCloseTo(35, 10);
    expect(hop(laneA - 1, route(laneA + 1), 10_000).lift).toBe(45);
  });
});

describe("routeS", () => {
  it("starts at the first stop and lands exactly on the target stop", () => {
    expect(routeS({ from: 12, to: 80 }, 0)).toBe(12);
    expect(routeS({ from: 12, to: 80 }, 1)).toBe(80);
  });

  it("also lands exactly when travelling backwards", () => {
    expect(routeS({ from: 80, to: 12 }, 1)).toBe(12);
    expect(routeS({ from: 80, to: 12 }, 0.5)).toBeCloseTo(46, 10);
  });
});

describe("weaveOffset", () => {
  it("is the starting offset at k = 0 and zero at k = 1, so it lands on the route", () => {
    expect(weaveOffset(1.7, 0, 1)).toBeCloseTo(1.7, 10);
    expect(weaveOffset(1.7, 1, 1)).toBeCloseTo(0, 10);
    expect(weaveOffset(0, 1, -1)).toBeCloseTo(0, 10);
  });

  it("peaks at WEAVE in the middle of a hop, on the side the sign picks", () => {
    expect(weaveOffset(0, 0.5, 1)).toBeCloseTo(WEAVE, 10);
    expect(weaveOffset(0, 0.5, -1)).toBeCloseTo(-WEAVE, 10);
  });
});
