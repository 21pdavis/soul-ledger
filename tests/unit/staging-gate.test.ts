import { describe, expect, it } from "vitest";
import {
  gateDecision,
  hasValidStagingToken,
  readGateConfig,
  signSession,
  tokensMatch,
  verifySession,
  type GateConfig,
} from "@/lib/staging-gate";

const KEY = "k".repeat(40);
const NOW = Date.UTC(2026, 9, 7);
const DAY = 24 * 60 * 60 * 1000;
const config: GateConfig = { enabled: true, accessKey: KEY };

const decide = (overrides: Partial<Parameters<typeof gateDecision>[0]>) =>
  gateDecision({
    config,
    pathname: "/",
    headerToken: null,
    queryKey: null,
    cookie: null,
    now: NOW,
    ...overrides,
  });

describe("readGateConfig", () => {
  it("is off unless STAGING_GATE is 'on'", () => {
    expect(readGateConfig({}).enabled).toBe(false);
    expect(readGateConfig({ STAGING_GATE: "off" }).enabled).toBe(false);
    expect(readGateConfig({ STAGING_GATE: "on" }).enabled).toBe(true);
  });

  it("rejects an access key too short to be safe", () => {
    expect(readGateConfig({ STAGING_GATE: "on", STAGING_ACCESS_KEY: "short" }).accessKey).toBe(
      null,
    );
    expect(readGateConfig({ STAGING_GATE: "on", STAGING_ACCESS_KEY: KEY }).accessKey).toBe(KEY);
  });
});

describe("session cookies", () => {
  it("verifies a cookie it signed until it expires", () => {
    const cookie = signSession(KEY, NOW + 90 * DAY);
    expect(verifySession(KEY, cookie, NOW)).toBe(true);
    expect(verifySession(KEY, cookie, NOW + 89 * DAY)).toBe(true);
    expect(verifySession(KEY, cookie, NOW + 91 * DAY)).toBe(false);
  });

  it("rejects a cookie signed with another key (key rotation logs everyone out)", () => {
    expect(verifySession(KEY, signSession("x".repeat(40), NOW + DAY), NOW)).toBe(false);
  });

  it("rejects a tampered expiry or garbage", () => {
    const [, sig] = signSession(KEY, NOW + DAY).split(".");
    expect(verifySession(KEY, `${NOW + 999 * DAY}.${sig}`, NOW)).toBe(false);
    for (const junk of ["", ".", "abc", "123.", ".abc", "1.2.3"]) {
      expect(verifySession(KEY, junk, NOW)).toBe(false);
    }
  });
});

describe("gateDecision", () => {
  it("lets everything through when the gate is off (production)", () => {
    expect(decide({ config: { enabled: false, accessKey: null } })).toBe("allow");
  });

  it("locks everyone out if the gate is on but no usable key is set", () => {
    const broken = { enabled: true, accessKey: null };
    expect(decide({ config: broken, queryKey: "anything" })).toBe("deny_page");
    expect(decide({ config: broken, pathname: "/api/lookup", headerToken: "" })).toBe("deny_api");
  });

  it("keeps Render's health check open", () => {
    expect(decide({ pathname: "/api/health" })).toBe("allow");
    expect(decide({ pathname: "/api/health-check" })).toBe("deny_api");
  });

  it("logs in with the key in the link", () => {
    expect(decide({ queryKey: KEY })).toBe("login");
    expect(decide({ queryKey: KEY + "x" })).toBe("deny_page");
  });

  it("allows a valid session cookie", () => {
    expect(decide({ cookie: signSession(KEY, NOW + DAY) })).toBe("allow");
    expect(decide({ cookie: signSession(KEY, NOW - 1) })).toBe("deny_page");
  });

  it("lets automation in with the header token", () => {
    expect(decide({ pathname: "/api/lookup", headerToken: KEY })).toBe("allow");
    expect(decide({ pathname: "/api/lookup", headerToken: KEY + "x" })).toBe("deny_api");
  });

  it("refuses everyone else: a page for browsers, JSON for the API", () => {
    expect(decide({})).toBe("deny_page");
    expect(decide({ pathname: "/api/lookup" })).toBe("deny_api");
    expect(decide({ pathname: "/api" })).toBe("deny_api");
  });
});

describe("tokensMatch", () => {
  it("compares in constant time and handles different lengths", () => {
    expect(tokensMatch("abc", "abc")).toBe(true);
    expect(tokensMatch("abc", "abd")).toBe(false);
    expect(tokensMatch("abc", "abcd")).toBe(false);
  });
});

describe("hasValidStagingToken", () => {
  const on = { STAGING_GATE: "on", STAGING_ACCESS_KEY: KEY };
  const req = (token?: string) =>
    new Request("http://x/api/lookup", { headers: token ? { "x-staging-token": token } : {} });

  it("is true only when the gate is on and the header carries the access key", () => {
    expect(hasValidStagingToken(req(KEY), on)).toBe(true);
    expect(hasValidStagingToken(req(KEY + "x"), on)).toBe(false);
    expect(hasValidStagingToken(req(), on)).toBe(false);
  });

  it("is false in production, where the gate is off, whatever the header says", () => {
    expect(hasValidStagingToken(req(KEY), { STAGING_ACCESS_KEY: KEY })).toBe(false);
    expect(hasValidStagingToken(req(KEY), { STAGING_GATE: "on" })).toBe(false);
  });
});
