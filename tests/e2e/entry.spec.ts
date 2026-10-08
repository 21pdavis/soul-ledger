import { expect, test, type Page } from "@playwright/test";
import { fixtureStory } from "../fixtures/story";

// The lookup is mocked with NDJSON, so these run the same locally and against staging.

const PROFILE = "https://steamcommunity.com/id/gaben";
const PATCH = "2026-09-30T00:00:00.000Z";

const ndjson = (...events: unknown[]) => events.map((e) => JSON.stringify(e) + "\n").join("");

const storyEvent = (over: Record<string, unknown> = {}, story = fixtureStory()) => ({
  type: "story",
  player: { accountId: 1, personaName: "Gaben", avatarUrl: null },
  window: "all",
  patchStart: null,
  stale: false,
  story,
  ...over,
});

/** Answers each /api/lookup call with the next body, and records the requested URLs. */
async function mockLookup(page: Page, ...bodies: string[]) {
  const urls: URL[] = [];
  await page.route("**/api/lookup**", async (route) => {
    urls.push(new URL(route.request().url()));
    const body = bodies.length > 1 ? bodies.shift()! : bodies[0];
    await route.fulfill({ status: 200, contentType: "application/x-ndjson", body });
  });
  return urls;
}

/** Opens the entry screen and waits for hydration, so typing and clicking are not lost. */
async function openEntry(page: Page) {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
}

async function enter(page: Page, url = PROFILE) {
  await openEntry(page);
  await page.getByLabel("Paste your Steam profile URL").fill(url);
  await page.getByRole("button", { name: "Open the ledger" }).click();
}

test("entering a URL starts the lookup with the URL and the all-time window", async ({ page }) => {
  const urls = await mockLookup(page, ndjson({ type: "resolved", accountId: 1 }, storyEvent()));
  await enter(page);
  await expect(page.getByText("Story ready: 120 matches")).toBeVisible();
  expect(urls).toHaveLength(1);
  expect(urls[0].searchParams.get("q")).toBe(PROFILE);
  expect(urls[0].searchParams.get("window")).toBe("all");
  await expect(page.getByText("All time")).toBeVisible();
});

test("choosing This patch sends window=patch and the story says which patch", async ({ page }) => {
  const urls = await mockLookup(page, ndjson(storyEvent({ window: "patch", patchStart: PATCH })));
  await openEntry(page);
  await page.getByLabel("Paste your Steam profile URL").fill(PROFILE);
  await page.getByRole("radio", { name: "This patch" }).check();
  await page.getByRole("button", { name: "Open the ledger" }).click();
  await expect(page.getByText("Since patch Sep 30, 2026")).toBeVisible();
  expect(urls[0].searchParams.get("window")).toBe("patch");
});

test("the URL and window are remembered on the next visit", async ({ page }) => {
  await mockLookup(page, ndjson(storyEvent({ window: "patch", patchStart: PATCH })));
  await openEntry(page);
  await page.getByLabel("Paste your Steam profile URL").fill(PROFILE);
  await page.getByRole("radio", { name: "This patch" }).check();
  await page.getByRole("button", { name: "Open the ledger" }).click();
  await expect(page.getByText(/Story ready/)).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Paste your Steam profile URL")).toHaveValue(PROFILE);
  await expect(page.getByRole("radio", { name: "This patch" })).toBeChecked();
});

test("an invalid URL shows an inline message and makes no request", async ({ page }) => {
  const urls = await mockLookup(page, ndjson(storyEvent()));
  await enter(page, "https://example.com/not-steam");
  await expect(page.getByText("That doesn't look like a Steam profile URL.")).toBeVisible();
  expect(urls).toHaveLength(0);
});

test("a profile that is not found gets its full-screen state", async ({ page }) => {
  await mockLookup(page, ndjson({ type: "error", reason: "not_found" }));
  await enter(page);
  await expect(page.getByRole("heading", { name: "We couldn't find that profile" })).toBeVisible();
  await expect(page.getByText(/public/)).toBeVisible();
  await expect(page.getByText(/Story ready/)).toHaveCount(0);
});

test("unavailable shows a full-screen state, and retry reruns the same lookup", async ({
  page,
}) => {
  const urls = await mockLookup(
    page,
    ndjson({ type: "error", reason: "unavailable" }),
    ndjson(storyEvent()),
  );
  await enter(page);
  await expect(page.getByText(/try again in a minute/i)).toBeVisible();
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByText("Story ready: 120 matches")).toBeVisible();
  expect(urls).toHaveLength(2);
  expect(urls[1].searchParams.get("q")).toBe(PROFILE);
  expect(urls[1].searchParams.get("window")).toBe("all");
});

test("a dropped connection shows the retry screen", async ({ page }) => {
  await page.route("**/api/lookup**", (route) => route.abort("failed"));
  await enter(page);
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
});

test("zero matches shows the friendly screen and never mounts the story", async ({ page }) => {
  const empty = fixtureStory({ matchCount: 0, main: null, mvp: null });
  await mockLookup(page, ndjson(storyEvent({}, empty)));
  await enter(page);
  await expect(page.getByRole("heading", { name: "No Deadlock matches found" })).toBeVisible();
  await expect(page.getByText(/Story ready/)).toHaveCount(0);
});

test("a Street Brawl-only player gets the zero-matches screen", async ({ page }) => {
  const brawl = fixtureStory({ matchCount: 0, excludedMatches: 14, main: null, mvp: null });
  await mockLookup(page, ndjson(storyEvent({}, brawl)));
  await enter(page);
  await expect(page.getByRole("heading", { name: "No Deadlock matches found" })).toBeVisible();
  await expect(page.getByText(/Street Brawl/)).toBeVisible();
  await expect(page.getByText(/Story ready/)).toHaveCount(0);
});

test("a patch window with no matches says so", async ({ page }) => {
  const empty = fixtureStory({ matchCount: 0, main: null, mvp: null });
  await mockLookup(page, ndjson(storyEvent({ window: "patch", patchStart: PATCH }, empty)));
  await openEntry(page);
  await page.getByLabel("Paste your Steam profile URL").fill(PROFILE);
  await page.getByRole("radio", { name: "This patch" }).check();
  await page.getByRole("button", { name: "Open the ledger" }).click();
  await expect(page.getByText(/no matches since the latest patch/i)).toBeVisible();
});

test("a stale story shows the cached-matches note", async ({ page }) => {
  await mockLookup(page, ndjson(storyEvent({ stale: true })));
  await enter(page);
  await expect(page.getByText(/showing cached matches/i)).toBeVisible();
});

test("Refresh reruns the lookup with refresh=1 and the same window", async ({ page }) => {
  const urls = await mockLookup(page, ndjson(storyEvent({ window: "patch", patchStart: PATCH })));
  await openEntry(page);
  await page.getByLabel("Paste your Steam profile URL").fill(PROFILE);
  await page.getByRole("radio", { name: "This patch" }).check();
  await page.getByRole("button", { name: "Open the ledger" }).click();
  await page.getByRole("button", { name: "Refresh" }).click();
  await expect(page.getByText(/Story ready/)).toBeVisible();
  expect(urls).toHaveLength(2);
  expect(urls[1].searchParams.get("refresh")).toBe("1");
  expect(urls[1].searchParams.get("window")).toBe("patch");
});

test("entry has no horizontal scroll and the Valve notice stays visible", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/Not affiliated with or endorsed by Valve/)).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
