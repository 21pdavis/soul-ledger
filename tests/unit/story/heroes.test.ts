import { describe, expect, it } from "vitest";
import { heroName } from "@/story/heroes";

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
