"use client";

import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
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
  STOPS,
  buildCity,
  buildOuterRing,
  rng,
  stopPoint,
  type Building,
} from "./layout";
import {
  Car,
  DeathProjector,
  DuelStage,
  Glow,
  PrecisionShot,
  SewerPit,
  Standee,
  Truck,
} from "./Props";
import { TourRig } from "./TourRig";
import { planTour, routeConnectors } from "./tour";

/** A dusk sky: dark blue-grey overhead, mauve, then a warm band at the horizon. */
function Sky() {
  const dome = useRef<THREE.Mesh>(null);
  useFrame(({ camera }) => {
    dome.current?.position.copy(camera.position);
  });
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        depthTest: false,
        fog: false,
        uniforms: {
          top: { value: new THREE.Color(PALETTE.skyTop) },
          mid: { value: new THREE.Color(PALETTE.skyMid) },
          horizon: { value: new THREE.Color(PALETTE.horizon) },
          below: { value: new THREE.Color(PALETTE.fog) },
        },
        vertexShader: `varying vec3 vDir; void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 horizon; uniform vec3 below; varying vec3 vDir;
          void main() {
            float h = clamp(vDir.y, -1.0, 1.0);
            vec3 c = mix(below, horizon, smoothstep(-0.06, 0.02, h));
            c = mix(c, mid, smoothstep(0.02, 0.2, h));
            c = mix(c, top, smoothstep(0.2, 0.7, h));
            gl_FragColor = vec4(c, 1.0);
          }`,
      }),
    [],
  );
  return (
    // Centred on the camera and drawn first with no depth test, so it is always behind everything
    // and never cuts off the ground at its rim.
    <mesh ref={dome} material={material} renderOrder={-1} frustumCulled={false}>
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

const STOP_POINTS = STOPS.map((s) => stopPoint(s.id).p);
/** True near a lane stop, where street furniture would block the slide's shot. */
const nearStop = (p: THREE.Vector3, r = 10) =>
  STOP_POINTS.some((q) => (q.x - p.x) ** 2 + (q.z - p.z) ** 2 < r * r);

const NEON = ["#ff3d7f", "#3de0c8", "#ffb347", "#f4f0e6", "#5ab4ff", "#ff5a3a"];

/**
 * Each lane: road and pavements, the glowing zip line in the lane colour (in game it hangs in
 * the air, no poles), lamps, and the street dressing that tells the lanes apart: Broadway's
 * vertical neon signs and cabs, Greenwich's trees, York's crates and trucks. Nothing sits close to
 * a stop.
 */
function Lanes() {
  const lanes = useMemo(() => {
    const r = rng(17);
    return LANES.map((l) => {
      const len = l.curve.getLength();
      const zip = l.curve
        .getSpacedPoints(120)
        .map((p) => [p.x, 10.5, p.z] as [number, number, number]);
      const lamps: THREE.Vector3[] = [];
      const signs: { p: THREE.Vector3; rot: number; h: number; color: string }[] = [];
      const trees: THREE.Vector3[] = [];
      const crates: THREE.Vector3[] = [];
      const cars: { p: THREE.Vector3; rot: number; kind: "cab" | "sedan" | "truck" }[] = [];
      for (let s = 6; s < len - 6; s += 5.5) {
        const u = s / len;
        const p = l.curve.getPointAt(u);
        const t = l.curve.getTangentAt(u).setY(0).normalize();
        const n = new THREE.Vector3(-t.z, 0, t.x);
        const rot = Math.atan2(t.x, t.z);
        if (nearStop(p, 11)) continue;
        const side = r() > 0.5 ? 1 : -1;
        const kerb = p.clone().addScaledVector(n, side * (LANE_HALF + 0.8));
        const step = Math.round(s / 5.5);
        if (step % 2 === 0) lamps.push(kerb.clone());
        if (l.id === "blue" && r() > 0.45) {
          signs.push({
            p: p.clone().addScaledVector(n, side * (LANE_HALF + SIDEWALK + 0.2)),
            rot: rot + (side > 0 ? -Math.PI / 2 : Math.PI / 2),
            h: 3 + r() * 4,
            color: NEON[Math.floor(r() * NEON.length)],
          });
        }
        if (l.id === "green" && r() > 0.35) trees.push(kerb.clone().addScaledVector(n, side * 0.6));
        if (l.id === "yellow" && r() > 0.6)
          crates.push(kerb.clone().addScaledVector(n, side * 0.4));
        if (r() > 0.8) {
          const kind =
            l.id === "yellow" ? "truck" : l.id === "blue" ? (r() > 0.5 ? "cab" : "truck") : "sedan";
          cars.push({ p: p.clone().addScaledVector(n, -side * (LANE_HALF - 1.4)), rot, kind });
        }
      }
      return { lane: l, zip, lamps, signs, trees, crates, cars };
    });
  }, []);
  return (
    <>
      {lanes.map(({ lane, zip, lamps, signs, trees, crates, cars }) => (
        <group key={lane.id}>
          <Ribbon
            curve={lane.curve}
            width={(LANE_HALF + SIDEWALK) * 2}
            y={0.02}
            color={PALETTE.sidewalk}
          />
          <Ribbon curve={lane.curve} width={LANE_HALF * 2} y={0.05} color={PALETTE.road} />
          <Line points={zip} color={lane.color} lineWidth={2.5} toneMapped={false} />
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
          {signs.map((s, i) => (
            <group key={i} position={[s.p.x, 4 + s.h / 2, s.p.z]} rotation={[0, s.rot, 0]}>
              <mesh>
                <boxGeometry args={[0.9, s.h, 0.2]} />
                <meshStandardMaterial color="#1e1a20" flatShading />
              </mesh>
              <mesh position={[0, 0, 0.12]}>
                <boxGeometry args={[0.6, s.h - 0.5, 0.05]} />
                <Glow color={s.color} />
              </mesh>
            </group>
          ))}
          {trees.map((p, i) => (
            <group key={i} position={[p.x, 0, p.z]}>
              <mesh position={[0, 1.4, 0]}>
                <cylinderGeometry args={[0.18, 0.28, 2.8, 5]} />
                <meshStandardMaterial color="#3a2c24" flatShading />
              </mesh>
              <mesh position={[0, 3.6, 0]}>
                <icosahedronGeometry args={[1.7]} />
                <meshStandardMaterial color={i % 2 ? "#2c4a30" : "#24402d"} flatShading />
              </mesh>
            </group>
          ))}
          {crates.map((p, i) => (
            <group key={i} position={[p.x, 0, p.z]} rotation={[0, i * 0.7, 0]}>
              <mesh position={[0, 0.5, 0]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#8a6a44" flatShading />
              </mesh>
              <mesh position={[0.9, 0.45, 0.3]}>
                <cylinderGeometry args={[0.4, 0.4, 0.9, 7]} />
                <meshStandardMaterial color="#6a4a32" flatShading />
              </mesh>
            </group>
          ))}
          {cars.map((c, i) =>
            c.kind === "truck" ? (
              <Truck
                key={i}
                p={[c.p.x, 0, c.p.z]}
                rot={c.rot}
                color={i % 2 ? "#4a4a50" : "#5a3a32"}
              />
            ) : (
              <Car
                key={i}
                p={[c.p.x, 0, c.p.z]}
                rot={c.rot}
                color={c.kind === "cab" ? "#e8b23a" : i % 2 ? "#2a3a4a" : "#4a2a2a"}
              />
            ),
          )}
        </group>
      ))}
    </>
  );
}

export default function CityWorld({ slide, story }: { slide: number; story: StoryData }) {
  const tour = useMemo(() => planTour(story), [story]);
  // Keep the camera's hops between lanes clear of buildings.
  const buildings = useMemo(
    () => [
      ...buildCity(
        11,
        routeConnectors().map(([x, z]) => ({ x, z, r: 6 })),
      ),
      ...buildOuterRing(),
    ],
    [],
  );
  return (
    <>
      <Sky />
      <fog attach="fog" args={[PALETTE.fog, 150, 560]} />
      <hemisphereLight args={["#a898b8", "#3a3034", 1.7]} />
      {/* A low, warm sun from the horizon, as in the update's dusk shots. */}
      <directionalLight position={[-120, 50, 80]} intensity={2.4} color="#ffb27a" />
      <directionalLight position={[80, 60, -100]} intensity={0.8} color="#8a9cff" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <circleGeometry args={[MAP_RADIUS + 1400, 64]} />
        <meshStandardMaterial color={PALETTE.ground} roughness={1} />
      </mesh>

      <Buildings buildings={buildings} />
      <Lanes />
      <Landmarks />
      {tour.cast.map((m, i) => (
        <Standee key={i} member={m} />
      ))}
      <DuelStage duel={tour.duel} />
      <PrecisionShot from={tour.shot.from} target={tour.shot.target} />
      <SewerPit at={tour.pit} beamTo={[-0.3, 2.6, 4.5]} />
      <DeathProjector bins={tour.deaths} on={slide === 7} />
      <TourRig shots={tour.shots} slide={slide} />
    </>
  );
}
