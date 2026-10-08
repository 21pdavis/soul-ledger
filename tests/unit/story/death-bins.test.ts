import { describe, expect, it } from "vitest";
import { DEATH_BOUND, binDeaths, hottestCell } from "@/story/death-bins";

const opts = { cols: 4, rows: 4, bound: 100 };
const at = (bins: ReturnType<typeof binDeaths>, col: number, row: number) =>
  bins.counts[row * bins.cols + col];

describe("binDeaths", () => {
  it("returns an empty grid and no hottest cell for empty input", () => {
    const bins = binDeaths([], opts);
    expect(bins.cols).toBe(4);
    expect(bins.rows).toBe(4);
    expect(bins.counts).toHaveLength(16);
    expect(bins.counts.every((c) => c === 0)).toBe(true);
    expect(bins.total).toBe(0);
    expect(bins.skipped).toBe(0);
    expect(hottestCell(bins)).toBeNull();
  });

  it("puts a single point in one cell, which is then the hottest", () => {
    // Cells are 50 wide; x=-10 is column 1, y=60 is row 3 (rows run from low y to high y).
    const bins = binDeaths([[-10, 60]], opts);
    expect(at(bins, 1, 3)).toBe(1);
    expect(bins.total).toBe(1);
    expect(hottestCell(bins)).toEqual({ col: 1, row: 3, count: 1 });
  });

  it("counts several points in one cell and reports that count as the hottest", () => {
    const bins = binDeaths(
      [
        [10, 10],
        [12, 11],
        [40, 49],
        [-90, -90],
      ],
      opts,
    );
    expect(hottestCell(bins)).toEqual({ col: 2, row: 2, count: 3 });
    expect(at(bins, 0, 0)).toBe(1);
  });

  it("puts a point on an inner cell border into the higher cell", () => {
    const bins = binDeaths([[0, 50]], opts);
    expect(at(bins, 2, 3)).toBe(1);
    expect(bins.total).toBe(1);
  });

  it("includes both outer edges of the range, the upper one in the last cell", () => {
    const bins = binDeaths(
      [
        [-100, -100],
        [100, 100],
      ],
      opts,
    );
    expect(at(bins, 0, 0)).toBe(1);
    expect(at(bins, 3, 3)).toBe(1);
    expect(bins.skipped).toBe(0);
  });

  it("skips out-of-range and non-finite points instead of clamping them", () => {
    const bins = binDeaths(
      [
        [101, 0],
        [0, -100.01],
        [Number.NaN, 0],
        [0, Number.POSITIVE_INFINITY],
        [20, 20],
      ],
      opts,
    );
    expect(bins.total).toBe(1);
    expect(bins.skipped).toBe(4);
  });

  it("breaks a tie for hottest by the first cell in row order", () => {
    const bins = binDeaths(
      [
        [60, -90],
        [-90, 60],
      ],
      opts,
    );
    expect(hottestCell(bins)).toEqual({ col: 3, row: 0, count: 1 });
  });

  it("defaults to a square grid that covers the real map extent", () => {
    const bins = binDeaths([[8234.5, -8653]]);
    expect(bins.cols).toBe(bins.rows);
    expect(DEATH_BOUND).toBeGreaterThan(10_285);
    expect(bins.skipped).toBe(0);
    expect(bins.total).toBe(1);
  });
});
