import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { App } from "@/components/app/App";
import { openSharedStory } from "@/lib/share/open";

// Reads the database and the clock on every open: a link can expire between visits.
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

// One database read per request, shared by the metadata and the page.
const open = cache((slug: string) => openSharedStory(slug, new Date()));

const GENERIC: Metadata = {
  title: "Soul Ledger",
  description: "Your Deadlock year, wrapped.",
  robots: { index: false },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const opened = await open(slug);
  // Expired and unknown links reveal nothing about the player.
  if (opened.kind !== "live") return GENERIC;
  const name = opened.snapshot.player.personaName?.trim();
  return {
    ...GENERIC,
    title: name ? `${name}'s Soul Ledger story` : "A Soul Ledger player's story",
    description: "A frozen Deadlock year, wrapped in Soul Ledger.",
    // Hook for the rich link preview (M4 step 6): add `openGraph.images` / `twitter` here, built
    // from `opened.snapshot`.
  };
}

/**
 * A share link (ADR 0079): the frozen story replays through the normal App path with no lookup.
 * An expired link sends only the player's id, never the story.
 */
export default async function SharedPage({ params }: Props) {
  const { slug } = await params;
  const opened = await open(slug);
  if (opened.kind === "notFound") notFound();
  if (opened.kind === "expired") return <App expiredAccountId={opened.accountId} />;
  return <App shared={opened.snapshot} shareSlug={slug} />;
}
