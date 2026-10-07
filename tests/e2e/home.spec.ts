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

test("health endpoint answers for Render's health check", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.status()).toBe(200);
  expect(await res.json()).toEqual({ ok: true });
});

test("production ignores the staging key and sets no cookie", async ({ request }) => {
  test.skip(!!process.env.STAGING_URL, "staging is gated by design");
  const res = await request.get("/?key=" + "x".repeat(40), { maxRedirects: 0 });
  expect(res.status()).toBe(200);
  expect(res.headers()["set-cookie"]).toBeUndefined();
});
