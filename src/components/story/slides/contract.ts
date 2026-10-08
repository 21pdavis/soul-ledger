import type { ComponentType } from "react";
import type { SlideProps } from "@/story/types";

/**
 * The slide component contract. Every slide is a component in its own file in this folder, takes
 * exactly these props, and renders a `<SlideFrame headline={headlineFor(id)}>`. The StoryPlayer
 * (never the slide) owns navigation, so a slide must not move the story itself.
 *
 * - `story`, `meta`, `actions`: the data and the app-level actions (refresh, replay, new lookup).
 * - `active`: true while this slide is the current one, false while it is animating out. A slide
 *   is mounted on arrival and unmounted after it leaves, so mounting is also the arrival signal:
 *   play the one-shot entrance animation on mount (not scrubbed by scroll).
 * - `skipAnimation`: the player is asking you to finish now (the reader tapped while the entrance
 *   was playing). Jump counters and staggers to their final state. Entrances should finish within
 *   `ENTRANCE_MS` (src/story/slide-index.ts), the window in which a tap only completes them.
 * - `reducedMotion`: the reader prefers reduced motion. Show final values at once (no count-ups,
 *   no staggers, no movement). Use this prop, not framer-motion's `useReducedMotion`: framer reads
 *   the preference once per module, so it cannot be tested across cases, while this prop can be
 *   set per test (`<Slide {...fixtureSlideProps()} reducedMotion ... />`).
 * - `paused`: the reader is pressing and holding (phone). CSS animations are already paused via
 *   the stage; use this to hold framer-motion or timer-driven animations. The player also stops
 *   the entrance clock while held.
 * - `actions.onReplay` already returns the story to slide 1 (the player owns the index) before it
 *   calls the app's own replay handler, so the summary slide just calls it.
 *
 * Taps on the slide area navigate (phone), so the slide's own interactive controls must be real
 * `<button>`, `<a>`, `<input>` or `<select>` elements: those (and only those) receive pointer
 * events. Keep all text as real DOM text (ADR 0054).
 */
export type SlideComponentProps = SlideProps & {
  active: boolean;
  skipAnimation: boolean;
  reducedMotion: boolean;
  paused: boolean;
};

export type SlideComponent = ComponentType<SlideComponentProps>;
