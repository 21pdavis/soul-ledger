"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { PALETTE, type Vec3 } from "./layout";
import { RitualRing } from "./Props";

/**
 * The lane defences, after the in-game models: Guardians (terracotta or navy automatons with a
 * flaming brazier for a head and a caged pike) and Walkers (huge tan four-legged automatons holding
 * a spiked, glowing eye over their heads). Both are built from turned shapes, like lathe-turned
 * wood and cast metal, and take their team's colour.
 */

export interface Team {
  /** The Guardian's body. */
  body: string;
  /** Turned limbs. */
  wood: string;
  /** Fire in the brazier, the Walker's eye and markings. */
  fire: string;
}

export const TEAMS: Record<"amber" | "sapphire", Team> = {
  amber: { body: "#c4683c", wood: "#9a6438", fire: "#ff8a2a" },
  sapphire: { body: "#2c3648", wood: "#3e4a5e", fire: "#5ab4ff" },
};

const IRON = "#4a4548";
const IRON_DARK = "#2c292c";
const TAN = "#c99d6c";

/** A turned part: a profile of [radius, height] points spun around the vertical axis. */
function Turned({
  profile,
  color,
  position,
  rotation,
  segments = 14,
  metal = 0.1,
}: {
  profile: [number, number][];
  color: string;
  position?: Vec3;
  rotation?: Vec3;
  segments?: number;
  metal?: number;
}) {
  const geometry = useMemo(
    () =>
      new THREE.LatheGeometry(
        profile.map(([r, y]) => new THREE.Vector2(r, y)),
        segments,
      ),
    [profile, segments],
  );
  return (
    <mesh geometry={geometry} position={position} rotation={rotation}>
      <meshStandardMaterial
        color={color}
        roughness={0.7}
        metalness={metal}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/** Aims a turned limb from a to b (its profile runs up +y from 0 to 1, scaled to the length). */
function TurnedLimb({
  a,
  b,
  profile,
  color,
  thick = 1,
}: {
  a: Vec3;
  b: Vec3;
  profile: [number, number][];
  color: string;
  /** Multiplies the profile's radius, for heavier limbs. */
  thick?: number;
}) {
  const { position, quaternion, length } = useMemo(() => {
    const A = new THREE.Vector3(...a);
    const dir = new THREE.Vector3(...b).sub(A);
    return {
      position: A,
      quaternion: new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        dir.clone().normalize(),
      ),
      length: dir.length(),
    };
  }, [a, b]);
  const scaled = useMemo(
    () => profile.map(([r, y]) => [r * thick, y * length] as [number, number]),
    [profile, length, thick],
  );
  return (
    <group position={position} quaternion={quaternion}>
      <Turned profile={scaled} color={color} />
    </group>
  );
}

const ball = (at: Vec3, r: number, color: string, metal = 0.1) => (
  <mesh position={at}>
    <sphereGeometry args={[r, 16, 12]} />
    <meshStandardMaterial color={color} roughness={0.7} metalness={metal} />
  </mesh>
);

/** A thick turned upper arm or thigh: bulbous, with a ring at each end. */
const BULB: [number, number][] = [
  [0.0, 0],
  [0.07, 0.02],
  [0.09, 0.08],
  [0.13, 0.3],
  [0.14, 0.5],
  [0.11, 0.78],
  [0.08, 0.9],
  [0.09, 0.94],
  [0.0, 1],
];
/** A slimmer turned forearm or shin, with collars. */
const SPINDLE: [number, number][] = [
  [0.0, 0],
  [0.07, 0.02],
  [0.06, 0.12],
  [0.08, 0.18],
  [0.06, 0.3],
  [0.09, 0.62],
  [0.07, 0.86],
  [0.09, 0.9],
  [0.0, 1],
];

/**
 * A Guardian, about 2.1 units tall before `scale`, facing +z: turned legs on flat feet, a round
 * terracotta (or navy) body hung with iron ring pulls, bulbous arms, a brazier head full of fire,
 * and a caged pike held across the body.
 */
export function Guardian({
  p,
  rot = 0,
  team,
  scale = 3.2,
}: {
  p: Vec3;
  rot?: number;
  team: Team;
  scale?: number;
}) {
  return (
    <group position={p} rotation={[0, rot, 0]} scale={scale}>
      {/* It stands on a green ritual circle, as in game. */}
      <RitualRing r={1.05} color={PALETTE.occult} y={0.02} />
      {[-1, 1].map((sd) => (
        <group key={sd}>
          {/* Foot, shin, knee, thigh, hip. */}
          <mesh position={[sd * 0.18, 0.03, 0.05]}>
            <boxGeometry args={[0.16, 0.06, 0.28]} />
            <meshStandardMaterial color={team.wood} roughness={0.8} />
          </mesh>
          <TurnedLimb
            a={[sd * 0.18, 0.05, 0]}
            b={[sd * 0.17, 0.56, 0]}
            profile={SPINDLE}
            color={team.wood}
          />
          {ball([sd * 0.17, 0.62, 0], 0.1, team.wood)}
          <TurnedLimb
            a={[sd * 0.17, 0.66, 0]}
            b={[sd * 0.13, 0.98, 0]}
            profile={BULB}
            color={team.wood}
          />
          {ball([sd * 0.12, 1.0, 0], 0.11, team.wood)}
          {/* Shoulder, upper arm, elbow, forearm, fist. */}
          {ball([sd * 0.42, 1.5, 0], 0.13, team.body)}
          <TurnedLimb
            a={[sd * 0.44, 1.46, 0]}
            b={[sd * 0.5, 1.16, 0.05]}
            profile={BULB}
            color={team.body}
          />
          {ball([sd * 0.5, 1.12, 0.06], 0.075, team.wood)}
          <TurnedLimb
            a={[sd * 0.5, 1.1, 0.07]}
            b={[sd * 0.42, 0.9, 0.22]}
            profile={SPINDLE}
            color={team.wood}
          />
          <mesh position={[sd * 0.4, 0.86, 0.25]}>
            <boxGeometry args={[0.1, 0.11, 0.1]} />
            <meshStandardMaterial color={IRON} roughness={0.6} metalness={0.4} />
          </mesh>
        </group>
      ))}
      {/* Pelvis: a turned, flared cup. */}
      <Turned
        position={[0, 0.98, 0]}
        profile={[
          [0.08, 0],
          [0.12, 0.04],
          [0.16, 0.08],
          [0.27, 0.13],
          [0.26, 0.16],
          [0.0, 0.17],
        ]}
        color={team.wood}
      />
      {/* The round body, with ring pulls and rivets. */}
      {ball([0, 1.42, 0], 0.36, team.body)}
      {[
        [-0.14, 1.46, 0.33],
        [0.17, 1.52, 0.31],
        [-0.3, 1.36, 0.2],
      ].map((at, i) => (
        <group key={i} position={at as Vec3}>
          {ball([0, 0.02, 0], 0.025, IRON, 0.5)}
          <mesh position={[0, -0.06, 0.012]}>
            <torusGeometry args={[0.055, 0.012, 6, 14]} />
            <meshStandardMaterial color={IRON} metalness={0.5} roughness={0.5} />
          </mesh>
        </group>
      ))}
      {/* The neck collar and the brazier head, with its fire. */}
      <Turned
        position={[0, 1.72, 0]}
        profile={[
          [0.0, 0],
          [0.2, 0],
          [0.2, 0.05],
          [0.12, 0.08],
          [0.1, 0.14],
          [0.0, 0.14],
        ]}
        color={IRON_DARK}
        metal={0.4}
      />
      <Turned
        position={[0, 1.86, 0]}
        profile={[
          [0.06, 0],
          [0.22, 0.04],
          [0.29, 0.14],
          [0.31, 0.24],
          [0.28, 0.25],
        ]}
        color={IRON_DARK}
        metal={0.4}
      />
      {/* Holes around the brazier's rim, glowing with the fire inside. */}
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.sin(a) * 0.272, 2.03, Math.cos(a) * 0.272]}
            rotation={[0, a, 0]}
          >
            <circleGeometry args={[0.022, 8]} />
            <meshBasicMaterial color={team.fire} toneMapped={false} side={THREE.DoubleSide} />
          </mesh>
        );
      })}
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.sin(a) * 0.1, 2.2, Math.cos(a) * 0.1]}
            rotation={[0.2 * Math.sin(a), 0, 0.2 * Math.cos(a)]}
          >
            <coneGeometry args={[0.08, 0.34, 5]} />
            <meshBasicMaterial color={i % 2 ? "#ffd27a" : team.fire} toneMapped={false} />
          </mesh>
        );
      })}
      {/* The caged pike, held across the body and pointing forward and down. */}
      <group position={[0, 0.88, 0.25]} rotation={[0, 0.35, 0]}>
        <TurnedLimb
          a={[0.55, 0, -0.1]}
          b={[-0.75, -0.08, 0.55]}
          profile={[
            [0, 0],
            [0.025, 0.02],
            [0.025, 0.95],
            [0.045, 0.97],
            [0, 1],
          ]}
          color={IRON}
        />
        <group position={[-0.95, -0.1, 0.65]} rotation={[0, -0.6 + Math.PI / 2, Math.PI / 2]}>
          {Array.from({ length: 6 }, (_, i) => {
            const a = (i / 6) * Math.PI * 2;
            return (
              <group key={i} rotation={[0, a, 0]}>
                <mesh position={[0.1, 0.18, 0]}>
                  <boxGeometry args={[0.018, 0.38, 0.018]} />
                  <meshStandardMaterial color={IRON} metalness={0.5} roughness={0.5} />
                </mesh>
                <mesh position={[0.1, 0.42, 0]}>
                  <coneGeometry args={[0.025, 0.12, 4]} />
                  <meshStandardMaterial color={IRON} metalness={0.5} roughness={0.5} />
                </mesh>
              </group>
            );
          })}
          <mesh position={[0, 0.03, 0]}>
            <torusGeometry args={[0.1, 0.015, 6, 14]} />
            <meshStandardMaterial color={IRON} metalness={0.5} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

/**
 * A Walker, about 5 units tall before `scale`, facing +z: a big round tan body on four stubby
 * legs ending in spiked ring feet, a porthole on the front, team-coloured markings, and two arms
 * raised to hold its spiked, glowing eye over its head.
 */
export function Walker({
  p,
  rot = 0,
  team,
  scale = 3.2,
}: {
  p: Vec3;
  rot?: number;
  team: Team;
  scale?: number;
}) {
  const legs: [number, number][] = [
    [0.85, 0.65],
    [-0.85, 0.65],
    [0.85, -0.65],
    [-0.85, -0.65],
  ];
  return (
    <group position={p} rotation={[0, rot, 0]} scale={scale}>
      {legs.map(([x, z], i) => (
        <group key={i}>
          <TurnedLimb
            a={[x * 0.45, 1.5, z * 0.45]}
            b={[x, 0.5, z]}
            profile={BULB}
            color={TAN}
            thick={2.3}
          />
          {ball([x, 0.48, z], 0.24, TAN)}
          <TurnedLimb
            a={[x, 0.46, z]}
            b={[x * 1.05, 0.08, z * 1.05]}
            profile={SPINDLE}
            color={TAN}
            thick={2.4}
          />
          {/* The ring foot, with short spikes round its rim. */}
          <mesh position={[x * 1.05, 0.05, z * 1.05]}>
            <cylinderGeometry args={[0.32, 0.36, 0.1, 14]} />
            <meshStandardMaterial color={IRON_DARK} metalness={0.4} />
          </mesh>
          {Array.from({ length: 8 }, (_, k) => {
            const a = (k / 8) * Math.PI * 2;
            return (
              <mesh
                key={k}
                position={[x * 1.05 + Math.sin(a) * 0.27, 0.04, z * 1.05 + Math.cos(a) * 0.27]}
                rotation={[Math.cos(a) * 1.4, 0, -Math.sin(a) * 1.4]}
              >
                <coneGeometry args={[0.03, 0.12, 4]} />
                <meshStandardMaterial color={IRON_DARK} />
              </mesh>
            );
          })}
        </group>
      ))}
      {/* The body: a turned base, the big round hull, its porthole and painted bands. */}
      <Turned
        position={[0, 1.2, 0]}
        profile={[
          [0.0, 0],
          [0.4, 0.02],
          [0.55, 0.15],
          [0.62, 0.3],
          [0.0, 0.32],
        ]}
        color={TAN}
      />
      {ball([0, 2.2, 0], 1.08, TAN)}
      <mesh position={[0, 2.25, 0.98]}>
        <torusGeometry args={[0.36, 0.07, 8, 20]} />
        <meshStandardMaterial color={IRON} metalness={0.4} />
      </mesh>
      <mesh position={[0, 2.25, 1.0]}>
        <circleGeometry args={[0.33, 20]} />
        <meshStandardMaterial color={IRON_DARK} />
      </mesh>
      {[1.75, 2.75].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[Math.sqrt(1.08 ** 2 - (y - 2.2) ** 2) + 0.005, 0.025, 6, 32]} />
          <meshBasicMaterial color={team.fire} toneMapped={false} />
        </mesh>
      ))}
      {ball([0, 3.25, 0], 0.32, TAN)}
      {/* Arms raised, both hands holding the eye. */}
      {[-1, 1].map((sd) => (
        <group key={sd}>
          {ball([sd * 1.05, 2.85, 0], 0.32, TAN)}
          <TurnedLimb
            a={[sd * 1.1, 2.95, 0]}
            b={[sd * 1.25, 3.9, 0.2]}
            profile={BULB}
            color={TAN}
            thick={2.3}
          />
          {ball([sd * 1.25, 3.95, 0.2], 0.24, TAN)}
          <TurnedLimb
            a={[sd * 1.22, 4.0, 0.2]}
            b={[sd * 0.55, 4.6, 0.35]}
            profile={SPINDLE}
            color={TAN}
            thick={2.4}
          />
        </group>
      ))}
      {/* The eye: a glowing core in a spiked iron ring. */}
      <group position={[0, 4.75, 0.35]}>
        <mesh>
          <sphereGeometry args={[0.42, 18, 14]} />
          <meshBasicMaterial color={team.fire} toneMapped={false} />
        </mesh>
        <mesh>
          <torusGeometry args={[0.5, 0.08, 8, 22]} />
          <meshStandardMaterial color={IRON_DARK} metalness={0.5} />
        </mesh>
        {Array.from({ length: 10 }, (_, k) => {
          const a = (k / 10) * Math.PI * 2;
          return (
            <mesh
              key={k}
              position={[Math.sin(a) * 0.62, Math.cos(a) * 0.62, 0]}
              rotation={[0, 0, -a]}
            >
              <coneGeometry args={[0.07, 0.3, 4]} />
              <meshStandardMaterial color={IRON_DARK} metalness={0.5} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}
