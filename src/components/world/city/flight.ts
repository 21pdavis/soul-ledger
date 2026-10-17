import type { Shot } from "./tour";

// The pure part of the story-following camera: choosing how to fly between two slide shots and
// easing along the way. TourRig applies the results to the three.js camera each frame.

/** Cruise speed along the route, in world units a second. */
export const SPEED = 24;
/** How far the camera drifts sideways at the middle of a hop between stops. */
export const WEAVE = 2.4;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Ease in and out (cubic): 0 at 0, 1 at 1, never going backwards. */
export const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** How far through a flight the clock is, eased: 0 at the start, exactly 1 once it has landed. */
export const flightProgress = (now: number, start: number, duration: number) =>
  ease(Math.min(1, (now - start) / duration));

export interface Hop {
  /** Route flights move a distance along the route; free flights lerp. */
  route: { from: number; to: number } | null;
  duration: number;
  /** How high a free flight arcs at its middle: over the rooftops when changing lanes. */
  lift: number;
}

/**
 * Chooses how to fly from where the camera is to `shot`. `fromS` is its place on the route, or
 * null when it is off the route. Between two stops on the same lane it travels the route; across a
 * lane change it swoops free over the rooftops; to or from anywhere off the route it glides.
 * `freeDistance` is the straight-line distance to the shot, asked for only when needed.
 */
export function planHop(args: {
  fromS: number | null;
  shot: Shot;
  laneChanges: readonly number[];
  freeDistance: () => number;
}): Hop {
  const { fromS, shot, laneChanges, freeDistance } = args;
  const crossesLanes =
    fromS !== null &&
    shot.kind === "route" &&
    laneChanges.some((c) => (c - fromS) * (c - shot.s) < 0);
  const onRoute = fromS !== null && shot.kind === "route" && !crossesLanes;
  if (onRoute) {
    return {
      route: { from: fromS, to: shot.s },
      duration: clamp(Math.abs(shot.s - fromS) / SPEED, 1.4, 6),
      lift: 0,
    };
  }
  const dist = freeDistance();
  return {
    route: null,
    duration: clamp(1.2 + dist / 70, 1.6, 3.6),
    lift: crossesLanes ? clamp(dist * 0.35, 22, 45) : 0,
  };
}

/**
 * From the landing page's circling camera down into the story's opening shot: the same city, so
 * the story starts with a flight instead of a fade. A gentle glide, slower than a hop between
 * slides because it covers the whole descent, with no rooftop arc (it starts above them).
 */
export function planFlyIn(dist: number): Hop {
  return { route: null, duration: clamp(2.4 + dist / 60, 3, 5), lift: 0 };
}

/** The place along the route at eased progress `k`: exactly `to` once `k` reaches 1. */
export const routeS = (route: { from: number; to: number }, k: number) =>
  k >= 1 ? route.to : route.from + (route.to - route.from) * k;

/**
 * The sideways offset at progress `k`: the offset the hop began with fades out while a sine arc
 * (signed by `weaveSign`, which alternates per hop) swings out and back, so it is zero on landing.
 */
export const weaveOffset = (fromSide: number, k: number, weaveSign: number) =>
  fromSide * (1 - k) + Math.sin(Math.PI * k) * WEAVE * weaveSign;
