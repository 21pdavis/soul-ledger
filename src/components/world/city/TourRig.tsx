"use client";

import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";
import { CARD_SIDES, LANE_CHANGES, routeAt, routeTangent, shotPosition, type Shot } from "./tour";
import { sceneShift } from "./framing";
import { flightProgress, planFlyIn, planHop, routeS as routeAlong, weaveOffset } from "./flight";

/**
 * The camera rotation that looks from `eye` at `target`. Looking (nearly) straight down, "up" on
 * screen is game north (-z), so the overhead map is framed the same way every time instead of
 * spinning to whatever the last few frames happened to give.
 */
const lookMatrix = new THREE.Matrix4();
const WORLD_UP = new THREE.Vector3(0, 1, 0);
const NORTH = new THREE.Vector3(0, 0, -1);
function orientation(eye: THREE.Vector3, target: THREE.Vector3, out: THREE.Quaternion) {
  const down = Math.abs(target.clone().sub(eye).normalize().y) > 0.97;
  lookMatrix.lookAt(eye, target, down ? NORTH : WORLD_UP);
  return out.setFromRotationMatrix(lookMatrix);
}

/** Only wide screens show the desktop card stack; phones keep the scene centred. */
const WIDE_ASPECT = 1.2;

interface Flight {
  target: number;
  start: number;
  duration: number;
  /** Route flights move a distance along the route; free flights lerp. */
  route: { from: number; to: number } | null;
  fromPos: THREE.Vector3;
  fromLook: THREE.Vector3;
  /** The camera rotation when this hop began; free flights turn from it smoothly. */
  fromQuat: THREE.Quaternion;
  /** Alternates the weave side per hop. */
  weaveSign: number;
  /** The sideways offset the camera had when this hop began (a hop can start mid-weave). */
  fromSide: number;
  /** How high a free flight arcs at its middle: over the rooftops when changing lanes. */
  lift: number;
}

/**
 * Flies the camera between slide shots. Between two stops on the same lane it travels the route at
 * cruise height, weaving gently and looking ahead. Changing lanes, it swoops up over the rooftops
 * and down into the next lane. Shots off the route (opening, pit, death map, summary) glide
 * straight there. Timing runs on the clock, so a
 * slow device arrives on time in fewer frames.
 */
/**
 * Preview aid (development only): `?cam=px,py,pz,lx,ly,lz` in the address pins the camera
 * there, looking at the second point, instead of following the story. For inspecting the city.
 */
function pinnedShot(): Shot | null {
  if (process.env.NODE_ENV === "production" || typeof window === "undefined") return null;
  const v = new URLSearchParams(window.location.search).get("cam")?.split(",").map(Number);
  if (!v || v.length !== 6 || v.some((n) => !Number.isFinite(n))) return null;
  return { kind: "free", pos: [v[0], v[1], v[2]], look: [v[3], v[4], v[5]] };
}

export function TourRig({ shots: storyShots, slide }: { shots: Shot[]; slide: number }) {
  const [pinned] = useState(pinnedShot);
  const shots = pinned ? [pinned] : storyShots;
  const flight = useRef<Flight | null>(null);
  const look = useRef(new THREE.Vector3());
  const routeS = useRef<number | null>(null);
  const shift = useRef(0);
  const side = useRef(0);
  const tmp = useRef({
    a: new THREE.Vector3(),
    b: new THREE.Vector3(),
    c: new THREE.Vector3(),
    q: new THREE.Quaternion(),
  });

  useFrame((frame, delta) => {
    const cam = frame.camera as THREE.PerspectiveCamera;
    const now = frame.clock.elapsedTime;
    const i = Math.min(slide, shots.length - 1);
    const shot = shots[i];
    const { a, b, c, q } = tmp.current;

    if (!flight.current && cam.userData.posed) {
      // The landing page's camera was already circling this city: fly down into the opening
      // shot from wherever it is, instead of cutting to it (one city for the whole visit).
      cam.getWorldDirection(a);
      look.current.copy(cam.position).addScaledVector(a, 60);
      const hop = planFlyIn(cam.position.distanceTo(shotPosition(shot, b)));
      flight.current = {
        target: i,
        start: now,
        duration: hop.duration,
        route: null,
        fromPos: cam.position.clone(),
        fromLook: look.current.clone(),
        fromQuat: cam.quaternion.clone(),
        weaveSign: 1,
        fromSide: 0,
        lift: 0,
      };
      routeS.current = null;
    }
    if (!flight.current) {
      shotPosition(shot, cam.position);
      look.current.set(...shot.look);
      routeS.current = shot.kind === "route" ? shot.s : null;
      flight.current = {
        target: i,
        start: -Infinity,
        duration: 1,
        route: null,
        fromPos: cam.position.clone(),
        fromLook: look.current.clone(),
        fromQuat: cam.quaternion.clone(),
        weaveSign: 1,
        fromSide: 0,
        lift: 0,
      };
    }
    const f = flight.current;
    if (f.target !== i) {
      // Start a new hop from wherever the camera is, even mid-flight.
      const hop = planHop({
        fromS: routeS.current,
        shot,
        laneChanges: LANE_CHANGES,
        freeDistance: () => cam.position.distanceTo(shotPosition(shot, a)),
      });
      f.route = hop.route;
      f.target = i;
      f.start = now;
      f.duration = hop.duration;
      f.fromPos.copy(cam.position);
      f.fromLook.copy(look.current);
      f.fromQuat.copy(cam.quaternion);
      f.weaveSign = -f.weaveSign;
      f.fromSide = side.current;
      f.lift = hop.lift;
    }

    const k = flightProgress(now, f.start, f.duration);
    if (f.route) {
      const s = routeAlong(f.route, k);
      routeS.current = s;
      routeAt(s, cam.position);
      // Weave: a sideways arc that is zero at both stops.
      const t = routeTangent(s, a);
      side.current = weaveOffset(f.fromSide, k, f.weaveSign);
      cam.position.x += -t.z * side.current;
      cam.position.z += t.x * side.current;
      // Look down the road while travelling, settling on the stop at either end.
      const dir = Math.sign(f.route.to - f.route.from) || 1;
      routeAt(s + dir * 16, b).setY(3);
      c.copy(f.fromLook).lerp(new THREE.Vector3(...shot.look), k);
      look.current.copy(c).lerp(b, Math.sin(Math.PI * k) * 0.75);
    } else {
      cam.position.lerpVectors(f.fromPos, shotPosition(shot, a), k);
      cam.position.y += Math.sin(Math.PI * k) * f.lift;
      look.current.lerpVectors(f.fromLook, b.set(...shot.look), k);
      // Turn evenly from the starting rotation to the final one (a slerp), rather than re-aiming
      // at a moving point, which crawls and then whips round near straight down.
      orientation(shotPosition(shot, c), b, q);
      cam.quaternion.slerpQuaternions(f.fromQuat, q, k);
      // Off the route until this flight lands on a route shot.
      routeS.current = k >= 1 && shot.kind === "route" ? shot.s : null;
      side.current = 0;
    }
    if (f.route) cam.lookAt(look.current);
    cam.userData.posed = true;

    // Lens shift: slide the picture so the scene sits in the space beside the card. The frustum
    // moves by filmOffset / filmWidth of the near-plane width.
    const wide = cam.aspect > WIDE_ASPECT;
    const want = wide ? sceneShift(frame.size.width, CARD_SIDES[i], shot.nudge) : 0;
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
