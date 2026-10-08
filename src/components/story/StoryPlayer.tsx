"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { SLIDES, SLIDE_COUNT } from "@/story/copy";
import { ENTRANCE_MS, initialPlayerState, reducePlayer } from "@/story/slide-index";
import type { SlideProps } from "@/story/types";
import { ProgressBar } from "./ProgressBar";
import { ScrollTrack } from "./ScrollTrack";
import { SlideStage } from "./SlideStage";
import { TapZone } from "./TapZone";
import { usePrefersReducedMotion } from "./useMediaQuery";
import { useStoryMode } from "./useStoryMode";
import styles from "./StoryPlayer.module.css";

interface Props extends SlideProps {
  /** How long an entrance may run before taps advance again. Tests shorten it. */
  entranceMs?: number;
}

/**
 * The 11-slide story (ADR 0050). Owns the one slide index; two controllers drive it:
 * - tap (phone, or anything narrower than 1024px / coarse pointer): tap zones, hold to pause;
 * - scroll (desktop): a pinned stage over scroll-snap checkpoints.
 * Slides never navigate themselves and are the same components in both modes.
 */
export function StoryPlayer({ story, meta, actions, entranceMs = ENTRANCE_MS }: Props) {
  const mode = useStoryMode();
  const reduced = usePrefersReducedMotion();
  const motion = !reduced;
  const [state, dispatch] = useReducer(reducePlayer, initialPlayerState);
  const [paused, setPaused] = useState(false);

  const indexRef = useRef(state.index);
  useEffect(() => {
    indexRef.current = state.index;
  });

  // An entrance ends by itself after entranceMs; a tap can end it sooner (reducer `skip`).
  useEffect(() => {
    if (!state.animating) return;
    const timer = window.setTimeout(() => dispatch({ type: "settled" }), entranceMs);
    return () => window.clearTimeout(timer);
  }, [state.animating, state.index, entranceMs]);

  const next = useCallback(() => dispatch({ type: "next", motion }), [motion]);
  const back = useCallback(() => dispatch({ type: "back", motion }), [motion]);
  const goTo = useCallback((index: number) => dispatch({ type: "goTo", index, motion }), [motion]);

  // Keyboard, both modes. Tap mode taps complete a running entrance first; in scroll mode a key is
  // a deliberate jump, so it always moves.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target instanceof Element ? e.target : null;
      if (target?.closest("input, textarea, select, [contenteditable]")) return;
      const forward = e.key === "ArrowRight" || e.key === " ";
      const backward = e.key === "ArrowLeft";
      if (!forward && !backward) return;
      // Space on a focused control presses that control; arrows always navigate.
      if (e.key === " " && target?.closest("button, a, summary")) return;
      e.preventDefault();
      if (mode === "scroll") goTo(indexRef.current + (forward ? 1 : -1));
      else if (forward) next();
      else back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, next, back, goTo]);

  const headline = SLIDES[state.index].headline;
  const tap = mode === "tap";

  const stage = (
    <div
      className={styles.stage}
      data-testid="story-stage"
      data-slide={SLIDES[state.index].id}
      data-animating={state.animating}
      data-paused={paused}
    >
      {tap && (
        <div className={styles.zones}>
          <TapZone side="back" onTap={back} onHoldChange={setPaused} />
          <TapZone side="next" onTap={next} onHoldChange={setPaused} />
        </div>
      )}
      <SlideStage
        index={state.index}
        direction={state.direction}
        reduced={reduced}
        skipAnimation={state.skip}
        paused={paused}
        story={story}
        meta={meta}
        actions={actions}
      />
      <div className={styles.progress} data-interactive={!tap}>
        <ProgressBar count={SLIDE_COUNT} current={state.index} onSelect={tap ? undefined : goTo} />
      </div>
      {tap && (
        <>
          <button type="button" className={styles.srNav} data-side="back" onClick={back}>
            Previous slide
          </button>
          <button type="button" className={styles.srNav} data-side="next" onClick={next}>
            Next slide
          </button>
        </>
      )}
    </div>
  );

  return (
    <div className={styles.root} data-testid="story-player" data-mode={mode}>
      {tap ? (
        <div className={styles.phone}>{stage}</div>
      ) : (
        <ScrollTrack index={state.index} smooth={motion} onArrive={goTo}>
          {stage}
        </ScrollTrack>
      )}
      <div role="status" aria-live="polite" className={styles.visuallyHidden}>
        {`Slide ${state.index + 1} of ${SLIDE_COUNT}: ${headline}`}
      </div>
    </div>
  );
}
