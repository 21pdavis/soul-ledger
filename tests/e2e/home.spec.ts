import { expect, test } from "@playwright/test";

test("home page renders with the Valve disclaimer", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Soul Ledger" })).toBeVisible();
  await expect(page.getByText(/Not affiliated with or endorsed by Valve/)).toBeVisible();
});

test("has no horizontal scroll", async ({ page }) => {
  await page.goto("/");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test("lookup API rejects a request without a query", async ({ request }) => {
  const res = await request.get("/api/lookup");
  expect(res.status()).toBe(400);
});
