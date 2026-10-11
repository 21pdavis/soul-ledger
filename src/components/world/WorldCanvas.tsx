"use client";

import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { Suspense, useState } from "react";
import type { StoryData } from "@/story/types";
import CityWorld from "./city/CityWorld";
import styles from "./World.module.css";

export default function WorldCanvas({ slide, story }: { slide: number; story: StoryData }) {
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
      // Sharp on desktop; phones (coarse pointers) cap at 1.5x until the graphics levels arrive.
      dpr={[1, coarse ? 1.5 : 2]}
      gl={{ antialias: false, powerPreference: "high-performance" }}
      camera={{ fov: 50, near: 0.3, far: 1000 }}
      onCreated={() => requestAnimationFrame(() => setReady(true))}
    >
      <Suspense fallback={null}>
        <CityWorld slide={slide} story={story} />
        {/* Edge smoothing happens here: the canvas own antialias is off because effects bypass it. */}
        <EffectComposer multisampling={coarse ? 0 : 4}>
          <Bloom intensity={0.9} luminanceThreshold={0.62} mipmapBlur />
          <Vignette darkness={0.55} offset={0.3} />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
}
