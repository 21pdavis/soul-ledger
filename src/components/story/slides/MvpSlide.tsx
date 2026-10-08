import { mvpCopy } from "@/story/copy-slides-8-10";
import { SlideFrame } from "../SlideFrame";
import type { SlideComponent } from "./contract";
import styles from "./MvpSlide.module.css";
import { StaggerIn } from "./StaggerIn";

export const MvpSlide: SlideComponent = ({ story, skipAnimation, reducedMotion, paused }) => {
  const copy = mvpCopy(story);
  const motion = { skipAnimation, reducedMotion, paused };

  if (copy.kind === "none") {
    return (
      <SlideFrame headline={copy.headline}>
        <StaggerIn {...motion}>
          <p className={styles.friendly}>{copy.line}</p>
        </StaggerIn>
      </SlideFrame>
    );
  }

  return (
    <SlideFrame headline={copy.headline}>
      <div className={styles.card}>
        <StaggerIn index={0} {...motion}>
          <p className={styles.label}>{copy.label}</p>
        </StaggerIn>
        <StaggerIn index={1} {...motion}>
          <p className={styles.big}>Top {copy.topPercent}%</p>
        </StaggerIn>
        <StaggerIn index={2} {...motion}>
          <div className={styles.scope}>
            {copy.heroName && (
              <span className={styles.monogram} data-testid="hero-monogram" aria-hidden="true">
                {copy.heroName.charAt(0)}
              </span>
            )}
            <p className={styles.scopeLine}>{copy.scopeLine}</p>
          </div>
        </StaggerIn>
        <StaggerIn index={3} {...motion}>
          <p className={styles.flavor}>{copy.flavor}</p>
        </StaggerIn>
      </div>
    </SlideFrame>
  );
};
