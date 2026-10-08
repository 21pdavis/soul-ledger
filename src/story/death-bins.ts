/**
 * Death-heatmap binning (ADR 0053): raw `[x, y]` death positions into a square grid of counts.
 * Pure, so the slide only draws what this returns.
 */

/**
 * Half-width of the square the grid covers. In the recorded fixture
 * (tests/fixtures/api/bulk-metadata.json) x runs from about -8,960 to 9,106 and y from about
 * -10,169 to 10,285, so this leaves a little margin.
 */
export const DEATH_BOUND = 10_500;
export const DEATH_GRID = 10;

export interface DeathBins {
  cols: number;
  rows: number;
  bound: number;
  /** Row-major counts: `counts[row * cols + col]`. Row 0 holds the lowest y values. */
  counts: number[];
  /** Points that landed in a cell. */
  total: number;
  /** Points outside the grid (or not finite), left out rather than clamped onto an edge cell. */
  skipped: number;
}

export interface HotCell {
  col: number;
  row: number;
  count: number;
}

export interface BinOptions {
  cols?: number;
  rows?: number;
  bound?: number;
}

/** Index of the cell holding `v`: lower edges inclusive, the top edge of the range in the last cell. */
function cellIndex(v: number, bound: number, cells: number): number | null {
  if (!Number.isFinite(v) || v < -bound || v > bound) return null;
  return Math.min(cells - 1, Math.floor(((v + bound) / (2 * bound)) * cells));
}

export function binDeaths(
  points: readonly (readonly [number, number])[],
  { cols = DEATH_GRID, rows = DEATH_GRID, bound = DEATH_BOUND }: BinOptions = {},
): DeathBins {
  const counts = new Array<number>(cols * rows).fill(0);
  let total = 0;
  let skipped = 0;
  for (const [x, y] of points) {
    const col = cellIndex(x, bound, cols);
    const row = cellIndex(y, bound, rows);
    if (col === null || row === null) {
      skipped++;
      continue;
    }
    counts[row * cols + col]++;
    total++;
  }
  return { cols, rows, bound, counts, total, skipped };
}

/** The cell with the most deaths (the first in row order on a tie), or null with no deaths. */
export function hottestCell(bins: DeathBins): HotCell | null {
  let best: HotCell | null = null;
  bins.counts.forEach((count, i) => {
    if (count > 0 && (!best || count > best.count)) {
      best = { col: i % bins.cols, row: Math.floor(i / bins.cols), count };
    }
  });
  return best;
}
