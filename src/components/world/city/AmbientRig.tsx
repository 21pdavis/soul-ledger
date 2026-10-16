"use client";

import { useFrame } from "@react-three/fiber";
import { ambientPose } from "./ambient";

/** The landing page's camera: circles the city slowly, with no story to follow (ambient.ts). */
export function AmbientRig() {
  useFrame(({ camera, clock }) => {
    const { pos, look } = ambientPose(clock.elapsedTime);
    camera.position.set(...pos);
    camera.lookAt(...look);
  });
  return null;
}
