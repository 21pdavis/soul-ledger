import { expect, test, type Page } from "@playwright/test";
import { mockLookup, ndjson, storyEvent } from "./lookup-mock";
import { EXPIRED_SLUG, LIVE_SLUG } from "./shared-fixtures";

// /w/<slug> (ADR 0079). The server reads its links from a fixture file, so these only run against
// the local servers; live staging has its own database.
test.skip(!!process.env.STAGING_URL, "needs the e2e fixture links");

const stage = (page: Page) => page.getByTestId("story-stage");

test("a live link replays the frozen story with no lookup, then Look up your own opens the entry", async ({
  page,
}) => {
  const urls = await mockLookup(page, ndjson({ type: "resolved", accountId: 1 }, storyEvent()));
  await page.goto(`/w/${LIVE_SLUG}`);
  await expect(stage(page)).toHaveAttribute("data-slide", "intro");
  await expect(page.getByText("Shared Nov 11, 2026 · numbers from that day")).toBeVisible();
  await expect(page.getByText("Gaben's story")).toBeVisible();
  await expect(page.getByRole("button", { name: "Refresh" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "See their latest" })).toBeVisible();
  expect(urls).toHaveLength(0);

  await page.getByRole("button", { name: "Look up your own" }).click();
  await expect(page.getByLabel("Paste your Steam profile URL")).toBeVisible();
  expect(urls).toHaveLength(0);
});

test("See their latest runs a live lookup and plays the live story", async ({ page }) => {
  const urls = await mockLookup(page, ndjson({ type: "resolved", accountId: 1 }, storyEvent()));
  await page.goto(`/w/${LIVE_SLUG}`);
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "See their latest" }).click();
  await expect(stage(page)).toHaveAttribute("data-slide", "intro");
  await expect(page.getByRole("button", { name: "Refresh" })).toBeVisible();
  expect(urls).toHaveLength(1);
  expect(urls[0].searchParams.get("q")).toBe("1");
});

test("an expired link says so and never sends the story to the browser", async ({ page }) => {
  const html = await (await page.request.get(`/w/${EXPIRED_SLUG}`)).text();
  // The same marker is in a live link's page, so this check is not vacuous.
  const live = await (await page.request.get(`/w/${LIVE_SLUG}`)).text();
  expect(live).toContain("matchCount");
  expect(html).not.toContain("matchCount");
  await page.goto(`/w/${EXPIRED_SLUG}`);
  await expect(page.getByRole("heading", { name: "This story has expired" })).toBeVisible();
  await expect(page.getByRole("button", { name: "See their latest" })).toBeVisible();
});

test("an unknown link is a 404", async ({ page }) => {
  const response = await page.goto("/w/no-such-story");
  expect(response?.status()).toBe(404);
});
