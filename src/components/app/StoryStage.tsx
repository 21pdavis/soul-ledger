"use client";

import { StoryPlayer } from "@/components/story/StoryPlayer";
import type { SlideProps } from "@/story/types";
import styles from "./StoryStage.module.css";

/**
 * The story, as the app mounts it: App renders exactly this with the slide props, and remounts it
 * on Replay. The 3D world behind it belongs to App, which keeps one city for the whole visit
 * (ADR 0068, 0069, 0073); this reports the current slide so the camera can follow it.
 *
 * Not in here, on purpose: the Valve notice and the cached-matches note. App renders both in a
 * strip after this stage, so they stay on screen and cannot cover the player.
 */
export function StoryStage({
  onSlideChange,
  ...props
}: SlideProps & { onSlideChange?: (slide: number) => void }) {
  return (
    <main className={styles.stage}>
      {/* The page's one h1; the slide headlines are h2s below it. */}
      <h1 className={styles.visuallyHidden}>Your Soul Ledger story</h1>
      <div className={styles.player}>
        <StoryPlayer {...props} world onSlideChange={onSlideChange} />
      </div>
    </main>
  );
}
