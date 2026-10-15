"use client";

import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { Suspense, useState } from "react";
import type { GraphicsLevel } from "@/lib/client/graphics";
import type { StoryData } from "@/story/types";
import CityWorld from "./city/CityWorld";
import styles from "./World.module.css";

/**
 * Full is the whole look. Simple draws the same scene far more cheaply (ADR 0068): resolution
 * capped at 1x, no bloom or edge smoothing, and fewer street props.
 */
export default function WorldCanvas({
  slide,
  story,
  level = "full",
}: {
  slide: number;
  story: StoryData;
  level?: GraphicsLevel;
}) {
  const simple = level === "simple";
  const [ready, setReady] = useState(false);
  const [coarse] = useState(
    () =>
      typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches === true,
  );
  return (
    <Canvas
      className={styles.canvas}
      data-ready={ready}
      // Shadows only so the death-map spotlight can carry its picture (nothing casts one).
      shadows
      // Sharp on desktop; phones (coarse pointers) cap at 1.5x; Simple stays at 1x.
      dpr={simple ? 1 : [1, coarse ? 1.5 : 2]}
      gl={{ antialias: false, powerPreference: "high-performance" }}
      camera={{ fov: 50, near: 0.3, far: 1000 }}
      onCreated={() => requestAnimationFrame(() => setReady(true))}
    >
      <Suspense fallback={null}>
        <CityWorld slide={slide} story={story} simple={simple} />
        {/* Edge smoothing happens here: the canvas own antialias is off because effects bypass it. */}
        {!simple && (
          <EffectComposer multisampling={coarse ? 0 : 4}>
            <Bloom intensity={0.9} luminanceThreshold={0.62} mipmapBlur />
            <Vignette darkness={0.55} offset={0.3} />
          </EffectComposer>
        )}
      </Suspense>
    </Canvas>
  );
}
