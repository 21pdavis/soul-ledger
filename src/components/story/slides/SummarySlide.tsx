import {
  STORY_ACTIONS_COPY,
  SUMMARY_COPY,
  headlineFor,
  summaryHeroPool,
  summaryRows,
} from "@/story/copy";
import { basedOnMatches } from "@/story/window-label";
import { MonogramTile } from "../MonogramTile";
import { SlideFrame } from "../SlideFrame";
import { WindowLabel } from "../WindowLabel";
import type { SlideComponent } from "./contract";
import styles from "./SummarySlide.module.css";

/**
 * Slide 11: the closing ledger entry. A static card (PNG export is M4) with the headline numbers
 * as ruled ledger lines, a stamp, and the three actions. The only motion is the stamp landing
 * once; with `skipAnimation` or `reducedMotion` it is simply there. The Valve notice (ADR 0016) is
 * the app's strip under the player, not part of the card.
 */
export const SummarySlide: SlideComponent = ({
  story,
  meta,
  actions,
  skipAnimation,
  reducedMotion,
}) => {
  const rows = summaryRows(story);
  const pool = summaryHeroPool(story);
  const motion = skipAnimation || reducedMotion ? "still" : "play";

  return (
    <SlideFrame headline={headlineFor("summary")}>
      <div className={styles.summary}>
        <div className={styles.card}>
          <ul className={styles.ledger} role="list" aria-label="Your ledger entry">
            {rows.map((row) => (
              <li key={row.key} className={styles.line} data-row={row.key}>
                <span className={styles.label} title={row.label}>
                  {row.label}
                </span>
                <span className={styles.leader} aria-hidden="true" />
                <span className={styles.value}>{row.value}</span>
                {row.note && <span className={styles.note}>{row.note}</span>}
              </li>
            ))}
          </ul>

          {pool && (
            <div className={styles.pool}>
              <p className={styles.poolCaption}>{pool.caption}</p>
              <ul className={styles.heroes} role="list" aria-label={SUMMARY_COPY.heroPoolLabel}>
                {pool.heroes.map((h) => (
                  <li key={h.heroId} className={styles.hero} title={`${h.name}: ${h.matches}`}>
                    <MonogramTile heroId={h.heroId} />
                    <span className={styles.heroName}>{h.name}</span>
                    <span className={styles.heroRate}>{h.winRate}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className={styles.foot}>
            <div className={styles.basis}>
              <WindowLabel meta={meta} className={styles.window} />
              <p className={styles.based}>{basedOnMatches(story.matchCount)}</p>
            </div>
            <button type="button" className={styles.refresh} onClick={actions.onRefresh}>
              {STORY_ACTIONS_COPY.refresh}
            </button>
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
        </div>
      </div>
    </SlideFrame>
  );
};
