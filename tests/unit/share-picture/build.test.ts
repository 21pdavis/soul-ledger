import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import {
  PICTURE_HEIGHT,
  PICTURE_WIDTH,
  SITE_ADDRESS,
  buildSlidePicture,
  type PictureAssets,
  drawableName,
  type PictureInput,
} from "@/share-picture/build";
import { SLIDES, noDeathMapLine, summaryHeroPool } from "@/story/copy";
import type { StoryData } from "@/story/types";
import { fixtureStory } from "../../fixtures/story";

/** The text of a picture, one string per text node, and every image source in it. */
function read(node: ReactNode): { texts: string[]; images: string[]; svgs: number } {
  const out = { texts: [] as string[], images: [] as string[], svgs: 0 };
  const walk = (n: ReactNode) => {
    if (n === null || n === undefined || typeof n === "boolean") return;
    if (typeof n === "string" || typeof n === "number") {
      out.texts.push(String(n));
      return;
    }
    if (Array.isArray(n)) return n.forEach(walk);
    const el = n as { type: unknown; props: { children?: ReactNode; src?: string } };
    if (typeof el.type !== "string") throw new Error("pictures use only host elements");
    if (el.type === "img" && el.props.src) out.images.push(el.props.src);
    if (el.type === "svg") out.svgs++;
    walk(el.props.children);
  };
  walk(node);
  return out;
}

const assets: PictureAssets = {
  still: "data:image/jpeg;base64,STILL",
  heroCard: (id) => `data:image/png;base64,HERO${id}`,
};

const base: Omit<PictureInput, "index"> = {
  story: fixtureStory(),
  meta: { window: "all", patchStart: null, stale: false },
  playerName: "Gaben",
  sharedAt: "2026-11-11T09:30:00.000Z",
  assets,
};

const textOf = (index: number, over: Partial<PictureInput> = {}) =>
  read(buildSlidePicture({ ...base, index, ...over })).texts.join(" | ");

describe("buildSlidePicture", () => {
  it("is a 9:16 picture", () => {
    expect(PICTURE_WIDTH / PICTURE_HEIGHT).toBeCloseTo(9 / 16, 5);
  });

  it.each(SLIDES.map((s, i) => [s.id, i, s.headline] as const))(
    "%s has its headline, the player and the footer",
    (_id, index, headline) => {
      const text = textOf(index);
      expect(text).toContain(headline);
      expect(text).toContain("Gaben");
      expect(text).toContain("Soul Ledger");
      expect(text).toContain(SITE_ADDRESS);
      expect(text).toContain("Shared Nov 11, 2026");
    },
  );

  it("puts the still behind every slide", () => {
    for (let i = 0; i < SLIDES.length; i++) {
      expect(read(buildSlidePicture({ ...base, index: i })).images).toContain(assets.still);
    }
  });

  it("rejects a slide that does not exist", () => {
    expect(() => buildSlidePicture({ ...base, index: 11 })).toThrow(/slide/i);
    expect(() => buildSlidePicture({ ...base, index: -1 })).toThrow(/slide/i);
  });

  it("intro: matches, hours and the window", () => {
    const text = textOf(0);
    expect(text).toContain("120");
    expect(text).toContain("85");
    expect(text).toContain("All time");
    const patch = textOf(0, {
      meta: { window: "patch", patchStart: "2026-09-30T00:00:00.000Z", stale: false },
    });
    expect(patch).toContain("Since patch Sep 30, 2026");
  });

  it("main: hero name, win rate and card art", () => {
    const { texts, images } = read(buildSlidePicture({ ...base, index: 1 }));
    expect(texts.join(" | ")).toContain("Infernus");
    expect(texts.join(" | ")).toContain("60%");
    expect(images).toContain("data:image/png;base64,HERO1");
  });

  it("roster: heroes played and the top heroes", () => {
    const text = textOf(2);
    expect(text).toContain("9");
    expect(text).toContain("Infernus");
    expect(text).toContain("Seven");
    expect(text).toContain("Flex");
  });

  it("scavenger: the three counts", () => {
    const text = textOf(3);
    expect(text).toContain("1,800");
    expect(text).toContain("42");
    expect(text).toContain("77");
  });

  it("kills: the total and the kill types", () => {
    const text = textOf(4);
    expect(text).toContain("1,500");
    expect(text).toContain("Bullets");
    expect(text).toContain("Abilities");
  });

  it("precision: accuracy, headshot rate and the parry badge", () => {
    const text = textOf(5);
    expect(text).toContain("46%");
    expect(text).toContain("19%");
    expect(text).toContain("Parry king");
  });

  it("mid boss: the claimed count and the stolen line", () => {
    const text = textOf(6);
    expect(text).toContain("12");
    expect(text).toContain("Stolen by your team: 2");
  });

  it("roast: the death total and the worst night", () => {
    const text = textOf(7);
    expect(text).toContain("1,100");
    expect(text).toContain("Worst night: 21 deaths as Infernus");
  });

  describe("roast branches", () => {
    const roastWith = (roast: Partial<StoryData["roast"]>) =>
      fixtureStory({ roast: { ...fixtureStory().roast, ...roast } });
    const pictureOf = (story: StoryData) => read(buildSlidePicture({ ...base, index: 7, story }));

    it("with death positions: draws the map and the hotspot line beside it", () => {
      const { texts, svgs } = pictureOf(fixtureStory());
      expect(svgs).toBe(1);
      expect(texts.join(" | ")).toContain("You died here 2 times");
    });

    it("without positions: no map and no hotspot line", () => {
      const { texts, svgs } = pictureOf(roastWith({ deathPositions: [] }));
      expect(svgs).toBe(0);
      expect(texts.join(" | ")).not.toContain("You died here");
      expect(texts.join(" | ")).toContain(noDeathMapLine(1100));
    });

    it("with zero deaths: friendly line, no map, no worst night", () => {
      const { texts, svgs } = pictureOf(
        roastWith({
          deaths: 0,
          deathPositions: [],
          worstMatch: { matchId: 1, heroId: 1, deaths: 0 },
        }),
      );
      expect(svgs).toBe(0);
      expect(texts.join(" | ")).toContain(noDeathMapLine(0));
      expect(texts.join(" | ")).not.toContain("Worst night");
    });
  });

  it("rank: the current rank and the climb line", () => {
    const text = textOf(8);
    expect(text).toContain("Oracle 1");
    expect(text).toContain("You started at");
  });

  it("mvp: the signature stat", () => {
    const text = textOf(9);
    expect(text).toContain("Melee kills");
    expect(text).toContain("0.5");
    expect(text).toContain("of Infernus players");
  });

  it("summary: the ledger lines and the hero pool", () => {
    const text = textOf(10);
    expect(text).toContain("Matches");
    expect(text).toContain("Current rank");
    expect(text).toContain("Oracle 1");
    expect(text).toContain("Hero pool: 9 heroes");
  });

  it("summary: a tile for each top hero, with name and win rate", () => {
    const { texts, images } = read(buildSlidePicture({ ...base, index: 10 }));
    const pool = summaryHeroPool(base.story)!;
    expect(pool.heroes.length).toBeGreaterThan(0);
    for (const h of pool.heroes) {
      expect(texts).toContain(h.name);
      expect(texts).toContain(h.winRate);
      expect(images).toContain(`data:image/png;base64,HERO${h.heroId}`);
    }
    const noArt = read(
      buildSlidePicture({ ...base, index: 10, assets: { ...assets, heroCard: () => null } }),
    );
    expect(noArt.images).toEqual([assets.still]);
  });

  describe("drawableName", () => {
    const CYRILLIC = "\u0418\u0433\u043e\u0440\u044c";
    const GREEK = "\u0395\u03bb\u03ad\u03bd\u03b7";
    const JAPANESE = "\u5c71\u7530\u592a\u90ce";

    it.each([
      ["Gaben", "Gaben"],
      [`${CYRILLIC}_99`, `${CYRILLIC}_99`],
      [GREEK, GREEK],
      ["Zo\u00eb \u0141ukasz", "Zo\u00eb \u0141ukasz"],
    ])("keeps %s, which the fonts can draw", (name, shown) => {
      expect(drawableName(name)).toBe(shown);
    });

    it("keeps accents on names stored in decomposed form", () => {
      expect(drawableName("Zoë")).toBe("Zoë");
      expect(drawableName(GREEK.normalize("NFD"))).toBe(GREEK);
    });

    it("drops characters no font draws, so no empty boxes", () => {
      expect(drawableName("Gaben \u5c71\u7530 \u2605")).toBe("Gaben");
    });

    it("falls back to a plain label when nothing is drawable", () => {
      expect(drawableName(JAPANESE)).toBe("A Soul Ledger player");
      expect(drawableName("  ")).toBe("A Soul Ledger player");
    });

    it("is what the picture shows as the player name", () => {
      expect(textOf(0, { playerName: JAPANESE })).toContain("A Soul Ledger player");
      expect(textOf(0, { playerName: CYRILLIC })).toContain(CYRILLIC);
    });
  });

  it("falls back to a monogram when a hero has no art", () => {
    const noArt: PictureAssets = { ...assets, heroCard: () => null };
    const main = read(buildSlidePicture({ ...base, index: 1, assets: noArt }));
    expect(main.images).toEqual([noArt.still]);
    expect(main.texts).toContain("IN");
    const roster = read(buildSlidePicture({ ...base, index: 2, assets: noArt }));
    expect(roster.texts).toContain("SE");
  });

  it("copes with empty data on every slide", () => {
    const empty = fixtureStory({
      main: null,
      mvp: null,
      percentiles: [],
      nemesis: null,
      roster: { heroesPlayed: 0, label: "flex", recent: null, topHeroes: [] },
      rank: { journey: [], current: null },
      roast: { deaths: 0, deathPositions: [], worstMatch: null },
      midBoss: { claimed: 0, stolen: 0 },
      precision: {
        heroAccuracy: 0,
        headshotRate: 0,
        parrySuccess: 0,
        parryMiss: 0,
        parryLabel: "none",
      },
    });
    for (let i = 0; i < SLIDES.length; i++) {
      expect(textOf(i, { story: empty })).toContain(SLIDES[i].headline);
    }
  });
});
