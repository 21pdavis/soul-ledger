"use client";

import { Billboard, useTexture } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

/** A camera position and the point it looks at, one per slide. */
export interface Shot {
  pos: [number, number, number];
  look: [number, number, number];
}

/** Deterministic random numbers, so a world looks the same on every load. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const tmpPos = new THREE.Vector3();
const tmpLook = new THREE.Vector3();
const companionTarget = new THREE.Vector3();

/** Eases the camera to the current slide's shot, with a slow idle sway so the world feels alive. */
export function CameraRig({ shots, slide }: { shots: Shot[]; slide: number }) {
  const camera = useThree((s) => s.camera);
  const look = useRef<THREE.Vector3 | null>(null);
  useFrame((state, dt) => {
    const shot = shots[Math.min(slide, shots.length - 1)];
    const t = state.clock.elapsedTime;
    if (!look.current) {
      look.current = new THREE.Vector3(...shot.look);
      camera.position.set(...shot.pos);
    }
    const k = 1 - Math.exp(-Math.min(dt, 0.1) * 1.6);
    tmpPos.set(...shot.pos);
    tmpPos.x += Math.sin(t * 0.21) * 0.35;
    tmpPos.y += Math.sin(t * 0.17) * 0.2;
    camera.position.lerp(tmpPos, k);
    look.current.lerp(tmpLook.set(...shot.look), k);
    camera.lookAt(look.current);
  });
  return null;
}

/** Builds 11 shots walking down -z, with the overrides for slides that frame something special. */
export function walkShots(
  base: (i: number) => Shot,
  overrides: Partial<Record<number, Shot>> = {},
): Shot[] {
  return Array.from({ length: 11 }, (_, i) => overrides[i] ?? base(i));
}

export interface Tower {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  /** Faces the street: +1 for buildings on the left (x < 0), -1 on the right. */
  face: 1 | -1;
}

/** A row of Art Deco towers on each side of a street running along z. */
export function streetTowers(opts: {
  seed: number;
  streetHalfWidth: number;
  zFrom: number;
  zTo: number;
  minH: number;
  maxH: number;
}): Tower[] {
  const r = rng(opts.seed);
  const out: Tower[] = [];
  for (const side of [-1, 1] as const) {
    let z = opts.zFrom;
    while (z > opts.zTo) {
      const d = 6 + r() * 6;
      const w = 6 + r() * 5;
      const h = opts.minH + r() * (opts.maxH - opts.minH);
      out.push({
        x: side * (opts.streetHalfWidth + w / 2),
        z: z - d / 2,
        w,
        d,
        h,
        face: side === -1 ? 1 : -1,
      });
      z -= d + 0.3;
    }
  }
  return out;
}

/**
 * Stepped Art Deco towers: a base, two setbacks and sometimes a spire, all flat-shaded. Windows are
 * one instanced mesh for the whole street.
 */
export function DecoTowers({
  towers,
  color,
  trim,
  windowColor,
  windowChance = 0.35,
  seed = 7,
}: {
  towers: Tower[];
  color: string;
  trim: string;
  windowColor: string;
  windowChance?: number;
  seed?: number;
}) {
  const windows = useMemo(() => {
    const r = rng(seed);
    const list: THREE.Matrix4[] = [];
    const m = new THREE.Matrix4();
    for (const t of towers) {
      const faceX = t.x + (t.face * t.w) / 2 + t.face * 0.02;
      const rows = Math.floor((t.h * 0.62) / 1.6);
      const cols = Math.floor(t.d / 1.4);
      for (let row = 1; row < rows; row++) {
        for (let c = 0; c < cols; c++) {
          if (r() > windowChance) continue;
          m.makeRotationY((Math.PI / 2) * t.face);
          m.setPosition(faceX, row * 1.6, t.z - t.d / 2 + 0.7 + c * 1.4);
          list.push(m.clone());
        }
      }
    }
    return list;
  }, [towers, seed, windowChance]);

  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    windows.forEach((w, i) => mesh.setMatrixAt(i, w));
    mesh.instanceMatrix.needsUpdate = true;
  }, [windows]);

  return (
    <group>
      {towers.map((t, i) => {
        const h1 = t.h * 0.62;
        const h2 = t.h * 0.24;
        const h3 = t.h * 0.14;
        const spire = i % 3 === 0;
        return (
          <group key={i} position={[t.x, 0, t.z]}>
            <mesh position={[0, h1 / 2, 0]}>
              <boxGeometry args={[t.w, h1, t.d]} />
              <meshStandardMaterial color={color} flatShading roughness={0.9} />
            </mesh>
            <mesh position={[0, h1 + 0.15, 0]}>
              <boxGeometry args={[t.w + 0.3, 0.3, t.d + 0.3]} />
              <meshStandardMaterial color={trim} flatShading metalness={0.6} roughness={0.4} />
            </mesh>
            <mesh position={[0, h1 + h2 / 2, 0]}>
              <boxGeometry args={[t.w * 0.72, h2, t.d * 0.72]} />
              <meshStandardMaterial color={color} flatShading roughness={0.9} />
            </mesh>
            <mesh position={[0, h1 + h2 + h3 / 2, 0]}>
              <boxGeometry args={[t.w * 0.44, h3, t.d * 0.44]} />
              <meshStandardMaterial color={color} flatShading roughness={0.9} />
            </mesh>
            {spire && (
              <mesh position={[0, h1 + h2 + h3 + 2, 0]}>
                <coneGeometry args={[t.w * 0.16, 4, 4]} />
                <meshStandardMaterial color={trim} flatShading metalness={0.7} roughness={0.3} />
              </mesh>
            )}
          </group>
        );
      })}
      <instancedMesh ref={ref} args={[undefined, undefined, windows.length]}>
        <planeGeometry args={[0.7, 1]} />
        <meshBasicMaterial color={windowColor} toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

/** Your main hero, as an art card that travels with the camera (ADR 0068: companion). */
export function HeroCompanion({ heroId, glow }: { heroId: number; glow: string }) {
  const texture = useTexture(`/heroes/${heroId}-card.webp`, (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
  });
  const image = texture.image as { width: number; height: number } | undefined;
  const aspect = image ? image.width / image.height : 0.6;
  const group = useRef<THREE.Group>(null);
  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    // Held in front of the camera, beside the story card: to its right on wide screens, low in the
    // corner on a phone. Lagging behind the camera a little makes it feel carried, not glued.
    const cam = state.camera as THREE.PerspectiveCamera;
    const dist = 7;
    const halfH = dist * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    const halfW = halfH * cam.aspect;
    const wide = cam.aspect > 1.2;
    const right = wide ? Math.min(halfW * 0.74, halfW - 1.6) : halfW * 0.45;
    const up = (wide ? -0.15 : -0.55) * halfH + Math.sin(state.clock.elapsedTime * 1.3) * 0.12;
    const target = companionTarget.set(right, up, -dist).applyMatrix4(cam.matrixWorld);
    g.position.lerp(target, 1 - Math.exp(-Math.min(dt, 0.1) * 3));
  });
  const h = 2.4;
  return (
    <group ref={group}>
      <Billboard>
        <mesh position={[0, 0, -0.01]}>
          <planeGeometry args={[h * aspect + 0.12, h + 0.12]} />
          <meshBasicMaterial color={glow} toneMapped={false} />
        </mesh>
        <mesh>
          <planeGeometry args={[h * aspect, h]} />
          <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>
      </Billboard>
    </group>
  );
}

/** A thin lamp post with a glowing head. */
export function Lamp({
  position,
  color,
  light = false,
}: {
  position: [number, number, number];
  color: string;
  light?: boolean;
}) {
  return (
    <group position={position}>
      <mesh position={[0, 2, 0]}>
        <cylinderGeometry args={[0.06, 0.09, 4, 5]} />
        <meshStandardMaterial color="#1b1a1f" flatShading metalness={0.6} />
      </mesh>
      <mesh position={[0, 4.15, 0]}>
        <octahedronGeometry args={[0.22]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      {light && <pointLight position={[0, 4, 0]} color={color} intensity={14} distance={14} />}
    </group>
  );
}
