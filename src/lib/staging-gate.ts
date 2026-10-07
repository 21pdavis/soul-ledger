import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * The staging gate (ADR 0043). When on, every route needs a session cookie (set by opening any
 * URL once with `?key=<STAGING_ACCESS_KEY>`) or the same key in the `x-staging-token` header.
 * Off in production, which stays public.
 */
export interface GateConfig {
  enabled: boolean;
  /** Null when unset or too short; the gate then refuses everyone (fails closed). */
  accessKey: string | null;
}

export type GateDecision = "allow" | "login" | "deny_page" | "deny_api";

export const ACCESS_HEADER = "x-staging-token";
export const KEY_PARAM = "key";
export const SESSION_COOKIE = "staging_session";
export const SESSION_DAYS = 90;

const MIN_KEY_LENGTH = 32;

export function readGateConfig(env: Record<string, string | undefined>): GateConfig {
  const key = env.STAGING_ACCESS_KEY ?? "";
  return {
    enabled: env.STAGING_GATE === "on",
    accessKey: key.length >= MIN_KEY_LENGTH ? key : null,
  };
}

export function gateDecision(input: {
  config: GateConfig;
  pathname: string;
  headerToken: string | null;
  queryKey: string | null;
  cookie: string | null;
  now: number;
}): GateDecision {
  const { config, pathname, headerToken, queryKey, cookie, now } = input;
  if (!config.enabled || pathname === "/api/health") return "allow";

  const key = config.accessKey;
  if (key) {
    if (headerToken && tokensMatch(headerToken, key)) return "allow";
    if (queryKey && tokensMatch(queryKey, key)) return "login";
    if (cookie && verifySession(key, cookie, now)) return "allow";
  }
  return pathname === "/api" || pathname.startsWith("/api/") ? "deny_api" : "deny_page";
}

/** A session cookie value: `<expiry ms>.<HMAC of the expiry>`, signed with the access key. */
export function signSession(key: string, expiresAt: number): string {
  return `${expiresAt}.${hmac(key, String(expiresAt))}`;
}

export function verifySession(key: string, value: string, now: number): boolean {
  const match = /^(\d+)\.([\w-]+)$/.exec(value);
  if (!match) return false;
  const [, expiry, signature] = match;
  return tokensMatch(signature, hmac(key, expiry)) && Number(expiry) > now;
}

function hmac(key: string, data: string): string {
  return createHmac("sha256", key).update(data).digest("base64url");
}

export function tokensMatch(given: string, expected: string): boolean {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
