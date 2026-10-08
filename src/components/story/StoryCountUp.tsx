"use client";

import { animate, type AnimationPlaybackControlsWithThen } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface Props {
  value: number;
  /** How the number reads at each step. Defaults to a whole number with thousands separators. */
  format?: (n: number) => string;
  /** Slide contract flags (slides/contract.ts). */
  reducedMotion: boolean;
  skipAnimation: boolean;
  paused: boolean;
  /** Keep this under ENTRANCE_MS so a tap only ever has to complete a short count. */
  durationMs?: number;
  className?: string;
}

const defaultFormat = (n: number) => Math.round(n).toLocaleString("en-US");

/**
 * A number that counts up from 0 once, on mount (the slide's entrance). Reduced motion and skip
 * show the final value at once; paused holds the count. Always plain DOM text.
 */
export function StoryCountUp({
  value,
  format = defaultFormat,
  reducedMotion,
  skipAnimation,
  paused,
  durationMs = 700,
  className,
}: Props) {
  const instant = reducedMotion || skipAnimation;
  const [shown, setShown] = useState(instant ? value : 0);
  const controls = useRef<AnimationPlaybackControlsWithThen | null>(null);
  // Read inside the effects without making them restart the count.
  const live = useRef({ instant, paused });
  useEffect(() => {
    live.current = { instant, paused };
  });

  // Start the count on mount (or when the value changes).
  useEffect(() => {
    if (live.current.instant) {
      setShown(value);
      return;
    }
    const run = animate(0, value, {
      duration: durationMs / 1000,
      ease: "easeOut",
      onUpdate: setShown,
      onComplete: () => setShown(value),
    });
    controls.current = run;
    if (live.current.paused) run.pause();
    return () => {
      run.stop();
      controls.current = null;
    };
  }, [value, durationMs]);

  // Skip (or reduced motion arriving) finishes the count now.
  useEffect(() => {
    if (!instant) return;
    controls.current?.stop();
    setShown(value);
  }, [instant, value]);

  useEffect(() => {
    const run = controls.current;
    if (!run || instant) return;
    if (paused) run.pause();
    else run.play();
  }, [paused, instant]);

  return <span className={className}>{format(shown)}</span>;
}
