import { expect, test, type Page } from "@playwright/test";
import { SLIDES } from "../../src/story/copy";
import { enter, mockLookup, ndjson, stageSettled, storyEvent } from "./lookup-mock";

// The real flow (entry -> lookup -> story) with the lookup mocked, so these run the same locally
// and against staging.

const stage = (page: Page) => page.getByTestId("story-stage");
const segments = (page: Page) =>
  page.getByRole("list", { name: "Story progress" }).getByRole("listitem");
const settled = stageSettled;

/** Enter a profile and land on slide 1 of the story. */
async function openStory(page: Page, over: Record<string, unknown> = {}, waitForSettle = true) {
  await mockLookup(page, ndjson({ type: "resolved", accountId: 1 }, storyEvent(over)));
  await enter(page);
  await expect(stage(page)).toHaveAttribute("data-slide", "intro");
  if (waitForSettle) await settled(page); // the opening entrance, so a first tap really advances
}

test.describe("both layouts", () => {
  test("the Valve notice stays on screen and the stage never runs under it", async ({ page }) => {
    await openStory(page);
    const notice = page.getByText(/Not affiliated with or endorsed by Valve/);
    await expect(notice).toBeInViewport();
    const stageBox = (await stage(page).boundingBox())!;
    const noticeBox = (await notice.boundingBox())!;
    expect(stageBox.y + stageBox.height).toBeLessThanOrEqual(noticeBox.y);
  });

  test("the cached-matches note sits below the player, clear of the progress bar", async ({
    page,
  }) => {
    await openStory(page, { stale: true });
    const note = page.getByText(/showing cached matches/i);
    await expect(note).toBeInViewport();
    const bar = (await page.getByRole("list", { name: "Story progress" }).boundingBox())!;
    const noteBox = (await note.boundingBox())!;
    const stageBox = (await stage(page).boundingBox())!;
    expect(bar.y + bar.height).toBeLessThanOrEqual(noteBox.y);
    expect(stageBox.y + stageBox.height).toBeLessThanOrEqual(noteBox.y);
    // the note can be dismissed and the notice is still there
    await page.getByRole("button", { name: "Dismiss" }).click();
    await expect(note).toHaveCount(0);
    await expect(page.getByText(/Not affiliated with or endorsed by Valve/)).toBeInViewport();
  });

  test("no sideways scroll while the story plays", async ({ page }) => {
    await openStory(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe("phone: tap controller", () => {
  test.skip(({ isMobile }) => !isMobile, "phone only");

  // Taps land 6px in from the stage edge, inside the slide frame's padding, where no slide control
  // (Refresh, Replay, Look up another player...) can ever be. The tap is always a navigation tap.
  async function tapSide(page: Page, side: "left" | "right") {
    const box = (await stage(page).boundingBox())!;
    await stage(page).tap({
      position: { x: side === "right" ? box.width - 6 : 6, y: box.height * 0.5 },
    });
  }

  test("is the tap controller, with 11 segments and the first one current", async ({ page }) => {
    await openStory(page);
    await expect(page.getByTestId("story-player")).toHaveAttribute("data-mode", "tap");
    await expect(segments(page)).toHaveCount(11);
    await expect(segments(page).nth(0)).toHaveAttribute("data-state", "current");
    await expect(segments(page).nth(1)).toHaveAttribute("data-state", "todo");
  });

  test("tapping the right side steps through all 11 slides, filling the progress bar", async ({
    page,
  }) => {
    await openStory(page);
    for (let i = 0; i < SLIDES.length; i++) {
      await expect(stage(page)).toHaveAttribute("data-slide", SLIDES[i].id);
      await expect(page.getByRole("heading", { name: SLIDES[i].headline })).toBeVisible();
      await expect(segments(page).nth(i)).toHaveAttribute("data-state", "current");
      if (i > 0) await expect(segments(page).nth(i - 1)).toHaveAttribute("data-state", "done");
      if (i < SLIDES.length - 1) {
        await settled(page);
        await tapSide(page, "right");
      }
    }
    // the last slide is the end: another tap goes nowhere
    await settled(page);
    await tapSide(page, "right");
    await expect(stage(page)).toHaveAttribute("data-slide", "summary");
  });

  // #70: after a touch ends the browser sends a click at the finger's spot. When the tap has just
  // swapped in the summary, that click used to land on Replay / Look up another player.
  test("the tap that opens the summary does not also press a summary button", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await openStory(page);
    for (let i = 0; i < SLIDES.length - 1; i++) {
      await settled(page);
      await tapSide(page, "right");
    }
    await expect(stage(page)).toHaveAttribute("data-slide", "summary");
    const spots: { x: number; y: number }[] = [];
    for (const name of ["Replay", "Look up another player"]) {
      const box = (await page.getByRole("button", { name }).boundingBox())!;
      spots.push({ x: box.x + box.width / 2, y: box.y + box.height / 2 });
    }
    for (const spot of spots) {
      await settled(page);
      await tapSide(page, "left"); // back to the last story slide
      await expect(stage(page)).toHaveAttribute("data-slide", "mvp");
      await settled(page);
      await page.touchscreen.tap(spot.x, spot.y);
      await expect(stage(page)).toHaveAttribute("data-slide", "summary");
      await page.waitForTimeout(300); // long enough for a stray click to have been handled
      await expect(stage(page)).toHaveAttribute("data-slide", "summary");
    }
  });

  test("tapping the left side goes back, and does nothing on the first slide", async ({ page }) => {
    await openStory(page);
    await tapSide(page, "left");
    await expect(stage(page)).toHaveAttribute("data-slide", "intro");
    await tapSide(page, "right");
    await expect(stage(page)).toHaveAttribute("data-slide", "main");
    await settled(page);
    await tapSide(page, "left");
    await expect(stage(page)).toHaveAttribute("data-slide", "intro");
    await expect(segments(page).nth(0)).toHaveAttribute("data-state", "current");
  });

  test("a tap during the entrance only completes it, the next one advances", async ({ page }) => {
    await openStory(page, {}, false);
    await expect(stage(page)).toHaveAttribute("data-animating", "true");
    await tapSide(page, "right");
    await expect(stage(page)).toHaveAttribute("data-animating", "false");
    await expect(stage(page)).toHaveAttribute("data-slide", "intro");
    await tapSide(page, "right");
    await expect(stage(page)).toHaveAttribute("data-slide", "main");
  });

  test("the stage is 9:16 and fits the screen", async ({ page }) => {
    await openStory(page);
    const box = (await stage(page).boundingBox())!;
    const viewport = page.viewportSize()!;
    expect(box.width).toBeLessThanOrEqual(viewport.width);
    expect(box.height).toBeLessThanOrEqual(viewport.height);
    expect(box.width / box.height).toBeCloseTo(9 / 16, 1);
  });
});

test.describe("desktop: scroll controller", () => {
  test.skip(({ isMobile }) => isMobile, "desktop only");

  const track = (page: Page) => page.getByTestId("scroll-track");
  /** The checkpoint the track is resting on, or null while it is between two. */
  const restingCheckpoint = (page: Page) =>
    track(page).evaluate((el) => {
      const i = el.scrollTop / el.clientHeight;
      return Math.abs(i - Math.round(i)) < 0.01 ? Math.round(i) : null;
    });

  const card = (page: Page, i: number) => page.getByTestId("story-card").nth(i);

  test("has 11 snap checkpoints and a clickable 11-segment progress bar", async ({ page }) => {
    await openStory(page);
    await expect(page.getByTestId("story-player")).toHaveAttribute("data-mode", "scroll");
    await expect(page.getByTestId("checkpoint")).toHaveCount(11);
    await expect(segments(page)).toHaveCount(11);
    await expect(segments(page).nth(0)).toHaveAttribute("data-state", "current");
  });

  test("the slides are wide cards with room above and gutters left and right", async ({ page }) => {
    await openStory(page);
    const viewport = page.viewportSize()!;
    const box = (await card(page, 0).boundingBox())!;
    expect(box.width).toBeGreaterThan(640); // not the 480px phone column
    expect(box.width).toBeGreaterThan(box.height * 0.9); // landscape-ish, not 9:16
    expect(box.y).toBeGreaterThanOrEqual(24); // breathing room above the story
    expect(box.x).toBeGreaterThanOrEqual(64); // gutters either side
    expect(viewport.width - (box.x + box.width)).toBeGreaterThanOrEqual(64);
  });

  test("scrolling down moves the page: the first card leaves the top and the next arrives", async ({
    page,
  }) => {
    await openStory(page);
    const before = (await card(page, 0).boundingBox())!;
    await stage(page).hover();
    await page.mouse.wheel(0, 600);
    await expect.poll(() => restingCheckpoint(page)).toBe(1);
    const after = (await card(page, 0).boundingBox())!;
    expect(after.y).toBeLessThan(before.y - 100); // it really moved up and away
    const next = (await card(page, 1).boundingBox())!;
    expect(Math.abs(next.y - before.y)).toBeLessThan(2); // card 2 now sits where card 1 was
  });

  test("only the current card is reachable: the others are inert", async ({ page }) => {
    await openStory(page);
    await expect(card(page, 0)).not.toHaveAttribute("inert", "");
    for (const i of [1, 5, 10]) await expect(card(page, i)).toHaveAttribute("inert", "");
    await stage(page).hover();
    await page.mouse.wheel(0, 600);
    await expect.poll(() => restingCheckpoint(page)).toBe(1);
    await expect(card(page, 1)).not.toHaveAttribute("inert", "");
    await expect(card(page, 0)).toHaveAttribute("inert", "");
  });

  test("the progress bar runs down the side", async ({ page }) => {
    await openStory(page);
    const first = (await segments(page).nth(0).boundingBox())!;
    const last = (await segments(page).nth(10).boundingBox())!;
    expect(last.y).toBeGreaterThan(first.y + 100);
    expect(Math.abs(last.x - first.x)).toBeLessThan(2);
    const cardBox = (await card(page, 0).boundingBox())!;
    expect(first.x).toBeGreaterThan(cardBox.x + cardBox.width); // in the right gutter
  });

  test("scrolling lands on a snap checkpoint and plays that slide", async ({ page }) => {
    await openStory(page);
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
    await openStory(page);
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
    await openStory(page);
    await page.getByRole("button", { name: "Go to slide 8" }).click();
    await expect(stage(page)).toHaveAttribute("data-slide", "roast");
    await expect.poll(() => restingCheckpoint(page)).toBe(7);
    await expect(segments(page).nth(7)).toHaveAttribute("data-state", "current");
    // and it stays there: the scroll that followed did not bounce the slide
    await page.waitForTimeout(400);
    await expect(stage(page)).toHaveAttribute("data-slide", "roast");
  });

  test("the last checkpoint is reachable and the Valve notice is still on screen there", async ({
    page,
  }) => {
    await openStory(page);
    await page.getByRole("button", { name: "Go to slide 11" }).click();
    await expect(stage(page)).toHaveAttribute("data-slide", "summary");
    await expect.poll(() => restingCheckpoint(page)).toBe(10);
    // exactly on the snap point, not a few pixels off it
    const [top, height] = await track(page).evaluate((el) => [el.scrollTop, el.clientHeight]);
    expect(top).toBe(10 * height);
    await expect(page.getByText(/Not affiliated with or endorsed by Valve/)).toBeInViewport();
  });

  test("checkpoints are a whole number of pixels tall, so scroll targets sit on snap points", async ({
    page,
  }) => {
    for (const over of [{}, { stale: true }]) {
      await openStory(page, over);
      const heights = await track(page).evaluate((el) => [
        el.getBoundingClientRect().height,
        ...[...el.querySelectorAll("[data-testid=checkpoint]")].map(
          (c) => c.getBoundingClientRect().height,
        ),
      ]);
      for (const h of heights) expect(Number.isInteger(h)).toBe(true);
      await page.goto("/");
    }
  });

  test("the progress bar shows a focus ring when reached by keyboard", async ({ page }) => {
    await openStory(page);
    await page.getByRole("button", { name: "Go to slide 1", exact: true }).focus();
    await page.keyboard.press("Tab");
    const outline = await page
      .getByRole("button", { name: "Go to slide 2", exact: true })
      .evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outline).toBe("solid");
  });
});
