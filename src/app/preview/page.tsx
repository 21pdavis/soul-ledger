import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isPreviewEnabled } from "@/lib/story-preview";
import { PreviewPlayer } from "./PreviewPlayer";

export const metadata: Metadata = { robots: { index: false, follow: false } };

// Decide per request, never at build time: `next build` runs as production and would bake in a 404.
export const dynamic = "force-dynamic";

/**
 * Temporary: the story player over fixture data, until the entry flow (M2 PR 2) lands.
 * 404s in production unless STORY_PREVIEW=1 (set only by the e2e web server).
 */
export default function PreviewPage() {
  if (!isPreviewEnabled(process.env)) notFound();
  return <PreviewPlayer />;
}
