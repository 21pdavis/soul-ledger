/**
 * Regenerates the city stills behind the share pictures (ADR 0079): one 1080x1920 JPEG per slide,
 * captured from the real 3D city with the camera where the live story puts it for that slide.
 *
 *   pnpm build && pnpm exec next start -p 3200      (a production build: no dev overlay)
 *   BASE_URL=http://localhost:3200 pnpm tsx scripts/capture-city-stills.ts
 *
 * It drives the real story (lookup mocked with the test fixture, graphics on Full) in a phone-shaped
 * window, steps to each slide with the keyboard, waits for the camera to settle, hides the story's
 * own interface and screenshots what is left: the city. Run it again after the city changes.
 * Output: public/share/stills/<slide id>.jpg. WebGL runs in software here, so it takes a while.
 */
import { chromium, type Locator } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { GRAPHICS_KEY } from "../src/lib/client/graphics";
import { PACE_OVERRIDE_KEY } from "../src/lib/client/loading-pace";
import { SLIDES } from "../src/story/copy";
import { fixtureStory } from "../tests/fixtures/story";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3200";
const OUT = path.join(process.cwd(), "public", "share", "stills");
/** Phone-shaped (9:16) at 2x, so the shot is 1080x1920. */
const VIEWPORT = { width: 540, height: 960 };
/** How long the camera gets to finish its move to a slide. */
const SETTLE_MS = Number(process.env.SETTLE_MS ?? 6000);
const QUALITY = 78;

const ndjson = (...events: unknown[]) => events.map((e) => JSON.stringify(e) + "\n").join("");

async function expect_full(button: Locator) {
  const label = (await button.getAttribute("aria-label")) ?? "";
  if (!label.includes("Graphics: Full")) throw new Error(`Expected Full graphics, got: ${label}`);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    storageState: {
      cookies: [],
      origins: [
        {
          origin: new URL(BASE_URL).origin,
          localStorage: [
            { name: PACE_OVERRIDE_KEY, value: "off" },
            { name: GRAPHICS_KEY, value: "full" },
          ],
        },
      ],
    },
  });
  const page = await context.newPage();
  await page.route("**/api/lookup**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/x-ndjson",
      body: ndjson(
        { type: "resolved", accountId: 1 },
        {
          type: "story",
          player: { accountId: 1, personaName: "Gaben", avatarUrl: null },
          window: "all",
          patchStart: null,
          stale: false,
          story: fixtureStory(),
        },
      ),
    }),
  );

  await page.goto(BASE_URL);
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Paste your Steam profile URL").fill("https://steamcommunity.com/id/gaben");
  await page.getByRole("button", { name: "Open the ledger" }).click();
  const stage = page.getByTestId("story-stage");
  await stage.waitFor();
  await page.locator('[data-testid="world"] [data-ready="true"]').waitFor({ timeout: 120_000 });
  // Cycle the graphics button all the way round (Full, Simple, Off, back to Full): a hand-picked
  // level stops the automatic drop to Off that software WebGL would otherwise trigger.
  const button = page.getByTestId("graphics-button");
  for (let i = 0; i < 3; i++) {
    await button.click();
    await page.waitForTimeout(500);
  }
  await expect_full(button);
  // Only the city: everything else on the page is hidden.
  await page.addStyleTag({
    content: `body { visibility: hidden !important; }
      [data-testid="world"], [data-testid="world"] * { visibility: visible !important; }`,
  });

  for (let i = 0; i < SLIDES.length; i++) {
    if (i > 0) await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(SETTLE_MS);
    const jpeg = await page.screenshot({ type: "jpeg", quality: QUALITY, timeout: 180_000 });
    await writeFile(path.join(OUT, `${SLIDES[i].id}.jpg`), jpeg);
    const world = page.getByTestId("world");
    const state = `${await world.getAttribute("data-level")} slide ${await world.getAttribute("data-slide")}`;
    console.log(`${SLIDES[i].id}: ${(jpeg.length / 1024).toFixed(0)} KB (${state})`);
  }
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
