import { expect, type Page } from "@playwright/test";
import { fixtureStory } from "../fixtures/story";

// Shared by the e2e specs: the lookup is mocked with NDJSON, so they run the same locally and
// against staging.

export const PROFILE = "https://steamcommunity.com/id/gaben";
export const PATCH = "2026-09-30T00:00:00.000Z";

export const ndjson = (...events: unknown[]) =>
  events.map((e) => JSON.stringify(e) + "\n").join("");

export const storyEvent = (over: Record<string, unknown> = {}, story = fixtureStory()) => ({
  type: "story",
  player: { accountId: 1, personaName: "Gaben", avatarUrl: null },
  window: "all",
  patchStart: null,
  stale: false,
  story,
  ...over,
});

/** Answers each /api/lookup call with the next body, and records the requested URLs. */
export async function mockLookup(page: Page, ...bodies: string[]) {
  const urls: URL[] = [];
  await page.route("**/api/lookup**", async (route) => {
    urls.push(new URL(route.request().url()));
    const body = bodies.length > 1 ? bodies.shift()! : bodies[0];
    await route.fulfill({ status: 200, contentType: "application/x-ndjson", body });
  });
  return urls;
}

/** Opens the entry screen and waits for hydration, so typing and clicking are not lost. */
export async function openEntry(page: Page) {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
}

export async function enter(page: Page, url = PROFILE) {
  await openEntry(page);
  await page.getByLabel("Paste your Steam profile URL").fill(url);
  await page.getByRole("button", { name: "Open the ledger" }).click();
}

/**
 * Waits for the story's opening entrance to be over, so the next key press or tap really
 * navigates. The stage's first render has `data-animating="false"` before the entrance has been
 * started (it starts a frame later), so "false" alone can be read too early, most often on a busy
 * machine; look again after two frames.
 */
export async function stageSettled(page: Page) {
  const stage = page.getByTestId("story-stage");
  await expect(stage).toHaveAttribute("data-animating", "false");
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
  await expect(stage).toHaveAttribute("data-animating", "false");
}
