interface RateLimiterOptions {
  maxRequests: number;
  perMs: number;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
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

  schedule<T>(task: () => Promise<T>): Promise<T> {
    const admitted = this.queue.then(() => this.acquire());
    this.queue = admitted;
    return admitted.then(task);
  }

  private async acquire(): Promise<void> {
    for (;;) {
      const now = this.now();
      this.starts = this.starts.filter((t) => t + this.perMs > now);
      if (this.starts.length < this.maxRequests) {
        this.starts.push(now);
        return;
      }
      await this.sleep(this.starts[0] + this.perMs - now);
    }
  }
}
