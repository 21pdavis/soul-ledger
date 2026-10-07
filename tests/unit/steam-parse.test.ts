import { describe, expect, it } from "vitest";
import { parseSteamInput, steamId64ToAccountId } from "@/lib/steam/parse";

// The primary test account (wiki/research/test-account.md).
const ACCOUNT_ID = 134751831;
const STEAM_ID_64 = "76561198095017559";

describe("steamId64ToAccountId", () => {
  it("subtracts the SteamID64 base", () => {
    expect(steamId64ToAccountId(STEAM_ID_64)).toBe(ACCOUNT_ID);
  });
});

describe("parseSteamInput", () => {
  it.each([
    ["https://steamcommunity.com/id/DoctorPol/", "DoctorPol"],
    ["https://steamcommunity.com/id/DoctorPol", "DoctorPol"],
    ["http://www.steamcommunity.com/id/DoctorPol/?xml=1", "DoctorPol"],
    ["steamcommunity.com/id/DoctorPol", "DoctorPol"],
    ["  DoctorPol  ", "DoctorPol"],
    ["doctor_pol-2", "doctor_pol-2"],
  ])("reads a vanity name from %j", (input, vanity) => {
    expect(parseSteamInput(input)).toEqual({ kind: "vanity", vanity });
  });

  it.each([
    [`https://steamcommunity.com/profiles/${STEAM_ID_64}/`],
    [`steamcommunity.com/profiles/${STEAM_ID_64}`],
    [STEAM_ID_64],
    [String(ACCOUNT_ID)],
    [`[U:1:${ACCOUNT_ID}]`],
    [`U:1:${ACCOUNT_ID}`],
    ["STEAM_0:1:67375915"],
    ["STEAM_1:1:67375915"],
  ])("reads account id from %j", (input) => {
    expect(parseSteamInput(input)).toEqual({ kind: "account", accountId: ACCOUNT_ID });
  });

  it.each([
    [""],
    ["   "],
    ["https://example.com/id/DoctorPol"],
    ["https://steamcommunity.com/groups/foo"],
    ["0"],
    ["4294967296"], // too large for an account id, too small for a SteamID64
    ["has spaces in it"],
    ["a"], // Steam vanity names are at least 2 characters
    ["x".repeat(33)], // and at most 32
  ])("rejects %j", (input) => {
    expect(parseSteamInput(input)).toEqual({ kind: "invalid" });
  });
});
