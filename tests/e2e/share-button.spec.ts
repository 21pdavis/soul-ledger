import { expect, test } from "@playwright/test";
import { LIVE_SLUG } from "./shared-fixtures";

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
