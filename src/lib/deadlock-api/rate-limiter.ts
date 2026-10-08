interface RateLimiterOptions {
  maxRequests: number;
  perMs: number;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
}

export interface ScheduleOptions {
  onWait?: (ms: number) => void;
}

/**
 * A sliding-window limiter: at most `maxRequests` tasks may start in any `perMs` window.
 * Callers are admitted in order. Tasks themselves run concurrently once admitted.
 */
export class RateLimiter {
  private readonly maxRequests: number;
  private readonly perMs: number;
  private readonly now: () => number;
  private readonly sleep: (ms: number) => Promise<void>;
  private starts: number[] = [];
  private queue: Promise<void> = Promise.resolve();

  constructor(options: RateLimiterOptions) {
    this.maxRequests = options.maxRequests;
    this.perMs = options.perMs;
    this.now = options.now ?? Date.now;
    this.sleep = options.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  }

  /** `onWait` is told how long (ms) the task must wait for a free slot, each time it has to. */
  schedule<T>(task: () => Promise<T>, options: ScheduleOptions = {}): Promise<T> {
    const admitted = this.queue.then(() => this.acquire(options.onWait));
    this.queue = admitted;
    return admitted.then(task);
  }

  private async acquire(onWait?: (ms: number) => void): Promise<void> {
    for (;;) {
      const now = this.now();
      this.starts = this.starts.filter((t) => t + this.perMs > now);
      if (this.starts.length < this.maxRequests) {
        this.starts.push(now);
        return;
      }
      const waitMs = this.starts[0] + this.perMs - now;
      onWait?.(waitMs);
      await this.sleep(waitMs);
    }
  }
}
