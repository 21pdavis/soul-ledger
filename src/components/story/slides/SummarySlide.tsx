import { Disclaimer } from "@/components/app/Disclaimer";
import { headlineFor } from "@/story/copy";
import { STORY_ACTIONS_COPY } from "@/story/copy-entry";
import { SUMMARY_COPY, summaryRows } from "@/story/copy-summary";
import { basedOnMatches } from "@/story/window-label";
import { SlideFrame } from "../SlideFrame";
import { WindowLabel } from "../WindowLabel";
import type { SlideComponent } from "./contract";
import styles from "./SummarySlide.module.css";

/**
 * Slide 11: the closing ledger entry. A static card (PNG export is M4) with the headline numbers
 * as ruled ledger lines, a stamp, and the three actions. The only motion is the stamp landing
 * once; with `skipAnimation` or `reducedMotion` it is simply there. The Valve notice sits on the
 * card itself because the app's notices strip is below the player, off screen here (ADR 0016).
 */
export const SummarySlide: SlideComponent = ({
  story,
  meta,
  actions,
  skipAnimation,
  reducedMotion,
}) => {
  const rows = summaryRows(story);
  const motion = skipAnimation || reducedMotion ? "still" : "play";

  return (
    <SlideFrame headline={headlineFor("summary")}>
      <div className={styles.summary}>
        <ul className={styles.ledger} aria-label="Your ledger entry">
          {rows.map((row) => (
            <li key={row.key} className={styles.line}>
              <span className={styles.label}>{row.label}</span>
              <span className={styles.leader} aria-hidden="true" />
              <span className={styles.value}>{row.value}</span>
              {row.note && <span className={styles.note}>{row.note}</span>}
            </li>
          ))}
        </ul>

        <div className={styles.foot}>
          <div className={styles.basis}>
            <WindowLabel meta={meta} className={styles.window} />
            <p className={styles.based}>{basedOnMatches(story.matchCount)}</p>
            <button type="button" className={styles.refresh} onClick={actions.onRefresh}>
              {STORY_ACTIONS_COPY.refresh}
            </button>
          </div>
          <div
            className={styles.stamp}
            data-testid="summary-stamp"
            data-motion={motion}
            aria-hidden="true"
          >
            {SUMMARY_COPY.stamp}
          </div>
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.primary} onClick={actions.onReplay}>
            {STORY_ACTIONS_COPY.replay}
          </button>
          <button type="button" className={styles.secondary} onClick={actions.onNewLookup}>
            {STORY_ACTIONS_COPY.newLookup}
          </button>
        </div>

        <div className={styles.notice}>
          <Disclaimer />
        </div>
      </div>
    </SlideFrame>
  );
};
