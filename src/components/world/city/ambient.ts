import type { Vec3 } from "./layout";

// The landing page's camera: with no story to follow yet, it circles the city slowly from above.

export const AMBIENT = {
  /** Distance from the middle of the map: over its edge, high enough to see across the city. */
  radius: 135,
  height: 78,
  /** Seconds for one full lap. */
  lap: 300,
  /** Seconds to glide back up into the circle after a story ("New lookup"). */
  returnSeconds: 3.5,
} as const;

/** Where the camera is `t` seconds in, and what it looks at (the middle of the map). */
export function ambientPose(t: number): { pos: Vec3; look: Vec3 } {
  // Start over the south end, where the story's opening shot is, and turn clockwise.
  const a = Math.PI / 2 - (2 * Math.PI * t) / AMBIENT.lap;
  return {
    pos: [Math.cos(a) * AMBIENT.radius, AMBIENT.height, Math.sin(a) * AMBIENT.radius],
    look: [0, 0, 0],
  };
}
