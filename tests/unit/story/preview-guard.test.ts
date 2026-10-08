import { describe, expect, it } from "vitest";
import { isPreviewEnabled } from "@/lib/story-preview";

describe("isPreviewEnabled (the temporary /preview fixture route, #29)", () => {
  it("is on in development", () => {
    expect(isPreviewEnabled({ NODE_ENV: "development" })).toBe(true);
  });

  it("fails closed: off in production, test, or when NODE_ENV is missing or unknown", () => {
    expect(isPreviewEnabled({ NODE_ENV: "production" })).toBe(false);
    expect(isPreviewEnabled({ NODE_ENV: "production", STORY_PREVIEW: "" })).toBe(false);
    expect(isPreviewEnabled({ NODE_ENV: "production", STORY_PREVIEW: "true" })).toBe(false);
    expect(isPreviewEnabled({ NODE_ENV: "test" })).toBe(false);
    expect(isPreviewEnabled({ NODE_ENV: "staging" })).toBe(false);
    expect(isPreviewEnabled({})).toBe(false);
  });

  it("is on in any environment only with the explicit STORY_PREVIEW=1 switch (used by e2e)", () => {
    expect(isPreviewEnabled({ NODE_ENV: "production", STORY_PREVIEW: "1" })).toBe(true);
    expect(isPreviewEnabled({ STORY_PREVIEW: "1" })).toBe(true);
  });
});
