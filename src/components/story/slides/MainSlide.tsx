import { MAIN_COPY, headlineFor, mainPercentileLine, matchesUnit } from "@/story/copy";
import { formatPercent } from "@/story/format";
import { heroName } from "@/story/heroes";
import { HeroTile } from "../HeroTile";
import { SlideFrame } from "../SlideFrame";
import { SlideReveal } from "../SlideReveal";
import { StoryCountUp } from "../StoryCountUp";
import type { SlideComponent } from "./contract";
import styles from "./MainSlide.module.css";

/** Slide 2: the most-played hero, its record, and where that ranks. */
export const MainSlide: SlideComponent = ({ story, skipAnimation, reducedMotion, paused }) => {
  const { main } = story;
  const playing = !reducedMotion && !skipAnimation;
  const count = { reducedMotion, skipAnimation, paused };
  // `main` is only null with zero matches, when the story never mounts; render the frame anyway.
  const line = main ? mainPercentileLine(main, story.percentiles) : null;

  return (
    <SlideFrame headline={headlineFor("main")}>
      {main && (
        <div className={styles.slide}>
          <SlideReveal index={0} animate={playing} kind="stamp" className={styles.hero}>
            <HeroTile heroId={main.heroId} size="lg" />
            <div>
              <p className={styles.name}>{heroName(main.heroId)}</p>
              <p className={styles.caption}>{MAIN_COPY.mostPlayed}</p>
            </div>
          </SlideReveal>

          <SlideReveal index={1} animate={playing} className={styles.stats}>
            <p data-testid="main-matches" className={styles.stat}>
              <StoryCountUp value={main.matches} className={styles.number} {...count} />{" "}
              <span className={styles.unit}>{matchesUnit(main.matches)}</span>
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
            <SlideReveal index={2} animate={playing} kind="stamp">
              <div
                className={styles.stamp}
                data-scope={line.scope}
                data-testid={line.scope === "neutral" ? "main-neutral" : undefined}
              >
                <p className={styles.rank}>{line.text}</p>
                {line.metric && <p className={styles.metric}>{line.metric}</p>}
              </div>
            </SlideReveal>
          )}
        </div>
      )}
    </SlideFrame>
  );
};
