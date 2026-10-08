import { describe, expect, it } from "vitest";
import { isPreviewEnabled } from "@/lib/story-preview";

describe("isPreviewEnabled (the temporary /preview fixture route)", () => {
  it("is on in development and test", () => {
    expect(isPreviewEnabled({ NODE_ENV: "development" })).toBe(true);
    expect(isPreviewEnabled({ NODE_ENV: "test" })).toBe(true);
  });

  it("is off in production by default, so it never ships open", () => {
    expect(isPreviewEnabled({ NODE_ENV: "production" })).toBe(false);
    expect(isPreviewEnabled({ NODE_ENV: "production", STORY_PREVIEW: "" })).toBe(false);
    expect(isPreviewEnabled({ NODE_ENV: "production", STORY_PREVIEW: "true" })).toBe(false);
  });

  it("is on in production only with the explicit STORY_PREVIEW=1 switch (used by e2e)", () => {
    expect(isPreviewEnabled({ NODE_ENV: "production", STORY_PREVIEW: "1" })).toBe(true);
  });
});
