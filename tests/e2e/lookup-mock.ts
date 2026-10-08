import type { Page } from "@playwright/test";
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
