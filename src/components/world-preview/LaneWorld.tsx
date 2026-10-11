"use client";

import { Line, Sparkles } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { CameraRig, DecoTowers, HeroCompanion, Lamp, streetTowers, walkShots } from "./parts";
import type { WorldProps } from "./types";

const AMBER = "#ff8a3d";
const SAPPHIRE = "#3d8bff";
// Amber base at +z, sapphire base at -z; the troopers meet around z = 0.
const AMBER_Z = 46;
const SAPPHIRE_Z = -46;

const SHOTS = walkShots(
  (i) => ({
    pos: [i % 2 ? 3 : -3, 3 + (i % 3) * 0.8, 40 - i * 7],
    look: [0, 2, 28 - i * 7],
  }),
  {
    // Rank: look up the zip line.
    5: { pos: [-4, 1.4, 8], look: [3, 12, -10] },
    // Summary: a high view down the whole lane.
    10: { pos: [0, 30, 44], look: [0, 0, -14] },
  },
);

/** A Guardian: a stone plinth with a team-coloured figure and a glowing core. */
function Guardian({ z, color, side }: { z: number; color: string; side: 1 | -1 }) {
  return (
    <group position={[side * 4.5, 0, z]}>
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[2.6, 2, 2.6]} />
        <meshStandardMaterial color="#5a4a3e" flatShading />
      </mesh>
      <mesh position={[0, 4, 0]}>
        <cylinderGeometry args={[0.6, 1.1, 4, 6]} />
        <meshStandardMaterial color="#3a3036" flatShading metalness={0.4} />
      </mesh>
      <mesh position={[0, 6.6, 0]}>
        <icosahedronGeometry args={[0.9]} />
        <meshStandardMaterial color="#3a3036" flatShading />
      </mesh>
      <mesh position={[0, 4.6, 0.75]}>
        <octahedronGeometry args={[0.4]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 5, 1.5]} color={color} intensity={20} distance={12} />
    </group>
  );
}

/** Two waves of troopers, one per team, marching to the middle on a loop. */
function Troopers() {
  const count = 8;
  const amber = useRef<THREE.InstancedMesh>(null);
  const sapphire = useRef<THREE.InstancedMesh>(null);
  const m = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const s = useMemo(() => new THREE.Vector3(1, 1, 1), []);
  const p = useMemo(() => new THREE.Vector3(), []);
  const geometry = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.28, 0.4, 1.2, 5);
    g.translate(0, 0.6, 0);
    return g;
  }, []);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const cycle = (t * 0.06) % 1;
    for (const [mesh, from, dir] of [
      [amber.current, AMBER_Z, -1],
      [sapphire.current, SAPPHIRE_Z, 1],
    ] as const) {
      if (!mesh) continue;
      for (let i = 0; i < count; i++) {
        const row = Math.floor(i / 2);
        const x = (i % 2 ? 0.9 : -0.9) + Math.sin(i * 7.1) * 0.2;
        const z = from + dir * (cycle * 44 - row * 1.4);
        const bob = Math.abs(Math.sin(t * 6 + i)) * 0.12;
        q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, dir > 0 ? 0 : Math.PI);
        mesh.setMatrixAt(i, m.compose(p.set(x, bob, z), q, s));
      }
      mesh.instanceMatrix.needsUpdate = true;
    }
  });
  return (
    <>
      <instancedMesh ref={amber} args={[geometry, undefined, count]}>
        <meshStandardMaterial color={AMBER} flatShading />
      </instancedMesh>
      <instancedMesh ref={sapphire} args={[geometry, undefined, count]}>
        <meshStandardMaterial color={SAPPHIRE} flatShading />
      </instancedMesh>
    </>
  );
}

/** A zip line on poles along the lane, with a rider sliding along it. */
function ZipLine({ x }: { x: number }) {
  const zs = [44, 22, 0, -22, -44];
  const height = 10;
  const rider = useRef<THREE.Mesh>(null);
  const points = zs.map((z, i) => [x, height - (i % 2) * 0.8, z] as [number, number, number]);
  useFrame((state) => {
    if (!rider.current) return;
    const u = (state.clock.elapsedTime * 0.08) % 1;
    const z = 44 - u * 88;
    rider.current.position.set(x, height - 0.6, z);
  });
  return (
    <group>
      {zs.map((z) => (
        <mesh key={z} position={[x, height / 2, z]}>
          <cylinderGeometry args={[0.12, 0.16, height, 5]} />
          <meshStandardMaterial color="#2a2226" flatShading metalness={0.5} />
        </mesh>
      ))}
      <Line points={points} color="#ffd27a" lineWidth={2} />
      <mesh ref={rider}>
        <octahedronGeometry args={[0.35]} />
        <meshBasicMaterial color="#ffd27a" toneMapped={false} />
      </mesh>
    </group>
  );
}

export default function LaneWorld({ slide, heroId }: WorldProps) {
  const towers = useMemo(
    () => streetTowers({ seed: 21, streetHalfWidth: 9, zFrom: 60, zTo: -60, minH: 10, maxH: 26 }),
    [],
  );
  return (
    <>
      <color attach="background" args={["#e3925c"]} />
      <fog attach="fog" args={["#d98a5a", 20, 110]} />
      <hemisphereLight args={["#ffcf9a", "#3a2420", 0.9]} />
      <directionalLight position={[-30, 18, 20]} intensity={1.6} color="#ffb26b" />

      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[18, 140]} />
        <meshStandardMaterial color="#8a7058" flatShading roughness={1} />
      </mesh>
      {/* Paving slabs down the middle. */}
      {Array.from({ length: 30 }, (_, i) => (
        <mesh key={i} position={[(i % 3) - 1, 0.04, 50 - i * 3.4]}>
          <boxGeometry args={[2.4, 0.08, 2.6]} />
          <meshStandardMaterial color={i % 2 ? "#b39a7c" : "#a48b6e"} flatShading />
        </mesh>
      ))}
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[sd * 8, 0.15, 0]}>
          <boxGeometry args={[2, 0.3, 140]} />
          <meshStandardMaterial color="#6e5846" flatShading />
        </mesh>
      ))}

      <DecoTowers
        towers={towers}
        color="#a0644a"
        trim="#e0c08a"
        windowColor="#fff0c2"
        windowChance={0.18}
      />

      {/* Team bases: glowing gates at each end. */}
      {(
        [
          [AMBER_Z + 6, AMBER],
          [SAPPHIRE_Z - 6, SAPPHIRE],
        ] as const
      ).map(([z, c]) => (
        <group key={z} position={[0, 0, z]}>
          <mesh position={[0, 6, 0]}>
            <torusGeometry args={[6, 0.5, 4, 8, Math.PI]} />
            <meshStandardMaterial color="#3a3036" flatShading />
          </mesh>
          <mesh position={[0, 3, 0]}>
            <planeGeometry args={[10, 6]} />
            <meshBasicMaterial
              color={c}
              toneMapped={false}
              transparent
              opacity={0.55}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      ))}
      <Guardian z={24} color={AMBER} side={-1} />
      <Guardian z={-24} color={SAPPHIRE} side={1} />
      <Troopers />
      <ZipLine x={6.2} />
      {Array.from({ length: 6 }, (_, i) => (
        <Lamp key={i} position={[i % 2 ? -6.8 : 6.8, 0, 40 - i * 16]} color="#ffe2a8" />
      ))}
      <Sparkles
        count={70}
        scale={[14, 6, 60]}
        position={[0, 2, 0]}
        size={4}
        speed={0.4}
        color="#7fe8ff"
      />
      <HeroCompanion heroId={heroId} glow={AMBER} />
      <CameraRig shots={SHOTS} slide={slide} />
    </>
  );
}
