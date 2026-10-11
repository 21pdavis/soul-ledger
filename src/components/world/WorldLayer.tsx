"use client";

import { Suspense, lazy, useMemo } from "react";
import { chooseGraphics, loadSavedGraphics, supportsWebGL } from "@/lib/client/graphics";
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

/**
 * The world behind the story (ADR 0068, 0069): the low-poly city on Full or Simple, or a still
 * picture of it on Off (and wherever WebGL is missing). Purely decorative: hidden from assistive
 * technology and never takes the pointer.
 */
export function WorldLayer({ story, slide, started, webgl, reducedMotion }: Props) {
  const level = useMemo(
    () =>
      chooseGraphics({
        webgl: webgl ?? supportsWebGL(),
        reducedMotion: reducedMotion ?? false,
        saved: loadSavedGraphics(),
      }),
    [webgl, reducedMotion],
  );
  return (
    <div className={styles.layer} data-testid="world" data-level={level} aria-hidden="true">
      {level === "off" ? (
        // eslint-disable-next-line @next/next/no-img-element -- a plain decorative backdrop
        <img className={styles.still} src="/world/still.webp" alt="" data-testid="world-still" />
      ) : (
        started && (
          <Suspense fallback={null}>
            <WorldCanvas slide={slide} story={story} />
          </Suspense>
        )
      )}
    </div>
  );
}
