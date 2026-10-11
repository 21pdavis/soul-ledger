import * as THREE from "three";

/**
 * A low-poly City Never Sleeps map (the 2026 map update), laid out from the official lane maps:
 * Blue lane down the middle (Uptown, Times Square, Downtown), Green lane on the right (Umbria
 * University, Central Park, the Brownstones), Yellow lane on the left (Stock Exchange, Seaport,
 * Old Fairfax Factories), and the four districts between them. Bases sit at the north and south
 * ends. One world unit is 100 game units, so death positions (about ±10,500) land on the map.
 */

export type Vec3 = [number, number, number];
export type LaneId = "blue" | "green" | "yellow";

/** Deterministic random numbers, so the city is the same on every load. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const MAP_RADIUS = 112;
export const LANE_HALF = 4.5;
export const SIDEWALK = 2;

/** Game map position (x, y) to world (x, z). Game +y is north, which is world -z. */
export function gameToWorld(x: number, y: number): [number, number] {
  return [x / 100, -y / 100];
}

export const PALETTE = {
  skyTop: "#1a2030",
  skyMid: "#4a3e4c",
  horizon: "#b97a52",
  fog: "#4a3e48",
  ground: "#383234",
  road: "#2a2628",
  sidewalk: "#5e5658",
  occult: "#6dff9a",
  amber: "#ff9a3d",
  sapphire: "#4f8cff",
  windowWarm: "#ffcf7a",
} as const;

export interface Lane {
  id: LaneId;
  /** The zip line glows in the lane's colour, as in game. */
  color: string;
  lamp: string;
  stone: string[];
  windows: string;
  curve: THREE.CatmullRomCurve3;
}

const curve = (pts: [number, number][]) =>
  new THREE.CatmullRomCurve3(
    pts.map(([x, z]) => new THREE.Vector3(x, 0, z)),
    false,
    "centripetal",
  );

export const LANES: Lane[] = [
  {
    id: "blue",
    color: "#5ab4ff",
    lamp: "#cfe6ff",
    stone: ["#3a3842", "#4c3f3c", "#5b4e4e", "#6b3a32", "#45454f"],
    windows: PALETTE.windowWarm,
    curve: curve([
      [0, 106],
      [-3, 70],
      [3, 38],
      [1, 10],
      [-3, -24],
      [3, -60],
      [0, -106],
    ]),
  },
  {
    id: "green",
    color: "#6dff9a",
    lamp: "#8dffb0",
    stone: ["#26302a", "#2f3a33", "#4a3328", "#3a3a36", "#55402f"],
    windows: "#c8ffb8",
    curve: curve([
      [8, 106],
      [30, 86],
      [56, 58],
      [74, 16],
      [72, -30],
      [52, -70],
      [8, -106],
    ]),
  },
  {
    id: "yellow",
    color: "#ffd24a",
    lamp: "#ffc46b",
    stone: ["#4f4032", "#5a4636", "#372c23", "#6a5540", "#463a30"],
    windows: "#ffc46b",
    curve: curve([
      [-8, 106],
      [-30, 86],
      [-56, 58],
      [-74, 16],
      [-72, -30],
      [-52, -70],
      [-8, -106],
    ]),
  },
];

export type StopId =
  | "uptown"
  | "timesSquare"
  | "downtown"
  | "umbria"
  | "centralPark"
  | "brownstones"
  | "stockExchange"
  | "seaport"
  | "fairfax";

export interface Stop {
  id: StopId;
  name: string;
  lane: LaneId;
  /** Where along the lane, 0 = south base, 1 = north base. */
  u: number;
  /** Keeps generic buildings out of the landmark's footprint. */
  clear: number;
}

export const STOPS: Stop[] = [
  { id: "downtown", name: "Downtown", lane: "blue", u: 0.2, clear: 9 },
  { id: "timesSquare", name: "Times Square", lane: "blue", u: 0.47, clear: 10 },
  { id: "uptown", name: "Uptown", lane: "blue", u: 0.76, clear: 11 },
  { id: "brownstones", name: "The Brownstones", lane: "green", u: 0.24, clear: 8 },
  { id: "centralPark", name: "Central Park", lane: "green", u: 0.5, clear: 16 },
  { id: "umbria", name: "Umbria University", lane: "green", u: 0.74, clear: 13 },
  { id: "fairfax", name: "Old Fairfax Factories", lane: "yellow", u: 0.24, clear: 13 },
  { id: "seaport", name: "Seaport Dock", lane: "yellow", u: 0.5, clear: 20 },
  { id: "stockExchange", name: "Stock Exchange", lane: "yellow", u: 0.74, clear: 12 },
];

export type DistrictId = "theater" | "chinatown" | "hauntedLot" | "plaza";

export interface District {
  id: DistrictId;
  name: string;
  center: [number, number];
  stone: string[];
  clear: number;
}

export const DISTRICTS: District[] = [
  {
    id: "theater",
    name: "Theater",
    center: [34, -38],
    stone: ["#4a3a48", "#3e3240", "#5a4452"],
    clear: 9,
  },
  {
    id: "chinatown",
    name: "Chinatown",
    center: [34, 40],
    stone: ["#6a2a22", "#5a241e", "#7a3a2a"],
    clear: 8,
  },
  {
    id: "hauntedLot",
    name: "Haunted Lot",
    center: [-34, 40],
    stone: ["#26302a", "#2c2a30", "#3a3a36"],
    clear: 9,
  },
  {
    id: "plaza",
    name: "Plaza",
    center: [-34, -38],
    stone: ["#3e3a4a", "#4a4656", "#35323e"],
    clear: 9,
  },
];

/** The mid boss pit, just off the Blue lane in the middle of the map. */
export const MID_BOSS: [number, number] = [-15, -2];

export function laneById(id: LaneId): Lane {
  return LANES.find((l) => l.id === id)!;
}

/** A point on a lane and its direction there, both flat on the ground. */
export function lanePoint(id: LaneId, u: number) {
  const c = laneById(id).curve;
  const p = c.getPointAt(u);
  const t = c.getTangentAt(u).setY(0).normalize();
  // Points to the lane's right when walking north (towards -z).
  const n = new THREE.Vector3(-t.z, 0, t.x);
  return { p, t, n };
}

export function stopById(id: StopId): Stop {
  return STOPS.find((s) => s.id === id)!;
}

export function stopPoint(id: StopId) {
  const s = stopById(id);
  return lanePoint(s.lane, s.u);
}

// Lanes sampled once, for distance checks.
const SAMPLES = LANES.map((l) => ({ id: l.id, pts: l.curve.getSpacedPoints(320) }));

export function distanceToLanes(x: number, z: number): { d: number; lane: LaneId } {
  let best = Infinity;
  let lane: LaneId = "blue";
  for (const s of SAMPLES) {
    for (const p of s.pts) {
      const d = (p.x - x) ** 2 + (p.z - z) ** 2;
      if (d < best) {
        best = d;
        lane = s.id;
      }
    }
  }
  return { d: Math.sqrt(best), lane };
}

export interface Building {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  rot: number;
  color: string;
  windows: string;
  /** The face (local +z) looks onto a lane, so it gets lit windows. */
  facesLane: boolean;
}

function clearings(): { x: number; z: number; r: number }[] {
  const out = STOPS.map((s) => {
    const { p } = stopPoint(s.id);
    return { x: p.x, z: p.z, r: s.clear };
  });
  for (const d of DISTRICTS) out.push({ x: d.center[0], z: d.center[1], r: d.clear });
  out.push({ x: MID_BOSS[0], z: MID_BOSS[1], r: 10 });
  // Bases.
  out.push({ x: 0, z: -104, r: 16 }, { x: 0, z: 104, r: 16 });
  return out;
}

/** Buildings lining both sides of every lane, then the district blocks in between. */
export function buildCity(
  seed = 11,
  extra: { x: number; z: number; r: number }[] = [],
): Building[] {
  const r = rng(seed);
  const clear = [...clearings(), ...extra];
  const out: Building[] = [];
  const blocked = (x: number, z: number, rad: number) =>
    x * x + z * z > (MAP_RADIUS - rad) ** 2 ||
    clear.some((c) => (c.x - x) ** 2 + (c.z - z) ** 2 < (c.r + rad) ** 2);
  const overlaps = (x: number, z: number, rad: number) =>
    out.some((b) => (b.x - x) ** 2 + (b.z - z) ** 2 < (rad + Math.max(b.w, b.d) * 0.45) ** 2);

  for (const lane of LANES) {
    const len = lane.curve.getLength();
    const step = 6.2;
    for (let s = step; s < len - step; s += step) {
      const u = s / len;
      const { p, n } = lanePoint(lane.id, u);
      for (const side of [-1, 1]) {
        const d = 6 + r() * 6;
        const w = step - 0.4;
        const off = LANE_HALF + SIDEWALK + d / 2;
        const x = p.x + n.x * side * off;
        const z = p.z + n.z * side * off;
        const rad = Math.min(w, d) / 2;
        if (blocked(x, z, rad)) continue;
        if (distanceToLanes(x, z).d < off - 0.8) continue;
        if (overlaps(x, z, rad)) continue;
        const tall = lane.id === "blue" ? 14 + r() * 26 : 9 + r() * 16;
        out.push({
          x,
          z,
          w,
          d,
          h: tall,
          // Local +z faces the lane.
          rot: Math.atan2(-n.x * side, -n.z * side),
          color: lane.stone[Math.floor(r() * lane.stone.length)],
          windows: lane.windows,
          facesLane: true,
        });
      }
    }
  }

  // District blocks: a loose grid between the lanes, lower than the lane fronts.
  for (let x = -100; x <= 100; x += 9) {
    for (let z = -100; z <= 100; z += 9) {
      const jx = x + (r() - 0.5) * 3;
      const jz = z + (r() - 0.5) * 3;
      const w = 6 + r() * 2;
      const d = 6 + r() * 2;
      const rad = Math.max(w, d) / 2;
      if (blocked(jx, jz, rad)) continue;
      const near = distanceToLanes(jx, jz);
      if (near.d < LANE_HALF + SIDEWALK + rad + 6) continue;
      if (overlaps(jx, jz, rad)) continue;
      const district = DISTRICTS.reduce((a, b) =>
        (a.center[0] - jx) ** 2 + (a.center[1] - jz) ** 2 <
        (b.center[0] - jx) ** 2 + (b.center[1] - jz) ** 2
          ? a
          : b,
      );
      const stone = district.stone;
      out.push({
        x: jx,
        z: jz,
        w,
        d,
        h: 6 + r() * 10,
        rot: 0,
        color: stone[Math.floor(r() * stone.length)],
        windows: PALETTE.windowWarm,
        facesLane: false,
      });
    }
  }
  return out;
}

/** A ring of far skyline towers past the map edge, tinted toward each lane's side. */
export function buildSkyline(seed = 5) {
  const r = rng(seed);
  const out: { x: number; z: number; w: number; h: number; color: string; spire: boolean }[] = [];
  for (let i = 0; i < 90; i++) {
    const a = (i / 90) * Math.PI * 2 + r() * 0.03;
    const dist = 175 + r() * 40;
    const x = Math.sin(a) * dist;
    const z = Math.cos(a) * dist;
    const color = x > 30 ? "#1e2a24" : x < -30 ? "#2c2620" : "#1e2430";
    out.push({ x, z, w: 10 + r() * 12, h: 40 + r() * 80, color, spire: r() > 0.75 });
  }
  return out;
}
