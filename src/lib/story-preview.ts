/**
 * Guard for the temporary `/preview` route, which shows the story player with fixture data until
 * the entry flow replaces it. Never open in production; e2e opts in with STORY_PREVIEW=1.
 */
export function isPreviewEnabled(env: { NODE_ENV?: string; STORY_PREVIEW?: string }): boolean {
  return env.NODE_ENV !== "production" || env.STORY_PREVIEW === "1";
}
