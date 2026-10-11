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

/** Orientation and length of a segment, for placing cones and rods along it. */
function segment(from: V3, to: V3) {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const dir = b.clone().sub(a);
  return {
    position: a.clone().add(b).multiplyScalar(0.5),
    quaternion: new THREE.Quaternion().setFromUnitVectors(up, dir.clone().normalize()),
    length: dir.length(),
  };
}

/** The unicorn horn: a long pale cone with a spiral ridge winding up it, glowing faintly. */
function Horn({ base, tip }: { base: V3; tip: V3 }) {
  const seg = useMemo(() => segment(base, tip), [base, tip]);
  const spiral = useMemo(() => {
    const turns = 6;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 120; i++) {
      const t = i / 120;
      const r = 0.026 * (1 - t) + 0.002;
      const a = t * turns * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * r, (t - 0.5) * seg.length, Math.sin(a) * r));
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, 0.0045, 4);
  }, [seg.length]);
  return (
    <group position={seg.position} quaternion={seg.quaternion}>
      <mesh>
        <coneGeometry args={[0.024, seg.length, 8]} />
        <meshStandardMaterial
          color="#ead8ff"
          emissive="#c8a0ff"
          emissiveIntensity={0.18}
          roughness={0.4}
        />
      </mesh>
      <mesh geometry={spiral}>
        <meshStandardMaterial color="#f8eeff" emissive="#e0c0ff" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

/** Her visible eye: white, a violet iris with a highlight, a dark lash line, a thin brow. */
function Eye({ at, brow }: { at: V3; brow: V3 }) {
  return (
    <>
      <group position={at}>
        <mesh scale={[1.5, 1, 0.45]}>
          <sphereGeometry args={[0.011, 10, 8]} />
          <meshStandardMaterial color="#f4f0f4" roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.001, 0.004]} scale={[1, 1, 0.4]}>
          <sphereGeometry args={[0.0075, 10, 8]} />
          <meshStandardMaterial color="#7a5ad0" roughness={0.3} />
        </mesh>
        <mesh position={[0.002, 0.002, 0.0075]}>
          <sphereGeometry args={[0.0022, 6, 4]} />
          <Glow color="#ffffff" />
        </mesh>
        <mesh position={[0, 0.0085, 0.002]} rotation={[0, 0, -0.12]}>
          <boxGeometry args={[0.036, 0.003, 0.006]} />
          <meshStandardMaterial color="#2a1a2a" />
        </mesh>
      </group>
      <mesh position={brow} rotation={[0, 0, -0.2]}>
        <boxGeometry args={[0.03, 0.0035, 0.005]} />
        <meshStandardMaterial color="#5a4ab0" />
      </mesh>
    </>
  );
}

/**
 * Light Eater: the purple cone she breathes through her baton, with sparkles and streaks
 * scattered through it (static, like the rest of the scene).
 */
function LightEater({ from, dir }: { from: V3; dir: V3 }) {
  const length = 1.6;
  const seg = useMemo(() => {
    const d = new THREE.Vector3(...dir).normalize();
    const to: V3 = [from[0] + d.x * length, from[1] + d.y * length, from[2] + d.z * length];
    return segment(from, to);
  }, [from, dir]);
  const sparks = useMemo(() => {
    const out: { p: V3; s: number; streak: boolean }[] = [];
    let seed = 7;
    const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 46; i++) {
      const t = r();
      const spread = 0.04 + t * 0.3;
      const a = r() * Math.PI * 2;
      out.push({
        p: [Math.cos(a) * spread * r(), (t - 0.5) * length, Math.sin(a) * spread * r()],
        s: 0.006 + r() * 0.014,
        streak: r() > 0.7,
      });
    }
    return out;
  }, []);
  return (
    <group position={seg.position} quaternion={seg.quaternion}>
      {/* The cone opens away from the baton (cones point +y, so flip it). */}
      <mesh rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.32, length, 20, 1, true]} />
        <meshBasicMaterial
          color="#b46aff"
          transparent
          opacity={0.1}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
      {sparks.map((k, i) =>
        k.streak ? (
          <mesh key={i} position={k.p}>
            <boxGeometry args={[0.006, k.s * 9, 0.006]} />
            <Glow color="#f0e0ff" />
          </mesh>
        ) : (
          <mesh key={i} position={k.p} rotation={[i, i * 2, 0]}>
            <octahedronGeometry args={[k.s]} />
            <Glow color={i % 3 ? "#d8a8ff" : "#ffffff"} />
          </mesh>
        ),
      )}
      <pointLight position={[0, -length * 0.3, 0]} color="#b46aff" intensity={14} distance={5} />
    </group>
  );
}

function Parts({ parts }: { parts: CelesteParts }) {
  const { baton } = parts;
  return (
    <>
      <Horn base={parts.horn.base} tip={parts.horn.tip} />
      <Eye at={parts.eye.at} brow={parts.eye.brow} />
      <mesh position={parts.lips} scale={[1.7, 0.55, 0.6]}>
        <sphereGeometry args={[0.009, 8, 6]} />
        <meshStandardMaterial color="#c24c66" roughness={0.4} />
      </mesh>
      <Star at={parts.pendant} size={0.035} color="#e8eef8" />
      {/* The twisted baton, its crystal tip glowing blue (bright while she attacks). */}
      <Rod from={baton.from} to={baton.to} r={0.008} color="#3a4a6a" />
      <mesh position={baton.to}>
        <octahedronGeometry args={[baton.bright ? 0.04 : 0.026]} />
        <Glow color="#6ae0ff" />
      </mesh>
      {parts.lightEater && <LightEater from={parts.lightEater.from} dir={parts.lightEater.dir} />}
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
