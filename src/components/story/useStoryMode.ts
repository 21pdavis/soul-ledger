import { useMediaQuery } from "./useMediaQuery";

/** ADR 0050: 1024px or wider AND a fine pointer gets the desktop scroll controller. */
export const SCROLL_MODE_QUERY = "(min-width: 1024px) and (pointer: fine)";

export type StoryMode = "tap" | "scroll";

/**
 * Which controller to use. The server and the first hydration render answer "tap" (phone first);
 * it re-evaluates when the window is resized or the pointer type changes.
 */
export function useStoryMode(): StoryMode {
  return useMediaQuery(SCROLL_MODE_QUERY) ? "scroll" : "tap";
}
