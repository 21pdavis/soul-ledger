/**
 * Slide copy lives here so it can be edited in one place (ADR 0053). One fixed headline per slide;
 * data-driven variants (roast, MVP) are added by the slide PRs. Tone: hype, playful, PG-13.
 */
export const SLIDES = [
  { id: "intro", headline: "Welcome back to the Cursed City" },
  { id: "main", headline: "Your main" },
  { id: "roster", headline: "Your roster" },
  { id: "scavenger", headline: "Scavenger of the year" },
  { id: "kills", headline: "How you kill" },
  { id: "precision", headline: "Precision" },
  { id: "midBoss", headline: "Mid Boss business" },
  { id: "roast", headline: "Your favorite place to die" },
  { id: "rank", headline: "Your climb" },
  { id: "mvp", headline: "Your signature stat" },
  { id: "summary", headline: "Entered into the ledger" },
] as const;

export type SlideId = (typeof SLIDES)[number]["id"];

export const SLIDE_COUNT = SLIDES.length;

export function headlineFor(id: SlideId): string {
  return SLIDES.find((s) => s.id === id)!.headline;
}
