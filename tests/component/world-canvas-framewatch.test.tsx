import { act, render } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import WorldCanvas from "@/components/world/WorldCanvas";
import { fixtureStory } from "../fixtures/story";

// The real canvas needs WebGL; stand-ins let us drive the frame loop and the city's loading by hand.
const h = vi.hoisted(() => ({
  frames: new Set<() => void>(),
  shadows: undefined as unknown,
  cityReady: false,
  release: () => {},
}));
vi.mock("@react-three/fiber", () => ({
  Canvas: ({ children, shadows }: { children: React.ReactNode; shadows?: unknown }) => {
    h.shadows = shadows;
    return <div>{children}</div>;
  },
  useFrame: (cb: () => void) => {
    // Registered on mount (an effect), like the real one, so a suspended subtree adds nothing.
    useEffect(() => {
      h.frames.add(cb);
      return () => void h.frames.delete(cb);
    }, [cb]);
  },
}));
vi.mock("@react-three/postprocessing", () => ({
  EffectComposer: () => null,
  Bloom: () => null,
  Vignette: () => null,
}));
vi.mock("@/components/world/city/CityWorld", () => ({
  default: () => {
    if (!h.cityReady) {
      throw new Promise<void>((resolve) => {
        h.release = () => {
          h.cityReady = true;
          resolve();
        };
      });
    }
    return null;
  },
}));

const tick = () =>
  act(async () => {
    [...h.frames].forEach((f) => f());
  });

describe("WorldCanvas frame watching", () => {
  let now = 0;
  beforeEach(() => {
    now = 0;
    h.frames.clear();
    h.cityReady = false;
    vi.spyOn(performance, "now").mockImplementation(() => now);
  });
  afterEach(() => vi.restoreAllMocks());

  /** Frames at `fps` for `seconds`. */
  async function run(seconds: number, fps: number) {
    const end = now + seconds * 1000;
    while (now < end) {
      await tick();
      now += 1000 / fps;
    }
  }

  it("reports a slow city once", async () => {
    h.cityReady = true;
    const onSlow = vi.fn();
    render(<WorldCanvas slide={0} story={fixtureStory()} onSlow={onSlow} />);
    await run(6, 10);
    expect(onSlow).toHaveBeenCalledTimes(1);
  });

  it("does not report a healthy city", async () => {
    h.cityReady = true;
    const onSlow = vi.fn();
    render(<WorldCanvas slide={0} story={fixtureStory()} onSlow={onSlow} />);
    await run(10, 60);
    expect(onSlow).not.toHaveBeenCalled();
  });

  it("ignores frames while the tab is hidden and warms up again when it returns", async () => {
    h.cityReady = true;
    const onSlow = vi.fn();
    render(<WorldCanvas slide={0} story={fixtureStory()} onSlow={onSlow} />);
    await run(3, 60);
    const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await run(20, 1);
    expect(onSlow).not.toHaveBeenCalled();
    hidden.mockReturnValue(false);
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await run(1, 5); // still warming up
    expect(onSlow).not.toHaveBeenCalled();
  });

  it("does not start timing until the city has finished loading", async () => {
    const onSlow = vi.fn();
    render(<WorldCanvas slide={0} story={fixtureStory()} onSlow={onSlow} />);
    // The city is still loading its assets: no frame is counted, however long it takes.
    await run(10, 1);
    expect(h.frames.size).toBe(0);
    await act(async () => h.release());
    expect(h.frames.size).toBe(1);
    await run(1, 5); // the warm-up starts only now
    expect(onSlow).not.toHaveBeenCalled();
  });

  it("asks for the standard shadow style, so the shaders warmed up for the story are the ones used", () => {
    // three.js swaps the retired "soft" style for the standard one on the first shadow it draws,
    // which throws away every compiled shader in one frame (the stutter as the story starts).
    render(<WorldCanvas />);
    expect(h.shadows).toBe("percentage");
  });
});
