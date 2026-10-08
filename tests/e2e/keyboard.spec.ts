import { expect, test, type Page } from "@playwright/test";
import { SLIDES } from "../../src/story/copy";
import { mockLookup, ndjson, openEntry, PROFILE, stageSettled, storyEvent } from "./lookup-mock";

// ADR 0054: one test drives the whole product with the keyboard alone, entry to summary and
// Replay, and every stop on the way shows a visible focus ring. Nothing here clicks, taps or
// calls .focus(): only page.keyboard. Runs on phone and desktop.

const stage = (page: Page) => page.getByTestId("story-stage");

/** What the keyboard is on right now: its name and the outline it is drawn with. */
async function focusedStop(page: Page) {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) return null;
    // A radio is visually hidden; its ring is drawn on the stamp that follows it.
    const drawn =
      el instanceof HTMLInputElement && el.type === "radio"
        ? (el.nextElementSibling as HTMLElement)
        : el;
    const style = getComputedStyle(drawn);
    const box = drawn.getBoundingClientRect();
    return {
      name:
        el.getAttribute("aria-label") ??
        (el instanceof HTMLInputElement ? el.labels?.[0]?.textContent : null) ??
        el.textContent?.trim() ??
        "",
      outlineStyle: style.outlineStyle,
      outlineWidth: parseFloat(style.outlineWidth),
      outlineColor: style.outlineColor,
      onScreen:
        box.width > 4 &&
        box.height > 4 &&
        box.top >= 0 &&
        box.left >= 0 &&
        box.bottom <= window.innerHeight &&
        box.right <= window.innerWidth,
    };
  });
}

/** The focused thing is on screen and drawn with a real outline (not `none`, not 0px wide). */
async function expectFocusRing(page: Page, name?: string | RegExp) {
  const stop = await focusedStop(page);
  expect(stop, "something has keyboard focus").not.toBeNull();
  if (name) expect(stop!.name).toMatch(name);
  expect(stop!.outlineStyle, `focus ring on "${stop!.name}"`).not.toBe("none");
  expect(stop!.outlineWidth, `focus ring width on "${stop!.name}"`).toBeGreaterThanOrEqual(2);
  expect(stop!.outlineColor, `focus ring colour on "${stop!.name}"`).not.toMatch(/, 0\)$/);
  expect(stop!.onScreen, `"${stop!.name}" is on screen`).toBe(true);
}

/** Tabs until the keyboard reaches a stop whose name matches, checking the ring at every stop. */
async function tabTo(page: Page, name: string | RegExp, max = 30) {
  for (let i = 0; i < max; i++) {
    await page.keyboard.press("Tab");
    const stop = await focusedStop(page);
    if (stop && (typeof name === "string" ? stop.name === name : name.test(stop.name))) {
      await expectFocusRing(page);
      return;
    }
    // Every stop on the way must show its ring and be on screen (a focused control that is
    // off screen or hidden fails WCAG 2.4.11), so there is no whitelist of exceptions.
    await expectFocusRing(page);
  }
  throw new Error(`Tab never reached "${name}"`);
}

/** Entry screen to slide 1, by keyboard. */
async function keyboardToStory(page: Page) {
  await mockLookup(page, ndjson({ type: "resolved", accountId: 1 }, storyEvent()));
  await openEntry(page);
  // First stop is the URL field.
  await page.keyboard.press("Tab");
  await expectFocusRing(page, /Paste your Steam profile URL/);
  await page.keyboard.type(PROFILE);
  // The window control: a radio group, All time first; arrows move within it and back.
  await page.keyboard.press("Tab");
  await expectFocusRing(page, /All time/);
  await page.keyboard.press("ArrowRight");
  await expectFocusRing(page, /This patch/);
  await expect(page.getByRole("radio", { name: "This patch" })).toBeChecked();
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByRole("radio", { name: "All time" })).toBeChecked();
  await tabTo(page, "Open the ledger");
  await page.keyboard.press("Enter");
  await expect(stage(page)).toHaveAttribute("data-slide", "intro");
  await stageSettled(page);
}

/** Slide 1 to the summary with arrow keys, one slide at a time. */
async function keyboardToSummary(page: Page) {
  for (let i = 1; i < SLIDES.length; i++) {
    await page.keyboard.press("ArrowRight");
    await expect(stage(page)).toHaveAttribute("data-slide", SLIDES[i].id);
    await expect(stage(page)).toHaveAttribute("data-animating", "false");
    await expect(page.getByRole("status").filter({ hasText: "of 11" })).toHaveText(
      `Slide ${i + 1} of 11: ${SLIDES[i].headline}`,
    );
  }
}

test("keyboard only: entry, loading, all 11 slides, summary and Replay, with focus rings", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await keyboardToStory(page);

  // On the first slide the keyboard has somewhere to go, and shows where it is.
  await page.keyboard.press("Tab");
  await expectFocusRing(page);

  await keyboardToSummary(page);

  // Back one and forward again: arrows both ways.
  await page.keyboard.press("ArrowLeft");
  await expect(stage(page)).toHaveAttribute("data-slide", "mvp");
  await expect(stage(page)).toHaveAttribute("data-animating", "false");
  await page.keyboard.press("ArrowRight");
  await expect(stage(page)).toHaveAttribute("data-slide", "summary");
  await expect(stage(page)).toHaveAttribute("data-animating", "false");

  // The summary's actions are reachable in order and Replay works from the keyboard.
  await tabTo(page, "Replay");
  await page.keyboard.press("Enter");
  await expect(stage(page)).toHaveAttribute("data-slide", "intro");
});

test("keyboard only: from the summary, Look up another player returns to a usable entry screen", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await keyboardToStory(page);
  await keyboardToSummary(page);
  await tabTo(page, "Look up another player");
  await page.keyboard.press("Enter");
  const input = page.getByLabel("Paste your Steam profile URL");
  await expect(input).toBeVisible();
  // The remembered URL is there, and the keyboard can start another lookup straight away.
  await expect(input).toHaveValue(PROFILE);
  await page.keyboard.press("Tab");
  await expectFocusRing(page, /Paste your Steam profile URL/);
});

test("keyboard only: the error screen can be left with the keyboard", async ({ page }) => {
  await mockLookup(page, ndjson({ type: "error", reason: "unavailable" }), ndjson(storyEvent()));
  await openEntry(page);
  await page.keyboard.press("Tab");
  await page.keyboard.type(PROFILE);
  await tabTo(page, "Open the ledger");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "The ledger is out of ink" })).toBeVisible();
  await tabTo(page, "Try again");
  await page.keyboard.press("Enter");
  await expect(stage(page)).toHaveAttribute("data-slide", "intro");
});
