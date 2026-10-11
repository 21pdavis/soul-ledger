import { parseSteamInput } from "@/lib/steam/parse";

export type ProfileInputResult = { ok: true; value: string } | { ok: false };

/**
 * Checks a pasted profile link in the browser, with the same parser the server uses, so the
 * entry screen can say "that doesn't look right" before any request is made.
 */
export function validateProfileInput(raw: string): ProfileInputResult {
  const value = raw.trim();
  return parseSteamInput(value).kind === "invalid" ? { ok: false } : { ok: true, value };
}
