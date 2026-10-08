/**
 * Guard for the temporary `/preview` route (removal tracked in #29), which shows the story player
 * with fixture data until the entry flow replaces it. Fails closed: open only in development, or
 * where STORY_PREVIEW=1 is set explicitly (the local e2e web server).
 */
export function isPreviewEnabled(env: { NODE_ENV?: string; STORY_PREVIEW?: string }): boolean {
  return env.NODE_ENV === "development" || env.STORY_PREVIEW === "1";
}
