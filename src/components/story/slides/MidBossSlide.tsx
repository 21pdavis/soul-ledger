import { headlineFor } from "@/story/copy";
import { midBossCopy } from "@/story/copy-slides-5-7";
import { SlideFrame } from "../SlideFrame";
import { StoryCountUp } from "../StoryCountUp";
import type { SlideComponent } from "./contract";
import styles from "./MidBossSlide.module.css";

/** A faceted deco gem standing in for the Rejuvenator. Hollow when none were claimed. */
function Gem({ filled }: { filled: boolean }) {
  return (
    <svg
      className={styles.gem}
      data-filled={filled}
      viewBox="0 0 100 120"
      aria-hidden="true"
      focusable="false"
    >
      <polygon className={styles.body} points="50,4 90,42 50,116 10,42" />
      <polyline className={styles.facet} points="10,42 90,42" />
      <polyline className={styles.facet} points="50,4 33,42 50,116 67,42 50,4" />
    </svg>
  );
}

/** Slide 7: Mid Boss business. Rejuvenators claimed, and the ones stolen from under the other team. */
export const MidBossSlide: SlideComponent = ({ story, skipAnimation, reducedMotion, paused }) => {
  const { midBoss } = story;
  const animate = !skipAnimation && !reducedMotion;
  const claimed = midBoss.claimed > 0;
  const copy = midBossCopy(midBoss);

  return (
    <SlideFrame headline={headlineFor("midBoss")}>
      <div
        className={styles.slide}
        data-testid="midboss-slide"
        data-animate={animate}
        data-claimed={claimed}
      >
        <Gem filled={claimed} />
        {claimed ? (
          <div className={styles.count}>
            <StoryCountUp
              className={styles.numeral}
              value={midBoss.claimed}
              reducedMotion={reducedMotion}
              skipAnimation={skipAnimation}
              paused={paused}
              delayMs={150}
              durationMs={600}
            />
            <span className={styles.label}>{copy.lead}</span>
          </div>
        ) : (
          <p className={styles.empty}>{copy.lead}</p>
        )}
        <p className={styles.line}>{copy.line}</p>
        {copy.stolen && <p className={styles.stolen}>{copy.stolen}</p>}
      </div>
    </SlideFrame>
  );
};
