"use client";

import { useEffect, useRef, type PointerEvent } from "react";
import styles from "./StoryPlayer.module.css";

/** How long a press must last to count as press-and-hold rather than a tap. */
export const HOLD_MS = 250;
/** A press that travels further than this (px) is a drag, not a tap. */
const TAP_SLOP = 16;

interface Props {
  side: "back" | "next";
  onTap: () => void;
  onHoldChange: (holding: boolean) => void;
}

/**
 * One side of the phone stage. A quick press is a tap; holding longer than HOLD_MS pauses until
 * release (and the release is not a tap). Purely a pointer target: keyboard and screen reader
 * users use the hidden Previous/Next buttons and the key handler instead, so it is aria-hidden.
 */
export function TapZone({ side, onTap, onHoldChange }: Props) {
  const press = useRef<{ x: number; y: number; held: boolean; timer: number } | null>(null);

  const clear = () => {
    if (!press.current) return;
    window.clearTimeout(press.current.timer);
    if (press.current.held) onHoldChange(false);
    press.current = null;
  };
  // If the zone unmounts mid-press (a mode switch), do not leave a timer behind.
  useEffect(
    () => () => {
      if (press.current) window.clearTimeout(press.current.timer);
    },
    [],
  );

  const onPointerDown = (e: PointerEvent) => {
    clear();
    const state = { x: e.clientX, y: e.clientY, held: false, timer: 0 };
    state.timer = window.setTimeout(() => {
      state.held = true;
      onHoldChange(true);
    }, HOLD_MS);
    press.current = state;
  };

  const onPointerUp = (e: PointerEvent) => {
    const p = press.current;
    if (!p) return;
    const wasTap = !p.held && Math.hypot(e.clientX - p.x, e.clientY - p.y) <= TAP_SLOP;
    clear();
    if (wasTap) onTap();
  };

  return (
    <div
      className={styles.zone}
      data-side={side}
      data-testid={`tap-zone-${side === "next" ? "next" : "back"}`}
      aria-hidden="true"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={clear}
      onPointerLeave={clear}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
}
