import type { CSSProperties } from "react";
import { share } from "@/story/kill-shares";
import { KillStat } from "./KillStat";
import styles from "./PrecisionDial.module.css";

interface Props {
  id: string;
  label: string;
  /** 0..1 */
  rate: number;
  animate: boolean;
  paused: boolean;
  delayMs?: number;
}

/** A deco half-dial with the rate stamped under the arc (slide 6). The arc is decoration; the figure is text. */
export function PrecisionDial({ id, label, rate, animate, paused, delayMs = 0 }: Props) {
  const clamped = share(rate, 1);
  return (
    <div className={styles.dial} data-testid={`dial-${id}`} data-animate={animate}>
      <svg className={styles.svg} viewBox="0 0 120 66" aria-hidden="true" focusable="false">
        <path className={styles.track} d="M10 60 A50 50 0 0 1 110 60" pathLength={100} />
        <path
          className={styles.arc}
          data-testid="dial-arc"
          data-rate={clamped}
          d="M10 60 A50 50 0 0 1 110 60"
          pathLength={100}
          style={{ "--fill": clamped * 100, "--delay": `${delayMs}ms` } as CSSProperties}
        />
        <path className={styles.ticks} d="M10 60 A50 50 0 0 1 110 60" pathLength={100} />
      </svg>
      <KillStat
        className={styles.figure}
        value={Math.round(clamped * 100)}
        format={(n) => `${n}%`}
        animate={animate}
        paused={paused}
        delayMs={delayMs}
        durationMs={550}
      />
      <span className={styles.label}>{label}</span>
    </div>
  );
}
