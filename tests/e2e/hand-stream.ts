import type { Page } from "@playwright/test";
import { PROFILE } from "./lookup-mock";

// A lookup stream the test feeds by hand, so a spec decides exactly when each NDJSON event arrives
// (stages in order, no timers). Shared by the loading, full-story and accessibility specs.

declare global {
  interface Window {
    __lookup: { push: (event: unknown) => void };
  }
}

/** Replaces fetch for /api/lookup with a stream the test feeds by hand. */
export async function streamLookupByHand(page: Page) {
  await page.addInitScript(() => {
    const realFetch = window.fetch.bind(window);
    window.fetch = (input, init) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (!url.includes("/api/lookup")) return realFetch(input, init);
      const encoder = new TextEncoder();
      let controller!: ReadableStreamDefaultController<Uint8Array>;
      const body = new ReadableStream<Uint8Array>({ start: (c) => (controller = c) });
      window.__lookup = {
        push: (event) => controller.enqueue(encoder.encode(JSON.stringify(event) + "\n")),
      };
      return Promise.resolve(
        new Response(body, { headers: { "content-type": "application/x-ndjson" } }),
      );
    };
  });
}

export const push = (page: Page, event: unknown) =>
  page.evaluate((e) => window.__lookup.push(e), event);

export async function startLookup(page: Page) {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Paste your Steam profile URL").fill(PROFILE);
  await page.getByRole("button", { name: "Open the ledger" }).click();
  await page.waitForFunction(() => Boolean(window.__lookup));
}
