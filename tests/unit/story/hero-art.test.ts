import { readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { FALLBACK_CARD_SRC, heroCardSrc, heroFigure, HEROES_WITH_CARD } from "@/story/hero-art";
import { existsSync } from "node:fs";

describe("hero cut-out art", () => {
  it("lists exactly the cards that exist in public/heroes", () => {
    const onDisk = readdirSync("public/heroes")
      .map((f) => /^(\d+)-card\.webp$/.exec(f)?.[1])
      .filter((x): x is string => !!x)
      .map(Number)
      .sort((a, b) => a - b);
    expect([...HEROES_WITH_CARD].sort((a, b) => a - b)).toEqual(onDisk);
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

describe("card or model (ADR 0068)", () => {
  it("shows the card for every hero while there are no models", () => {
    expect(heroFigure(1)).toBe("card");
    expect(heroFigure(9999)).toBe("card");
  });

  it("switches to the model once one exists for that hero", () => {
    expect(heroFigure(1, new Set([1]))).toBe("model");
    expect(heroFigure(2, new Set([1]))).toBe("card");
  });
});
