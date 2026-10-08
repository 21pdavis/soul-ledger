import { expect, test } from "@playwright/test";
import { TEST_ACCESS_KEY } from "../../playwright.config";

// Runs against a local server started with the staging gate on (see playwright.config.ts).

test("a visitor without access sees only the private page", async ({ page }) => {
  const res = await page.goto("/");
  expect(res?.status()).toBe(401);
  await expect(page.getByRole("heading", { name: /private/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Soul Ledger" })).toHaveCount(0);
});

test("the access link logs the browser in and hides the key", async ({ page, context }) => {
  await page.goto(`/?key=${TEST_ACCESS_KEY}`);
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Soul Ledger" })).toBeVisible();

  // The cookie keeps working on later visits and for the API.
  const [cookie] = await context.cookies();
  expect(cookie).toMatchObject({ name: "staging_session", httpOnly: true, sameSite: "Lax" });
  expect(cookie.value).not.toContain(TEST_ACCESS_KEY);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Soul Ledger" })).toBeVisible();
  const api = await page.request.get("/api/lookup");
  expect(api.status()).toBe(400); // reached the real handler, which rejects the empty query
});

test("the fixture preview route is a 404 without the explicit STORY_PREVIEW switch", async ({
  request,
}) => {
  // This server is a production build like staging and production, and does not set the switch.
  const res = await request.get("/preview", { headers: { "x-staging-token": TEST_ACCESS_KEY } });
  expect(res.status()).toBe(404);
});

test("a wrong key in the link does not log in", async ({ page }) => {
  const res = await page.goto(`/?key=${TEST_ACCESS_KEY}x`);
  expect(res?.status()).toBe(401);
});

test("a forged cookie is refused", async ({ page, context }) => {
  await context.addCookies([
    { name: "staging_session", value: "9999999999999.forged", url: "http://localhost:3101" },
  ]);
  expect((await page.goto("/"))?.status()).toBe(401);
});

test("API calls without access get 401 JSON, marked noindex", async ({ request }) => {
  const res = await request.get("/api/lookup?q=1");
  expect(res.status()).toBe(401);
  expect(res.headers()["x-robots-tag"]).toBe("noindex, nofollow");
});

test("automation gets through with the header token", async ({ request }) => {
  const ok = await request.get("/api/lookup", { headers: { "x-staging-token": TEST_ACCESS_KEY } });
  expect(ok.status()).toBe(400);
  const bad = await request.get("/api/lookup", {
    headers: { "x-staging-token": TEST_ACCESS_KEY + "x" },
  });
  expect(bad.status()).toBe(401);
});

test("the health check stays open for Render", async ({ request }) => {
  expect((await request.get("/api/health")).status()).toBe(200);
});
