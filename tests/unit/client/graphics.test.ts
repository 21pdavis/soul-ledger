// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import { GRAPHICS_KEY, chooseGraphics, loadSavedGraphics } from "@/lib/client/graphics";

/** The 3D world's starting level (ADR 0068): Full by default, Off without WebGL or with reduced motion, a saved choice winning. */
describe("chooseGraphics", () => {
  it("starts on Full when WebGL works and motion is fine", () => {
    expect(chooseGraphics({ webgl: true, reducedMotion: false, saved: null })).toBe("full");
  });

  it("is Off without WebGL, whatever was saved", () => {
    expect(chooseGraphics({ webgl: false, reducedMotion: false, saved: null })).toBe("off");
    expect(chooseGraphics({ webgl: false, reducedMotion: false, saved: "full" })).toBe("off");
  });

  it("starts on Off for reduced motion", () => {
    expect(chooseGraphics({ webgl: true, reducedMotion: true, saved: null })).toBe("off");
  });

  it("lets a saved choice win over the defaults", () => {
    expect(chooseGraphics({ webgl: true, reducedMotion: false, saved: "off" })).toBe("off");
    expect(chooseGraphics({ webgl: true, reducedMotion: true, saved: "full" })).toBe("full");
    expect(chooseGraphics({ webgl: true, reducedMotion: false, saved: "simple" })).toBe("simple");
  });
});

describe("loadSavedGraphics", () => {
  const store = (value: string | null) => ({
    getItem: (k: string) => (k === GRAPHICS_KEY ? value : null),
  });

  it("reads a valid saved level", () => {
    expect(loadSavedGraphics(store("simple"))).toBe("simple");
  });

  it("ignores anything else, and storage that throws", () => {
    expect(loadSavedGraphics(store("ultra"))).toBeNull();
    expect(loadSavedGraphics(store(null))).toBeNull();
    expect(
      loadSavedGraphics({
        getItem: () => {
          throw new Error("blocked");
        },
      }),
    ).toBeNull();
  });
});

describe("supportsWebGL", () => {
  it("says no on the server without remembering it, so the browser still probes", async () => {
    vi.resetModules();
    const { supportsWebGL } = await import("@/lib/client/graphics");
    const realDocument = globalThis.document;
    // @ts-expect-error simulate the server: no document
    delete globalThis.document;
    try {
      expect(supportsWebGL()).toBe(false);
    } finally {
      globalThis.document = realDocument;
    }
    const probe = vi
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue({ getExtension: () => null } as unknown as RenderingContext);
    try {
      expect(supportsWebGL()).toBe(true);
    } finally {
      probe.mockRestore();
    }
  });
});
