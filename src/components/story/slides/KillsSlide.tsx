import type { CSSProperties } from "react";
import { headlineFor } from "@/story/copy";
import { KILLS_COPY, killsLead, rangeLine } from "@/story/copy-slides-5-7";
import { killRows, rangeShares } from "@/story/kill-shares";
import { KillStat } from "../KillStat";
import { SlideFrame } from "../SlideFrame";
import type { SlideComponent } from "./contract";
import styles from "./KillsSlide.module.css";

/** Slide 5: how you kill. The total, the four kinds of kill, and close-up versus long-distance. */
export const KillsSlide: SlideComponent = ({ story, skipAnimation, reducedMotion, paused }) => {
  const { kills } = story;
  const animate = !skipAnimation && !reducedMotion;
  const rows = killRows(kills);
  const range = rangeShares(kills.closeup, kills.longDistance);
  const line = rangeLine(kills.closeup, kills.longDistance);
  const delayOf = (i: number) => 120 + i * 70;

  return (
    <SlideFrame headline={headlineFor("kills")}>
      <div className={styles.slide} data-testid="kill-slide" data-animate={animate}>
        <div className={styles.total} data-testid="kill-total">
          <KillStat
            className={styles.numeral}
            value={kills.total}
            animate={animate}
            paused={paused}
            durationMs={650}
          />
          <span className={styles.totalLabel}>{KILLS_COPY.total}</span>
        </div>
        <p className={styles.lead}>{killsLead(kills)}</p>

        <ul className={styles.ledger}>
          {rows.map((row, i) => (
            <li key={row.key} data-testid={`kill-row-${row.key}`}>
              <div className={styles.line}>
                <span className={styles.name}>{KILLS_COPY.types[row.key]}</span>
                <span className={styles.leader} aria-hidden="true" />
                <KillStat
                  className={styles.count}
                  value={row.count}
                  animate={animate}
                  paused={paused}
                  delayMs={delayOf(i)}
                  durationMs={450}
                />
              </div>
              <div className={styles.track} aria-hidden="true">
                <div
                  className={styles.bar}
                  data-testid="kill-bar"
                  data-kind={row.key}
                  data-share={row.share}
                  style={{ "--share": row.share, "--delay": `${delayOf(i)}ms` } as CSSProperties}
                />
              </div>
            </li>
          ))}
        </ul>

        <div className={styles.range} data-testid="kill-range">
          <h3 className={styles.rangeHeading}>{KILLS_COPY.rangeHeading}</h3>
          <div className={styles.split} aria-hidden="true">
            <div
              className={styles.segment}
              data-kind="closeup"
              style={{ "--share": range.closeup, "--delay": "330ms" } as CSSProperties}
            />
            <div
              className={styles.segment}
              data-kind="longDistance"
              style={{ "--share": range.longDistance, "--delay": "330ms" } as CSSProperties}
            />
          </div>
          <div className={styles.splitLabels}>
            <span>
              <span className={styles.splitName}>{KILLS_COPY.closeup}</span>
              <KillStat
                className={styles.splitValue}
                value={kills.closeup}
                animate={animate}
                paused={paused}
                delayMs={330}
                durationMs={400}
              />
            </span>
            <span>
              <span className={styles.splitName}>{KILLS_COPY.longDistance}</span>
              <KillStat
                className={styles.splitValue}
                value={kills.longDistance}
                animate={animate}
                paused={paused}
                delayMs={330}
                durationMs={400}
              />
            </span>
          </div>
          {line && <p className={styles.rangeLine}>{line}</p>}
        </div>
      </div>
    </SlideFrame>
  );
};
