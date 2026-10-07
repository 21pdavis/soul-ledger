import { describe, expect, it } from "vitest";
import type { Quantiles, StatMetrics } from "@/lib/deadlock-api/schemas";
import { comparePlayer, percentileOf, PERCENTILE_STATS } from "@/lib/stats/percentiles";
import { normalizePlayerMatch } from "@/lib/stats/normalize";
import { fixtureMatches } from "../helpers/fake-api";
import { fixtureJson, TEST_ACCOUNT_ID } from "../helpers/fixtures";

const q = (values: number[]): Quantiles => {
  const [p1, p5, p10, p25, p50, p75, p90, p95, p99] = values;
  return {
    avg: p50,
    std: 1,
    percentile1: p1,
    percentile5: p5,
    percentile10: p10,
    percentile25: p25,
    percentile50: p50,
    percentile75: p75,
    percentile90: p90,
    percentile95: p95,
    percentile99: p99,
  };
};

describe("percentileOf", () => {
  const linear = q([1, 5, 10, 25, 50, 75, 90, 95, 99]);

  it("hits the knots exactly", () => {
    expect(percentileOf(50, linear)).toBe(50);
    expect(percentileOf(90, linear)).toBe(90);
  });

  it("interpolates between knots", () => {
    expect(percentileOf(60, linear)).toBeCloseTo(60);
    expect(percentileOf(97, linear)).toBeCloseTo(97);
  });

  it("clamps outside the published range", () => {
    expect(percentileOf(0, linear)).toBe(0.5);
    expect(percentileOf(1000, linear)).toBe(99.5);
  });

  it("puts a value on a flat run of knots in the middle of the run", () => {
    // Half of all players heal teammates for 0.
    const healing = q([0, 0, 0, 0, 0, 100, 500, 900, 2000]);
    expect(percentileOf(0, healing)).toBe(25.5); // midpoint of the 1st..50th run
  });
});

describe("comparePlayer", () => {
  const metrics = fixtureJson<StatMetrics>("api/metrics-global.json");
  const rows = fixtureMatches()
    .filter((m) => m.game_mode === "Normal")
    .map((m) => normalizePlayerMatch(m, TEST_ACCOUNT_ID));

  it("only uses metrics the API actually returns", () => {
    for (const stat of PERCENTILE_STATS) expect(metrics).toHaveProperty(stat.metric);
  });

  it("scores the test account on every catalogued stat", () => {
    const result = comparePlayer(rows, metrics);
    expect(result.map((r) => r.metric).sort()).toEqual(
      PERCENTILE_STATS.map((s) => s.metric).sort(),
    );
    for (const r of result) {
      expect(r.percentile).toBeGreaterThanOrEqual(0.5);
      expect(r.percentile).toBeLessThanOrEqual(99.5);
      expect(r.topPercent).toBeCloseTo(r.higherIsBetter ? 100 - r.percentile : r.percentile);
    }
  });

  it("averages per match and computes rates from totals", () => {
    const result = comparePlayer(rows, metrics);
    const kills = result.find((r) => r.metric === "kills")!;
    expect(kills.value).toBeCloseTo(rows.reduce((s, r) => s + r.kills, 0) / rows.length);

    const accuracy = result.find((r) => r.metric === "accuracy")!;
    const hit = rows.reduce((s, r) => s + r.shotsHit, 0);
    const missed = rows.reduce((s, r) => s + r.shotsMissed, 0);
    expect(accuracy.value).toBeCloseTo(hit / (hit + missed));
  });

  it("skips metrics missing from the response", () => {
    const withoutKills = { ...metrics };
    delete withoutKills.kills;
    expect(comparePlayer(rows, withoutKills).some((r) => r.metric === "kills")).toBe(false);
  });

  it("returns nothing for no matches", () => {
    expect(comparePlayer([], metrics)).toEqual([]);
  });
});
