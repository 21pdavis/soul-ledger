import { openSharedStory } from "@/lib/share/open";
import { renderLinkPreview } from "@/share-picture/render";

// Reads the database and the clock on every request, like the page: a link can expire.
export const dynamic = "force-dynamic";

/**
 * The wide link-preview picture of a live share link (ADR 0079). Expired and unknown links get a
 * plain 404: no player data leaves once a link is gone.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const { slug } = await params;
  const opened = await openSharedStory(slug, new Date());
  if (opened.kind !== "live") return new Response("Not found", { status: 404 });
  const png = await renderLinkPreview({
    story: opened.snapshot.story,
    playerName: opened.snapshot.player.personaName?.trim() ?? "",
  });
  return new Response(png, {
    headers: { "content-type": "image/png", "cache-control": "public, max-age=300" },
  });
}
