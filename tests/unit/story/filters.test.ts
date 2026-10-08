import { describe, expect, it } from "vitest";
import {
  DEFAULT_FILTERS,
  FILTER_FIELDS,
  filtersToQuery,
  parseFilters,
  type LookupFilters,
} from "@/story/filters";

describe("filters", () => {
  it("defaults to all time", () => {
    expect(DEFAULT_FILTERS).toEqual({ window: "all" });
  });

  it("maps the filter object to the lookup query as window=all|patch", () => {
    expect(filtersToQuery({ window: "all" })).toEqual({ window: "all" });
    expect(filtersToQuery({ window: "patch" })).toEqual({ window: "patch" });
  });

  it("describes every filter field with its options, so a new filter is data, not a new component", () => {
    const keys = FILTER_FIELDS.map((f) => f.key);
    // Every field of the filter object has a descriptor, and the other way round.
    expect(keys.sort()).toEqual(Object.keys(DEFAULT_FILTERS).sort());
    const window = FILTER_FIELDS.find((f) => f.key === "window")!;
    expect(window.options).toEqual([
      { value: "all", label: "All time" },
      { value: "patch", label: "This patch" },
    ]);
    // The default is always one of the field's options.
    for (const field of FILTER_FIELDS) {
      const values: string[] = field.options.map((o) => o.value);
      expect(values).toContain(DEFAULT_FILTERS[field.key]);
    }
  });

  it("restores saved filters and falls back to the default for anything unusable", () => {
    const patch: LookupFilters = { window: "patch" };
    expect(parseFilters(patch)).toEqual(patch);
    expect(parseFilters({ window: "forever" })).toEqual(DEFAULT_FILTERS);
    expect(parseFilters({})).toEqual(DEFAULT_FILTERS);
    expect(parseFilters(null)).toEqual(DEFAULT_FILTERS);
    expect(parseFilters("patch")).toEqual(DEFAULT_FILTERS);
  });
});
