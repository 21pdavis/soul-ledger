import type * as THREE from "three";
import { buildMidBossGeometry } from "./midboss";
import { arraysToGeometry, type MeshArrays } from "./midboss-arrays";

// The mid-boss's body is a sculpted field meshed at runtime: about 100 ms of work, too long for
// the moment the story starts. It is built in a worker while the landing page is up and handed
// back as plain arrays (which cross to the page without copying), so the story never waits on it.

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

/** A worker that has not answered by then is given up on, and the mesh is built on the page. */
const WORKER_TIMEOUT_MS = 8000;

function fromWorker(): Promise<MeshArrays> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./midboss.worker.ts", import.meta.url), { type: "module" });
    const done = () => {
      clearTimeout(timer);
      worker.terminate();
    };
    const timer = setTimeout(() => {
      done();
      reject(new Error("mid-boss worker timed out"));
    }, WORKER_TIMEOUT_MS);
    worker.onmessage = (e: MessageEvent<MeshArrays>) => {
      done();
      resolve(e.data);
    };
    worker.onerror = (e) => {
      done();
      reject(e);
    };
  });
}
