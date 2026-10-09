import type { SlideProps, StoryData } from "@/story/types";

/** A full story for component tests: every slide has data. */
export function fixtureStory(overrides: Partial<StoryData> = {}): StoryData {
  const pct = (metric: string, label: string, topPercent: number) => ({
    metric,
    label,
    value: 10,
    percentile: 100 - topPercent,
    topPercent,
    higherIsBetter: true,
    weight: 1,
  });
  const rank = (i: number, badge: number) => ({
    at: `2026-0${i}-01T00:00:00.000Z`,
    matchId: 1000 + i,
    badge,
    tier: Math.floor(badge / 10),
    subrank: badge % 10,
  });
  return {
    matchCount: 120,
    excludedMatches: 3,
    intro: {
      matches: 120,
      hoursPlayed: 84.5,
      wins: 64,
      winRate: 0.533,
      firstMatchAt: "2026-01-02T10:00:00.000Z",
      lastMatchAt: "2026-09-30T20:00:00.000Z",
    },
    main: {
      heroId: 1,
      matches: 50,
      wins: 30,
      winRate: 0.6,
      recent: { matches: 20, wins: 14, winRate: 0.7 },
      share: 0.42,
      percentiles: [pct("kills", "Kills per match", 12)],
    },
    roster: {
      heroesPlayed: 9,
      label: "flex",
      topHeroes: [
        { heroId: 1, matches: 50, winRate: 0.6, recent: { matches: 20, wins: 14, winRate: 0.7 } },
        { heroId: 2, matches: 30, winRate: 0.5, recent: { matches: 20, wins: 10, winRate: 0.5 } },
        { heroId: 3, matches: 15, winRate: 0.4, recent: null },
        { heroId: 4, matches: 10, winRate: 0.7, recent: null },
        { heroId: 6, matches: 5, winRate: 0.2, recent: null },
      ],
    },
    scavenger: { breakables: 1800, sinnerJackpots: 42, idolsReturned: 77 },
    kills: {
      total: 1500,
      bullet: 900,
      ability: 400,
      melee: 100,
      headshot: 300,
      closeup: 700,
      longDistance: 300,
    },
    precision: {
      heroAccuracy: 0.46,
      headshotRate: 0.19,
      parrySuccess: 30,
      parryMiss: 20,
      parryLabel: "king",
    },
    midBoss: { claimed: 12, stolen: 2 },
    roast: {
      deaths: 1100,
      deathPositions: [
        [100, 200],
        [110, 210],
        [-3000, 4000],
      ],
      worstMatch: { matchId: 99, heroId: 1, deaths: 21 },
    },
    rank: {
      journey: [rank(1, 41), rank(2, 62), rank(3, 81)],
      current: rank(3, 81),
    },
    percentiles: [pct("melee", "Melee kills", 3)],
    mvp: { ...pct("melee", "Melee kills", 0.5), scope: "hero", heroId: 1 },
    ...overrides,
  };
}

/** Props for any slide component in a test. */
export function fixtureSlideProps(overrides: Partial<SlideProps> = {}): SlideProps {
  return {
    story: fixtureStory(),
    meta: { window: "all", patchStart: null, stale: false },
    actions: { onRefresh: () => {}, onReplay: () => {}, onNewLookup: () => {} },
    ...overrides,
  };
}
