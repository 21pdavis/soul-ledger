import { bestPercentile } from "./copy-slides-1-4";
import { formatHours, formatTopPercent } from "./format";
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

/** The MVP slide's "not notable" line (ADR 0053): worse than this and the MVP gives way to the best global stat. */
const NOTABLE_TOP_PERCENT = 50;

const topPercentText = (topPercent: number) => `Top ${formatTopPercent(topPercent)}%`;

export interface TopStat {
  label: string;
  value: string;
  /** Who the percentile is against: "of Infernus players" (same hero) or "of all players". */
  note: string;
}

/**
 * The one stat on the card, following the MVP slide (ADR 0053): the MVP if it is notable (top 50%
 * or better); otherwise the best global percentile with neutral, all-players phrasing, even when
 * it is no boast; nothing only when there are no percentiles at all.
 */
export function topStat(story: StoryData): TopStat | null {
  const { mvp } = story;
  if (mvp && mvp.topPercent <= NOTABLE_TOP_PERCENT) {
    return {
      label: mvp.label,
      value: topPercentText(mvp.topPercent),
      note: mvp.scope === "hero" ? `of ${heroName(mvp.heroId)} players` : "of all players",
    };
  }
  const best = bestPercentile(story.percentiles);
  if (!best) return null;
  return { label: best.label, value: topPercentText(best.topPercent), note: "of all players" };
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
