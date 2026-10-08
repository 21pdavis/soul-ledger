import { createElement, type CSSProperties, type HTMLAttributes } from "react";
import styles from "./SlideReveal.module.css";

/** Stagger steps beyond this share the last slot, so the whole entrance stays under ENTRANCE_MS. */
const MAX_STEPS = 7;

interface Props extends HTMLAttributes<HTMLElement> {
  /** Position in the stagger (0 first). */
  index: number;
  /** False when reduced motion or skip is on: the element is simply in its final state. */
  animate: boolean;
  /** "rise" eases a row up; "stamp" lands a figure like an inked stamp. */
  kind?: "rise" | "stamp";
  as?: "div" | "li" | "p" | "section";
}

/**
 * One staggered, one-shot entrance step for slide content. Pure CSS animation, so the stage's
 * press-and-hold pause freezes it (StoryPlayer.module.css) and setting `animate` to false shows the final
 * state at once.
 */
export function SlideReveal({
  index,
  animate,
  kind = "rise",
  as = "div",
  className,
  style,
  children,
  ...rest
}: Props) {
  const slot = Math.min(index, MAX_STEPS);
  return createElement(
    as,
    {
      ...rest,
      className: [styles.reveal, className].filter(Boolean).join(" "),
      "data-motion": animate ? kind : "none",
      style: { ...style, "--step": slot } as CSSProperties,
    },
    children,
  );
}
