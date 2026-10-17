import { useLayoutEffect, useRef, useState, type RefObject } from "react";

/** Set on the box while it is measured; SlideReveal.module.css stops the entrance animation. */
const MEASURING = "data-fit-measuring";

/**
 * How many rows of a list fit in a box that must never scroll or clip.
 *
 * Starts at `max` and, while the box's content is taller than the box, drops one row at a time
 * (down to `min`) before the browser paints. If `min` still overflows it reports `tight`, so the
 * slide can drop its extras, and counts again from `max` with that room. It measures the real
 * layout, so it holds for any screen, font size or zoom without a table of breakpoints. When the
 * box is resized (a phone turned, a window dragged) it starts again from `max`.
 *
 * The box must have a definite height (it fills the slide body), so only its content can overflow.
 */
export function useFitCount(
  max: number,
  min: number,
): { ref: RefObject<HTMLDivElement | null>; count: number; tight: boolean } {
  const ref = useRef<HTMLDivElement | null>(null);
  const [count, setCount] = useState(max);
  // True when even `min` rows overflow: the slide must then give up something else to fit.
  const [tight, setTight] = useState(false);
  // Bumped on every resize so the fit runs again even if `count` already is `max`.
  const [pass, setPass] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    // Measure with the entrance animation off: a row mid-rise is shifted down by its transform,
    // which widens scrollHeight and reads as an overflow that is not there (#44). Switching it
    // off and on again inside this layout effect restarts the entrance before anything paints.
    // Only while an entrance is running (the `both` fill keeps finished ones listed): a re-measure after it ended (resize, rotation, new list
    // length) must not replay it. Browsers without getAnimations always switch it off.
    const entering =
      !!el &&
      (typeof el.getAnimations !== "function" ||
        el.getAnimations({ subtree: true }).some((a) => a.playState !== "finished"));
    if (entering) el.setAttribute(MEASURING, "");
    const overflows = !!el && el.scrollHeight > el.clientHeight + 0.5;
    if (entering) el.removeAttribute(MEASURING);
    if (overflows && count > min) setCount(count - 1);
    // Even `min` rows overflow: the slide gives up its extras, then the fit starts again from the
    // full list, so rows that fit in the room those extras freed are not lost. Once tight, a
    // list that still overflows at `min` stays as it is.
    if (overflows && count <= min && !tight) {
      setTight(true);
      setCount(max);
    }
  }, [count, min, max, tight, pass]);

  // A different list length (new data without a remount) starts the fit again from the full list.
  const [seenMax, setSeenMax] = useState(max);
  if (seenMax !== max) {
    setSeenMax(max);
    setCount(max);
    setTight(false);
    setPass((n) => n + 1);
  }

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    let first = true;
    const observer = new ResizeObserver(() => {
      // The observer reports once on observe(); that is not a resize.
      if (first) {
        first = false;
        return;
      }
      setCount(max);
      setTight(false);
      setPass((n) => n + 1);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [max]);

  return { ref, count, tight };
}
