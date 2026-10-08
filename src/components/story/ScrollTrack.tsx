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
  /** The checkpoint a programmatic scroll is heading to, or null when none is in flight. */
  const pending = useRef<number | null>(null);
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
    // We are scrolling to `index` ourselves: until we get there (or the reader takes over), a
    // pause on some checkpoint along the way is not the reader arriving there.
    pending.current = index;
    if (typeof el.scrollTo === "function") {
      el.scrollTo({ top, behavior: smooth && !firstRun ? "smooth" : "auto" });
    } else {
      el.scrollTop = top;
    }
  }, [index, smooth]);

  // The reader taking over (wheel, touch, press, key) ends any jump we were waiting on. Our own
  // key handler dispatches the jump before React re-renders, so it sets a fresh target afterwards.
  const takeOver = () => {
    pending.current = null;
  };
  useEffect(() => {
    window.addEventListener("keydown", takeOver);
    return () => window.removeEventListener("keydown", takeOver);
  }, []);

  // scroll position -> index, once at rest
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const onScroll = () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const el = track.current;
      if (!el) return;
      const arrived = nearest(el);
      if (pending.current !== null) {
        if (arrived !== pending.current) return; // still on the way
        pending.current = null;
      }
      onArriveRef.current(arrived);
    }, SETTLE_MS);
  };

  return (
    <div
      ref={track}
      className={styles.track}
      data-testid="scroll-track"
      onScroll={onScroll}
      onWheel={takeOver}
      onTouchStart={takeOver}
      onPointerDown={takeOver}
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
