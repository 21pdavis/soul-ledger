import { describe, expect, it } from "vitest";
import * as THREE from "three";
import {
  CARD_SIDES,
  PIT_FLOOR,
  planTour,
  shotPosition,
  type Shot,
} from "@/components/world/city/tour";
import { stopPoint } from "@/components/world/city/layout";
import { SLIDES, SLIDE_COUNT } from "@/story/copy";
import { fixtureStory } from "../../fixtures/story";

// The story-following camera (m3-plan): each slide maps to one shot, and the shot looks at the
// thing that slide is about.

type Id = (typeof SLIDES)[number]["id"];
const slideIndex = (id: Id) => SLIDES.findIndex((s) => s.id === id);
const dist = (a: readonly number[], b: readonly number[]) =>
  new THREE.Vector3(a[0], a[1], a[2]).distanceTo(new THREE.Vector3(b[0], b[1], b[2]));
const shotOf = (id: Id): Shot => planTour(fixtureStory()).shots[slideIndex(id)];

describe("the slide to shot map", () => {
  it("has exactly one shot per story slide, and a card side for each", () => {
    expect(planTour(fixtureStory()).shots).toHaveLength(SLIDE_COUNT);
    expect(CARD_SIDES).toHaveLength(SLIDE_COUNT);
  });

  it("zig-zags the card sides, starting on the left", () => {
    CARD_SIDES.forEach((side, i) => expect(side).toBe(i % 2 === 0 ? "left" : "right"));
  });

  it("gives every slide a finite position and look target", () => {
    for (const shot of planTour(fixtureStory()).shots) {
      for (const n of [...shotPosition(shot).toArray(), ...shot.look]) {
        expect(Number.isFinite(n)).toBe(true);
      }
    }
  });

  it("opens high above the city, off the route", () => {
    const shot = shotOf("intro");
    expect(shot.kind).toBe("free");
    expect(shotPosition(shot).y).toBeGreaterThan(30);
  });

  it("looks at the duel clash point on the kills slide", () => {
    const plan = planTour(fixtureStory());
    expect(dist(plan.shots[slideIndex("kills")].look, plan.duel.clash)).toBeLessThan(1);
  });

  it("looks at the shooter's overpass on the precision slide, with the trooper down the street", () => {
    const plan = planTour(fixtureStory());
    const look = plan.shots[slideIndex("precision")].look;
    expect(dist(look, plan.shot.from)).toBeLessThan(5);
    expect(dist(look, plan.shot.target)).toBeLessThan(20);
    expect(plan.shot.from[1]).toBeGreaterThan(plan.shot.target[1]);
  });

  it("drops into the pit under Times Square on the mid boss slide", () => {
    const plan = planTour(fixtureStory());
    const shot = plan.shots[slideIndex("midBoss")];
    expect(shot.kind).toBe("free");
    expect(shotPosition(shot).y).toBeLessThan(0);
    expect(dist(shot.look, plan.pit)).toBeLessThan(10);
    expect(plan.pit[0]).toBeCloseTo(stopPoint("timesSquare").p.x);
    expect(plan.pit[1]).toBe(PIT_FLOOR);
  });

  it("goes straight overhead on the death map, whether or not there are deaths", () => {
    for (const story of [fixtureStory(), fixtureStory({ roast: undefined })]) {
      const shot = planTour(story).shots[slideIndex("roast")];
      expect(shotPosition(shot).y).toBeGreaterThan(150);
      expect(shotPosition(shot).x).toBeCloseTo(shot.look[0], 1);
    }
  });

  it("finds a death spot for the projection only when the reader has deaths", () => {
    expect(planTour(fixtureStory()).deathSpot).not.toBeNull();
    expect(planTour(fixtureStory({ roast: undefined })).deathSpot).toBeNull();
  });

  it("rises over the whole map on the summary", () => {
    const shot = shotOf("summary");
    expect(shot.kind).toBe("free");
    expect(shotPosition(shot).y).toBeGreaterThan(150);
  });

  it("keeps the street-level slides on the route", () => {
    for (const id of [
      "main",
      "roster",
      "scavenger",
      "kills",
      "precision",
      "rank",
      "mvp",
    ] as const) {
      expect(shotOf(id).kind, id).toBe("route");
    }
  });
});
