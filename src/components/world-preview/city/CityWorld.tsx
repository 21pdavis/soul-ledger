"use client";

import { Line, useTexture } from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { StoryData } from "@/story/types";
import { Landmarks } from "./Landmarks";
import {
  LANES,
  LANE_HALF,
  MAP_RADIUS,
  PALETTE,
  SIDEWALK,
  buildCity,
  buildSkyline,
  rng,
  type Building,
} from "./layout";
import { SwoopRig } from "./SwoopRig";
import { planTour, type CastMember } from "./tour";

/** A dusk sky: dark blue-grey overhead, mauve, then a warm band at the horizon. */
function Sky() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          top: { value: new THREE.Color(PALETTE.skyTop) },
          mid: { value: new THREE.Color(PALETTE.skyMid) },
          horizon: { value: new THREE.Color(PALETTE.horizon) },
        },
        vertexShader: `varying vec3 vDir; void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 horizon; varying vec3 vDir;
          void main() {
            float h = clamp(vDir.y, -0.2, 1.0);
            vec3 c = mix(horizon, mid, smoothstep(-0.02, 0.18, h));
            c = mix(c, top, smoothstep(0.18, 0.7, h));
            gl_FragColor = vec4(c, 1.0);
          }`,
      }),
    [],
  );
  return (
    <mesh material={material}>
      <sphereGeometry args={[480, 24, 12]} />
    </mesh>
  );
}

/** A flat ribbon following a curve, for roads and pavements. */
function Ribbon({
  curve,
  width,
  y,
  color,
}: {
  curve: THREE.Curve<THREE.Vector3>;
  width: number;
  y: number;
  color: string;
}) {
  const geometry = useMemo(() => {
    const pts = curve.getSpacedPoints(160);
    const pos: number[] = [];
    const idx: number[] = [];
    pts.forEach((p, i) => {
      const t = curve
        .getTangentAt(i / (pts.length - 1))
        .setY(0)
        .normalize();
      const n = new THREE.Vector3(-t.z, 0, t.x).multiplyScalar(width / 2);
      pos.push(p.x - n.x, y, p.z - n.z, p.x + n.x, y, p.z + n.z);
      if (i > 0) {
        const a = (i - 1) * 2;
        idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }, [curve, width, y]);
  useLayoutEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color={color} roughness={0.9} side={THREE.DoubleSide} />
    </mesh>
  );
}

/** Fills an instanced mesh from a list of matrices and colours, once. */
function useInstances(
  ref: React.RefObject<THREE.InstancedMesh | null>,
  items: { m: THREE.Matrix4; c?: string }[],
) {
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const color = new THREE.Color();
    items.forEach((it, i) => {
      mesh.setMatrixAt(i, it.m);
      if (it.c) mesh.setColorAt(i, color.set(it.c));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [ref, items]);
}

/** Every generic building as three instanced meshes: bodies, setback crowns and lit windows. */
function Buildings({ buildings }: { buildings: Building[] }) {
  const { bodies, crowns, windows } = useMemo(() => {
    const r = rng(3);
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    const bodies: { m: THREE.Matrix4; c: string }[] = [];
    const crowns: { m: THREE.Matrix4; c: string }[] = [];
    const windows: { m: THREE.Matrix4; c: string }[] = [];
    for (const b of buildings) {
      q.setFromAxisAngle(up, b.rot);
      const body = b.h * 0.78;
      bodies.push({
        m: new THREE.Matrix4().compose(
          new THREE.Vector3(b.x, body / 2, b.z),
          q,
          new THREE.Vector3(b.w, body, b.d),
        ),
        c: b.color,
      });
      const crownH = b.h - body;
      crowns.push({
        m: new THREE.Matrix4().compose(
          new THREE.Vector3(b.x, body + crownH / 2, b.z),
          q,
          new THREE.Vector3(b.w * 0.66, crownH, b.d * 0.66),
        ),
        c: b.color,
      });
      // Lit windows on the lane-facing side (local +z); district blocks get a few on every side.
      const faces = b.facesLane ? [0] : [0, Math.PI / 2, Math.PI, -Math.PI / 2];
      for (const f of faces) {
        const fq = new THREE.Quaternion().setFromAxisAngle(up, b.rot + f);
        const halfDepth = (f === 0 || f === Math.PI ? b.d : b.w) / 2;
        const span = f === 0 || f === Math.PI ? b.w : b.d;
        const cols = Math.max(1, Math.floor(span / 1.5));
        const rows = Math.floor((body - 2) / 2.1);
        const chance = b.facesLane ? 0.3 : 0.1;
        for (let row = 0; row < rows; row++) {
          for (let c = 0; c < cols; c++) {
            if (r() > chance) continue;
            const local = new THREE.Vector3(
              (c - (cols - 1) / 2) * 1.5,
              2.4 + row * 2.1,
              halfDepth + 0.03,
            );
            local.applyQuaternion(fq).add(new THREE.Vector3(b.x, 0, b.z));
            windows.push({
              m: new THREE.Matrix4().compose(local, fq, new THREE.Vector3(1, 1, 1)),
              c: b.windows,
            });
          }
        }
      }
    }
    return { bodies, crowns, windows };
  }, [buildings]);

  const bodyRef = useRef<THREE.InstancedMesh>(null);
  const crownRef = useRef<THREE.InstancedMesh>(null);
  const windowRef = useRef<THREE.InstancedMesh>(null);
  useInstances(bodyRef, bodies);
  useInstances(crownRef, crowns);
  useInstances(windowRef, windows);
  return (
    <>
      <instancedMesh ref={bodyRef} args={[undefined, undefined, bodies.length]}>
        <boxGeometry />
        <meshStandardMaterial flatShading roughness={0.95} />
      </instancedMesh>
      <instancedMesh ref={crownRef} args={[undefined, undefined, crowns.length]}>
        <boxGeometry />
        <meshStandardMaterial flatShading roughness={0.95} />
      </instancedMesh>
      <instancedMesh ref={windowRef} args={[undefined, undefined, windows.length]}>
        <planeGeometry args={[0.8, 1.2]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
    </>
  );
}

function Skyline() {
  const items = useMemo(
    () =>
      buildSkyline().map((s) => ({
        m: new THREE.Matrix4().compose(
          new THREE.Vector3(s.x, s.h / 2 - 2, s.z),
          new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(s.x, s.z)),
          new THREE.Vector3(s.w, s.h, s.w * 0.7),
        ),
        c: s.color,
      })),
    [],
  );
  const ref = useRef<THREE.InstancedMesh>(null);
  useInstances(ref, items);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, items.length]}>
      <boxGeometry />
      <meshStandardMaterial flatShading roughness={1} />
    </instancedMesh>
  );
}

/** Each lane: road, pavements, a glowing zip line on poles in the lane colour, and lamps. */
function Lanes() {
  const lanes = useMemo(
    () =>
      LANES.map((l) => {
        const len = l.curve.getLength();
        const zip = l.curve
          .getSpacedPoints(120)
          .map((p) => [p.x, 9.5, p.z] as [number, number, number]);
        const poles: THREE.Vector3[] = [];
        const lamps: THREE.Vector3[] = [];
        for (let s = 10; s < len - 10; s += 22) {
          poles.push(l.curve.getPointAt(s / len));
        }
        for (let s = 6; s < len - 6; s += 11) {
          const u = s / len;
          const p = l.curve.getPointAt(u);
          const t = l.curve.getTangentAt(u).setY(0).normalize();
          const side = Math.round(s / 11) % 2 ? 1 : -1;
          lamps.push(
            p.add(new THREE.Vector3(-t.z, 0, t.x).multiplyScalar(side * (LANE_HALF + 0.8))),
          );
        }
        return { lane: l, zip, poles, lamps };
      }),
    [],
  );
  return (
    <>
      {lanes.map(({ lane, zip, poles, lamps }) => (
        <group key={lane.id}>
          <Ribbon
            curve={lane.curve}
            width={(LANE_HALF + SIDEWALK) * 2}
            y={0.02}
            color={PALETTE.sidewalk}
          />
          <Ribbon curve={lane.curve} width={LANE_HALF * 2} y={0.05} color={PALETTE.road} />
          <Line points={zip} color={lane.color} lineWidth={2.5} toneMapped={false} />
          {poles.map((p, i) => (
            <mesh key={i} position={[p.x, 4.75, p.z]}>
              <cylinderGeometry args={[0.12, 0.18, 9.5, 5]} />
              <meshStandardMaterial color="#1b1a1f" flatShading metalness={0.5} />
            </mesh>
          ))}
          {lamps.map((p, i) => (
            <group key={i} position={[p.x, 0, p.z]}>
              <mesh position={[0, 1.8, 0]}>
                <cylinderGeometry args={[0.05, 0.08, 3.6, 4]} />
                <meshStandardMaterial color="#1b1a1f" flatShading />
              </mesh>
              <mesh position={[0, 3.75, 0]}>
                <octahedronGeometry args={[0.2]} />
                <meshBasicMaterial color={lane.lamp} toneMapped={false} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
    </>
  );
}

/** A hero standing in the city as an art-card standee on a plinth. Static: it never turns. */
function Standee({ member }: { member: CastMember }) {
  const texture = useTexture(`/heroes/${member.heroId}-card.webp`, (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
  });
  const image = texture.image as { width: number; height: number } | undefined;
  const aspect = image ? image.width / image.height : 0.62;
  const s = member.scale ?? 1;
  const h = 2.9 * s;
  return (
    <group position={member.pos} rotation={[0, member.facing, 0]}>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.9 * s, 1 * s, 0.3, 8]} />
        <meshStandardMaterial color="#2a2428" flatShading metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.31, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.7 * s, 0.85 * s, 16]} />
        <meshBasicMaterial color={PALETTE.occult} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.3 + h / 2, -0.02]}>
        <planeGeometry args={[h * aspect + 0.14, h + 0.14]} />
        <meshBasicMaterial color="#c9a24b" toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.3 + h / 2, 0]}>
        <planeGeometry args={[h * aspect, h]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
    </group>
  );
}

export default function CityWorld({ slide, story }: { slide: number; story: StoryData }) {
  const tour = useMemo(() => planTour(story), [story]);
  // Keep the death spot clear, so the roast slide can see it.
  const buildings = useMemo(
    () =>
      buildCity(11, tour.deathSpot ? [{ x: tour.deathSpot[0], z: tour.deathSpot[1], r: 6 }] : []),
    [tour.deathSpot],
  );
  return (
    <>
      <Sky />
      <fog attach="fog" args={[PALETTE.fog, 70, 330]} />
      <hemisphereLight args={["#a898b8", "#3a3034", 1.7]} />
      {/* A low, warm sun from the horizon, as in the update's dusk shots. */}
      <directionalLight position={[-120, 50, 80]} intensity={2.4} color="#ffb27a" />
      <directionalLight position={[80, 60, -100]} intensity={0.8} color="#8a9cff" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <circleGeometry args={[MAP_RADIUS + 70, 48]} />
        <meshStandardMaterial color={PALETTE.ground} roughness={1} />
      </mesh>

      <Buildings buildings={buildings} />
      <Skyline />
      <Lanes />
      <Landmarks deathSpot={tour.deathSpot} />
      {tour.cast.map((m, i) => (
        <Standee key={i} member={m} />
      ))}
      <SwoopRig shots={tour.shots} slide={slide} />
    </>
  );
}
