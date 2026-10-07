import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Stand-in for Auth.js's middleware wrapper: attaches whatever session the test sets.
let session: { user?: { email?: string } } | null = null;
let authLoaded = false;
vi.mock("@/auth", () => {
  authLoaded = true;
  return {
    auth:
      (handler: (req: NextRequest & { auth: typeof session }) => Response) => (req: NextRequest) =>
        handler(Object.assign(req, { auth: session })),
  };
});

const { proxy } = await import("@/proxy");

const TOKEN = "t".repeat(40);
const run = (path: string, headers: Record<string, string> = {}) =>
  proxy(new NextRequest(`https://staging.example.com${path}`, { headers }), {} as never);

beforeEach(() => {
  session = null;
  authLoaded = false;
});
afterEach(() => vi.unstubAllEnvs());

describe("proxy in production (gate off)", () => {
  it("passes requests through without loading Auth.js", async () => {
    vi.stubEnv("STAGING_GATE", "");
    const res = await run("/api/lookup?q=1");
    expect(res.headers.get("x-middleware-next")).toBe("1");
    expect(res.headers.get("x-robots-tag")).toBeNull();
    expect(authLoaded).toBe(false);
  });

  it("404s the sign-in routes", async () => {
    vi.stubEnv("STAGING_GATE", "");
    expect((await run("/api/auth/signin")).status).toBe(404);
  });
});

describe("proxy on staging (gate on)", () => {
  beforeEach(() => {
    vi.stubEnv("STAGING_GATE", "on");
    vi.stubEnv("STAGING_ALLOWED_EMAILS", "owner@example.com");
    vi.stubEnv("STAGING_BYPASS_TOKEN", TOKEN);
  });

  it("redirects a signed-out visitor to Google sign-in, returning them afterwards", async () => {
    const res = await run("/some/page?x=1");
    expect(res.status).toBe(307);
    const location = new URL(res.headers.get("location")!);
    expect(location.pathname).toBe("/api/auth/signin");
    expect(location.searchParams.get("callbackUrl")).toBe(
      "https://staging.example.com/some/page?x=1",
    );
  });

  it("returns 401 JSON for a signed-out API call", async () => {
    const res = await run("/api/lookup?q=1");
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "unauthorized" });
  });

  it("lets the allowlisted owner in, marked noindex", async () => {
    session = { user: { email: "owner@example.com" } };
    const res = await run("/");
    expect(res.headers.get("x-middleware-next")).toBe("1");
    expect(res.headers.get("x-robots-tag")).toBe("noindex, nofollow");
  });

  it("lets automation in with the bypass token", async () => {
    const res = await run("/api/lookup?q=1", { "x-staging-token": TOKEN });
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("keeps the health check open for Render", async () => {
    expect((await run("/api/health")).headers.get("x-middleware-next")).toBe("1");
  });

  it("marks even the refusals noindex", async () => {
    expect((await run("/api/lookup")).headers.get("x-robots-tag")).toBe("noindex, nofollow");
  });
});
