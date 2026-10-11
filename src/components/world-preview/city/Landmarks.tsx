"use client";

import type { ReactNode } from "react";
import * as THREE from "three";
import {
  DISTRICTS,
  MID_BOSS,
  PALETTE,
  lanePoint,
  stopPoint,
  type DistrictId,
  type LaneId,
  type StopId,
} from "./layout";

type V3 = [number, number, number];

/** Flat-shaded low-poly material, the look for everything solid (ADR 0025). */
function Mat({ color, metal = 0, rough = 0.9 }: { color: string; metal?: number; rough?: number }) {
  return <meshStandardMaterial color={color} flatShading metalness={metal} roughness={rough} />;
}

/** Light that never flickers: an unlit colour that the bloom picks up. */
function Glow({ color }: { color: string }) {
  return <meshBasicMaterial color={color} toneMapped={false} />;
}

function Box({
  p,
  s,
  color,
  glow,
  rot = 0,
}: {
  p: V3;
  s: V3;
  color: string;
  glow?: boolean;
  rot?: number;
}) {
  return (
    <mesh position={p} rotation={[0, rot, 0]}>
      <boxGeometry args={s} />
      {glow ? <Glow color={color} /> : <Mat color={color} />}
    </mesh>
  );
}

/** A group in a stop's frame: local +z runs north along the lane, the street is |x| < 4.5. */
function AtStop({ id, children }: { id: StopId; children: ReactNode }) {
  const { p, t } = stopPoint(id);
  return (
    <group position={[p.x, 0, p.z]} rotation={[0, Math.atan2(t.x, t.z), 0]}>
      {children}
    </group>
  );
}

function RitualCircle({ r, color = PALETTE.occult }: { r: number; color?: string }) {
  return (
    <group position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh>
        <ringGeometry args={[r, r + 0.18, 40]} />
        <Glow color={color} />
      </mesh>
      <mesh>
        <ringGeometry args={[r * 0.72, r * 0.72 + 0.12, 6]} />
        <Glow color={color} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 6]}>
        <ringGeometry args={[r * 0.72, r * 0.72 + 0.12, 6]} />
        <Glow color={color} />
      </mesh>
    </group>
  );
}

function Crystal({ p, s = 0.35, color = PALETTE.occult }: { p: V3; s?: number; color?: string }) {
  return (
    <mesh position={p} scale={[s, s * 2.6, s]}>
      <octahedronGeometry args={[1]} />
      <Glow color={color} />
    </mesh>
  );
}

/** A stepped Art Deco skyscraper with a lit crown. */
function Tower({
  p,
  w,
  h,
  color,
  crown,
}: {
  p: V3;
  w: number;
  h: number;
  color: string;
  crown: string;
}) {
  const [x, , z] = p;
  return (
    <group position={[x, 0, z]}>
      <Box p={[0, h * 0.3, 0]} s={[w, h * 0.6, w]} color={color} />
      <Box p={[0, h * 0.68, 0]} s={[w * 0.74, h * 0.16, w * 0.74]} color={color} />
      <Box p={[0, h * 0.82, 0]} s={[w * 0.5, h * 0.12, w * 0.5]} color={color} />
      <Box p={[0, h * 0.89, 0]} s={[w * 0.52, 0.5, w * 0.52]} color={crown} glow />
      <mesh position={[0, h * 0.95, 0]}>
        <coneGeometry args={[w * 0.18, h * 0.14, 4]} />
        <Mat color="#8a7a6a" metal={0.6} rough={0.4} />
      </mesh>
    </group>
  );
}

function Tree({ p, s = 1, color = "#2c4a30" }: { p: V3; s?: number; color?: string }) {
  return (
    <group position={p} scale={s}>
      <mesh position={[0, 1.6, 0]}>
        <cylinderGeometry args={[0.25, 0.4, 3.2, 5]} />
        <Mat color="#3a2c24" />
      </mesh>
      <mesh position={[0, 4, 0]}>
        <icosahedronGeometry args={[2.2]} />
        <Mat color={color} />
      </mesh>
    </group>
  );
}

function Uptown() {
  return (
    <AtStop id="uptown">
      <RitualCircle r={3.6} />
      {/* Theatre marquee and a diner sign, steady neon. */}
      <Box p={[-9.5, 6, 0]} s={[6, 12, 9]} color="#3a3842" />
      <Box p={[-6.4, 4.2, 0]} s={[0.6, 1.4, 7]} color={PALETTE.windowWarm} glow />
      <Box p={[-6.6, 7.5, 2.5]} s={[0.3, 4, 1.2]} color="#ff5a7a" glow />
      <Box p={[9.5, 4, -2]} s={[6, 8, 8]} color="#4c3f3c" />
      <Box p={[6.5, 5.5, -2]} s={[0.4, 1.3, 5]} color="#f4f0e6" glow />
      <Box p={[6.4, 3, -2]} s={[0.3, 0.25, 6]} color="#5ab4ff" glow />
      <Tower p={[-6, 0, -16]} w={7} h={44} color="#45454f" crown="#ff6a4a" />
      <pointLight position={[0, 4, 0]} color={PALETTE.occult} intensity={60} distance={18} />
    </AtStop>
  );
}

function TimesSquare() {
  return (
    <AtStop id="timesSquare">
      {/* The elevated tracks crossing the street. */}
      <Box p={[0, 6.6, 0]} s={[24, 1.1, 4]} color="#4a4446" />
      <Box p={[0, 7.4, 1.9]} s={[24, 0.6, 0.3]} color="#5b5456" />
      <Box p={[0, 7.4, -1.9]} s={[24, 0.6, 0.3]} color="#5b5456" />
      {[-6.5, 6.5].map((x) => (
        <Box key={x} p={[x, 3.2, 0]} s={[1, 6.4, 3]} color="#3e3a3c" />
      ))}
      {/* Billboards, the brightest place on the map. */}
      <Box p={[-8, 14, -4]} s={[0.4, 8, 4]} color="#ffb347" glow />
      <Box p={[-8, 9, 4]} s={[0.4, 3.5, 5]} color="#3de0c8" glow />
      <Box p={[8, 12, -6]} s={[0.4, 5, 6]} color="#ff3d5a" glow />
      <Box p={[8, 18, 2]} s={[0.4, 4, 3]} color="#f4f0e6" glow />
      <Box p={[-11, 12, -4]} s={[6, 24, 10]} color="#3a3842" />
      <Box p={[11, 11, -2]} s={[6, 22, 12]} color="#5b4e4e" />
      {/* Subway entrance. */}
      <Box p={[5.5, 0.8, 6]} s={[1.6, 1.6, 3]} color="#2a5a3a" />
      <Box p={[5.5, 1.8, 6]} s={[1.8, 0.3, 3.2]} color="#9dffb0" glow />
      <pointLight position={[0, 9, -2]} color="#ffb347" intensity={80} distance={26} />
    </AtStop>
  );
}

function Downtown() {
  return (
    <AtStop id="downtown">
      <Tower p={[-12, 0, -4]} w={9} h={68} color="#3a3842" crown={PALETTE.windowWarm} />
      <Tower p={[12, 0, 4]} w={8} h={58} color="#45454f" crown="#cfe6ff" />
      <Tower p={[-12, 0, 10]} w={7} h={40} color="#4c3f3c" crown="#ffb347" />
      <Tower p={[12, 0, -10]} w={7} h={46} color="#5b4e4e" crown={PALETTE.windowWarm} />
      <pointLight position={[0, 6, 0]} color="#cfe6ff" intensity={40} distance={20} />
    </AtStop>
  );
}

function Umbria() {
  return (
    <AtStop id="umbria">
      {/* Gate pillars, hedges and the campus hall with its dome and clock tower. */}
      {[-5.2, 5.2].map((x) => (
        <group key={x}>
          <Box p={[x, 4, 7]} s={[1.6, 8, 1.6]} color="#4a5a50" />
          <Box p={[x, 8.3, 7]} s={[2, 0.6, 2]} color="#5a6a60" />
          <Box p={[x * 1.08, 0.7, -2]} s={[1.2, 1.4, 14]} color="#2c4a30" />
        </group>
      ))}
      <Box p={[-13, 6, -4]} s={[8, 12, 14]} color="#2f3a33" />
      <mesh position={[-13, 12, -4]}>
        <sphereGeometry args={[3.6, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <Mat color="#3e5a48" metal={0.3} />
      </mesh>
      <Box p={[11, 11, -6]} s={[4, 22, 4]} color="#3a3a36" />
      <mesh position={[8.95, 18, -6]} rotation={[0, -Math.PI / 2, 0]}>
        <circleGeometry args={[1.3, 12]} />
        <Glow color="#f4f0e6" />
      </mesh>
      <mesh position={[11, 23.5, -6]}>
        <coneGeometry args={[2.4, 4, 4]} />
        <Mat color="#26302a" />
      </mesh>
      <pointLight position={[0, 5, 0]} color={PALETTE.occult} intensity={50} distance={22} />
    </AtStop>
  );
}

function CentralPark() {
  return (
    <AtStop id="centralPark">
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[sd * 12, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[8, 9]} />
          <Mat color="#24402d" />
        </mesh>
      ))}
      {/* The Hangman's Elm: a huge, gnarled tree. */}
      <group position={[-11, 0, -3]}>
        <mesh position={[0, 4, 0]} rotation={[0, 0, 0.12]}>
          <cylinderGeometry args={[0.9, 1.8, 8, 6]} />
          <Mat color="#3a2c24" />
        </mesh>
        {[
          [-2.5, 9, 0, 0.7],
          [2.5, 10, 1, -0.6],
          [0, 11, -2, 0.2],
        ].map(([x, y, z, r], i) => (
          <mesh key={i} position={[x * 0.6, y - 1.5, z * 0.6]} rotation={[0.3, 0, r]}>
            <cylinderGeometry args={[0.3, 0.6, 5, 5]} />
            <Mat color="#3a2c24" />
          </mesh>
        ))}
        {[
          [-3, 11, 0, 3.4],
          [3, 12, 1, 3],
          [0, 13.5, -2, 3.6],
          [1, 10, 3, 2.6],
        ].map(([x, y, z, s], i) => (
          <mesh key={i} position={[x, y, z]}>
            <icosahedronGeometry args={[s]} />
            <Mat color="#26402c" />
          </mesh>
        ))}
      </group>
      {/* A stone arch bridge over the path. */}
      <Box p={[0, 3.6, 10]} s={[13, 0.9, 3]} color="#5a5e5a" />
      {[-5.5, 5.5].map((x) => (
        <Box key={x} p={[x, 1.6, 10]} s={[2, 3.2, 3]} color="#4e524e" />
      ))}
      <Tree p={[11, 0, 5]} s={1.1} />
      <Tree p={[13, 0, -6]} />
      <Tree p={[-13, 0, 8]} s={0.9} />
      <pointLight position={[0, 5, 0]} color="#8dffb0" intensity={40} distance={22} />
    </AtStop>
  );
}

function Brownstones() {
  return (
    <AtStop id="brownstones">
      {[-1, 1].map((sd) =>
        [-6, -2, 2, 6].map((z, i) => (
          <group key={`${sd}${z}`}>
            <Box p={[sd * 9, 5, z]} s={[6, 10, 3.8]} color={i % 2 ? "#4a3328" : "#55402f"} />
            <Box p={[sd * 9, 10.2, z]} s={[6.3, 0.4, 4]} color="#2a1e18" />
            <Box p={[sd * 5.6, 0.6, z]} s={[1.2, 1.2, 1.6]} color="#5a4a40" />
            <Box p={[sd * 5.95, 2.4, z]} s={[0.1, 1.6, 1]} color={PALETTE.windowWarm} glow />
          </group>
        )),
      )}
      <Tree p={[5.6, 0, -9]} s={0.8} />
      <Tree p={[-5.6, 0, 9]} s={0.8} />
    </AtStop>
  );
}

function StockExchange() {
  return (
    <AtStop id="stockExchange">
      {/* The exchange: a temple front with columns and a pediment, warmly lit. */}
      <group position={[-12, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <Box p={[0, 0.8, 0]} s={[14, 1.6, 8]} color="#6a5a48" />
        <Box p={[0, 6.5, -1.5]} s={[13, 10, 5]} color="#5a4c3c" />
        {[-5, -3, -1, 1, 3, 5].map((x) => (
          <mesh key={x} position={[x, 5.6, 2.6]}>
            <cylinderGeometry args={[0.5, 0.55, 8, 6]} />
            <Mat color="#b59c6b" />
          </mesh>
        ))}
        <Box p={[0, 10, 2]} s={[13.4, 1, 3.4]} color="#a08a5e" />
        <mesh position={[0, 11.6, 2]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.5]}>
          <cylinderGeometry
            args={[7, 7, 3.4, 3, 1, false, Math.PI / 2 - Math.PI / 3, (Math.PI * 2) / 3]}
          />
          <Mat color="#a08a5e" />
        </mesh>
        <Box p={[0, 5, 2.2]} s={[10, 0.2, 0.2]} color={PALETTE.windowWarm} glow />
      </group>
      {/* Crates and a jackpot urn by the exchange, for the scavenger slide. */}
      {[
        [3, 0.6, -6],
        [3.8, 0.6, -4.8],
        [3.3, 1.8, -5.4],
        [-3, 0.6, -3],
        [-3.6, 0.6, -1.8],
      ].map((p, i) => (
        <Box key={i} p={p as V3} s={[1.2, 1.2, 1.2]} color="#8a6a44" rot={i * 0.4} />
      ))}
      {/* Clock tower on the corner. */}
      <Box p={[8, 4, -6]} s={[1.6, 8, 1.6]} color="#4f4032" />
      <mesh position={[8, 7.2, -5.15]}>
        <circleGeometry args={[0.6, 12]} />
        <Glow color="#f4f0e6" />
      </mesh>
      <pointLight position={[-5, 6, 0]} color="#ffc46b" intensity={70} distance={24} />
    </AtStop>
  );
}

function Seaport() {
  return (
    <AtStop id="seaport">
      {/* A dock crane. */}
      <group position={[9, 0, 4]}>
        <Box p={[0, 5, 0]} s={[1.2, 10, 1.2]} color="#5a4636" />
        <Box p={[-3, 10.4, 0]} s={[9, 0.8, 0.8]} color="#5a4636" />
        <Box p={[-1, 12, 0]} s={[2.4, 2.4, 2.4]} color="#c9a24b" />
      </group>
      <pointLight position={[0, 5, -4]} color="#ffc46b" intensity={45} distance={20} />
    </AtStop>
  );
}

function Fairfax() {
  return (
    <AtStop id="fairfax">
      {[-11, -16].map((z, i) => (
        <mesh key={z} position={[-11, 8, z + 6]}>
          <cylinderGeometry args={[3, 3, 16, 8]} />
          <Mat color={i ? "#5a4a40" : "#6a5540"} />
        </mesh>
      ))}
      {[6, 9, 12].map((z, i) => (
        <mesh key={z} position={[11, 10 + i * 2, z - 14]}>
          <cylinderGeometry args={[0.8, 1.1, 20 + i * 4, 6]} />
          <Mat color="#41332f" />
        </mesh>
      ))}
      {/* Water tower on legs. */}
      <group position={[10, 0, 8]}>
        {[
          [-1.2, -1.2],
          [1.2, -1.2],
          [-1.2, 1.2],
          [1.2, 1.2],
        ].map(([x, z], i) => (
          <Box key={i} p={[x, 6, z]} s={[0.3, 12, 0.3]} color="#2a2420" />
        ))}
        <mesh position={[0, 14, 0]}>
          <cylinderGeometry args={[2, 2, 4, 8]} />
          <Mat color="#6a5540" />
        </mesh>
        <mesh position={[0, 16.8, 0]}>
          <coneGeometry args={[2.2, 1.6, 8]} />
          <Mat color="#4f4032" />
        </mesh>
      </group>
      {/* Spilled sand and coal. */}
      <mesh position={[-3, 0, -2]}>
        <coneGeometry args={[3, 1.4, 7]} />
        <Mat color="#554a4c" />
      </mesh>
      <Box p={[0, 13, -14]} s={[10, 2, 0.4]} color="#ffd24a" glow />
      <pointLight position={[0, 6, 0]} color="#ffc46b" intensity={40} distance={22} />
    </AtStop>
  );
}

function districtAt(id: DistrictId): [number, number] {
  return DISTRICTS.find((d) => d.id === id)!.center;
}

function Districts() {
  const [tx, tz] = districtAt("theater");
  const [cx, cz] = districtAt("chinatown");
  const [hx, hz] = districtAt("hauntedLot");
  const [px, pz] = districtAt("plaza");
  return (
    <>
      {/* Theater: a domed hall. */}
      <group position={[tx, 0, tz]}>
        <Box p={[0, 4, 0]} s={[12, 8, 12]} color="#4a3a48" />
        <mesh position={[0, 8, 0]}>
          <sphereGeometry args={[5.4, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <Mat color="#6a3a44" metal={0.2} />
        </mesh>
        <Box p={[0, 3, 6.2]} s={[8, 0.8, 0.4]} color={PALETTE.windowWarm} glow />
      </group>
      {/* Chinatown: red brick, red and green neon, and the bell tower. */}
      <group position={[cx, 0, cz]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[0, 4 + i * 4.2, 0]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[5 - i * 1.2, 1.6, 4]} />
            <Mat color="#7a2a22" />
          </mesh>
        ))}
        {[0, 1, 2].map((i) => (
          <Box
            key={i}
            p={[0, 2 + i * 4.2, 0]}
            s={[5 - i * 1.3, 3.2, 5 - i * 1.3]}
            color="#5a241e"
          />
        ))}
        <Box p={[-6, 6, 4]} s={[0.4, 3, 1.4]} color="#ff3d3d" glow />
        <Box p={[6, 5, -3]} s={[0.4, 4, 1.2]} color={PALETTE.occult} glow />
        <pointLight position={[0, 6, 6]} color="#ff4a3a" intensity={40} distance={18} />
      </group>
      {/* Haunted Lot: a green court with a ritual circle and crystals. */}
      <group position={[hx, 0, hz]}>
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[8, 10]} />
          <Mat color="#24402d" />
        </mesh>
        <RitualCircle r={4} />
        {[0, 1, 2, 3, 4].map((i) => {
          const a = (i / 5) * Math.PI * 2;
          return <Crystal key={i} p={[Math.sin(a) * 3.3, 0.9, Math.cos(a) * 3.3]} />;
        })}
        <pointLight position={[0, 3, 0]} color={PALETTE.occult} intensity={50} distance={20} />
      </group>
      {/* Plaza: the statue holding a purple orb, above the sunken plaza. */}
      <group position={[px, 0, pz]}>
        <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[3, 7, 12]} />
          <Mat color="#4a4656" />
        </mesh>
        <Box p={[0, 1.5, 0]} s={[3, 3, 3]} color="#6a3a6a" />
        <mesh position={[0, 6, 0]}>
          <coneGeometry args={[1.2, 6, 6]} />
          <Mat color="#5a5266" />
        </mesh>
        <mesh position={[0, 10.5, 0]}>
          <icosahedronGeometry args={[2]} />
          <Glow color="#c46aff" />
        </mesh>
        <mesh position={[0, 10.5, 0]} rotation={[0.6, 0.3, 0]}>
          <torusGeometry args={[2.8, 0.1, 4, 12]} />
          <Mat color="#c9a24b" metal={0.6} />
        </mesh>
        <pointLight position={[0, 10, 0]} color="#c46aff" intensity={60} distance={22} />
      </group>
    </>
  );
}

function MidBoss() {
  const [x, z] = MID_BOSS;
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[7, 7.6, 1.2, 10, 1, true]} />
        <meshStandardMaterial color="#3a3436" flatShading side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[7, 10]} />
        <Mat color="#1a1c1a" />
      </mesh>
      <RitualCircle r={5} />
      <Crystal p={[0, 4, 0]} s={1.1} />
      <pointLight position={[0, 4, 0]} color={PALETTE.occult} intensity={90} distance={26} />
    </group>
  );
}

/** A Patron at each base: a tall robed statue, amber in the north, sapphire in the south. */
function Patron({ z, color, face }: { z: number; color: string; face: number }) {
  return (
    <group position={[0, 0, z]} rotation={[0, face, 0]}>
      <Box p={[0, 1, 0]} s={[12, 2, 12]} color="#3a3436" />
      <mesh position={[0, 11, 0]}>
        <coneGeometry args={[4, 18, 6]} />
        <Mat color="#2a2428" />
      </mesh>
      <mesh position={[0, 21.5, 0]}>
        <dodecahedronGeometry args={[1.8]} />
        <Mat color="#2a2428" />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 2.4, 13, 2.4]}>
          <octahedronGeometry args={[0.9]} />
          <Glow color={color} />
        </mesh>
      ))}
      <RitualCircle r={6.5} color={color} />
      <pointLight position={[0, 14, 4]} color={color} intensity={160} distance={40} />
    </group>
  );
}

/** Guardians: team statues a short way up each lane from both bases. */
function Guardians() {
  const out: { lane: LaneId; u: number; color: string }[] = [];
  for (const lane of ["blue", "green", "yellow"] as LaneId[]) {
    out.push({ lane, u: 0.1, color: PALETTE.sapphire }, { lane, u: 0.9, color: PALETTE.amber });
  }
  return (
    <>
      {out.map(({ lane, u, color }) => {
        const { p, n } = lanePoint(lane, u);
        const q = p.clone().addScaledVector(n, 4.2);
        return (
          <group key={lane + u} position={[q.x, 0, q.z]}>
            <Box p={[0, 1, 0]} s={[2.4, 2, 2.4]} color="#3a3436" />
            <mesh position={[0, 4, 0]}>
              <cylinderGeometry args={[0.6, 1, 4, 6]} />
              <Mat color="#2a2428" metal={0.3} />
            </mesh>
            <Crystal p={[0, 6.8, 0]} s={0.5} color={color} />
          </group>
        );
      })}
    </>
  );
}

/** Where you die most: a gravestone and a red ring on the ground. */
function DeathSpot({ at }: { at: [number, number] }) {
  return (
    <group position={[at[0], 0, at[1]]}>
      <RitualCircle r={2.4} color="#ff3d3d" />
      <Box p={[-1.6, 0.9, -1]} s={[1.2, 1.8, 0.4]} color="#6a6a70" />
      <pointLight position={[0, 3, 0]} color="#ff3d3d" intensity={30} distance={12} />
    </group>
  );
}

/** The sea past the Yellow lane, by the Seaport, with a docked ship. */
function Harbour() {
  const { p } = stopPoint("seaport");
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-160, 0.01, 0]}>
        <planeGeometry args={[130, 340]} />
        <meshStandardMaterial color="#1c2630" metalness={0.6} roughness={0.35} />
      </mesh>
      <group position={[p.x - 16, 0, p.z + 4]}>
        <Box p={[0, 3, 0]} s={[8, 6, 30]} color="#3a2c2a" />
        <Box p={[0, 7, -4]} s={[6, 3, 10]} color="#e8e0d0" />
        <mesh position={[0, 11, -4]}>
          <cylinderGeometry args={[0.9, 1, 5, 8]} />
          <Mat color="#8a2a22" />
        </mesh>
      </group>
    </group>
  );
}

export function Landmarks({ deathSpot }: { deathSpot: [number, number] | null }) {
  return (
    <>
      <Uptown />
      <TimesSquare />
      <Downtown />
      <Umbria />
      <CentralPark />
      <Brownstones />
      <StockExchange />
      <Seaport />
      <Fairfax />
      <Districts />
      <MidBoss />
      <Patron z={-104} color={PALETTE.amber} face={0} />
      <Patron z={104} color={PALETTE.sapphire} face={Math.PI} />
      <Guardians />
      <Harbour />
      {deathSpot && <DeathSpot at={deathSpot} />}
    </>
  );
}
