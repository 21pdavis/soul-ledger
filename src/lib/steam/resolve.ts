import { parseSteamInput, steamId64ToAccountId } from "./parse";

export type ResolveResult =
  { ok: true; accountId: number } | { ok: false; reason: "invalid" | "not_found" | "unavailable" };

interface ResolveDeps {
  fetch?: typeof fetch;
}

const STEAM_ID_64_TAG = /<steamID64>(\d{17})<\/steamID64>/;

/**
 * Turns whatever the player pasted into a deadlock-api account id.
 * Vanity names are resolved through Steam's public profile XML, which needs no API key.
 */
export async function resolveSteamInput(
  raw: string,
  { fetch: fetchImpl = fetch }: ResolveDeps = {},
): Promise<ResolveResult> {
  const parsed = parseSteamInput(raw);
  if (parsed.kind === "invalid") return { ok: false, reason: "invalid" };
  if (parsed.kind === "account") return { ok: true, accountId: parsed.accountId };

  let body: string;
  try {
    const res = await fetchImpl(
      `https://steamcommunity.com/id/${encodeURIComponent(parsed.vanity)}/?xml=1`,
      { signal: AbortSignal.timeout(10_000) },
    );
    if (!res.ok) return { ok: false, reason: "unavailable" };
    body = await res.text();
  } catch {
    return { ok: false, reason: "unavailable" };
  }

  const match = STEAM_ID_64_TAG.exec(body);
  if (match) return { ok: true, accountId: steamId64ToAccountId(match[1]) };
  return body.includes("<error>")
    ? { ok: false, reason: "not_found" }
    : { ok: false, reason: "unavailable" };
}
