import * as THREE from "three";
import { binDeaths, hottestCell, type DeathBins } from "@/story/death-bins";
import type { StoryData } from "@/story/types";
import {
  gameToWorld,
  laneById,
  lanePoint,
  stopPoint,
  type LaneId,
  type StopId,
  type Vec3,
} from "./layout";

/**
 * On desktop, which side of the screen each slide's card sits on (story order). The camera frames
 * its scene in the open space on the other side. Zig-zags so the scroll down the stack weaves.
 */
export type CardSide = "left" | "right";
export const CARD_SIDES: CardSide[] = [
  "left", // intro
  "right", // main
  "left", // roster
  "right", // scavenger
  "left", // kills
  "right", // precision
  "left", // mid boss
  "right", // roast
  "left", // rank
  "right", // mvp
  "left", // summary
];

/** The height the camera cruises at along the lanes: below the rooftops, above the heroes. */
export const CRUISE_HEIGHT = 4.6;

/**
 * The camera's route: up the Yellow lane, across in front of the north base, down the Blue lane,
 * across the south base and up the Green lane. All at cruise height, so the tour stays level.
 */
function buildRoute() {
  const pts: THREE.Vector3[] = [];
  const along = (id: LaneId, from: number, to: number) => {
    const c = laneById(id).curve;
    const n = 60;
    for (let i = 0; i <= n; i++) {
      const p = c.getPointAt(from + ((to - from) * i) / n);
      pts.push(new THREE.Vector3(p.x, CRUISE_HEIGHT, p.z));
    }
  };
  along("yellow", 0.06, 0.93);
  along("blue", 0.93, 0.07);
  along("green", 0.07, 0.94);
  return new THREE.CatmullRomCurve3(pts, false, "centripetal", 0.5);
}

export const ROUTE = buildRoute();
export const ROUTE_LENGTH = ROUTE.getLength();
const ROUTE_SAMPLES = ROUTE.getSpacedPoints(1200);

/** The camera position at a distance along the route. */
export function routeAt(s: number, out = new THREE.Vector3()) {
  return ROUTE.getPointAt(THREE.MathUtils.clamp(s / ROUTE_LENGTH, 0, 1), out);
}

/** The route's direction at a distance along it, flat. */
export function routeTangent(s: number, out = new THREE.Vector3()) {
  return ROUTE.getTangentAt(THREE.MathUtils.clamp(s / ROUTE_LENGTH, 0, 1), out)
    .setY(0)
    .normalize();
}

/** The distance along the route nearest a point (ignoring height). */
function routeNear(p: THREE.Vector3): number {
  let best = Infinity;
  let at = 0;
  ROUTE_SAMPLES.forEach((q, i) => {
    const d = (q.x - p.x) ** 2 + (q.z - p.z) ** 2;
    if (d < best) {
      best = d;
      at = i;
    }
  });
  return (at / (ROUTE_SAMPLES.length - 1)) * ROUTE_LENGTH;
}

/** Points along the straight hops the route takes between lanes; the city keeps them clear. */
export function routeConnectors(): [number, number][] {
  const out: [number, number][] = [];
  for (const [a, b] of [
    [lanePoint("yellow", 0.93).p, lanePoint("blue", 0.93).p],
    [lanePoint("blue", 0.07).p, lanePoint("green", 0.07).p],
  ]) {
    for (let i = 0; i <= 12; i++) {
      out.push([a.x + ((b.x - a.x) * i) / 12, a.z + ((b.z - a.z) * i) / 12]);
    }
  }
  return out;
}

/** A shot on the route (the camera flies along the lanes to it) or a free one (it glides there). */
export type Shot =
  { kind: "route"; s: number; look: Vec3 } | { kind: "free"; pos: Vec3; look: Vec3 };

export function shotPosition(shot: Shot, out = new THREE.Vector3()) {
  return shot.kind === "route" ? routeAt(shot.s, out) : out.set(...shot.pos);
}

/** A hero standing in the city: an art-card standee now, a posed model later (ADR 0068). */
export interface CastMember {
  heroId: number;
  pos: Vec3;
  /** Which way the standee faces. */
  facing: number;
  scale?: number;
  /** Mid-jump: a dust ring is drawn on the ground below. */
  airborne?: boolean;
}

export interface Duel {
  a: CastMember;
  b: CastMember;
  /** Where the two attacks meet. */
  clash: Vec3;
}

export interface TourPlan {
  shots: Shot[];
  cast: CastMember[];
  duel: Duel;
  /** The precision slide: where your main shoots from, and the trooper they hit. */
  shot: { from: Vec3; target: Vec3 };
  deaths: DeathBins;
  /** Where the reader dies most, in world x/z, if the story has deaths. */
  deathSpot: [number, number] | null;
  /** The sewer pit under Times Square, where the mid boss lives. */
  pit: Vec3;
}

const v = (p: THREE.Vector3): Vec3 => [p.x, p.y, p.z];
const faceToward = (from: Vec3, to: THREE.Vector3) => Math.atan2(to.x - from[0], to.z - from[2]);

/** A stop's point moved along its lane (`forward`) and across it (`across`, + is lane right). */
function atStop(id: StopId, forward = 0, across = 0, y = 0): Vec3 {
  const { p, t, n } = stopPoint(id);
  return v(p.clone().addScaledVector(t, forward).addScaledVector(n, across).setY(y));
}

/** Stock duel opponents until real nemesis data arrives (ADR 0068): main hero id to rival id. */
const STOCK_RIVALS: Record<number, number> = { 1: 13, 13: 1, 2: 3, 3: 2, 4: 7, 7: 4, 6: 12, 12: 6 };

/** The sewer pit's floor height, well below the street. */
export const PIT_FLOOR = -18;

/**
 * One shot per slide in story order. The camera flies the route between lane stops, so it stays
 * level and weaves; only the opening, the mid boss pit, the death map and the summary leave it.
 * The cast comes from the reader's stats.
 */
export function planTour(story: StoryData): TourPlan {
  const main = story.main?.heroId ?? story.roster?.topHeroes[0]?.heroId ?? 1;
  const roster = story.roster?.topHeroes.map((h) => h.heroId) ?? [main];
  const mvpHero = story.mvp && "heroId" in story.mvp ? story.mvp.heroId : main;
  const rival = STOCK_RIVALS[main] ?? (main === 13 ? 1 : 13);

  const deaths = binDeaths(story.roast?.deathPositions ?? []);
  const hot = hottestCell(deaths);
  const deathSpot: [number, number] | null = hot
    ? gameToWorld(
        -deaths.bound + ((hot.col + 0.5) / deaths.cols) * 2 * deaths.bound,
        -deaths.bound + ((hot.row + 0.5) / deaths.rows) * 2 * deaths.bound,
      )
    : null;

  const shots: Shot[] = [];
  const cast: CastMember[] = [];
  const camAt = new THREE.Vector3();
  /** A route shot `back` units before a stop, looking at the stop. */
  const routeShot = (id: StopId, back: number, lookY = 2.6, lookFwd = 0): Shot => {
    const s = routeNear(stopPoint(id).p) - back;
    return { kind: "route", s, look: atStop(id, lookFwd, 0, lookY) };
  };
  const stand = (heroId: number, pos: Vec3, shot: Shot, extra: Partial<CastMember> = {}) =>
    cast.push({ heroId, pos, facing: faceToward(pos, shotPosition(shot, camAt)), ...extra });

  // 1 intro: high over the south end of the Yellow lane.
  shots.push({ kind: "free", pos: [-80, 52, 104], look: [-46, 0, 52] });

  // 2 main: your main among the Old Fairfax Factories.
  const ff = routeShot("fairfax", 14, 3);
  shots.push(ff);
  stand(main, atStop("fairfax", -1), ff, { scale: 1.25 });

  // 3 roster: your top heroes lined up under the Seaport trestle, centred on the lane.
  const sea = routeShot("seaport", 19, 2.6, -2);
  shots.push(sea);
  const count = Math.min(roster.length, 5);
  for (let i = 0; i < count; i++) {
    stand(roster[i], atStop("seaport", -2, (i - (count - 1) / 2) * 2.5), sea);
  }

  // 4 scavenger: crates and jackpots outside the Stock Exchange.
  const se = routeShot("stockExchange", 13, 2.4, -1.5);
  shots.push(se);
  stand(main, atStop("stockExchange", -1.5), se);

  // 5 kills: a duel in Uptown, your main against your nemesis, a Guardian watching.
  const up = routeShot("uptown", 12, 2.4, -4);
  shots.push(up);
  const camUp = shotPosition(up, new THREE.Vector3());
  const aPos = atStop("uptown", -4.5, -2.4);
  const bPos = atStop("uptown", -3.5, 2.4);
  // Facing each other, turned partly toward the camera so both cards read.
  const toward = (from: Vec3, to: Vec3) => Math.atan2(to[0] - from[0], to[2] - from[2]);
  const blend = (a: number, b: number, k: number) =>
    a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * k;
  const duel: Duel = {
    a: {
      heroId: main,
      pos: aPos,
      facing: blend(toward(aPos, bPos), faceToward(aPos, camUp), 0.6),
      scale: 1.1,
    },
    b: {
      heroId: rival,
      pos: bPos,
      facing: blend(toward(bPos, aPos), faceToward(bPos, camUp), 0.6),
      scale: 1.1,
    },
    clash: atStop("uptown", -4, 0, 1.9),
  };

  // 6 precision: your main on the Times Square overpass, picking off a trooper down the street.
  const ts = routeShot("timesSquare", 17, 7.5, -1);
  shots.push(ts);
  const from = atStop("timesSquare", 0, 3.2, 7.45);
  const target = atStop("timesSquare", -14, -1.2, 0);
  stand(main, from, ts);

  // 7 mid boss: down in the sewer pit under Times Square.
  const p = stopPoint("timesSquare").p;
  const pit: Vec3 = [p.x, PIT_FLOOR, p.z];
  const pitShot: Shot = {
    kind: "free",
    pos: [p.x + 14, PIT_FLOOR + 7, p.z + 14],
    look: [p.x - 1, PIT_FLOOR + 5.5, p.z - 1],
  };
  shots.push(pitShot);
  stand(main, [p.x - 0.3, PIT_FLOOR, p.z + 4.5], pitShot);

  // 8 roast: straight overhead, your deaths projected onto the city.
  shots.push({ kind: "free", pos: [0, 250, 0.01], look: [0, 0, 0] });

  // 9 rank: your main mid-jump between the Downtown towers, the camera looking up.
  const dt = routeShot("downtown", 9, 12, 2);
  shots.push(dt);
  stand(main, atStop("downtown", 2, 0, 9), dt, { scale: 1.2, airborne: true });

  // 10 mvp: under the Hangman's Elm in Central Park.
  const cp = routeShot("centralPark", 15, 4);
  shots.push(cp);
  stand(mvpHero, atStop("centralPark", -3), cp, { scale: 1.15 });

  // 11 summary: rise far out over the north end of the Green lane, the whole map below.
  shots.push({ kind: "free", pos: [95, 215, -205], look: [0, 0, -6] });

  return { shots, cast, duel, shot: { from, target }, deaths, deathSpot, pit };
}
