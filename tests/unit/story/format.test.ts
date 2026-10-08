import { afterEach, describe, expect, it, vi } from "vitest";
import { formatHours, formatPatchDate, formatPercent } from "@/story/format";

describe("formatHours", () => {
  it("shows one decimal under 10 hours and whole hours from 10", () => {
    expect(formatHours(0.2)).toBe("0.2");
    expect(formatHours(9.96)).toBe("10");
    expect(formatHours(120.4)).toBe("120");
  });

  it("never reads 0 for a player who played at all", () => {
    expect(formatHours(0.01)).toBe("0.1");
  });
});

describe("formatPercent", () => {
  it("rounds a 0..1 rate to a whole percent", () => {
    expect(formatPercent(0.5234)).toBe("52%");
    expect(formatPercent(0)).toBe("0%");
  });
});

describe("formatPatchDate", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("formats in UTC so the date is the same everywhere", () => {
    vi.stubEnv("TZ", "America/Los_Angeles");
    expect(formatPatchDate("2026-09-30T00:00:00.000Z")).toBe("Sep 30, 2026");
  });
});
