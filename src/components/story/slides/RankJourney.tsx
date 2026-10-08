import { ladderHeight, type JourneyPoint } from "@/story/rank-journey";
import { rankLabel } from "@/story/ranks";
import styles from "./RankSlide.module.css";

const W = 300;
const H = 150;
const MARGIN_X = 24;
const TOP = 24;
const BOTTOM = H - 24;

const monthYear = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });

/** A diamond centred on (x, y) with half-width r. */
const diamond = (x: number, y: number, r: number) =>
  `M${x} ${y - r} L${x + r} ${y} L${x} ${y + r} L${x - r} ${y} Z`;

interface Props {
  /**
   * Milestones from `journeyMilestones`, oldest first. At least one. The last is always the
   * current rank's run (the history has one entry per match, so the milestone keeps the first
   * match of that run, not the latest one).
   */
  points: JourneyPoint[];
}

/**
 * The climb as badges on a line: height is rank, left to right is time. One badge draws no line.
 * The plot is decoration (hidden from assistive tech); the list under it says the same in text.
 */
export function RankJourney({ points }: Props) {
  const heights = points.map(ladderHeight);
  const lo = Math.min(...heights);
  const hi = Math.max(...heights);
  const pos = points.map((p, i) => ({
    p,
    x: points.length === 1 ? W / 2 : MARGIN_X + (i * (W - 2 * MARGIN_X)) / (points.length - 1),
    y: hi === lo ? (TOP + BOTTOM) / 2 : BOTTOM - ((heights[i] - lo) / (hi - lo)) * (BOTTOM - TOP),
  }));

  return (
    <>
      <svg className={styles.plot} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        <line x1="8" y1={TOP} x2={W - 8} y2={TOP} className={styles.guide} />
        <line x1="8" y1={BOTTOM} x2={W - 8} y2={BOTTOM} className={styles.guide} />
        {pos.length > 1 && (
          <polyline points={pos.map(({ x, y }) => `${x},${y}`).join(" ")} className={styles.line} />
        )}
        {pos.map(({ p, x, y }, i) => {
          const isCurrent = i === pos.length - 1;
          return (
            <path
              key={p.matchId}
              data-badge={p.badge}
              data-current={isCurrent}
              d={diamond(x, y, isCurrent ? 11 : 7)}
              className={isCurrent ? styles.badgeNow : styles.badge}
            />
          );
        })}
      </svg>
      <ol className={styles.list}>
        {points.map((p, i) => {
          const isCurrent = i === points.length - 1;
          return (
            <li
              key={p.matchId}
              className={styles.item}
              aria-current={isCurrent ? "step" : undefined}
            >
              <span className={styles.name}>{rankLabel(p)}</span>{" "}
              <time className={styles.date} dateTime={p.at}>
                {monthYear(p.at)}
              </time>
            </li>
          );
        })}
      </ol>
    </>
  );
}
