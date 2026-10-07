import { parseSteamInput, steamId64ToAccountId } from "./parse";

export type ResolveResult =
  { ok: true; accountId: number } | { ok: false; reason: "invalid" | "not_found" | "unavailable" };

interface ResolveDeps {
  fetch?: typeof fetch;
  /**
   * Steam Web API key. When set, vanity names go through the official ResolveVanityURL API,
   * which works from server IPs. Without it we fall back to the public profile XML, which
   * Steam may block from data centres (local development still works).
   */
  steamApiKey?: string;
}

const STEAM_ID_64 = /^\d{17}$/;
const STEAM_ID_64_TAG = /<steamID64>(\d{17})<\/steamID64>/;
/** ResolveVanityURL's `success` value for "no profile with that vanity name". */
const NO_MATCH = 42;

type Outcome = ResolveResult | { ok: true; steamId64: string };

/** Turns whatever the player pasted into a deadlock-api account id. */
export async function resolveSteamInput(
  raw: string,
  { fetch: fetchImpl = fetch, steamApiKey }: ResolveDeps = {},
): Promise<ResolveResult> {
  const parsed = parseSteamInput(raw);
  if (parsed.kind === "invalid") return { ok: false, reason: "invalid" };
  if (parsed.kind === "account") return { ok: true, accountId: parsed.accountId };

  const outcome = steamApiKey
    ? await viaWebApi(parsed.vanity, steamApiKey, fetchImpl)
    : await viaProfileXml(parsed.vanity, fetchImpl);
  if (outcome.ok && "steamId64" in outcome) {
    return { ok: true, accountId: steamId64ToAccountId(outcome.steamId64) };
  }
  return outcome;
}

async function viaWebApi(vanity: string, key: string, fetchImpl: typeof fetch): Promise<Outcome> {
  const url = new URL("https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/");
  url.searchParams.set("key", key);
  url.searchParams.set("vanityurl", vanity);

  const body = await fetchText(vanity, url, fetchImpl);
  if (body === null) return { ok: false, reason: "unavailable" };

  let response: { steamid?: unknown; success?: unknown } | undefined;
  try {
    response = (JSON.parse(body) as { response?: typeof response }).response;
  } catch {
    // Handled below as an unexpected response.
  }
  if (response?.success === 1 && typeof response.steamid === "string") {
    if (STEAM_ID_64.test(response.steamid)) return { ok: true, steamId64: response.steamid };
  }
  if (response?.success === NO_MATCH) return { ok: false, reason: "not_found" };
  warn(vanity, "unexpected ResolveVanityURL response", body);
  return { ok: false, reason: "unavailable" };
}

async function viaProfileXml(vanity: string, fetchImpl: typeof fetch): Promise<Outcome> {
  const body = await fetchText(
    vanity,
    new URL(`https://steamcommunity.com/id/${encodeURIComponent(vanity)}/?xml=1`),
    fetchImpl,
  );
  if (body === null) return { ok: false, reason: "unavailable" };

  const match = STEAM_ID_64_TAG.exec(body);
  if (match) return { ok: true, steamId64: match[1] };
  if (body.includes("<error>")) return { ok: false, reason: "not_found" };
  warn(vanity, "no steamID64 in response", body);
  return { ok: false, reason: "unavailable" };
}

/** The response body, or null (after logging why) on a network error or non-2xx status. */
async function fetchText(
  vanity: string,
  url: URL,
  fetchImpl: typeof fetch,
): Promise<string | null> {
  try {
    const res = await fetchImpl(url, { signal: AbortSignal.timeout(10_000) });
    const body = await res.text();
    if (res.ok) return body;
    warn(vanity, `HTTP ${res.status}`, body);
  } catch (err) {
    warn(vanity, err instanceof Error ? err.message : String(err));
  }
  return null;
}

/** Steam can block or challenge server IPs; log enough to tell which. Never logs the URL (it holds the key). */
function warn(vanity: string, problem: string, body?: string): void {
  console.warn(
    `steam vanity resolve failed for ${JSON.stringify(vanity)}: ${problem}` +
      (body === undefined ? "" : ` body=${JSON.stringify(body.slice(0, 300))}`),
  );
}
