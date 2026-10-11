import type { V3 } from "../sculpt";

/**
 * A hero pose: where each joint sits, in metres, with the hero facing +z and +x on their left.
 * Models are sculpted around the joints, so a new pose is a new set of positions (static poses,
 * no rig, per ADR 0068).
 */
export interface Pose {
  pelvis: V3;
  chest: V3;
  neck: V3;
  head: V3;
  /** Which way the head faces (a point it looks toward). */
  gaze: V3;
  shoulderL: V3;
  elbowL: V3;
  wristL: V3;
  shoulderR: V3;
  elbowR: V3;
  wristR: V3;
  hipL: V3;
  kneeL: V3;
  ankleL: V3;
  toeL: V3;
  hipR: V3;
  kneeR: V3;
  ankleR: V3;
  toeR: V3;
}

export type PoseName = "idle" | "attack" | "zipline";

/** Moves every joint of a pose by an offset (for lifting a pose off the ground). */
export function shift(pose: Pose, by: V3): Pose {
  const out = {} as Pose;
  for (const [k, v] of Object.entries(pose) as [keyof Pose, V3][]) {
    out[k] = [v[0] + by[0], v[1] + by[1], v[2] + by[2]];
  }
  return out;
}

export const lerp3 = (a: V3, b: V3, t: number): V3 => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];
