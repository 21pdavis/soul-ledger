"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { HeroModel } from "./city/HeroModel";
import type { PoseName } from "./city/heroes/rig";
import styles from "./WorldPreview.module.css";

const POSES: { pose: PoseName; label: string }[] = [
  { pose: "idle", label: "Idle" },
  { pose: "attack", label: "Attack: Radiant Daggers" },
  { pose: "zipline", label: "Zip line" },
];

/**
 * The model checkpoint (M3 step 2): a hero's sculpted poses side by side on plinths, beside the
 * art card, slowly turning. Drag to orbit, scroll to zoom.
 */
export default function ModelViewer({
  heroId,
  name,
  onClose,
}: {
  heroId: number;
  name: string;
  onClose: () => void;
}) {
  return (
    <div className={styles.viewer} role="dialog" aria-label={`${name} model`}>
      <header>
        <h2>{name}</h2>
        <span>
          Sculpted low poly: idle, attack and zip-line poses. Drag to turn, scroll to zoom.
        </span>
        <button type="button" onClick={onClose} aria-label="Close model viewer">
          ×
        </button>
      </header>
      <div className={styles.viewerBody}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/heroes/${heroId}-card.webp`} alt={`${name} art`} />
        <div className={styles.viewerStage}>
          <Canvas camera={{ position: [0, 1.6, 5.2], fov: 38 }} dpr={[1, 2]}>
            <color attach="background" args={["#1c1820"]} />
            <hemisphereLight args={["#d8d0f0", "#3a3034", 1.6]} />
            <directionalLight position={[3, 5, 4]} intensity={2.2} color="#fff0e0" />
            <directionalLight position={[-4, 3, -3]} intensity={0.9} color="#8aa0ff" />
            <Suspense fallback={null}>
              {POSES.map(({ pose }, i) => (
                <group key={pose} position={[(i - 1) * 1.7, 0, 0]}>
                  <mesh position={[0, -0.04, 0]}>
                    <cylinderGeometry args={[0.5, 0.56, 0.08, 16]} />
                    <meshStandardMaterial color="#2a2428" />
                  </mesh>
                  <HeroModel
                    heroId={heroId}
                    pose={pose}
                    pos={[0, pose === "zipline" ? 0.2 : 0, 0]}
                    facing={0}
                    scale={1}
                  />
                </group>
              ))}
            </Suspense>
            <OrbitControls target={[0, 1, 0]} autoRotate autoRotateSpeed={0.6} enablePan={false} />
          </Canvas>
          <ol className={styles.viewerLabels}>
            {POSES.map((p) => (
              <li key={p.pose}>{p.label}</li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
