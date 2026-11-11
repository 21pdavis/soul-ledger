import { SLIDE_COUNT } from "@/story/copy";
import type { PictureInput } from "@/share-picture/build";
import type { OpenedShare } from "./open";

interface Deps {
  open: (slug: string) => Promise<OpenedShare>;
  render: (input: Omit<PictureInput, "assets">) => Promise<ArrayBuffer>;
}

interface Context {
  params: Promise<{ slug: string; n: string }>;
}

const notFound = () =>
  new Response("Not found", { status: 404, headers: { "cache-control": "no-store" } });

/**
 * GET /w/<slug>/picture/<n>: the PNG for slide n (0 = first, as in the story) of a share link.
 * The snapshot is frozen, so a picture never changes and caches for a year; an expired or
 * unknown link, or a slide number outside the story, is a plain 404 that reveals nothing.
 */
export function createPictureHandler({ open, render }: Deps) {
  return async function GET(_request: Request, { params }: Context): Promise<Response> {
    const { slug, n } = await params;
    if (!/^\d{1,2}$/.test(n) || Number(n) >= SLIDE_COUNT) return notFound();
    const opened = await open(slug);
    if (opened.kind !== "live") return notFound();
    const { snapshot } = opened;
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
    return new Response(png, {
      headers: {
        "content-type": "image/png",
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  };
}
