import { headlineFor } from "@/story/copy";
import { MAIN_COPY, mainPercentileLine } from "@/story/copy-slides-1-4";
import { formatPercent } from "@/story/format";
import { heroName } from "@/story/heroes";
import { MonogramTile } from "../MonogramTile";
import { SlideFrame } from "../SlideFrame";
import { SlideReveal } from "../SlideReveal";
import { StoryCountUp } from "../StoryCountUp";
import type { SlideComponent } from "./contract";
import styles from "./MainSlide.module.css";

/** Slide 2: the most-played hero, its record, and where that ranks. */
export const MainSlide: SlideComponent = ({ story, skipAnimation, reducedMotion, paused }) => {
  const { main } = story;
  const motion = !reducedMotion && !skipAnimation;
  const count = { reducedMotion, skipAnimation, paused };
  // `main` is only null with zero matches, when the story never mounts; render the frame anyway.
  const line = main ? mainPercentileLine(main, story.percentiles) : null;

  return (
    <SlideFrame headline={headlineFor("main")}>
      {main && (
        <div className={styles.slide}>
          <SlideReveal index={0} motion={motion} kind="stamp" className={styles.hero}>
            <MonogramTile heroId={main.heroId} size="lg" />
            <div>
              <p className={styles.name}>{heroName(main.heroId)}</p>
              <p className={styles.caption}>{MAIN_COPY.mostPlayed}</p>
            </div>
          </SlideReveal>

          <SlideReveal index={1} motion={motion} className={styles.stats}>
            <p data-testid="main-matches" className={styles.stat}>
              <StoryCountUp value={main.matches} className={styles.number} {...count} />{" "}
              <span className={styles.unit}>{MAIN_COPY.matchesUnit}</span>
            </p>
            <p data-testid="main-winrate" className={styles.stat}>
              <StoryCountUp
                value={Math.round(main.winRate * 100)}
                format={(n) => formatPercent(n / 100)}
                className={styles.number}
                {...count}
              />{" "}
              <span className={styles.unit}>{MAIN_COPY.winRate}</span>
            </p>
          </SlideReveal>

          {line && (
            <SlideReveal index={2} motion={motion} kind="stamp">
              <div className={styles.stamp} data-scope={line.scope}>
                <p className={styles.rank}>{line.text}</p>
                <p className={styles.metric}>{line.metric}</p>
              </div>
            </SlideReveal>
          )}
        </div>
      )}
    </SlideFrame>
  );
};
