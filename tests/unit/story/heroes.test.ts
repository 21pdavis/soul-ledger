import { describe, expect, it } from "vitest";
import { heroMonogram, heroName } from "@/story/heroes";

describe("heroMonogram", () => {
  it("uses the first letter of a one-word name", () => {
    expect(heroMonogram(1)).toBe("I");
  });

  it("uses the initials of the first two words, skipping symbols like &", () => {
    expect(heroMonogram(18)).toBe("MK");
    expect(heroMonogram(39)).toBe("TB");
    expect(heroMonogram(4)).toBe("LG");
  });

  it("falls back to a question mark for ids the map does not know", () => {
    expect(heroMonogram(9999)).toBe("?");
    expect(heroMonogram(83)).toBe("?");
  });
});

describe("heroName", () => {
  it("names known heroes", () => {
    expect(heroName(1)).toBe("Infernus");
    expect(heroName(88)).toBe("Baba");
  });

  it("falls back for ids the map does not know yet (the roster changes with patches)", () => {
    expect(heroName(9999)).toBe("Hero #9999");
  });

  it("does not expose the API test hero", () => {
    expect(heroName(83)).toBe("Hero #83");
  });
});
