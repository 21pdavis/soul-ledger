/* eslint-disable @next/next/no-img-element -- satori draws plain <img>, not next/image */
import type { ReactElement } from "react";
import { matchesUnit } from "@/story/copy";
import { heroName } from "@/story/heroes";
import { rankLabel } from "@/story/ranks";
import type { StoryData } from "@/story/types";
import {
  BODY,
  C,
  DISPLAY,
  SITE_ADDRESS,
  box,
  count,
  drawableName,
  heroTile,
  text,
  type PictureAssets,
} from "./build";

/**
 * The wide picture a chat app or social site shows when a share link is pasted (ADR 0079):
 * the player, their main hero's art, matches, main and rank, over the city. Pure, like the slide
 * pictures, and built from the same pieces, so it keeps their fonts, palette and name handling.
 */

export const PREVIEW_WIDTH = 1200;
export const PREVIEW_HEIGHT = 630;

export interface PreviewInput {
  story: StoryData;
  playerName: string;
  assets: PictureAssets;
}

const stat = (value: string, label: string): ReactElement =>
  box({ flexDirection: "column", gap: 4 }, [
    text({ fontFamily: DISPLAY, fontSize: 44, color: C.brass, lineHeight: 1.1 }, value),
    text({ fontSize: 26, color: C.muted }, label),
  ]);

export function buildLinkPreview({ story, playerName, assets }: PreviewInput): ReactElement {
  const { main } = story;
  const rank = story.rank.current ? rankLabel(story.rank.current) : null;
  const matches = story.intro.matches;
  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        width: PREVIEW_WIDTH,
        height: PREVIEW_HEIGHT,
        background: C.ink,
        fontFamily: BODY,
      }}
    >
      <img
        src={assets.still}
        width={PREVIEW_WIDTH}
        height={PREVIEW_HEIGHT}
        alt=""
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: PREVIEW_WIDTH,
          height: PREVIEW_HEIGHT,
          objectFit: "cover",
        }}
      />
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 0,
          left: 0,
          width: PREVIEW_WIDTH,
          height: PREVIEW_HEIGHT,
          backgroundImage:
            "linear-gradient(90deg, rgba(13,11,16,0.9) 0%, rgba(13,11,16,0.55) 100%)",
        }}
      />
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 0,
          left: 0,
          width: PREVIEW_WIDTH,
          height: PREVIEW_HEIGHT,
          padding: 56,
          gap: 56,
          alignItems: "center",
        }}
      >
        {main ? heroTile(main.heroId, 380, assets) : null}
        <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, gap: 28 }}>
          {text({ fontSize: 30, color: C.brass, letterSpacing: 4 }, "SOUL LEDGER")}
          {text({ fontFamily: DISPLAY, fontSize: 76, lineHeight: 1.1 }, drawableName(playerName))}
          <div style={{ display: "flex", gap: 40 }}>
            {stat(count(matches), matchesUnit(matches))}
            {main ? stat(heroName(main.heroId), "main hero") : null}
            {rank ? stat(rank, "rank") : null}
          </div>
          {text({ fontSize: 26, color: C.muted }, SITE_ADDRESS)}
        </div>
      </div>
    </div>
  );
}
