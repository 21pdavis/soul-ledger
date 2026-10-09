import {
  RECENT_COPY,
  ROSTER_COPY,
  headlineFor,
  matchesUnit,
  recentTrend,
  rosterVerdict,
} from "@/story/copy";
import { formatPercent } from "@/story/format";
import { heroName } from "@/story/heroes";
import { clampShare } from "@/story/monogram";
import { MonogramTile } from "../MonogramTile";
import { SlideFrame } from "../SlideFrame";
import { SlideReveal } from "../SlideReveal";
import { StoryCountUp } from "../StoryCountUp";
import type { SlideComponent } from "./contract";
import { useFitCount } from "./useFitCount";
import styles from "./RosterSlide.module.css";

/** Fewest top heroes worth listing when the stage is short. */
const MIN_TOP_HEROES = 3;

/** Slide 3: how many heroes, one-trick or flex (ADR 0038), and the top five played. */
export const RosterSlide: SlideComponent = ({ story, skipAnimation, reducedMotion, paused }) => {
  const { roster } = story;
  const playing = !reducedMotion && !skipAnimation;
  const verdict = rosterVerdict(roster.label);
  const heroTrends = roster.topHeroes.map((h) => recentTrend(h.winRate, h.recent));
  const overall = recentTrend(story.intro.winRate, roster.recent);
  // The slide never scrolls, so the list of top heroes shows as many as the stage has room for.
  const { ref, count: shown } = useFitCount(roster.topHeroes.length, MIN_TOP_HEROES);

  return (
    <SlideFrame headline={headlineFor("roster")}>
      <div className={styles.slide} ref={ref}>
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

        {overall && (
          <SlideReveal index={1} animate={playing}>
            <p
              className={styles.overall}
              data-testid="roster-recent"
              data-trend={overall.direction}
            >
              {ROSTER_COPY.allTime} {overall.allTime} {ROSTER_COPY.winRate} · {RECENT_COPY.label}{" "}
              {overall.recent} {overall.arrow}{" "}
              <span className={styles.meta}>({overall.window})</span>
            </p>
          </SlideReveal>
        )}

        {roster.topHeroes.length > 0 && (
          <div className={styles.top}>
            <p className={styles.caption}>{ROSTER_COPY.topHeroes}</p>
            <ol className={styles.list}>
              {roster.topHeroes.slice(0, shown).map((h, i) => (
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
                    {heroTrends[i] && (
                      <p className={styles.recent} data-trend={heroTrends[i].direction}>
                        {RECENT_COPY.label} {heroTrends[i].recent} {heroTrends[i].arrow}
                      </p>
                    )}
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
