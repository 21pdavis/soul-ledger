/**
 * Which heroes have cut-out art, for the city's standees (ADR 0060, 0068).
 * The list mirrors public/heroes (a unit test keeps them in step, so re-running
 * scripts/fetch-hero-art.mjs after a patch means updating it). A hero with no card, such as one
 * added by a patch, gets the generic silhouette instead of a failed texture load.
 */
export const HEROES_WITH_CARD: ReadonlySet<number> = new Set([
  1, 2, 3, 4, 6, 7, 8, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 25, 27, 31, 35, 48, 49, 50,
  52, 53, 59, 60, 61, 62, 63, 64, 65, 66, 67, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81,
  84, 85, 88,
]);

/** A neutral bust outline, for heroes with no card yet. Lives outside public/heroes, which the fetch script wipes. */
export const FALLBACK_CARD_SRC = "/hero-unknown-card.svg";

/** Where a hero's art lives (see scripts/fetch-hero-art.mjs): the card at "lg", the small icon at "sm". */
export const heroArtPath = (heroId: number, size: "lg" | "sm") =>
  `/heroes/${heroId}-${size === "lg" ? "card" : "sm"}.webp`;

/** The card image for a hero, or the generic silhouette when there is none. */
export function heroCardSrc(heroId: number): string {
  return HEROES_WITH_CARD.has(heroId) ? heroArtPath(heroId, "lg") : FALLBACK_CARD_SRC;
}
