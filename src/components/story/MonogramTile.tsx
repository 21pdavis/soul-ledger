import { heroName } from "@/story/heroes";
import { monogramFor } from "@/story/monogram";
import styles from "./MonogramTile.module.css";

interface Props {
  heroId: number;
  size?: "lg" | "sm";
}

/**
 * A deco octagon tile with a hero's initials: the placeholder for hero art (ADR 0051). Decorative,
 * because the hero's name always sits next to it as real text.
 */
export function MonogramTile({ heroId, size = "sm" }: Props) {
  return (
    <span className={styles.tile} data-size={size} aria-hidden="true">
      <span className={styles.inner}>{monogramFor(heroName(heroId))}</span>
    </span>
  );
}
