import { headlineFor } from "@/story/copy";
import { STORY_ACTIONS_COPY } from "@/story/copy-entry";
import { INTRO_COPY, formatLedgerDate, matchesUnit } from "@/story/copy-slides-1-4";
import { formatHours } from "@/story/format";
import { basedOnMatches } from "@/story/window-label";
import { SlideFrame } from "../SlideFrame";
import { SlideReveal } from "../SlideReveal";
import { StoryCountUp } from "../StoryCountUp";
import { WindowLabel } from "../WindowLabel";
import type { SlideComponent } from "./contract";
import styles from "./IntroSlide.module.css";

/** Slide 1: matches and hours in the Cursed City, as two stamped ledger figures. */
export const IntroSlide: SlideComponent = ({
  story,
  meta,
  actions,
  skipAnimation,
  reducedMotion,
  paused,
}) => {
  const { intro } = story;
  const playing = !reducedMotion && !skipAnimation;
  const count = { reducedMotion, skipAnimation, paused };
  const dates: { label: string; at: string }[] = [];
  if (intro.firstMatchAt) dates.push({ label: INTRO_COPY.firstEntry, at: intro.firstMatchAt });
  if (intro.lastMatchAt) dates.push({ label: INTRO_COPY.latestEntry, at: intro.lastMatchAt });

  return (
    <SlideFrame headline={headlineFor("intro")}>
      <div className={styles.slide}>
        <SlideReveal index={0} animate={playing} kind="stamp" className={styles.figure}>
          <p data-testid="intro-matches" className={styles.line}>
            <StoryCountUp value={intro.matches} className={styles.number} {...count} />{" "}
            <span className={styles.unit}>{matchesUnit(intro.matches)}</span>
          </p>
        </SlideReveal>
        <SlideReveal index={1} animate={playing} kind="stamp" className={styles.figure}>
          <p data-testid="intro-hours" className={styles.line}>
            <StoryCountUp
              value={intro.hoursPlayed}
              format={formatHours}
              className={styles.number}
              {...count}
            />{" "}
            <span className={styles.unit}>{INTRO_COPY.hoursUnit}</span>
          </p>
        </SlideReveal>

        {dates.length > 0 && (
          <SlideReveal index={2} animate={playing} className={styles.dates}>
            {dates.map((d) => (
              <p key={d.label} className={styles.entry}>
                <span>{d.label}</span>
                <span className={styles.leader} aria-hidden="true" />
                <span>{formatLedgerDate(d.at)}</span>
              </p>
            ))}
          </SlideReveal>
        )}

        <SlideReveal index={3} animate={playing} className={styles.footer}>
          <div>
            <p className={styles.basedOn}>{basedOnMatches(story.matchCount)}</p>
            <WindowLabel meta={meta} className={styles.window} />
          </div>
          <button type="button" className={styles.refresh} onClick={actions.onRefresh}>
            {STORY_ACTIONS_COPY.refresh}
          </button>
        </SlideReveal>
      </div>
    </SlideFrame>
  );
};
