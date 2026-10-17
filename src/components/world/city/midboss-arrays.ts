import * as THREE from "three";

// The mid-boss mesh as plain arrays, for the trip from the worker that builds it (see
// midboss-mesh.ts). Kept apart from the code that starts the worker, so the worker never imports
// itself (that hangs the production build).

export interface MeshArrays {
  position: Float32Array;
  normal: Float32Array;
  color: Float32Array;
  index: Uint16Array | Uint32Array;
}

export function geometryToArrays(g: THREE.BufferGeometry): MeshArrays {
  const copy = (name: string) => Float32Array.from(g.getAttribute(name).array as ArrayLike<number>);
  const index = g.index!.array;
  return {
    position: copy("position"),
    normal: copy("normal"),
    color: copy("color"),
    index: index instanceof Uint32Array ? Uint32Array.from(index) : Uint16Array.from(index),
  };
}

export function arraysToGeometry(a: MeshArrays): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(a.position, 3));
  g.setAttribute("normal", new THREE.BufferAttribute(a.normal, 3));
  g.setAttribute("color", new THREE.BufferAttribute(a.color, 3));
  g.setIndex(new THREE.BufferAttribute(a.index, 1));
  return g;
}
