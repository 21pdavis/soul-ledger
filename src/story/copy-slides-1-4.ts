import { formatPatchDate } from "./format";
import { heroName } from "./heroes";
import type { StoryData } from "./types";

/**
 * Copy and copy selection for slides 1-4 (intro, main, roster, scavenger). The fixed headlines
 * live in copy.ts; this file holds everything else those slides say. Tone: hype, PG-13
 * (ADR 0007, 0053).
 */

type PercentileEntry = StoryData["percentiles"][number];

export const INTRO_COPY = {
  hoursUnit: "hours in the Cursed City",
  firstEntry: "First entry",
  latestEntry: "Latest entry",
} as const;

export const MAIN_COPY = {
  mostPlayed: "Your most-played hero",
  matchesUnit: "matches",
  winRate: "win rate",
} as const;

export const ROSTER_COPY = {
  heroesPlayedUnit: (n: number) => (n === 1 ? "hero played" : "heroes played"),
  topHeroes: "Most played",
  matchesUnit: "matches",
  winRate: "win rate",
} as const;

export const SCAVENGER_COPY = {
  crateGoblin: { title: "Crate Goblin", detail: "breakables smashed" },
  gambler: { title: "Gambler", detail: "Sinner's Sacrifice jackpots" },
  urnMule: { title: "Urn Mule", detail: "idols returned" },
} as const;

export function matchesUnit(n: number): string {
  return n === 1 ? "match" : "matches";
}

/** Intro first/last dates are ISO instants shown as the same UTC day for every viewer. */
export const formatLedgerDate = formatPatchDate;

/**
 * "Top N%": one decimal under 10 (a trailing .0 dropped), whole percent from 10 up. `topPercent`
 * is already in [0.5, 99.5], so it never reads "Top 0%".
 */
export function formatTopPercent(topPercent: number): string {
  if (topPercent >= 10) return String(Math.round(topPercent));
  return String(Math.round(topPercent * 10) / 10);
}

/** The percentile entry with the lowest `topPercent` (the first on a tie), or null if there are none. */
export function bestPercentile<T extends { topPercent: number }>(entries: T[]): T | null {
  let best: T | null = null;
  for (const e of entries) if (!best || e.topPercent < best.topPercent) best = e;
  return best;
}

export interface MainPercentileLine {
  scope: "hero" | "global";
  /** "Top 12% of Infernus players" or "Top 12% of all players". */
  text: string;
  /** The stat the ranking is for, e.g. "Kills per match". */
  metric: string;
}

/**
 * The main slide's percentile line. With enough main-hero matches `main.percentiles` is non-empty
 * and we rank against that hero's players (never labelled global). Below that it is empty, so we
 * fall back to the best global entry with global phrasing (no hero name), or to nothing.
 */
export function mainPercentileLine(
  main: { heroId: number; percentiles: PercentileEntry[] },
  globalPercentiles: PercentileEntry[],
): MainPercentileLine | null {
  const heroBest = bestPercentile(main.percentiles);
  if (heroBest) {
    return {
      scope: "hero",
      text: `Top ${formatTopPercent(heroBest.topPercent)}% of ${heroName(main.heroId)} players`,
      metric: heroBest.label,
    };
  }
  const globalBest = bestPercentile(globalPercentiles);
  if (globalBest) {
    return {
      scope: "global",
      text: `Top ${formatTopPercent(globalBest.topPercent)}% of all players`,
      metric: globalBest.label,
    };
  }
  return null;
}

/** The roster verdict (ADR 0038): one-trick at 50% or more on the main, flex otherwise. */
export function rosterVerdict(label: "one-trick" | "flex"): { title: string; blurb: string } {
  return label === "one-trick"
    ? { title: "One-trick", blurb: "Half your matches or more go to one hero. Commitment." }
    : { title: "Flex", blurb: "No single hero owns you. You play the whole bench." };
}
