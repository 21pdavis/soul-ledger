import * as THREE from "three";
import { binDeaths, hottestCell } from "@/story/death-bins";
import type { StoryData } from "@/story/types";
import { MID_BOSS, gameToWorld, lanePoint, stopPoint, type StopId, type Vec3 } from "./layout";

/** A camera position and the point it looks at. */
export interface Shot {
  pos: Vec3;
  look: Vec3;
}

/** A hero standing in the city: an art-card standee now, a posed model later (ADR 0068). */
export interface CastMember {
  heroId: number;
  pos: Vec3;
  /** Which way the standee faces, toward the slide's camera. */
  facing: number;
  scale?: number;
}

export interface TourPlan {
  shots: Shot[];
  cast: CastMember[];
  /** Where the reader dies most, if the story has deaths. */
  deathSpot: [number, number] | null;
}

const v = (p: THREE.Vector3): Vec3 => [p.x, p.y, p.z];

/** A street-level shot at a stop: back down the lane and to one side, looking at the stop. */
function streetShot(id: StopId, back = 16, side = 3, height = 3.2, lookUp = 2.5): Shot {
  const { p, t, n } = stopPoint(id);
  const pos = p.clone().addScaledVector(t, -back).addScaledVector(n, side).setY(height);
  return { pos: v(pos), look: v(p.clone().setY(lookUp)) };
}

/** Faces a point toward a camera position. */
const faceToward = (from: Vec3, to: Vec3) => Math.atan2(to[0] - from[0], to[2] - from[2]);

/** Spots `count` standees side by side across the lane at a stop. */
function lineUp(id: StopId, count: number, forward = 0): Vec3[] {
  const { p, t, n } = stopPoint(id);
  return Array.from({ length: count }, (_, i) => {
    const q = p
      .clone()
      .addScaledVector(t, forward)
      .addScaledVector(n, (i - (count - 1) / 2) * 2.6);
    return v(q);
  });
}

/**
 * The tour: one shot per slide, in story order. It swoops in over the Yellow lane and runs up it,
 * comes down the Blue lane through the middle of the map, stops wherever the reader dies most,
 * and ends up the Green lane. The cast comes from the reader's stats.
 */
export function planTour(story: StoryData): TourPlan {
  const main = story.main?.heroId ?? story.roster?.topHeroes[0]?.heroId ?? 1;
  const roster = story.roster?.topHeroes.map((h) => h.heroId) ?? [main];
  const worst = story.roast?.worstMatch?.heroId ?? main;
  const mvpHero = story.mvp && "heroId" in story.mvp ? story.mvp.heroId : main;

  const bins = binDeaths(story.roast?.deathPositions ?? []);
  const hot = hottestCell(bins);
  const deathSpot: [number, number] | null = hot
    ? gameToWorld(
        -bins.bound + ((hot.col + 0.5) / bins.cols) * 2 * bins.bound,
        -bins.bound + ((hot.row + 0.5) / bins.rows) * 2 * bins.bound,
      )
    : null;

  const shots: Shot[] = [];
  const cast: CastMember[] = [];
  const stand = (heroId: number, pos: Vec3, shot: Shot, scale = 1) =>
    cast.push({ heroId, pos, facing: faceToward(pos, shot.pos), scale });

  // Yellow lane first, south to north.
  // 1 intro: swoop in over the south end of the Yellow lane.
  shots.push({ pos: [-84, 62, 100], look: [-50, 0, 46] });

  // 2 main: your main among the Old Fairfax Factories.
  const ff = streetShot("fairfax", 14, 3, 2.6, 4);
  shots.push(ff);
  stand(main, lineUp("fairfax", 1, -2)[0], ff, 1.25);

  // 3 roster: your top heroes lined up on the Seaport dock.
  const sea = streetShot("seaport", 15, -2, 2.8, 2.4);
  shots.push(sea);
  lineUp("seaport", Math.min(roster.length, 5), -3).forEach((p, i) => stand(roster[i], p, sea));

  // 4 scavenger: crates and jackpots outside the Stock Exchange.
  const se = streetShot("stockExchange", 14, 3, 3.2, 3);
  shots.push(se);
  stand(main, lineUp("stockExchange", 1, -2)[0], se);

  // Then the Blue lane, north to south.
  // 5 kills: your main on the ritual circle in Uptown.
  const uptown = streetShot("uptown", 13, 2.5, 2.6, 2.6);
  shots.push(uptown);
  stand(main, v(stopPoint("uptown").p), uptown, 1.15);

  // 6 precision: under the elevated tracks in Times Square.
  const ts = streetShot("timesSquare", 15, -2, 2.8, 3);
  shots.push(ts);
  stand(main, lineUp("timesSquare", 1, -3)[0], ts);

  // 7 mid boss: the pit in the middle of the map.
  const mb: Shot = {
    pos: [MID_BOSS[0] + 4, 22, MID_BOSS[1] + 17],
    look: [MID_BOSS[0], 1, MID_BOSS[1]],
  };
  shots.push(mb);
  stand(main, [MID_BOSS[0] + 5, 0, MID_BOSS[1] + 5], mb);

  // 8 roast: wherever you die most, with the hero of your worst match.
  const fallback = lanePoint("blue", 0.3).p;
  const [dx, dz] = deathSpot ?? [fallback.x, fallback.z];
  const roast: Shot = { pos: [dx + 5, 20, dz + 13], look: [dx, 1, dz] };
  shots.push(roast);
  stand(worst, [dx + 1.5, 0, dz], roast);

  // Last, the Green lane, south to north.
  // 9 rank: look up the Hangman's Elm in Central Park. The Elm stands at the stop's local
  // (-11, 0, -3); local +x is -n and local +z is t.
  const cp = stopPoint("centralPark");
  const elm = cp.p.clone().addScaledVector(cp.n, 11).addScaledVector(cp.t, -3).setY(12);
  shots.push({
    pos: v(cp.p.clone().addScaledVector(cp.t, -13).addScaledVector(cp.n, -2).setY(2)),
    look: v(elm),
  });

  // 10 mvp: at the gates of Umbria University.
  const um = streetShot("umbria", 14, -2, 2.6, 4);
  shots.push(um);
  stand(mvpHero, lineUp("umbria", 1, 2)[0], um, 1.2);

  // 11 summary: rise out over the north end of the Green lane, the whole map below.
  shots.push({ pos: [70, 130, -110], look: [0, 0, 0] });

  return { shots, cast, deathSpot };
}
