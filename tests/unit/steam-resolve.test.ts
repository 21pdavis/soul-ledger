import { describe, expect, it } from "vitest";
import { resolveSteamInput } from "@/lib/steam/resolve";
import { fakeFetch, text } from "../helpers/fake-fetch";
import { fixtureText, TEST_ACCOUNT_ID } from "../helpers/fixtures";

const VANITY_PATH = "steamcommunity.com/id/DoctorPol/";

describe("resolveSteamInput", () => {
  it("returns numeric ids without touching the network", async () => {
    const f = fakeFetch({});
    await expect(resolveSteamInput("76561198095017559", { fetch: f.fetch })).resolves.toEqual({
      ok: true,
      accountId: TEST_ACCOUNT_ID,
    });
    expect(f.calls).toHaveLength(0);
  });

  it("resolves a vanity URL through the profile XML", async () => {
    const f = fakeFetch({ [VANITY_PATH]: () => text(fixtureText("steam/vanity-found.xml")) });
    await expect(
      resolveSteamInput("https://steamcommunity.com/id/DoctorPol/", { fetch: f.fetch }),
    ).resolves.toEqual({ ok: true, accountId: TEST_ACCOUNT_ID });
    expect(f.calls[0].searchParams.get("xml")).toBe("1");
  });

  it("reports a vanity name Steam does not know", async () => {
    const f = fakeFetch({ [VANITY_PATH]: () => text(fixtureText("steam/vanity-missing.xml")) });
    await expect(resolveSteamInput("DoctorPol", { fetch: f.fetch })).resolves.toEqual({
      ok: false,
      reason: "not_found",
    });
  });

  it("reports Steam being unavailable", async () => {
    const f = fakeFetch({ [VANITY_PATH]: () => text("busy", 503) });
    await expect(resolveSteamInput("DoctorPol", { fetch: f.fetch })).resolves.toEqual({
      ok: false,
      reason: "unavailable",
    });
  });

  it("rejects input that is not a Steam identifier", async () => {
    const f = fakeFetch({});
    await expect(resolveSteamInput("not a steam id", { fetch: f.fetch })).resolves.toEqual({
      ok: false,
      reason: "invalid",
    });
  });
});

describe("resolveSteamInput with a Steam Web API key", () => {
  // Shapes follow Valve's documented ResolveVanityURL responses (success 1 = found, 42 = no match).
  const API_PATH = "api.steampowered.com/ISteamUser/ResolveVanityURL/v1/";
  const KEY = "test-key";

  it("resolves a vanity name through the official API, not the profile page", async () => {
    const f = fakeFetch({
      [API_PATH]: () => text(fixtureText("steam/resolve-vanity-found.json")),
    });
    await expect(
      resolveSteamInput("https://steamcommunity.com/id/DoctorPol/", {
        fetch: f.fetch,
        steamApiKey: KEY,
      }),
    ).resolves.toEqual({ ok: true, accountId: TEST_ACCOUNT_ID });
    expect(f.calls).toHaveLength(1);
    expect(f.calls[0].searchParams.get("vanityurl")).toBe("DoctorPol");
    expect(f.calls[0].searchParams.get("key")).toBe(KEY);
  });

  it("reports a vanity name the API does not know", async () => {
    const f = fakeFetch({
      [API_PATH]: () => text(fixtureText("steam/resolve-vanity-missing.json")),
    });
    await expect(
      resolveSteamInput("nobody-here", { fetch: f.fetch, steamApiKey: KEY }),
    ).resolves.toEqual({ ok: false, reason: "not_found" });
  });

  it("reports the API being unavailable, without leaking the key in logs", async () => {
    const f = fakeFetch({ [API_PATH]: () => text("Forbidden", 403) });
    const logged: string[] = [];
    const original = console.warn;
    console.warn = (msg: string) => logged.push(msg);
    try {
      await expect(
        resolveSteamInput("DoctorPol", { fetch: f.fetch, steamApiKey: KEY }),
      ).resolves.toEqual({ ok: false, reason: "unavailable" });
    } finally {
      console.warn = original;
    }
    expect(logged.join("\n")).toContain("HTTP 403");
    expect(logged.join("\n")).not.toContain(KEY);
  });

  it("treats a malformed API response as unavailable", async () => {
    const f = fakeFetch({ [API_PATH]: () => text("<html>oops</html>") });
    await expect(
      resolveSteamInput("DoctorPol", { fetch: f.fetch, steamApiKey: KEY }),
    ).resolves.toEqual({ ok: false, reason: "unavailable" });
  });
});
