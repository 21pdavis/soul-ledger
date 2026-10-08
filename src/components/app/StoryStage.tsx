import { StoryPlayer } from "@/components/story/StoryPlayer";
import type { SlideProps } from "@/story/types";
import styles from "./StoryStage.module.css";

/**
 * The story, as the app mounts it: App renders exactly this with the slide props, and remounts it
 * on Replay.
 *
 * Not in here, on purpose: the Valve notice and the cached-matches note. App renders both in a
 * strip after this stage, so they stay on screen and cannot cover the player.
 */
export function StoryStage(props: SlideProps) {
  return (
    <main className={styles.stage}>
      <StoryPlayer {...props} />
    </main>
  );
}
