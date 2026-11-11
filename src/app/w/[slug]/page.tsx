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
  // A generic site preview: no picture and nothing about any player.
  openGraph: { title: "Soul Ledger", description: "Your Deadlock year, wrapped." },
  twitter: { card: "summary", title: "Soul Ledger", description: "Your Deadlock year, wrapped." },
};

/** Where absolute preview addresses point: Render sets RENDER_EXTERNAL_URL for each service. */
const metadataBase = () => new URL(process.env.RENDER_EXTERNAL_URL ?? "http://localhost:3000");

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const opened = await open(slug);
  // Expired and unknown links reveal nothing about the player.
  if (opened.kind !== "live") return GENERIC;
  const name = opened.snapshot.player.personaName?.trim();
  const title = name ? `${name}'s Soul Ledger story` : "A Soul Ledger player's story";
  const description = "A frozen Deadlock year, wrapped in Soul Ledger.";
  const page = `/w/${encodeURIComponent(slug)}`;
  const image = `${page}/preview`;
  return {
    ...GENERIC,
    metadataBase: metadataBase(),
    title,
    description,
    openGraph: {
      type: "website",
      siteName: "Soul Ledger",
      title,
      description,
      url: page,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
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
  return <App shared={opened.snapshot} />;
}
