import { describe, expect, it } from "vitest";
import { headlineFor } from "@/story/copy";
import {
  MVP_FALLBACK_HEADLINE,
  MVP_NONE_HEADLINE,
  RANK_EMPTY_LINE,
  avgMatchMinutes,
  deathsLabel,
  formatTopPercent,
  hotspotLine,
  mvpCopy,
  mvpFlavor,
  noDeathMapLine,
  rankSummary,
  roastHeadline,
  typicalUnspentSouls,
  unspentSoulsLine,
  worstMatchLine,
} from "@/story/copy-slides-8-10";
import type { JourneyPoint } from "@/story/rank-journey";
import { fixtureStory } from "../../fixtures/story";

describe("roast copy", () => {
  it("keeps the fixed headline unless there is nothing to roast", () => {
    expect(roastHeadline({ deaths: 1100 })).toBe(headlineFor("roast"));
    expect(roastHeadline({ deaths: 1 })).toBe(headlineFor("roast"));
    expect(roastHeadline({ deaths: 0 })).not.toBe(headlineFor("roast"));
  });

  it("names the hottest cell's count, in the singular for one", () => {
    expect(hotspotLine(7)).toBe("You died here 7 times");
    expect(hotspotLine(1)).toBe("You died here 1 time");
  });

  it("has friendly copy when there are no death positions", () => {
    expect(noDeathMapLine(0)).toMatch(/not a single death/i);
    expect(noDeathMapLine(30)).toMatch(/where/i);
    expect(noDeathMapLine(30)).not.toBe(noDeathMapLine(0));
  });

  it("labels the death total and the worst match", () => {
    expect(deathsLabel(1)).toBe("death in total");
    expect(deathsLabel(1100)).toBe("deaths in total");
    expect(worstMatchLine({ deaths: 21, heroName: "Infernus" })).toBe(
      "Worst night: 21 deaths as Infernus",
    );
    expect(worstMatchLine({ deaths: 1, heroName: "Seven" })).toBe("Worst night: 1 death as Seven");
  });
});

describe("unspent souls copy", () => {
  it("is souls x minutes, so a typical stash is the average divided by the average match length", () => {
    // 90,000 soul-minutes over a 36-minute match is 2,500 souls held on average.
    expect(typicalUnspentSouls(90_000, 36)).toBe(2500);
    // Rounded to the nearest 100.
    expect(typicalUnspentSouls(84_800, 35)).toBe(2400);
  });

  it("gives no figure when it cannot be worked out", () => {
    expect(typicalUnspentSouls(0, 30)).toBeNull();
    expect(typicalUnspentSouls(90_000, 0)).toBeNull();
    expect(typicalUnspentSouls(Number.NaN, 30)).toBeNull();
  });

  it("states the stash in souls with a thousands separator", () => {
    expect(unspentSoulsLine(90_000, 36)).toBe(
      "In a typical match you sat on about 2,500 unspent souls.",
    );
  });

  it("praises a player who spends, and shows no number", () => {
    const line = unspentSoulsLine(2_000, 36);
    expect(line).not.toMatch(/\d/);
    expect(line).toMatch(/spend/i);
  });

  it("falls back to a neutral sentence with no number or unit", () => {
    const line = unspentSoulsLine(0, 36);
    expect(line).not.toMatch(/\d/);
    expect(line).not.toMatch(/minute/i);
    expect(unspentSoulsLine(90_000, 0)).toBe(line);
  });

  it("works out the average match length in minutes", () => {
    expect(avgMatchMinutes(3, 5)).toBe(36);
    expect(avgMatchMinutes(3, 0)).toBe(0);
  });
});

const pt = (i: number, badge: number): JourneyPoint => ({
  at: `2026-0${i + 1}-01T00:00:00.000Z`,
  matchId: i,
  badge,
  tier: Math.floor(badge / 10),
  subrank: badge % 10,
});

describe("rankSummary", () => {
  it("is friendly when there is no journey or no current rank", () => {
    expect(rankSummary([], null)).toEqual({ kind: "empty", text: RANK_EMPTY_LINE });
    expect(rankSummary([pt(0, 41)], null).kind).toBe("empty");
    expect(rankSummary([], pt(0, 41)).kind).toBe("empty");
  });

  it("notes a single point without describing a climb", () => {
    const s = rankSummary([pt(0, 81)], pt(0, 81));
    expect(s.kind).toBe("single");
    expect(s.text).toContain("Oracle 1");
  });

  it("describes a climb from the first to the current rank", () => {
    const j = [pt(0, 31), pt(1, 62), pt(2, 81)];
    const s = rankSummary(j, j[2]);
    expect(s.kind).toBe("climbed");
    expect(s.text).toContain("Acolyte 1");
    expect(s.text).toContain("Oracle 1");
  });

  it("mentions a higher peak when the player has slipped back from it", () => {
    const j = [pt(0, 41), pt(1, 91), pt(2, 62)];
    const s = rankSummary(j, j[2]);
    expect(s.kind).toBe("climbed");
    expect(s.text).toContain("Phantom 1");
    expect(s.text).toContain("Ritualist 2");
  });

  it("describes ending below where the journey started", () => {
    const j = [pt(0, 81), pt(1, 91), pt(2, 62)];
    const s = rankSummary(j, j[2]);
    expect(s.kind).toBe("fell");
    expect(s.text).toContain("Oracle 1");
    expect(s.text).toContain("Ritualist 2");
    expect(s.text).toContain("Phantom 1");
  });

  it("describes holding steady", () => {
    const j = [pt(0, 62), pt(1, 62)];
    expect(rankSummary(j, j[1]).kind).toBe("held");
  });

  it("uses the fallback name for an unknown tier", () => {
    const j = [pt(0, 41), pt(1, 992)];
    j[1].tier = 99;
    j[1].subrank = 2;
    expect(rankSummary(j, j[1]).text).toContain("Tier 99 · 2");
  });
});

describe("mvp copy", () => {
  const pct = (metric: string, label: string, topPercent: number) => ({
    metric,
    label,
    value: 10,
    percentile: 100 - topPercent,
    topPercent,
    higherIsBetter: true,
    weight: 1,
  });

  it("formats top percent compactly", () => {
    expect(formatTopPercent(0.5)).toBe("0.5");
    expect(formatTopPercent(0)).toBe("0.1");
    expect(formatTopPercent(3)).toBe("3");
    expect(formatTopPercent(4.24)).toBe("4.2");
    expect(formatTopPercent(12.6)).toBe("13");
    expect(formatTopPercent(50)).toBe("50");
  });

  it("uses same-hero phrasing with the hero name for the hero scope", () => {
    const c = mvpCopy(fixtureStory({ mvp: { ...pct("melee", "Melee kills", 0.5), scope: "hero", heroId: 1 } }));
    expect(c).toMatchObject({
      kind: "hero",
      headline: headlineFor("mvp"),
      label: "Melee kills",
      topPercent: "0.5",
      scopeLine: "of Infernus players",
    });
  });

  it("never mentions a hero for the global scope", () => {
    const c = mvpCopy(fixtureStory({ mvp: { ...pct("kills", "Kills", 4), scope: "global" } }));
    expect(c).toMatchObject({
      kind: "global",
      headline: headlineFor("mvp"),
      label: "Kills",
      topPercent: "4",
      scopeLine: "of all players",
    });
    expect(JSON.stringify(c)).not.toMatch(/Infernus|Hero #/);
  });

  it("falls back to the best global stat with neutral copy when the best is above 50", () => {
    const c = mvpCopy(
      fixtureStory({
        mvp: { ...pct("deaths", "Deaths", 61), scope: "hero", heroId: 1 },
        percentiles: [pct("kills", "Kills", 72), pct("assists", "Assists", 58), pct("kda", "KDA", 90)],
      }),
    );
    expect(c).toMatchObject({
      kind: "fallback",
      headline: MVP_FALLBACK_HEADLINE,
      label: "Assists",
      topPercent: "58",
      scopeLine: "of all players",
    });
    expect(JSON.stringify(c)).not.toMatch(/Infernus|Hero #/);
  });

  it("treats exactly 50 as notable", () => {
    const c = mvpCopy(fixtureStory({ mvp: { ...pct("kills", "Kills", 50), scope: "global" } }));
    expect(c.kind).toBe("global");
  });

  it("has its own friendly copy when mvp is null", () => {
    const c = mvpCopy(fixtureStory({ mvp: null, percentiles: [] }));
    expect(c.kind).toBe("none");
    expect(c.headline).toBe(MVP_NONE_HEADLINE);
    expect(c.line).toMatch(/matches/i);
  });

  it("has the friendly copy too when the fallback has no global stat to show", () => {
    const c = mvpCopy(
      fixtureStory({ mvp: { ...pct("kills", "Kills", 80), scope: "global" }, percentiles: [] }),
    );
    expect(c.kind).toBe("none");
  });

  it("picks a flavour line by how rare the stat is", () => {
    expect(mvpFlavor(0.5)).not.toBe(mvpFlavor(5));
    expect(mvpFlavor(5)).not.toBe(mvpFlavor(30));
    expect(mvpFlavor(30)).not.toBe(mvpFlavor(70));
  });
});
