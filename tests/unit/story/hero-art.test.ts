import { existsSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { FALLBACK_CARD_SRC, heroArtPath, heroCardSrc, HEROES_WITH_CARD } from "@/story/hero-art";

describe("hero cut-out art", () => {
  it("lists exactly the cards that exist in public/heroes", () => {
    const onDisk = readdirSync("public/heroes")
      .map((f) => /^(\d+)-card\.webp$/.exec(f)?.[1])
      .filter((x): x is string => !!x)
      .map(Number)
      .sort((a, b) => a - b);
    expect([...HEROES_WITH_CARD].sort((a, b) => a - b)).toEqual(onDisk);
  });

  it("builds the art path for the card and the small icon", () => {
    expect(heroArtPath(7, "lg")).toBe("/heroes/7-card.webp");
    expect(heroArtPath(7, "sm")).toBe("/heroes/7-sm.webp");
  });

  it("points a hero with a card at it", () => {
    expect(heroCardSrc(1)).toBe("/heroes/1-card.webp");
  });

  it("gives a hero without a card (or an unknown id) the generic silhouette", () => {
    expect(heroCardSrc(38)).toBe(FALLBACK_CARD_SRC);
    expect(heroCardSrc(9999)).toBe(FALLBACK_CARD_SRC);
  });

  it("ships the silhouette file", () => {
    expect(existsSync(`public${FALLBACK_CARD_SRC}`)).toBe(true);
  });
});
