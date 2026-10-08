"use client";

import { useAnimate, type AnimationPlaybackControls } from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";

interface Props {
  /** Position in the reveal order. Four steps fit inside ENTRANCE_MS (800ms). */
  index?: number;
  skipAnimation: boolean;
  reducedMotion: boolean;
  paused: boolean;
  className?: string;
  children: ReactNode;
}

const STEP_S = 0.1;
const FADE_S = 0.35;

/**
 * A one-shot fade-and-lift for slides 8 to 10. The text is in the DOM from the first render; only
 * its opacity changes. Skip or reduced motion shows it at once, and pressing and holding pauses it.
 */
export function StaggerIn({
  index = 0,
  skipAnimation,
  reducedMotion,
  paused,
  className,
  children,
}: Props) {
  const instant = reducedMotion || skipAnimation;
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const controls = useRef<AnimationPlaybackControls | null>(null);

  useEffect(() => {
    const el = scope.current;
    if (!el) return;
    // Instant: land on the final state in zero time (also finishes an entrance cut short by a skip).
    const c = instant
      ? animate(el, { opacity: 1, y: 0 }, { duration: 0 })
      : animate(
          el,
          { opacity: [0, 1], y: [10, 0] },
          { duration: FADE_S, delay: Math.min(index, 4) * STEP_S, ease: "easeOut" },
        );
    controls.current = c;
    return () => {
      c.stop();
      controls.current = null;
    };
  }, [instant, index, animate, scope]);

  useEffect(() => {
    if (paused) controls.current?.pause();
    else controls.current?.play();
  }, [paused, instant]);

  return (
    <div ref={scope} className={className} style={{ opacity: instant ? 1 : 0 }}>
      {children}
    </div>
  );
}
