import { useLayoutEffect, useRef, useState, type RefObject } from "react";

/**
 * How many rows of a list fit in a box that must never scroll or clip.
 *
 * Starts at `max` and, while the box's content is taller than the box, drops one row at a time
 * (down to `min`) before the browser paints. It measures the real layout, so it holds for any
 * screen, font size or zoom without a table of breakpoints. When the box is resized (a phone
 * turned, a window dragged) it starts again from `max`.
 *
 * The box must have a definite height (it fills the slide body), so only its content can overflow.
 */
export function useFitCount(
  max: number,
  min: number,
): { ref: RefObject<HTMLDivElement | null>; count: number } {
  const ref = useRef<HTMLDivElement | null>(null);
  const [count, setCount] = useState(max);
  // Bumped on every resize so the fit runs again even if `count` already is `max`.
  const [pass, setPass] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (el && count > min && el.scrollHeight > el.clientHeight + 0.5) setCount(count - 1);
  }, [count, min, pass]);

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
      setPass((n) => n + 1);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [max]);

  return { ref, count };
}
