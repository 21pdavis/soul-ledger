import { WindowLabel } from "@/components/story/WindowLabel";
import { STORY_ACTIONS_COPY } from "@/story/copy-entry";
import type { SlideProps } from "@/story/types";
import { basedOnMatches } from "@/story/window-label";
import styles from "./StoryStage.module.css";

/**
 * THE swap point for the story (M2 PR 4 / orchestrator): App renders exactly this with the
 * slide props, remounting it on Replay. Replace the body with `<StoryPlayer {...props} />`.
 * Until then it is a clearly marked placeholder that still exercises the actions.
 *
 * Not in here, on purpose: the Valve notice and the cached-matches note. App renders both in a
 * footer strip after the stage, so they survive the swap and cannot cover the player.
 */
export function StoryStage({ story, meta, actions }: SlideProps) {
  return (
    <main className={styles.stage}>
      <p className={styles.marker}>Placeholder: the story player arrives in a later PR.</p>
      <h1 className={styles.title}>{`Story ready: ${story.matchCount} matches`}</h1>
      <WindowLabel meta={meta} className={styles.line} />
      <p className={styles.line}>{basedOnMatches(story.matchCount)}</p>
      <div className={styles.actions}>
        <button type="button" onClick={actions.onRefresh}>
          {STORY_ACTIONS_COPY.refresh}
        </button>
        <button type="button" onClick={actions.onReplay}>
          {STORY_ACTIONS_COPY.replay}
        </button>
        <button type="button" onClick={actions.onNewLookup}>
          {STORY_ACTIONS_COPY.newLookup}
        </button>
      </div>
    </main>
  );
}
