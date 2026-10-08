import { describe, expect, it } from "vitest";
import { clampShare, monogramFor } from "@/story/monogram";

describe("monogramFor", () => {
  it("uses the first letters of the first two words", () => {
    expect(monogramFor("Lady Geist")).toBe("LG");
    expect(monogramFor("The Boss")).toBe("TB");
    expect(monogramFor("Deadman Danny")).toBe("DD");
  });

  it("skips symbols between words", () => {
    expect(monogramFor("Mo & Krill")).toBe("MK");
  });

  it("uses the first two letters of a single word", () => {
    expect(monogramFor("Infernus")).toBe("IN");
    expect(monogramFor("Seven")).toBe("SE");
  });

  it("gives an unknown hero a neutral mark", () => {
    expect(monogramFor("Hero #99")).toBe("?");
  });
});

describe("clampShare", () => {
  it("keeps a rate between 0 and 1", () => {
    expect(clampShare(0.4)).toBe(0.4);
    expect(clampShare(-1)).toBe(0);
    expect(clampShare(2)).toBe(1);
    expect(clampShare(Number.NaN)).toBe(0);
  });
});
