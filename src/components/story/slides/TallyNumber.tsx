"use client";

import { animate, type AnimationPlaybackControls } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface Props {
  value: number;
  skipAnimation: boolean;
  reducedMotion: boolean;
  paused: boolean;
  /** Seconds. Kept well inside ENTRANCE_MS (800ms). */
  duration?: number;
  format?: (n: number) => string;
}

const withCommas = (n: number) => n.toLocaleString("en-US");

/**
 * A count-up for slides 8 to 10. Temporary: to be replaced by the shared StoryCountUp (#37). It shows the final value at once under reduced motion or when
 * the player skips (even part-way through), and holds while the reader presses and holds.
 */
export function TallyNumber({
  value,
  skipAnimation,
  reducedMotion,
  paused,
  duration = 0.6,
  format = withCommas,
}: Props) {
  const instant = reducedMotion || skipAnimation;
  const [counted, setShown] = useState(0);
  const controls = useRef<AnimationPlaybackControls | null>(null);

  useEffect(() => {
    // Instant (reduced motion or skip): the value is shown as it is, with nothing to run.
    if (instant) return;
    const c = animate(0, value, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setShown(Math.round(v)),
      onComplete: () => setShown(value),
    });
    controls.current = c;
    return () => {
      c.stop();
      controls.current = null;
    };
  }, [instant, value, duration]);

  useEffect(() => {
    if (paused) controls.current?.pause();
    else controls.current?.play();
  }, [paused, instant, value]);

  return <span>{format(instant ? value : counted)}</span>;
}
