import { afterEach, describe, expect, it, vi } from "vitest";
import {
  bestPercentile,
  formatHours,
  formatPatchDate,
  formatPercent,
  formatTopPercent,
} from "@/story/format";

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

describe("formatTopPercent", () => {
  it("keeps one decimal under 10 (dropping a trailing .0) and rounds from 10 up", () => {
    expect(formatTopPercent(0.5)).toBe("0.5");
    expect(formatTopPercent(3.4)).toBe("3.4");
    expect(formatTopPercent(3)).toBe("3");
    expect(formatTopPercent(9.96)).toBe("10");
    expect(formatTopPercent(12.4)).toBe("12");
    expect(formatTopPercent(3.04)).toBe("3");
    expect(formatTopPercent(3.46)).toBe("3.5");
    expect(formatTopPercent(49.6)).toBe("50");
  });
});

describe("bestPercentile", () => {
  const entry = (label: string, topPercent: number) => ({ label, topPercent });

  it("picks the lowest topPercent, the first on a tie", () => {
    const a = entry("A", 20);
    const b = entry("B", 5);
    const c = entry("C", 5);
    expect(bestPercentile([a, b, c])).toBe(b);
  });

  it("is null for an empty list", () => {
    expect(bestPercentile([])).toBeNull();
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
