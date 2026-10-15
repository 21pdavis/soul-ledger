import { describe, expect, it } from "vitest";
import { FpsMonitor, lowerGraphics } from "@/lib/client/fps-monitor";

/** Feed `seconds` of frames at `fps` starting at `from` ms; returns the time after and any drop. */
function run(m: FpsMonitor, from: number, seconds: number, fps: number) {
  const step = 1000 / fps;
  let t = from;
  let dropped = false;
  for (; t < from + seconds * 1000; t += step) dropped ||= m.frame(t);
  return { t, dropped };
}

describe("FpsMonitor", () => {
  it("drops after about 3 seconds below 20 fps", () => {
    const m = new FpsMonitor();
    m.frame(0);
    const { dropped } = run(m, 100, 6, 10); // 1.5 s warm-up, then 3 s of 10 fps
    expect(dropped).toBe(true);
  });

  it("does not drop at a healthy frame rate", () => {
    const m = new FpsMonitor();
    expect(run(m, 0, 20, 60).dropped).toBe(false);
  });

  it("ignores a short dip", () => {
    const m = new FpsMonitor();
    const a = run(m, 0, 5, 60);
    const b = run(m, a.t, 0.7, 5);
    expect(run(m, b.t, 10, 60).dropped).toBe(false);
  });

  it("ignores the warm-up after the first frame", () => {
    const m = new FpsMonitor();
    // 1.4 s of terrible frames (shader compile), then smooth.
    const a = run(m, 0, 1.4, 2);
    expect(a.dropped).toBe(false);
    expect(run(m, a.t, 10, 60).dropped).toBe(false);
  });

  it("does not drop after only 2 seconds of slow frames", () => {
    const m = new FpsMonitor();
    const a = run(m, 0, 1.6, 60);
    expect(run(m, a.t, 2, 8).dropped).toBe(false);
  });

  it("ignores a hidden tab and restarts the warm-up when it returns", () => {
    const m = new FpsMonitor();
    const a = run(m, 0, 3, 60);
    m.pause();
    // While hidden the browser throttles to ~1 fps; those frames must not count.
    expect(run(m, a.t, 20, 1).dropped).toBe(false);
    m.resume(a.t + 20000);
    const b = run(m, a.t + 20000, 1, 5);
    expect(b.dropped).toBe(false); // still warming up
    expect(run(m, b.t, 10, 60).dropped).toBe(false);
  });

  it("reports a drop only once", () => {
    const m = new FpsMonitor();
    m.frame(0);
    let count = 0;
    for (let t = 100; t < 20000; t += 100) if (m.frame(t)) count++;
    expect(count).toBe(1);
  });
});

describe("lowerGraphics", () => {
  it("only ever goes down: Full to Simple, Simple to Off, Off stays", () => {
    expect(lowerGraphics("full")).toBe("simple");
    expect(lowerGraphics("simple")).toBe("off");
    expect(lowerGraphics("off")).toBe("off");
  });
});
