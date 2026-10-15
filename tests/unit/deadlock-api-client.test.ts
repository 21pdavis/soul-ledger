import { describe, expect, it } from "vitest";
import { createDeadlockApi, DeadlockApiError } from "@/lib/deadlock-api/client";
import { RateLimiter } from "@/lib/deadlock-api/rate-limiter";
import { fakeFetch, json } from "../helpers/fake-fetch";
import { fixtureJson, TEST_ACCOUNT_ID } from "../helpers/fixtures";

const API = "api.deadlock-api.com";

function unlimited() {
  return new RateLimiter({ maxRequests: 1_000_000, perMs: 1 });
}

function api(routes: Parameters<typeof fakeFetch>[0]) {
  const f = fakeFetch(routes);
  const client = createDeadlockApi({
    fetch: f.fetch,
    limiters: { bulk: unlimited(), analytics: unlimited(), general: unlimited() },
  });
  return { client, calls: f.calls };
}

describe("deadlock-api client", () => {
  it("reads a player's match history", async () => {
    const { client } = api({
      [`${API}/v1/players/${TEST_ACCOUNT_ID}/match-history`]: () =>
        json(fixtureJson("api/match-history.json")),
    });
    const history = await client.getMatchHistory(TEST_ACCOUNT_ID);
    expect(history).toHaveLength(352);
    expect(history[0]).toMatchObject({ match_id: 112055054, hero_id: 8, game_mode: 1 });
  });

  it("asks bulk metadata for one player's final stats, deaths and mid boss", async () => {
    const all = fixtureJson<{ match_id: number }[]>("api/bulk-metadata.json");
    const { client, calls } = api({ [`${API}/v1/matches/metadata`]: () => json(all.slice(0, 3)) });

    const ids = all.slice(0, 3).map((m) => m.match_id);
    const matches = await client.getBulkMetadata(TEST_ACCOUNT_ID, ids);

    expect(matches.map((m) => m.match_id)).toEqual(ids);
    const q = calls[0].searchParams;
    expect(q.get("match_ids")).toBe(ids.join(","));
    expect(q.get("account_ids")).toBe(String(TEST_ACCOUNT_ID));
    expect(q.get("only_filtered_players")).toBe("true");
    expect(q.get("include_player_info")).toBe("true");
    expect(q.get("include_player_final_stats")).toBe("true");
    expect(q.get("include_player_death_details")).toBe("true");
    expect(q.get("include_mid_boss")).toBe("true");
    expect(q.get("limit")).toBe("3");
  });

  it("asks for every player's slot and hero (the killer lookup), without the heavy stats", async () => {
    const all = fixtureJson<{ match_id: number }[]>("api/lineups.json");
    const { client, calls } = api({ [`${API}/v1/matches/metadata`]: () => json(all) });
    const ids = all.map((m) => m.match_id);
    const lineups = await client.getLineups(TEST_ACCOUNT_ID, ids);

    expect(lineups).toHaveLength(all.length);
    expect(lineups[0].players).toHaveLength(12);
    const q = calls[0].searchParams;
    expect(q.get("account_ids")).toBe(String(TEST_ACCOUNT_ID));
    expect(q.get("only_filtered_players")).toBe("false");
    expect(q.get("include_player_info")).toBe("false");
    expect(q.get("include_player_final_stats")).toBeNull();
    expect(q.get("include_player_death_details")).toBe("true");
  });

  it("accepts a null or missing killer slot instead of failing the parse", async () => {
    const lineup = {
      match_id: 1,
      players: [
        {
          account_id: 5,
          player_slot: 1,
          hero_id: 2,
          team: "Team0",
          death_details: [{ killer_player_slot: null }, {}],
        },
      ],
    };
    const { client } = api({ [`${API}/v1/matches/metadata`]: () => json([lineup]) });
    await expect(client.getLineups(TEST_ACCOUNT_ID, [1])).resolves.toHaveLength(1);
  });

  it("makes no lineup request for an empty id list", async () => {
    const { client, calls } = api({});
    await expect(client.getLineups(TEST_ACCOUNT_ID, [])).resolves.toEqual([]);
    expect(calls).toHaveLength(0);
  });

  it("splits large bulk requests into chunks", async () => {
    const { client, calls } = api({ [`${API}/v1/matches/metadata`]: () => json([]) });
    const ids = Array.from({ length: 1201 }, (_, i) => i + 1);
    await client.getBulkMetadata(TEST_ACCOUNT_ID, ids);
    expect(calls.map((c) => c.searchParams.get("match_ids")!.split(",").length)).toEqual([
      500, 500, 201,
    ]);
  });

  it("makes no request for an empty id list", async () => {
    const { client, calls } = api({});
    await expect(client.getBulkMetadata(TEST_ACCOUNT_ID, [])).resolves.toEqual([]);
    expect(calls).toHaveLength(0);
  });

  it("parses every recorded match of the test account", async () => {
    const { client } = api({
      [`${API}/v1/matches/metadata`]: () => json(fixtureJson("api/bulk-metadata.json")),
    });
    const matches = await client.getBulkMetadata(TEST_ACCOUNT_ID, [1]);
    expect(matches).toHaveLength(352);
    expect(matches.every((m) => m.players.length === 1)).toBe(true);
  });

  it("reads global stat quantiles, optionally for given heroes", async () => {
    const { client, calls } = api({
      [`${API}/v1/analytics/player-stats/metrics`]: () =>
        json(fixtureJson("api/metrics-global.json")),
    });
    const metrics = await client.getPlayerStatsMetrics({ heroIds: [8], minUnixTimestamp: 1000 });
    expect(metrics.kills.percentile50).toBeGreaterThan(0);
    expect(calls[0].searchParams.get("hero_ids")).toBe("8");
    expect(calls[0].searchParams.get("min_unix_timestamp")).toBe("1000");
  });

  it("reads the Steam profile, or null when the API has none", async () => {
    const { client } = api({
      [`${API}/v1/players/steam`]: (url) =>
        json(
          url.searchParams.get("account_ids") === String(TEST_ACCOUNT_ID)
            ? fixtureJson("api/steam-profile.json")
            : [],
        ),
    });
    await expect(client.getSteamProfile(TEST_ACCOUNT_ID)).resolves.toMatchObject({
      account_id: TEST_ACCOUNT_ID,
      personaname: "Pol",
    });
    await expect(client.getSteamProfile(1)).resolves.toBeNull();
  });

  it("reads rank history", async () => {
    const { client } = api({
      [`${API}/v1/players/${TEST_ACCOUNT_ID}/mmr-history`]: () =>
        json(fixtureJson("api/mmr-history.json")),
    });
    const history = await client.getMmrHistory(TEST_ACCOUNT_ID);
    expect(history.length).toBeGreaterThan(0);
    expect(history[0]).toHaveProperty("rank");
  });

  it("reads the patch changelog", async () => {
    const { client } = api({ [`${API}/v1/patches`]: () => json(fixtureJson("api/patches.json")) });
    const patches = await client.getPatches();
    expect(patches[0]).toEqual({ title: "09-29-2026", pub_date: "2026-10-05T23:00:12Z" });
  });

  it("throws a DeadlockApiError carrying the HTTP status", async () => {
    const { client } = api({
      [`${API}/v1/players/${TEST_ACCOUNT_ID}/match-history`]: () => json({ error: "slow" }, 429),
    });
    const err = await client.getMatchHistory(TEST_ACCOUNT_ID).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(DeadlockApiError);
    expect((err as DeadlockApiError).status).toBe(429);
  });

  it("rejects responses that do not match the expected shape", async () => {
    const { client } = api({
      [`${API}/v1/players/${TEST_ACCOUNT_ID}/match-history`]: () => json({ unexpected: true }),
    });
    await expect(client.getMatchHistory(TEST_ACCOUNT_ID)).rejects.toThrow(DeadlockApiError);
  });

  it("sends bulk requests through the bulk rate limiter", async () => {
    const f = fakeFetch({ [`${API}/v1/matches/metadata`]: () => json([]) });
    let scheduled = 0;
    const bulk = unlimited();
    const original = bulk.schedule.bind(bulk);
    bulk.schedule = (task) => {
      scheduled++;
      return original(task);
    };
    const client = createDeadlockApi({
      fetch: f.fetch,
      limiters: { bulk, analytics: unlimited(), general: unlimited() },
    });
    await client.getBulkMetadata(TEST_ACCOUNT_ID, [1, 2]);
    expect(scheduled).toBe(1);
  });
});
