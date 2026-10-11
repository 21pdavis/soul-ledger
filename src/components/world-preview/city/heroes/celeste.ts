import * as THREE from "three";
import {
  blend,
  bounded,
  carve,
  ellipsoid,
  limb,
  meshField,
  paint,
  ring,
  sphere,
  type Field,
  type V3,
} from "../sculpt";
import { lerp3, type Pose, type PoseName } from "./rig";

/**
 * Celeste (hero 81), sculpted from her official reference sheet: lavender hair with big curls and
 * a high ponytail tied with a red ribbon, a glowing unicorn horn, a cropped brown leather jacket
 * with puffy sleeves and a high collar, a striped red, white and blue corset, a pink ruffled skirt
 * with a white frill, tattooed tights, tall black buckled boots, blue fingerless gloves. She
 * carries her twisted baton (its tip glows blue) and throws star-shaped Radiant Daggers.
 * 1.64 m tall in her own units (metres); the scene scales her up.
 */

const SKIN = "#f4c6aa";
const TIGHTS = "#c99a8c";
const TATTOO = "#7a5048";
const BOOT = "#1f1a1d";
const BUCKLE = "#c9a24b";
const JACKET = "#3e2c27";
const RED = "#a02c40";
const WHITE = "#ece4d6";
const BLUE = "#3d4c8e";
const SKIRT = "#c64e70";
const FRILL = "#f4ecf4";
const HAIR = "#a594f4";
const HAIR_DEEP = "#6d5cd6";
const GLOVE = "#4c5cae";
const RIBBON = "#b42c40";

const IDLE: Pose = {
  pelvis: [0, 0.92, 0],
  chest: [0, 1.22, 0],
  neck: [0, 1.42, 0],
  head: [0, 1.545, 0.01],
  gaze: [0, 1.54, 1],
  // Left hand on the hip, right hand holding the baton down by her side.
  shoulderL: [0.17, 1.36, -0.01],
  elbowL: [0.29, 1.13, -0.07],
  wristL: [0.15, 0.98, 0.03],
  shoulderR: [-0.17, 1.36, -0.01],
  elbowR: [-0.23, 1.1, 0.02],
  wristR: [-0.26, 0.86, 0.08],
  hipL: [0.085, 0.86, 0],
  kneeL: [0.1, 0.47, 0.03],
  ankleL: [0.1, 0.09, 0],
  toeL: [0.11, 0.03, 0.13],
  hipR: [-0.085, 0.86, 0],
  kneeR: [-0.07, 0.47, 0.05],
  ankleR: [-0.05, 0.09, 0.02],
  toeR: [-0.05, 0.03, 0.15],
};

const ATTACK: Pose = {
  pelvis: [0, 0.9, 0],
  chest: [0, 1.21, 0.02],
  neck: [0, 1.41, 0.03],
  head: [0, 1.54, 0.05],
  gaze: [0.3, 1.5, 1],
  // Right arm up and back, throwing a Radiant Dagger; left arm forward, baton aimed.
  shoulderR: [-0.17, 1.36, 0],
  elbowR: [-0.29, 1.55, -0.04],
  wristR: [-0.25, 1.77, 0.08],
  shoulderL: [0.17, 1.36, 0.01],
  elbowL: [0.33, 1.3, 0.13],
  wristL: [0.46, 1.27, 0.31],
  hipL: [0.09, 0.86, 0],
  kneeL: [0.2, 0.48, 0.12],
  ankleL: [0.26, 0.09, 0.18],
  toeL: [0.29, 0.03, 0.31],
  hipR: [-0.09, 0.86, 0],
  kneeR: [-0.16, 0.46, -0.12],
  ankleR: [-0.2, 0.09, -0.24],
  toeR: [-0.21, 0.03, -0.11],
};

const ZIPLINE: Pose = {
  pelvis: [0, 0.92, 0.02],
  chest: [0, 1.22, 0.01],
  neck: [0, 1.42, 0.01],
  head: [0, 1.545, 0.03],
  gaze: [0.2, 1.5, 1],
  // Hanging by the right hand, left arm out for balance, legs tucked and trailing.
  shoulderR: [-0.17, 1.38, 0],
  elbowR: [-0.13, 1.72, 0.01],
  wristR: [-0.04, 1.97, 0.02],
  shoulderL: [0.17, 1.36, 0],
  elbowL: [0.36, 1.27, 0.05],
  wristL: [0.53, 1.3, 0.12],
  hipL: [0.085, 0.86, 0.01],
  kneeL: [0.12, 0.53, 0.19],
  ankleL: [0.11, 0.2, 0.07],
  toeL: [0.12, 0.17, 0.2],
  hipR: [-0.085, 0.86, 0],
  kneeR: [-0.1, 0.5, 0.08],
  ankleR: [-0.09, 0.15, -0.08],
  toeR: [-0.1, 0.08, 0.04],
};

export const CELESTE_POSES: Record<PoseName, Pose> = {
  idle: IDLE,
  attack: ATTACK,
  zipline: ZIPLINE,
};

const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const along = (a: V3, b: V3, d: number): V3 => {
  const v = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize();
  return [b[0] + v.x * d, b[1] + v.y * d, b[2] + v.z * d];
};
const mid = (a: V3, b: V3): V3 => lerp3(a, b, 0.5);
const reach = (a: V3, b: V3) => Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) / 2 + 0.12;

/** Corset stripes: blue, white and red running down the front. */
const stripes = (p: THREE.Vector3, base: THREE.Color, out: THREE.Color) => {
  if (p.y < 0.99) return void out.copy(base);
  // Wide enough to survive the coarse grid: blue down the middle, then white, then red.
  const band = Math.abs(Math.round(p.x / 0.05));
  out.set(band === 0 ? BLUE : band === 1 ? WHITE : RED);
};

/** Tights over tattoos: a scatter of darker motifs on the skin tone. */
const tattoos = (p: THREE.Vector3, base: THREE.Color, out: THREE.Color) => {
  const k = Math.sin(p.x * 48 + p.y * 22) * Math.sin(p.y * 36 + p.z * 30);
  out.copy(base);
  if (k > 0.72) out.set(TATTOO);
};

/** The skirt's blue diamonds around its middle. */
const diamonds = (pelvis: V3) => (p: THREE.Vector3, base: THREE.Color, out: THREE.Color) => {
  const a = Math.atan2(p.x - pelvis[0], p.z - pelvis[2]);
  const band = Math.abs(p.y - (pelvis[1] - 0.02)) < 0.022;
  out.copy(base);
  if (band && Math.cos(a * 7) > 0.8) out.set(BLUE);
};

/** Hair a little deeper toward the ends. */
const hairShade = (top: number) => (p: THREE.Vector3, base: THREE.Color, out: THREE.Color) => {
  out
    .copy(base)
    .lerp(new THREE.Color(HAIR_DEEP), THREE.MathUtils.clamp((top - p.y) / 0.45, 0, 0.7));
};

function arm(shoulder: V3, elbow: V3, wrist: V3): Field {
  const hand = along(elbow, wrist, 0.07);
  const fingers = along(elbow, wrist, 0.12);
  return bounded(
    blend(
      0.02,
      sphere(shoulder, 0.068, JACKET),
      limb(shoulder, elbow, 0.058, 0.052, JACKET),
      sphere(elbow, 0.06, JACKET),
      limb(elbow, wrist, 0.052, 0.045, JACKET),
      // Puffed cuff, then the fingerless glove and bare fingertips.
      sphere(wrist, 0.05, JACKET),
      limb(wrist, hand, 0.032, 0.034, GLOVE),
      limb(hand, fingers, 0.03, 0.022, SKIN),
    ),
    mid(shoulder, wrist),
    reach(shoulder, wrist) + 0.08,
  );
}

function leg(hip: V3, knee: V3, ankle: V3, toe: V3): Field {
  const bootTop = lerp3(ankle, knee, 0.62);
  return bounded(
    blend(
      0.02,
      paint(limb(hip, knee, 0.072, 0.048, TIGHTS), tattoos),
      paint(limb(knee, bootTop, 0.047, 0.044, TIGHTS), tattoos),
      // The boot: shaft, foot and heel, with two buckles.
      limb(bootTop, ankle, 0.05, 0.044, BOOT),
      limb(ankle, toe, 0.042, 0.03, BOOT),
      limb(ankle, add(ankle, [0, -0.065, -0.035]), 0.022, 0.018, BOOT),
      ring(lerp3(ankle, knee, 0.22), 0.047, 0.007, BUCKLE),
      ring(lerp3(ankle, knee, 0.42), 0.047, 0.007, BUCKLE),
    ),
    mid(hip, toe),
    reach(hip, toe),
  );
}

function head(pose: Pose): Field {
  const h = pose.head;
  const top = h[1] + 0.2;
  const p0 = add(h, [0, 0.13, -0.07]);
  const p1 = add(h, [0.05, 0.1, -0.2]);
  const p2 = add(h, [0.1, -0.05, -0.23]);
  const p3 = add(h, [0.07, -0.2, -0.16]);
  const p4 = add(h, [0.02, -0.27, -0.11]);
  const hair = paint(
    blend(
      0.03,
      ellipsoid(add(h, [0, 0.05, -0.012]), [0.106, 0.09, 0.108], HAIR),
      // A big pompadour on top and a high bun behind it.
      sphere(add(h, [-0.02, 0.105, 0.035]), 0.072, HAIR),
      ellipsoid(add(h, [0, 0.13, -0.035]), [0.082, 0.07, 0.082], HAIR),
      // The big swoop over her left eye, and the curls below it.
      sphere(add(h, [0.05, 0.045, 0.082]), 0.06, HAIR),
      sphere(add(h, [0.082, -0.012, 0.085]), 0.046, HAIR),
      sphere(add(h, [0.097, -0.072, 0.056]), 0.041, HAIR),
      // Fuller curls down her right side.
      sphere(add(h, [-0.088, 0.0, -0.005]), 0.048, HAIR),
      sphere(add(h, [-0.092, -0.07, -0.02]), 0.04, HAIR),
      // The ponytail sweeping back and down into a curl.
      limb(p0, p1, 0.058, 0.078, HAIR),
      limb(p1, p2, 0.078, 0.066, HAIR),
      limb(p2, p3, 0.066, 0.046, HAIR),
      sphere(p4, 0.052, HAIR),
      limb(p3, p4, 0.046, 0.04, HAIR),
    ),
    hairShade(top),
  );
  return bounded(
    blend(
      0.015,
      limb(pose.neck, add(h, [0, -0.07, -0.01]), 0.038, 0.036, SKIN),
      ellipsoid(h, [0.086, 0.104, 0.094], SKIN),
      sphere(add(h, [0, -0.05, 0.028]), 0.058, SKIN),
      sphere(add(h, [0, -0.006, 0.095]), 0.013, SKIN),
      hair,
      // The red ribbon at the ponytail.
      sphere(p0, 0.03, RIBBON),
      limb(p0, add(p0, [0.06, 0.03, 0.02]), 0.018, 0.012, RIBBON),
      limb(p0, add(p0, [-0.055, 0.035, 0.0]), 0.018, 0.012, RIBBON),
    ),
    add(h, [0.02, 0, -0.05]),
    0.4,
  );
}

function body(pose: Pose): Field {
  const { chest, pelvis } = pose;
  const waist = lerp3(chest, pelvis, 0.55);
  const torso = paint(
    blend(
      0.05,
      ellipsoid(chest, [0.132, 0.13, 0.092], RED),
      ellipsoid(waist, [0.098, 0.09, 0.074], RED),
      sphere(add(chest, [0.05, -0.005, 0.064]), 0.052, RED),
      sphere(add(chest, [-0.05, -0.005, 0.064]), 0.052, RED),
      ellipsoid(pelvis, [0.138, 0.085, 0.094], RED),
    ),
    stripes,
  );
  // The cropped jacket: a shell over the shoulders and back, open down the front, high collar.
  const jacket = carve(
    blend(
      0.03,
      ellipsoid(add(chest, [0, 0.05, -0.012]), [0.168, 0.125, 0.112], JACKET),
      limb(
        add(pose.shoulderL, [-0.09, 0.0, -0.03]),
        add(pose.neck, [0.06, 0.07, -0.05]),
        0.028,
        0.024,
        JACKET,
      ),
      limb(
        add(pose.shoulderR, [0.09, 0.0, -0.03]),
        add(pose.neck, [-0.06, 0.07, -0.05]),
        0.028,
        0.024,
        JACKET,
      ),
    ),
    ellipsoid(add(chest, [0, -0.02, 0.105]), [0.085, 0.2, 0.07], JACKET),
    0.02,
    JACKET,
  );
  // The flared skirt with its blue diamonds and white frill.
  const skirt = blend(
    0.012,
    // Stacked rings, wider toward the hem: a flared ruffle, open underneath for the legs.
    paint(
      blend(
        0.02,
        ...[0, 1, 2, 3, 4, 5].map((t) =>
          ring(add(pelvis, [0, 0.07 - t * 0.028, 0]), 0.112 + t * 0.02, 0.03, SKIRT),
        ),
      ),
      diamonds(pelvis),
    ),
    ring(add(pelvis, [0, -0.082, 0]), 0.222, 0.022, FRILL),
  );
  return bounded(blend(0.02, torso, jacket, skirt), add(chest, [0, -0.12, 0]), 0.45);
}

function celesteField(pose: Pose): Field {
  return blend(
    0.03,
    body(pose),
    head(pose),
    arm(pose.shoulderL, pose.elbowL, pose.wristL),
    arm(pose.shoulderR, pose.elbowR, pose.wristR),
    leg(pose.hipL, pose.kneeL, pose.ankleL, pose.toeL),
    leg(pose.hipR, pose.kneeR, pose.ankleR, pose.toeR),
  );
}

/** The small, shiny or held parts, placed per pose (all in the model's metres). */
export interface CelesteParts {
  horn: { base: V3; tip: V3 };
  eyes: V3[];
  lips: V3;
  pendant: V3;
  baton: { from: V3; to: V3; bright: boolean };
  dagger: { at: V3; dir: V3 } | null;
  /** Where her gripping hand meets the zip line. */
  grip: V3 | null;
}

export function celesteParts(name: PoseName): CelesteParts {
  const pose = CELESTE_POSES[name];
  const h = pose.head;
  const hold = (elbow: V3, wrist: V3, length: number, back = 0.12) => ({
    from: along(elbow, wrist, 0.05 - back),
    to: along(elbow, wrist, 0.05 + length),
  });
  const batonIn =
    name === "attack"
      ? { ...hold(pose.elbowL, pose.wristL, 0.55), bright: true }
      : name === "zipline"
        ? { ...hold(pose.elbowL, pose.wristL, 0.45), bright: false }
        : {
            from: add(pose.wristR, [0.0, 0.1, -0.02]),
            to: add(pose.wristR, [-0.06, -0.48, 0.06]),
            bright: false,
          };
  return {
    horn: { base: add(h, [0.0, 0.1, 0.07]), tip: add(h, [0.0, 0.31, 0.15]) },
    // Her right eye shows; the left is under the hair swoop.
    eyes: [add(h, [-0.034, 0.008, 0.09])],
    lips: add(h, [0, -0.055, 0.083]),
    pendant: add(pose.chest, [0, 0.04, 0.115]),
    baton: batonIn,
    dagger:
      name === "attack"
        ? { at: along(pose.elbowR, pose.wristR, 0.13), dir: [0.15, 1, 0.35] }
        : null,
    grip: name === "zipline" ? along(pose.elbowR, pose.wristR, 0.08) : null,
  };
}

/** Sculpts Celeste in a pose: one smooth-shaded mesh, painted, at about a 2 cm grid. */
export function buildCeleste(name: PoseName): THREE.BufferGeometry {
  const pose = CELESTE_POSES[name];
  const pts = Object.values(pose) as V3[];
  const lo: V3 = [0, 0, 0];
  const hi: V3 = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    lo[i] = Math.min(...pts.map((p) => p[i])) - 0.3;
    hi[i] = Math.max(...pts.map((p) => p[i])) + 0.3;
  }
  lo[1] = -0.1;
  return meshField(celesteField(pose), lo, hi, 0.02);
}
