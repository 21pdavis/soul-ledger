import { expect, test, type Page, type Route } from "@playwright/test";
import { fixtureStory } from "../fixtures/story";
import { PATCH, PROFILE, enter, mockLookup, ndjson, openEntry, storyEvent } from "./lookup-mock";

// The lookup is mocked with NDJSON, so these run the same locally and against staging.
// The story's own behaviour is in story-player.spec.ts; here the player is just "it started".
const storyUp = (page: Page) => page.getByRole("list", { name: "Story progress" });

test("entering a URL starts the lookup with the URL and the all-time window", async ({ page }) => {
  const urls = await mockLookup(page, ndjson({ type: "resolved", accountId: 1 }, storyEvent()));
  await enter(page);
  await expect(storyUp(page)).toBeVisible();
  expect(urls).toHaveLength(1);
  expect(urls[0].searchParams.get("q")).toBe(PROFILE);
  expect(urls[0].searchParams.get("window")).toBe("all");
});

test("choosing This patch sends window=patch", async ({ page }) => {
  const urls = await mockLookup(page, ndjson(storyEvent({ window: "patch", patchStart: PATCH })));
  await openEntry(page);
  await page.getByLabel("Paste your Steam profile URL").fill(PROFILE);
  await page.getByRole("radio", { name: "This patch" }).check();
  await page.getByRole("button", { name: "Open the ledger" }).click();
  await expect(storyUp(page)).toBeVisible();
  expect(urls[0].searchParams.get("window")).toBe("patch");
});

test("the URL and window are remembered on the next visit", async ({ page }) => {
  await mockLookup(page, ndjson(storyEvent({ window: "patch", patchStart: PATCH })));
  await openEntry(page);
  await page.getByLabel("Paste your Steam profile URL").fill(PROFILE);
  await page.getByRole("radio", { name: "This patch" }).check();
  await page.getByRole("button", { name: "Open the ledger" }).click();
  await expect(storyUp(page)).toBeVisible();
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
  await expect(storyUp(page)).toHaveCount(0);
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
  await expect(storyUp(page)).toBeVisible();
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
  await expect(storyUp(page)).toHaveCount(0);
});

test("a Street Brawl-only player gets the zero-matches screen", async ({ page }) => {
  const brawl = fixtureStory({ matchCount: 0, excludedMatches: 14, main: null, mvp: null });
  await mockLookup(page, ndjson(storyEvent({}, brawl)));
  await enter(page);
  await expect(page.getByRole("heading", { name: "No Deadlock matches found" })).toBeVisible();
  await expect(page.getByText(/Street Brawl/)).toBeVisible();
  await expect(storyUp(page)).toHaveCount(0);
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

test("entry has no horizontal scroll and the Valve notice stays visible", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/Not affiliated with or endorsed by Valve/)).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

// #42: before React has hydrated, the form is plain HTML, and Enter used to submit it natively:
// the page reloaded and the typed URL was gone. The page is held at "HTML only" by keeping its
// scripts back until the end of the test.
test("Enter before the page has hydrated never reloads it, and the lookup works once it has", async ({
  page,
}) => {
  const urls = await mockLookup(page, ndjson({ type: "resolved", accountId: 1 }, storyEvent()));
  const held: Route[] = [];
  let released = false;
  await page.route("**/_next/static/**/*.js", (route) => {
    if (released) return route.continue();
    held.push(route);
  });
  const navigations: string[] = [];
  page.on("request", (r) => {
    if (r.isNavigationRequest()) navigations.push(r.url());
  });

  await page.goto("/", { waitUntil: "domcontentloaded" });
  const field = page.getByLabel("Paste your Steam profile URL");
  await expect(field).toBeVisible();
  // A reload would lose this.
  await page.evaluate(() => {
    (window as unknown as { beforeEnter: boolean }).beforeEnter = true;
  });
  navigations.length = 0;

  // The path from the issue: type the URL, press Enter. (Focus first: a field that is not ready
  // yet takes no text, and that is fine; what matters is that nothing reloads.)
  await field.focus();
  await page.keyboard.type(PROFILE);
  await page.keyboard.press("Enter");
  // Enter on another control of the form submits it too, unless the form is held back.
  // The window choice is held back as well: a pick made now would be reset by hydration.
  await expect(page.getByRole("radio", { name: "This patch" })).toBeDisabled();
  await expect(page.getByRole("radio", { name: "All time" })).toBeDisabled();
  await page.getByRole("radio", { name: "This patch" }).focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Open the ledger" }).click({ force: true });
  // Give a (wrong) native submit time to start its navigation.
  await page.waitForTimeout(500);

  expect(navigations, "the page navigated").toEqual([]);
  expect(
    await page.evaluate(() => (window as unknown as { beforeEnter?: boolean }).beforeEnter),
    "the page reloaded",
  ).toBe(true);
  expect(new URL(page.url()).search).toBe("");

  // Once the scripts arrive the page wakes up and a lookup works as usual.
  released = true;
  await Promise.all(held.map((route) => route.continue()));
  await field.fill(PROFILE);
  await page.getByRole("radio", { name: "This patch" }).check();
  await field.press("Enter");
  await expect(storyUp(page)).toBeVisible();
  expect(urls).toHaveLength(1);
  expect(urls[0].searchParams.get("q")).toBe(PROFILE);
  expect(urls[0].searchParams.get("window")).toBe("patch");
});
