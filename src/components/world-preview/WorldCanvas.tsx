"use client";

import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { Suspense, useState } from "react";
import FogWorld from "./FogWorld";
import LaneWorld from "./LaneWorld";
import type { WorldId } from "./moodboards";
import StreetWorld from "./StreetWorld";
import type { WorldProps } from "./types";
import styles from "./WorldPreview.module.css";

const WORLDS: Record<WorldId, (p: WorldProps) => React.ReactNode> = {
  street: StreetWorld,
  fog: FogWorld,
  lane: LaneWorld,
};

const BLOOM: Record<WorldId, number> = { street: 1.1, fog: 0.9, lane: 0.5 };

export default function WorldCanvas({ world, ...props }: WorldProps & { world: WorldId }) {
  const [ready, setReady] = useState(false);
  const World = WORLDS[world];
  return (
    <Canvas
      className={styles.canvas}
      data-ready={ready}
      dpr={[1, 1.5]}
      gl={{ antialias: false, powerPreference: "high-performance" }}
      camera={{ fov: 55, near: 0.1, far: 220 }}
      onCreated={() => requestAnimationFrame(() => setReady(true))}
    >
      <Suspense fallback={null}>
        <World key={world} {...props} />
        <EffectComposer>
          <Bloom intensity={BLOOM[world]} luminanceThreshold={0.6} mipmapBlur />
          <Vignette darkness={0.6} offset={0.3} />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
}
