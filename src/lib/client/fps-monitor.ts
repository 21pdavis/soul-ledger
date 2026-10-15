import type { GraphicsLevel } from "./graphics";

/**
 * Auto-drop (ADR 0068): watches frame times and says when the 3D has run too slowly for long
 * enough that the graphics level should come down a step. Pure: it is fed timestamps (ms) and
 * knows nothing about React or three.js.
 */
export interface FpsMonitorOptions {
  /** Below this many frames per second counts as slow. */
  minFps?: number;
  /** How long the average must stay slow before it reports, in ms. */
  windowMs?: number;
  /** Frames this soon after the start (or after a tab returns) are ignored: shader warm-up. */
  warmupMs?: number;
}

export class FpsMonitor {
  private readonly minFps: number;
  private readonly windowMs: number;
  private readonly warmupMs: number;
  private start: number | null = null;
  private paused = false;
  private done = false;
  private times: number[] = [];

  constructor({ minFps = 20, windowMs = 3000, warmupMs = 1500 }: FpsMonitorOptions = {}) {
    this.minFps = minFps;
    this.windowMs = windowMs;
    this.warmupMs = warmupMs;
  }

  /** The tab is hidden: frames are throttled and say nothing about the device. */
  pause(): void {
    this.paused = true;
    this.times = [];
  }

  /** The tab is back: start the warm-up again from `now`. */
  resume(now: number): void {
    this.paused = false;
    this.start = now;
    this.times = [];
  }

  /** Feed one frame's timestamp. True exactly once: when the level should drop. */
  frame(now: number): boolean {
    if (this.paused || this.done) return false;
    this.start ??= now;
    if (now - this.start < this.warmupMs) return false;
    this.times.push(now);
    while (this.times.length > 1 && now - this.times[0] > this.windowMs) this.times.shift();
    const span = now - this.times[0];
    if (span < this.windowMs * 0.95) return false;
    const fps = ((this.times.length - 1) * 1000) / span;
    if (fps >= this.minFps) return false;
    this.done = true;
    return true;
  }
}

/** One step down, never up: Full to Simple, Simple to Off. */
export function lowerGraphics(level: GraphicsLevel): GraphicsLevel {
  return level === "full" ? "simple" : "off";
}
