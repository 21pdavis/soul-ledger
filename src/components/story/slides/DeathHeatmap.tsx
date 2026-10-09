import { useId } from "react";
import type { DeathBins, HotCell } from "@/story/death-bins";
import { DeadlockMap } from "./DeadlockMap";
import styles from "./RoastSlide.module.css";

const VIEW = 240;
const PAD = 20;

interface Props {
  bins: DeathBins;
  hot: HotCell;
  /** Reduced motion or skip: the hottest cell does not pulse. */
  still: boolean;
}

/**
 * An SVG density plot of where the player died, glowing over a stylised Deadlock map (ADR 0053
 * said no map; the owner asked for one after M2). Brighter brass means more deaths; the hottest
 * cell gets a green ring. Row 0 of the bins is the lowest y, so rows are drawn bottom-up.
 */
export function DeathHeatmap({ bins, hot, still }: Props) {
  const id = useId();
  const cell = (VIEW - PAD * 2) / bins.cols;
  const rowH = (VIEW - PAD * 2) / bins.rows;
  const x = (col: number) => PAD + col * cell;
  const y = (row: number) => PAD + (bins.rows - 1 - row) * rowH;

  const cells = bins.counts.flatMap((count, i) =>
    count > 0 ? [{ col: i % bins.cols, row: Math.floor(i / bins.cols), count }] : [],
  );

  return (
    <svg
      className={styles.plot}
      viewBox={`0 0 ${VIEW} ${VIEW}`}
      role="img"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-desc`}
    >
      <defs>
        <filter id={`${id}-glow`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="0.9" />
        </filter>
      </defs>
      <title id={`${id}-title`}>Where you died</title>
      <desc id={`${id}-desc`}>
        {`${bins.total} ${bins.total === 1 ? "death" : "deaths"} plotted on a ${bins.cols} by ${bins.rows} grid. Hottest spot: ${hot.count} ${hot.count === 1 ? "death" : "deaths"} in one cell.`}
      </desc>

      {/* Deco frame: double rule and chamfered corner ticks. */}
      <rect x="2" y="2" width={VIEW - 4} height={VIEW - 4} className={styles.frameOuter} />
      <rect x="9" y="9" width={VIEW - 18} height={VIEW - 18} className={styles.frameInner} />
      {[
        [2, 2, 1, 1],
        [VIEW - 2, 2, -1, 1],
        [2, VIEW - 2, 1, -1],
        [VIEW - 2, VIEW - 2, -1, -1],
      ].map(([cx, cy, sx, sy]) => (
        <path
          key={`${cx}-${cy}`}
          d={`M${cx + sx * 16} ${cy} L${cx} ${cy} L${cx} ${cy + sy * 16} M${cx + sx * 4} ${cy + sy * 4} L${cx + sx * 13} ${cy + sy * 13}`}
          className={styles.ornament}
        />
      ))}

      <DeadlockMap />

      <g aria-hidden="true">
        {cells.map(({ col, row, count }) => (
          <rect
            key={`${col}-${row}`}
            data-count={count}
            x={x(col) + 1}
            y={y(row) + 1}
            width={cell - 2}
            height={rowH - 2}
            className={styles.heat}
            filter={`url(#${id}-glow)`}
            fillOpacity={0.18 + 0.72 * Math.sqrt(count / hot.count)}
          />
        ))}
        <rect
          data-hottest
          x={x(hot.col) - 1}
          y={y(hot.row) - 1}
          width={cell + 2}
          height={rowH + 2}
          className={styles.hotRing}
          data-still={still}
        />
      </g>
    </svg>
  );
}
