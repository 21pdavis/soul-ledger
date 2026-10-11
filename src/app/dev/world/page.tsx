import { notFound } from "next/navigation";
import { WorldPreview } from "@/components/world-preview/WorldPreview";

/**
 * M3 step 1 (ADR 0068): the hidden style preview. Three rough worlds behind the real story, each
 * with a mood board. Local development only: production builds answer 404.
 */
export default function WorldPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <WorldPreview />;
}
