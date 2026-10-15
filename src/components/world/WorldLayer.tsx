"use client";

import {
  Component,
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { lowerGraphics } from "@/lib/client/fps-monitor";
import { useIsClient } from "@/components/story/useIsClient";
import {
  browserDeviceHint,
  chooseGraphics,
  graphicsLabel,
  loadSavedGraphics,
  nextGraphicsLevel,
  saveGraphics,
  supportsWebGL,
  type GraphicsLevel,
} from "@/lib/client/graphics";
import type { StoryData } from "@/story/types";
import styles from "./World.module.css";

// The 3D code (three.js and the city) loads only when it is needed, after the story starts.
const WorldCanvas = lazy(() => import("./WorldCanvas"));

interface Props {
  story: StoryData;
  /** The story's current slide; the camera follows it. */
  slide: number;
  /** True once the story is up. The 3D never delays the loading screen or the story (ADR 0068). */
  started: boolean;
  /** Overrides for tests; by default they are read from the browser. */
  webgl?: boolean;
  reducedMotion?: boolean;
}

function Still() {
  // eslint-disable-next-line @next/next/no-img-element -- a plain decorative backdrop
  return <img className={styles.still} src="/world/still.webp" alt="" data-testid="world-still" />;
}

/** A small isometric cube: the graphics-level button's icon. */
function GraphicsIcon() {
  return (
    <svg
      className={styles.graphicsIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 2.5 20.5 7.25v9.5L12 21.5 3.5 16.75v-9.5Z" />
      <path d="M3.5 7.25 12 12l8.5-4.75M12 12v9.5" />
    </svg>
  );
}

/**
 * Anything that goes wrong in the 3D (a chunk that fails to load, a lost WebGL context, a scene
 * error) shows the still picture instead. The world is decoration; it must never take the story
 * down with it.
 */
class StillOnError extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <Still /> : this.props.children;
  }
}

/**
 * The world behind the story (ADR 0068, 0069): the low-poly city on Full or Simple, or a still
 * picture of it on Off (and wherever WebGL is missing or the 3D fails). Purely decorative: hidden
 * from assistive technology and never takes the pointer.
 */
export function WorldLayer({ story, slide, started, webgl, reducedMotion }: Props) {
  // The level depends on the browser (WebGL, saved choice), which the server cannot see. Decide
  // it only once the browser has taken over, so server and first browser render match.
  const client = useIsClient();
  const hasWebGL = client && (webgl ?? supportsWebGL());
  const startLevel = useMemo(
    () =>
      !client
        ? null
        : chooseGraphics({
            webgl: hasWebGL,
            reducedMotion: reducedMotion ?? false,
            saved: loadSavedGraphics(),
            hint: browserDeviceHint(),
          }),
    [client, hasWebGL, reducedMotion],
  );
  // The reader's choice from the corner button, applied live without touching the story.
  const [picked, setPicked] = useState<GraphicsLevel | null>(null);
  // Auto-drop (ADR 0068): when the city runs too slowly the level steps down. Never up, and it
  // stops for this visit as soon as the reader picks a level by hand.
  const [dropped, setDropped] = useState<GraphicsLevel | null>(null);
  // A fresh object per drop, so a second drop restarts the timer and is announced again.
  const [note, setNote] = useState<{ level: GraphicsLevel } | null>(null);
  const level = hasWebGL ? (picked ?? dropped ?? startLevel) : startLevel;
  useEffect(() => {
    if (!note) return;
    const id = setTimeout(() => setNote(null), 5000);
    return () => clearTimeout(id);
  }, [note]);
  const onSlow = useCallback(() => {
    if (!level) return;
    const next = lowerGraphics(level);
    if (next === level) return;
    setDropped(next);
    // A drop to Simple is remembered so a weak device starts lower next time. A drop to Off is
    // not: it applies for this visit only, so one stall cannot hide the world for good.
    if (next !== "off") saveGraphics(next);
    setNote({ level: next });
  }, [level]);
  if (!level) return <div className={styles.layer} data-testid="world" aria-hidden="true" />;
  const cycle = () => {
    const next = nextGraphicsLevel(level);
    setPicked(next);
    setNote(null);
    saveGraphics(next);
  };
  return (
    <>
      <div
        className={styles.layer}
        data-testid="world"
        data-level={level}
        data-slide={slide}
        aria-hidden="true"
      >
        {level === "off" ? (
          <Still />
        ) : (
          started && (
            <StillOnError>
              <Suspense fallback={null}>
                <WorldCanvas
                  key={level}
                  slide={slide}
                  story={story}
                  level={level}
                  onSlow={picked === null ? onSlow : undefined}
                />
              </Suspense>
            </StillOnError>
          )
        )}
      </div>
      {hasWebGL &&
        // In the page's bottom-right corner, outside the story area (#79), so it never sits on the
        // story frame. The story area is a size container, which would trap a fixed child.
        createPortal(
          <>
            <div className={styles.graphicsNote} role="status" aria-live="polite">
              {note ? `Graphics lowered to ${graphicsLabel(note.level)} to keep things smooth` : ""}
            </div>
            <button
              type="button"
              className={styles.graphics}
              onClick={cycle}
              aria-label={`Graphics: ${graphicsLabel(level)}. Press to change.`}
              data-testid="graphics-button"
            >
              <GraphicsIcon />
              <span className={styles.graphicsLabel} aria-hidden="true">
                Graphics: {graphicsLabel(level)}
              </span>
            </button>
          </>,
          document.body,
        )}
    </>
  );
}
