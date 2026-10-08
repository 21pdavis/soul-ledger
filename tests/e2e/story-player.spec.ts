import { expect, test, type Page } from "@playwright/test";
import { SLIDES } from "../../src/story/copy";

// Drives the story player over fixture data on the temporary /preview route, which the local e2e
// server enables with STORY_PREVIEW=1 (playwright.config.ts). Not available on live staging.
test.skip(!!process.env.STAGING_URL, "the preview route only exists on the local e2e server");

const stage = (page: Page) => page.getByTestId("story-stage");
const segments = (page: Page) =>
  page.getByRole("list", { name: "Story progress" }).getByRole("listitem");
const settled = (page: Page) => expect(stage(page)).toHaveAttribute("data-animating", "false");

test.describe("phone: tap controller", () => {
  test.skip(({ isMobile }) => !isMobile, "phone only");

  test.beforeEach(async ({ page }) => {
    await page.goto("/preview");
    await expect(stage(page)).toHaveAttribute("data-slide", "intro");
  });

  async function tapSide(page: Page, side: "left" | "right") {
    const box = (await stage(page).boundingBox())!;
    await stage(page).tap({
      position: { x: box.width * (side === "right" ? 0.85 : 0.15), y: box.height * 0.5 },
    });
  }

  test("is the tap controller, with 11 segments and the first one current", async ({ page }) => {
    await expect(page.getByTestId("story-player")).toHaveAttribute("data-mode", "tap");
    await expect(segments(page)).toHaveCount(11);
    await expect(segments(page).nth(0)).toHaveAttribute("data-state", "current");
    await expect(segments(page).nth(1)).toHaveAttribute("data-state", "todo");
  });

  test("tapping the right side advances and the left side goes back", async ({ page }) => {
    await tapSide(page, "right");
    await expect(stage(page)).toHaveAttribute("data-slide", "main");
    await expect(page.getByRole("heading", { name: SLIDES[1].headline })).toBeVisible();
    await expect(segments(page).nth(1)).toHaveAttribute("data-state", "current");
    await expect(segments(page).nth(0)).toHaveAttribute("data-state", "done");
    await settled(page);
    await tapSide(page, "left");
    await expect(stage(page)).toHaveAttribute("data-slide", "intro");
    await expect(segments(page).nth(0)).toHaveAttribute("data-state", "current");
  });

  test("a tap during the entrance only completes it, the next one advances", async ({ page }) => {
    await tapSide(page, "right");
    await expect(stage(page)).toHaveAttribute("data-slide", "main");
    await tapSide(page, "right");
    await expect(stage(page)).toHaveAttribute("data-slide", "main");
    await settled(page);
    await tapSide(page, "right");
    await expect(stage(page)).toHaveAttribute("data-slide", "roster");
  });

  test("back on the first slide does nothing", async ({ page }) => {
    await tapSide(page, "left");
    await expect(stage(page)).toHaveAttribute("data-slide", "intro");
  });

  test("the stage is 9:16 and fits the screen without sideways scroll", async ({ page }) => {
    const box = (await stage(page).boundingBox())!;
    const viewport = page.viewportSize()!;
    expect(box.width).toBeLessThanOrEqual(viewport.width);
    expect(box.height).toBeLessThanOrEqual(viewport.height);
    expect(box.width / box.height).toBeCloseTo(9 / 16, 1);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe("desktop: scroll controller", () => {
  test.skip(({ isMobile }) => isMobile, "desktop only");

  test.beforeEach(async ({ page }) => {
    await page.goto("/preview");
    await expect(stage(page)).toHaveAttribute("data-slide", "intro");
  });

  const track = (page: Page) => page.getByTestId("scroll-track");
  /** The checkpoint the track is resting on, or null while it is between two. */
  const restingCheckpoint = (page: Page) =>
    track(page).evaluate((el) => {
      const i = el.scrollTop / el.clientHeight;
      return Math.abs(i - Math.round(i)) < 0.01 ? Math.round(i) : null;
    });

  test("has 11 snap checkpoints, a clickable 11-segment progress bar and a 480px stage", async ({
    page,
  }) => {
    await expect(page.getByTestId("story-player")).toHaveAttribute("data-mode", "scroll");
    await expect(page.getByTestId("checkpoint")).toHaveCount(11);
    await expect(segments(page)).toHaveCount(11);
    await expect(segments(page).nth(0)).toHaveAttribute("data-state", "current");
    const box = (await stage(page).boundingBox())!;
    expect(box.width).toBeLessThanOrEqual(480);
    expect(box.width / box.height).toBeCloseTo(9 / 16, 1);
  });

  test("scrolling lands on a snap checkpoint and plays that slide", async ({ page }) => {
    await stage(page).hover();
    await page.mouse.wheel(0, 600);
    await expect.poll(() => restingCheckpoint(page)).toBe(1);
    await expect(stage(page)).toHaveAttribute("data-slide", "main");
    await page.mouse.wheel(0, 600);
    await expect.poll(() => restingCheckpoint(page)).toBe(2);
    await expect(stage(page)).toHaveAttribute("data-slide", "roster");
    await page.mouse.wheel(0, -600);
    await expect.poll(() => restingCheckpoint(page)).toBe(1);
    await expect(stage(page)).toHaveAttribute("data-slide", "main");
  });

  test("arrow keys and space change slide and the scroll follows", async ({ page }) => {
    await page.keyboard.press("ArrowRight");
    await expect(stage(page)).toHaveAttribute("data-slide", "main");
    await expect.poll(() => restingCheckpoint(page)).toBe(1);
    await page.keyboard.press("Space");
    await expect(stage(page)).toHaveAttribute("data-slide", "roster");
    await expect.poll(() => restingCheckpoint(page)).toBe(2);
    await page.keyboard.press("ArrowLeft");
    await expect(stage(page)).toHaveAttribute("data-slide", "main");
    await expect.poll(() => restingCheckpoint(page)).toBe(1);
  });

  test("clicking a progress-bar segment jumps there and the scroll follows", async ({ page }) => {
    await page.getByRole("button", { name: "Go to slide 8" }).click();
    await expect(stage(page)).toHaveAttribute("data-slide", "roast");
    await expect.poll(() => restingCheckpoint(page)).toBe(7);
    await expect(segments(page).nth(7)).toHaveAttribute("data-state", "current");
    // and it stays there: the scroll that followed did not bounce the slide
    await page.waitForTimeout(400);
    await expect(stage(page)).toHaveAttribute("data-slide", "roast");
  });

  test("the progress bar shows a focus ring when reached by keyboard", async ({ page }) => {
    const first = page.getByRole("button", { name: "Go to slide 1", exact: true });
    await first.focus();
    await page.keyboard.press("Tab");
    const outline = await page
      .getByRole("button", { name: "Go to slide 2", exact: true })
      .evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outline).toBe("solid");
  });
});
