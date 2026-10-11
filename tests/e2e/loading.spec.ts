import { expect, test, type Page } from "@playwright/test";
import { fixtureStory } from "../fixtures/story";
import { push, startLookup, streamLookupByHand } from "./hand-stream";

// The lookup stream is faked in the page so the test decides when each event arrives. That makes
// "the stages appear in order, driven by events" deterministic, with no real timers involved.

/** The real story player is up: its segmented progress bar is on screen. */
const storyUp = (page: Page) => page.getByRole("list", { name: "Story progress" });

const storyEvent = () => ({
  type: "story",
  player: { accountId: 1, personaName: "Gaben", avatarUrl: null },
  window: "all",
  patchStart: null,
  stale: false,
  story: fixtureStory(),
});

test("the loader shows its three stages in order as events arrive, before the story", async ({
  page,
}) => {
  await streamLookupByHand(page);
  await startLookup(page);
  const status = page.getByRole("status");

  await push(page, { type: "resolved", accountId: 1 });
  await expect(status).toHaveText("Looking up your ledger...");
  await expect(page.getByText("Gaben")).toHaveCount(0);

  // Stage 1: avatar and persona name.
  await push(page, { type: "profile", accountId: 1, personaName: "Gaben", avatarUrl: null });
  await expect(page.getByText(/Found you, Gaben/)).toBeVisible();
  await expect(status).toHaveText("Found Gaben.");
  await expect(page.getByRole("progressbar")).toHaveCount(0);

  // Stage 2: match count and hero tiles.
  await push(page, {
    type: "history",
    totalMatches: 120,
    newMatches: 120,
    heroIds: [1, 2, 18],
  });
  await expect(page.getByText("120 matches on the books", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("list", { name: "Heroes you have played" }).getByRole("listitem"),
  ).toHaveCount(3);
  await expect(page.getByText("Found you, Gaben")).toBeVisible();
  await expect(page.getByRole("progressbar")).toHaveCount(0);

  // Stage 3: live counters.
  await push(page, {
    type: "details",
    fetched: 40,
    total: 100,
    kills: 320,
    breakables: 120,
    sinnerJackpots: 0,
  });
  const bar = page.getByRole("progressbar", { name: "Match details read" });
  await expect(bar).toHaveAttribute("aria-valuenow", "40");
  await expect(page.getByText("/ 100")).toBeVisible();
  await expect(storyUp(page)).toHaveCount(0);

  await push(page, {
    type: "details",
    fetched: 100,
    total: 100,
    kills: 800,
    breakables: 300,
    sinnerJackpots: 0,
  });
  await expect(bar).toHaveAttribute("aria-valuenow", "100");
  await expect(page.getByText("800", { exact: true })).toBeVisible();

  // Only the final story event leaves the loader (it also ends the stream).
  await push(page, { type: "done", matchCount: 120 });
  await expect(page.getByRole("progressbar")).toBeVisible();
  await push(page, storyEvent());
  await expect(storyUp(page)).toBeVisible();
  await expect(page.getByRole("progressbar")).toHaveCount(0);
});

test("a waiting event shows a waiting note and the loader keeps going", async ({ page }) => {
  await streamLookupByHand(page);
  await startLookup(page);
  await push(page, { type: "resolved", accountId: 1 });
  await push(page, { type: "waiting" });
  await expect(page.getByRole("status")).toContainText(/waiting our turn/i);
  await expect(page.getByRole("heading", { name: /couldn't find|lost the thread/ })).toHaveCount(0);
  await push(page, storyEvent());
  await expect(storyUp(page)).toBeVisible();
});

test("the loader fits the screen without horizontal scroll", async ({ page }) => {
  await streamLookupByHand(page);
  await startLookup(page);
  await push(page, {
    type: "profile",
    accountId: 1,
    personaName: "A very long persona name that should wrap rather than overflow the page",
    avatarUrl: null,
  });
  await push(page, {
    type: "history",
    totalMatches: 5000,
    newMatches: 5000,
    heroIds: Array.from({ length: 30 }, (_, i) => i + 1),
  });
  await push(page, {
    type: "details",
    fetched: 2500,
    total: 5000,
    kills: 20000,
    breakables: 9000,
    sinnerJackpots: 3,
  });
  await expect(page.getByRole("progressbar")).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  await expect(page.getByText(/Not affiliated with or endorsed by Valve/)).toBeVisible();
});

test("a return visit with nothing new (no details event) ends on an up-to-date tally", async ({
  page,
}) => {
  await streamLookupByHand(page);
  await startLookup(page);
  await push(page, { type: "resolved", accountId: 1 });
  await push(page, { type: "profile", accountId: 1, personaName: "Gaben", avatarUrl: null });
  await push(page, { type: "history", totalMatches: 120, newMatches: 0, heroIds: [1, 2] });
  await push(page, { type: "done", matchCount: 120 });
  await expect(page.getByText(/already up to date/i)).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("Almost ready. Sealing the ledger.");
  await push(page, storyEvent());
  await expect(storyUp(page)).toBeVisible();
});
