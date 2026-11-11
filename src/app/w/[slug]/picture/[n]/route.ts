import { createIpRateLimiter } from "@/lib/ip-rate-limit";
import { hasValidStagingToken } from "@/lib/staging-gate";
import { createPictureHandler } from "@/lib/share/picture-handler";
import { openSharedStory } from "@/lib/share/open";
import { renderSlidePicture } from "@/share-picture/render";

// Reads the database and the clock: a link can expire between visits.
export const dynamic = "force-dynamic";

// Its own limiter (ADR 0076): only renders count, so lookups and sharing keep their allowance.
const limiter = createIpRateLimiter({ limit: 20 });

export const GET = createPictureHandler({
  open: (slug) => openSharedStory(slug, new Date()),
  render: renderSlidePicture,
  limiter,
  exempt: (request) => hasValidStagingToken(request, process.env),
});
