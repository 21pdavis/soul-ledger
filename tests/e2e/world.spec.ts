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

test("the corner button cycles the graphics level, stays clear of the controls, and is remembered", async ({
  page,
}) => {
  await openStory(page);
  const button = page.getByTestId("graphics-button");
  // Without WebGL there is nothing to switch, and the button is not shown.
  test.skip((await button.count()) === 0, "this browser has no WebGL");
  const world = page.getByTestId("world");
  await expect(button).toBeVisible();
  await expect(button).toHaveAccessibleName(/Graphics: Off/);

  // It does not sit on the progress bar (top on a phone, side rail on desktop) or leave the screen.
  const box = (await button.boundingBox())!;
  const bar = (await page.getByRole("list", { name: "Story progress" }).boundingBox())!;
  const viewport = page.viewportSize()!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
  const overlaps =
    box.x < bar.x + bar.width &&
    box.x + box.width > bar.x &&
    box.y < bar.y + bar.height &&
    box.y + box.height > bar.y;
  expect(overlaps).toBe(false);

  await button.click();
  await expect(world).toHaveAttribute("data-level", "full");
  await button.click();
  await expect(world).toHaveAttribute("data-level", "simple");
  await expect(button).toHaveAccessibleName(/Graphics: Simple/);
  // Switching is live: the story is still on its first slide.
  await expect(page.getByTestId("story-stage")).toHaveAttribute("data-slide", "intro");

  await page.reload();
  await mockLookup(page, ndjson({ type: "resolved", accountId: 1 }, storyEvent()));
  await enter(page);
  await expect(page.getByTestId("story-stage")).toHaveAttribute("data-slide", "intro");
  await expect(page.getByTestId("world")).toHaveAttribute("data-level", "simple");
  await expect(page.getByTestId("graphics-button")).toHaveAccessibleName(/Graphics: Simple/);
});

test("the graphics button never straddles the story frame's bottom edge", async ({ page }) => {
  await openStory(page);
  const button = page.getByTestId("graphics-button");
  test.skip((await button.count()) === 0, "this browser has no WebGL");
  const box = (await button.boundingBox())!;
  // On a phone the frame is the stage; on desktop it is the first story card.
  const desktop = (await page.getByTestId("story-card").count()) > 0;
  const frame = desktop ? page.getByTestId("story-card").first() : page.getByTestId("story-stage");
  const f = (await frame.boundingBox())!;
  const bottom = f.y + f.height;
  const ring = 8; // the double rule drawn outside the frame
  const beside = box.x + box.width <= f.x || box.x >= f.x + f.width;
  const below = box.y >= bottom + ring;
  const inside = box.y + box.height <= bottom - ring;
  expect(
    beside || below || inside,
    `pill ${box.y}-${box.y + box.height} vs frame bottom ${bottom}`,
  ).toBe(true);
});

test("the world follows the story: its slide updates when the slide changes", async ({ page }) => {
  await openStory(page);
  const world = page.getByTestId("world");
  await expect(world).toHaveAttribute("data-slide", "0");
  await page.keyboard.press("ArrowRight");
  await expect(page.getByTestId("story-stage")).toHaveAttribute("data-slide", "main");
  await expect(world).toHaveAttribute("data-slide", "1");
  await stageSettled(page);
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByTestId("story-stage")).toHaveAttribute("data-slide", "intro");
  await expect(world).toHaveAttribute("data-slide", "0");
});

test("the graphics button stays clear of the summary's buttons", async ({ page }) => {
  await openStory(page);
  const button = page.getByTestId("graphics-button");
  test.skip((await button.count()) === 0, "this browser has no WebGL");
  const stage = page.getByTestId("story-stage");
  while ((await stage.getAttribute("data-slide")) !== "summary") {
    await page.keyboard.press("ArrowRight");
    await stageSettled(page);
  }
  const box = (await button.boundingBox())!;
  for (const name of ["Replay", "Look up another player", "Refresh", "Open the ledger"]) {
    const target = page.getByRole("button", { name, exact: true });
    // Refresh and Open the ledger only show for some stories.
    if ((await target.count()) === 0) continue;
    const other = (await target.first().boundingBox())!;
    const overlaps =
      box.x < other.x + other.width &&
      box.x + box.width > other.x &&
      box.y < other.y + other.height &&
      box.y + box.height > other.y;
    expect(overlaps, `graphics button overlaps ${name}`).toBe(false);
  }
});
