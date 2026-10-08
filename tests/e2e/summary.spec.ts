import { expect, test, type Page } from "@playwright/test";
import { mockLookup, ndjson, openEntry, PATCH, PROFILE, storyEvent } from "./lookup-mock";

// Slide 11 on the real flow (entry -> lookup -> story) with the lookup mocked, so these run the
// same locally and against staging.

const stage = (page: Page) => page.getByTestId("story-stage");

/** From slide 1, play the story through to the summary slide with the keyboard. */
async function playToSummary(page: Page) {
  await expect(stage(page)).toHaveAttribute("data-slide", "intro");
  for (let i = 0; i < 30; i++) {
    if ((await stage(page).getAttribute("data-slide")) === "summary") break;
    // Wait out the entrance so each key press really advances.
    await expect(stage(page)).toHaveAttribute("data-animating", "false");
    await page.keyboard.press("ArrowRight");
  }
  await expect(stage(page)).toHaveAttribute("data-slide", "summary");
  await expect(stage(page)).toHaveAttribute("data-animating", "false");
}

/** Look up the profile (optionally with the This patch window) and land on the summary slide. */
async function openSummary(page: Page, over: Record<string, unknown> = {}, patch = false) {
  const urls = await mockLookup(page, ndjson({ type: "resolved", accountId: 1 }, storyEvent(over)));
  await openEntry(page);
  await page.getByLabel("Paste your Steam profile URL").fill(PROFILE);
  if (patch) await page.getByRole("radio", { name: "This patch" }).check();
  await page.getByRole("button", { name: "Open the ledger" }).click();
  await playToSummary(page);
  return urls;
}

test("the summary shows the card, the window and the matches it is based on", async ({ page }) => {
  await openSummary(page);
  await expect(page.getByRole("heading", { name: "Entered into the ledger" })).toBeVisible();
  const card = page.getByRole("list", { name: "Your ledger entry" });
  await expect(card).toContainText("Infernus");
  await expect(card).toContainText("Oracle 1");
  await expect(page.getByText("All time")).toBeVisible();
  await expect(page.getByText("Based on 120 matches")).toBeVisible();
  // The Valve notice (ADR 0016) is the app's strip under the player, exactly once.
  const notice = page.getByText(/Not affiliated with or endorsed by Valve/);
  await expect(notice).toHaveCount(1);
  await expect(notice).toBeInViewport();
});

test("Refresh on the summary reruns the lookup with refresh=1 and the same window", async ({
  page,
}) => {
  const urls = await openSummary(page, { window: "patch", patchStart: PATCH }, true);
  await expect(page.getByText("Since patch Sep 30, 2026")).toBeVisible();
  await page.getByRole("button", { name: "Refresh" }).click();
  await expect.poll(() => urls.length).toBe(2);
  expect(urls[1].searchParams.get("refresh")).toBe("1");
  expect(urls[1].searchParams.get("window")).toBe("patch");
  // The story is back (a refresh lands on slide 1 again).
  await expect(stage(page)).toBeVisible();
});

test("Replay returns to slide 1", async ({ page }) => {
  await openSummary(page);
  await page.getByRole("button", { name: "Replay" }).click();
  await expect(stage(page)).toHaveAttribute("data-slide", "intro");
});

test("Look up another player returns to the entry screen", async ({ page }) => {
  await openSummary(page);
  await page.getByRole("button", { name: "Look up another player" }).click();
  await expect(page.getByLabel("Paste your Steam profile URL")).toBeVisible();
});

test.describe("small phones: nothing on the card is clipped by the stage", () => {
  test.skip(({ isMobile }) => !isMobile, "phone only");

  for (const [width, height] of [
    [320, 568],
    [360, 640],
    [375, 667],
  ]) {
    test(`${width}x${height}: the three actions are reachable and the card fits the stage`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await openSummary(page);
      const stageBox = (await stage(page).boundingBox())!;
      for (const name of ["Replay", "Look up another player", "Refresh"]) {
        const button = page.getByRole("button", { name });
        await expect(button).toBeVisible();
        const box = (await button.boundingBox())!;
        expect(box.y).toBeGreaterThanOrEqual(stageBox.y);
        expect(box.y + box.height).toBeLessThanOrEqual(stageBox.y + stageBox.height);
        expect(box.x).toBeGreaterThanOrEqual(stageBox.x);
        expect(box.x + box.width).toBeLessThanOrEqual(stageBox.x + stageBox.width);
      }
      // The slide's own frame did not overflow (the stage clips whatever overflows).
      const overflow = await stage(page)
        .locator("section")
        .first()
        .evaluate((el) => el.scrollHeight - el.clientHeight);
      expect(overflow).toBeLessThanOrEqual(0);
      // And the Valve notice is still on screen under the stage.
      await expect(page.getByText(/Not affiliated with or endorsed by Valve/)).toBeInViewport();
    });
  }
});
