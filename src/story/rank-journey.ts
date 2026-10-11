/** A rank point as the browser receives it (Dates already ISO strings). */
export interface JourneyPoint {
  at: string;
  matchId: number;
  /** Badge number as the API writes it: tier * 10 + subrank (81 = Oracle 1). */
  badge: number;
  tier: number;
  subrank: number;
}

/** Most badges the slide draws; a long ranked history is thinned to this many. */
export const MAX_MILESTONES = 7;

/** Fewest badges worth drawing: the first, the last and the peak. */
export const MIN_MILESTONES = 3;

/**
 * The points worth drawing: the first match of each run at the same badge (the history has one
 * entry per match), thinned to `max` points keeping the first, the last and the peak.
 */
export function journeyMilestones(
  journey: readonly JourneyPoint[],
  max: number = MAX_MILESTONES,
): JourneyPoint[] {
  // Room for at least the first, the last and one more (the peak), whatever `max` says.
  const cap = Math.max(MIN_MILESTONES, max);
  const changes = journey.filter((p, i) => i === 0 || p.badge !== journey[i - 1].badge);
  const n = changes.length;
  if (n <= cap) return changes;

  const picked = new Set<number>();
  for (let i = 0; i < cap; i++) picked.add(Math.round((i * (n - 1)) / (cap - 1)));

  const peak = changes.reduce((best, p, i) => (p.badge > changes[best].badge ? i : best), 0);
  if (!picked.has(peak)) {
    // Swap the pick nearest the peak (never the first or last) for the peak itself.
    const inner = [...picked].filter((i) => i !== 0 && i !== n - 1);
    const nearest = inner.reduce((a, b) => (Math.abs(b - peak) < Math.abs(a - peak) ? b : a));
    picked.delete(nearest);
    picked.add(peak);
  }
  return [...picked].sort((a, b) => a - b).map((i) => changes[i]);
}

/** A height for plotting: rises with the badge, with each tier one step above six subranks. */
export function ladderHeight(p: Pick<JourneyPoint, "tier" | "subrank">): number {
  return p.tier * 6 + p.subrank;
}
