import { describe, expect, it } from "vitest";
import {
  gateDecision,
  isAllowedEmail,
  readGateConfig,
  tokensMatch,
  type GateConfig,
} from "@/lib/staging-gate";

const config: GateConfig = {
  enabled: true,
  allowedEmails: ["owner@example.com"],
  bypassToken: "s3cret-token-of-decent-length",
};

const decide = (overrides: Partial<Parameters<typeof gateDecision>[0]>) =>
  gateDecision({ config, pathname: "/", token: null, sessionEmail: null, ...overrides });

describe("readGateConfig", () => {
  it("is off unless STAGING_GATE is 'on'", () => {
    expect(readGateConfig({}).enabled).toBe(false);
    expect(readGateConfig({ STAGING_GATE: "off" }).enabled).toBe(false);
    expect(readGateConfig({ STAGING_GATE: "on" }).enabled).toBe(true);
  });

  it("parses a comma-separated, case-insensitive allowlist", () => {
    expect(
      readGateConfig({ STAGING_GATE: "on", STAGING_ALLOWED_EMAILS: " A@x.com, b@Y.com ,," })
        .allowedEmails,
    ).toEqual(["a@x.com", "b@y.com"]);
  });

  it("ignores a bypass token too short to be safe", () => {
    expect(readGateConfig({ STAGING_GATE: "on", STAGING_BYPASS_TOKEN: "short" }).bypassToken).toBe(
      null,
    );
    expect(
      readGateConfig({ STAGING_GATE: "on", STAGING_BYPASS_TOKEN: "x".repeat(32) }).bypassToken,
    ).toBe("x".repeat(32));
  });
});

describe("gateDecision", () => {
  it("lets everything through when the gate is off (production)", () => {
    expect(decide({ config: { ...config, enabled: false } })).toBe("allow");
  });

  it("hides the sign-in routes entirely when the gate is off", () => {
    expect(decide({ config: { ...config, enabled: false }, pathname: "/api/auth/signin" })).toBe(
      "not_found",
    );
  });

  it("always allows the sign-in flow and Render's health check", () => {
    expect(decide({ pathname: "/api/auth/signin" })).toBe("allow");
    expect(decide({ pathname: "/api/auth/callback/google" })).toBe("allow");
    expect(decide({ pathname: "/api/health" })).toBe("allow");
  });

  it("does not treat look-alike paths as the auth or health routes", () => {
    expect(decide({ pathname: "/api/authx" })).toBe("unauthorized");
    expect(decide({ pathname: "/api/health-check" })).toBe("unauthorized");
  });

  it("allows a signed-in allowlisted user", () => {
    expect(decide({ sessionEmail: "Owner@Example.com" })).toBe("allow");
  });

  it("sends anyone else to sign in, or 401s them on the API", () => {
    expect(decide({})).toBe("sign_in");
    expect(decide({ sessionEmail: "stranger@example.com" })).toBe("sign_in");
    expect(decide({ pathname: "/api/lookup" })).toBe("unauthorized");
  });

  it("lets automation in with the exact bypass token", () => {
    expect(decide({ token: config.bypassToken, pathname: "/api/lookup" })).toBe("allow");
    expect(decide({ token: config.bypassToken + "x", pathname: "/api/lookup" })).toBe(
      "unauthorized",
    );
    expect(decide({ token: "", pathname: "/" })).toBe("sign_in");
  });

  it("never accepts a token when none is configured", () => {
    expect(decide({ config: { ...config, bypassToken: null }, token: "" })).toBe("sign_in");
  });
});

describe("isAllowedEmail", () => {
  it("requires a verified email on the list", () => {
    expect(isAllowedEmail("owner@example.com", true, config.allowedEmails)).toBe(true);
    expect(isAllowedEmail("OWNER@example.com", true, config.allowedEmails)).toBe(true);
    expect(isAllowedEmail("owner@example.com", false, config.allowedEmails)).toBe(false);
    expect(isAllowedEmail("other@example.com", true, config.allowedEmails)).toBe(false);
    expect(isAllowedEmail(undefined, true, config.allowedEmails)).toBe(false);
  });
});

describe("tokensMatch", () => {
  it("compares in constant time and handles different lengths", () => {
    expect(tokensMatch("abc", "abc")).toBe(true);
    expect(tokensMatch("abc", "abd")).toBe(false);
    expect(tokensMatch("abc", "abcd")).toBe(false);
  });
});
