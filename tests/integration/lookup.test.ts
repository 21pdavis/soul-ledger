import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "@/db";
import * as repo from "@/db/repository";
import { runLookup, type LookupEvent } from "@/lib/lookup";
import { createTestDb } from "../helpers/db";
import { fakeApi } from "../helpers/fake-api";
import { fakeFetch, text } from "../helpers/fake-fetch";
import { fixtureText, TEST_ACCOUNT_ID } from "../helpers/fixtures";

let db: Db;
let close: () => Promise<void>;

beforeEach(async () => {
  ({ db, close } = await createTestDb());
});
afterEach(() => close());

const steam = () =>
  fakeFetch({
    "steamcommunity.com/id/DoctorPol/": () => text(fixtureText("steam/vanity-found.xml")),
    "steamcommunity.com/id/nobody-here/": () => text(fixtureText("steam/vanity-missing.xml")),
  });

/** Runs a lookup and collects everything it emits. */
async function lookup(
  input: string,
  deps: Partial<Parameters<typeof runLookup>[1]> & Pick<Parameters<typeof runLookup>[1], "api">,
  options: { window?: "all" | "patch"; refresh?: boolean } = {},
) {
  const events: LookupEvent[] = [];
  await runLookup(
    { input, window: options.window ?? "all", refresh: options.refresh ?? false },
    { db, fetch: steam().fetch, pollMs: 5, ...deps },
    (e) => events.push(e),
  );
  return events;
}

const storyOf = (events: LookupEvent[]) => {
  const e = events.find((x) => x.type === "story");
  if (!e || e.type !== "story") throw new Error("no story event");
  return e;
};

describe("runLookup", () => {
  it("goes from a pasted vanity URL to a finished story", async () => {
    const { api } = fakeApi();
    const events = await lookup("https://steamcommunity.com/id/DoctorPol/", { api });

    expect(events.map((e) => e.type)).toEqual(
      expect.arrayContaining(["resolved", "profile", "history", "details", "done", "story"]),
    );
    expect(events[0]).toEqual({ type: "resolved", accountId: TEST_ACCOUNT_ID });
    expect(events.at(-1)?.type).toBe("story");

    const s = storyOf(events);
    expect(s.player).toMatchObject({ accountId: TEST_ACCOUNT_ID, personaName: "Pol" });
    expect(s.window).toBe("all");
    expect(s.stale).toBe(false);
    expect(s.story.matchCount).toBe(351);
    expect(s.story.percentiles.length).toBeGreaterThan(0);
    expect(s.story.main?.percentiles.length).toBeGreaterThan(0);
  });

  it("resolves vanity URLs through the Steam Web API when a key is configured", async () => {
    const { api } = fakeApi();
    const steamApi = fakeFetch({
      "api.steampowered.com/ISteamUser/ResolveVanityURL/v1/": () =>
        text(fixtureText("steam/resolve-vanity-found.json")),
    });
    const events = await lookup("https://steamcommunity.com/id/DoctorPol/", {
      api,
      fetch: steamApi.fetch,
      steamApiKey: "test-key",
    });
    expect(events[0]).toEqual({ type: "resolved", accountId: TEST_ACCOUNT_ID });
    expect(steamApi.calls[0].host).toBe("api.steampowered.com");
  });

  it("rejects input that is not a Steam identifier without calling any API", async () => {
    const { api, state } = fakeApi();
    expect(await lookup("definitely not valid!", { api })).toEqual([
      { type: "error", reason: "invalid" },
    ]);
    expect(state.calls.history).toBe(0);
  });

  it("reports an unknown vanity name", async () => {
    const { api } = fakeApi();
    expect(await lookup("nobody-here", { api })).toEqual([{ type: "error", reason: "not_found" }]);
  });

  it("limits the story to the current patch", async () => {
    const { api } = fakeApi();
    const s = storyOf(await lookup(String(TEST_ACCOUNT_ID), { api }, { window: "patch" }));
    expect(s.window).toBe("patch");
    expect(s.patchStart).toEqual(new Date("2026-09-29T00:00:00Z"));
    expect(s.story.matchCount).toBeGreaterThan(0);
    expect(s.story.matchCount).toBeLessThan(351);
    expect(s.story.intro.firstMatchAt!.getTime()).toBeGreaterThanOrEqual(s.patchStart!.getTime());
  });

  it("caches percentile metrics and the patch list between lookups", async () => {
    const { api, state } = fakeApi();
    await lookup(String(TEST_ACCOUNT_ID), { api }, { window: "patch" });
    const metricsCalls = state.calls.metrics.length;
    expect(metricsCalls).toBe(2); // global + main hero
    await lookup(String(TEST_ACCOUNT_ID), { api }, { window: "patch" });
    expect(state.calls.metrics.length).toBe(metricsCalls);
    expect(state.calls.patches).toBe(1);
  });

  it("asks for main-hero metrics by hero id", async () => {
    const { api, state } = fakeApi();
    await lookup(String(TEST_ACCOUNT_ID), { api });
    expect(state.calls.metrics).toContainEqual({ heroIds: [81] });
  });

  it("still tells the story without percentiles when the metrics endpoint is down", async () => {
    const { api, state } = fakeApi();
    state.metricsFailWith = new Error("analytics down");
    const s = storyOf(await lookup(String(TEST_ACCOUNT_ID), { api }));
    expect(s.story.matchCount).toBe(351);
    expect(s.story.percentiles).toEqual([]);
  });

  it("falls back to expired metrics when the endpoint is down", async () => {
    const { api, state } = fakeApi();
    let t = new Date("2026-10-07T00:00:00Z").getTime();
    const now = () => new Date(t);
    await lookup(String(TEST_ACCOUNT_ID), { api, now });

    t += 7 * 60 * 60 * 1000; // past the 6 h TTL
    state.metricsFailWith = new Error("analytics down");
    const s = storyOf(await lookup(String(TEST_ACCOUNT_ID), { api, now }));
    expect(s.story.percentiles.length).toBeGreaterThan(0);
  });

  it("serves the cached story, marked stale, when a refresh fails", async () => {
    const { api, state } = fakeApi();
    await lookup(String(TEST_ACCOUNT_ID), { api });
    state.failWith = new Error("deadlock-api is down");

    const events = await lookup(String(TEST_ACCOUNT_ID), { api }, { refresh: true });
    const s = storyOf(events);
    expect(s.stale).toBe(true);
    expect(s.story.matchCount).toBe(351);
  });

  it("reports a failed fetch when there is nothing cached to fall back on", async () => {
    const { api, state } = fakeApi();
    state.failWith = new Error("deadlock-api is down");
    const events = await lookup(String(TEST_ACCOUNT_ID), { api });
    expect(events.at(-1)).toEqual({ type: "error", reason: "fetch_failed" });
    expect(await repo.getKnownMatchIds(db, TEST_ACCOUNT_ID)).toHaveProperty("size", 0);
  });
});
