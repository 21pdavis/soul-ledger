import { afterEach, describe, expect, it, vi } from "vitest";
import { buildMidBossGeometry } from "@/components/world/city/midboss";
import { arraysToGeometry, geometryToArrays } from "@/components/world/city/midboss-arrays";
import { loadMidBossGeometry } from "@/components/world/city/midboss-mesh";

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

describe("loadMidBossGeometry with a worker", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.resetModules();
  });
  const fresh = async () =>
    (await import("@/components/world/city/midboss-mesh")).loadMidBossGeometry;
  const count = buildMidBossGeometry().getAttribute("position").count;

  it("builds it on the page instead if the worker fails", async () => {
    vi.stubGlobal(
      "Worker",
      class {
        onerror: ((e: unknown) => void) | null = null;
        constructor() {
          queueMicrotask(() => this.onerror?.(new Event("error")));
        }
        terminate() {}
      },
    );
    const g = await (await fresh())();
    expect(g.getAttribute("position").count).toBe(count);
  });

  it("gives up on a worker that never answers, and builds it on the page", async () => {
    vi.useFakeTimers();
    const terminate = vi.fn();
    vi.stubGlobal(
      "Worker",
      class {
        terminate = terminate;
      },
    );
    const p = (await fresh())();
    await vi.advanceTimersByTimeAsync(10_000);
    const g = await p;
    expect(g.getAttribute("position").count).toBe(count);
    expect(terminate).toHaveBeenCalled();
  });
});
