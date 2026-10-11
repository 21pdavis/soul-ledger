"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import type { Shot } from "./tour";

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/**
 * Flies the camera between slide shots. Long hops arc up over the rooftops (a swoop) instead of
 * cutting through buildings; the time scales with the distance.
 */
export function SwoopRig({ shots, slide }: { shots: Shot[]; slide: number }) {
  const camera = useThree((s) => s.camera);
  const state = useRef<{
    target: number;
    from: { pos: THREE.Vector3; look: THREE.Vector3 };
    look: THREE.Vector3;
    start: number;
    duration: number;
    lift: number;
  } | null>(null);

  useFrame((frame) => {
    // Flights run on the clock, not frame counts, so a slow device arrives on time (in fewer frames).
    const now = frame.clock.elapsedTime;
    const i = Math.min(slide, shots.length - 1);
    const shot = shots[i];
    if (!state.current) {
      camera.position.set(...shot.pos);
      state.current = {
        target: i,
        from: { pos: camera.position.clone(), look: new THREE.Vector3(...shot.look) },
        look: new THREE.Vector3(...shot.look),
        start: -Infinity,
        duration: 1,
        lift: 0,
      };
    }
    const s = state.current;
    if (s.target !== i) {
      // Start a new flight from wherever the camera is now.
      const dist = camera.position.distanceTo(new THREE.Vector3(...shot.pos));
      s.target = i;
      s.from = { pos: camera.position.clone(), look: s.look.clone() };
      s.start = now;
      s.duration = THREE.MathUtils.clamp(1.2 + dist / 60, 1.4, 3.2);
      s.lift = Math.min(dist * 0.35, 45);
    }
    const k = ease(Math.min(1, (now - s.start) / s.duration));
    const to = new THREE.Vector3(...shot.pos);
    camera.position.lerpVectors(s.from.pos, to, k);
    camera.position.setY(camera.position.y + Math.sin(Math.PI * k) * s.lift);
    s.look.lerpVectors(s.from.look, new THREE.Vector3(...shot.look), k);
    camera.lookAt(s.look);
  });
  return null;
}
