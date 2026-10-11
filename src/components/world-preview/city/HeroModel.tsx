"use client";

import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { buildCeleste, celesteParts, type CelesteParts } from "./heroes/celeste";
import type { PoseName } from "./heroes/rig";
import type { V3 } from "./sculpt";

/** Heroes with a sculpted model; everyone else stays an art-card standee (ADR 0068). */
export const MODELLED_HEROES = new Set([81]);

/** Models are sculpted in metres; heroes stand a little taller than life (about 3.8 units) so they read at street level. */
export const HERO_SCALE = 2.3;

const cache = new Map<string, THREE.BufferGeometry>();
let queue: Promise<void> = Promise.resolve();

/**
 * Builds a hero pose's mesh once per page, one pose at a time, each on its own turn of the event
 * loop so the page keeps drawing frames between them. Returns null until it is ready.
 */
function useHeroGeometry(heroId: number, pose: PoseName) {
  const key = `${heroId}:${pose}`;
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(
    () => cache.get(key) ?? null,
  );
  useEffect(() => {
    if (geometry) return;
    let live = true;
    queue = queue.then(
      () =>
        new Promise<void>((done) =>
          setTimeout(() => {
            if (!cache.has(key)) cache.set(key, buildCeleste(pose));
            if (live) setGeometry(cache.get(key)!);
            done();
          }, 30),
        ),
    );
    return () => {
      live = false;
    };
  }, [key, pose, geometry]);
  return geometry;
}

const up = new THREE.Vector3(0, 1, 0);

/** A thin rod from a to b (the baton), or anything stick-like. */
function Rod({ from, to, r, color }: { from: V3; to: V3; r: number; color: string }) {
  const { position, quaternion, length } = useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const dir = b.clone().sub(a);
    return {
      position: a.clone().add(b).multiplyScalar(0.5),
      quaternion: new THREE.Quaternion().setFromUnitVectors(up, dir.clone().normalize()),
      length: dir.length(),
    };
  }, [from, to]);
  return (
    <mesh position={position} quaternion={quaternion}>
      <cylinderGeometry args={[r, r, length, 6]} />
      <meshStandardMaterial color={color} roughness={0.5} metalness={0.4} />
    </mesh>
  );
}

function Glow({ color }: { color: string }) {
  return <meshBasicMaterial color={color} toneMapped={false} />;
}

/** A four-pointed star crystal: her pendant, and (bigger, glowing) her Radiant Daggers. */
function Star({
  at,
  size,
  color,
  dir = [0, 1, 0],
}: {
  at: V3;
  size: number;
  color: string;
  dir?: V3;
}) {
  const q = useMemo(
    () => new THREE.Quaternion().setFromUnitVectors(up, new THREE.Vector3(...dir).normalize()),
    [dir],
  );
  return (
    <group position={at} quaternion={q}>
      <mesh scale={[0.28, 1, 0.12]}>
        <octahedronGeometry args={[size]} />
        <Glow color={color} />
      </mesh>
      <mesh scale={[0.62, 0.28, 0.12]}>
        <octahedronGeometry args={[size]} />
        <Glow color={color} />
      </mesh>
    </group>
  );
}

function Parts({ parts }: { parts: CelesteParts }) {
  const horn = useMemo(() => {
    const a = new THREE.Vector3(...parts.horn.base);
    const b = new THREE.Vector3(...parts.horn.tip);
    const dir = b.clone().sub(a);
    return {
      position: a.clone().add(b).multiplyScalar(0.5),
      quaternion: new THREE.Quaternion().setFromUnitVectors(up, dir.clone().normalize()),
      length: dir.length(),
    };
  }, [parts.horn]);
  const { baton } = parts;
  return (
    <>
      {/* The unicorn horn, glowing pale violet. */}
      <mesh position={horn.position} quaternion={horn.quaternion}>
        <coneGeometry args={[0.022, horn.length, 6]} />
        <Glow color="#f2d4ff" />
      </mesh>
      {parts.eyes.map((e, i) => (
        <group key={i} position={e}>
          <mesh scale={[1.25, 1, 0.5]}>
            <sphereGeometry args={[0.013, 8, 6]} />
            <meshStandardMaterial color="#3a2a6a" />
          </mesh>
          <mesh position={[0.004, 0.004, 0.006]}>
            <sphereGeometry args={[0.004, 6, 4]} />
            <Glow color="#ffffff" />
          </mesh>
        </group>
      ))}
      <mesh position={parts.lips} scale={[1.6, 0.6, 0.6]}>
        <sphereGeometry args={[0.011, 8, 6]} />
        <meshStandardMaterial color="#c4526a" />
      </mesh>
      <Star at={parts.pendant} size={0.045} color="#e8eef8" />
      {/* The twisted baton, its crystal tip glowing blue (bright while she attacks). */}
      <Rod from={baton.from} to={baton.to} r={0.009} color="#3a4a6a" />
      <mesh position={baton.to}>
        <octahedronGeometry args={[baton.bright ? 0.05 : 0.03]} />
        <Glow color="#6ae0ff" />
      </mesh>
      {baton.bright && (
        <pointLight position={baton.to} color="#6ae0ff" intensity={6} distance={3} />
      )}
      {parts.dagger && (
        <>
          <Star at={parts.dagger.at} size={0.2} color="#9ae8ff" dir={parts.dagger.dir} />
          <pointLight position={parts.dagger.at} color="#9ae8ff" intensity={5} distance={3} />
        </>
      )}
    </>
  );
}

/**
 * A sculpted hero in a pose, standing at `pos` (its feet) facing `facing`. Until the mesh is
 * built, `fallback` (the art-card standee) shows instead.
 */
export function HeroModel({
  heroId,
  pose,
  pos,
  facing,
  scale = HERO_SCALE,
  fallback,
}: {
  heroId: number;
  pose: PoseName;
  pos: V3;
  facing: number;
  scale?: number;
  fallback?: React.ReactNode;
}) {
  const geometry = useHeroGeometry(heroId, pose);
  const parts = useMemo(() => celesteParts(pose), [pose]);
  if (!geometry) return <>{fallback}</>;
  return (
    <group position={pos} rotation={[0, facing, 0]} scale={scale}>
      <mesh geometry={geometry}>
        <meshStandardMaterial vertexColors roughness={0.7} metalness={0.02} />
      </mesh>
      <Parts parts={parts} />
    </group>
  );
}

/** Where a zip-line pose's gripping hand is, so the caller can hang the model from a line. */
export function gripHeight(pose: PoseName, scale = HERO_SCALE) {
  const g = celesteParts(pose).grip;
  return g ? g[1] * scale : 0;
}
