import { timingSafeEqual } from "node:crypto";

/**
 * The staging gate (ADR 0042): when on, every route needs either a Google sign-in from an
 * allowlisted email or the automation bypass token. Off in production, which stays public.
 */
export interface GateConfig {
  enabled: boolean;
  /** Lower-cased emails allowed to sign in. */
  allowedEmails: string[];
  /** Shared secret for automated tests and agents; null disables the bypass. */
  bypassToken: string | null;
}

export type GateDecision = "allow" | "sign_in" | "unauthorized" | "not_found";

/** Request header carrying the bypass token. */
export const BYPASS_HEADER = "x-staging-token";

const MIN_TOKEN_LENGTH = 32;

export function readGateConfig(env: Record<string, string | undefined>): GateConfig {
  const token = env.STAGING_BYPASS_TOKEN ?? "";
  return {
    enabled: env.STAGING_GATE === "on",
    allowedEmails: (env.STAGING_ALLOWED_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
    bypassToken: token.length >= MIN_TOKEN_LENGTH ? token : null,
  };
}

const isUnder = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(prefix + "/");

export function gateDecision(input: {
  config: GateConfig;
  pathname: string;
  token: string | null;
  sessionEmail: string | null;
}): GateDecision {
  const { config, pathname, token, sessionEmail } = input;

  if (!config.enabled) return isUnder(pathname, "/api/auth") ? "not_found" : "allow";

  if (isUnder(pathname, "/api/auth") || pathname === "/api/health") return "allow";
  if (config.bypassToken && token && tokensMatch(token, config.bypassToken)) return "allow";
  if (sessionEmail && config.allowedEmails.includes(sessionEmail.toLowerCase())) return "allow";

  return isUnder(pathname, "/api") ? "unauthorized" : "sign_in";
}

/** Only verified, allowlisted emails may create a session. */
export function isAllowedEmail(
  email: string | null | undefined,
  verified: boolean | null | undefined,
  allowedEmails: string[],
): boolean {
  return !!email && verified === true && allowedEmails.includes(email.toLowerCase());
}

export function tokensMatch(given: string, expected: string): boolean {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
