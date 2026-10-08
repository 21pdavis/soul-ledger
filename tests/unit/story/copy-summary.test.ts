import { describe, expect, it } from "vitest";
import { formatTopPercent, summaryRows, topStat } from "@/story/copy-summary";
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

describe("formatTopPercent", () => {
  it("keeps one decimal under 1% and rounds from 1% up", () => {
    expect(formatTopPercent(0.5)).toBe("Top 0.5%");
    expect(formatTopPercent(0.04)).toBe("Top 0.1%");
    expect(formatTopPercent(12.4)).toBe("Top 12%");
    expect(formatTopPercent(1)).toBe("Top 1%");
  });
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

  it("is omitted when the best stat is not notable (worse than top 50%)", () => {
    const story = fixtureStory({ mvp: null, percentiles: [pct("Kills", 62)] });
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
