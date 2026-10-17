import { formatPatchDate } from "./format";
import type { StoryMeta } from "./types";

/**
 * Which window a story covers, in words. The date comes from the server's `patchStart`, never a
 * client-computed one. A patch window without a patch date means the server fell back to all-time
 * data (#25), so it must not claim to be "this patch".
 */
export function windowLabel(
  meta: Pick<StoryMeta, "window" | "patchStart" | "patchUnavailable">,
): string {
  if (meta.patchUnavailable) return "All time (couldn't find the patch date)";
  if (meta.window === "patch") {
    if (meta.patchStart) return `Since patch ${formatPatchDate(meta.patchStart)}`;
    return "All time (couldn't find the patch date)";
  }
  return "All time";
}

/** The completeness line: how many matches the story is built from. */
export function basedOnMatches(matchCount: number): string {
  return `Based on ${matchCount.toLocaleString("en-US")} ${matchCount === 1 ? "match" : "matches"}`;
}
