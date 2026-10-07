import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { proxy } from "@/proxy";
import { SESSION_COOKIE, signSession } from "@/lib/staging-gate";

const KEY = "k".repeat(40);
const ORIGIN = "https://staging.example.com";

const run = (path: string, headers: Record<string, string> = {}) =>
  proxy(new NextRequest(`${ORIGIN}${path}`, { headers }));

afterEach(() => vi.unstubAllEnvs());

describe("proxy in production (gate off)", () => {
  it("passes requests through untouched", async () => {
    vi.stubEnv("STAGING_GATE", "");
    const res = await run("/api/lookup?q=1&key=" + KEY);
    expect(res.headers.get("x-middleware-next")).toBe("1");
    expect(res.headers.get("x-robots-tag")).toBeNull();
    expect(res.headers.get("set-cookie")).toBeNull();
  });
});

describe("proxy on staging (gate on)", () => {
  beforeEach(() => {
    vi.stubEnv("STAGING_GATE", "on");
    vi.stubEnv("STAGING_ACCESS_KEY", KEY);
  });

  it("shows signed-out visitors a private page, not the app", async () => {
    const res = await run("/");
    expect(res.status).toBe(401);
    expect(res.headers.get("content-type")).toContain("text/html");
    expect(await res.text()).toContain("private");
  });

  it("returns 401 JSON for signed-out API calls", async () => {
    const res = await run("/api/lookup?q=1");
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "unauthorized" });
  });

  it("logs in from the secret link: sets a 90-day cookie and strips the key from the URL", async () => {
    const res = await run(`/some/page?x=1&key=${KEY}`);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(`${ORIGIN}/some/page?x=1`);
    const cookie = res.headers.get("set-cookie")!;
    expect(cookie).toContain(`${SESSION_COOKIE}=`);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/Secure/i);
    expect(cookie).toMatch(/SameSite=lax/i);
    expect(cookie).toMatch(/Max-Age=7776000/);
    expect(cookie).not.toContain(KEY);
  });

  it("lets a valid session cookie in, marked noindex", async () => {
    const session = signSession(KEY, Date.now() + 60_000);
    const res = await run("/", { cookie: `${SESSION_COOKIE}=${session}` });
    expect(res.headers.get("x-middleware-next")).toBe("1");
    expect(res.headers.get("x-robots-tag")).toBe("noindex, nofollow");
  });

  it("lets automation in with the header token", async () => {
    const res = await run("/api/lookup?q=1", { "x-staging-token": KEY });
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("keeps the health check open and marks refusals noindex", async () => {
    expect((await run("/api/health")).headers.get("x-middleware-next")).toBe("1");
    expect((await run("/api/lookup")).headers.get("x-robots-tag")).toBe("noindex, nofollow");
  });
});
