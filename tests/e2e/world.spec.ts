import { expect, test, type Page } from "@playwright/test";
import { GRAPHICS_KEY } from "../../src/lib/client/graphics";
import { enter, mockLookup, ndjson, stageSettled, storyEvent } from "./lookup-mock";

// The 3D world behind the story (ADR 0068, 0069), through the real flow with the lookup mocked.
// Every spec starts with graphics Off (playwright.config.ts); the first test turns them back on.

async function openStory(page: Page) {
  await mockLookup(page, ndjson({ type: "resolved", accountId: 1 }, storyEvent()));
  await enter(page);
  await expect(page.getByTestId("story-stage")).toHaveAttribute("data-slide", "intro");
  await stageSettled(page);
}

test("the world mounts behind the story once it starts, and stays out of the way", async ({
  page,
}) => {
  await page.addInitScript((key) => localStorage.setItem(key, "full"), GRAPHICS_KEY);
  await openStory(page);
  const world = page.getByTestId("world");
  await expect(world).toBeAttached();
  await expect(world).toHaveAttribute("aria-hidden", "true");
  await expect(page.getByTestId("story-player")).toHaveAttribute("data-world", "on");
  // On Full or Simple the canvas appears; where the test browser has no WebGL, the still does.
  await expect(world.locator("canvas, img")).toHaveCount(1, { timeout: 30_000 });
  // The world never takes the pointer, so the story's controls still work over it.
  expect(await world.evaluate((el) => getComputedStyle(el).pointerEvents)).toBe("none");
});

test("on Off the world is a still picture and no 3D loads", async ({ page }) => {
  await openStory(page);
  const world = page.getByTestId("world");
  await expect(world).toHaveAttribute("data-level", "off");
  await expect(page.getByTestId("world-still")).toBeVisible();
  await expect(world.locator("canvas")).toHaveCount(0);
});
