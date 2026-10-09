import styles from "./RoastSlide.module.css";

/**
 * A stylised Deadlock map for the death heatmap, drawn in the 240-unit plot space (the 200-unit
 * square inside the deco frame). World x runs left to right and world y bottom to top, so the
 * bases sit at the top and bottom and the three lanes run between them, as on the in-game minimap.
 * Decoration only: the plot's title and description carry the meaning.
 */

const CX = 120;
const CY = 120;
const R = 96;

/** Lane centre-lines, base to base. The side lanes bow out to match where deaths actually land. */
const LANES = {
  left: "M120 40 L84 54 L52 84 L50 104 L50 136 L52 156 L84 186 L120 200",
  mid: "M120 40 L120 200",
  right: "M120 40 L156 54 L188 84 L190 104 L190 136 L188 156 L156 186 L120 200",
} as const;

/** Objective diamonds along the lanes: [x, y, size]. */
const NODES: readonly (readonly [number, number, number])[] = [
  [120, 64, 5],
  [120, 176, 5],
  [120, 92, 4],
  [120, 148, 4],
  [66, 70, 4.5],
  [50, 120, 5.5],
  [66, 170, 4.5],
  [174, 70, 4.5],
  [190, 120, 5.5],
  [174, 170, 4.5],
];

/** Small jungle marks scattered between the lanes. */
const CAMPS: readonly (readonly [number, number])[] = [
  [86, 96],
  [86, 144],
  [154, 96],
  [154, 144],
  [102, 80],
  [138, 80],
  [102, 160],
  [138, 160],
  [72, 120],
  [168, 120],
];

const diamond = (x: number, y: number, s: number) =>
  `M${x} ${y - s} L${x + s} ${y} L${x} ${y + s} L${x - s} ${y} Z`;

export function DeadlockMap() {
  return (
    <g data-map aria-hidden="true">
      <circle cx={CX} cy={CY} r={R} className={styles.mapDisc} />
      <circle cx={CX} cy={CY} r={R - 5} className={styles.mapRing} />

      <g className={styles.mapCamps}>
        {CAMPS.map(([x, y]) => (
          <path key={`${x}-${y}`} d={`M${x} ${y - 3} L${x + 3} ${y + 2} L${x - 3} ${y + 2} Z`} />
        ))}
      </g>

      {(Object.keys(LANES) as (keyof typeof LANES)[]).map((lane) => (
        <path key={lane} data-lane={lane} d={LANES[lane]} className={styles.mapLane} />
      ))}

      {/* The mid boss pit. */}
      <path d={diamond(CX, CY, 11)} className={styles.mapPit} />
      <circle cx={CX} cy={CY} r={3} className={styles.mapPitCore} />

      <g className={styles.mapNodes}>
        {NODES.map(([x, y, s]) => (
          <path key={`${x}-${y}`} d={diamond(x, y, s)} />
        ))}
      </g>

      {/* The two bases: the far one warm, the near one cool, like the minimap. */}
      <path
        data-base="top"
        d="M104 38 A16 16 0 0 1 136 38 L128 38 A8 8 0 0 0 112 38 Z"
        className={styles.mapBaseTop}
      />
      <path
        data-base="bottom"
        d="M104 202 A16 16 0 0 0 136 202 L128 202 A8 8 0 0 1 112 202 Z"
        className={styles.mapBaseBottom}
      />
    </g>
  );
}
