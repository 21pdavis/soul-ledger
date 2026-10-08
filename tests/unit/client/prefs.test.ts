import { describe, expect, it } from "vitest";
import { loadPrefs, savePrefs, type Prefs } from "@/lib/client/prefs";

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    data,
  };
}

const throwing = {
  getItem: () => {
    throw new DOMException("denied", "SecurityError");
  },
  setItem: () => {
    throw new DOMException("full", "QuotaExceededError");
  },
};

describe("prefs", () => {
  it("round-trips the last URL and filters", () => {
    const storage = memoryStorage();
    const prefs: Prefs = {
      url: "https://steamcommunity.com/id/gaben",
      filters: { window: "patch" },
    };
    savePrefs(prefs, storage);
    expect(loadPrefs(storage)).toEqual(prefs);
  });

  it("returns defaults when nothing is stored, the JSON is broken, or the shape is wrong", () => {
    const defaults = { url: "", filters: { window: "all" } };
    expect(loadPrefs(memoryStorage())).toEqual(defaults);
    expect(loadPrefs(memoryStorage({ "soul-ledger:prefs": "{nope" }))).toEqual(defaults);
    expect(
      loadPrefs(memoryStorage({ "soul-ledger:prefs": '{"url":5,"filters":{"window":"x"}}' })),
    ).toEqual(defaults);
  });

  it("works without storage: reads give defaults and writes are silent no-ops", () => {
    expect(loadPrefs(throwing)).toEqual({ url: "", filters: { window: "all" } });
    expect(() => savePrefs({ url: "x", filters: { window: "all" } }, throwing)).not.toThrow();
    expect(loadPrefs(undefined)).toEqual({ url: "", filters: { window: "all" } });
  });
});
