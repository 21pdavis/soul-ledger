"use client";

import { useState, type ReactNode } from "react";
import { MonogramTile } from "./MonogramTile";
import styles from "./MonogramTile.module.css";

/** Where a hero’s art lives (see scripts/fetch-hero-art.mjs): the card at "lg", the small icon at "sm". */
export const heroArtSrc = (heroId: number, size: "lg" | "sm") =>
  `/heroes/${heroId}-${size === "lg" ? "card" : "sm"}.webp`;

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
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const src = heroArtSrc(heroId, size);
  if (failedSrc === src) return <MonogramTile heroId={heroId} size={size} />;
  return (
    <span className={styles.tile} data-size={size} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size local webp files */}
      <img className={styles.art} src={src} alt="" onError={() => setFailedSrc(src)} />
    </span>
  );
}

/**
 * Just the hero’s image, for places that draw their own frame. Shows `fallback` (usually the
 * initials) if the image fails. Decorative, like HeroTile.
 */
export function HeroArt({
  heroId,
  size = "sm",
  className,
  fallback,
}: Props & { className?: string; fallback: ReactNode }) {
  const src = heroArtSrc(heroId, size);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (failedSrc === src) return <>{fallback}</>;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- fixed-size local webp files
    <img className={className} src={src} alt="" onError={() => setFailedSrc(src)} />
  );
}
