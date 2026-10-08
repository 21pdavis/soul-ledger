import { headlineFor, mvpCopy } from "@/story/copy";
import { SlideFrame } from "../SlideFrame";
import { SlideReveal } from "../SlideReveal";
import type { SlideComponent } from "./contract";
import styles from "./MvpSlide.module.css";

export const MvpSlide: SlideComponent = ({ story, skipAnimation, reducedMotion }) => {
  const copy = mvpCopy(story);
  const animate = !(reducedMotion || skipAnimation);

  if (copy.kind === "none") {
    return (
      <SlideFrame headline={headlineFor("mvp")}>
        <SlideReveal index={0} animate={animate}>
          <p className={styles.friendly}>{copy.line}</p>
        </SlideReveal>
      </SlideFrame>
    );
  }

  return (
    <SlideFrame headline={headlineFor("mvp")}>
      <div className={styles.card}>
        {copy.lead && (
          <SlideReveal index={0} animate={animate}>
            <p className={styles.lead}>{copy.lead}</p>
          </SlideReveal>
        )}
        <SlideReveal index={0} animate={animate}>
          <p className={styles.label}>{copy.label}</p>
        </SlideReveal>
        <SlideReveal index={1} animate={animate}>
          <p className={styles.big}>Top {copy.topPercent}%</p>
        </SlideReveal>
        <SlideReveal index={2} animate={animate}>
          <div className={styles.scope}>
            {copy.heroName && (
              <span className={styles.monogram} data-testid="hero-monogram" aria-hidden="true">
                {copy.heroName.charAt(0)}
              </span>
            )}
            <p className={styles.scopeLine}>{copy.scopeLine}</p>
          </div>
        </SlideReveal>
        <SlideReveal index={3} animate={animate}>
          <p className={styles.flavor}>{copy.flavor}</p>
        </SlideReveal>
      </div>
    </SlideFrame>
  );
};
