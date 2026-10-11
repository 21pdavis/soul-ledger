import { describe, expect, it } from "vitest";
import { validateProfileInput } from "@/lib/client/profile-input";

describe("validateProfileInput", () => {
  it.each([
    "https://steamcommunity.com/id/gaben",
    "https://steamcommunity.com/profiles/76561197960287930",
    "steamcommunity.com/id/gaben/",
    "  https://www.steamcommunity.com/id/some_name  ",
    "gaben",
    "76561197960287930",
  ])("accepts %j and returns it trimmed", (raw) => {
    expect(validateProfileInput(raw)).toEqual({ ok: true, value: raw.trim() });
  });

  it.each([
    "",
    "   ",
    "https://example.com/id/gaben",
    "https://steamcommunity.com/id/",
    "https://steamcommunity.com/profiles/abc",
    "not a url!",
    "a",
  ])("rejects %j", (raw) => {
    expect(validateProfileInput(raw)).toEqual({ ok: false });
  });
});
