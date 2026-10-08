import type { CSSProperties } from "react";
import { KILLS_COPY, headlineFor, killsTotalLabel } from "@/story/copy";
import { killRows, rangeShares } from "@/story/kill-shares";
import { SlideFrame } from "../SlideFrame";
import { StoryCountUp } from "../StoryCountUp";
import type { SlideComponent } from "./contract";
import styles from "./KillsSlide.module.css";

/** Slide 5: how you kill. The total, the four kinds of kill, and close-up versus long-distance. */
export const KillsSlide: SlideComponent = ({ story, skipAnimation, reducedMotion, paused }) => {
  const { kills } = story;
  const animate = !skipAnimation && !reducedMotion;
  const rows = killRows(kills);
  const range = rangeShares(kills.closeup, kills.longDistance);
  const motion = { reducedMotion, skipAnimation, paused };
  const delayOf = (i: number) => 120 + i * 70;

  return (
    <SlideFrame headline={headlineFor("kills")}>
      <div className={styles.slide} data-testid="kill-slide" data-animate={animate}>
        <div className={styles.total} data-testid="kill-total">
          <StoryCountUp
            className={styles.numeral}
            value={kills.total}
            {...motion}
            durationMs={650}
          />
          <span className={styles.totalLabel}>{killsTotalLabel(kills.total)}</span>
        </div>
        <p className={styles.lead}>{KILLS_COPY.line}</p>

        <ul className={styles.ledger}>
          {rows.map((row, i) => (
            <li
              key={row.key}
              data-testid={`kill-row-${row.key}`}
              data-subset={row.key === "headshot" ? true : undefined}
            >
              <div className={styles.line}>
                <span className={styles.name}>{KILLS_COPY.types[row.key]}</span>
                <span className={styles.leader} aria-hidden="true" />
                <StoryCountUp
                  className={styles.count}
                  value={row.count}
                  {...motion}
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
              <StoryCountUp
                className={styles.splitValue}
                value={kills.closeup}
                {...motion}
                delayMs={330}
                durationMs={400}
              />
            </span>
            <span>
              <span className={styles.splitName}>{KILLS_COPY.longDistance}</span>
              <StoryCountUp
                className={styles.splitValue}
                value={kills.longDistance}
                {...motion}
                delayMs={330}
                durationMs={400}
              />
            </span>
          </div>
        </div>
      </div>
    </SlideFrame>
  );
};
