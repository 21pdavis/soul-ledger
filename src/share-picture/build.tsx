/* eslint-disable @next/next/no-img-element -- satori draws plain <img>, not next/image */
import type { CSSProperties, ReactElement, ReactNode } from "react";
import {
  KILLS_COPY,
  MAIN_COPY,
  MENTIONS_HEADING,
  PRECISION_COPY,
  ROSTER_COPY,
  SCAVENGER_COPY,
  SLIDES,
  INTRO_COPY,
  deathsLabel,
  formatLedgerDate,
  headlineFor,
  hotspotLine,
  killsTotalLabel,
  mainPercentileLine,
  matchesUnit,
  midBossCopy,
  mvpCopy,
  mvpMentions,
  noDeathMapLine,
  nemesisKillsLine,
  parryCopy,
  parryKingLine,
  rankSummary,
  rosterVerdict,
  summaryHeroPool,
  summaryRows,
  worstMatchLine,
  type SlideId,
} from "@/story/copy";
import { deathMapSvg } from "./death-map";
import { binDeaths, hottestCell } from "@/story/death-bins";
import { formatHours, formatPatchDate, formatPercent } from "@/story/format";
import { heroName } from "@/story/heroes";
import { killRows } from "@/story/kill-shares";
import { monogramFor } from "@/story/monogram";
import { journeyMilestones } from "@/story/rank-journey";
import { rankLabel } from "@/story/ranks";
import type { StoryData, StoryMeta } from "@/story/types";
import { basedOnMatches, windowLabel } from "@/story/window-label";

/**
 * One slide of a story as a tall flat picture for sharing (ADR 0079): a designed card over a
 * fixed city still, not a screenshot of the live page. Pure: story in, element tree out. The tree
 * uses only plain host elements and inline styles within satori's CSS subset (flexbox, no grid,
 * no CSS variables), so `next/og` can draw it. Wording comes from `@/story/copy`, so the picture
 * says what the live slide says.
 */

export const PICTURE_WIDTH = 1080;
export const PICTURE_HEIGHT = 1920;
export const SITE_ADDRESS = "soul-ledger.onrender.com";

/** The palette from tokens.css; satori has no CSS variables. */
const C = {
  ink: "#0d0b10",
  panel: "#17131c",
  bone: "#ece6d8",
  muted: "#a9a293",
  brass: "#c9a24b",
  green: "#4fb37c",
  rule: "#3a3140",
};

export interface PictureAssets {
  /** The city still behind the slide, as something the renderer can load (a data URI). */
  still: string;
  /** A hero's card art, or null when there is none: the picture then draws a monogram tile. */
  heroCard: (heroId: number) => string | null;
}

export interface PictureInput {
  story: StoryData;
  meta: StoryMeta;
  playerName: string;
  /** Slide index, as in the live story (0 = intro, 10 = summary). */
  index: number;
  /** ISO instant the link was shared; shown as a UTC day. */
  sharedAt: string;
  assets: PictureAssets;
}

type Style = CSSProperties;
const DISPLAY = "Limelight";
const BODY = "Space Grotesk";

const box = (style: Style, children?: ReactNode): ReactElement => (
  <div style={{ display: "flex", ...style }}>{children}</div>
);
const text = (style: Style, children: ReactNode): ReactElement => (
  <div style={{ display: "flex", fontFamily: BODY, color: C.bone, ...style }}>{children}</div>
);

const count = (n: number) => n.toLocaleString("en-US");

// ------------------------------------------------------------------------ building blocks

const big = (value: string, label?: string, color: string = C.brass): ReactElement =>
  box({ flexDirection: "column", alignItems: "center", gap: 8 }, [
    text({ fontFamily: DISPLAY, fontSize: 176, lineHeight: 1, color }, value),
    label ? text({ fontSize: 40, color: C.muted, textAlign: "center" }, label) : null,
  ]);

const line = (copy: string, style: Style = {}): ReactElement =>
  text({ fontSize: 40, lineHeight: 1.3, color: C.muted, textAlign: "center", ...style }, copy);

const ledgerRow = (label: string, value: string, note?: string): ReactElement =>
  box(
    {
      width: "100%",
      alignItems: "baseline",
      justifyContent: "space-between",
      borderBottom: `2px solid ${C.rule}`,
      paddingBottom: 18,
      gap: 24,
    },
    [
      text({ fontSize: 40, color: C.muted }, label),
      box({ flexDirection: "column", alignItems: "flex-end" }, [
        text({ fontSize: 52, color: C.bone }, value),
        note ? text({ fontSize: 28, color: C.muted }, note) : null,
      ]),
    ],
  );

const bar = (label: string, shown: string, rate: number): ReactElement =>
  box({ flexDirection: "column", width: "100%", gap: 10 }, [
    box({ justifyContent: "space-between" }, [
      text({ fontSize: 38, color: C.bone }, label),
      text({ fontSize: 38, color: C.brass }, shown),
    ]),
    box({ width: "100%", height: 18, background: C.rule, borderRadius: 9 }, [
      box({
        width: `${Math.round(Math.min(1, Math.max(0, rate)) * 100)}%`,
        height: 18,
        background: C.brass,
        borderRadius: 9,
      }),
    ]),
  ]);

/** A hero's art, or the monogram tile where there is none (ADR 0051, 0065). */
function heroTile(heroId: number, size: number, assets: PictureAssets): ReactElement {
  const src = assets.heroCard(heroId);
  if (src) {
    return (
      <img
        src={src}
        width={size}
        height={size}
        alt=""
        style={{ width: size, height: size, borderRadius: 16, objectFit: "cover" }}
      />
    );
  }
  return box(
    {
      width: size,
      height: size,
      alignItems: "center",
      justifyContent: "center",
      border: `3px solid ${C.brass}`,
      borderRadius: 16,
      background: C.panel,
    },
    text(
      { fontFamily: DISPLAY, fontSize: size * 0.4, color: C.brass },
      monogramFor(heroName(heroId)),
    ),
  );
}

// ----------------------------------------------------------------------------- the slides

type Body = (input: PictureInput) => ReactNode;

const BODIES: Record<SlideId, Body> = {
  intro: ({ story, meta }) => [
    big(count(story.intro.matches), matchesUnit(story.intro.matches)),
    big(formatHours(story.intro.hoursPlayed), INTRO_COPY.hoursUnit),
    box({ flexDirection: "column", width: "100%", gap: 22 }, [
      story.intro.firstMatchAt
        ? ledgerRow(INTRO_COPY.firstEntry, formatLedgerDate(story.intro.firstMatchAt))
        : null,
      story.intro.lastMatchAt
        ? ledgerRow(INTRO_COPY.latestEntry, formatLedgerDate(story.intro.lastMatchAt))
        : null,
    ]),
    line(windowLabel(meta)),
  ],

  main: ({ story, assets }) => {
    const { main } = story;
    if (!main) return [line("No main hero yet.")];
    const rank = mainPercentileLine(main, story.percentiles);
    return [
      line(MAIN_COPY.mostPlayed),
      heroTile(main.heroId, 440, assets),
      text({ fontFamily: DISPLAY, fontSize: 96, color: C.bone }, heroName(main.heroId)),
      box({ gap: 70 }, [
        big(formatPercent(main.winRate), MAIN_COPY.winRate),
        big(count(main.matches), matchesUnit(main.matches)),
      ]),
      rank ? line(rank.text, { color: C.bone }) : null,
    ];
  },

  roster: ({ story, assets }) => {
    const verdict = rosterVerdict(story.roster.label);
    return [
      big(
        count(story.roster.heroesPlayed),
        ROSTER_COPY.heroesPlayedUnit(story.roster.heroesPlayed),
      ),
      text({ fontFamily: DISPLAY, fontSize: 80, color: C.bone }, verdict.title),
      line(verdict.blurb),
      story.roster.topHeroes.length
        ? box({ flexDirection: "column", width: "100%", gap: 18 }, [
            text({ fontSize: 34, color: C.muted }, ROSTER_COPY.topHeroes),
            ...story.roster.topHeroes
              .slice(0, 5)
              .map((h) =>
                box({ alignItems: "center", gap: 24, width: "100%" }, [
                  heroTile(h.heroId, 84, assets),
                  text({ fontSize: 44, flexGrow: 1 }, heroName(h.heroId)),
                  text(
                    { fontSize: 34, color: C.muted },
                    `${count(h.matches)} ${matchesUnit(h.matches)}`,
                  ),
                  text({ fontSize: 40, color: C.brass }, formatPercent(h.winRate)),
                ]),
              ),
          ])
        : null,
    ];
  },

  scavenger: ({ story }) => {
    const s = story.scavenger;
    return [
      box(
        { flexDirection: "column", width: "100%", gap: 56, alignItems: "center" },
        [
          [SCAVENGER_COPY.crateGoblin, s.breakables] as const,
          [SCAVENGER_COPY.gambler, s.sinnerJackpots] as const,
          [SCAVENGER_COPY.urnMule, s.idolsReturned] as const,
        ].map(([copy, n]) =>
          box({ flexDirection: "column", alignItems: "center", gap: 4 }, [
            text({ fontFamily: DISPLAY, fontSize: 52, color: C.bone }, copy.title),
            text({ fontFamily: DISPLAY, fontSize: 120, lineHeight: 1.1, color: C.brass }, count(n)),
            text({ fontSize: 36, color: C.muted }, copy.detail),
          ]),
        ),
      ),
    ];
  },

  kills: ({ story }) => {
    const { kills, nemesis } = story;
    return [
      big(count(kills.total), killsTotalLabel(kills.total)),
      line(KILLS_COPY.line),
      box(
        { flexDirection: "column", width: "100%", gap: 30 },
        killRows(kills).map((r) =>
          bar(KILLS_COPY.types[r.key], `${count(r.count)} · ${formatPercent(r.share)}`, r.share),
        ),
      ),
      nemesis
        ? line(
            `${KILLS_COPY.nemesis}: ${heroName(nemesis.heroId)} ${nemesisKillsLine(nemesis.kills)}`,
            {
              color: C.bone,
            },
          )
        : null,
    ];
  },

  precision: ({ story }) => {
    const p = story.precision;
    const parry = parryCopy(p);
    return [
      box({ gap: 60 }, [
        big(formatPercent(p.heroAccuracy), PRECISION_COPY.accuracy),
        big(formatPercent(p.headshotRate), PRECISION_COPY.headshotRate),
      ]),
      box({ flexDirection: "column", alignItems: "center", gap: 18 }, [
        text({ fontSize: 34, color: C.muted }, PRECISION_COPY.parryHeading),
        parry.badge
          ? text(
              {
                fontFamily: DISPLAY,
                fontSize: 72,
                color: C.green,
                border: `4px solid ${C.green}`,
                borderRadius: 18,
                padding: "6px 32px",
              },
              parry.badge,
            )
          : null,
        line(parry.line, { color: C.bone }),
        parry.detail ? line(parry.detail) : null,
        p.parryLabel === "king" ? line(parryKingLine(), { fontSize: 30 }) : null,
      ]),
    ];
  },

  midBoss: ({ story }) => {
    const m = story.midBoss;
    const copy = midBossCopy(m);
    return [
      m.claimed > 0 ? big(count(m.claimed), copy.lead) : line(copy.lead, { color: C.bone }),
      line(copy.line, { color: C.bone }),
      copy.stolen ? line(copy.stolen, { fontSize: 34 }) : null,
    ];
  },

  roast: ({ story }) => {
    const { roast } = story;
    const bins = binDeaths(roast.deathPositions);
    const hot = hottestCell(bins);
    return [
      hot ? deathMapSvg(bins, hot, 520) : null,
      big(count(roast.deaths), deathsLabel(roast.deaths)),
      hot ? line(hotspotLine(hot.count), { color: C.bone }) : line(noDeathMapLine(roast.deaths)),
      roast.worstMatch && roast.worstMatch.deaths > 0
        ? line(
            worstMatchLine({
              deaths: roast.worstMatch.deaths,
              heroName: heroName(roast.worstMatch.heroId),
            }),
          )
        : null,
    ];
  },

  rank: ({ story }) => {
    const { journey, current } = story.rank;
    const summary = rankSummary(journey, current);
    const marks = journeyMilestones(journey);
    return [
      current
        ? text(
            { fontFamily: DISPLAY, fontSize: 120, color: C.brass, textAlign: "center" },
            rankLabel(current),
          )
        : null,
      line(summary.text, { color: C.bone }),
      marks.length > 1
        ? box(
            { width: "100%", justifyContent: "space-between", flexWrap: "wrap", gap: 16 },
            marks.map((p) =>
              text(
                {
                  fontSize: 32,
                  color: C.muted,
                  border: `2px solid ${C.rule}`,
                  borderRadius: 12,
                  padding: "8px 18px",
                },
                rankLabel(p),
              ),
            ),
          )
        : null,
    ];
  },

  mvp: ({ story }) => {
    const copy = mvpCopy(story);
    if (copy.kind === "none") return [line(copy.line, { color: C.bone })];
    const mentions = mvpMentions(story);
    return [
      copy.lead ? line(copy.lead) : null,
      text({ fontFamily: DISPLAY, fontSize: 76, color: C.bone, textAlign: "center" }, copy.label),
      big(`Top ${copy.topPercent}%`, copy.scopeLine),
      line(copy.flavor, { color: C.bone }),
      mentions.length
        ? box({ flexDirection: "column", width: "100%", gap: 16 }, [
            text({ fontSize: 32, color: C.muted }, MENTIONS_HEADING),
            ...mentions.map((m) =>
              ledgerRow(m.label, `Top ${m.topPercent}%`, `${m.note} · ${m.line}`),
            ),
          ])
        : null,
    ];
  },

  summary: ({ story, meta, assets }) => {
    const pool = summaryHeroPool(story);
    return [
      box(
        { flexDirection: "column", width: "100%", gap: 22 },
        summaryRows(story).map((r) => ledgerRow(r.label, r.value, r.note)),
      ),
      pool
        ? box({ flexDirection: "column", width: "100%", gap: 18 }, [
            text({ fontSize: 34, color: C.muted }, pool.caption),
            box(
              { justifyContent: "space-between", width: "100%" },
              pool.heroes.map((h) =>
                box({ flexDirection: "column", alignItems: "center", gap: 8 }, [
                  heroTile(h.heroId, 130, assets),
                  text({ fontSize: 26 }, h.name),
                  text({ fontSize: 24, color: C.muted }, h.winRate),
                ]),
              ),
            ),
          ])
        : null,
      line(`${windowLabel(meta)} · ${basedOnMatches(story.matchCount)}`, { fontSize: 32 }),
    ];
  },
};

// -------------------------------------------------------------------------------- the frame

const NAME_FALLBACK = "A Soul Ledger player";

/**
 * The player name as the picture's fonts can draw it. Steam names are free text, and Limelight,
 * Space Grotesk and the Noto Sans fallbacks cover Latin, Latin Extended, Cyrillic and Greek only;
 * anything else (CJK, emoji, symbols) would come out as empty boxes, so it is dropped, and a name
 * with nothing drawable left becomes a plain label.
 */
export function drawableName(name: string): string {
  const kept = name
    .replace(/[^\p{Script=Latin}\p{Script=Cyrillic}\p{Script=Greek}\p{N}\p{P}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  return /[\p{L}\p{N}]/u.test(kept) ? kept : NAME_FALLBACK;
}

/** "Shared Nov 11, 2026": the day, in UTC for everyone. */
export const sharedLine = (sharedAt: string) => `Shared ${formatPatchDate(sharedAt)}`;

export function buildSlidePicture(input: PictureInput): ReactElement {
  const slide = SLIDES[input.index];
  if (!slide) throw new Error(`No slide ${input.index}: slides run 0 to ${SLIDES.length - 1}`);
  const { assets, playerName, sharedAt } = input;

  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        width: PICTURE_WIDTH,
        height: PICTURE_HEIGHT,
        background: C.ink,
        fontFamily: BODY,
      }}
    >
      <img
        src={assets.still}
        width={PICTURE_WIDTH}
        height={PICTURE_HEIGHT}
        alt=""
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: PICTURE_WIDTH,
          height: PICTURE_HEIGHT,
          objectFit: "cover",
        }}
      />
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 0,
          left: 0,
          width: PICTURE_WIDTH,
          height: PICTURE_HEIGHT,
          backgroundImage: `linear-gradient(180deg, rgba(13,11,16,0.55) 0%, rgba(13,11,16,0.15) 35%, rgba(13,11,16,0.7) 100%)`,
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          position: "absolute",
          top: 0,
          left: 0,
          width: PICTURE_WIDTH,
          height: PICTURE_HEIGHT,
          padding: "96px 72px 72px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {text({ fontSize: 40, color: C.brass, letterSpacing: 4 }, drawableName(playerName))}
          {text({ fontFamily: DISPLAY, fontSize: 84, lineHeight: 1.1 }, headlineFor(slide.id))}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flexGrow: 1,
            justifyContent: "center",
            alignItems: "center",
            gap: 40,
            marginTop: 48,
            marginBottom: 48,
            padding: 56,
            background: "rgba(23,19,28,0.86)",
            border: `3px solid ${C.brass}`,
            borderRadius: 32,
          }}
        >
          {BODIES[slide.id](input)}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontFamily: BODY,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {text({ fontFamily: DISPLAY, fontSize: 48, color: C.brass }, "Soul Ledger")}
            {text({ fontSize: 30, color: C.muted }, SITE_ADDRESS)}
          </div>
          {text({ fontSize: 30, color: C.muted }, sharedLine(sharedAt))}
        </div>
      </div>
    </div>
  );
}
