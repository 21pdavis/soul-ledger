import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { SLIDES } from "@/story/copy";
import { HEROES_WITH_CARD, heroCardSrc } from "@/story/hero-art";
import {
  PICTURE_HEIGHT,
  PICTURE_WIDTH,
  buildSlidePicture,
  type PictureAssets,
  type PictureInput,
} from "./build";

const PUBLIC = path.join(process.cwd(), "public");
const MIME: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

const cache = new Map<string, Promise<Buffer>>();
/** Files under public/, read once per process. */
function load(relative: string): Promise<Buffer> {
  let hit = cache.get(relative);
  if (!hit) {
    hit = readFile(path.join(PUBLIC, relative));
    cache.set(relative, hit);
  }
  return hit;
}

async function dataUri(relative: string): Promise<string> {
  const ext = relative.split(".").pop()!;
  return `data:${MIME[ext]};base64,${(await load(relative)).toString("base64")}`;
}

/**
 * A hero card as a PNG data URI. The cards are WebP, which satori cannot read, so they are
 * converted (and capped at 512px, the biggest the picture draws them) once per process.
 */
const cardCache = new Map<number, Promise<string>>();
function cardDataUri(heroId: number): Promise<string> {
  let hit = cardCache.get(heroId);
  if (!hit) {
    hit = load(heroCardSrc(heroId).slice(1))
      .then((webp) => sharp(webp).resize(512, 512, { fit: "inside" }).png().toBuffer())
      .then((png) => `data:image/png;base64,${png.toString("base64")}`);
    cardCache.set(heroId, hit);
  }
  return hit;
}

/** Where a slide's city still lives (see scripts/capture-city-stills.ts). */
export const stillPath = (slideId: string) => `share/stills/${slideId}.jpg`;

/** The art for one picture: its still, and the card of every hero it might show. */
async function loadAssets(input: Pick<PictureInput, "story" | "index">): Promise<PictureAssets> {
  const ids = new Set<number>();
  const { story } = input;
  if (story.main) ids.add(story.main.heroId);
  story.roster.topHeroes.forEach((h) => ids.add(h.heroId));
  const cards = new Map<number, string>();
  await Promise.all(
    [...ids]
      .filter((id) => HEROES_WITH_CARD.has(id))
      .map(async (id) => cards.set(id, await cardDataUri(id))),
  );
  return {
    still: await dataUri(stillPath(SLIDES[input.index].id)),
    heroCard: (id) => cards.get(id) ?? null,
  };
}

const FONTS = [
  "share/fonts/Limelight-Regular.ttf",
  "share/fonts/SpaceGrotesk-Regular.woff",
] as const;

/**
 * Draws one slide of a story as a 1080x1920 PNG and returns its bytes. The caller decides what to
 * do with them (a later PR serves them from the share page).
 */
export async function renderSlidePicture(
  input: Omit<PictureInput, "assets">,
): Promise<ArrayBuffer> {
  const [assets, limelight, grotesk] = await Promise.all([
    loadAssets(input),
    load(FONTS[0]),
    load(FONTS[1]),
  ]);
  const response = new ImageResponse(buildSlidePicture({ ...input, assets }), {
    width: PICTURE_WIDTH,
    height: PICTURE_HEIGHT,
    fonts: [
      { name: "Limelight", data: toArrayBuffer(limelight), weight: 400, style: "normal" },
      { name: "Space Grotesk", data: toArrayBuffer(grotesk), weight: 400, style: "normal" },
    ],
  });
  return response.arrayBuffer();
}

function toArrayBuffer(b: Buffer): ArrayBuffer {
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
}
