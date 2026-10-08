import { headlineFor } from "@/story/copy";
import { rankSummary } from "@/story/copy-slides-8-10";
import { journeyMilestones } from "@/story/rank-journey";
import { rankLabel } from "@/story/ranks";
import { SlideFrame } from "../SlideFrame";
import type { SlideComponent } from "./contract";
import { RankJourney } from "./RankJourney";
import styles from "./RankSlide.module.css";
import { StaggerIn } from "./StaggerIn";

export const RankSlide: SlideComponent = ({ story, skipAnimation, reducedMotion, paused }) => {
  const { journey, current } = story.rank;
  const motion = { skipAnimation, reducedMotion, paused };
  const summary = rankSummary(journey, current);

  return (
    <SlideFrame headline={headlineFor("rank")}>
      <div className={styles.content}>
        {summary.kind === "empty" || !current ? (
          <StaggerIn {...motion}>
            <p className={styles.friendly}>{summary.text}</p>
          </StaggerIn>
        ) : (
          <>
            <StaggerIn index={0} {...motion}>
              <p className={styles.summary}>{summary.text}</p>
            </StaggerIn>
            <StaggerIn index={1} {...motion}>
              <div className={styles.current} data-testid="current-rank">
                <span className={styles.currentName}>{rankLabel(current)}</span>
                <span className={styles.currentCaption}>Current rank</span>
              </div>
            </StaggerIn>
            <StaggerIn index={2} {...motion}>
              <RankJourney points={journeyMilestones(journey)} />
            </StaggerIn>
          </>
        )}
      </div>
    </SlideFrame>
  );
};
