import type { ReactElement } from "react";
import { CAMPS, CX, CY, LANES, NODES, R, diamond } from "@/components/story/slides/DeadlockMap";
import type { DeathBins, HotCell } from "@/story/death-bins";

/**
 * The death heatmap as a plain SVG for the share picture: the same stylised map and grid as the
 * live slide (DeathHeatmap.tsx), but with attributes instead of CSS classes, variables and blend
 * modes, which satori cannot draw. Row 0 of the bins is the lowest y, so rows are drawn bottom-up.
 */

const VIEW = 240;
const PAD = 20;
const BRASS = "#c9a24b";
const GREEN = "#4fb37c";
const RULE = "#3a3140";
const TEAL = "#5f7f82";

export function deathMapSvg(bins: DeathBins, hot: HotCell, size: number): ReactElement {
  const cell = (VIEW - PAD * 2) / bins.cols;
  const rowH = (VIEW - PAD * 2) / bins.rows;
  const x = (col: number) => PAD + col * cell;
  const y = (row: number) => PAD + (bins.rows - 1 - row) * rowH;
  const cells = bins.counts.flatMap((count, i) =>
    count > 0 ? [{ col: i % bins.cols, row: Math.floor(i / bins.cols), count }] : [],
  );

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${VIEW} ${VIEW}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="2"
        y="2"
        width={VIEW - 4}
        height={VIEW - 4}
        fill="#0d0b10"
        stroke={BRASS}
        strokeWidth="1.5"
      />
      <rect
        x="9"
        y="9"
        width={VIEW - 18}
        height={VIEW - 18}
        fill="none"
        stroke={RULE}
        strokeWidth="1"
      />
      <circle cx={CX} cy={CY} r={R} fill="#0e1a1c" stroke={RULE} strokeWidth="1" />
      {Object.entries(LANES).map(([lane, d]) => (
        <path
          key={lane}
          d={d}
          fill="none"
          stroke={TEAL}
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity="0.55"
        />
      ))}
      {CAMPS.map(([cx, cy]) => (
        <path
          key={`${cx}-${cy}`}
          d={`M${cx} ${cy - 3} L${cx + 3} ${cy + 2} L${cx - 3} ${cy + 2} Z`}
          fill={RULE}
        />
      ))}
      {NODES.map(([nx, ny, s]) => (
        <path
          key={`${nx}-${ny}`}
          d={diamond(nx, ny, s)}
          fill="#0e1a1c"
          stroke="#8fb0b2"
          strokeWidth="1.2"
        />
      ))}
      <path d={diamond(CX, CY, 11)} fill="none" stroke={BRASS} strokeWidth="1.2" opacity="0.8" />
      <path d="M104 38 A16 16 0 0 1 136 38 L128 38 A8 8 0 0 0 112 38 Z" fill="#c4553a" />
      <path d="M104 202 A16 16 0 0 0 136 202 L128 202 A8 8 0 0 1 112 202 Z" fill="#dfe7e4" />
      {cells.map(({ col, row, count }) => (
        <rect
          key={`${col}-${row}`}
          x={x(col) + 1}
          y={y(row) + 1}
          width={cell - 2}
          height={rowH - 2}
          fill={BRASS}
          fillOpacity={0.3 + 0.7 * Math.sqrt(count / hot.count)}
        />
      ))}
      <rect
        x={x(hot.col) - 1}
        y={y(hot.row) - 1}
        width={cell + 2}
        height={rowH + 2}
        fill="none"
        stroke={GREEN}
        strokeWidth="2"
      />
    </svg>
  );
}
