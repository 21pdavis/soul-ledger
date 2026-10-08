"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { SLIDE_COUNT } from "@/story/copy";
import styles from "./StoryPlayer.module.css";

/** Scrolling counts as finished once no scroll event has arrived for this long. */
const SETTLE_MS = 100;

interface Props {
  /** The slide the player is on. */
  index: number;
  /** Smooth programmatic scrolling; false (reduced motion) jumps instantly. */
  smooth: boolean;
  /** Called with the checkpoint the reader has scrolled to, once the scrolling comes to rest. */
  onArrive: (index: number) => void;
  /** The pinned stage. */
  children: ReactNode;
}

/**
 * The desktop controller (ADR 0050): a scroll track of SLIDE_COUNT viewport-high snap checkpoints
 * with the 9:16 stage pinned (sticky) over it.
 *
 * The two directions never fight: scroll -> index only happens once scrolling is at rest, and
 * index -> scroll only happens when the track is not already on that checkpoint, so an arrival
 * the reader scrolled to produces no further scroll.
 */
export function ScrollTrack({ index, smooth, onArrive, children }: Props) {
  const track = useRef<HTMLDivElement>(null);
  const timer = useRef<number>(0);
  const first = useRef(true);
  const onArriveRef = useRef(onArrive);

  useEffect(() => {
    onArriveRef.current = onArrive;
  });

  const nearest = (el: HTMLElement) =>
    el.clientHeight ? Math.round(el.scrollTop / el.clientHeight) : 0;

  // index -> scroll position
  useEffect(() => {
    const el = track.current;
    const firstRun = first.current;
    first.current = false;
    if (!el || !el.clientHeight || nearest(el) === index) return;
    const top = index * el.clientHeight;
    if (typeof el.scrollTo === "function") {
      el.scrollTo({ top, behavior: smooth && !firstRun ? "smooth" : "auto" });
    } else {
      el.scrollTop = top;
    }
  }, [index, smooth]);

  // scroll position -> index, once at rest
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const onScroll = () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      if (track.current) onArriveRef.current(nearest(track.current));
    }, SETTLE_MS);
  };

  return (
    <div
      ref={track}
      className={styles.track}
      data-testid="scroll-track"
      onScroll={onScroll}
      style={{ "--count": SLIDE_COUNT } as CSSProperties}
    >
      <div className={styles.trackContent}>
        <div className={styles.checkpoints} aria-hidden="true">
          {Array.from({ length: SLIDE_COUNT }, (_, i) => (
            <div
              key={i}
              className={styles.checkpoint}
              data-testid="checkpoint"
              data-checkpoint={i}
            />
          ))}
        </div>
        <div className={styles.pin}>{children}</div>
      </div>
    </div>
  );
}
