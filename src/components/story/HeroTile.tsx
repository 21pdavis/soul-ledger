"use client";

import { useState } from "react";
import { MonogramTile } from "./MonogramTile";
import styles from "./MonogramTile.module.css";

interface Props {
  heroId: number;
  size?: "lg" | "sm";
}

/**
 * A hero's art in the deco octagon (ADR 0060): the card at the large size, the small icon at the
 * small one, served from public/heroes (see scripts/fetch-hero-art.mjs). Decorative, because the
 * hero's name always sits next to it as real text. Heroes with no art, or art that fails to load,
 * get the monogram tile instead.
 */
export function HeroTile({ heroId, size = "sm" }: Props) {
  const [failed, setFailed] = useState(false);
  if (failed) return <MonogramTile heroId={heroId} size={size} />;
  return (
    <span className={styles.tile} data-size={size} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size local webp files */}
      <img
        className={styles.art}
        src={`/heroes/${heroId}-${size === "lg" ? "card" : "sm"}.webp`}
        alt=""
        onError={() => setFailed(true)}
      />
    </span>
  );
}
