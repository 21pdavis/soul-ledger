import { expect, test } from "@playwright/test";
import { TEST_BYPASS_TOKEN } from "../../playwright.config";

// Runs against a local server started with the staging gate on (see playwright.config.ts),
// using the real Auth.js rather than a mock.

test("a signed-out visitor is sent to the Google sign-in page", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/api\/auth\/signin/);
  await expect(page.getByRole("button", { name: /Google/ })).toBeVisible();
});

test("signed-out API calls get 401", async ({ request }) => {
  const res = await request.get("/api/lookup?q=1");
  expect(res.status()).toBe(401);
  expect(res.headers()["x-robots-tag"]).toBe("noindex, nofollow");
});

test("the bypass token lets automation through", async ({ request }) => {
  // An empty query reaches the real handler, which rejects it with 400 (not the gate's 401).
  const res = await request.get("/api/lookup", {
    headers: { "x-staging-token": TEST_BYPASS_TOKEN },
  });
  expect(res.status()).toBe(400);
});

test("a wrong token is refused", async ({ request }) => {
  const res = await request.get("/api/lookup", {
    headers: { "x-staging-token": TEST_BYPASS_TOKEN + "x" },
  });
  expect(res.status()).toBe(401);
});

test("the health check stays open for Render", async ({ request }) => {
  expect((await request.get("/api/health")).status()).toBe(200);
});
