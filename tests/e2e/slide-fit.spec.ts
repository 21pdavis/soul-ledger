import { expect, test, type Page } from "@playwright/test";
import { SLIDES } from "../../src/story/copy";
import { fixtureStory } from "../fixtures/story";
import { mockLookup, ndjson, openEntry, PROFILE, stageSettled, storyEvent } from "./lookup-mock";

// Slides never scroll (ADR 0050), and the stage clips what does not fit, so a slide that is too
// tall silently loses its last lines (#41: the current rank on the rank slide). This walks every
// slide on the real flow, with the lookup mocked and a worst-case story (long hero names, big
// numbers, the longest rank journey), and checks that every element sits inside the slide frame.

const stage = (page: Page) => page.getByTestId("story-stage");
/** The slide on screen: the current card on desktop, the stage itself on a phone. */
const current = (page: Page) =>
  page.locator(
    "[data-testid=story-card][data-current=true], [data-testid=story-stage]:not(:has([data-testid=story-card]))",
  );

/** The longest names, the biggest numbers, and a rank journey that is capped at the most rows. */
function worstCaseStory() {
  const story = fixtureStory();
  const rank = (i: number, badge: number) => ({
    at: new Date(Date.UTC(2026, i % 9, 1 + i)).toISOString(),
    matchId: 5000 + i,
    badge,
    tier: Math.floor(badge / 10),
    subrank: badge % 10,
  });
  const badges = [62, 71, 73, 75, 74, 76, 82, 81, 84, 83, 85, 91, 86, 81];
  const journey = badges.map((b, i) => rank(i, b));
  story.rank = { journey, current: journey.at(-1)! };
  story.matchCount = 9999;
  story.intro = { ...story.intro, matches: 9999, hoursPlayed: 9876.5, wins: 6543 };
  story.main = {
    ...story.main!,
    heroId: 78,
    matches: 9999,
    wins: 6543,
    recent: { matches: 50, winRate: 0.72 },
  };
  story.roster.heroesPlayed = 38;
  story.roster.recent = { matches: 300, winRate: 0.65 };
  story.roster.topHeroes = [78, 87, 69, 57, 2].map((heroId, i) => ({
    heroId,
    matches: 9000 - i,
    winRate: 0.5,
    recent: { matches: 50, winRate: 0.72 },
  }));
  story.scavenger = { breakables: 987654, sinnerJackpots: 98765, idolsReturned: 54321 };
  story.kills = {
    total: 987654,
    bullet: 900000,
    ability: 300000,
    melee: 34567,
    headshot: 300000,
    closeup: 700000,
    longDistance: 234567,
  };
  story.precision = { ...story.precision, parrySuccess: 12345, parryMiss: 9876 };
  story.midBoss = { claimed: 12345, stolen: 9876 };
  story.roast = {
    ...story.roast,
    deaths: 98765,
    worstMatch: { matchId: 99, heroId: 87, deaths: 99 },
  };
  story.mvp = {
    ...story.mvp!,
    label: "Hero damage per minute",
    scope: "hero",
    heroId: 69,
    topPercent: 12,
  };
  // Three notable stats besides the signature one, so two honorable mentions render (the most rows).
  const pct = (metric: string, label: string, topPercent: number) => ({
    metric,
    label,
    value: 10,
    percentile: 100 - topPercent,
    topPercent,
    higherIsBetter: true,
    weight: 1,
  });
  story.percentiles = [
    pct("soulsPerMin", "Souls per minute", 0.5),
    pct("objectiveDamage", "Objective damage", 8),
    pct("teammateHealing", "Teammate healing", 20),
  ];
  return story;
}

const SIZES: {
  width: number;
  height: number;
  phone: boolean;
  stale?: boolean;
  fewerRankRows?: boolean;
}[] = [
  { width: 320, height: 568, phone: true },
  // Just past the small tier's cut-off (the frame is ~530px tall): the mid tier's sizes, little room.
  // The rank slide's seven-row promise is for the usual stages, so it is not asserted here.
  { width: 320, height: 610, phone: true, fewerRankRows: true },
  { width: 360, height: 640, phone: true },
  { width: 375, height: 667, phone: true },
  { width: 320, height: 568, phone: true, stale: true },
  { width: 360, height: 640, phone: true, stale: true },
  { width: 412, height: 839, phone: true },
  { width: 412, height: 915, phone: true },
  { width: 1280, height: 720, phone: false },
  { width: 1440, height: 900, phone: false },
];

/** The frame has a decorative inner rule 8px inside its edge: content stays clear of it sideways. */
const RULE_INSET = 8;

/** Spare pixels the worst-case honorable mentions must leave, so font differences cannot clip them. */
const MENTIONS_SLACK = 48;

test.describe("every slide fits its frame, worst case", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
  });

  for (const { width, height, phone, stale, fewerRankRows } of SIZES) {
    test(`${width}x${height}${stale ? " (cached-matches note)" : ""}: nothing on any slide runs past the frame`, async ({
      page,
      isMobile,
    }) => {
      test.skip(phone !== !!isMobile, phone ? "phone only" : "desktop only");
      await page.setViewportSize({ width, height });
      await mockLookup(
        page,
        ndjson(
          { type: "resolved", accountId: 1 },
          storyEvent({ stale: !!stale }, worstCaseStory()),
        ),
      );
      await openEntry(page);
      await page.getByLabel("Paste your Steam profile URL").fill(PROFILE);
      await page.getByRole("button", { name: "Open the ledger" }).click();
      await expect(stage(page)).toHaveAttribute("data-slide", SLIDES[0].id);

      const problems: string[] = [];
      for (const slide of SLIDES) {
        await expect(stage(page)).toHaveAttribute("data-slide", slide.id);
        await stageSettled(page);
        const frame = current(page).locator("section").first();
        const found = await frame.evaluate((el, inset) => {
          const f = el.getBoundingClientRect();
          const out: string[] = [];
          // Content ends where the frame's bottom padding starts, not at its edge.
          const wrapper = el.firstElementChild as HTMLElement;
          const bottom =
            wrapper.getBoundingClientRect().bottom -
            parseFloat(getComputedStyle(wrapper).paddingBottom);
          for (const node of el.querySelectorAll("*")) {
            // The padded wrapper fills the frame by design.
            if (node === el.firstElementChild) continue;
            const r = node.getBoundingClientRect();
            if (r.width === 0 || r.height === 0) continue;
            if (
              r.bottom > bottom + 1 ||
              r.right > f.right - inset + 0.5 ||
              r.left < f.left + inset - 0.5
            ) {
              const text = (node.textContent ?? "").trim().slice(0, 30);
              out.push(
                `<${node.tagName.toLowerCase()}> "${text}" bottom ${Math.round(r.bottom - f.bottom)}px right ${Math.round(r.right - f.right)}px`,
              );
            }
          }
          if (el.scrollHeight > el.clientHeight) {
            out.push(
              `frame ${Math.round(f.width)}x${Math.round(f.height)}: scrollHeight ${el.scrollHeight} > clientHeight ${el.clientHeight}`,
            );
          }
          return out;
        }, RULE_INSET);
        if (slide.id === "rank") {
          // The current rank is the point of the slide: its row is whole and in view.
          const current = frame.locator("li[aria-current=step]");
          await expect(current).toBeVisible();
          await expect(current).toContainText("Oracle");
          // A bigger stage never shows fewer rows than a smaller one: the climb has 14 distinct
          // badges, so every stage with the stage's usual room shows the full 7.
          if (!stale && !fewerRankRows) await expect(frame.locator("ol li")).toHaveCount(7);
        }
        if (slide.id === "mvp") {
          // Spare room under the mentions: a wider fallback font on another machine (CI, a real
          // phone) must not push the second one past the frame, where the stage would clip it.
          const spare = await frame.evaluate((el) => {
            const w = el.firstElementChild as HTMLElement;
            const limit =
              w.getBoundingClientRect().bottom - parseFloat(getComputedStyle(w).paddingBottom);
            return limit - el.querySelector("ul")!.getBoundingClientRect().bottom;
          });
          expect(spare, "room left under the honorable mentions").toBeGreaterThanOrEqual(
            MENTIONS_SLACK,
          );
          // The worst case is two honorable mentions, so the fit check above really covers them.
          await expect(frame.getByRole("heading", { name: "Honorable mentions" })).toBeVisible();
          await expect(frame.locator("ul li")).toHaveCount(2);
        }
        for (const f of found.slice(0, 2)) problems.push(`${slide.id}: ${f}`);
        if (slide.id !== SLIDES.at(-1)!.id) await page.keyboard.press("ArrowRight");
      }
      expect(problems).toEqual([]);
    });
  }
});
