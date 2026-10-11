"use client";

import { Sparkles } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { CameraRig, DecoTowers, HeroCompanion, Lamp, rng, streetTowers, walkShots } from "./parts";
import type { WorldProps } from "./types";

const NEON = ["#ff3d7f", "#3de0c8", "#4fb37c", "#ffb347", "#b46cff"];

const SHOTS = walkShots(
  (i) => ({ pos: [i % 2 ? 1.8 : -1.8, 2.6 + (i % 3) * 0.6, 12 - i * 8], look: [0, 3, -6 - i * 8] }),
  {
    // Intro: the street with the Cursed Apple at its end.
    0: { pos: [0, 2.4, 16], look: [0, 12, -60] },
    // Rank: look up at the towers.
    5: { pos: [-2, 1.6, -26], look: [6, 22, -40] },
    // Summary: rise above the street and look down it to the apple.
    10: { pos: [0, 24, 10], look: [0, 8, -70] },
  },
);

/** The Cursed Apple: a neon apple sign floating above the far end of the street. */
function CursedApple() {
  const group = useRef<THREE.Group>(null);
  const shape = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 8; i++) {
      const a = (i / 8) * Math.PI;
      const r = Math.sin(a) * (1 + 0.25 * Math.sin(a * 2)) * 3;
      pts.push(new THREE.Vector2(Math.max(r, 0.01), -Math.cos(a) * 3.2));
    }
    return pts;
  }, []);
  useFrame((state) => {
    if (group.current) group.current.rotation.y = state.clock.elapsedTime * 0.25;
  });
  return (
    <group ref={group} position={[0, 30, -82]}>
      <mesh>
        <latheGeometry args={[shape, 7]} />
        <meshStandardMaterial
          color="#16301f"
          emissive="#4fb37c"
          emissiveIntensity={1.4}
          flatShading
          wireframe={false}
        />
      </mesh>
      <mesh>
        <latheGeometry args={[shape, 7]} />
        <meshBasicMaterial color="#9dffb0" wireframe toneMapped={false} />
      </mesh>
      <mesh position={[0.2, 3.8, 0]} rotation={[0, 0, -0.3]}>
        <cylinderGeometry args={[0.15, 0.2, 1.6, 4]} />
        <meshBasicMaterial color="#9dffb0" toneMapped={false} />
      </mesh>
      <pointLight color="#4fb37c" intensity={400} distance={60} />
    </group>
  );
}

/** Vertical neon signs on the tower faces, flickering now and then. */
function NeonSigns({ seed }: { seed: number }) {
  const signs = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: 18 }, (_, i) => {
      const side = i % 2 ? 1 : -1;
      return {
        pos: [side * 7.8, 3 + r() * 6, 6 - i * 4.6 - r() * 2] as [number, number, number],
        size: [0.25, 1.6 + r() * 2.4, 0.9 + r() * 0.6] as [number, number, number],
        color: NEON[Math.floor(r() * NEON.length)],
        phase: r() * 10,
      };
    });
  }, [seed]);
  const refs = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    refs.current.forEach((m, i) => {
      if (!m) return;
      const p = signs[i].phase;
      const flicker = Math.sin(t * 13 + p) > 0.985 ? 0.25 : 1;
      m.color.set(signs[i].color).multiplyScalar(2.2 * flicker);
    });
  });
  return (
    <group>
      {signs.map((s, i) => (
        <mesh key={i} position={s.pos}>
          <boxGeometry args={s.size} />
          <meshBasicMaterial
            ref={(m) => {
              refs.current[i] = m;
            }}
            color={s.color}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function StreetWorld({ slide, heroId }: WorldProps) {
  const towers = useMemo(
    () => streetTowers({ seed: 3, streetHalfWidth: 8, zFrom: 20, zTo: -90, minH: 14, maxH: 34 }),
    [],
  );
  return (
    <>
      <color attach="background" args={["#0b0812"]} />
      <fog attach="fog" args={["#140d1f", 12, 95]} />
      <hemisphereLight args={["#3a2a5a", "#080608", 0.6]} />
      <directionalLight position={[-20, 40, 10]} intensity={0.4} color="#8c7cff" />

      {/* Wet road and pavements. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -35]}>
        <planeGeometry args={[16, 140]} />
        <meshStandardMaterial color="#0e0c14" metalness={0.85} roughness={0.28} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 7, 0.12, -35]}>
          <boxGeometry args={[2, 0.24, 140]} />
          <meshStandardMaterial color="#1d1922" flatShading />
        </mesh>
      ))}
      {/* Centre-line dashes. */}
      {Array.from({ length: 22 }, (_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 18 - i * 6]}>
          <planeGeometry args={[0.18, 2.4]} />
          <meshBasicMaterial color="#c9a24b" />
        </mesh>
      ))}

      <DecoTowers towers={towers} color="#221b2b" trim="#c9a24b" windowColor="#ffcf7a" />
      <NeonSigns seed={11} />
      {Array.from({ length: 8 }, (_, i) => (
        <Lamp
          key={i}
          position={[i % 2 ? 6.4 : -6.4, 0, 10 - i * 11]}
          color="#ffcf7a"
          light={i < 6}
        />
      ))}
      <CursedApple />

      {/* A distant skyline behind the apple. */}
      {Array.from({ length: 14 }, (_, i) => (
        <mesh key={i} position={[-48 + i * 7.4, 20, -110 - (i % 3) * 6]}>
          <boxGeometry args={[6, 40 + ((i * 37) % 30), 4]} />
          <meshBasicMaterial color="#1a1226" />
        </mesh>
      ))}

      <Sparkles
        count={120}
        scale={[16, 12, 80]}
        position={[0, 6, -30]}
        size={2}
        speed={0.3}
        color="#ffd6f0"
      />
      <HeroCompanion heroId={heroId} glow="#ff3d7f" />
      <CameraRig shots={SHOTS} slide={slide} />
    </>
  );
}
