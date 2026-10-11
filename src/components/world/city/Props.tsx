"use client";

import { Line, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { DeathBins } from "@/story/death-bins";
import { PALETTE, type Vec3 } from "./layout";
import { MIDBOSS_PARTS, buildMidBossGeometry, frontAt } from "./midboss";
import type { CastMember, Duel } from "./tour";

/** Flat-shaded low-poly material, the look for everything solid (ADR 0025). */
export function Mat({
  color,
  metal = 0,
  rough = 0.9,
}: {
  color: string;
  metal?: number;
  rough?: number;
}) {
  return <meshStandardMaterial color={color} flatShading metalness={metal} roughness={rough} />;
}

/** Light that never flickers: an unlit colour that the bloom picks up. */
export function Glow({ color, opacity = 1 }: { color: string; opacity?: number }) {
  return (
    <meshBasicMaterial
      color={color}
      toneMapped={false}
      transparent={opacity < 1}
      opacity={opacity}
    />
  );
}

/**
 * A flat colour in the shape of a picture's opaque part: the cut-out's outline and back. (A plain
 * alphaMap would read the picture's green channel, not its transparency.)
 */
function silhouetteMaterial(map: THREE.Texture, color: string) {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: { map: { value: map }, color: { value: new THREE.Color(color) } },
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform sampler2D map; uniform vec3 color; varying vec2 vUv;
      void main() { if (texture2D(map, vUv).a < 0.4) discard; gl_FragColor = vec4(color, 1.0); }`,
  });
}

/** A hero as a cut-out standee on an Art Deco plinth. Static: it never turns to follow the camera. */
export function Standee({ member }: { member: CastMember }) {
  const texture = useTexture(`/heroes/${member.heroId}-card.webp`, (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
  });
  const image = texture.image as { width: number; height: number } | undefined;
  const aspect = image ? image.width / image.height : 0.62;
  const s = member.scale ?? 1;
  const h = 2.9 * s;
  const [x, y, z] = member.pos;
  const silhouette = useMemo(() => silhouetteMaterial(texture, "#c9a24b"), [texture]);
  useLayoutEffect(() => () => silhouette.dispose(), [silhouette]);
  return (
    <>
      <group position={member.pos} rotation={[0, member.facing, 0]}>
        {!member.zipline && (
          // A stepped Art Deco plinth with a brass band, like a carnival display stand.
          <>
            <mesh position={[0, 0.12, 0]}>
              <boxGeometry args={[h * aspect * 0.95, 0.24, 0.7 * s]} />
              <Mat color="#2a2428" metal={0.3} />
            </mesh>
            <mesh position={[0, 0.27, 0]}>
              <boxGeometry args={[h * aspect * 0.8, 0.08, 0.6 * s]} />
              <Mat color="#c9a24b" metal={0.7} rough={0.35} />
            </mesh>
          </>
        )}
        {/* The cut-out: the hero's bust (the card art is transparent around them), with a brass
            outline following their silhouette, which also backs the figure when seen from behind. */}
        <mesh position={[0, 0.3 + h / 2, -0.03]} scale={[1.045, 1.03, 1]}>
          <planeGeometry args={[h * aspect, h]} />
          <primitive object={silhouette} attach="material" />
        </mesh>
        <mesh position={[0, 0.3 + h / 2, 0]}>
          <planeGeometry args={[h * aspect, h]} />
          <meshBasicMaterial map={texture} alphaTest={0.4} toneMapped={false} />
        </mesh>
      </group>
      {member.zipline && (
        // Riding the zip line: a glowing hook where the card meets the line, speed streaks behind.
        <group position={[x, y + 0.3 + h, z]} rotation={[0, member.facing, 0]}>
          <mesh position={[0, 0.25, 0]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.3, 0.07, 4, 10]} />
            <Glow color="#cfe6ff" />
          </mesh>
          <mesh position={[0, 0.06, 0]}>
            <boxGeometry args={[0.08, 0.4, 0.08]} />
            <Mat color="#2a2428" />
          </mesh>
          {[0.2, -0.6, -1.4].map((dy, i) => (
            <mesh
              key={dy}
              position={[0, dy - h * 0.25, -0.6 - i * 0.4]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <boxGeometry args={[0.05, 2.4 - i * 0.5, 0.05]} />
              <Glow color="#f4f0e6" opacity={0.45} />
            </mesh>
          ))}
        </group>
      )}
    </>
  );
}

export function RitualRing({ r, color, y = 0.08 }: { r: number; color: string; y?: number }) {
  return (
    <group position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh>
        <ringGeometry args={[r, r + 0.16, 40]} />
        <Glow color={color} />
      </mesh>
      <mesh>
        <ringGeometry args={[r * 0.72, r * 0.72 + 0.1, 6]} />
        <Glow color={color} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 6]}>
        <ringGeometry args={[r * 0.72, r * 0.72 + 0.1, 6]} />
        <Glow color={color} />
      </mesh>
    </group>
  );
}

/** The duel: two heroes facing off, their attacks meeting in a burst between them. */
export function DuelStage({ duel }: { duel: Duel }) {
  const [ax, , az] = duel.a.pos;
  const [bx, , bz] = duel.b.pos;
  const [cx, cy, cz] = duel.clash;
  return (
    <>
      <Standee member={duel.a} />
      <Standee member={duel.b} />
      {/* One side's fire, the other's spirit, meeting in the middle. */}
      <Line points={[[ax, 2, az], duel.clash]} color="#ff8a3d" lineWidth={5} toneMapped={false} />
      <Line points={[[bx, 2, bz], duel.clash]} color="#9ad4ff" lineWidth={5} toneMapped={false} />
      <group position={[cx, cy, cz]}>
        <mesh>
          <icosahedronGeometry args={[0.55]} />
          <Glow color="#fff4d8" />
        </mesh>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <mesh key={i} rotation={[i * 0.9, i * 1.3, i * 0.5]}>
            <boxGeometry args={[0.05, 2.2, 0.05]} />
            <Glow color="#ffd27a" />
          </mesh>
        ))}
        <pointLight color="#ffd8a0" intensity={30} distance={10} />
      </group>
    </>
  );
}

/** A lane trooper: a small soldier in their team colour. */
export function Trooper({ p, rot = 0, color }: { p: Vec3; rot?: number; color: string }) {
  return (
    <group position={p} rotation={[0, rot, 0]}>
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.32, 0.42, 1.4, 6]} />
        <Mat color={color} />
      </mesh>
      <mesh position={[0, 1.65, 0]}>
        <dodecahedronGeometry args={[0.32]} />
        <Mat color="#3a3436" />
      </mesh>
      <mesh position={[0.3, 1, 0.35]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.9, 4]} />
        <Mat color="#2a2428" />
      </mesh>
    </group>
  );
}

/**
 * The precision shot: a squad of enemy troopers down the street and a tracer from your main to
 * the lead trooper's head, which carries a headshot burst.
 */
export function PrecisionShot({ from, target }: { from: Vec3; target: Vec3 }) {
  const [tx, , tz] = target;
  const head: Vec3 = [tx, 1.65, tz];
  return (
    <>
      <Trooper p={target} rot={Math.PI} color={PALETTE.sapphire} />
      <Trooper p={[tx + 1.6, 0, tz + 1.4]} rot={Math.PI} color={PALETTE.sapphire} />
      <Trooper p={[tx - 1.5, 0, tz + 2.2]} rot={Math.PI} color={PALETTE.sapphire} />
      <Line
        points={[[from[0], from[1] + 1.8, from[2]], head]}
        color="#fff0c0"
        lineWidth={2}
        toneMapped={false}
        dashed
        dashSize={0.8}
        gapSize={0.4}
      />
      <group position={head}>
        <mesh>
          <octahedronGeometry args={[0.45]} />
          <Glow color="#ffd24a" />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 4]}>
          <ringGeometry args={[0.7, 0.85, 4]} />
          <meshBasicMaterial color="#ffd24a" toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </>
  );
}

/**
 * The mid boss in its sewer pit under Times Square: a brick chamber with sewage, pipes, and the
 * hunched, sack-bodied ghoul holding up its glowing teal eye. The chamber is closed, so nothing
 * of the city above shows while the camera is inside.
 */
export function SewerPit({ at, beamTo }: { at: Vec3; beamTo: Vec3 }) {
  return (
    <group position={at}>
      {/* The chamber: brick walls, floor and ceiling, seen from inside. */}
      <mesh position={[0, 7.5, 0]}>
        <cylinderGeometry args={[22, 22, 15, 14]} />
        <meshStandardMaterial color="#3a2e2a" flatShading roughness={1} side={THREE.BackSide} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[21.9, 14]} />
        <meshStandardMaterial color="#1e2a24" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[13, 21.9, 14]} />
        <Mat color="#4a3c34" />
      </mesh>
      {/* Pipes along the walls and an arched tunnel mouth. */}
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2 + 0.4;
        return (
          <mesh
            key={i}
            position={[Math.sin(a) * 21, 6 + (i % 2) * 3, Math.cos(a) * 21]}
            rotation={[0, a, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.5, 0.5, 9, 6]} />
            <Mat color="#4a5048" metal={0.5} />
          </mesh>
        );
      })}
      <mesh position={[0, 4, -21.5]}>
        <torusGeometry args={[3.2, 0.6, 4, 10, Math.PI]} />
        <Mat color="#5a4a40" />
      </mesh>
      {/* The Rejuvenator sign over the way in. */}
      <mesh position={[0, 9, -21.2]}>
        <octahedronGeometry args={[0.8]} />
        <Glow color="#ffd24a" />
      </mesh>
      <MidBoss beamTo={beamTo} />
      <pointLight position={[4, 10, 8]} color="#9ab0a0" intensity={90} distance={34} />
      <pointLight position={[6, 4, 6]} color="#c46aff" intensity={50} distance={20} />
      <hemisphereLight args={["#3a4a44", "#1a1414", 0.6]} />
    </group>
  );
}

/**
 * The mid boss: one sculpted body (see midboss.ts) with smooth shading and painted colour, plus
 * the glass dome and purple eye, teeth and claws. It fires its purple beam at your main.
 * `beamTo` is in the pit's frame.
 */
function MidBoss({ beamTo }: { beamTo: Vec3 }) {
  const geometry = useMemo(() => buildMidBossGeometry(), []);
  useLayoutEffect(() => () => geometry.dispose(), [geometry]);
  const { dome, eye, teeth, hands } = MIDBOSS_PARTS;
  // Seat each tooth just inside the groove's edge, wherever the sculpt put the surface.
  const toothZ = useMemo(() => teeth.map((y) => frontAt(y, 0.3) - 0.05), [teeth]);
  const origin: Vec3 = [-1, 0, -1];
  // Turned to face the camera's corner of the pit; the beam target is taken into the turned frame.
  const turn = Math.PI / 4;
  const dx = beamTo[0] - origin[0];
  const dz = beamTo[2] - origin[2];
  const target: Vec3 = [
    dx * Math.cos(turn) - dz * Math.sin(turn),
    beamTo[1],
    dx * Math.sin(turn) + dz * Math.cos(turn),
  ];
  const pupil: Vec3 = [eye.at[0], eye.at[1], eye.at[2] + eye.r * 0.82];
  return (
    <group position={origin} rotation={[0, turn, 0]}>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          vertexColors
          roughness={0.75}
          metalness={0.05}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={eye.at}>
        <sphereGeometry args={[eye.r, 16, 12]} />
        <Glow color="#c46aff" />
      </mesh>
      <mesh position={pupil}>
        <sphereGeometry args={[eye.r * 0.38, 12, 8]} />
        <Glow color="#ffd8ff" />
      </mesh>
      <mesh position={dome.at}>
        <sphereGeometry args={[dome.r, 24, 16]} />
        <meshStandardMaterial
          color="#c8dcff"
          transparent
          opacity={0.25}
          roughness={0.05}
          metalness={0.3}
          depthWrite={false}
        />
      </mesh>
      {[-1, 1].map((sd) =>
        teeth.map((y, ti) => (
          <mesh
            key={`${sd}${y}`}
            position={[sd * 0.3, y, toothZ[ti]]}
            rotation={[0, 0, (sd * Math.PI) / 2]}
          >
            <coneGeometry args={[0.08, 0.3, 4]} />
            <meshStandardMaterial color="#e8e0c8" />
          </mesh>
        )),
      )}
      {hands.map((h, i) =>
        [-0.18, 0, 0.18].map((c) => (
          <mesh
            key={`${i}${c}`}
            position={[h[0] + c, h[1] - 0.45, h[2] + 0.15]}
            rotation={[0.35, 0, c * 2.2]}
          >
            <coneGeometry args={[0.07, 0.75, 5]} />
            <meshStandardMaterial color="#c8d050" />
          </mesh>
        )),
      )}
      {/* Its beam, locked on your main. */}
      <Line points={[pupil, target]} color="#c46aff" lineWidth={7} toneMapped={false} />
      <Line points={[pupil, target]} color="#ffe8ff" lineWidth={2} toneMapped={false} />
      <pointLight
        position={[eye.at[0], eye.at[1], eye.at[2] + 2.5]}
        color="#c46aff"
        intensity={110}
        distance={26}
      />
    </group>
  );
}

/** A 1920s car: a yellow cab or a dark sedan, parked along the kerb. */
export function Car({ p, rot = 0, color = "#e8b23a" }: { p: Vec3; rot?: number; color?: string }) {
  return (
    <group position={p} rotation={[0, rot, 0]}>
      <mesh position={[0, 0.65, 0]}>
        <boxGeometry args={[1.7, 0.7, 4]} />
        <Mat color={color} metal={0.3} rough={0.5} />
      </mesh>
      <mesh position={[0, 1.3, -0.2]}>
        <boxGeometry args={[1.5, 0.65, 2]} />
        <Mat color={color} metal={0.3} rough={0.5} />
      </mesh>
      {[-1.3, 1.3].map((z) =>
        [-0.85, 0.85].map((x) => (
          <mesh key={`${x}${z}`} position={[x, 0.35, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.35, 0.35, 0.25, 8]} />
            <Mat color="#1a1818" />
          </mesh>
        )),
      )}
      <mesh position={[0, 0.7, 2.01]}>
        <boxGeometry args={[1.2, 0.18, 0.02]} />
        <Glow color="#fff4d8" />
      </mesh>
    </group>
  );
}

/** A flatbed delivery truck, as on Broadway and at the docks. */
export function Truck({
  p,
  rot = 0,
  color = "#4a4a50",
}: {
  p: Vec3;
  rot?: number;
  color?: string;
}) {
  return (
    <group position={p} rotation={[0, rot, 0]}>
      <mesh position={[0, 1.3, 1.9]}>
        <boxGeometry args={[2, 1.8, 2]} />
        <Mat color={color} />
      </mesh>
      <mesh position={[0, 1.6, -1.2]}>
        <boxGeometry args={[2.2, 2.4, 4.4]} />
        <Mat color="#d8d2c6" />
      </mesh>
      {[2, -0.4, -2.4].map((z) =>
        [-1, 1].map((x) => (
          <mesh key={`${x}${z}`} position={[x, 0.45, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.45, 0.45, 0.3, 8]} />
            <Mat color="#1a1818" />
          </mesh>
        )),
      )}
      {[-0.6, 0.6].map((x) => (
        <mesh key={x} position={[x, 1, 2.91]}>
          <circleGeometry args={[0.2, 8]} />
          <Glow color="#fff4d8" />
        </mesh>
      ))}
    </group>
  );
}

/** A canvas heat map of the death bins, hottest cell ringed, laid out like the game map. */
function heatTexture(bins: DeathBins) {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const g = canvas.getContext("2d")!;
  g.fillStyle = "#000";
  g.fillRect(0, 0, size, size);
  const max = Math.max(1, ...bins.counts);
  const cw = size / bins.cols;
  const ch = size / bins.rows;
  g.globalCompositeOperation = "lighter";
  let hot = { i: -1, n: 0 };
  bins.counts.forEach((n, i) => {
    if (!n) return;
    if (n > hot.n) hot = { i, n };
    const col = i % bins.cols;
    const row = Math.floor(i / bins.cols);
    // Row 0 holds the lowest game y; the canvas puts it at the bottom (the texture is flipped).
    const x = (col + 0.5) * cw;
    const y = size - (row + 0.5) * ch;
    const r = cw * 1.6;
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    const a = 0.25 + 0.75 * (n / max);
    grad.addColorStop(0, `rgba(255,90,50,${a})`);
    grad.addColorStop(1, "rgba(255,40,20,0)");
    g.fillStyle = grad;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  });
  if (hot.i >= 0) {
    const x = ((hot.i % bins.cols) + 0.5) * cw;
    const y = size - (Math.floor(hot.i / bins.cols) + 0.5) * ch;
    g.globalCompositeOperation = "source-over";
    g.strokeStyle = "#ffe8b0";
    g.lineWidth = 6;
    g.beginPath();
    g.arc(x, y, cw * 1.4, 0, Math.PI * 2);
    g.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * The death map, shone down onto the city by a spotlight straight overhead with the heat map as
 * its gobo, so it lands on rooftops and streets alike. Lit only on the roast slide.
 */
export function DeathProjector({ bins, on }: { bins: DeathBins; on: boolean }) {
  const texture = useMemo(() => heatTexture(bins), [bins]);
  useLayoutEffect(() => () => texture.dispose(), [texture]);
  const light = useRef<THREE.SpotLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  const height = 320;
  // The texture square spans the death grid (±bound game units) at street level.
  const half = bins.bound / 100;
  const angle = Math.atan(half / height);
  useLayoutEffect(() => {
    const l = light.current;
    if (!l) return;
    l.target = target;
    // Looking straight down, the shadow camera needs an up vector: game north (-z) is up.
    l.shadow.camera.up.set(0, 0, -1);
  }, [target]);
  useFrame((_, delta) => {
    const l = light.current;
    if (!l) return;
    const want = on ? 22 : 0;
    l.intensity += (want - l.intensity) * Math.min(1, Math.min(delta, 0.1) * 2.5);
  });
  return (
    <>
      <primitive object={target} position={[0, 0, 0]} />
      <spotLight
        ref={light}
        position={[0, height, 0]}
        angle={angle}
        penumbra={0}
        decay={0}
        intensity={0}
        map={texture}
        castShadow
        shadow-mapSize={[256, 256]}
      />
    </>
  );
}
