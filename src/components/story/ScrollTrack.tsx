"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { SLIDE_COUNT } from "@/story/copy";
import styles from "./StoryPlayer.module.css";

/** Scrolling counts as finished once no scroll event has arrived for this long. */
const SETTLE_MS = 100;

/** Keys that scroll the track natively; pressing one means the reader has taken over. */
const SCROLLING_KEYS = new Set([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "PageUp",
  "PageDown",
  "Home",
  "End",
  " ",
]);

interface Props {
  /** The slide the player is on. */
  index: number;
  /** Smooth programmatic scrolling; false (reduced motion) jumps instantly. */
  smooth: boolean;
  /** Called with the checkpoint the reader has scrolled to, once the scrolling comes to rest. */
  onArrive: (index: number) => void;
  /** The card for checkpoint `i`. */
  renderCard: (index: number) => ReactNode;
}

/**
 * The desktop controller (ADR 0050, 0061): a vertical scroll track of SLIDE_COUNT viewport-high
 * snap checkpoints, each holding one slide's card, so the page really moves as the reader scrolls.
 *
 * The two directions never fight: scroll -> index only happens once scrolling is at rest, and
 * index -> scroll only happens when the track is not already on that checkpoint, so an arrival
 * the reader scrolled to produces no further scroll.
 */
export function ScrollTrack({ index, smooth, onArrive, renderCard }: Props) {
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
    if (!el || !el.clientHeight) return;
    const top = index * el.clientHeight;
    // Already resting on it. (Not merely nearest to it: a jump in flight passing this checkpoint
    // would otherwise be left to carry on to its old target.) Snap makes rest positions exact.
    if (Math.abs(el.scrollTop - top) < 1) return;
    // We are scrolling to `index` ourselves: until we get there (or the reader takes over), a
    // pause on some checkpoint along the way is not the reader arriving there.
    pending.current = index;
    if (typeof el.scrollTo === "function") {
      el.scrollTo({ top, behavior: smooth && !firstRun ? "smooth" : "auto" });
    } else {
      el.scrollTop = top;
    }
  }, [index, smooth]);

  // The reader taking over (wheel, touch, press, a scrolling key) ends any jump we were waiting on.
  // Our own key handler dispatches the jump before React re-renders, so it sets a fresh target
  // afterwards. Keys that do not scroll (Tab, Shift) leave a jump in flight alone.
  const takeOver = () => {
    pending.current = null;
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (SCROLLING_KEYS.has(e.key)) pending.current = null;
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // scroll position -> index, once at rest
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const arrive = (definite: boolean) => {
    const el = track.current;
    if (!el) return;
    const arrived = nearest(el);
    if (pending.current !== null && !definite) {
      if (arrived !== pending.current) return; // still on the way
    }
    pending.current = null;
    onArriveRef.current(arrived);
  };
  const onScroll = () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => arrive(false), SETTLE_MS);
  };
  // Where supported, scrollend says scrolling is truly over (it never fires mid-flight), so
  // wherever the track came to rest is the arrival, whatever we were heading for.
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const onEnd = () => {
      window.clearTimeout(timer.current);
      arrive(true);
    };
    el.addEventListener("scrollend", onEnd);
    return () => el.removeEventListener("scrollend", onEnd);
  });

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
        {Array.from({ length: SLIDE_COUNT }, (_, i) => (
          <div key={i} className={styles.checkpoint} data-testid="checkpoint" data-checkpoint={i}>
            {renderCard(i)}
          </div>
        ))}
      </div>
    </div>
  );
}
