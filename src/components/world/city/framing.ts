/** How far into the open space beside the card the focal point sits (0 = at the card's edge). */
const FOCUS_INSET = 0.33;

/** The closest a nudged focal point may come to the card's edge, in pixels. */
const CARD_GAP = 40;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Where the scene's focal point sits beside a side card, as a fraction of the screen width from
 * the middle, plus a shot's own nudge. Mirrors the preview's card CSS: gutters of
 * clamp(72px, 12vw, 192px), a card of at most min(480px, 42vw), and the progress rail in the
 * right gutter.
 */
export function sceneShift(width: number, side: "left" | "right", nudge = 0) {
  const gutter = clamp(width * 0.12, 72, 192);
  const card = Math.min(480, width * 0.42, width - 2 * gutter);
  // The focal point sits in the inner part of the open space, close to the card, so the eye
  // moves between the two instead of across the whole screen.
  const edge = side === "left" ? gutter + card : width - gutter - card;
  const open = side === "left" ? width - 48 - edge : edge - 48;
  const focus = side === "left" ? edge + open * FOCUS_INSET : edge - open * FOCUS_INSET;
  // A shot's nudge is a fraction of the screen, so on narrower screens it could push the action
  // behind the card; keep it at least CARD_GAP clear of the card's edge.
  const nudged =
    side === "left"
      ? Math.max(edge + CARD_GAP, focus + nudge * width)
      : Math.min(edge - CARD_GAP, focus + nudge * width);
  return (nudged - width / 2) / width;
}
