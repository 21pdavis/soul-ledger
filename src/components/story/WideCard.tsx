import { SLIDES } from "@/story/copy";
import type { SlideProps } from "@/story/types";
import { SlideFrame } from "./SlideFrame";
import { SLIDE_COMPONENTS } from "./slides";
import styles from "./StoryPlayer.module.css";

interface Props extends SlideProps {
  index: number;
  /** The slide the player is on. */
  current: number;
  /** The furthest slide the reader has reached: cards up to it show their content. */
  reached: number;
  /** The reader asked to finish the running entrance (only the current card has one). */
  skipAnimation: boolean;
  reducedMotion: boolean;
}

/**
 * One slide's card in the desktop vertical layout (ADR 0061). A card shows its slide once the
 * reader has reached it, so the entrance plays on arrival, not while it is offscreen; before that
 * it is an empty frame with only the headline (hidden from assistive tech: the slide is not
 * there yet). Slides the reader has passed are shown finished.
 */
export function WideCard({
  index,
  current,
  reached,
  skipAnimation,
  reducedMotion,
  story,
  meta,
  actions,
}: Props) {
  const { id, headline } = SLIDES[index];
  const isCurrent = index === current;
  const Slide = SLIDE_COMPONENTS[id];
  return (
    <div className={styles.card} data-testid="story-card" data-slide={id} data-current={isCurrent}>
      {index <= reached ? (
        <Slide
          story={story}
          meta={meta}
          actions={actions}
          active={isCurrent}
          skipAnimation={!isCurrent || skipAnimation}
          reducedMotion={reducedMotion}
          paused={false}
        />
      ) : (
        <div aria-hidden="true" className={styles.cardPlaceholder}>
          <SlideFrame headline={headline}>{null}</SlideFrame>
        </div>
      )}
    </div>
  );
}
