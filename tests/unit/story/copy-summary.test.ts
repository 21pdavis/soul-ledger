import { describe, expect, it } from "vitest";
import { summaryRows, topStat } from "@/story/copy-summary";
import { fixtureStory } from "../../fixtures/story";

const pct = (label: string, topPercent: number) => ({
  metric: label,
  label,
  value: 1,
  percentile: 100 - topPercent,
  topPercent,
  higherIsBetter: true,
  weight: 1,
});

describe("topStat", () => {
  it("uses the MVP stat, with same-hero phrasing for the hero scope", () => {
    expect(topStat(fixtureStory())).toEqual({
      label: "Melee kills",
      value: "Top 0.5%",
      note: "of Infernus players",
    });
  });

  it("uses global phrasing for a global MVP", () => {
    const story = fixtureStory({ mvp: { ...pct("Melee kills", 3), scope: "global" } });
    expect(topStat(story)).toEqual({
      label: "Melee kills",
      value: "Top 3%",
      note: "of all players",
    });
  });

  it("falls back to the best global percentile when there is no MVP", () => {
    const story = fixtureStory({
      mvp: null,
      percentiles: [pct("Kills", 30), pct("Assists", 8), pct("Deaths", 40)],
    });
    expect(topStat(story)).toEqual({ label: "Assists", value: "Top 8%", note: "of all players" });
  });

  it("is omitted when there is no MVP and no percentiles", () => {
    expect(topStat(fixtureStory({ mvp: null, percentiles: [] }))).toBeNull();
  });

  it("uses the shared rounding: one decimal under 10%, whole percent from 10", () => {
    const story = fixtureStory({ mvp: null, percentiles: [pct("Kills", 3.4)] });
    expect(topStat(story)?.value).toBe("Top 3.4%");
    expect(topStat(fixtureStory({ mvp: null, percentiles: [pct("Kills", 12.4)] }))?.value).toBe(
      "Top 12%",
    );
  });

  it("a hero MVP that is not notable (62) gives way to a good global stat, with global phrasing", () => {
    const story = fixtureStory({
      mvp: { ...pct("Kills", 62), scope: "hero", heroId: 1 },
      percentiles: [pct("Assists", 8), pct("Deaths", 40)],
    });
    expect(topStat(story)).toEqual({ label: "Assists", value: "Top 8%", note: "of all players" });
  });

  it("when nothing is notable, still shows the best global stat, neutrally (no hero phrasing)", () => {
    const story = fixtureStory({
      mvp: { ...pct("Kills", 62), scope: "hero", heroId: 1 },
      percentiles: [pct("Assists", 55), pct("Deaths", 70)],
    });
    expect(topStat(story)).toEqual({ label: "Assists", value: "Top 55%", note: "of all players" });
  });

  it("is omitted only when there is nothing to show at all", () => {
    const story = fixtureStory({
      mvp: { ...pct("Kills", 62), scope: "hero", heroId: 1 },
      percentiles: [],
    });
    expect(topStat(story)).toBeNull();
  });
});

describe("summaryRows", () => {
  it("lists matches, hours, main hero, top stat and rank in that order", () => {
    const rows = summaryRows(fixtureStory());
    expect(rows.map((r) => [r.key, r.label, r.value])).toEqual([
      ["matches", "Matches", "120"],
      ["hours", "Hours played", "85"],
      ["main", "Main hero", "Infernus"],
      ["topStat", "Melee kills", "Top 0.5%"],
      ["rank", "Current rank", "Oracle 1"],
    ]);
  });

  it("formats hours the way the intro does (one decimal under 10)", () => {
    const story = fixtureStory();
    story.intro.hoursPlayed = 0.2;
    expect(summaryRows(story).find((r) => r.key === "hours")?.value).toBe("0.2");
  });

  it("omits the top stat and the rank when the story has neither", () => {
    const story = fixtureStory({ mvp: null, percentiles: [] });
    story.rank.current = null;
    expect(summaryRows(story).map((r) => r.key)).toEqual(["matches", "hours", "main"]);
  });

  it("omits the main hero if there is none", () => {
    const rows = summaryRows(fixtureStory({ main: null }));
    expect(rows.map((r) => r.key)).not.toContain("main");
  });
});
