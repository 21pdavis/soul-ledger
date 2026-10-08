/**
 * Copy for the Roast, Rank journey and MVP slides (ADR 0053): hype tone, playful roasts, PG-13
 * (ADR 0007). The fixed headlines live in `copy.ts`; this file holds the data-driven variants and
 * the pure functions that choose between them.
 */
import { heroName } from "./heroes";
import { rankLabel } from "./ranks";
import type { JourneyPoint } from "./rank-journey";
import type { StoryData } from "./types";

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

// ---------------------------------------------------------------- Roast (slide 8)

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

/**
 * Whether the slide shows the souls figure. Off until #36 is done: the owner has not accepted the
 * soul-minutes reading of the unit, and matches with no "Unspent Gold Minutes" key are stored as 0,
 * which understates the average. Until then the slide shows the neutral sentence (no number, no
 * unit), as the plan requires before the unit is verified.
 */
export const SHOW_UNSPENT_SOULS_FIGURE = false;

export function unspentSoulsLine(
  avgUnspentGoldMinutes: number,
  avgMinutes: number,
  showFigure: boolean = SHOW_UNSPENT_SOULS_FIGURE,
): string {
  if (!showFigure) return UNSPENT_NEUTRAL_LINE;
  const souls = typicalUnspentSouls(avgUnspentGoldMinutes, avgMinutes);
  if (souls === null) return UNSPENT_NEUTRAL_LINE;
  if (souls <= 100) return UNSPENT_SPENDER_LINE;
  return `In a typical match you sat on about ${souls.toLocaleString("en-US")} unspent souls.`;
}

// ------------------------------------------------------------ Rank journey (slide 9)

export const RANK_EMPTY_LINE =
  "No ranked history on file yet. Play some ranked matches and your climb will show up here.";

/**
 * One fixed line for any journey (ADR 0053 allows data-driven variants only on the roast and MVP
 * slides). A single badge and no history are the two states that need their own words.
 */
export type RankSummaryKind = "empty" | "single" | "journey";

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
  const peak = journey.reduce((best, p) => (p.badge > best.badge ? p : best), journey[0]);
  const peakNote = peak.badge > current.badge ? ` Your peak was ${rankLabel(peak)}.` : "";
  return {
    kind: "journey",
    text: `You started at ${rankLabel(journey[0])} and now sit at ${now}.${peakNote}`,
  };
}

// ------------------------------------------------------------------- MVP (slide 10)

// The headline is fixed (`headlineFor("mvp")`); the fallback and empty cases speak in the body.
export const MVP_FALLBACK_LEAD = "Your best stat so far";
const MVP_NONE_LINE =
  "Still finding your signature. There isn't enough to crown a stat yet, so play a few more matches and check back.";

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
      /** Set for the fallback only: a line above the stat saying it is the best of a quiet bunch. */
      lead?: string;
      /** The stat, e.g. "Melee kills". */
      label: string;
      /** Already formatted, without the "Top" or the "%". */
      topPercent: string;
      /** "of Infernus players" (hero scope only) or "of all players". */
      scopeLine: string;
      flavor: string;
      /** Set for the hero scope only. */
      heroName?: string;
    }
  | { kind: "none"; line: string };

const NONE: MvpCopy = { kind: "none", line: MVP_NONE_LINE };

/**
 * One template for every case (label, top percent, scope). "Not notable" means the signature
 * stat's top percent is above 50: the slide then shows the best global stat with neutral copy
 * and no same-hero phrasing. A null `mvp` gets its own copy.
 */
export function mvpCopy({ mvp, percentiles }: Pick<StoryData, "mvp" | "percentiles">): MvpCopy {
  if (!mvp) return NONE;
  if (mvp.topPercent <= 50) {
    const shared = {
      label: mvp.label,
      topPercent: formatTopPercent(mvp.topPercent),
      flavor: mvpFlavor(mvp.topPercent),
    };
    if (mvp.scope === "hero") {
      const hero = heroName(mvp.heroId);
      return { kind: "hero", ...shared, scopeLine: `of ${hero} players`, heroName: hero };
    }
    return { kind: "global", ...shared, scopeLine: "of all players" };
  }
  const best = percentiles.reduce<(typeof percentiles)[number] | null>(
    (b, p) => (!b || p.topPercent < b.topPercent ? p : b),
    null,
  );
  if (!best) return NONE;
  return {
    kind: "fallback",
    lead: MVP_FALLBACK_LEAD,
    label: best.label,
    topPercent: formatTopPercent(best.topPercent),
    scopeLine: "of all players",
    // The weighted pick can be above 50 while the best global stat is better than that.
    flavor: mvpFlavor(best.topPercent),
  };
}
