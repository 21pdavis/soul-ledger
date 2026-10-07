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
