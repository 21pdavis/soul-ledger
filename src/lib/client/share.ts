import type { StoryWindow } from "@/lib/lookup";

export type ShareLinkResult =
  | { ok: true; slug: string }
  | { ok: false; reason: "rate_limited"; retryAfter: number }
  | { ok: false; reason: "failed" };

/** Asks the server for this story's share link (POST /api/share). Never throws. */
export async function requestShareLink(
  accountId: number,
  window: StoryWindow,
  fetchImpl: typeof fetch = fetch,
): Promise<ShareLinkResult> {
  try {
    const response = await fetchImpl("/api/share", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ accountId, window }),
    });
    if (response.status === 429) {
      const seconds = Number(response.headers.get("retry-after"));
      return {
        ok: false,
        reason: "rate_limited",
        retryAfter: Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : 60,
      };
    }
    if (!response.ok) return { ok: false, reason: "failed" };
    const body = (await response.json()) as { slug?: unknown };
    return typeof body.slug === "string"
      ? { ok: true, slug: body.slug }
      : { ok: false, reason: "failed" };
  } catch {
    return { ok: false, reason: "failed" };
  }
}

const links = new Map<string, string>();
const storyKey = (accountId: number, window: StoryWindow) => `${accountId}:${window}`;

/** The link already made for this player's story in this tab, so repeat presses don't ask again. */
export const rememberedShareSlug = (accountId: number, window: StoryWindow) =>
  links.get(storyKey(accountId, window));
export const rememberShareSlug = (accountId: number, window: StoryWindow, slug: string) =>
  void links.set(storyKey(accountId, window), slug);
/** Test seam: forget remembered links. */
export const forgetShareLinks = () => links.clear();

/** Where a link opens, and where its slide pictures live (slide index 0-based). */
export const linkPath = (slug: string) => `/w/${slug}`;
export const picturePath = (slug: string, index: number) => `/w/${slug}/picture/${index}`;

/** True where the browser can hand a picture to the native share sheet (phones). */
export function canShareFiles(): boolean {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") return false;
  if (typeof navigator.canShare !== "function") return false;
  try {
    return navigator.canShare({ files: [new File([""], "a.png", { type: "image/png" })] });
  } catch {
    return false;
  }
}
