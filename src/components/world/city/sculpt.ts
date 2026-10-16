import * as THREE from "three";

/**
 * A tiny sculpting kit for low-poly organic models (N64-era look, a little smoother): shapes are
 * signed distance fields blended with smooth unions, then meshed once with surface nets at a
 * coarse grid. The result is one continuous body with smooth normals, colours painted per shape
 * and blended where shapes meet, and soft shadow baked into the creases.
 */

export type V3 = [number, number, number];

/** Distance from a point to a shape (negative inside) and the colour of the shape there. */
export interface Sample {
  d: number;
  c: THREE.Color;
}
export type Field = (p: THREE.Vector3) => Sample;

const tmp = new THREE.Vector3();
const tmp2 = new THREE.Vector3();

export function sphere(center: V3, r: number, color: string): Field {
  const c = new THREE.Vector3(...center);
  const col = new THREE.Color(color);
  return (p) => ({ d: p.distanceTo(c) - r, c: col });
}

/** An ellipsoid (approximate distance, fine for blending). */
export function ellipsoid(center: V3, radii: V3, color: string): Field {
  const c = new THREE.Vector3(...center);
  const r = new THREE.Vector3(...radii);
  const col = new THREE.Color(color);
  return (p) => {
    tmp.subVectors(p, c);
    const k0 = Math.hypot(tmp.x / r.x, tmp.y / r.y, tmp.z / r.z);
    const k1 = Math.hypot(tmp.x / (r.x * r.x), tmp.y / (r.y * r.y), tmp.z / (r.z * r.z));
    return { d: k1 === 0 ? -Math.min(r.x, r.y, r.z) : (k0 * (k0 - 1)) / k1, c: col };
  };
}

/** A capsule from a to b whose radius tapers from ra to rb: limbs, tentacles, tongues. */
export function limb(a: V3, b: V3, ra: number, rb: number, color: string): Field {
  const A = new THREE.Vector3(...a);
  const B = new THREE.Vector3(...b);
  const ab = new THREE.Vector3().subVectors(B, A);
  const len2 = ab.lengthSq();
  const col = new THREE.Color(color);
  return (p) => {
    tmp.subVectors(p, A);
    const t = THREE.MathUtils.clamp(tmp.dot(ab) / len2, 0, 1);
    tmp2.copy(A).addScaledVector(ab, t);
    return { d: p.distanceTo(tmp2) - THREE.MathUtils.lerp(ra, rb, t), c: col };
  };
}

/** A ring lying flat (around y) at a height: ribs and bands. */
export function ring(center: V3, major: number, minor: number, color: string): Field {
  const c = new THREE.Vector3(...center);
  const col = new THREE.Color(color);
  return (p) => {
    const qx = Math.hypot(p.x - c.x, p.z - c.z) - major;
    return { d: Math.hypot(qx, p.y - c.y) - minor, c: col };
  };
}

const mixed = new THREE.Color();

/**
 * Smoothly melts shapes together; k is how far the blend reaches. Colours blend with it. Each
 * field reuses one colour object for its result, so read a sample's colour before sampling again.
 */
export function blend(k: number, ...fields: Field[]): Field {
  const c = new THREE.Color();
  return (p) => {
    let acc = fields[0](p);
    let d = acc.d;
    c.copy(acc.c);
    for (let i = 1; i < fields.length; i++) {
      acc = fields[i](p);
      const h = THREE.MathUtils.clamp(0.5 + (0.5 * (acc.d - d)) / k, 0, 1);
      d = THREE.MathUtils.lerp(acc.d, d, h) - k * h * (1 - h);
      c.lerpColors(acc.c, mixed.copy(c), h);
    }
    return { d, c };
  };
}

/** Carves `cut` out of `base` with a soft edge, tinting the carved surface `tint`. */
export function carve(base: Field, cut: Field, k: number, tint: string): Field {
  const t = new THREE.Color(tint);
  const out = new THREE.Color();
  return (p) => {
    const a = base(p);
    const b = cut(p);
    const h = THREE.MathUtils.clamp(0.5 - (0.5 * (a.d + b.d)) / k, 0, 1);
    return {
      d: THREE.MathUtils.lerp(a.d, -b.d, h) + k * h * (1 - h),
      c: out.copy(a.c).lerp(t, Math.min(1, h * 1.6)),
    };
  };
}

/**
 * Repaints a shape: `fn` gets the point and the shape's own colour and writes the colour to use
 * into `out`. For stripes, patterns and tattoos.
 */
export function paint(
  f: Field,
  fn: (p: THREE.Vector3, base: THREE.Color, out: THREE.Color) => void,
): Field {
  const out = new THREE.Color();
  return (p) => {
    const s = f(p);
    fn(p, s.c, out);
    return { d: s.d, c: out };
  };
}

/**
 * Wraps a field so points farther than `margin` from a bounding sphere skip it: blends of many small
 * shapes (a whole figure) then cost only the shapes near each sample.
 */
export function bounded(f: Field, center: V3, radius: number): Field {
  const c = new THREE.Vector3(...center);
  const far = new THREE.Color();
  return (p) => {
    const out = p.distanceTo(c) - radius;
    return out > 0.25 ? { d: out, c: far } : f(p);
  };
}

/** Mirrors a field across x = 0, for symmetric creatures. */
export function mirrorX(f: Field): Field {
  const q = new THREE.Vector3();
  return (p) => f(q.set(Math.abs(p.x), p.y, p.z));
}

/**
 * Meshes a field with naive surface nets: one vertex per grid cell the surface crosses, at the
 * average of its edge crossings, and one quad per crossed grid edge. Normals come from the field's
 * gradient (smooth), colours from the field, darkened where the surface sits in a crease.
 */
export function meshField(field: Field, min: V3, max: V3, cell: number): THREE.BufferGeometry {
  const nx = Math.ceil((max[0] - min[0]) / cell) + 1;
  const ny = Math.ceil((max[1] - min[1]) / cell) + 1;
  const nz = Math.ceil((max[2] - min[2]) / cell) + 1;
  const at = (i: number, j: number, k: number) => i + nx * (j + ny * k);
  const values = new Float32Array(nx * ny * nz);
  const p = new THREE.Vector3();
  // Coarse pass first (every 4th sample). Fine samples far from the surface take the nearest
  // coarse value: only the sign matters there, and a distance field cannot cross zero sooner than
  // its own value, so this skips most of the work without changing the mesh.
  const S = 4;
  const cx = Math.ceil((nx - 1) / S) + 1;
  const cy = Math.ceil((ny - 1) / S) + 1;
  const cz = Math.ceil((nz - 1) / S) + 1;
  const coarse = new Float32Array(cx * cy * cz);
  for (let k = 0; k < cz; k++) {
    for (let j = 0; j < cy; j++) {
      for (let i = 0; i < cx; i++) {
        p.set(min[0] + i * S * cell, min[1] + j * S * cell, min[2] + k * S * cell);
        coarse[i + cx * (j + cy * k)] = field(p).d;
      }
    }
  }
  const safe = S * cell * 0.9;
  for (let k = 0; k < nz; k++) {
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const near = coarse[Math.round(i / S) + cx * (Math.round(j / S) + cy * Math.round(k / S))];
        if (Math.abs(near) > safe) {
          values[at(i, j, k)] = near;
          continue;
        }
        p.set(min[0] + i * cell, min[1] + j * cell, min[2] + k * cell);
        values[at(i, j, k)] = field(p).d;
      }
    }
  }

  const corners = [
    [0, 0, 0],
    [1, 0, 0],
    [0, 1, 0],
    [1, 1, 0],
    [0, 0, 1],
    [1, 0, 1],
    [0, 1, 1],
    [1, 1, 1],
  ];
  const edges = [
    [0, 1],
    [2, 3],
    [4, 5],
    [6, 7],
    [0, 2],
    [1, 3],
    [4, 6],
    [5, 7],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
  ];
  const vertexOf = new Int32Array((nx - 1) * (ny - 1) * (nz - 1)).fill(-1);
  const cellAt = (i: number, j: number, k: number) => i + (nx - 1) * (j + (ny - 1) * k);
  const positions: number[] = [];
  const v = new Float32Array(8);
  for (let k = 0; k < nz - 1; k++) {
    for (let j = 0; j < ny - 1; j++) {
      for (let i = 0; i < nx - 1; i++) {
        let inside = 0;
        for (let c = 0; c < 8; c++) {
          v[c] = values[at(i + corners[c][0], j + corners[c][1], k + corners[c][2])];
          if (v[c] < 0) inside++;
        }
        if (inside === 0 || inside === 8) continue;
        let sx = 0;
        let sy = 0;
        let sz = 0;
        let n = 0;
        for (const [a, b] of edges) {
          if (v[a] < 0 === v[b] < 0) continue;
          const t = v[a] / (v[a] - v[b]);
          sx += corners[a][0] + (corners[b][0] - corners[a][0]) * t;
          sy += corners[a][1] + (corners[b][1] - corners[a][1]) * t;
          sz += corners[a][2] + (corners[b][2] - corners[a][2]) * t;
          n++;
        }
        vertexOf[cellAt(i, j, k)] = positions.length / 3;
        positions.push(
          min[0] + (i + sx / n) * cell,
          min[1] + (j + sy / n) * cell,
          min[2] + (k + sz / n) * cell,
        );
      }
    }
  }

  const index: number[] = [];
  const quad = (a: number, b: number, c: number, d: number, flip: boolean) => {
    if (a < 0 || b < 0 || c < 0 || d < 0) return;
    // Wound so the outside faces out (the side the browser draws).
    if (flip) index.push(a, b, c, a, c, d);
    else index.push(a, c, b, a, d, c);
  };
  for (let k = 1; k < nz - 1; k++) {
    for (let j = 1; j < ny - 1; j++) {
      for (let i = 0; i < nx - 1; i++) {
        // Edges along x, shared by the four cells around them in y and z.
        const a = values[at(i, j, k)] < 0;
        if (a === values[at(i + 1, j, k)] < 0) continue;
        quad(
          vertexOf[cellAt(i, j - 1, k - 1)],
          vertexOf[cellAt(i, j, k - 1)],
          vertexOf[cellAt(i, j, k)],
          vertexOf[cellAt(i, j - 1, k)],
          a,
        );
      }
    }
  }
  for (let k = 1; k < nz - 1; k++) {
    for (let j = 0; j < ny - 1; j++) {
      for (let i = 1; i < nx - 1; i++) {
        const a = values[at(i, j, k)] < 0;
        if (a === values[at(i, j + 1, k)] < 0) continue;
        quad(
          vertexOf[cellAt(i - 1, j, k - 1)],
          vertexOf[cellAt(i - 1, j, k)],
          vertexOf[cellAt(i, j, k)],
          vertexOf[cellAt(i, j, k - 1)],
          a,
        );
      }
    }
  }
  for (let k = 0; k < nz - 1; k++) {
    for (let j = 1; j < ny - 1; j++) {
      for (let i = 1; i < nx - 1; i++) {
        const a = values[at(i, j, k)] < 0;
        if (a === values[at(i, j, k + 1)] < 0) continue;
        quad(
          vertexOf[cellAt(i - 1, j - 1, k)],
          vertexOf[cellAt(i, j - 1, k)],
          vertexOf[cellAt(i, j, k)],
          vertexOf[cellAt(i - 1, j, k)],
          a,
        );
      }
    }
  }

  // Smooth normals from the field's gradient, colours from the field, and crease shadow: how far
  // the field is from "open air" a short step out along the normal.
  const count = positions.length / 3;
  const normals = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const e = cell * 0.5;
  const q = new THREE.Vector3();
  const nrm = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    p.fromArray(positions, i * 3);
    nrm
      .set(
        field(q.set(p.x + e, p.y, p.z)).d - field(q.set(p.x - e, p.y, p.z)).d,
        field(q.set(p.x, p.y + e, p.z)).d - field(q.set(p.x, p.y - e, p.z)).d,
        field(q.set(p.x, p.y, p.z + e)).d - field(q.set(p.x, p.y, p.z - e)).d,
      )
      .normalize();
    nrm.toArray(normals, i * 3);
    const s = field(p);
    const r = s.c.r;
    const gr = s.c.g;
    const b = s.c.b;
    let occlusion = 0;
    for (let step = 1; step <= 3; step++) {
      const dist = step * cell * 1.2;
      occlusion += (dist - field(q.copy(p).addScaledVector(nrm, dist)).d) / dist / step;
    }
    const light = THREE.MathUtils.clamp(1 - occlusion * 0.55, 0.35, 1);
    colors[i * 3] = r * light;
    colors[i * 3 + 1] = gr * light;
    colors[i * 3 + 2] = b * light;
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  g.setIndex(index);
  g.computeBoundingSphere();
  return g;
}
