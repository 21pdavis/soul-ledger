import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import {
  PICTURE_HEIGHT,
  PICTURE_WIDTH,
  SITE_ADDRESS,
  buildSlidePicture,
  type PictureAssets,
  type PictureInput,
} from "@/share-picture/build";
import { SLIDES } from "@/story/copy";
import { fixtureStory } from "../../fixtures/story";

/** The text of a picture, one string per text node, and every image source in it. */
function read(node: ReactNode): { texts: string[]; images: string[] } {
  const out = { texts: [] as string[], images: [] as string[] };
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
