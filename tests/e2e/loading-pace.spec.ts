import { expect, test } from "@playwright/test";
import { LOADING_PACE } from "../../src/lib/client/loading-pace";
import { PROFILE, mockLookup, ndjson, openEntry, storyEvent } from "./lookup-mock";
import { push, startLookup, streamLookupByHand } from "./hand-stream";

// The real pacing (ADR 0056): every other spec runs with it switched off (see playwright.config.ts).
// These assert only LOWER bounds on how long a stage stays up, which cannot be flaky on a slow
// machine: pacing can only make things later, never earlier.

// Opt out of the config's "pacing off" start state, so this file runs the real pacing.
test.use({ storageState: { cookies: [], origins: [] } });

const { stageDwellMs: DWELL, finalTailMs: TAIL } = LOADING_PACE;
/** Timer and paint slack when comparing two timestamps. */
const SLACK = 150;

declare global {
  interface Window {
    __seen: Record<string, number>;
  }
}

/** Records (in the page, on every DOM change) when each loader stage and the story first appear. */
const watchStages = (page: import("@playwright/test").Page) =>
  page.evaluate(() => {
    window.__seen = {};
    const marks: [string, () => boolean][] = [
      ["profile", () => document.body.textContent!.includes("Found you, Gaben")],
      ["history", () => document.body.textContent!.includes("120 matches on the books")],
      ["details", () => document.querySelector('[role="progressbar"]') !== null],
      ["story", () => document.querySelector('[aria-label="Story progress"]') !== null],
    ];
    const look = () => {
      for (const [name, present] of marks) {
        if (!(name in window.__seen) && present()) window.__seen[name] = performance.now();
      }
    };
    new MutationObserver(look).observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
    });
    look();
  });

test("the loader holds each stage for its dwell, then the last one plus a tail, even when every event arrives at once", async ({
  page,
}) => {
  test.setTimeout(30_000);
  await streamLookupByHand(page);
  await startLookup(page);
  await watchStages(page);

  await push(page, { type: "resolved", accountId: 1 });
  await push(page, { type: "profile", accountId: 1, personaName: "Gaben", avatarUrl: null });
  await push(page, { type: "history", totalMatches: 120, newMatches: 120, heroIds: [1, 2, 18] });
  await push(page, {
    type: "details",
    fetched: 100,
    total: 100,
    kills: 800,
    breakables: 300,
    sinnerJackpots: 0,
  });
  await push(page, { type: "done", matchCount: 120 });
  await push(page, storyEvent());

  // Every event is in, yet the loader still shows only the first stage.
  await expect(page.getByText("Found you, Gaben")).toBeVisible();
  await expect(page.getByText("120 matches on the books", { exact: true })).toHaveCount(0);

  await expect(page.getByRole("list", { name: "Story progress" })).toBeVisible({ timeout: 15_000 });
  const seen = await page.evaluate(() => window.__seen);

  // In order, a dwell apart, then the last stage's dwell plus the tail before the story.
  expect(seen.history - seen.profile).toBeGreaterThanOrEqual(DWELL - SLACK);
  expect(seen.details - seen.history).toBeGreaterThanOrEqual(DWELL - SLACK);
  expect(seen.story - seen.details).toBeGreaterThanOrEqual(DWELL + TAIL - SLACK);
});

test("a fully cached lookup takes about four to five seconds, start to story", async ({ page }) => {
  test.setTimeout(30_000);
  await mockLookup(
    page,
    ndjson(
      { type: "resolved", accountId: 1 },
      { type: "profile", accountId: 1, personaName: "Gaben", avatarUrl: null },
      { type: "history", totalMatches: 120, newMatches: 0, heroIds: [1, 2] },
      { type: "done", matchCount: 120 },
      storyEvent(),
    ),
  );
  await openEntry(page);
  await page.getByLabel("Paste your Steam profile URL").fill(PROFILE);
  const started = Date.now();
  await page.getByRole("button", { name: "Open the ledger" }).click();
  await expect(page.getByRole("list", { name: "Story progress" })).toBeVisible({ timeout: 15_000 });
  const took = Date.now() - started;
  test.info().annotations.push({ type: "cached lookup", description: `${took} ms` });
  // The floor is the pacing (a profile stage, a history stage and the tail); the ceiling is
  // generous for slow CI machines.
  expect(took).toBeGreaterThanOrEqual(2 * DWELL + TAIL - SLACK);
  expect(took).toBeLessThanOrEqual(9000);
});
