/**
 * A per-client-IP fixed-window limiter held in this process's memory (ADR 0076). Correct for our
 * single Render instance; sharing the count across instances is tracked in #16.
 */

/** Lookups one IP may start per window. */
export const LOOKUP_LIMIT = 10;
/** The window, in milliseconds. */
export const LOOKUP_WINDOW_MS = 60_000;
/** Most IPs tracked at once; the oldest are dropped past this, so memory stays bounded. */
export const MAX_BUCKETS = 10_000;

export type RateDecision = { allowed: true } | { allowed: false; retryAfterSeconds: number };

export interface IpRateLimiter {
  check(ip: string): RateDecision;
  /** Buckets currently held (for tests). */
  size(): number;
}

interface Options {
  limit?: number;
  windowMs?: number;
  maxBuckets?: number;
  now?: () => number;
}

export function createIpRateLimiter({
  limit = LOOKUP_LIMIT,
  windowMs = LOOKUP_WINDOW_MS,
  maxBuckets = MAX_BUCKETS,
  now = Date.now,
}: Options = {}): IpRateLimiter {
  // A Map iterates in insertion order, and a bucket's window start never changes, so the first
  // entries are always the oldest.
  const buckets = new Map<string, { start: number; count: number }>();

  const evict = (t: number) => {
    for (const [ip, b] of buckets) {
      if (t - b.start < windowMs) break;
      buckets.delete(ip);
    }
    while (buckets.size >= maxBuckets) {
      const oldest = buckets.keys().next();
      if (oldest.done) break;
      buckets.delete(oldest.value);
    }
  };

  return {
    check(ip) {
      const t = now();
      let bucket = buckets.get(ip);
      if (bucket && t - bucket.start >= windowMs) {
        buckets.delete(ip);
        bucket = undefined;
      }
      if (!bucket) {
        evict(t);
        bucket = { start: t, count: 0 };
        buckets.set(ip, bucket);
      }
      if (bucket.count >= limit) {
        return {
          allowed: false,
          retryAfterSeconds: Math.max(1, Math.ceil((bucket.start + windowMs - t) / 1000)),
        };
      }
      bucket.count++;
      return { allowed: true };
    },
    size: () => buckets.size,
  };
}

/** The /64 an IPv6 address belongs to, as its first four groups; other strings pass through. */
function bucketKey(ip: string): string {
  if (!ip.includes(":") || ip.includes(".") || ip.includes("%")) return ip;
  const [head, tail, ...extra] = ip.toLowerCase().split("::");
  if (extra.length > 0) return ip;
  const front = head ? head.split(":") : [];
  const back = tail ? tail.split(":") : [];
  const groups =
    tail === undefined
      ? front
      : [
          ...front,
          ...Array<string>(Math.max(0, 8 - front.length - back.length)).fill("0"),
          ...back,
        ];
  if (groups.length !== 8 || !groups.every((g) => /^[0-9a-f]{1,4}$/.test(g))) return ip;
  return `${groups
    .slice(0, 4)
    .map((g) => g.replace(/^0+(?=.)/, ""))
    .join(":")}::/64`;
}

/**
 * The visitor's address behind Render (ADR 0076). Cloudflare, in front of Render, overwrites
 * `true-client-ip` and `cf-connecting-ip` with the real client; `x-forwarded-for` keeps whatever
 * the client sent first, so it is never trusted. IPv6 visitors are bucketed by /64, and the key is
 * clamped to the longest textual IP (45 chars) so a forged header cannot bloat memory.
 */
export function clientIp(request: Request): string {
  const { headers } = request;
  const ip = (headers.get("true-client-ip") ?? headers.get("cf-connecting-ip"))?.trim();
  return ip ? bucketKey(ip.slice(0, 45)) : "unknown";
}
