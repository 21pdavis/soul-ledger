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
  winRate: "win rate",
} as const;

export const ROSTER_COPY = {
  heroesPlayedUnit: (n: number) => (n === 1 ? "hero played" : "heroes played"),
  topHeroes: "Most played",
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
  /** "neutral" is the not-notable case: no ranking claim at all. */
  scope: "hero" | "global" | "neutral";
  /** "Top 12% of Infernus players", "Top 12% of all players", or neutral copy without a number. */
  text: string;
  /** The stat the ranking is for, e.g. "Kills per match". Empty for neutral copy. */
  metric: string;
}

/** A best ranking above this is "not notable" (ADR 0053): no claim, neutral copy instead. */
export const NOT_NOTABLE_ABOVE = 50;

const NEUTRAL_RANK_LINE = "Nothing here is topping the charts yet. The ledger is still filling up.";

/**
 * The main slide's percentile line. With enough main-hero matches `main.percentiles` is non-empty
 * and we rank against that hero's players (never labelled global). Below that it is empty, so we
 * fall back to the best global entry with global phrasing (no hero name), or to nothing.
 * Whichever list applies, a best entry above 50 is not notable: neutral copy, no percentile.
 */
export function mainPercentileLine(
  main: { heroId: number; percentiles: PercentileEntry[] },
  globalPercentiles: PercentileEntry[],
): MainPercentileLine | null {
  const heroBest = bestPercentile(main.percentiles);
  if (heroBest && heroBest.topPercent > NOT_NOTABLE_ABOVE) return neutralLine();
  if (heroBest) {
    return {
      scope: "hero",
      text: `Top ${formatTopPercent(heroBest.topPercent)}% of ${heroName(main.heroId)} players`,
      metric: heroBest.label,
    };
  }
  const globalBest = bestPercentile(globalPercentiles);
  if (globalBest && globalBest.topPercent > NOT_NOTABLE_ABOVE) return neutralLine();
  if (globalBest) {
    return {
      scope: "global",
      text: `Top ${formatTopPercent(globalBest.topPercent)}% of all players`,
      metric: globalBest.label,
    };
  }
  return null;
}

function neutralLine(): MainPercentileLine {
  return { scope: "neutral", text: NEUTRAL_RANK_LINE, metric: "" };
}

/** The roster verdict (ADR 0038): one-trick at 50% or more on the main, flex otherwise. */
export function rosterVerdict(label: "one-trick" | "flex"): { title: string; blurb: string } {
  return label === "one-trick"
    ? { title: "One-trick", blurb: "Half your matches or more go to one hero. Commitment." }
    : { title: "Flex", blurb: "No single hero owns you. You play the whole bench." };
}
