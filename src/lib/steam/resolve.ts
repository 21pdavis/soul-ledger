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
    body = await res.text();
    if (!res.ok) {
      warn(parsed.vanity, `HTTP ${res.status}`, body);
      return { ok: false, reason: "unavailable" };
    }
  } catch (err) {
    warn(parsed.vanity, err instanceof Error ? err.message : String(err));
    return { ok: false, reason: "unavailable" };
  }

  const match = STEAM_ID_64_TAG.exec(body);
  if (match) return { ok: true, accountId: steamId64ToAccountId(match[1]) };
  if (body.includes("<error>")) return { ok: false, reason: "not_found" };
  warn(parsed.vanity, "no steamID64 in response", body);
  return { ok: false, reason: "unavailable" };
}

/** Steam can block or challenge server IPs; log enough to tell which. */
function warn(vanity: string, problem: string, body?: string): void {
  console.warn(
    `steam vanity resolve failed for ${JSON.stringify(vanity)}: ${problem}` +
      (body === undefined ? "" : ` body=${JSON.stringify(body.slice(0, 300))}`),
  );
}
