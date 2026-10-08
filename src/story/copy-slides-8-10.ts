/**
 * Copy for the Roast, Rank journey and MVP slides (ADR 0053): hype tone, playful roasts, PG-13
 * (ADR 0007). The fixed headlines live in `copy.ts`; this file holds the data-driven variants and
 * the pure functions that choose between them.
 */
import { headlineFor } from "./copy";
import { heroName } from "./heroes";
import { rankLabel } from "./ranks";
import type { JourneyPoint } from "./rank-journey";
import type { StoryData } from "./types";

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

// ---------------------------------------------------------------- Roast (slide 8)

export const ROAST_CLEAN_HEADLINE = "A spotless record";

/** The fixed headline, except for a player with no deaths on file, who has nothing to roast. */
export function roastHeadline({ deaths }: { deaths: number }): string {
  return deaths > 0 ? headlineFor("roast") : ROAST_CLEAN_HEADLINE;
}

/** `count` is the hottest cell's count. */
export function hotspotLine(count: number): string {
  return `You died here ${count} ${plural(count, "time", "times")}`;
}

export function noDeathMapLine(deaths: number): string {
  return deaths === 0
    ? "Not a single death on file. Either you are untouchable or the ledger is being polite."
    : "The ledger knows you died, just not where. No death spots came through for these matches.";
}

export function deathsLabel(deaths: number): string {
  return `${plural(deaths, "death", "deaths")} in total`;
}

export function worstMatchLine({ deaths, heroName: hero }: { deaths: number; heroName: string }) {
  return `Worst night: ${deaths} ${plural(deaths, "death", "deaths")} as ${hero}`;
}

// -------------------------------------------------------- Unspent souls (slide 8)
//
// `avgUnspentGoldMinutes` is the mean per match of "Unspent Gold Minutes". Checked against the
// recorded bulk metadata (see wiki/open-questions/m2-unspent-souls-unit.md): it is souls x
// minutes, not minutes, so dividing by the match length gives the souls held on average. The
// mean of the sums over the mean match length is the duration-weighted average exactly.

/** Mean match length in minutes, or 0 when there are no matches. */
export function avgMatchMinutes(hoursPlayed: number, matchCount: number): number {
  return matchCount > 0 ? (hoursPlayed * 60) / matchCount : 0;
}

/** Souls held unspent on average during a match, rounded to the nearest 100, or null if unknown. */
export function typicalUnspentSouls(avgUnspentGoldMinutes: number, avgMinutes: number) {
  if (
    !Number.isFinite(avgUnspentGoldMinutes) ||
    !Number.isFinite(avgMinutes) ||
    avgUnspentGoldMinutes <= 0 ||
    avgMinutes <= 0
  ) {
    return null;
  }
  return Math.round(avgUnspentGoldMinutes / avgMinutes / 100) * 100;
}

export const UNSPENT_NEUTRAL_LINE =
  "Somewhere in your matches there are souls that never made it to the shop.";
export const UNSPENT_SPENDER_LINE =
  "You spend your souls almost as fast as you earn them. Not much hoarding here.";

export function unspentSoulsLine(avgUnspentGoldMinutes: number, avgMinutes: number): string {
  const souls = typicalUnspentSouls(avgUnspentGoldMinutes, avgMinutes);
  if (souls === null) return UNSPENT_NEUTRAL_LINE;
  if (souls <= 100) return UNSPENT_SPENDER_LINE;
  return `In a typical match you sat on about ${souls.toLocaleString("en-US")} unspent souls.`;
}

// ------------------------------------------------------------ Rank journey (slide 9)

export const RANK_EMPTY_LINE =
  "No ranked history on file yet. Play some ranked matches and your climb will show up here.";

export type RankSummaryKind = "empty" | "single" | "climbed" | "held" | "fell";

export function rankSummary(
  journey: readonly JourneyPoint[],
  current: JourneyPoint | null,
): { kind: RankSummaryKind; text: string } {
  if (!current || journey.length === 0) return { kind: "empty", text: RANK_EMPTY_LINE };
  const now = rankLabel(current);
  if (journey.length === 1) {
    return {
      kind: "single",
      text: `You're at ${now} so far. One badge isn't a climb yet, so play on and the line will draw itself.`,
    };
  }
  const first = journey[0];
  const peak = journey.reduce((best, p) => (p.badge > best.badge ? p : best), journey[0]);
  const peakNote = peak.badge > current.badge ? ` Your peak was ${rankLabel(peak)}.` : "";
  if (current.badge > first.badge) {
    return {
      kind: "climbed",
      text: `You started at ${rankLabel(first)} and climbed to ${now}.${peakNote}`,
    };
  }
  if (current.badge < first.badge) {
    return {
      kind: "fell",
      text: `You started at ${rankLabel(first)} and sit at ${now} now.${peakNote}`,
    };
  }
  return { kind: "held", text: `You've held steady at ${now}.${peakNote}` };
}

// ------------------------------------------------------------------- MVP (slide 10)

export const MVP_FALLBACK_HEADLINE = "Your best stat so far";
export const MVP_NONE_HEADLINE = "Still finding your signature";
const MVP_NONE_LINE =
  "There isn't enough to crown a signature stat yet. Play a few more matches and check back.";

/** "Top 0.5%", never "Top 0%": one decimal below 10, whole numbers from there up. */
export function formatTopPercent(topPercent: number): string {
  const v = Math.max(0.1, topPercent);
  return v < 10 ? String(Math.round(v * 10) / 10) : String(Math.round(v));
}

export function mvpFlavor(topPercent: number): string {
  if (topPercent <= 1) return "Rare air. Hardly anyone else is up here.";
  if (topPercent <= 10) return "That's elite company.";
  if (topPercent <= 50) return "Comfortably ahead of the pack.";
  return "Nothing stands out yet, so this is your closest. Keep playing and it will move.";
}

export type MvpCopy =
  | {
      kind: "hero" | "global" | "fallback";
      headline: string;
      /** The stat, e.g. "Melee kills". */
      label: string;
      /** Already formatted, without the "Top" or the "%". */
      topPercent: string;
      /** "of Infernus players" (hero scope only) or "of all players". */
      scopeLine: string;
      flavor: string;
    }
  | { kind: "none"; headline: string; line: string };

const NONE: MvpCopy = { kind: "none", headline: MVP_NONE_HEADLINE, line: MVP_NONE_LINE };

/**
 * One template for every case (label, top percent, scope). "Not notable" means the signature
 * stat's top percent is above 50: the slide then shows the best global stat with neutral copy
 * and no same-hero phrasing. A null `mvp` gets its own copy.
 */
export function mvpCopy({ mvp, percentiles }: Pick<StoryData, "mvp" | "percentiles">): MvpCopy {
  if (!mvp) return NONE;
  if (mvp.topPercent <= 50) {
    return {
      kind: mvp.scope,
      headline: headlineFor("mvp"),
      label: mvp.label,
      topPercent: formatTopPercent(mvp.topPercent),
      scopeLine: mvp.scope === "hero" ? `of ${heroName(mvp.heroId)} players` : "of all players",
      flavor: mvpFlavor(mvp.topPercent),
    };
  }
  const best = percentiles.reduce<(typeof percentiles)[number] | null>(
    (b, p) => (!b || p.topPercent < b.topPercent ? p : b),
    null,
  );
  if (!best) return NONE;
  return {
    kind: "fallback",
    headline: MVP_FALLBACK_HEADLINE,
    label: best.label,
    topPercent: formatTopPercent(best.topPercent),
    scopeLine: "of all players",
    flavor: mvpFlavor(Math.max(best.topPercent, 51)),
  };
}
