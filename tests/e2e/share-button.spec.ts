import { expect, test } from "@playwright/test";
import { SLIDES } from "../../src/story/copy";
import { LIVE_SLUG, LONG_NAME_SLUG } from "./shared-fixtures";

// The Share button (ADR 0079) on a shared page, whose link is a fixture: nothing is created, so
// this runs against the local servers only (live staging has its own database).
test.skip(!!process.env.STAGING_URL, "needs the e2e fixture links");

test("phone: every slide has a Share button above the tap zones", async ({ page }, info) => {
  test.skip(info.project.name !== "phone", "phone only");
  await page.goto(`/w/${LIVE_SLUG}`);
  await expect(page.getByRole("button", { name: "Share" })).toBeVisible();
  // Pressing it must not turn the slide.
  await page.getByRole("button", { name: "Share" }).click();
  await expect(page.getByTestId("story-stage")).toHaveAttribute("data-slide", "intro");
});

test("desktop: Copy link copies the shared link, and it opens the same story", async ({
  page,
  context,
}, info) => {
  test.skip(info.project.name !== "desktop", "desktop only");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  // Some desktops can share files natively; this test is about the menu everyone else gets.
  await page.addInitScript(() => Object.defineProperty(navigator, "share", { value: undefined }));
  await page.goto(`/w/${LIVE_SLUG}`);
  await page.getByRole("button", { name: "Share" }).click();

  const download = page.getByRole("link", { name: "Download picture" });
  const picture = await page.request.get((await download.getAttribute("href"))!);
  expect(picture.status()).toBe(200);
  expect(picture.headers()["content-type"]).toBe("image/png");

  await page.getByRole("button", { name: "Copy link" }).click();
  await expect(page.getByText("Link copied")).toBeVisible();
  const link = await page.evaluate(() => navigator.clipboard.readText());
  expect(link).toMatch(new RegExp(`/w/${LIVE_SLUG}$`));

  await page.goto(link);
  await expect(page.getByText("Gaben's story")).toBeVisible();
});

test("the Share button never covers a headline or the player's name, on a small phone or the desktop card", async ({
  page,
}, info) => {
  // The narrowest phone we support, and the longest Steam name.
  if (info.project.name === "phone") await page.setViewportSize({ width: 360, height: 640 });
  await page.goto(`/w/${LONG_NAME_SLUG}`);
  const overlaps: string[] = [];
  for (let i = 0; i < SLIDES.length; i++) {
    const current = page
      .locator('[data-testid="story-stage"], [data-testid="story-card"][data-current="true"]')
      .first();
    await expect(current.getByRole("button", { name: "Share" })).toBeVisible();
    await page.waitForTimeout(800); // the slide's entrance
    const found = await current.evaluate((root) => {
      const button = [...root.querySelectorAll("button")].find((b) => b.textContent === "Share")!;
      const b = button.getBoundingClientRect();
      return [...root.querySelectorAll("h2, header p")]
        .filter((el) => {
          // The text's own extent, not the (full-width) box around it.
          const range = document.createRange();
          range.selectNodeContents(el);
          return [...range.getClientRects()].some(
            (q) => q.left < b.right && q.right > b.left && q.top < b.bottom && q.bottom > b.top,
          );
        })
        .map((el) => el.textContent);
    });
    for (const text of found) overlaps.push(`${SLIDES[i].id}: ${text}`);
    if (i < SLIDES.length - 1) await page.keyboard.press("ArrowRight");
  }
  expect(overlaps).toEqual([]);
});
