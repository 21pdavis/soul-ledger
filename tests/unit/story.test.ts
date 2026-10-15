import { describe, expect, it } from "vitest";
import {
  matchLineup,
  type MmrHistoryEntry,
  type Quantiles,
  type StatMetrics,
} from "@/lib/deadlock-api/schemas";
import { normalizePlayerMatch, tagKillers } from "@/lib/stats/normalize";
import { computeStory } from "@/lib/stats/story";
import type { PlayerMatch } from "@/lib/stats/types";
import { fixtureMatches } from "../helpers/fake-api";
import { fixtureJson, TEST_ACCOUNT_ID } from "../helpers/fixtures";

const all = fixtureMatches().map((m) => normalizePlayerMatch(m, TEST_ACCOUNT_ID));
const normal = all.filter((r) => r.gameMode === "normal");
const metrics = fixtureJson<StatMetrics>("api/metrics-global.json");
const rankHistory = fixtureJson<MmrHistoryEntry[]>("api/mmr-history.json");
const heroes = fixtureJson<{ id: number; name: string }[]>("api/heroes.json");
const heroName = (id: number) => heroes.find((h) => h.id === id)?.name;

const total = (f: (r: PlayerMatch) => number) => normal.reduce((s, r) => s + f(r), 0);

const story = computeStory({
  matches: all,
  rankHistory,
  globalMetrics: metrics,
  mainHeroMetrics: metrics,
});

describe("computeStory on the test account", () => {
  it("leaves Street Brawl out of every stat", () => {
    expect(all).toHaveLength(352);
    expect(story.matchCount).toBe(351);
    expect(story.excludedMatches).toBe(1);
  });

  it("intro: matches, hours and wins", () => {
    expect(story.intro.matches).toBe(351);
    expect(story.intro.hoursPlayed).toBeCloseTo(total((r) => r.durationS) / 3600);
    expect(story.intro.wins).toBe(normal.filter((r) => r.won).length);
    expect(story.intro.winRate).toBeCloseTo(story.intro.wins / 351);
    const times = normal.map((r) => r.startTime.getTime());
    expect(story.intro.firstMatchAt).toEqual(new Date(Math.min(...times)));
    expect(story.intro.lastMatchAt).toEqual(new Date(Math.max(...times)));
  });

  it("main: the most-played hero with its win rate and hero-scoped percentiles", () => {
    expect(heroName(story.main!.heroId)).toBe("Celeste");
    const celeste = normal.filter((r) => r.heroId === story.main!.heroId);
    expect(story.main).toMatchObject({
      matches: celeste.length,
      wins: celeste.filter((r) => r.won).length,
    });
    expect(story.main!.share).toBeCloseTo(celeste.length / 351);
    expect(story.main!.percentiles.length).toBeGreaterThan(0);
  });

  it("roster: counts heroes and calls a spread-out player a flex", () => {
    expect(story.roster.heroesPlayed).toBe(new Set(normal.map((r) => r.heroId)).size);
    expect(story.roster.label).toBe("flex");
    expect(story.roster.topHeroes[0].heroId).toBe(story.main!.heroId);
    expect(story.roster.topHeroes.length).toBeLessThanOrEqual(5);
  });

  it("scavenger: crates, Sinner's jackpots and idols", () => {
    expect(story.scavenger).toEqual({
      breakables: total((r) => r.breakables),
      sinnerJackpots: total((r) => r.sinnerJackpots),
      idolsReturned: total((r) => r.idolsReturned),
    });
  });

  it("how you kill: totals by method and range", () => {
    expect(story.kills).toEqual({
      total: total((r) => r.kills),
      bullet: total((r) => r.bulletKills),
      ability: total((r) => r.abilityKills),
      melee: total((r) => r.meleeKills),
      headshot: total((r) => r.headshotKills),
      closeup: total((r) => r.closeupKills),
      longDistance: total((r) => r.longDistanceKills),
    });
  });

  it("precision: hero accuracy, headshot rate and parries", () => {
    expect(story.precision.heroAccuracy).toBeCloseTo(
      total((r) => r.heroHits) / total((r) => r.heroShots),
    );
    expect(story.precision.headshotRate).toBeCloseTo(
      total((r) => r.heroHeadshots) / total((r) => r.heroHits),
    );
    expect(story.precision.parrySuccess).toBe(total((r) => r.parrySuccess));
    expect(story.precision.parryMiss).toBe(total((r) => r.parryMiss));
    expect(["king", "clown"]).toContain(story.precision.parryLabel);
  });

  it("mid boss: Rejuvenators claimed and stolen", () => {
    expect(story.midBoss).toEqual({
      claimed: total((r) => r.midBossClaimed),
      stolen: total((r) => r.midBossStolen),
    });
  });

  it("roast: every death position and the worst match", () => {
    expect(story.roast.deaths).toBe(total((r) => r.deaths));
    expect(story.roast.deathPositions).toHaveLength(total((r) => r.deathPositions.length));
    expect(story.roast).not.toHaveProperty("avgUnspentGoldMinutes");
    const worst = Math.max(...normal.map((r) => r.deaths));
    expect(story.roast.worstMatch).toMatchObject({ deaths: worst });
  });

  it("rank: the journey in time order, ending at the current rank", () => {
    const times = story.rank.journey.map((p) => p.at.getTime());
    expect(times).toEqual([...times].sort((a, b) => a - b));
    expect(story.rank.journey).toHaveLength(rankHistory.length);
    expect(story.rank.current).toEqual(story.rank.journey.at(-1));
    expect(story.rank.journey[0]).toMatchObject({
      tier: expect.any(Number),
      subrank: expect.any(Number),
    });
  });

  it("percentiles and an MVP stat that the player is genuinely good at", () => {
    expect(story.percentiles.length).toBeGreaterThan(5);
    expect(story.mvp).not.toBeNull();
    expect(story.mvp!.topPercent).toBeLessThan(50);
  });
});

const quantiles = (p50: number, spread: number): Quantiles => ({
  avg: p50,
  std: spread,
  percentile1: p50 - 4 * spread,
  percentile5: p50 - 3 * spread,
  percentile10: p50 - 2 * spread,
  percentile25: p50 - spread,
  percentile50: p50,
  percentile75: p50 + spread,
  percentile90: p50 + 2 * spread,
  percentile95: p50 + 3 * spread,
  percentile99: p50 + 4 * spread,
});

function row(overrides: Partial<PlayerMatch>): PlayerMatch {
  return { ...normal[0], ...overrides };
}

describe("computeStory edge cases", () => {
  it.each([
    [5, "one-trick"],
    [4, "flex"],
  ] as const)(
    "one-trick line is 50 percent: %i of 10 games on one hero is %s (ADR 0038)",
    (n, label) => {
      const rows = Array.from({ length: 10 }, (_, i) =>
        row({ matchId: i, heroId: i < n ? 1 : 2 + i }),
      );
      const s = computeStory({
        matches: rows,
        rankHistory: [],
        globalMetrics: {},
        mainHeroMetrics: {},
      });
      expect(s.roster.label).toBe(label);
    },
  );

  it("calls a player who mostly plays one hero a one-trick", () => {
    const rows = [
      ...Array.from({ length: 8 }, (_, i) => row({ matchId: i, heroId: 1 })),
      ...Array.from({ length: 2 }, (_, i) => row({ matchId: 100 + i, heroId: 2 })),
    ];
    const s = computeStory({
      matches: rows,
      rankHistory: [],
      globalMetrics: {},
      mainHeroMetrics: {},
    });
    expect(s.roster.label).toBe("one-trick");
  });

  it.each([
    [4, "king"],
    [3, "clown"],
  ] as const)(
    "parry king line is 40 percent: %i of 10 parries landed is %s (ADR 0061)",
    (n, label) => {
      const s = computeStory({
        matches: [row({ parrySuccess: n, parryMiss: 10 - n })],
        rankHistory: [],
        globalMetrics: {},
        mainHeroMetrics: {},
      });
      expect(s.precision.parryLabel).toBe(label);
    },
  );

  it("labels parries", () => {
    const king = computeStory({
      matches: [row({ parrySuccess: 8, parryMiss: 2 })],
      rankHistory: [],
      globalMetrics: {},
      mainHeroMetrics: {},
    });
    const clown = computeStory({
      matches: [row({ parrySuccess: 1, parryMiss: 9 })],
      rankHistory: [],
      globalMetrics: {},
      mainHeroMetrics: {},
    });
    const never = computeStory({
      matches: [row({ parrySuccess: 0, parryMiss: 1 })],
      rankHistory: [],
      globalMetrics: {},
      mainHeroMetrics: {},
    });
    expect(king.precision.parryLabel).toBe("king");
    expect(clown.precision.parryLabel).toBe("clown");
    expect(never.precision.parryLabel).toBe("none");
  });

  it("MVP prefers the most extreme weighted stat, scoped to the main hero when possible", () => {
    const rows = Array.from({ length: 12 }, (_, i) =>
      row({ matchId: i, heroId: 7, kills: 10, denies: 30, deaths: 5 }),
    );
    const globalMetrics: StatMetrics = { kills: quantiles(10, 2), denies: quantiles(5, 2) };
    const heroMetrics: StatMetrics = { kills: quantiles(10, 2), denies: quantiles(30, 5) };

    const s = computeStory({
      matches: rows,
      rankHistory: [],
      globalMetrics,
      mainHeroMetrics: heroMetrics,
    });
    // Denies are extreme globally but ordinary for this hero; hero scope is preferred only
    // when it is the more extreme, so the global denies win.
    expect(s.mvp).toMatchObject({ metric: "denies", scope: "global" });

    const s2 = computeStory({
      matches: rows,
      rankHistory: [],
      globalMetrics: { kills: quantiles(10, 2) },
      mainHeroMetrics: { kills: quantiles(4, 1) },
    });
    expect(s2.mvp).toMatchObject({ metric: "kills", scope: "hero", heroId: 7 });
  });

  it("does not compare against hero players on a tiny sample", () => {
    const rows = Array.from({ length: 3 }, (_, i) => row({ matchId: i, heroId: 7, kills: 10 }));
    const s = computeStory({
      matches: rows,
      rankHistory: [],
      globalMetrics: { kills: quantiles(10, 2) },
      mainHeroMetrics: { kills: quantiles(4, 1) },
    });
    expect(s.main!.percentiles).toEqual([]);
    expect(s.mvp?.scope).not.toBe("hero");
  });

  it("copes with a player who has no matches", () => {
    const s = computeStory({
      matches: [],
      rankHistory: [],
      globalMetrics: metrics,
      mainHeroMetrics: {},
    });
    expect(s.matchCount).toBe(0);
    expect(s.main).toBeNull();
    expect(s.mvp).toBeNull();
    expect(s.intro).toMatchObject({ matches: 0, winRate: 0, firstMatchAt: null });
    expect(s.roast.worstMatch).toBeNull();
    expect(s.rank.current).toBeNull();
  });
});

describe("recent win rates (ADR 0064)", () => {
  /** n matches of one hero, oldest first; the first `lost` are losses, the rest wins. */
  const synth = (heroId: number, n: number, lost: number, startAt = 0): PlayerMatch[] =>
    Array.from({ length: n }, (_, i) => ({
      ...normal[0],
      matchId: 900000 + heroId * 10000 + i,
      heroId,
      won: i >= lost,
      startTime: new Date(1_700_000_000_000 + (startAt + i) * 3_600_000),
    }));
  const run = (matches: PlayerMatch[]) =>
    computeStory({ matches, rankHistory: [], globalMetrics: metrics, mainHeroMetrics: metrics });

  it("overall recent = the latest 300 matches", () => {
    const s = run(synth(1, 400, 100));
    expect(s.roster.recent).toEqual({ matches: 300, winRate: 1 });
    expect(s.intro.winRate).toBeCloseTo(0.75);
  });

  it("overall recent is null when the player has 300 matches or fewer", () => {
    expect(run(synth(1, 300, 100)).roster.recent).toBeNull();
  });

  it("main recent = the hero's latest 20 matches, null at 20 or fewer", () => {
    expect(run(synth(1, 80, 30)).main?.recent).toEqual({ matches: 20, winRate: 1 });
    expect(run(synth(1, 20, 10)).main?.recent).toBeNull();
  });

  it("top heroes carry their own recent 20", () => {
    const s = run([...synth(1, 80, 30), ...synth(2, 60, 60, 100)]);
    expect(s.roster.topHeroes[0].recent).toEqual({ matches: 20, winRate: 1 });
    expect(s.roster.topHeroes[1].recent).toEqual({ matches: 20, winRate: 0 });
  });
});

describe("nemesis: the hero that killed the reader most (ADR 0068)", () => {
  const run = (rows: PlayerMatch[]) =>
    computeStory({ matches: rows, rankHistory: [], globalMetrics: {}, mainHeroMetrics: {} });
  const died = (matchId: number, killers: (number | undefined)[]) =>
    row({
      matchId,
      deathPositions: killers.map((k) => (k === undefined ? [0, 0] : [0, 0, k])),
    });

  it("is the killer with the most kills across matches", () => {
    const s = run([died(1, [7, 7, 9]), died(2, [9, 9, 9, 7])]);
    expect(s.nemesis).toEqual({ heroId: 9, kills: 4 });
  });

  it("breaks a tie with the lowest hero id, so the answer never wobbles", () => {
    const s = run([died(1, [20, 4]), died(2, [4, 20])]);
    expect(s.nemesis).toEqual({ heroId: 4, kills: 2 });
  });

  it("ignores deaths with no known killer, and is null when none are known", () => {
    expect(run([died(1, [undefined, 5])]).nemesis).toEqual({ heroId: 5, kills: 1 });
    expect(run([died(1, [undefined])]).nemesis).toBeNull();
    expect(run([]).nemesis).toBeNull();
  });

  it("leaves the death map as plain [x, y] pairs", () => {
    const s = run([died(1, [7, undefined])]);
    expect(s.roast.deathPositions).toEqual([
      [0, 0],
      [0, 0],
    ]);
  });

  it("names no nemesis when fewer than half the deaths have a known killer", () => {
    // 1 of 3 deaths tagged: too thin a sample, so the story falls back to the stock rival.
    expect(run([died(1, [7, undefined, undefined])]).nemesis).toBeNull();
    // Exactly half is enough.
    expect(run([died(1, [7, undefined])]).nemesis).toEqual({ heroId: 7, kills: 1 });
  });

  it("finds a nemesis in recorded matches", () => {
    const lineups = matchLineup.array().parse(fixtureJson("api/lineups.json"));
    const rows = fixtureMatches()
      .filter((m) => lineups.some((l) => l.match_id === m.match_id))
      .map((m) => {
        const r = normalizePlayerMatch(m, TEST_ACCOUNT_ID);
        const tagged = tagKillers(
          r.deathPositions,
          TEST_ACCOUNT_ID,
          lineups.find((l) => l.match_id === m.match_id)!,
        );
        return { ...r, deathPositions: tagged ?? r.deathPositions };
      });
    // Recorded killers: heroes 4, 20, 64 and 67 each killed the reader 3 times, so the
    // lowest hero id (4) wins the tie.
    expect(run(rows).nemesis).toEqual({ heroId: 4, kills: 3 });
  });
});
