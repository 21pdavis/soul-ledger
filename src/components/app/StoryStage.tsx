"use client";

import { useCallback, useState } from "react";
import { StoryPlayer } from "@/components/story/StoryPlayer";
import { WorldLayer } from "@/components/world/WorldLayer";
import { usePrefersReducedMotion } from "@/components/story/useMediaQuery";
import type { SlideProps } from "@/story/types";
import { StaleNote } from "./StaleNote";
import styles from "./StoryStage.module.css";

/**
 * The story, as the app mounts it: App renders exactly this with the slide props, and remounts it
 * on Replay. The 3D world sits behind the player (ADR 0068, 0069) and follows its current slide;
 * it starts loading only once the player reports its first slide, so it never delays the story.
 *
 * The cached-matches note floats over the first slide's empty band (a dismissible overlay, so it never
 * shrinks the stage, #38). Not in here, on purpose: the Valve notice, which App renders in the
 * always-visible strip after this stage (ADR 0016).
 */
export function StoryStage(props: SlideProps) {
  const [slide, setSlide] = useState<number | null>(null);
  const onSlideChange = useCallback((i: number) => setSlide(i), []);
  const [noteDismissed, setNoteDismissed] = useState(false);
  const reduced = usePrefersReducedMotion();
  return (
    <main className={styles.stage}>
      <WorldLayer
        story={props.story}
        slide={slide ?? 0}
        started={slide !== null}
        reducedMotion={reduced}
      />
      {/* The page's one h1; the slide headlines are h2s below it. */}
      <h1 className={styles.visuallyHidden}>Your Soul Ledger story</h1>
      <div className={styles.player}>
        <StoryPlayer
          {...props}
          world
          onSlideChange={onSlideChange}
          overlay={
            props.meta.stale && !noteDismissed ? (
              <StaleNote onDismiss={() => setNoteDismissed(true)} />
            ) : null
          }
        />
      </div>
    </main>
  );
}
