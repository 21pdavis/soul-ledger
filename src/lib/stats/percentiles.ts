import type { Quantiles, StatMetrics } from "@/lib/deadlock-api/schemas";
import type { PlayerMatch } from "./types";

const KNOTS = [1, 5, 10, 25, 50, 75, 90, 95, 99] as const;

/**
 * Where `value` falls in a distribution described by DDSketch quantiles, as a percentile in
 * [0.5, 99.5]. Linear between published quantiles; a value sitting on several equal quantiles
 * (say half of all players at 0) lands in the middle of that run.
 */
export function percentileOf(value: number, q: Quantiles): number {
  const points = KNOTS.map((p) => q[`percentile${p}`]);

  const equal = KNOTS.filter((_, i) => points[i] === value);
  if (equal.length > 0) return (equal[0] + equal[equal.length - 1]) / 2;

  if (value < points[0]) return 0.5;
  if (value > points[points.length - 1]) return 99.5;

  for (let i = 0; i < points.length - 1; i++) {
    if (value > points[i] && value < points[i + 1]) {
      const t = (value - points[i]) / (points[i + 1] - points[i]);
      return KNOTS[i] + t * (KNOTS[i + 1] - KNOTS[i]);
    }
  }
  return 50; // unreachable for well-formed quantiles
}

export interface PercentileStat {
  /** Key in /v1/analytics/player-stats/metrics. */
  metric: string;
  label: string;
  higherIsBetter: boolean;
  /** MVP selection weight: more than 1 favours unusual stats over plain kills (ADR 0021). */
  weight: number;
  value: (rows: PlayerMatch[]) => number;
}

const sum = (rows: PlayerMatch[], f: (r: PlayerMatch) => number) =>
  rows.reduce((total, r) => total + f(r), 0);
const perMatch = (f: (r: PlayerMatch) => number) => (rows: PlayerMatch[]) =>
  sum(rows, f) / rows.length;
const perMinute = (f: (r: PlayerMatch) => number) => (rows: PlayerMatch[]) =>
  sum(rows, f) / (sum(rows, (r) => r.durationS) / 60);
const ratio =
  (num: (r: PlayerMatch) => number, den: (r: PlayerMatch) => number) => (rows: PlayerMatch[]) =>
    sum(rows, num) / Math.max(1, sum(rows, den));

/**
 * The stats we can rank globally. Each metric was checked against the live response; see
 * wiki/research/percentile-metrics.md for definitions.
 */
export const PERCENTILE_STATS: PercentileStat[] = [
  {
    metric: "kills",
    label: "Kills",
    higherIsBetter: true,
    weight: 0.8,
    value: perMatch((r) => r.kills),
  },
  {
    metric: "deaths",
    label: "Deaths",
    higherIsBetter: false,
    weight: 0.9,
    value: perMatch((r) => r.deaths),
  },
  {
    metric: "assists",
    label: "Assists",
    higherIsBetter: true,
    weight: 0.9,
    value: perMatch((r) => r.assists),
  },
  {
    metric: "kda",
    label: "KDA",
    higherIsBetter: true,
    weight: 1,
    value: ratio(
      (r) => r.kills + r.assists,
      (r) => r.deaths,
    ),
  },
  {
    metric: "last_hits",
    label: "Last hits",
    higherIsBetter: true,
    weight: 1,
    value: perMatch((r) => r.lastHits),
  },
  {
    metric: "denies",
    label: "Denies",
    higherIsBetter: true,
    weight: 1.2,
    value: perMatch((r) => r.denies),
  },
  {
    metric: "net_worth_per_min",
    label: "Souls per minute",
    higherIsBetter: true,
    weight: 1,
    value: perMinute((r) => r.netWorth),
  },
  {
    metric: "player_damage_per_min",
    label: "Hero damage per minute",
    higherIsBetter: true,
    weight: 1,
    value: perMinute((r) => r.playerDamage),
  },
  {
    metric: "boss_damage",
    label: "Objective damage",
    higherIsBetter: true,
    weight: 1.1,
    value: perMatch((r) => r.bossDamage),
  },
  {
    metric: "teammate_healing",
    label: "Teammate healing",
    higherIsBetter: true,
    weight: 1.2,
    value: perMatch((r) => r.teammateHealing),
  },
  {
    metric: "accuracy",
    label: "Accuracy",
    higherIsBetter: true,
    weight: 1.1,
    value: ratio(
      (r) => r.shotsHit,
      (r) => r.shotsHit + r.shotsMissed,
    ),
  },
  {
    metric: "crit_shot_rate",
    label: "Headshot rate",
    higherIsBetter: true,
    weight: 1.2,
    value: ratio(
      (r) => r.heroBulletsHitCrit,
      (r) => r.heroBulletsHit,
    ),
  },
];

export interface PercentileResult {
  metric: string;
  label: string;
  value: number;
  percentile: number;
  higherIsBetter: boolean;
  /** "Top N%": how few players do better. */
  topPercent: number;
  weight: number;
}

/**
 * Ranks a player's averages against per-match distributions. Averages vary less than single
 * matches, so this exaggerates extremes somewhat; acceptable for a Wrapped story.
 */
export function comparePlayer(rows: PlayerMatch[], metrics: StatMetrics): PercentileResult[] {
  if (rows.length === 0) return [];
  return PERCENTILE_STATS.flatMap((stat) => {
    const q = metrics[stat.metric];
    if (!q) return [];
    const value = stat.value(rows);
    const percentile = percentileOf(value, q);
    return [
      {
        metric: stat.metric,
        label: stat.label,
        value,
        percentile,
        higherIsBetter: stat.higherIsBetter,
        topPercent: stat.higherIsBetter ? 100 - percentile : percentile,
        weight: stat.weight,
      },
    ];
  });
}
