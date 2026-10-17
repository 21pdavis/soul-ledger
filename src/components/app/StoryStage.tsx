"use client";

import { useCallback, useState } from "react";
import { StoryPlayer } from "@/components/story/StoryPlayer";
import { WorldLayer } from "@/components/world/WorldLayer";
import { usePrefersReducedMotion } from "@/components/story/useMediaQuery";
import type { SlideProps } from "@/story/types";
import styles from "./StoryStage.module.css";

/**
 * The story, as the app mounts it: App renders exactly this with the slide props, and remounts it
 * on Replay. The 3D world sits behind the player (ADR 0068, 0069) and follows its current slide;
 * it starts loading only once the player reports its first slide, so it never delays the story.
 *
 * Not in here, on purpose: the Valve notice. App renders it in a strip after this stage, so it
 * stays on screen and cannot cover the player. The saved-matches line is part of slide 1's footer.
 */
export function StoryStage(props: SlideProps) {
  const [slide, setSlide] = useState<number | null>(null);
  const onSlideChange = useCallback((i: number) => setSlide(i), []);
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
        <StoryPlayer {...props} world onSlideChange={onSlideChange} />
      </div>
    </main>
  );
}
