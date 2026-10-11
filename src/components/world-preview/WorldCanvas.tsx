"use client";

import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { Suspense, useState } from "react";
import type { StoryData } from "@/story/types";
import CityWorld from "./city/CityWorld";
import styles from "./WorldPreview.module.css";

export default function WorldCanvas({ slide, story }: { slide: number; story: StoryData }) {
  const [ready, setReady] = useState(false);
  return (
    <Canvas
      className={styles.canvas}
      data-ready={ready}
      // Shadows only so the death-map spotlight can carry its picture (nothing casts one).
      shadows
      dpr={[1, 1.5]}
      gl={{ antialias: false, powerPreference: "high-performance" }}
      camera={{ fov: 50, near: 0.3, far: 1000 }}
      onCreated={() => requestAnimationFrame(() => setReady(true))}
    >
      <Suspense fallback={null}>
        <CityWorld slide={slide} story={story} />
        <EffectComposer>
          <Bloom intensity={0.9} luminanceThreshold={0.62} mipmapBlur />
          <Vignette darkness={0.55} offset={0.3} />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
}
