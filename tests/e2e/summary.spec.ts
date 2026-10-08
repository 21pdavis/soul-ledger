import { expect, test, type Page } from "@playwright/test";
import { fixtureStory } from "../fixtures/story";
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
async function openSummary(
  page: Page,
  over: Record<string, unknown> = {},
  patch = false,
  story = fixtureStory(),
) {
  const urls = await mockLookup(
    page,
    ndjson({ type: "resolved", accountId: 1 }, storyEvent(over, story)),
  );
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

/** The cases that squeeze the card: the stale note shrinks the stage, "This patch" wraps the window line, long names fill the lines. */
const CASES: { name: string; over: Record<string, unknown>; patch: boolean; long: boolean }[] = [
  { name: "all time", over: {}, patch: false, long: false },
  { name: "stale note", over: { stale: true }, patch: false, long: false },
  { name: "this patch", over: { window: "patch", patchStart: PATCH }, patch: true, long: false },
  { name: "long names", over: {}, patch: false, long: true },
  {
    name: "stale + this patch + long names",
    over: { stale: true, window: "patch", patchStart: PATCH },
    patch: true,
    long: true,
  },
];

/** A story whose names are as long as the lines can get ("The Doorman", "Hero damage per minute"). */
function longNamesStory() {
  const story = fixtureStory();
  story.main!.heroId = 69;
  story.mvp = {
    ...story.mvp!,
    label: "Hero damage per minute",
    scope: "hero",
    heroId: 69,
    topPercent: 12,
  };
  return story;
}

const SIZES = [
  { width: 320, height: 568, phone: true },
  { width: 360, height: 640, phone: true },
  { width: 375, height: 667, phone: true },
  { width: 1280, height: 720, phone: false },
  { width: 1440, height: 900, phone: false },
];

test.describe("the card is never clipped by the stage", () => {
  for (const { width, height, phone } of SIZES) {
    for (const c of CASES) {
      test(`${width}x${height}, ${c.name}: the three actions are reachable and the frame is whole`, async ({
        page,
        isMobile,
      }) => {
        test.skip(phone !== !!isMobile, phone ? "phone only" : "desktop only");
        await page.setViewportSize({ width, height });
        await openSummary(page, c.over, c.patch, c.long ? longNamesStory() : fixtureStory());
        const stageBox = (await stage(page).boundingBox())!;
        const frame = stage(page).locator("section").first();
        const frameBox = (await frame.boundingBox())!;
        // The frame itself sits inside the stage, so its bottom border is not cut off.
        expect(frameBox.y + frameBox.height).toBeLessThanOrEqual(
          stageBox.y + stageBox.height + 0.5,
        );
        for (const name of ["Replay", "Look up another player", "Refresh"]) {
          const button = page.getByRole("button", { name });
          await expect(button).toBeVisible();
          const box = (await button.boundingBox())!;
          expect(box.y).toBeGreaterThanOrEqual(stageBox.y);
          expect(box.y + box.height).toBeLessThanOrEqual(frameBox.y + frameBox.height - 1);
          expect(box.x).toBeGreaterThanOrEqual(stageBox.x);
          expect(box.x + box.width).toBeLessThanOrEqual(stageBox.x + stageBox.width);
        }
        // Nothing overflows the frame (the stage clips whatever does).
        const overflow = await frame.evaluate((el) => el.scrollHeight - el.clientHeight);
        expect(overflow).toBeLessThanOrEqual(0);
        // Above the narrowest tier (container 260px) a long label wraps rather than being cut off.
        const ledger = page.getByRole("list", { name: "Your ledger entry" });
        const narrowest = (await ledger.evaluate((el) => el.clientWidth)) <= 260;
        if (!narrowest) {
          const clipped = await ledger.evaluate((el) =>
            [...el.querySelectorAll("li")]
              .map((li) => li.firstElementChild as HTMLElement)
              .filter((l) => l.scrollWidth > l.clientWidth || l.scrollHeight > l.clientHeight)
              .map((l) => l.textContent),
          );
          expect(clipped, "labels cut off above the narrowest tier").toEqual([]);
        }
        // And the Valve notice is on screen under the stage, once.
        const notice = page.getByText(/Not affiliated with or endorsed by Valve/);
        await expect(notice).toHaveCount(1);
        await expect(notice).toBeInViewport();
      });
    }
  }
});
