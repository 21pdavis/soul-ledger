import * as THREE from "three";
import { buildMidBossGeometry } from "./midboss";

// The mid-boss's body is a sculpted field meshed at runtime: about 100 ms of work, too long for
// the moment the story starts. It is built in a worker while the landing page is up and handed
// back as plain arrays (which cross to the page without copying), so the story never waits on it.

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

let pending: Promise<THREE.BufferGeometry> | null = null;

/**
 * The mid-boss geometry, built once per page and shared (Replay and new lookups reuse it). Off the
 * main thread where workers exist; otherwise (tests, very old browsers) built here, after a tick.
 */
export function loadMidBossGeometry(): Promise<THREE.BufferGeometry> {
  pending ??= (typeof Worker === "function" ? fromWorker() : Promise.resolve())
    .catch(() => undefined)
    .then((arrays) => (arrays ? arraysToGeometry(arrays) : buildMidBossGeometry()));
  return pending;
}

function fromWorker(): Promise<MeshArrays> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./midboss.worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (e: MessageEvent<MeshArrays>) => {
      worker.terminate();
      resolve(e.data);
    };
    worker.onerror = (e) => {
      worker.terminate();
      reject(e);
    };
  });
}
