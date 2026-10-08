import { describe, expect, it } from "vitest";
import {
  bestPercentile,
  formatLedgerDate,
  formatTopPercent,
  mainPercentileLine,
  matchesUnit,
  rosterVerdict,
} from "@/story/copy-slides-1-4";
import { fixtureStory } from "../../fixtures/story";

const base = fixtureStory().percentiles[0];
const pct = (metric: string, label: string, topPercent: number) => ({
  ...base,
  metric,
  label,
  topPercent,
});

describe("formatTopPercent", () => {
  it("keeps one decimal under 10 and drops a trailing .0", () => {
    expect(formatTopPercent(0.5)).toBe("0.5");
    expect(formatTopPercent(3.04)).toBe("3");
    expect(formatTopPercent(3.46)).toBe("3.5");
  });

  it("rounds to whole percent from 10 up", () => {
    expect(formatTopPercent(12.4)).toBe("12");
    expect(formatTopPercent(49.6)).toBe("50");
  });
});

describe("bestPercentile", () => {
  it("picks the lowest topPercent, the first on a tie", () => {
    const a = pct("a", "A", 20);
    const b = pct("b", "B", 5);
    const c = pct("c", "C", 5);
    expect(bestPercentile([a, b, c])).toBe(b);
  });

  it("is null for an empty list", () => {
    expect(bestPercentile([])).toBeNull();
  });
});

describe("mainPercentileLine", () => {
  const main = (percentiles: ReturnType<typeof pct>[]) => ({
    ...fixtureStory().main!,
    heroId: 1,
    percentiles,
  });

  it("uses the same-hero best entry and names the hero when main.percentiles is non-empty", () => {
    const line = mainPercentileLine(main([pct("a", "A", 30), pct("k", "Kills per match", 12)]), [
      pct("g", "Global", 1),
    ]);
    expect(line).toEqual({
      scope: "hero",
      text: "Top 12% of Infernus players",
      metric: "Kills per match",
    });
  });

  it("falls back to the best global entry, with no hero name, when main.percentiles is empty", () => {
    const line = mainPercentileLine(main([]), [pct("m", "Melee kills", 9), pct("g", "Global", 40)]);
    expect(line).toEqual({ scope: "global", text: "Top 9% of all players", metric: "Melee kills" });
    expect(line!.text).not.toContain("Infernus");
  });

  it("is null when both lists are empty", () => {
    expect(mainPercentileLine(main([]), [])).toBeNull();
  });
});

describe("rosterVerdict", () => {
  it("says one-trick for one-trick and flex otherwise", () => {
    expect(rosterVerdict("one-trick").title).toBe("One-trick");
    expect(rosterVerdict("flex").title).toBe("Flex");
  });

  it("keeps each blurb free of the other label's name", () => {
    expect(rosterVerdict("flex").blurb.toLowerCase()).not.toContain("one-trick");
    expect(rosterVerdict("one-trick").blurb.toLowerCase()).not.toContain("flex");
  });
});

describe("matchesUnit", () => {
  it("pluralises", () => {
    expect(matchesUnit(1)).toBe("match");
    expect(matchesUnit(0)).toBe("matches");
    expect(matchesUnit(120)).toBe("matches");
  });
});

describe("formatLedgerDate", () => {
  it("formats an ISO date in UTC", () => {
    expect(formatLedgerDate("2026-01-02T10:00:00.000Z")).toBe("Jan 2, 2026");
  });
});

describe("mainPercentileLine not-notable rule (best topPercent above 50)", () => {
  const withMain = (percentiles: ReturnType<typeof pct>[]) => ({
    ...fixtureStory().main!,
    percentiles,
  });

  it("keeps a claim at exactly 50", () => {
    expect(mainPercentileLine(withMain([pct("a", "A", 50)]), [])?.scope).toBe("hero");
  });

  it("goes neutral, with no percentile in the text, when the best same-hero entry is above 50", () => {
    const line = mainPercentileLine(withMain([pct("a", "A", 87), pct("b", "B", 64)]), [
      pct("g", "G", 1),
    ]);
    expect(line?.scope).toBe("neutral");
    expect(line?.text).not.toMatch(/\d/);
    expect(line?.metric).toBe("");
  });

  it("goes neutral when only a weak global entry exists", () => {
    const line = mainPercentileLine(withMain([]), [pct("g", "G", 51)]);
    expect(line?.scope).toBe("neutral");
  });

  it("is still null with nothing to rank", () => {
    expect(mainPercentileLine(withMain([]), [])).toBeNull();
  });
});
