import type { RecentTrend } from "@/story/copy";

/** The up or down arrow beside a recent win rate, named for screen readers; nothing when flat. */
export function TrendArrow({ trend }: { trend: RecentTrend }) {
  if (!trend.arrow) return null;
  return (
    <span role="img" aria-label={trend.arrowLabel}>
      {trend.arrow}
    </span>
  );
}
