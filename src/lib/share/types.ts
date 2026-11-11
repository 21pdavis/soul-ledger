import type { StoryWindow } from "@/lib/lookup";
import type { StoryData } from "@/story/types";

/** Share links expire after 90 days (ADR 0079). */
export const SHARE_TTL_MS = 90 * 24 * 60 * 60 * 1000;

/**
 * The frozen story behind a share link, stored as JSON. Everything a `/w/<slug>` page needs to
 * replay the story as it was on the share date, with no further lookups.
 */
export interface SharedSnapshot {
  /** Bumped if the stored shape ever changes, so old rows can be read or refused. */
  version: 1;
  /** ISO time the link was made: the "numbers from that day" date. */
  sharedAt: string;
  player: { accountId: number; personaName: string | null; avatarUrl: string | null };
  meta: {
    window: StoryWindow;
    /** ISO start of the patch window, or null. */
    patchStart: string | null;
    patchUnavailable: boolean;
  };
  story: StoryData;
}
