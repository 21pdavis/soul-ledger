/** What a pasted Steam identifier turned out to be. */
export type SteamInput =
  { kind: "account"; accountId: number } | { kind: "vanity"; vanity: string } | { kind: "invalid" };

const STEAM_ID_64_BASE = BigInt("76561197960265728");
const MAX_ACCOUNT_ID = 2 ** 32 - 1;

const VANITY = /^[A-Za-z0-9_-]{2,32}$/;
const PROFILE_URL = /^(?:https?:\/\/)?(?:www\.)?steamcommunity\.com\/(id|profiles)\/([^/?#]+)/i;
const STEAM_ID_3 = /^\[?U:1:(\d+)\]?$/i;
const STEAM_ID_2 = /^STEAM_[01]:([01]):(\d+)$/i;

/** Converts a SteamID64 to the 32-bit account id (SteamID3) that deadlock-api uses. */
export function steamId64ToAccountId(steamId64: string): number {
  return Number(BigInt(steamId64) - STEAM_ID_64_BASE);
}

/**
 * Parses a Steam profile URL, SteamID64, SteamID3, SteamID2, account id or vanity name.
 * Vanity names still need resolving to an account id (see resolve.ts).
 */
export function parseSteamInput(raw: string): SteamInput {
  const input = raw.trim();
  if (!input) return { kind: "invalid" };

  const url = PROFILE_URL.exec(input);
  if (url) {
    const [, type, value] = url;
    return type.toLowerCase() === "id" ? vanityOrInvalid(value) : numericId(value);
  }
  if (/^https?:\/\//i.test(input) || input.includes("/")) return { kind: "invalid" };

  const id3 = STEAM_ID_3.exec(input);
  if (id3) return accountOrInvalid(Number(id3[1]));

  const id2 = STEAM_ID_2.exec(input);
  if (id2) return accountOrInvalid(Number(id2[2]) * 2 + Number(id2[1]));

  if (/^\d+$/.test(input)) return numericId(input);
  return vanityOrInvalid(input);
}

function numericId(value: string): SteamInput {
  if (!/^\d+$/.test(value)) return { kind: "invalid" };
  const n = BigInt(value);
  if (n > STEAM_ID_64_BASE) return accountOrInvalid(steamId64ToAccountId(value));
  return accountOrInvalid(Number(n));
}

function accountOrInvalid(accountId: number): SteamInput {
  return Number.isSafeInteger(accountId) && accountId > 0 && accountId <= MAX_ACCOUNT_ID
    ? { kind: "account", accountId }
    : { kind: "invalid" };
}

function vanityOrInvalid(vanity: string): SteamInput {
  return VANITY.test(vanity) ? { kind: "vanity", vanity } : { kind: "invalid" };
}
