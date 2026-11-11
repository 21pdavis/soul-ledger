import { openSharedStory } from "@/lib/share/open";
import { renderLinkPreview } from "@/share-picture/render";

// Reads the database and the clock on every request, like the page: a link can expire.
export const dynamic = "force-dynamic";

const DAY_SECONDS = 86_400;
const MEMO_LIMIT = 100;

/** Drawn pictures by slug, newest last. An entry is never served past its link's expiry. */
const memo = new Map<string, { png: ArrayBuffer; expiresAt: number }>();

function remember(slug: string, png: ArrayBuffer, expiresAt: number) {
  memo.delete(slug);
  memo.set(slug, { png, expiresAt });
  if (memo.size > MEMO_LIMIT) memo.delete(memo.keys().next().value!);
}

/**
 * The wide link-preview picture of a live share link (ADR 0079). Expired and unknown links get a
 * plain 404: no player data leaves once a link is gone. Caches (browser, CDN) and the in-process
 * memo keep the picture for at most a day and never past the link's own expiry.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const { slug } = await params;
  const now = new Date();
  const opened = await openSharedStory(slug, now);
  if (opened.kind !== "live") {
    memo.delete(slug);
    return new Response("Not found", { status: 404 });
  }
  const expiresAt = opened.expiresAt.getTime();
  let png = memo.get(slug)?.png;
  if (!png) {
    png = await renderLinkPreview({
      story: opened.snapshot.story,
      playerName: opened.snapshot.player.personaName?.trim() ?? "",
    });
    remember(slug, png, expiresAt);
  }
  const life = Math.max(0, Math.min(DAY_SECONDS, Math.floor((expiresAt - now.getTime()) / 1000)));
  return new Response(png, {
    headers: {
      "content-type": "image/png",
      "cache-control": `public, max-age=${life}, s-maxage=${life}`,
    },
  });
}
