"use client";

import { Sparkles } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { CameraRig, DecoTowers, HeroCompanion, rng, streetTowers, walkShots } from "./parts";
import type { WorldProps } from "./types";

// The ritual circle sits at the origin; the camera circles it, then backs off toward the Patron.
const SHOTS = walkShots(
  (i) => {
    const a = (i / 10) * Math.PI * 1.6 - 0.8;
    const r = 13 + (i % 3) * 2;
    return { pos: [Math.sin(a) * r, 2.4 + (i % 2) * 1.4, Math.cos(a) * r], look: [0, 2.2, 0] };
  },
  {
    // Rank: look up past the circle at the Patron.
    5: { pos: [0, 1.4, 16], look: [0, 14, -34] },
    // Summary: high above the circle.
    10: { pos: [0, 22, 18], look: [0, 0, -4] },
  },
);

/** A glowing ring on the ground with runes that turn around it. */
function RitualCircle() {
  const runes = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (runes.current) runes.current.rotation.y = state.clock.elapsedTime * 0.15;
  });
  return (
    <group>
      {[4.2, 5.4].map((r) => (
        <mesh key={r} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[r, r + 0.12, 48]} />
          <meshBasicMaterial color="#6dff9a" toneMapped={false} />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, Math.PI / 6]} position={[0, 0.03, 0]}>
        <ringGeometry args={[3.9, 4.1, 6]} />
        <meshBasicMaterial color="#4fb37c" toneMapped={false} />
      </mesh>
      <group ref={runes}>
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return (
            <mesh
              key={i}
              position={[Math.sin(a) * 4.8, 0.04, Math.cos(a) * 4.8]}
              rotation={[-Math.PI / 2, 0, a]}
            >
              <planeGeometry args={[0.18, 0.6]} />
              <meshBasicMaterial color="#9dffb0" toneMapped={false} />
            </mesh>
          );
        })}
      </group>
      <pointLight position={[0, 1.5, 0]} color="#4fb37c" intensity={60} distance={30} />
    </group>
  );
}

/** Green crystals floating around the circle, like the seance candles. */
function Crystals() {
  const items = useMemo(() => {
    const r = rng(5);
    return Array.from({ length: 9 }, (_, i) => {
      const a = (i / 9) * Math.PI * 2;
      return { a, rad: 5 + r() * 1.5, y: 0.8 + r() * 1.6, phase: r() * 6, s: 0.25 + r() * 0.2 };
    });
  }, []);
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    refs.current.forEach((m, i) => {
      if (!m) return;
      const c = items[i];
      m.position.y = c.y + Math.sin(t * 0.9 + c.phase) * 0.25;
      m.rotation.y = t * 0.6 + c.phase;
    });
  });
  return (
    <group>
      {items.map((c, i) => (
        <mesh
          key={i}
          ref={(m) => {
            refs.current[i] = m;
          }}
          position={[Math.sin(c.a) * c.rad, c.y, Math.cos(c.a) * c.rad]}
          scale={[c.s, c.s * 2.4, c.s]}
        >
          <octahedronGeometry args={[1]} />
          <meshBasicMaterial color="#6dff9a" toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

/** Slow sigil rings hanging in the air. */
function Sigils() {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const rings = [
    { pos: [0, 7, 0], r: 3, tilt: 0.3 },
    { pos: [-9, 9, -12], r: 2.2, tilt: -0.6 },
    { pos: [10, 8, -8], r: 1.8, tilt: 0.9 },
  ] as const;
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    refs.current.forEach((m, i) => {
      if (m) m.rotation.z = t * (0.1 + i * 0.07);
    });
  });
  return (
    <group>
      {rings.map((s, i) => (
        <mesh
          key={i}
          ref={(m) => {
            refs.current[i] = m;
          }}
          position={s.pos as unknown as [number, number, number]}
          rotation={[Math.PI / 2 + s.tilt, 0, 0]}
        >
          <torusGeometry args={[s.r, 0.05, 4, 7]} />
          <meshBasicMaterial color="#c9a24b" toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

/** The Patron: a tall antlered silhouette with green eyes, far behind the circle. */
function Patron() {
  return (
    <group position={[0, 0, -38]}>
      <mesh position={[0, 11, 0]}>
        <coneGeometry args={[6, 22, 6]} />
        <meshStandardMaterial color="#0d1411" flatShading />
      </mesh>
      <mesh position={[0, 23, 0]}>
        <dodecahedronGeometry args={[1.8]} />
        <meshStandardMaterial color="#0d1411" flatShading />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 1.2, 24.6, 0]} rotation={[0, 0, -s * 0.5]}>
          <mesh position={[0, 1.6, 0]}>
            <cylinderGeometry args={[0.08, 0.16, 3.4, 4]} />
            <meshStandardMaterial color="#0d1411" flatShading />
          </mesh>
          <mesh position={[s * 0.6, 2.4, 0]} rotation={[0, 0, -s * 0.9]}>
            <cylinderGeometry args={[0.06, 0.1, 1.6, 4]} />
            <meshStandardMaterial color="#0d1411" flatShading />
          </mesh>
        </group>
      ))}
      {[-0.6, 0.6].map((x) => (
        <mesh key={x} position={[x, 23.2, 1.6]}>
          <sphereGeometry args={[0.22, 6, 4]} />
          <meshBasicMaterial color="#9dffb0" toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

export default function FogWorld({ slide, heroId }: WorldProps) {
  const towers = useMemo(
    () => streetTowers({ seed: 9, streetHalfWidth: 14, zFrom: 30, zTo: -60, minH: 16, maxH: 40 }),
    [],
  );
  return (
    <>
      <color attach="background" args={["#08110d"]} />
      <fogExp2 attach="fog" args={["#0c1712", 0.038]} />
      <hemisphereLight args={["#3b5c4a", "#06060a", 0.7]} />
      <directionalLight position={[10, 30, -20]} intensity={0.3} color="#6a4c8c" />

      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[80, 9]} />
        <meshStandardMaterial color="#101814" flatShading roughness={1} />
      </mesh>
      {/* Broken flagstones around the circle. */}
      {Array.from({ length: 30 }, (_, i) => {
        const r = rng(i + 40);
        const a = r() * Math.PI * 2;
        const d = 7 + r() * 9;
        return (
          <mesh
            key={i}
            position={[Math.sin(a) * d, 0.05, Math.cos(a) * d]}
            rotation={[0, r() * 3, 0]}
          >
            <boxGeometry args={[1 + r(), 0.1, 0.8 + r()]} />
            <meshStandardMaterial color="#1c2620" flatShading />
          </mesh>
        );
      })}

      <DecoTowers
        towers={towers}
        color="#141c18"
        trim="#3a4a40"
        windowColor="#2c6b49"
        windowChance={0.08}
      />
      <RitualCircle />
      <Crystals />
      <Sigils />
      <Patron />
      <Sparkles
        count={160}
        scale={[40, 14, 40]}
        position={[0, 5, -4]}
        size={3}
        speed={0.2}
        color="#9dffb0"
      />
      <HeroCompanion heroId={heroId} glow="#4fb37c" />
      <CameraRig shots={SHOTS} slide={slide} />
    </>
  );
}
