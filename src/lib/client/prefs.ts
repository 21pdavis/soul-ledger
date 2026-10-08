import { DEFAULT_FILTERS, parseFilters, type LookupFilters } from "@/story/filters";

/** What we remember between visits: the last pasted URL and the chosen filters. */
export interface Prefs {
  url: string;
  filters: LookupFilters;
}

export const PREFS_KEY = "soul-ledger:prefs";

type ReadableStorage = Pick<Storage, "getItem">;
type WritableStorage = Pick<Storage, "setItem">;

/** Storage can be missing or throw (private mode, blocked cookies), so every access is guarded. */
function browserStorage(): Storage | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

export function defaultPrefs(): Prefs {
  return { url: "", filters: { ...DEFAULT_FILTERS } };
}

export function loadPrefs(storage: ReadableStorage | undefined = browserStorage()): Prefs {
  try {
    const raw = storage?.getItem(PREFS_KEY);
    if (!raw) return defaultPrefs();
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== "object") return defaultPrefs();
    const { url, filters } = data as Record<string, unknown>;
    return { url: typeof url === "string" ? url : "", filters: parseFilters(filters) };
  } catch {
    return defaultPrefs();
  }
}

export function savePrefs(prefs: Prefs, storage: WritableStorage | undefined = browserStorage()) {
  try {
    storage?.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // The app works without remembering anything.
  }
}
