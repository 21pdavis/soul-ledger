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

let snapshot: { raw: string | null; prefs: Prefs } | undefined;

/**
 * For `useSyncExternalStore`: the stored prefs, with a stable identity while the stored text is
 * unchanged. (The server renders with `null`, then the browser swaps the real values in.)
 */
export function readPrefsSnapshot(): Prefs {
  let raw: string | null = null;
  try {
    raw = browserStorage()?.getItem(PREFS_KEY) ?? null;
  } catch {
    raw = null;
  }
  if (!snapshot || snapshot.raw !== raw) {
    snapshot = { raw, prefs: loadPrefs({ getItem: () => raw }) };
  }
  return snapshot.prefs;
}

export function savePrefs(prefs: Prefs, storage: WritableStorage | undefined = browserStorage()) {
  try {
    storage?.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // The app works without remembering anything.
  }
}
