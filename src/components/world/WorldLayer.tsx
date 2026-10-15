"use client";

import { Component, Suspense, lazy, useMemo, useState, type ReactNode } from "react";
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
  const level = hasWebGL ? (picked ?? startLevel) : startLevel;
  if (!level) return <div className={styles.layer} data-testid="world" aria-hidden="true" />;
  const cycle = () => {
    const next = nextGraphicsLevel(level);
    setPicked(next);
    saveGraphics(next);
  };
  return (
    <>
      <div className={styles.layer} data-testid="world" data-level={level} aria-hidden="true">
        {level === "off" ? (
          <Still />
        ) : (
          started && (
            <StillOnError>
              <Suspense fallback={null}>
                <WorldCanvas key={level} slide={slide} story={story} level={level} />
              </Suspense>
            </StillOnError>
          )
        )}
      </div>
      {hasWebGL && (
        <button
          type="button"
          className={styles.graphics}
          onClick={cycle}
          aria-label={`Graphics: ${graphicsLabel(level)}. Press to change.`}
          data-testid="graphics-button"
        >
          <span aria-hidden="true">Graphics: {graphicsLabel(level)}</span>
        </button>
      )}
    </>
  );
}
