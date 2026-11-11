import { SLIDE_COUNT } from "@/story/copy";
import { clientIp, type IpRateLimiter } from "@/lib/ip-rate-limit";
import type { PictureInput } from "@/share-picture/build";
import type { OpenedShare } from "./open";

/** The longest a browser or shared cache may keep a picture (and no longer than the link lives). */
const MAX_CACHE_SECONDS = 86_400;
/** Rendered PNGs kept in memory (a few hundred KB each), least recently used dropped first. */
export const MAX_CACHED_PICTURES = 64;

interface Deps {
  open: (slug: string) => Promise<OpenedShare>;
  render: (input: Omit<PictureInput, "assets">) => Promise<ArrayBuffer>;
  /** Per-IP limit on renders (cache misses only); none when absent. */
  limiter?: IpRateLimiter;
  /** Requests this accepts skip the limiter. */
  exempt?: (request: Request) => boolean;
  now?: () => Date;
  maxEntries?: number;
}

interface Context {
  params: Promise<{ slug: string; n: string }>;
}

const notFound = () =>
  new Response("Not found", { status: 404, headers: { "cache-control": "no-store" } });

/** Cache headers that never outlive the link: a day, or the time the link has left if less. */
function pictureResponse(png: ArrayBuffer, expiresAt: Date, now: Date): Response {
  const seconds = Math.min(
    MAX_CACHE_SECONDS,
    Math.floor((expiresAt.getTime() - now.getTime()) / 1000),
  );
  if (seconds <= 0) return notFound();
  return new Response(png, {
    headers: {
      "content-type": "image/png",
      "cache-control": `public, max-age=${seconds}, s-maxage=${seconds}`,
    },
  });
}

/**
 * GET /w/<slug>/picture/<n>: the PNG for slide n (0 = first, as in the story) of a share link.
 * The snapshot is frozen, so a picture never changes, but it holds the player's name and stats, so
 * caching (HTTP and the in-process LRU below) never outlives the link. An expired or unknown link,
 * or a slide number outside the story, is a plain 404 that reveals nothing. Renders are costly, so
 * misses are limited per IP; cached pictures are free.
 */
export function createPictureHandler({
  open,
  render,
  limiter,
  exempt,
  now: clock = () => new Date(),
  maxEntries = MAX_CACHED_PICTURES,
}: Deps) {
  // A Map iterates in insertion order; re-inserting on a hit keeps the least recently used first.
  const cache = new Map<string, { png: ArrayBuffer; expiresAt: Date }>();

  return async function GET(request: Request, { params }: Context): Promise<Response> {
    const { slug, n } = await params;
    if (!/^(0|[1-9]\d?)$/.test(n) || Number(n) >= SLIDE_COUNT) return notFound();
    const now = clock();
    const key = `${slug}\0${n}`;

    const hit = cache.get(key);
    if (hit) {
      cache.delete(key);
      if (hit.expiresAt.getTime() > now.getTime()) {
        cache.set(key, hit);
        return pictureResponse(hit.png, hit.expiresAt, now);
      }
    }

    if (limiter && !exempt?.(request)) {
      const decision = limiter.check(clientIp(request));
      if (!decision.allowed) {
        return new Response("Too many requests", {
          status: 429,
          headers: {
            "retry-after": String(decision.retryAfterSeconds),
            "cache-control": "no-store",
          },
        });
      }
    }

    const opened = await open(slug);
    if (opened.kind !== "live") return notFound();
    const { snapshot, expiresAt } = opened;
    if (expiresAt.getTime() <= now.getTime()) return notFound();
    const png = await render({
      story: snapshot.story,
      meta: {
        window: snapshot.meta.window,
        patchStart: snapshot.meta.patchStart,
        patchUnavailable: snapshot.meta.patchUnavailable,
        stale: false,
      },
      playerName: snapshot.player.personaName?.trim() || "A Soul Ledger player",
      index: Number(n),
      sharedAt: snapshot.sharedAt,
    });
    cache.set(key, { png, expiresAt });
    while (cache.size > maxEntries) {
      const oldest = cache.keys().next();
      if (oldest.done) break;
      cache.delete(oldest.value);
    }
    return pictureResponse(png, expiresAt, now);
  };
}
