import { describe, expect, it } from "vitest";
import {
  MVP_FALLBACK_LEAD,
  RANK_EMPTY_LINE,
  deathsLabel,
  hotspotLine,
  mentionLine,
  mvpCopy,
  mvpFlavor,
  mvpMentions,
  noDeathMapLine,
  rankSummary,
  worstMatchLine,
} from "@/story/copy";
import type { JourneyPoint } from "@/story/rank-journey";
import { formatTopPercent } from "@/story/format";
import { fixtureStory } from "../../fixtures/story";

describe("roast copy", () => {
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

  it("uses one line for every journey, from the first rank to the current one", () => {
    const up = [pt(0, 31), pt(1, 62), pt(2, 81)];
    const down = [pt(0, 81), pt(1, 62)];
    const flat = [pt(0, 62), pt(1, 62)];
    const lines = [up, down, flat].map((j) => rankSummary(j, j.at(-1)!));
    for (const s of lines) expect(s.kind).toBe("journey");
    expect(lines[0].text).toBe("You started at Acolyte 1 and now sit at Oracle 1.");
    expect(lines[1].text).toBe(
      "You started at Oracle 1 and now sit at Ritualist 2. Your peak was Oracle 1.",
    );
    expect(lines[2].text).toBe("You started at Ritualist 2 and now sit at Ritualist 2.");
  });

  it("mentions a higher peak only when the player is below it", () => {
    const j = [pt(0, 41), pt(1, 91), pt(2, 62)];
    expect(rankSummary(j, j[2]).text).toBe(
      "You started at Sentinel 1 and now sit at Ritualist 2. Your peak was Phantom 1.",
    );
    const up = [pt(0, 41), pt(1, 91)];
    expect(rankSummary(up, up[1]).text).not.toMatch(/peak/);
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
    const c = mvpCopy(
      fixtureStory({ mvp: { ...pct("melee", "Melee kills", 0.5), scope: "hero", heroId: 1 } }),
    );
    expect(c).toMatchObject({
      kind: "hero",
      label: "Melee kills",
      topPercent: "0.5",
      scopeLine: "of Infernus players",
      heroName: "Infernus",
    });
  });

  it("never mentions a hero for the global scope", () => {
    const c = mvpCopy(fixtureStory({ mvp: { ...pct("kills", "Kills", 4), scope: "global" } }));
    expect(c).toMatchObject({
      kind: "global",
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
        percentiles: [
          pct("kills", "Kills", 72),
          pct("assists", "Assists", 58),
          pct("kda", "KDA", 90),
        ],
      }),
    );
    expect(c).toMatchObject({
      kind: "fallback",
      lead: MVP_FALLBACK_LEAD,
      label: "Assists",
      topPercent: "58",
      scopeLine: "of all players",
    });
    expect(JSON.stringify(c)).not.toMatch(/Infernus|Hero #/);
  });

  it("uses the flavour for the fallback stat's own rank when it is 50 or better", () => {
    // The weighted pick can land above 50 while the best global stat is better than that.
    const c = mvpCopy(
      fixtureStory({
        mvp: { ...pct("deaths", "Deaths", 61), scope: "hero", heroId: 1 },
        percentiles: [pct("kills", "Kills", 72), pct("assists", "Assists", 30)],
      }),
    );
    expect(c).toMatchObject({ kind: "fallback", label: "Assists", flavor: mvpFlavor(30) });
    expect(JSON.stringify(c)).not.toMatch(/Infernus|Hero #|nothing stands out/i);
  });

  it("treats exactly 50 as notable", () => {
    const c = mvpCopy(fixtureStory({ mvp: { ...pct("kills", "Kills", 50), scope: "global" } }));
    expect(c.kind).toBe("global");
  });

  it("has its own friendly copy when mvp is null", () => {
    const c = mvpCopy(fixtureStory({ mvp: null, percentiles: [] }));
    expect(c).toMatchObject({
      kind: "none",
      line: expect.stringMatching(/matches/i),
    });
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

describe("mvp honorable mentions", () => {
  const pct = (label: string, topPercent: number) => ({
    metric: label.toLowerCase(),
    label,
    value: 10,
    percentile: 100 - topPercent,
    topPercent,
    higherIsBetter: true,
    weight: 1,
  });
  const story = (over: Parameters<typeof fixtureStory>[0] = {}) =>
    fixtureStory({
      mvp: { ...pct("Melee kills", 0.5), scope: "global" },
      percentiles: [
        pct("Melee kills", 0.5),
        pct("Assists", 8),
        pct("Kills", 20),
        pct("Denies", 35),
      ],
      ...over,
    });

  it("lists the next two best stats, never the signature stat itself", () => {
    const m = mvpMentions(story());
    expect(m.map((x) => x.label)).toEqual(["Assists", "Kills"]);
    expect(m[0]).toMatchObject({ topPercent: "8", note: "of all players" });
    expect(m[0].line).toBe(mentionLine(8));
  });

  it("skips stats that are not notable (above the top 50%)", () => {
    const m = mvpMentions(story({ percentiles: [pct("Melee kills", 0.5), pct("Deaths", 61)] }));
    expect(m).toEqual([]);
  });

  it("when the signature is the fallback, leaves out the best stat it already shows", () => {
    const m = mvpMentions(
      story({
        mvp: { ...pct("Deaths", 61), scope: "global" },
        percentiles: [pct("Assists", 30), pct("Kills", 40), pct("Denies", 45)],
      }),
    );
    expect(m.map((x) => x.label)).toEqual(["Kills", "Denies"]);
  });

  it("is empty with no percentiles", () => {
    expect(mvpMentions(story({ mvp: null, percentiles: [] }))).toEqual([]);
  });

  it("has a distinct short line per tier", () => {
    expect(mentionLine(1)).not.toBe(mentionLine(8));
    expect(mentionLine(8)).not.toBe(mentionLine(30));
  });
});
