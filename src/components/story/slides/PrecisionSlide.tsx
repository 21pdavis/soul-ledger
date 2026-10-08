import type { CSSProperties } from "react";
import { PARRY_KING_RATE } from "@/lib/stats/story";
import { headlineFor } from "@/story/copy";
import { PRECISION_COPY, parryCopy, parryKingLine } from "@/story/copy-slides-5-7";
import { parryRate } from "@/story/kill-shares";
import { PrecisionDial } from "../PrecisionDial";
import { SlideFrame } from "../SlideFrame";
import type { SlideComponent } from "./contract";
import styles from "./PrecisionSlide.module.css";

/** Slide 6: precision. Two dials (accuracy, headshot rate) and the parry king or clown stamp. */
export const PrecisionSlide: SlideComponent = ({ story, skipAnimation, reducedMotion, paused }) => {
  const { precision } = story;
  const animate = !skipAnimation && !reducedMotion;
  const parry = parryCopy(precision);
  const rate = parryRate(precision);

  return (
    <SlideFrame headline={headlineFor("precision")}>
      <div className={styles.slide} data-testid="precision-slide" data-animate={animate}>
        <div className={styles.dials}>
          <PrecisionDial
            id="accuracy"
            label={PRECISION_COPY.accuracy}
            rate={precision.heroAccuracy}
            animate={animate}
            paused={paused}
          />
          <PrecisionDial
            id="headshot"
            label={PRECISION_COPY.headshotRate}
            rate={precision.headshotRate}
            animate={animate}
            paused={paused}
            delayMs={120}
          />
        </div>

        <section
          className={styles.parry}
          data-testid="parry"
          data-label={precision.parryLabel}
          aria-label={PRECISION_COPY.parryHeading}
        >
          {parry.badge && (
            <p className={styles.stamp} data-label={precision.parryLabel}>
              {parry.badge}
            </p>
          )}
          <p className={styles.line} data-testid="parry-line">
            {parry.line}
          </p>
          {parry.detail && (
            <>
              <p className={styles.detail}>{parry.detail}</p>
              <div
                className={styles.meter}
                data-testid="parry-meter"
                data-rate={rate}
                data-king-rate={PARRY_KING_RATE}
                aria-hidden="true"
                style={{ "--rate": rate, "--king": PARRY_KING_RATE } as CSSProperties}
              >
                <div className={styles.fill} />
                <div className={styles.kingMark} />
              </div>
              <p className={styles.threshold}>{parryKingLine()}</p>
            </>
          )}
        </section>
      </div>
    </SlideFrame>
  );
};
