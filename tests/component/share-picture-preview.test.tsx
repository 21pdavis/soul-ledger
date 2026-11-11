import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import {
  PREVIEW_HEIGHT,
  PREVIEW_WIDTH,
  buildLinkPreview,
  type PreviewInput,
} from "@/share-picture/preview";
import type { PictureAssets } from "@/share-picture/build";
import { monogramFor } from "@/story/monogram";
import { heroName } from "@/story/heroes";
import { rankLabel } from "@/story/ranks";
import { fixtureStory } from "../fixtures/story";

function read(node: ReactNode): { texts: string[]; images: string[] } {
  const out = { texts: [] as string[], images: [] as string[] };
  const walk = (n: ReactNode) => {
    if (n === null || n === undefined || typeof n === "boolean") return;
    if (typeof n === "string" || typeof n === "number") return void out.texts.push(String(n));
    if (Array.isArray(n)) return n.forEach(walk);
    const el = n as { type: unknown; props: { children?: ReactNode; src?: string } };
    if (typeof el.type !== "string") throw new Error("only host elements");
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
const base: PreviewInput = { story: fixtureStory(), playerName: "Gaben", assets };
const draw = (over: Partial<PreviewInput> = {}) => read(buildLinkPreview({ ...base, ...over }));

describe("buildLinkPreview", () => {
  it("is the 1200x630 link-preview size", () => {
    expect([PREVIEW_WIDTH, PREVIEW_HEIGHT]).toEqual([1200, 630]);
  });

  it("shows the player, matches, main hero and rank over the city still", () => {
    const { story } = base;
    const { texts, images } = draw();
    const all = texts.join(" | ");
    expect(all).toContain("Gaben");
    expect(all).toContain(story.intro.matches.toLocaleString("en-US"));
    expect(all).toContain(heroName(story.main!.heroId));
    expect(all).toContain(rankLabel(story.rank.current!));
    expect(images).toContain(assets.still);
  });

  it("draws the main hero's art", () => {
    expect(draw().images).toContain(`data:image/png;base64,HERO${base.story.main!.heroId}`);
  });

  it("falls back to the monogram tile when the hero has no art", () => {
    const { texts, images } = draw({ assets: { ...assets, heroCard: () => null } });
    expect(images).toEqual([assets.still]);
    expect(texts).toContain(monogramFor(heroName(base.story.main!.heroId)));
  });

  it("drops what it can't draw from the name", () => {
    expect(draw({ playerName: "山田" }).texts.join(" ")).toContain("A Soul Ledger player");
  });

  it("copes with no main hero and no rank", () => {
    const story = fixtureStory();
    story.main = null;
    story.rank = { journey: [], current: null };
    const all = draw({ story }).texts.join(" | ");
    expect(all).toContain("Gaben");
    expect(all).not.toContain("undefined");
  });

  it("keeps the same right margin as the left, and lets the stats wrap, for the longest rank and names", () => {
    const story = fixtureStory();
    story.rank = {
      journey: [],
      current: { at: "2026-01-01", matchId: 1, badge: 116, tier: 11, subrank: 6 },
    };
    story.main = { ...story.main!, heroId: 99 };
    const tree = buildLinkPreview({
      ...base,
      story,
      playerName: "A Very Long Player Name",
    }) as ElementLike;
    const find = (n: unknown, pred: (e: ElementLike) => boolean): ElementLike | null => {
      if (!n || typeof n !== "object") return null;
      if (Array.isArray(n)) return n.map((c) => find(c, pred)).find(Boolean) ?? null;
      const el = n as ElementLike;
      if (pred(el)) return el;
      return find(el.props?.children, pred);
    };
    const overlay = find(tree, (e) => e.props?.style?.padding === 56)!;
    const column = find(
      overlay,
      (e) => e.props?.style?.flexDirection === "column" && e !== overlay,
    )!;
    const tile = 380;
    const { padding, gap } = overlay.props.style!;
    // Left margin is `padding`; the column must end `padding` short of the right edge.
    expect(padding! + tile + gap! + column.props.style!.width!).toBe(PREVIEW_WIDTH - padding!);
    const row = find(column, (e) => e.props?.style?.columnGap === 40)!;
    expect(row.props.style!.flexWrap).toBe("wrap");
    expect(draw({ story }).texts).toContain("Eternus 6");
  });
});

interface ElementLike {
  props: {
    children?: unknown;
    style?: {
      padding?: number;
      gap?: number;
      columnGap?: number;
      width?: number;
      flexDirection?: string;
      flexWrap?: string;
    };
  };
}
