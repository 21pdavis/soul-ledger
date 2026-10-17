import { describe, expect, it } from "vitest";
import { buildMidBossGeometry } from "@/components/world/city/midboss";
import {
  arraysToGeometry,
  geometryToArrays,
  loadMidBossGeometry,
} from "@/components/world/city/midboss-mesh";

// The mid-boss's body is a sculpted field meshed at runtime: about 100 ms of work. It is built off
// the main thread (a worker) while the landing page is up, and passed back as plain arrays, so the
// story's first card never waits on it (the stutter as the story starts).

describe("the mid-boss mesh as plain arrays", () => {
  it("survives the trip to arrays and back unchanged", () => {
    const g = buildMidBossGeometry();
    const back = arraysToGeometry(geometryToArrays(g));
    for (const name of ["position", "normal", "color"]) {
      expect(Array.from(back.getAttribute(name).array)).toEqual(
        Array.from(g.getAttribute(name).array),
      );
      expect(back.getAttribute(name).itemSize).toBe(3);
    }
    expect(Array.from(back.index!.array)).toEqual(Array.from(g.index!.array));
  });
});

describe("loadMidBossGeometry", () => {
  it("builds it once and shares it (here without a worker)", async () => {
    const a = loadMidBossGeometry();
    expect(loadMidBossGeometry()).toBe(a);
    const g = await a;
    expect(g.getAttribute("position").count).toBe(
      buildMidBossGeometry().getAttribute("position").count,
    );
  });
});
