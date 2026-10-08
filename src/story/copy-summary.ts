import { formatHours } from "./format";
import { heroName } from "./heroes";
import { rankLabel } from "./ranks";
import type { StoryData } from "./types";

/** Copy for the summary slide (slide 11). Plain, short, in the ledger's voice (ADR 0053). */
export const SUMMARY_COPY = {
  matches: "Matches",
  hours: "Hours played",
  main: "Main hero",
  rank: "Current rank",
  /** The stamp's text: decorative, so it is hidden from screen readers (the headline says it). */
  stamp: "Entered into the ledger",
} as const;

/** Past this, "Top N%" is no boast: the stat is dropped instead (same line as the MVP slide). */
const NOTABLE_TOP_PERCENT = 50;

/** "Top 0.5%", "Top 12%": one decimal under 1%, whole percent from there. Never "Top 0%". */
export function formatTopPercent(topPercent: number): string {
  const text =
    topPercent < 1
      ? String(Math.max(0.1, Math.round(topPercent * 10) / 10))
      : String(Math.round(topPercent));
  return `Top ${text}%`;
}

export interface TopStat {
  label: string;
  value: string;
  /** Who the percentile is against: "of Infernus players" (same hero) or "of all players". */
  note: string;
}

/**
 * The one stat worth printing on the card: the MVP if there is one, else the best global
 * percentile, else nothing. A stat worse than the top half is not shown.
 */
export function topStat(story: StoryData): TopStat | null {
  const best = story.percentiles.reduce<StoryData["percentiles"][number] | null>(
    (acc, p) => (acc === null || p.topPercent < acc.topPercent ? p : acc),
    null,
  );
  const mvp = story.mvp && story.mvp.topPercent <= NOTABLE_TOP_PERCENT ? story.mvp : null;

  if (mvp) {
    return {
      label: mvp.label,
      value: formatTopPercent(mvp.topPercent),
      note: mvp.scope === "hero" ? `of ${heroName(mvp.heroId)} players` : "of all players",
    };
  }
  if (best && best.topPercent <= NOTABLE_TOP_PERCENT) {
    return {
      label: best.label,
      value: formatTopPercent(best.topPercent),
      note: "of all players",
    };
  }
  return null;
}

export interface SummaryRow {
  key: "matches" | "hours" | "main" | "topStat" | "rank";
  label: string;
  value: string;
  note?: string;
}

/** The ledger lines of the summary card, in order. Lines without data are left out. */
export function summaryRows(story: StoryData): SummaryRow[] {
  const rows: SummaryRow[] = [
    {
      key: "matches",
      label: SUMMARY_COPY.matches,
      value: story.intro.matches.toLocaleString("en-US"),
    },
    { key: "hours", label: SUMMARY_COPY.hours, value: formatHours(story.intro.hoursPlayed) },
  ];
  if (story.main) {
    rows.push({ key: "main", label: SUMMARY_COPY.main, value: heroName(story.main.heroId) });
  }
  const top = topStat(story);
  if (top) rows.push({ key: "topStat", label: top.label, value: top.value, note: top.note });
  if (story.rank.current) {
    rows.push({ key: "rank", label: SUMMARY_COPY.rank, value: rankLabel(story.rank.current) });
  }
  return rows;
}
