import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "@/db";
import * as repo from "@/db/repository";
import { createIpRateLimiter } from "@/lib/ip-rate-limit";
import { runLookup } from "@/lib/lookup";
import { createShareHandler, type ShareLimits } from "@/lib/share-handler";
import { SHARE_TTL_MS } from "@/lib/share/types";
import { createTestDb } from "../helpers/db";
import { fakeApi } from "../helpers/fake-api";
import { TEST_ACCOUNT_ID } from "../helpers/fixtures";

let db: Db;
let close: () => Promise<void>;

beforeEach(async () => {
  ({ db, close } = await createTestDb());
});
afterEach(() => close());

const NOW = new Date("2026-11-11T12:00:00Z");

async function seedPlayer() {
  const { api } = fakeApi();
  await runLookup(
    { input: String(TEST_ACCOUNT_ID), window: "all", refresh: false },
    { db, api },
    () => {},
  );
}

function handler(limits?: ShareLimits) {
  return createShareHandler(() => ({ db, now: () => NOW }), limits);
}

const post = (body: unknown, headers: Record<string, string> = {}) =>
  new Request("http://localhost/api/share", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

type Ok = { slug: string; path: string; expiresAt: string };

async function share(window: "all" | "patch" = "all") {
  return (await (await handler()(post({ accountId: TEST_ACCOUNT_ID, window }))).json()) as Ok;
}

describe("POST /api/share", () => {
  it("creates a link from the server's own cached story", async () => {
    await seedPlayer();
    const res = await handler()(post({ accountId: TEST_ACCOUNT_ID, window: "all" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const body = (await res.json()) as Ok;
    expect(body.path).toBe(`/w/${body.slug}`);
    expect(body.expiresAt).toBe(new Date(NOW.getTime() + SHARE_TTL_MS).toISOString());
    const row = await repo.getSharedStory(db, body.slug);
    expect(row?.accountId).toBe(TEST_ACCOUNT_ID);
    expect(row?.snapshot.meta.window).toBe("all");
    expect(row?.snapshot.sharedAt).toBe(NOW.toISOString());
    expect(row?.snapshot.story.matchCount).toBe(351);
  });

  it("reuses the same link for an unchanged story", async () => {
    await seedPlayer();
    const a = await share();
    const b = await share();
    expect(b.slug).toBe(a.slug);
  });

  it("makes a different link for a different window", async () => {
    await seedPlayer();
    const a = await share("all");
    const b = await share("patch");
    expect(b.slug).not.toBe(a.slug);
  });

  it("answers 404 when the player has no stored matches", async () => {
    const res = await handler()(post({ accountId: TEST_ACCOUNT_ID, window: "all" }));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "not_found" });
  });

  it.each([
    ["not JSON", "{nope"],
    ["missing accountId", { window: "all" }],
    ["string accountId", { accountId: "abc", window: "all" }],
    ["fractional accountId", { accountId: 1.5, window: "all" }],
    ["bad window", { accountId: TEST_ACCOUNT_ID, window: "year" }],
    ["missing window", { accountId: TEST_ACCOUNT_ID }],
  ])("answers 400 for %s", async (_n, body) => {
    const res = await handler()(post(body));
    expect(res.status).toBe(400);
  });

  describe("rate limit", () => {
    const limited = (exempt?: (r: Request) => boolean) =>
      handler({ limiter: createIpRateLimiter({ limit: 2, windowMs: 60_000 }), exempt });
    const req = (ip = "203.0.113.9") =>
      post({ accountId: TEST_ACCOUNT_ID, window: "all" }, { "true-client-ip": ip });

    it("answers 429 with Retry-After over the limit, per IP", async () => {
      await seedPlayer();
      const h = limited();
      await h(req());
      await h(req());
      const res = await h(req());
      expect(res.status).toBe(429);
      expect(Number(res.headers.get("retry-after"))).toBeGreaterThan(0);
      expect(((await res.json()) as { error: string }).error).toBe("rate_limited");
      expect((await h(req("198.51.100.4"))).status).toBe(200);
    });

    it("keeps its own counter, separate from lookups", async () => {
      const lookupLimiter = createIpRateLimiter({ limit: 2, windowMs: 60_000 });
      const shareLimiter = createIpRateLimiter({ limit: 2, windowMs: 60_000 });
      lookupLimiter.check("203.0.113.9");
      lookupLimiter.check("203.0.113.9");
      expect(lookupLimiter.check("203.0.113.9").allowed).toBe(false);
      await seedPlayer();
      const res = await handler({ limiter: shareLimiter })(req());
      expect(res.status).toBe(200);
    });

    it("does not limit requests the exempt check accepts", async () => {
      await seedPlayer();
      const h = limited(() => true);
      for (let i = 0; i < 5; i++) expect((await h(req())).status).toBe(200);
    });
  });
});
