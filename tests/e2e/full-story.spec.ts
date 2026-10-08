import { expect, test, type Page } from "@playwright/test";
import { SLIDES, SLIDE_COUNT } from "../../src/story/copy";
import { fixtureStory } from "../fixtures/story";
import { push, startLookup, streamLookupByHand } from "./hand-stream";
import { mockLookup, ndjson, enter, storyEvent } from "./lookup-mock";

// The whole product once, on both layouts: paste a profile URL, watch the staged loading, play all
// 11 slides (tap on phone, scroll on desktop), land on the summary. The lookup is mocked, so this
// runs the same locally and against staging. Per-controller details live in story-player.spec.ts
// and slide 11's in summary.spec.ts; this file is the end-to-end journey and its cross-cutting
// checks (announcer, progress bar, notice, no sideways scroll, stage on screen) on every slide.

const stage = (page: Page) => page.getByTestId("story-stage");
const track = (page: Page) => page.getByTestId("scroll-track");
const segments = (page: Page) =>
  page.getByRole("list", { name: "Story progress" }).getByRole("listitem");
const settled = (page: Page) => expect(stage(page)).toHaveAttribute("data-animating", "false");

/** Something each slide says for the fixture story, besides its headline. */
const SLIDE_TEXT: Record<(typeof SLIDES)[number]["id"], RegExp> = {
  intro: /Based on 120 matches/,
  main: /Top 12% of Infernus players/,
  roster: /Flex/,
  scavenger: /Crate Goblin/,
  kills: /Bullets/,
  precision: /Parry king/,
  midBoss: /Rejuvenators claimed by your team/,
  roast: /You died here \d+ times?/,
  rank: /Oracle 1/,
  mvp: /Melee kills/,
  summary: /Look up another player/,
};

/** Hand-feeds a lookup through all three loading stages, then the story. */
async function loadThroughStages(page: Page, story = fixtureStory()) {
  await streamLookupByHand(page);
  await startLookup(page);
  const status = page.getByRole("status");
  await push(page, { type: "resolved", accountId: 1 });
  await expect(status).toHaveText("Looking up your ledger...");
  await push(page, { type: "profile", accountId: 1, personaName: "Gaben", avatarUrl: null });
  await expect(page.getByText(/Found you, Gaben/)).toBeVisible();
  await push(page, { type: "history", totalMatches: 120, newMatches: 120, heroIds: [1, 2, 18] });
  await expect(page.getByText("120 matches on the books", { exact: true })).toBeVisible();
  await push(page, {
    type: "details",
    fetched: 60,
    total: 120,
    kills: 700,
    breakables: 900,
    sinnerJackpots: 3,
  });
  await expect(page.getByRole("progressbar", { name: "Match details read" })).toHaveAttribute(
    "aria-valuenow",
    "60",
  );
  await expect(stage(page)).toHaveCount(0);
  await push(page, { type: "done", matchCount: story.matchCount });
  await push(page, storyEvent({}, story));
  await expect(page.getByRole("progressbar")).toHaveCount(0);
  await expect(stage(page)).toHaveAttribute("data-slide", "intro");
  await settled(page);
}

/** Phone: tap the right edge of the stage, where no slide control can be. */
async function tapNext(page: Page) {
  const box = (await stage(page).boundingBox())!;
  await stage(page).tap({ position: { x: box.width - 6, y: box.height * 0.5 } });
}

/** Desktop: one wheel notch's worth of scroll over the stage, which snaps to the next checkpoint. */
async function scrollNext(page: Page) {
  await stage(page).hover();
  await page.mouse.wheel(0, 600);
}

const restingCheckpoint = (page: Page) =>
  track(page).evaluate((el) => {
    const i = el.scrollTop / el.clientHeight;
    return Math.abs(i - Math.round(i)) < 0.01 ? Math.round(i) : null;
  });

/** What must hold on every slide, whatever the layout. */
async function expectSlideChrome(page: Page, i: number) {
  const { id, headline } = SLIDES[i];
  await expect(stage(page)).toHaveAttribute("data-slide", id);
  await expect(page.getByRole("heading", { level: 2, name: headline })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  // The announcer says the slide change, so a screen reader hears where it is.
  await expect(page.getByRole("status").filter({ hasText: "of 11" })).toHaveText(
    `Slide ${i + 1} of ${SLIDE_COUNT}: ${headline}`,
  );
  await expect(segments(page)).toHaveCount(SLIDE_COUNT);
  await expect(segments(page).nth(i)).toHaveAttribute("data-state", "current");
  if (i > 0) await expect(segments(page).nth(i - 1)).toHaveAttribute("data-state", "done");
  if (i < SLIDE_COUNT - 1) {
    await expect(segments(page).nth(i + 1)).toHaveAttribute("data-state", "todo");
  }
  // The slide has said what it has to say (the final value of any counter included).
  await expect(stage(page)).toContainText(SLIDE_TEXT[id]);
  // Always on screen: the stage itself and the non-affiliation notice, with nothing sideways.
  await expect(stage(page)).toBeInViewport({ ratio: 1 });
  await expect(page.getByText(/Not affiliated with or endorsed by Valve/)).toBeInViewport();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

test("paste a profile, watch the loading, play all 11 slides to the summary", async ({
  page,
  isMobile,
}) => {
  test.setTimeout(90_000);
  await loadThroughStages(page);
  await expect(page.getByTestId("story-player")).toHaveAttribute(
    "data-mode",
    isMobile ? "tap" : "scroll",
  );

  for (let i = 0; i < SLIDE_COUNT; i++) {
    await expectSlideChrome(page, i);
    if (i === SLIDE_COUNT - 1) break;
    await settled(page);
    if (isMobile) {
      await tapNext(page);
    } else {
      await scrollNext(page);
      await expect.poll(() => restingCheckpoint(page)).toBe(i + 1);
    }
  }

  // The summary is the end: one more tap or scroll goes nowhere.
  await settled(page);
  if (isMobile) await tapNext(page);
  else await scrollNext(page);
  await expect(stage(page)).toHaveAttribute("data-slide", "summary");

  // And it offers the three ways on.
  for (const name of ["Replay", "Look up another player", "Refresh"]) {
    await expect(page.getByRole("button", { name })).toBeVisible();
  }
  await page.getByRole("button", { name: "Replay" }).click();
  await expect(stage(page)).toHaveAttribute("data-slide", "intro");
  await expect(segments(page).nth(0)).toHaveAttribute("data-state", "current");
});

test("a player with few matches still plays all 11 slides, with no same-hero claims", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const few = fixtureStory({ matchCount: 4, mvp: null });
  few.intro = { ...few.intro, matches: 4, hoursPlayed: 1.3 };
  // Under 10 matches on the main there are no same-hero rankings (MIN_HERO_SAMPLE).
  few.main = { ...few.main!, matches: 4, percentiles: [] };
  await mockLookup(page, ndjson({ type: "resolved", accountId: 1 }, storyEvent({}, few)));
  await enter(page);
  await expect(stage(page)).toHaveAttribute("data-slide", "intro");
  await expect(stage(page).getByText("Based on 4 matches")).toBeVisible();

  const seen: string[] = [];
  for (let i = 0; i < SLIDE_COUNT; i++) {
    await expect(stage(page)).toHaveAttribute("data-slide", SLIDES[i].id);
    await settled(page);
    seen.push((await stage(page).innerText()).replace(/\s+/g, " "));
    if (i < SLIDE_COUNT - 1) await page.keyboard.press("ArrowRight");
  }
  expect(seen).toHaveLength(SLIDE_COUNT);
  // Main slide: the ranking falls back to all players, never "of Infernus players".
  expect(seen[1]).toContain("of all players");
  for (const text of seen) expect(text).not.toMatch(/of Infernus players/);
  // The MVP slide has its own friendly copy rather than a stat.
  expect(seen[9]).toMatch(/Still finding your signature|Your best stat so far/);
});
