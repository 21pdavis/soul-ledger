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

type Box = { x: number; y: number; width: number; height: number };
const intersects = (a: Box, b: Box) =>
  a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

// Short phones are where space runs out (#79): the button must keep off the story frame, its
// double rule and every slide, and stay a comfortable tap target.
for (const [width, height] of [
  [320, 568],
  [360, 640],
  [360, 699],
  [412, 915],
] as const) {
  test(`${width}x${height}: the graphics icon sits in the bottom-right corner, off the story frame`, async ({
    page,
  }, info) => {
    test.skip(info.project.name !== "phone", "phone sizes");
    await page.setViewportSize({ width, height });
    await openStory(page);
    const button = page.getByTestId("graphics-button");
    test.skip((await button.count()) === 0, "this browser has no WebGL");
    const box = (await button.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(32);
    expect(box.height).toBeGreaterThanOrEqual(32);
    // Bottom-right corner of the screen.
    expect(box.x + box.width).toBeGreaterThan(width - 24);
    expect(box.y + box.height).toBeGreaterThan(height - 24);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
    expect(box.y + box.height).toBeLessThanOrEqual(height);
    // Clear of the frame and the 8px double rule drawn outside it, so no slide is covered.
    const f = (await page.getByTestId("story-stage").boundingBox())!;
    const ring = 8;
    const frame = {
      x: f.x - ring,
      y: f.y - ring,
      width: f.width + 2 * ring,
      height: f.height + 2 * ring,
    };
    expect(intersects(box, frame), "graphics icon on the story frame").toBe(false);
    // And clear of the notice text under the story.
    const notice = (await page.locator("footer small").boundingBox())!;
    expect(intersects(box, notice), "graphics icon on the notice").toBe(false);
  });

  test(`${width}x${height}: the story frame's outer rule is not cut off at the top`, async ({
    page,
  }, info) => {
    test.skip(info.project.name !== "phone", "phone sizes");
    await page.setViewportSize({ width, height });
    await openStory(page);
    const f = (await page.getByTestId("story-stage").boundingBox())!;
    expect(f.y).toBeGreaterThanOrEqual(8);
  });
}

test("the graphics icon shows only an icon on a phone, and names its level on hover on desktop", async ({
  page,
}, info) => {
  await openStory(page);
  const button = page.getByTestId("graphics-button");
  test.skip((await button.count()) === 0, "this browser has no WebGL");
  await expect(button.locator("svg")).toBeVisible();
  const label = button.getByText("Graphics: Off");
  if (info.project.name === "phone") {
    await expect(label).toBeHidden();
    return;
  }
  await expect(label).toBeHidden();
  await button.hover();
  await expect(label).toBeVisible();
});

test("on desktop the graphics icon names its level when reached by keyboard", async ({
  page,
}, info) => {
  test.skip(info.project.name !== "desktop", "desktop only");
  await openStory(page);
  const button = page.getByTestId("graphics-button");
  test.skip((await button.count()) === 0, "this browser has no WebGL");
  const label = button.getByText("Graphics: Off");
  await expect(label).toBeHidden();
  // A key press makes the next focus a keyboard focus (:focus-visible), as tabbing to it would.
  await page.keyboard.press("Shift");
  await button.focus();
  await expect(label).toBeVisible();
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
