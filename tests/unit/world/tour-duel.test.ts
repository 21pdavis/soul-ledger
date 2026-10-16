import { describe, expect, it } from "vitest";
import { planTour } from "@/components/world/city/tour";
import type { StoryData } from "@/story/types";
import { fixtureStory } from "../../fixtures/story";

const mainOf = (s: StoryData) => s.main!.heroId;

describe("the Uptown duel (ADR 0068)", () => {
  it("pits the reader's main against their real nemesis", () => {
    const base = fixtureStory();
    const story = fixtureStory({ nemesis: { heroId: 42, kills: 9 } });
    const duel = planTour(story).duel;
    expect(duel.a.heroId).toBe(mainOf(base));
    expect(duel.b.heroId).toBe(42);
  });

  it("falls back to a stock rival when no killer is known", () => {
    const story = fixtureStory({ nemesis: null });
    const duel = planTour(story).duel;
    expect(duel.b.heroId).not.toBe(mainOf(story));
    expect(duel.b.heroId).toBe(13);
  });

  it("still renders a story saved before the field existed", () => {
    const old = fixtureStory() as Partial<StoryData>;
    delete old.nemesis;
    expect(planTour(old as StoryData).duel.b.heroId).toBe(13);
  });

  it("never duels the main against themself, even when they are their own top killer", () => {
    const base = fixtureStory();
    const story = fixtureStory({ nemesis: { heroId: mainOf(base), kills: 5 } });
    const duel = planTour(story).duel;
    expect(duel.b.heroId).not.toBe(mainOf(base));
  });
});
