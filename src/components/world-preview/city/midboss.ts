import { Vector3 } from "three";
import {
  blend,
  carve,
  ellipsoid,
  limb,
  meshField,
  mirrorX,
  ring,
  sphere,
  type Field,
  type V3,
} from "./sculpt";

/**
 * The mid boss, sculpted after the in-game model: a tall olive worm on a skirt of curling
 * tentacles, a ribbed trunk swelling into a heavy upper body, a hood that splits at the top to
 * cradle the glass dome, a vertical mouth groove with a hanging tongue, and two pairs of thin arms.
 * It faces +z and stands about 14 units tall. The dome, eye, teeth and claws are separate meshes
 * (they are too small or too shiny for the sculpt), placed from `MIDBOSS_PARTS`.
 */

const OLIVE = "#6f7f2c";
const OLIVE_DARK = "#4e5a1e";
const BELLY = "#8c9a3a";
const LIME = "#b9c63a";
const MAROON = "#5a1e28";

function tentacles(): Field[] {
  const out: Field[] = [];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + 0.2;
    const at = (r: number, y: number, twist = 0): V3 => [
      Math.sin(a + twist) * r,
      y,
      Math.cos(a + twist) * r,
    ];
    // Out along the floor, then the tip curls back up.
    out.push(limb(at(0.6, 1.2), at(2.6, 0.45, 0.08), 0.62, 0.42, LIME));
    out.push(limb(at(2.6, 0.45, 0.08), at(4.2, 0.4, 0.22), 0.42, 0.3, LIME));
    out.push(limb(at(4.2, 0.4, 0.22), at(4.9, 1.1, 0.42), 0.32, 0.27, LIME));
  }
  return out;
}

/** One side's arms (mirrored across x): an upper pair from the shoulders, a lower pair below. */
const arms = mirrorX(
  blend(
    0.35,
    limb([2.8, 9.6, 0.4], [3.9, 8.5, 1.1], 0.5, 0.38, OLIVE),
    limb([3.9, 8.5, 1.1], [4.3, 6.5, 1.6], 0.38, 0.3, OLIVE),
    limb([1.9, 6.8, 0.5], [3.0, 5.9, 1.1], 0.42, 0.34, OLIVE),
    limb([3.0, 5.9, 1.1], [3.2, 4.1, 1.5], 0.34, 0.28, OLIVE),
  ),
);

/** The hood's two lips, rising either side of the dome (mirrored). */
const hood = mirrorX(blend(0.5, limb([1.1, 9.8, 0], [1.55, 12.2, 0.2], 1.15, 0.75, OLIVE_DARK)));

const body = blend(
  1.1,
  // Trunk, widening upward, with ribs.
  limb([0, 0.8, 0], [0, 6.6, 0], 1.25, 1.7, OLIVE),
  ...[2.1, 3.3, 4.5, 5.7].map((y, i) => ring([0, y, 0], 1.3 + i * 0.1, 0.22, OLIVE_DARK)),
  // The heavy upper body, with a paler belly and shoulder lumps.
  ellipsoid([0, 8.8, 0], [3.2, 2.9, 2.4], OLIVE),
  ellipsoid([0, 8.2, 1.0], [1.9, 2.1, 1.6], BELLY),
  sphere([2.6, 10.0, 0.1], 1.3, OLIVE),
  sphere([-2.6, 10.0, 0.1], 1.3, OLIVE),
  hood,
);

const withLimbs = blend(0.6, body, blend(0.45, ...tentacles()), arms);

/** The mouth: a vertical groove down the front, and the cup at the top that holds the dome. */
const carved = carve(
  carve(withLimbs, limb([0, 7.2, 2.85], [0, 10.0, 2.55], 0.5, 0.4, MAROON), 0.3, MAROON),
  sphere([0, 12.3, 0.15], 1.55, OLIVE_DARK),
  0.35,
  OLIVE_DARK,
);

/** The tongue, hanging from the mouth down the trunk. */
const field = blend(0.2, carved, limb([0, 7.6, 2.3], [0.15, 3.6, 1.95], 0.3, 0.24, MAROON));

/**
 * Builds the mesh: about a 0.3-unit grid, so it reads low-poly but organic. The grid reaches below
 * the floor so the tentacles' undersides close (the pit floor hides that part).
 */
export function buildMidBossGeometry() {
  return meshField(field, [-6, -1.2, -6], [6, 15, 6], 0.3);
}

/** How far forward (+z) the body's surface is at a height, found by stepping in from the front. */
export function frontAt(y: number, x = 0): number {
  const p = new Vector3();
  for (let z = 5; z > 0; z -= 0.02) if (field(p.set(x, y, z)).d < 0) return z;
  return 0;
}

/** The small and shiny parts, in the boss's own frame. */
export const MIDBOSS_PARTS = {
  dome: { at: [0, 12.35, 0.15] as V3, r: 1.6 },
  eye: { at: [0, 12.3, 0.35] as V3, r: 0.95 },
  /** Teeth line the groove, pointing inward from each side, set into the surface. */
  teeth: Array.from({ length: 5 }, (_, i) => 9.6 - i * 0.5),
  /** Hands at the ends of the four arms, for the claws. */
  hands: [
    [4.3, 6.5, 1.6],
    [-4.3, 6.5, 1.6],
    [3.2, 4.1, 1.5],
    [-3.2, 4.1, 1.5],
  ] as V3[],
};
