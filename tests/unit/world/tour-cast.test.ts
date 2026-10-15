import { describe, expect, it } from "vitest";
import { planTour } from "@/components/world/city/tour";
import type { StoryData } from "@/story/types";
import { fixtureStory } from "../../fixtures/story";

const hero = (heroId: number) => ({ heroId, matches: 5, winRate: 0.5, recent: null });
const withRoster = (ids: number[], over: Partial<StoryData> = {}) => {
  const base = fixtureStory();
  return fixtureStory({ roster: { ...base.roster!, topHeroes: ids.map(hero) }, ...over });
};

describe("the cast follows the reader's stats", () => {
  it("stands the main hero at every main-hero slide", () => {
    const cast = planTour(fixtureStory()).cast;
    // main, roster, scavenger, precision, mid boss, rank and mvp all feature hero 1 here.
    expect(cast.filter((c) => c.heroId === 1).length).toBeGreaterThanOrEqual(5);
  });

  it("lines up the top heroes at the Seaport, in order, up to five", () => {
    const ids = planTour(withRoster([1, 2, 3, 4, 6, 7])).cast.map((c) => c.heroId);
    expect(ids.slice(1, 6)).toEqual([1, 2, 3, 4, 6]);
    expect(ids).not.toContain(7);
  });

  it("spaces the line-up so no two roster standees overlap", () => {
    const cast = planTour(withRoster([1, 2, 3, 4, 6])).cast.slice(1, 6);
    for (let i = 1; i < cast.length; i++) {
      const [ax, , az] = cast[i - 1].pos;
      const [bx, , bz] = cast[i].pos;
      expect(Math.hypot(ax - bx, az - bz)).toBeGreaterThan(2);
    }
  });

  it("does not stand the same hero twice in the line-up when the roster repeats an id", () => {
    const lineup = planTour(withRoster([2, 2, 3])).cast.slice(1, 3);
    expect(lineup.map((c) => c.heroId)).toEqual([2, 3]);
  });

  it("copes with a one-hero roster", () => {
    const plan = planTour(withRoster([2]));
    expect(plan.cast.every((c) => Number.isFinite(c.pos[0]))).toBe(true);
    expect(plan.cast.filter((c) => c.heroId === 2).length).toBeGreaterThan(0);
  });

  it("falls back to the main hero when the roster list is empty", () => {
    expect(planTour(withRoster([])).cast).toEqual(planTour(withRoster([1])).cast);
  });

  it("works with no main and no roster, standing hero 1", () => {
    const plan = planTour(fixtureStory({ main: null, roster: undefined }));
    expect(plan.cast.length).toBeGreaterThan(0);
    expect(plan.duel.a.heroId).toBe(1);
  });

  it("takes the main from the roster's first hero when there is no main", () => {
    expect(planTour(withRoster([6, 2], { main: null })).duel.a.heroId).toBe(6);
  });

  it("stands the MVP hero, and the main when the MVP is not about a hero", () => {
    const base = fixtureStory();
    const mvp = { ...base.mvp!, scope: "hero", heroId: 13 } as StoryData["mvp"];
    expect(planTour(fixtureStory({ mvp })).cast.at(-1)!.heroId).toBe(13);
    const general = { ...base.mvp!, scope: "overall" } as unknown as StoryData["mvp"];
    expect(planTour(fixtureStory({ mvp: general })).cast.at(-1)!.heroId).toBe(1);
  });

  it("keeps an unknown hero id as a normal cast member (the art falls back later)", () => {
    const plan = planTour(withRoster([9999, 2], { main: null }));
    expect(plan.cast.some((c) => c.heroId === 9999)).toBe(true);
  });
});
