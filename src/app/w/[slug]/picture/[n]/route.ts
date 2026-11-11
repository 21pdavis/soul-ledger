import { createPictureHandler } from "@/lib/share/picture-handler";
import { openSharedStory } from "@/lib/share/open";
import { renderSlidePicture } from "@/share-picture/render";

// Reads the database and the clock: a link can expire between visits.
export const dynamic = "force-dynamic";

export const GET = createPictureHandler({
  open: (slug) => openSharedStory(slug, new Date()),
  render: renderSlidePicture,
});
