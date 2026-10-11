"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { CARD_SIDES, LANE_CHANGES, routeAt, routeTangent, shotPosition, type Shot } from "./tour";

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

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** Cruise speed along the route, in world units a second. */
const SPEED = 24;
/** How far the camera drifts sideways at the middle of a hop between stops. */
const WEAVE = 2.4;
/** Only wide screens show the desktop card stack; phones keep the scene centred. */
const WIDE_ASPECT = 1.2;

/**
 * Where the open space beside a side card is centred, as a fraction of the screen width from the
 * middle. Mirrors the preview's card CSS: gutters of clamp(72px, 12vw, 192px), a card of at most
 * min(480px, 42vw), and the progress rail in the right gutter.
 */
function sceneShift(width: number, side: "left" | "right") {
  const gutter = THREE.MathUtils.clamp(width * 0.12, 72, 192);
  const card = Math.min(480, width * 0.42, width - 2 * gutter);
  const open = side === "left" ? [gutter + card, width - 48] : [48, width - gutter - card];
  return ((open[0] + open[1]) / 2 - width / 2) / width;
}

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
export function TourRig({ shots, slide }: { shots: Shot[]; slide: number }) {
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
      const from = routeS.current;
      const crossesLanes =
        from !== null &&
        shot.kind === "route" &&
        LANE_CHANGES.some((c) => (c - from) * (c - shot.s) < 0);
      const onRoute = from !== null && shot.kind === "route" && !crossesLanes;
      const dist = onRoute
        ? Math.abs(shot.s - routeS.current!)
        : cam.position.distanceTo(shotPosition(shot, a));
      f.route = onRoute ? { from: routeS.current!, to: shot.s } : null;
      f.target = i;
      f.start = now;
      f.duration = onRoute
        ? THREE.MathUtils.clamp(dist / SPEED, 1.4, 6)
        : THREE.MathUtils.clamp(1.2 + dist / 70, 1.6, 3.6);
      f.fromPos.copy(cam.position);
      f.fromLook.copy(look.current);
      f.fromQuat.copy(cam.quaternion);
      f.weaveSign = -f.weaveSign;
      f.fromSide = side.current;
      f.lift = crossesLanes ? THREE.MathUtils.clamp(dist * 0.35, 22, 45) : 0;
    }

    const k = ease(Math.min(1, (now - f.start) / f.duration));
    if (f.route) {
      const s = THREE.MathUtils.lerp(f.route.from, f.route.to, k);
      routeS.current = s;
      routeAt(s, cam.position);
      // Weave: a sideways arc that is zero at both stops.
      const t = routeTangent(s, a);
      side.current = f.fromSide * (1 - k) + Math.sin(Math.PI * k) * WEAVE * f.weaveSign;
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

    // Lens shift: slide the picture so the scene sits in the space beside the card. The frustum
    // moves by filmOffset / filmWidth of the near-plane width.
    const wide = cam.aspect > WIDE_ASPECT;
    const want = wide ? sceneShift(frame.size.width, CARD_SIDES[i]) : 0;
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
