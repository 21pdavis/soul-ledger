// Builds the mid-boss mesh off the main thread (see midboss-mesh.ts) and posts it back as arrays.
import { buildMidBossGeometry } from "./midboss";
import { geometryToArrays } from "./midboss-mesh";

const arrays = geometryToArrays(buildMidBossGeometry());
// Typed as a window by the app's DOM lib; in a worker, postMessage takes the transfer list second.
(self as unknown as { postMessage(m: unknown, t: Transferable[]): void }).postMessage(arrays, [
  arrays.position.buffer,
  arrays.normal.buffer,
  arrays.color.buffer,
  arrays.index.buffer,
]);
