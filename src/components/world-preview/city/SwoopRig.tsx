"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { CARD_SIDES, type Shot } from "./tour";

/** Where the scene's centre lands, as a fraction of screen width from the middle, beside a side card. */
const SCENE_SHIFT = 0.22;
/** Only wide screens show the desktop card stack; phones keep the scene centred. */
const WIDE_ASPECT = 1.2;

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
  const shift = useRef(0);

  useFrame((frame, delta) => {
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

    // Lens shift: slide the picture so the scene sits beside the card, not behind it. The frustum
    // moves by filmOffset / filmWidth of the near-plane width (filmWidth is the gauge on wide screens).
    const cam = frame.camera as THREE.PerspectiveCamera;
    const wide = cam.aspect > WIDE_ASPECT;
    const want = wide ? (CARD_SIDES[i] === "left" ? SCENE_SHIFT : -SCENE_SHIFT) : 0;
    shift.current += (want - shift.current) * Math.min(1, Math.min(delta, 0.1) * 3);
    const nearWidth = 2 * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * cam.aspect;
    const offset = -shift.current * nearWidth * cam.getFilmWidth();
    if (Math.abs(offset - cam.filmOffset) > 1e-4) {
      cam.filmOffset = offset;
      cam.updateProjectionMatrix();
    }
  });
  return null;
}
