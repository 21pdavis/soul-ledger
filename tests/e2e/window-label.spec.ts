import { expect, test, type Page } from "@playwright/test";
import { PATCH, enter, mockLookup, ndjson, storyEvent } from "./lookup-mock";

// Slide 1 says which window the story covers, from the story event's meta (never a client date).
// Runs on phone and desktop, with the lookup mocked.

async function openStory(page: Page, over: Record<string, unknown>) {
  await mockLookup(page, ndjson({ type: "resolved", accountId: 1 }, storyEvent(over)));
  await enter(page);
  await expect(page.getByTestId("story-stage")).toHaveAttribute("data-slide", "intro");
}

const intro = (page: Page) =>
  page.getByRole("region", { name: "Welcome back to the Cursed Apple" });

test("an all-time story says 'All time' on slide 1, with the matches line", async ({ page }) => {
  await openStory(page, { window: "all", patchStart: null });
  await expect(intro(page).getByText("All time", { exact: true })).toBeVisible();
  await expect(intro(page).getByText("Based on 120 matches")).toBeVisible();
});

test("a patch story says 'Since patch <date>', using the server's UTC date", async ({ page }) => {
  await openStory(page, { window: "patch", patchStart: PATCH });
  await expect(intro(page).getByText("Since patch Sep 30, 2026")).toBeVisible();
});

test("a patch window without a patch date is never labelled as this patch", async ({ page }) => {
  await openStory(page, { window: "patch", patchStart: null });
  await expect(intro(page).getByText("All time (couldn't find the patch date)")).toBeVisible();
  await expect(page.getByText(/this patch/i)).toHaveCount(0);
});
