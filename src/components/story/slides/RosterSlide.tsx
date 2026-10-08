import { headlineFor } from "@/story/copy";
import { ROSTER_COPY, matchesUnit, rosterVerdict } from "@/story/copy-slides-1-4";
import { formatPercent } from "@/story/format";
import { heroName } from "@/story/heroes";
import { clampShare } from "@/story/monogram";
import { MonogramTile } from "../MonogramTile";
import { SlideFrame } from "../SlideFrame";
import { SlideReveal } from "../SlideReveal";
import { StoryCountUp } from "../StoryCountUp";
import type { SlideComponent } from "./contract";
import styles from "./RosterSlide.module.css";

/** Slide 3: how many heroes, one-trick or flex (ADR 0038), and the top five played. */
export const RosterSlide: SlideComponent = ({ story, skipAnimation, reducedMotion, paused }) => {
  const { roster } = story;
  const playing = !reducedMotion && !skipAnimation;
  const verdict = rosterVerdict(roster.label);

  return (
    <SlideFrame headline={headlineFor("roster")}>
      <div className={styles.slide}>
        <SlideReveal index={0} animate={playing} kind="stamp">
          <p data-testid="roster-heroes" className={styles.count}>
            <StoryCountUp
              value={roster.heroesPlayed}
              reducedMotion={reducedMotion}
              skipAnimation={skipAnimation}
              paused={paused}
              className={styles.number}
            />{" "}
            <span className={styles.unit}>{ROSTER_COPY.heroesPlayedUnit(roster.heroesPlayed)}</span>
          </p>
        </SlideReveal>

        <SlideReveal index={1} animate={playing} kind="stamp" className={styles.verdict}>
          <p className={styles.stamp} data-label={roster.label}>
            {verdict.title}
          </p>
          <p className={styles.blurb}>{verdict.blurb}</p>
        </SlideReveal>

        {roster.topHeroes.length > 0 && (
          <div className={styles.top}>
            <p className={styles.caption}>{ROSTER_COPY.topHeroes}</p>
            <ol className={styles.list}>
              {roster.topHeroes.map((h, i) => (
                <SlideReveal
                  as="li"
                  key={h.heroId}
                  index={i + 2}
                  animate={playing}
                  className={styles.row}
                >
                  <MonogramTile heroId={h.heroId} />
                  <div className={styles.who}>
                    <p className={styles.heroName}>{heroName(h.heroId)}</p>
                    <p className={styles.meta}>
                      {h.matches.toLocaleString("en-US")} {matchesUnit(h.matches)}
                    </p>
                  </div>
                  <div className={styles.rate}>
                    <p className={styles.meta}>
                      {formatPercent(h.winRate)} {ROSTER_COPY.winRate}
                    </p>
                    <span className={styles.track} aria-hidden="true">
                      <span
                        className={styles.fill}
                        style={{ width: `${clampShare(h.winRate) * 100}%` }}
                      />
                    </span>
                  </div>
                </SlideReveal>
              ))}
            </ol>
          </div>
        )}
      </div>
    </SlideFrame>
  );
};
