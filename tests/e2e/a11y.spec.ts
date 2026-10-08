import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { SLIDES } from "../../src/story/copy";
import { fixtureStory } from "../fixtures/story";
import { push, startLookup, streamLookupByHand } from "./hand-stream";
import {
  enter,
  mockLookup,
  ndjson,
  openEntry,
  PATCH,
  stageSettled,
  storyEvent,
} from "./lookup-mock";

// Accessibility scans (ADR 0054): axe on every screen, phone and desktop. Stricter than "serious
// and critical": any violation fails, minor ones included (the page was clean apart from one
// missing h1, which is fixed). No rule is switched off. Animations are waited out first, because a
// half-faded element would be measured against the wrong colour.

const stage = (page: Page) => page.getByTestId("story-stage");

/**
 * Waits for every finite animation and transition to end (loops are left running). Entrances start
 * a frame or two after the render that causes them, so it looks again until a pass finds nothing.
 */
const settleAnimations = (page: Page) =>
  page.evaluate(async () => {
    const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
    for (let pass = 0; pass < 10; pass++) {
      await frame();
      await frame();
      const running = document
        .getAnimations()
        .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity);
      if (running.length === 0) return;
      await Promise.all(running.map((a) => a.finished.catch(() => undefined)));
    }
  });

async function expectNoViolations(page: Page, where: string) {
  await settleAnimations(page);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"])
    .analyze();
  const report = results.violations.map((v) => ({
    rule: v.id,
    impact: v.impact,
    help: v.help,
    nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
  }));
  expect(report, `axe violations on ${where}`).toEqual([]);
}

/** A lookup that found a player with next to nothing: every optional part of every slide is empty. */
function sparseStory() {
  const story = fixtureStory({
    matchCount: 3,
    mvp: null,
    percentiles: [],
    scavenger: { breakables: 0, sinnerJackpots: 0, idolsReturned: 0 },
    kills: { total: 0, bullet: 0, ability: 0, melee: 0, headshot: 0, closeup: 0, longDistance: 0 },
    midBoss: { claimed: 0, stolen: 0 },
  });
  story.intro = {
    ...story.intro,
    matches: 3,
    hoursPlayed: 0.4,
    firstMatchAt: null,
    lastMatchAt: null,
  };
  story.main = { ...story.main!, matches: 3, percentiles: [] };
  story.precision = { ...story.precision, parryLabel: "none", parrySuccess: 0, parryMiss: 0 };
  story.roast = { ...story.roast, deathPositions: [], worstMatch: null };
  story.rank = { journey: [], current: null };
  return story;
}

const STORIES = [
  { name: "full story", story: () => fixtureStory(), over: {} },
  { name: "sparse story, cached note", story: sparseStory, over: { stale: true } },
];

test.describe("entry and loading", () => {
  test("entry screen", async ({ page }) => {
    await openEntry(page);
    await expectNoViolations(page, "entry");
  });

  test("entry screen with the inline error", async ({ page }) => {
    await enter(page, "https://example.com/not-steam");
    await expect(page.getByText("That doesn't look like a Steam profile URL.")).toBeVisible();
    await expectNoViolations(page, "entry with inline error");
  });

  test("every stage of the loading screen", async ({ page }) => {
    await streamLookupByHand(page);
    await startLookup(page);
    await push(page, { type: "resolved", accountId: 1 });
    await expect(page.getByRole("status")).toHaveText("Looking up your ledger...");
    await expectNoViolations(page, "loading, looking up");
    await push(page, { type: "profile", accountId: 1, personaName: "Gaben", avatarUrl: null });
    await expect(page.getByText(/Found you, Gaben/)).toBeVisible();
    await push(page, { type: "history", totalMatches: 120, newMatches: 120, heroIds: [1, 2, 18] });
    await expect(page.getByText("120 matches on the books", { exact: true })).toBeVisible();
    await push(page, {
      type: "details",
      fetched: 40,
      total: 100,
      kills: 320,
      breakables: 120,
      sinnerJackpots: 0,
    });
    await expect(page.getByRole("progressbar", { name: "Match details read" })).toBeVisible();
    await expectNoViolations(page, "loading, reading details");
    await push(page, { type: "waiting" });
    await expect(page.getByRole("status")).toContainText(/waiting our turn/i);
    await expectNoViolations(page, "loading, waiting");
  });
});

test.describe("error screens", () => {
  const emptyStory = () => fixtureStory({ matchCount: 0, main: null, mvp: null });
  const cases = [
    {
      name: "not found",
      body: ndjson({ type: "error", reason: "not_found" }),
      title: /couldn't find/,
    },
    {
      name: "unavailable",
      body: ndjson({ type: "error", reason: "unavailable" }),
      title: /out of ink/,
    },
    {
      name: "zero matches (Street Brawl only)",
      body: ndjson(storyEvent({}, { ...emptyStory(), excludedMatches: 14 })),
      title: /No Deadlock matches found/,
    },
    {
      name: "zero matches in the patch window",
      body: ndjson(storyEvent({ window: "patch", patchStart: PATCH }, emptyStory())),
      title: /No Deadlock matches found/,
    },
  ];
  for (const c of cases) {
    test(c.name, async ({ page }) => {
      await mockLookup(page, c.body);
      await enter(page);
      await expect(page.getByRole("heading", { name: c.title })).toBeVisible();
      await expectNoViolations(page, c.name);
    });
  }

  test("a dropped connection", async ({ page }) => {
    await page.route("**/api/lookup**", (route) => route.abort("failed"));
    await enter(page);
    await expect(page.getByRole("heading", { name: "We lost the thread" })).toBeVisible();
    await expectNoViolations(page, "fetch failed");
  });
});

for (const { name, story, over } of STORIES) {
  test(`all 11 slides, ${name}`, async ({ page }) => {
    test.setTimeout(120_000);
    await mockLookup(page, ndjson({ type: "resolved", accountId: 1 }, storyEvent(over, story())));
    await enter(page);
    for (let i = 0; i < SLIDES.length; i++) {
      await expect(stage(page)).toHaveAttribute("data-slide", SLIDES[i].id);
      await stageSettled(page);
      await expectNoViolations(page, `slide ${i + 1} (${SLIDES[i].id}), ${name}`);
      if (i < SLIDES.length - 1) await page.keyboard.press("ArrowRight");
    }
  });
}
