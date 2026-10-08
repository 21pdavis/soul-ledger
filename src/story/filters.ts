import type { StoryWindow } from "@/lib/lookup";

/**
 * Everything the player can narrow a lookup by (ADR 0052). Today that is only the time window.
 * A new filter is a new field here plus a new entry in `FILTER_FIELDS`; the controls, the saved
 * preferences and the lookup URL all follow from those two.
 */
export interface LookupFilters {
  window: StoryWindow;
}

export const DEFAULT_FILTERS: LookupFilters = { window: "all" };

export interface FilterOption<V extends string> {
  value: V;
  label: string;
}

/** Describes one filter as a labelled choice, so one generic control can render any of them. */
export interface FilterField<K extends keyof LookupFilters = keyof LookupFilters> {
  key: K;
  label: string;
  options: FilterOption<LookupFilters[K]>[];
}

export const FILTER_FIELDS: FilterField[] = [
  {
    key: "window",
    label: "Which matches?",
    options: [
      { value: "all", label: "All time" },
      { value: "patch", label: "This patch" },
    ],
  },
];

/** The filter part of the `/api/lookup` query string. */
export function filtersToQuery(filters: LookupFilters): Record<string, string> {
  return { window: filters.window };
}

/** Reads filters back from storage; anything unusable falls back to the default. */
export function parseFilters(raw: unknown): LookupFilters {
  const value = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const result = { ...DEFAULT_FILTERS };
  for (const field of FILTER_FIELDS) {
    const option = field.options.find((o) => o.value === value[field.key]);
    if (option) (result as Record<string, string>)[field.key] = option.value;
  }
  return result;
}
