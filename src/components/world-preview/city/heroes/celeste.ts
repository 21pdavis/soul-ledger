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
 * Celeste (hero 81), sculpted to the measurements of her official reference sheet (1.64 m):
 * - long legs (hips at 54% of her height), a narrow waist, a small head under a big, curly
 *   lavender hairdo with a tall ponytail and a red ribbon, and a long spiral horn;
 * - a cropped brown leather jacket with puffy sleeves, a red choker;
 * - a striped bodysuit (blue down the middle, then white, then red) under a pink petal skirt,
 *   open at the front, with blue diamonds and a white frill;
 * - tattooed tights, tall black buckled boots, blue fingerless gloves.
 * She carries her twisted baton (its tip glows blue) and breathes Light Eater, a cone of purple
 * sparkles, through it. Units are metres, she faces +z, and +x is her left.
 */

const SKIN = "#f4c6aa";
const TIGHTS = "#c49884";
const TATTOO = "#7e5248";
const BOOT = "#221c1f";
const BUCKLE = "#b89a5a";
const JACKET = "#43302a";
const RED = "#94303f";
const WHITE = "#ece4d6";
const BLUE = "#3f5296";
const SKIRT = "#b85a7c";
const FRILL = "#f2eaf2";
const HAIR = "#9e92ee";
const HAIR_DEEP = "#7060d8";
const GLOVE = "#4e5eb0";
const RIBBON = "#b42c40";

// Heights measured off the sheet's front view (metres above the soles).
const HIP_Y = 0.89;
const KNEE_Y = 0.52;
const ANKLE_Y = 0.07;

const IDLE: Pose = {
  pelvis: [0, 0.95, 0],
  chest: [0, 1.3, 0],
  neck: [0, 1.41, 0],
  head: [0, 1.535, 0.005],
  gaze: [0, 1.53, 1],
  // Relaxed: left hand on the hip, baton loose in the right hand.
  shoulderL: [0.155, 1.375, -0.01],
  elbowL: [0.25, 1.15, -0.06],
  wristL: [0.13, 1.0, 0.02],
  shoulderR: [-0.155, 1.375, -0.01],
  elbowR: [-0.2, 1.11, 0.0],
  wristR: [-0.235, 0.88, 0.04],
  hipL: [0.075, HIP_Y, 0],
  kneeL: [0.085, KNEE_Y, 0.025],
  ankleL: [0.085, ANKLE_Y, 0],
  toeL: [0.095, 0.02, 0.14],
  hipR: [-0.075, HIP_Y, 0],
  kneeR: [-0.06, KNEE_Y, 0.04],
  ankleR: [-0.045, ANKLE_Y, 0.02],
  toeR: [-0.045, 0.02, 0.16],
};

const ATTACK: Pose = {
  pelvis: [0, 0.93, 0],
  chest: [0, 1.29, 0.03],
  neck: [0, 1.4, 0.04],
  head: [0, 1.525, 0.06],
  gaze: [0, 1.45, 1],
  // Light Eater: baton thrust forward at shoulder height, left arm back for balance, mid-stride.
  shoulderR: [-0.155, 1.375, 0.02],
  elbowR: [-0.14, 1.34, 0.27],
  wristR: [-0.09, 1.37, 0.52],
  shoulderL: [0.155, 1.375, 0.0],
  elbowL: [0.27, 1.2, -0.11],
  wristL: [0.36, 1.07, -0.2],
  hipL: [0.075, 0.87, 0.02],
  kneeL: [0.09, 0.5, 0.2],
  ankleL: [0.1, ANKLE_Y, 0.24],
  toeL: [0.11, 0.02, 0.38],
  hipR: [-0.075, 0.87, -0.02],
  kneeR: [-0.085, 0.49, -0.13],
  ankleR: [-0.1, 0.1, -0.33],
  toeR: [-0.1, 0.02, -0.21],
};

const ZIPLINE: Pose = {
  pelvis: [0, 0.95, 0.02],
  chest: [0, 1.3, 0.01],
  neck: [0, 1.415, 0.01],
  head: [0, 1.54, 0.03],
  gaze: [0.2, 1.5, 1],
  // Hanging by the right hand, left arm out, knees drawn up and trailing.
  shoulderR: [-0.155, 1.39, 0],
  elbowR: [-0.12, 1.68, 0.01],
  wristR: [-0.05, 1.93, 0.02],
  shoulderL: [0.155, 1.375, 0],
  elbowL: [0.33, 1.3, 0.05],
  wristL: [0.51, 1.33, 0.11],
  hipL: [0.075, HIP_Y, 0.01],
  kneeL: [0.1, 0.56, 0.2],
  ankleL: [0.095, 0.17, 0.08],
  toeL: [0.1, 0.13, 0.22],
  hipR: [-0.075, HIP_Y, 0],
  kneeR: [-0.085, 0.53, 0.07],
  ankleR: [-0.08, 0.12, -0.1],
  toeR: [-0.085, 0.05, 0.02],
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
const reach = (a: V3, b: V3) => Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) / 2 + 0.1;

/** The bodysuit: skin above the neckline, then blue, white and red stripes down the front. */
const bodysuit = (chest: V3) => (p: THREE.Vector3, base: THREE.Color, out: THREE.Color) => {
  if (p.y > chest[1] + 0.045 && Math.abs(p.x) < 0.07 && p.z > chest[2]) return void out.set(SKIN);
  const band = Math.abs(Math.round(p.x / 0.032));
  out.set(band === 0 ? BLUE : band === 1 ? WHITE : RED);
  // A dark belt band under the bust.
  if (p.y < chest[1] - 0.06 && p.y > chest[1] - 0.1 && p.z > 0) {
    out.lerp(new THREE.Color("#5a2a34"), 0.6);
  }
};

/** Tights over tattoos: a scatter of darker motifs on the skin tone. */
const tattoos = (p: THREE.Vector3, base: THREE.Color, out: THREE.Color) => {
  const k = Math.sin(p.x * 60 + p.y * 26) * Math.sin(p.y * 44 + p.z * 38);
  out.copy(base);
  if (k > 0.74) out.set(TATTOO);
};

/** The skirt: pink petals with blue diamonds, open at the front over the striped bodysuit. */
const skirtPaint = (pelvis: V3) => (p: THREE.Vector3, base: THREE.Color, out: THREE.Color) => {
  const a = Math.atan2(p.x - pelvis[0], p.z - pelvis[2]);
  out.copy(base);
  if (Math.abs(a) < 0.42) {
    const band = Math.abs(Math.round(p.x / 0.032));
    out.set(band === 0 ? BLUE : band === 1 ? WHITE : RED);
    return;
  }
  if (Math.abs(p.y - (pelvis[1] - 0.04)) < 0.02 && Math.cos(a * 6) > 0.85) out.set(BLUE);
};

/**
 * A ring of the skirt whose radius bulges in eight points toward the hem (`petal` 0 at the waist,
 * 1 at the hem), giving the skirt its pointed petals.
 */
function petalRing(center: V3, major: number, minor: number, petal: number): Field {
  const col = new THREE.Color(SKIRT);
  return (p) => {
    const a = Math.atan2(p.x - center[0], p.z - center[2]);
    const bulge = Math.pow(Math.max(0, Math.cos(a * 4)), 3) * 0.035 * petal * petal;
    const qx = Math.hypot(p.x - center[0], p.z - center[2]) - (major + bulge);
    return { d: Math.hypot(qx, p.y - center[1] + bulge * 0.6) - minor, c: col };
  };
}

/** Hair a little deeper toward the ends. */
const hairShade = (top: number) => (p: THREE.Vector3, base: THREE.Color, out: THREE.Color) => {
  out
    .copy(base)
    .lerp(new THREE.Color(HAIR_DEEP), THREE.MathUtils.clamp((top - p.y) / 0.25, 0, 0.75));
};

function arm(shoulder: V3, elbow: V3, wrist: V3): Field {
  const cuff = along(elbow, wrist, -0.035);
  const knuckles = along(elbow, wrist, 0.075);
  const fingers = along(elbow, wrist, 0.13);
  return bounded(
    blend(
      0.014,
      // Puffy leather sleeve to a gathered cuff.
      sphere(shoulder, 0.056, JACKET),
      limb(shoulder, elbow, 0.05, 0.046, JACKET),
      sphere(elbow, 0.05, JACKET),
      limb(elbow, cuff, 0.05, 0.047, JACKET),
      ring(cuff, 0.04, 0.012, JACKET),
      // Bare wrist, fingerless glove, fingertips.
      limb(cuff, wrist, 0.022, 0.021, SKIN),
      limb(wrist, knuckles, 0.026, 0.028, GLOVE),
      limb(knuckles, fingers, 0.023, 0.014, SKIN),
    ),
    mid(shoulder, fingers),
    reach(shoulder, fingers),
  );
}

function leg(hip: V3, knee: V3, ankle: V3, toe: V3): Field {
  const calf = lerp3(knee, ankle, 0.3);
  const bootTop = lerp3(ankle, knee, 0.76);
  return bounded(
    blend(
      0.012,
      paint(limb(hip, knee, 0.062, 0.04, TIGHTS), tattoos),
      paint(limb(knee, calf, 0.04, 0.043, TIGHTS), tattoos),
      paint(limb(calf, ankle, 0.043, 0.027, TIGHTS), tattoos),
      // The boot: a wide shaft, foot, spike heel and three buckles.
      limb(bootTop, lerp3(bootTop, ankle, 0.5), 0.052, 0.044, BOOT),
      limb(lerp3(bootTop, ankle, 0.5), ankle, 0.044, 0.034, BOOT),
      limb(ankle, toe, 0.033, 0.024, BOOT),
      limb(add(ankle, [0, -0.02, -0.03]), add(ankle, [0, -0.07, -0.035]), 0.016, 0.01, BOOT),
      ...[0.18, 0.4, 0.62].map((t) => ring(lerp3(ankle, bootTop, t), 0.046, 0.006, BUCKLE)),
    ),
    mid(hip, toe),
    reach(hip, toe),
  );
}

function head(pose: Pose): Field {
  const h = pose.head;
  const top = h[1] + 0.12;
  const bun = add(h, [0.02, 0.095, -0.04]);
  const tail1 = add(h, [0.085, 0.07, -0.07]);
  const tail2 = add(h, [0.11, -0.01, -0.06]);
  const tail3 = add(h, [0.1, -0.08, -0.035]);
  const hair = paint(
    blend(
      0.018,
      ellipsoid(add(h, [0, 0.03, -0.012]), [0.08, 0.072, 0.083], HAIR),
      // Pompadour and bun on top.
      sphere(add(h, [-0.012, 0.075, 0.03]), 0.05, HAIR),
      sphere(bun, 0.046, HAIR),
      // Big curls down her right side (the viewer's left).
      sphere(add(h, [-0.074, 0.005, 0.022]), 0.036, HAIR),
      sphere(add(h, [-0.08, -0.04, 0.012]), 0.031, HAIR),
      sphere(add(h, [-0.07, -0.075, 0.004]), 0.025, HAIR),
      // The swoop over her left eye, curling under at the cheek.
      sphere(add(h, [0.034, 0.025, 0.058]), 0.043, HAIR),
      sphere(add(h, [0.06, -0.015, 0.056]), 0.03, HAIR),
      sphere(add(h, [0.068, -0.05, 0.04]), 0.025, HAIR),
      // The tall ponytail falling on her left.
      limb(bun, tail1, 0.042, 0.048, HAIR),
      limb(tail1, tail2, 0.048, 0.04, HAIR),
      limb(tail2, tail3, 0.04, 0.028, HAIR),
    ),
    hairShade(top),
  );
  return bounded(
    blend(
      0.01,
      limb(pose.neck, add(h, [0, -0.06, -0.012]), 0.03, 0.028, SKIN),
      // Skull, cheeks and jaw tapering to a small chin, a small nose.
      ellipsoid(h, [0.064, 0.08, 0.073], SKIN),
      ellipsoid(add(h, [0, -0.04, 0.02]), [0.05, 0.044, 0.05], SKIN),
      sphere(add(h, [0, -0.072, 0.04]), 0.02, SKIN),
      sphere(add(h, [0, -0.008, 0.072]), 0.009, SKIN),
      hair,
      // The red ribbon on the ponytail and the red choker.
      sphere(add(bun, [0.035, -0.01, -0.01]), 0.018, RIBBON),
      limb(add(bun, [0.035, -0.01, -0.01]), add(bun, [0.07, 0.01, 0.0]), 0.012, 0.008, RIBBON),
      ring(add(pose.neck, [0, 0.02, 0]), 0.03, 0.007, RIBBON),
    ),
    add(h, [0.02, -0.02, -0.02]),
    0.26,
  );
}

function body(pose: Pose): Field {
  const { chest, pelvis } = pose;
  const underbust = add(lerp3(chest, pelvis, 0.18), [0, 0, 0.004]);
  const waist = lerp3(chest, pelvis, 0.4);
  const torso = paint(
    blend(
      0.025,
      ellipsoid(chest, [0.085, 0.075, 0.068], RED),
      sphere(add(chest, [0.04, -0.012, 0.048]), 0.042, RED),
      sphere(add(chest, [-0.04, -0.012, 0.048]), 0.042, RED),
      ellipsoid(underbust, [0.074, 0.05, 0.06], RED),
      ellipsoid(waist, [0.066, 0.06, 0.056], RED),
      ellipsoid(pelvis, [0.105, 0.07, 0.078], RED),
    ),
    bodysuit(chest),
  );
  // The cropped jacket: a thin shell over the shoulders and upper back, open at the front.
  const jacket = carve(
    blend(
      0.02,
      ellipsoid(add(chest, [0, 0.035, -0.016]), [0.165, 0.08, 0.082], JACKET),
      limb(
        add(pose.shoulderL, [-0.05, 0.02, -0.03]),
        add(pose.neck, [0.045, 0.06, -0.035]),
        0.02,
        0.016,
        JACKET,
      ),
      limb(
        add(pose.shoulderR, [0.05, 0.02, -0.03]),
        add(pose.neck, [-0.045, 0.06, -0.035]),
        0.02,
        0.016,
        JACKET,
      ),
    ),
    ellipsoid(add(chest, [0, -0.02, 0.07]), [0.07, 0.16, 0.055], JACKET),
    0.012,
    JACKET,
  );
  // The petal skirt: stacked rings flaring to the hem, then the white frill.
  const skirt = blend(
    0.012,
    paint(
      blend(
        0.034,
        ...[0, 1, 2, 3, 4, 5, 6, 7].map((t) =>
          petalRing(add(pelvis, [0, 0.15 - t * 0.032, 0]), 0.072 + t * 0.021, 0.026, t / 7),
        ),
      ),
      skirtPaint(pelvis),
    ),
    ring(add(pelvis, [0, -0.1, 0]), 0.235, 0.018, FRILL),
  );
  return bounded(blend(0.012, torso, jacket, skirt), add(chest, [0, -0.15, 0]), 0.38);
}

function celesteField(pose: Pose): Field {
  return blend(
    0.016,
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
  /** Her visible (right) eye; the left is under the hair swoop. */
  eye: { at: V3; brow: V3 };
  lips: V3;
  pendant: V3;
  baton: { from: V3; to: V3; bright: boolean };
  /** Light Eater: a cone of purple sparkles breathed out through the baton. */
  lightEater: { from: V3; dir: V3 } | null;
  /** Where her gripping hand meets the zip line. */
  grip: V3 | null;
}

export function celesteParts(name: PoseName): CelesteParts {
  const pose = CELESTE_POSES[name];
  const h = pose.head;
  const held = (elbow: V3, wrist: V3, length: number) => ({
    from: along(elbow, wrist, 0.05 - 0.1),
    to: along(elbow, wrist, 0.05 + length),
  });
  const baton =
    name === "attack"
      ? { ...held(pose.elbowR, pose.wristR, 0.42), bright: true }
      : name === "zipline"
        ? { ...held(pose.elbowL, pose.wristL, 0.4), bright: false }
        : {
            from: add(pose.wristR, [0.0, 0.08, -0.01]),
            to: add(pose.wristR, [-0.05, -0.44, 0.07]),
            bright: false,
          };
  return {
    horn: { base: add(h, [0, 0.07, 0.05]), tip: add(h, [0, 0.42, 0.1]) },
    eye: { at: add(h, [-0.026, 0.004, 0.068]), brow: add(h, [-0.028, 0.026, 0.068]) },
    lips: add(h, [0, -0.044, 0.066]),
    pendant: add(pose.chest, [0, 0.005, 0.09]),
    baton,
    lightEater: name === "attack" ? { from: baton.to, dir: [0.03, 0.02, 1] } : null,
    grip: name === "zipline" ? along(pose.elbowR, pose.wristR, 0.07) : null,
  };
}

/** Sculpts Celeste in a pose: one smooth-shaded mesh, painted, at about a 1.5 cm grid. */
export function buildCeleste(name: PoseName): THREE.BufferGeometry {
  const pose = CELESTE_POSES[name];
  const pts = Object.values(pose) as V3[];
  const lo: V3 = [0, 0, 0];
  const hi: V3 = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    lo[i] = Math.min(...pts.map((p) => p[i])) - 0.28;
    hi[i] = Math.max(...pts.map((p) => p[i])) + 0.28;
  }
  lo[1] = -0.1;
  return meshField(celesteField(pose), lo, hi, 0.015);
}
