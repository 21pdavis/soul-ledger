"use client";

import { useState } from "react";
import { heroImageUrl } from "@/story/hero-images";
import { heroName } from "@/story/heroes";
import { monogramFor } from "@/story/monogram";
import styles from "./MonogramTile.module.css";

interface Props {
  heroId: number;
  size?: "lg" | "sm";
}

/**
 * A deco octagon tile showing a hero's art (ADR 0064), with the hero's initials underneath as the
 * fallback while it loads, when it fails, or when the hero has no image (ADR 0051). Decorative,
 * because the hero's name always sits next to it as real text (ADR 0054), so the image has empty alt.
 */
export function MonogramTile({ heroId, size = "sm" }: Props) {
  const url = heroImageUrl(heroId);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = url !== null && failedUrl !== url;
  return (
    <span className={styles.tile} data-size={size} aria-hidden="true">
      <span className={styles.inner}>{monogramFor(heroName(heroId))}</span>
      {showImage && (
        // Hotlinked decorative art in a fixed-size frame: next/image's optimiser adds nothing here.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className={styles.art}
          src={url}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailedUrl(url)}
        />
      )}
    </span>
  );
}
