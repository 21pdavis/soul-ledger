"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { SLIDES, SLIDE_COUNT } from "@/story/copy";
import { ENTRANCE_MS, initialPlayerState, reducePlayer } from "@/story/slide-index";
import type { SlideProps } from "@/story/types";
import { ProgressBar } from "./ProgressBar";
import { ScrollTrack } from "./ScrollTrack";
import { WideCard } from "./WideCard";
import { SlideStage } from "./SlideStage";
import { TapZone } from "./TapZone";
import { useIsClient } from "./useIsClient";
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
 * - scroll (desktop): a vertical stack of wide cards over scroll-snap checkpoints (ADR 0062).
 * Slides never navigate themselves and are the same components in both modes.
 */
export function StoryPlayer({ story, meta, actions, entranceMs = ENTRANCE_MS }: Props) {
  const ready = useIsClient();
  const mode = useStoryMode();
  const reduced = usePrefersReducedMotion();
  const motion = !reduced;
  const [state, dispatch] = useReducer(reducePlayer, initialPlayerState);
  const [paused, setPaused] = useState(false);

  const indexRef = useRef(state.index);
  useEffect(() => {
    indexRef.current = state.index;
  });

  // The opening slide has an entrance too, so a first tap completes it rather than skipping it.
  const started = useRef(false);
  useEffect(() => {
    if (!ready || started.current) return;
    started.current = true;
    dispatch({ type: "start", motion });
  }, [ready, motion]);

  // An entrance ends by itself after entranceMs; a tap can end it sooner (reducer `skip`). Holding
  // pauses the clock, and it restarts in full on release.
  useEffect(() => {
    if (!state.animating || paused) return;
    const timer = window.setTimeout(() => dispatch({ type: "settled" }), entranceMs);
    return () => window.clearTimeout(timer);
  }, [state.animating, state.index, paused, entranceMs]);

  const next = useCallback(() => dispatch({ type: "next", motion }), [motion]);
  const back = useCallback(() => dispatch({ type: "back", motion }), [motion]);
  const goTo = useCallback((index: number) => dispatch({ type: "goTo", index, motion }), [motion]);

  // Only the player owns the index, so Replay (back to slide 1) goes through it, then tells the app.
  const { onReplay } = actions;
  const slideActions = useMemo(
    () => ({
      ...actions,
      onReplay: () => {
        goTo(0);
        onReplay();
      },
    }),
    [actions, goTo, onReplay],
  );

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

  // The furthest slide reached: on desktop, cards up to it show their slide.
  const [reached, setReached] = useState(0);
  if (state.index > reached) setReached(state.index);

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
        actions={slideActions}
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

  // The server cannot know the controller (it depends on the screen), and rendering a guess would
  // mount the stage in one place and then move it, replaying the entrance. So the stage appears
  // only once the browser has taken over; until then there is just the ink background.
  if (!ready) {
    return (
      <div className={styles.root} data-testid="story-player" data-mode="tap" aria-busy="true" />
    );
  }

  return (
    <div className={styles.root} data-testid="story-player" data-mode={mode}>
      {tap ? (
        <div className={styles.phone}>{stage}</div>
      ) : (
        <div
          className={styles.wide}
          data-testid="story-stage"
          data-slide={SLIDES[state.index].id}
          data-animating={state.animating}
        >
          <ScrollTrack
            index={state.index}
            smooth={motion}
            onArrive={goTo}
            renderCard={(i) => (
              <WideCard
                index={i}
                current={state.index}
                reached={reached}
                skipAnimation={state.skip}
                reducedMotion={reduced}
                story={story}
                meta={meta}
                actions={slideActions}
              />
            )}
          />
          <div className={styles.rail}>
            <ProgressBar
              count={SLIDE_COUNT}
              current={state.index}
              onSelect={goTo}
              orientation="vertical"
            />
          </div>
        </div>
      )}
      <div role="status" aria-live="polite" className={styles.visuallyHidden}>
        {`Slide ${state.index + 1} of ${SLIDE_COUNT}: ${headline}`}
      </div>
    </div>
  );
}
