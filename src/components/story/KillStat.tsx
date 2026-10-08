"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  value: number;
  /** True while the entrance should play. False shows the final value (skip, reduced motion). */
  animate: boolean;
  /** The reader is holding the screen: stop where we are and carry on when released. */
  paused: boolean;
  /** Wait this long before counting, so figures can follow one another. */
  delayMs?: number;
  durationMs?: number;
  format?: (n: number) => string;
  className?: string;
}

const formatCount = (n: number) => n.toLocaleString("en-US");
const easeOut = (t: number) => 1 - (1 - t) ** 3;

/**
 * A figure that counts up from 0 on mount (slides 5 to 7). One real text node, so tests and screen
 * readers see the number; with `animate` false it is simply the final value.
 */
export function KillStat({
  value,
  animate,
  paused,
  delayMs = 0,
  durationMs = 600,
  format = formatCount,
  className,
}: Props) {
  const [progress, setProgress] = useState(0);
  const elapsed = useRef(0);

  useEffect(() => {
    if (!animate || paused) return;
    let frame = 0;
    let last: number | null = null;
    const tick = (now: number) => {
      elapsed.current += last === null ? 0 : now - last;
      last = now;
      const t = Math.min(1, Math.max(0, (elapsed.current - delayMs) / durationMs));
      setProgress(t);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [animate, paused, delayMs, durationMs]);

  const shown = animate ? Math.round(value * easeOut(progress)) : value;
  return (
    <span className={className} data-testid="kill-stat">
      {format(shown)}
    </span>
  );
}
