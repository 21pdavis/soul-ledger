import { describe, expect, it } from "vitest";
import { buildSlug, randomSlugPart, slugName, SLUG_NAME_MAX } from "@/lib/share/slug";

describe("slugName", () => {
  it("keeps plain letters and digits, lowercased", () => {
    expect(slugName("Haze Main 42")).toBe("hazemain42");
  });

  it("folds accents to plain letters", () => {
    expect(slugName("Zoë Ångström")).toBe("zoeangstrom");
  });

  it("drops symbols and emoji", () => {
    expect(slugName("~*xX_Sn1per_Xx*~ 🔥")).toBe("xxsn1perxx");
  });

  it(`caps the name at ${SLUG_NAME_MAX} characters`, () => {
    expect(slugName("a".repeat(50))).toBe("a".repeat(SLUG_NAME_MAX));
  });

  it("is empty when nothing usable is left", () => {
    expect(slugName("ミク")).toBe("");
    expect(slugName("")).toBe("");
    expect(slugName(null)).toBe("");
  });
});

describe("randomSlugPart", () => {
  it("is 8 lowercase letters or digits", () => {
    for (let i = 0; i < 50; i++) expect(randomSlugPart()).toMatch(/^[a-z0-9]{8}$/);
  });

  it("differs between calls", () => {
    const seen = new Set(Array.from({ length: 200 }, () => randomSlugPart()));
    expect(seen.size).toBe(200);
  });
});

describe("buildSlug", () => {
  it("joins the name and the random part with a dash", () => {
    expect(buildSlug("Haze Main", "ab12cd34")).toBe("hazemain-ab12cd34");
  });

  it("is the random part alone when the name has nothing usable", () => {
    expect(buildSlug("ミク", "ab12cd34")).toBe("ab12cd34");
    expect(buildSlug(null, "ab12cd34")).toBe("ab12cd34");
  });
});
