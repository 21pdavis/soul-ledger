"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { AMBIENT, ambientPose } from "./ambient";
import { flightProgress } from "./flight";

const target = new THREE.Vector3();
const lookMatrix = new THREE.Matrix4();
const goal = new THREE.Quaternion();

/**
 * The landing page's camera: circles the city slowly, with no story to follow (ambient.ts). Back
 * from a story ("New lookup"), it glides up from where the story left it into the circle rather
 * than cutting there.
 */
export function AmbientRig() {
  const from = useRef<{ start: number; pos: THREE.Vector3; quat: THREE.Quaternion } | null>(null);
  useFrame(({ camera, clock }) => {
    const now = clock.elapsedTime;
    const { pos, look } = ambientPose(now);
    if (from.current === null) {
      from.current = camera.userData.posed
        ? { start: now, pos: camera.position.clone(), quat: camera.quaternion.clone() }
        : { start: -Infinity, pos: new THREE.Vector3(), quat: new THREE.Quaternion() };
    }
    const f = from.current;
    const k = flightProgress(now, f.start, AMBIENT.returnSeconds);
    target.set(...pos);
    if (k >= 1) {
      camera.position.copy(target);
      camera.lookAt(...look);
    } else {
      camera.position.lerpVectors(f.pos, target, k);
      lookMatrix.lookAt(target, new THREE.Vector3(...look), camera.up);
      goal.setFromRotationMatrix(lookMatrix);
      camera.quaternion.slerpQuaternions(f.quat, goal, k);
    }
    camera.userData.posed = true;
  });
  return null;
}
