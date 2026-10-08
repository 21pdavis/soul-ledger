import { headlineFor, rankSummary } from "@/story/copy";
import { journeyMilestones, MAX_MILESTONES, MIN_MILESTONES } from "@/story/rank-journey";
import { rankLabel } from "@/story/ranks";
import { SlideFrame } from "../SlideFrame";
import { SlideReveal } from "../SlideReveal";
import type { SlideComponent } from "./contract";
import { RankJourney } from "./RankJourney";
import { useFitCount } from "./useFitCount";
import styles from "./RankSlide.module.css";

export const RankSlide: SlideComponent = ({ story, skipAnimation, reducedMotion }) => {
  const { journey, current } = story.rank;
  const animate = !(reducedMotion || skipAnimation);
  const summary = rankSummary(journey, current);
  // The slide never scrolls, so a long climb shows only as many rows as the stage has room for.
  const { ref, count } = useFitCount(MAX_MILESTONES, MIN_MILESTONES);

  return (
    <SlideFrame headline={headlineFor("rank")}>
      <div className={styles.content} ref={ref}>
        {summary.kind === "empty" || !current ? (
          <SlideReveal index={0} animate={animate}>
            <p className={styles.friendly}>{summary.text}</p>
          </SlideReveal>
        ) : (
          <>
            <SlideReveal index={0} animate={animate}>
              <p className={styles.summary}>{summary.text}</p>
            </SlideReveal>
            <SlideReveal index={1} animate={animate}>
              <div className={styles.current} data-testid="current-rank">
                <span className={styles.currentName}>{rankLabel(current)}</span>
                <span className={styles.currentCaption}>Current rank</span>
              </div>
            </SlideReveal>
            <SlideReveal index={2} animate={animate}>
              <RankJourney points={journeyMilestones(journey, count)} />
            </SlideReveal>
          </>
        )}
      </div>
    </SlideFrame>
  );
};
